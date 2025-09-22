using Microsoft.EntityFrameworkCore;
using CentroCultural.Infrastructure.Data;
using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using CentroCultural.Domain.Entities;

namespace CentroCultural.Application.Services
{
    public class CourseService : ICourseService
    {
        private readonly ApplicationDbContext _context;

        public CourseService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<CourseSummaryDto>> GetAllCoursesAsync()
        {
            var courses = await _context.Course.ToListAsync();

            return courses.Select(c => new CourseSummaryDto
            {
                Id = c.Id,
                Title = c.Title,
                Description = c.Description,
                IsFeatured = c.IsFeatured,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                EducatorName = "Instructor",
                ImagePath = c.ImagePath ?? "",
                ModuleCount = 0
            })
            .OrderByDescending(c => c.CreatedAt);
        }


        // Stub methods to satisfy ICourseService interface
        public Task<CoursePagedResultDto> GetCoursesAsync(CourseSearchDto searchDto) =>
            throw new NotImplementedException();

        public Task<IEnumerable<CourseSummaryDto>> GetFeaturedCoursesAsync(int count = 6) =>
            throw new NotImplementedException();

        public async Task<CourseDetailDto?> GetCourseByIdAsync(string id)
        {
            var course = await _context.Course.FirstOrDefaultAsync(c => c.Id == id);

            // Si no se encuentra por ID y no es un GUID válido, buscar por título
            if (course == null && !Guid.TryParse(id, out _))
            {
                course = await _context.Course.FirstOrDefaultAsync(c => c.Title == id);
            }

            if (course == null)
                return null;

            // Get modules for this course
            var moduleEntities = await _context.Module
                .Where(m => m.CourseId == course.Id)
                .OrderBy(m => m.OrderNumber)
                .ToListAsync();

            var modules = moduleEntities.Select(m => new ModuleSummaryDto
            {
                Id = m.Id,
                Title = m.Title,
                Description = m.Description,
                OrderNumber = m.OrderNumber,
                IsActive = m.IsActive,
                WorkItemCount = 0 // TODO: implementar conteo real
            }).ToList();

            return new CourseDetailDto
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                IsActive = course.IsActive,
                IsFeatured = course.IsFeatured,
                CreatedAt = DateTime.FromBinary(course.CreatedAt),
                UpdatedAt = course.UpdatedAt.HasValue ? DateTime.FromBinary(course.UpdatedAt.Value) : null,
                EducatorId = 1, // TODO: implementar relación real con usuarios
                EducatorName = "Instructor",
                ImagePath = course.ImagePath,
                ModuleCount = modules.Count(),
                WorkItemCount = 0, // TODO: implementar conteo real
                Modules = modules
            };
        }

        public async Task<CourseDto> CreateCourseAsync(CreateCourseDto createCourseDto, int userId)
        {
            var course = new Course
            {
                Id = Guid.NewGuid().ToString(),
                Title = createCourseDto.Title,
                Description = createCourseDto.Description,
                IsFeatured = createCourseDto.IsFeatured,
                ImagePath = createCourseDto.ImagePath,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                UpdatedAt = null,
                EducatorId = userId.ToString()
            };

            _context.Course.Add(course);
            await _context.SaveChangesAsync();

            return new CourseDto
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                IsActive = course.IsActive,
                IsFeatured = course.IsFeatured,
                CreatedAt = DateTimeOffset.FromUnixTimeSeconds(course.CreatedAt).DateTime,
                UpdatedAt = course.UpdatedAt.HasValue ? DateTimeOffset.FromUnixTimeSeconds(course.UpdatedAt.Value).DateTime : null,
                EducatorId = int.Parse(course.EducatorId),
                EducatorName = "Instructor",
                ImagePath = course.ImagePath,
                ModuleCount = 0,
                WorkItemCount = 0
            };
        }

        public Task<bool> UpdateCourseAsync(string id, UpdateCourseDto updateCourseDto, int userId) =>
            throw new NotImplementedException();

        public Task<bool> DeleteCourseAsync(string id, int userId) =>
            throw new NotImplementedException();

        public Task<IEnumerable<CourseSummaryDto>> GetCoursesByEducatorAsync(int userId) =>
            throw new NotImplementedException();

        public async Task<IEnumerable<ModuleSummaryDto>> GetCourseModulesAsync(string courseId)
        {
            // Si no es un GUID válido, buscar el curso por título para obtener el ID real
            string actualCourseId = courseId;
            if (!Guid.TryParse(courseId, out _))
            {
                var course = await _context.Course.FirstOrDefaultAsync(c => c.Title == courseId);
                if (course != null)
                {
                    actualCourseId = course.Id;
                }
            }

            var moduleEntities = await _context.Module
                .Where(m => m.CourseId == actualCourseId)
                .OrderBy(m => m.OrderNumber)
                .ToListAsync();

            return moduleEntities.Select(m => new ModuleSummaryDto
            {
                Id = m.Id,
                Title = m.Title,
                Description = m.Description,
                OrderNumber = m.OrderNumber,
                IsActive = m.IsActive,
                WorkItemCount = 0 // TODO: implementar conteo real de work items
            }).ToList();
        }

        public async Task<ModuleDetailDto?> GetModuleByIdAsync(string moduleId)
        {
            var module = await _context.Module.FirstOrDefaultAsync(m => m.Id == moduleId);

            if (module == null)
                return null;

            // Get work items for this module (when WorkItem functionality is implemented)
            // For now, return empty list
            var workItems = new List<WorkItemDto>();

            return new ModuleDetailDto
            {
                Id = module.Id,
                Title = module.Title,
                Description = module.Description,
                OrderNumber = module.OrderNumber,
                IsActive = module.IsActive,
                CreatedAt = DateTime.FromBinary(module.CreatedAt),
                UpdatedAt = module.UpdatedAt.HasValue ? DateTime.FromBinary(module.UpdatedAt.Value) : null,
                CourseId = module.CourseId,
                CourseName = "", // TODO: Get course name if needed
                WorkItemCount = 0,
                WorkItems = workItems
            };
        }

        public async Task<ModuleDto> CreateModuleAsync(CreateModuleDto createModuleDto, int userId)
        {
            var module = new Module
            {
                Id = Guid.NewGuid().ToString(),
                Title = createModuleDto.Title,
                Description = createModuleDto.Description,
                OrderNumber = createModuleDto.OrderNumber,
                CourseId = createModuleDto.CourseId,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                UpdatedAt = null
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
                CourseId = module.CourseId,
                CreatedAt = DateTimeOffset.FromUnixTimeSeconds(module.CreatedAt).DateTime,
                UpdatedAt = module.UpdatedAt.HasValue ? DateTimeOffset.FromUnixTimeSeconds(module.UpdatedAt.Value).DateTime : null,
                WorkItemCount = 0
            };
        }

        public Task<bool> UpdateModuleAsync(string id, UpdateModuleDto updateModuleDto, int userId) =>
            throw new NotImplementedException();

        public Task<bool> DeleteModuleAsync(string id, int userId) =>
            throw new NotImplementedException();

        public Task<bool> ReorderModuleAsync(string id, int newOrderNumber, int userId) =>
            throw new NotImplementedException();

        public Task<object> GetCourseStatisticsAsync() =>
            throw new NotImplementedException();
    }
}