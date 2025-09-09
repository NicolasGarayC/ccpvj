using Microsoft.EntityFrameworkCore;
using CentroCultural.Domain.Entities;
using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using CentroCultural.Infrastructure.Data;
using Models;

namespace CentroCultural.Application.Services
{
    public class CourseService : ICourseService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CourseService> _logger;

        public CourseService(ApplicationDbContext context, ILogger<CourseService> logger)
        {
            _context = context;
            _logger = logger;
        }

        #region Course Operations

        public async Task<CoursePagedResultDto> GetCoursesAsync(CourseSearchDto searchDto)
        {
            var query = _context.Course
                .Include(c => c.Educator)
                .Where(c => c.IsActive)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(searchDto.SearchTerm))
            {
                var searchTerm = searchDto.SearchTerm.ToLower();
                query = query.Where(c => c.Title.ToLower().Contains(searchTerm) ||
                                       c.Description.ToLower().Contains(searchTerm) ||
                                       (c.Subject != null && c.Subject.ToLower().Contains(searchTerm)));
            }

            if (!string.IsNullOrEmpty(searchDto.Subject))
                query = query.Where(c => c.Subject == searchDto.Subject);

            if (searchDto.IsFeatured.HasValue)
                query = query.Where(c => c.IsFeatured == searchDto.IsFeatured.Value);

