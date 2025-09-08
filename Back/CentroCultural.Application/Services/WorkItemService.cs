using Microsoft.EntityFrameworkCore;
using CentroCultural.Domain.Entities;
using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using CentroCultural.Infrastructure.Data;

namespace CentroCultural.Application.Services
{
    public class WorkItemService : IWorkItemService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<WorkItemService> _logger;

        public WorkItemService(ApplicationDbContext context, ILogger<WorkItemService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<WorkItemDto>> GetWorkItemsByModuleAsync(Guid moduleId)
        {
            var workItems = await _context.WorkItem
                .Where(w => w.ModuleId == moduleId && w.IsActive)
                .OrderBy(w => w.OrderNumber)
                .Select(w => new WorkItemDto
                {
                    Id = w.Id,
                    Title = w.Title,
                    Description = w.Description,
                    LongText = w.LongText,
                    OrderNumber = w.OrderNumber,
                    IsActive = w.IsActive,
                    CreatedAt = w.CreatedAt,
                    UpdatedAt = w.UpdatedAt,
                    ModuleId = w.ModuleId,
                    ImagePath = w.ImagePath,
                    VideoPath = w.VideoPath
                })
                .ToListAsync();

            return workItems;
        }

        public async Task<WorkItemDetailDto?> GetWorkItemByIdAsync(Guid id)
        {
            var workItem = await _context.WorkItem
                .Include(w => w.Module)
                    .ThenInclude(m => m.Course)
                .Where(w => w.Id == id && w.IsActive)
                .Select(w => new WorkItemDetailDto
                {
                    Id = w.Id,
                    Title = w.Title,
                    Description = w.Description,
                    LongText = w.LongText,
                    OrderNumber = w.OrderNumber,
                    IsActive = w.IsActive,
                    CreatedAt = w.CreatedAt,
                    UpdatedAt = w.UpdatedAt,
                    ModuleId = w.ModuleId,
                    ImagePath = w.ImagePath,
                    VideoPath = w.VideoPath,
                    ModuleName = w.Module.Title,
                    CourseName = w.Module.Course.Title,
                    Subject = w.Module.Course.Subject ?? ""
                })
                .FirstOrDefaultAsync();

            return workItem;
        }

        public async Task<IEnumerable<MediaFileDto>> GetWorkItemMediaAsync(Guid workItemId)
        {
            var mediaFiles = await _context.MediaEntity
                .Where(m => m.ContentType == "workitem" && m.ContentId == workItemId)
                .Select(m => new MediaFileDto
                {
                    Id = m.Id,
                    FileName = m.FileName,
                    RelativePath = m.RelativePath,
                    FileSize = m.SizeBytes,
                    MimeType = m.MimeType,
                    ContentType = m.ContentType,
                    ContentId = m.ContentId.ToString(),
                    MediaType = m.MediaType,
                    UploadedAt = m.CreatedAt,
                    UploadedBy = m.CreatedBy
                })
                .ToListAsync();

            return mediaFiles;
        }

        public async Task<WorkItemDto> CreateWorkItemAsync(CreateWorkItemDto workItemDto, string userId)
        {
            // Verificar que el módulo existe y el usuario tiene permisos
            var module = await _context.Module
                .Include(m => m.Course)
                .FirstOrDefaultAsync(m => m.Id == workItemDto.ModuleId && m.IsActive);

            if (module == null)
                throw new ArgumentException("El módulo especificado no existe o no está activo.");

            // Verificar permisos (el usuario debe ser el educador del curso)
            var user = await _context.Usuario.FirstOrDefaultAsync(u => u.IdUsuario.ToString() == userId);
            if (user == null || (module.Course.EducatorId.ToString() != userId && user.Rol.NombreRol != "Administrador"))
                throw new UnauthorizedAccessException("No tienes permisos para crear WorkItems en este módulo.");

            var workItem = new WorkItem
            {
                Id = Guid.NewGuid(),
                Title = workItemDto.Title,
                Description = workItemDto.Description,
                LongText = workItemDto.LongText,
                OrderNumber = workItemDto.OrderNumber,
                ModuleId = workItemDto.ModuleId,
                ImagePath = workItemDto.ImagePath,
                VideoPath = workItemDto.VideoPath,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.WorkItem.Add(workItem);
            await _context.SaveChangesAsync();

            return new WorkItemDto
            {
                Id = workItem.Id,
                Title = workItem.Title,
                Description = workItem.Description,
                LongText = workItem.LongText,
                OrderNumber = workItem.OrderNumber,
                IsActive = workItem.IsActive,
                CreatedAt = workItem.CreatedAt,
                UpdatedAt = workItem.UpdatedAt,
                ModuleId = workItem.ModuleId,
                ImagePath = workItem.ImagePath,
                VideoPath = workItem.VideoPath
            };
        }

        public async Task<bool> UpdateWorkItemAsync(Guid id, UpdateWorkItemDto workItemDto, string userId)
        {
            var workItem = await _context.WorkItem
                .Include(w => w.Module)
                    .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(w => w.Id == id && w.IsActive);

            if (workItem == null)
                return false;

            // Verificar permisos
            var user = await _context.Usuario.FirstOrDefaultAsync(u => u.IdUsuario.ToString() == userId);
            if (user == null || (workItem.Module.Course.EducatorId.ToString() != userId && user.Rol.NombreRol != "Administrador"))
                throw new UnauthorizedAccessException("No tienes permisos para editar este WorkItem.");

            workItem.Title = workItemDto.Title;
            workItem.Description = workItemDto.Description;
            workItem.LongText = workItemDto.LongText;
            workItem.OrderNumber = workItemDto.OrderNumber;
            workItem.ImagePath = workItemDto.ImagePath;
            workItem.VideoPath = workItemDto.VideoPath;
            workItem.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteWorkItemAsync(Guid id, string userId)
        {
            var workItem = await _context.WorkItem
                .Include(w => w.Module)
                    .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(w => w.Id == id && w.IsActive);

            if (workItem == null)
                return false;

            // Verificar permisos
            var user = await _context.Usuario.FirstOrDefaultAsync(u => u.IdUsuario.ToString() == userId);
            if (user == null || (workItem.Module.Course.EducatorId.ToString() != userId && user.Rol.NombreRol != "Administrador"))
                throw new UnauthorizedAccessException("No tienes permisos para eliminar este WorkItem.");

            // Soft delete - marcar como inactivo
            workItem.IsActive = false;
            workItem.UpdatedAt = DateTime.UtcNow;

            // También eliminar archivos multimedia contextuales asociados
            var mediaFiles = await _context.MediaEntity
                .Where(m => m.ContentType == "workitem" && m.ContentId == id)
                .ToListAsync();

            _context.MediaEntity.RemoveRange(mediaFiles);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ReorderWorkItemAsync(Guid id, int newOrderNumber, string userId)
        {
            var workItem = await _context.WorkItem
                .Include(w => w.Module)
                    .ThenInclude(m => m.Course)
                .FirstOrDefaultAsync(w => w.Id == id && w.IsActive);

            if (workItem == null)
                return false;

            // Verificar permisos
            var user = await _context.Usuario.FirstOrDefaultAsync(u => u.IdUsuario.ToString() == userId);
            if (user == null || (workItem.Module.Course.EducatorId.ToString() != userId && user.Rol.NombreRol != "Administrador"))
                throw new UnauthorizedAccessException("No tienes permisos para reordenar WorkItems en este módulo.");

            var oldOrderNumber = workItem.OrderNumber;

            // Reordenar otros WorkItems en el mismo módulo
            var otherWorkItems = await _context.WorkItem
                .Where(w => w.ModuleId == workItem.ModuleId && w.IsActive && w.Id != id)
                .ToListAsync();

            if (newOrderNumber > oldOrderNumber)
            {
                // Mover hacia abajo
                foreach (var item in otherWorkItems.Where(w => w.OrderNumber > oldOrderNumber && w.OrderNumber <= newOrderNumber))
                {
                    item.OrderNumber--;
                }
            }
            else if (newOrderNumber < oldOrderNumber)
            {
                // Mover hacia arriba
                foreach (var item in otherWorkItems.Where(w => w.OrderNumber >= newOrderNumber && w.OrderNumber < oldOrderNumber))
                {
                    item.OrderNumber++;
                }
            }

            workItem.OrderNumber = newOrderNumber;
            workItem.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<WorkItemWithModuleDto>> GetWorkItemsByCourseAsync(Guid courseId)
        {
            var workItems = await _context.WorkItem
                .Include(w => w.Module)
                    .ThenInclude(m => m.Course)
                .Where(w => w.Module.CourseId == courseId && w.IsActive && w.Module.IsActive)
                .OrderBy(w => w.Module.OrderNumber)
                .ThenBy(w => w.OrderNumber)
                .Select(w => new WorkItemWithModuleDto
                {
                    Id = w.Id,
                    Title = w.Title,
                    Description = w.Description,
                    LongText = w.LongText,
                    OrderNumber = w.OrderNumber,
                    IsActive = w.IsActive,
                    CreatedAt = w.CreatedAt,
                    UpdatedAt = w.UpdatedAt,
                    ModuleId = w.ModuleId,
                    ImagePath = w.ImagePath,
                    VideoPath = w.VideoPath,
                    ModuleName = w.Module.Title,
                    CourseName = w.Module.Course.Title,
                    Subject = w.Module.Course.Subject ?? ""
                })
                .ToListAsync();

            return workItems;
        }
    }
}