            // Apply sorting
            query = searchDto.SortBy?.ToLower() switch
            {
                "created_asc" => query.OrderBy(c => c.CreatedAt),
                "title_asc" => query.OrderBy(c => c.Title),
                "featured_desc" => query.OrderByDescending(c => c.IsFeatured).ThenByDescending(c => c.CreatedAt),
                _ => query.OrderByDescending(c => c.CreatedAt) // default: created_desc
            };

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)searchDto.PageSize);

            var courses = await query
                .Skip((searchDto.Page - 1) * searchDto.PageSize)
                .Take(searchDto.PageSize)
                .Select(c => new CourseSummaryDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    Subject = c.Subject ?? "",
                    IsFeatured = c.IsFeatured,
                    CreatedAt = c.CreatedAt,
                    EducatorName = $"{c.Educator.Nombre} {c.Educator.Apellido}".Trim(),
                    ImagePath = c.ImagePath,
                    ModuleCount = c.Modules.Count(m => m.IsActive)
                })
                .ToListAsync();

            return new CoursePagedResultDto
            {
                Courses = courses,
                TotalCount = totalCount,
                Page = searchDto.Page,
                PageSize = searchDto.PageSize,
                TotalPages = totalPages,
                HasNextPage = searchDto.Page < totalPages,
                HasPreviousPage = searchDto.Page > 1
            };
        }

        public async Task<IEnumerable<CourseSummaryDto>> GetAllCoursesAsync()
        {
            var courses = await _context.Course
                .Include(c => c.Educator)
                .Where(c => c.IsActive)
                .Select(c => new CourseSummaryDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    Subject = c.Subject ?? "",
                    IsFeatured = c.IsFeatured,
                    CreatedAt = c.CreatedAt,
                    EducatorName = $"{c.Educator.Nombre} {c.Educator.Apellido}".Trim(),
                    ImagePath = c.ImagePath,
                    ModuleCount = c.Modules.Count(m => m.IsActive)
                })
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return courses;
        }

        public async Task<IEnumerable<CourseSummaryDto>> GetFeaturedCoursesAsync(int count = 6)
        {
            var courses = await _context.Course
                .Include(c => c.Educator)
                .Where(c => c.IsActive && c.IsFeatured)
                .Select(c => new CourseSummaryDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    Subject = c.Subject ?? "",
                    IsFeatured = c.IsFeatured,
                    CreatedAt = c.CreatedAt,
                    EducatorName = $"{c.Educator.Nombre} {c.Educator.Apellido}".Trim(),
                    ImagePath = c.ImagePath,
                    ModuleCount = c.Modules.Count(m => m.IsActive)
                })
                .OrderByDescending(c => c.CreatedAt)
                .Take(count)
                .ToListAsync();

            return courses;
        }

        public async Task<CourseDetailDto?> GetCourseByIdAsync(Guid id)
        {
            var course = await _context.Course
                .Include(c => c.Educator)
                .Include(c => c.Modules.Where(m => m.IsActive))
                .FirstOrDefaultAsync(c => c.Id == id && c.IsActive);

            if (course == null) return null;

            return new CourseDetailDto
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                Subject = course.Subject ?? "",
                IsActive = course.IsActive,
                IsFeatured = course.IsFeatured,
                CreatedAt = course.CreatedAt,
                UpdatedAt = course.UpdatedAt,
                EducatorId = course.EducatorId,
                EducatorName = $"{course.Educator.Nombre} {course.Educator.Apellido}".Trim(),
                ImagePath = course.ImagePath,
                ModuleCount = course.Modules.Count,
                WorkItemCount = course.Modules.SelectMany(m => m.WorkItems ?? Enumerable.Empty<WorkItem>()).Count(w => w.IsActive),
                Modules = course.Modules
                    .OrderBy(m => m.OrderNumber)
                    .Select(m => new ModuleSummaryDto
                    {
                        Id = m.Id,
                        Title = m.Title,
                        Description = m.Description,
                        OrderNumber = m.OrderNumber,
                        IsActive = m.IsActive,
                        WorkItemCount = (m.WorkItems?.Count(w => w.IsActive) ?? 0)
                    })
                    .ToList()
            };
        }

        public async Task<CourseDto> CreateCourseAsync(CreateCourseDto createCourseDto, string userId)
        {
            // Validate educator exists
            var educator = await _context.Usuario.FirstOrDefaultAsync(u => u.IdUsuario.ToString() == userId);
            if (educator == null)
                throw new ArgumentException("Educator not found");

            // Verify user is educator or admin
            if (educator.Rol?.NombreRol != "Colaborador" && educator.Rol?.NombreRol != "Administrador")
                throw new UnauthorizedAccessException("Solo colaboradores y administradores pueden crear cursos");

            var course = new Course
            {
                Id = Guid.NewGuid(),
                Title = createCourseDto.Title,
                Description = createCourseDto.Description,
                Subject = createCourseDto.Subject,
                IsFeatured = createCourseDto.IsFeatured,
                ImagePath = createCourseDto.ImagePath,
                EducatorId = educator.IdUsuario,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Course.Add(course);
            await _context.SaveChangesAsync();

            return new CourseDto
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                Subject = course.Subject ?? "",
                IsActive = course.IsActive,
                IsFeatured = course.IsFeatured,
                CreatedAt = course.CreatedAt,
                UpdatedAt = course.UpdatedAt,
                EducatorId = course.EducatorId,
                EducatorName = $"{educator.Nombre} {educator.Apellido}".Trim(),
                ImagePath = course.ImagePath,
                ModuleCount = 0,
                WorkItemCount = 0
            };
        }

        public async Task<bool> UpdateCourseAsync(Guid id, UpdateCourseDto updateCourseDto, string userId)
        {
            var course = await _context.Course
                .Include(c => c.Educator)
                .FirstOrDefaultAsync(c => c.Id == id && c.IsActive);

            if (course == null) return false;

            // Check permissions - educator owner or admin
            var user = await _context.Usuario.Include(u => u.Rol).FirstOrDefaultAsync(u => u.IdUsuario.ToString() == userId);
            if (user == null || (course.EducatorId.ToString() != userId && user.Rol?.NombreRol != "Administrador"))
                throw new UnauthorizedAccessException("No tienes permisos para editar este curso");

            course.Title = updateCourseDto.Title;
            course.Description = updateCourseDto.Description;
            course.Subject = updateCourseDto.Subject;
            course.IsFeatured = updateCourseDto.IsFeatured;
            course.ImagePath = updateCourseDto.ImagePath;
            course.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteCourseAsync(Guid id, string userId)
        {
            var course = await _context.Course
                .Include(c => c.Educator)
                .FirstOrDefaultAsync(c => c.Id == id && c.IsActive);

            if (course == null) return false;

            // Check permissions - educator owner or admin
            var user = await _context.Usuario.Include(u => u.Rol).FirstOrDefaultAsync(u => u.IdUsuario.ToString() == userId);
            if (user == null || (course.EducatorId.ToString() != userId && user.Rol?.NombreRol != "Administrador"))
                throw new UnauthorizedAccessException("No tienes permisos para eliminar este curso");

            // Soft delete - mark as inactive
            course.IsActive = false;
            course.UpdatedAt = DateTime.UtcNow;

            // Also deactivate modules and work items
            var modules = await _context.Module.Where(m => m.CourseId == id).ToListAsync();
            foreach (var module in modules)
            {
                module.IsActive = false;
                module.UpdatedAt = DateTime.UtcNow;

                var workItems = await _context.WorkItem.Where(w => w.ModuleId == module.Id).ToListAsync();
                foreach (var workItem in workItems)
                {
                    workItem.IsActive = false;
                    workItem.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<CourseSummaryDto>> GetCoursesByEducatorAsync(string userId)
        {
            var courses = await _context.Course
                .Include(c => c.Educator)
                .Where(c => c.EducatorId.ToString() == userId && c.IsActive)
                .Select(c => new CourseSummaryDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    Subject = c.Subject ?? "",
                    IsFeatured = c.IsFeatured,
                    CreatedAt = c.CreatedAt,
                    EducatorName = $"{c.Educator.Nombre} {c.Educator.Apellido}".Trim(),
                    ImagePath = c.ImagePath,
                    ModuleCount = c.Modules.Count(m => m.IsActive)
                })
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return courses;
        }

        #endregion

        #region Module Operations

        public async Task<IEnumerable<ModuleSummaryDto>> GetCourseModulesAsync(Guid courseId)
        {
            var modules = await _context.Module
                .Where(m => m.CourseId == courseId && m.IsActive)
                .OrderBy(m => m.OrderNumber)
                .Select(m => new ModuleSummaryDto
                {
                    Id = m.Id,
                    Title = m.Title,
                    Description = m.Description,
                    OrderNumber = m.OrderNumber,
                    IsActive = m.IsActive,
                    WorkItemCount = (m.WorkItems != null ? m.WorkItems.Count(w => w.IsActive) : 0)
                })
                .ToListAsync();

            return modules;
        }

        public async Task<ModuleDetailDto?> GetModuleByIdAsync(Guid moduleId)
        {
            var module = await _context.Module
                .Include(m => m.Course)
                .Include(m => m.WorkItems!.Where(w => w.IsActive))
                .FirstOrDefaultAsync(m => m.Id == moduleId && m.IsActive);

            if (module == null) return null;

            return new ModuleDetailDto
            {
                Id = module.Id,
                Title = module.Title,
                Description = module.Description,
                OrderNumber = module.OrderNumber,
                IsActive = module.IsActive,
                CreatedAt = module.CreatedAt,
                UpdatedAt = module.UpdatedAt,
                CourseId = module.CourseId,
                CourseName = module.Course.Title,
                WorkItemCount = module.WorkItems?.Count(w => w.IsActive) ?? 0,
                WorkItems = module.WorkItems?
                    .Where(w => w.IsActive)
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
                    }) ?? Enumerable.Empty<WorkItemDto>()
            };
        }

        public async Task<ModuleDto> CreateModuleAsync(CreateModuleDto createModuleDto, string userId)
        {
            // Verify course exists and user has permissions
            var course = await _context.Course
                .Include(c => c.Educator)
                .FirstOrDefaultAsync(c => c.Id == createModuleDto.CourseId && c.IsActive);

            if (course == null)
                throw new ArgumentException("Course not found or inactive");

            // Check permissions - educator owner or admin
            var user = await _context.Usuario.Include(u => u.Rol).FirstOrDefaultAsync(u => u.IdUsuario.ToString() == userId);
            if (user == null || (course.EducatorId.ToString() != userId && user.Rol?.NombreRol != "Administrador"))
                throw new UnauthorizedAccessException("No tienes permisos para crear módulos en este curso");

            var module = new Module
            {
                Id = Guid.NewGuid(),
                Title = createModuleDto.Title,
                Description = createModuleDto.Description,
                OrderNumber = createModuleDto.OrderNumber,
                CourseId = createModuleDto.CourseId,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Module.Add(module);
            await _context.SaveChangesAsync();

            return new ModuleDto
            {
                Id = module.Id,
                Title = module.Title,
                Description = module.Description,
                OrderNumber = module.OrderNumber,
                IsActive = module.IsActive,
                CreatedAt = module.CreatedAt,
                UpdatedAt = module.UpdatedAt,
                CourseId = module.CourseId,
                CourseName = course.Title,
                WorkItemCount = 0
            };
        }

        public async Task<bool> UpdateModuleAsync(Guid id, UpdateModuleDto updateModuleDto, string userId)
        {
            var module = await _context.Module
                .Include(m => m.Course)
                .ThenInclude(c => c.Educator)
                .FirstOrDefaultAsync(m => m.Id == id && m.IsActive);

            if (module == null) return false;

            // Check permissions - educator owner or admin
            var user = await _context.Usuario.Include(u => u.Rol).FirstOrDefaultAsync(u => u.IdUsuario.ToString() == userId);
            if (user == null || (module.Course.EducatorId.ToString() != userId && user.Rol?.NombreRol != "Administrador"))
                throw new UnauthorizedAccessException("No tienes permisos para editar este módulo");

            module.Title = updateModuleDto.Title;
            module.Description = updateModuleDto.Description;
            module.OrderNumber = updateModuleDto.OrderNumber;
            module.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteModuleAsync(Guid id, string userId)
        {
            var module = await _context.Module
                .Include(m => m.Course)
                .ThenInclude(c => c.Educator)
                .FirstOrDefaultAsync(m => m.Id == id && m.IsActive);

            if (module == null) return false;

            // Check permissions - educator owner or admin
            var user = await _context.Usuario.Include(u => u.Rol).FirstOrDefaultAsync(u => u.IdUsuario.ToString() == userId);
            if (user == null || (module.Course.EducatorId.ToString() != userId && user.Rol?.NombreRol != "Administrador"))
                throw new UnauthorizedAccessException("No tienes permisos para eliminar este módulo");

            // Soft delete - mark as inactive
            module.IsActive = false;
            module.UpdatedAt = DateTime.UtcNow;

            // Also deactivate work items
            var workItems = await _context.WorkItem.Where(w => w.ModuleId == id).ToListAsync();
            foreach (var workItem in workItems)
            {
                workItem.IsActive = false;
                workItem.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ReorderModuleAsync(Guid id, int newOrderNumber, string userId)
        {
            var module = await _context.Module
                .Include(m => m.Course)
                .ThenInclude(c => c.Educator)
                .FirstOrDefaultAsync(m => m.Id == id && m.IsActive);

            if (module == null) return false;

            // Check permissions - educator owner or admin
            var user = await _context.Usuario.Include(u => u.Rol).FirstOrDefaultAsync(u => u.IdUsuario.ToString() == userId);
            if (user == null || (module.Course.EducatorId.ToString() != userId && user.Rol?.NombreRol != "Administrador"))
                throw new UnauthorizedAccessException("No tienes permisos para reordenar módulos en este curso");

            var oldOrderNumber = module.OrderNumber;

            // Reorder other modules in the same course
            var otherModules = await _context.Module
                .Where(m => m.CourseId == module.CourseId && m.IsActive && m.Id != id)
                .ToListAsync();

            if (newOrderNumber > oldOrderNumber)
            {
                // Moving down
                foreach (var mod in otherModules.Where(m => m.OrderNumber > oldOrderNumber && m.OrderNumber <= newOrderNumber))
                {
                    mod.OrderNumber--;
                }
            }
            else if (newOrderNumber < oldOrderNumber)
            {
                // Moving up
                foreach (var mod in otherModules.Where(m => m.OrderNumber >= newOrderNumber && m.OrderNumber < oldOrderNumber))
                {
                    mod.OrderNumber++;
                }
            }

            module.OrderNumber = newOrderNumber;
            module.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        #endregion

        #region Statistics and Utility

        public async Task<object> GetCourseStatisticsAsync()
        {
            var totalCourses = await _context.Course.CountAsync(c => c.IsActive);
            var featuredCourses = await _context.Course.CountAsync(c => c.IsActive && c.IsFeatured);
            var totalModules = await _context.Module.CountAsync(m => m.IsActive);
            var totalWorkItems = await _context.WorkItem.CountAsync(w => w.IsActive);

            var subjectStats = await _context.Course
                .Where(c => c.IsActive)
                .GroupBy(c => c.Subject)
                .Select(g => new { Subject = g.Key, Count = g.Count() })
                .ToListAsync();

            return new
            {
                TotalCourses = totalCourses,
                FeaturedCourses = featuredCourses,
                TotalModules = totalModules,
                TotalWorkItems = totalWorkItems,
                SubjectStats = subjectStats
            };
        }

        public async Task<IEnumerable<string>> GetAvailableSubjectsAsync()
        {
            var subjects = await _context.Course
                .Where(c => c.IsActive && !string.IsNullOrEmpty(c.Subject))
                .Select(c => c.Subject!)
                .Distinct()
                .OrderBy(s => s)
                .ToListAsync();

            return subjects;
        }

        #endregion
    }
}