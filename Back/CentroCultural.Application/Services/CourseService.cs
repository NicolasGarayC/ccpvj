using Microsoft.EntityFrameworkCore;
using CentroCultural.Infrastructure.Data;
using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using Models;

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
                Subject = c.Subject ?? "",
                IsFeatured = c.IsFeatured,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                EducatorName = "Instructor",
                ImagePath = c.ImagePath ?? "",
                ModuleCount = 0
            })
            .OrderByDescending(c => c.CreatedAt);
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

        // Stub methods to satisfy ICourseService interface
        public Task<CoursePagedResultDto> GetCoursesAsync(CourseSearchDto searchDto) =>
            throw new NotImplementedException();

        public Task<IEnumerable<CourseSummaryDto>> GetFeaturedCoursesAsync(int count = 6) =>
            throw new NotImplementedException();

        public async Task<CourseDetailDto?> GetCourseByIdAsync(string id)
        {
            var course = await _context.Course.FirstOrDefaultAsync(c => c.Id == id);

            if (course == null)
                return null;

            // Get modules for this course
            var moduleEntities = await _context.Module
                .Where(m => m.CourseId == course.Id)
                .OrderBy(m => m.OrderNumber)
                .ToListAsync();

            var modules = moduleEntities.Select(m => new ModuleSummaryDto
            {
                Id = Guid.TryParse(m.Id, out var moduleGuid) ? moduleGuid : Guid.Empty,
                StringId = m.Id,
                Title = m.Title,
                Description = m.Description,
                OrderNumber = m.OrderNumber,
                IsActive = m.IsActive,
                WorkItemCount = 0 // TODO: implementar conteo real
            }).ToList();

            return new CourseDetailDto
            {
                Id = Guid.TryParse(course.Id, out var courseGuid) ? courseGuid : Guid.NewGuid(),
                StringId = course.Id,
                Title = course.Title,
                Description = course.Description,
                Subject = course.Subject ?? "",
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

        public Task<CourseDto> CreateCourseAsync(CreateCourseDto createCourseDto, int userId) =>
            throw new NotImplementedException();

        public Task<bool> UpdateCourseAsync(Guid id, UpdateCourseDto updateCourseDto, int userId) =>
            throw new NotImplementedException();

        public Task<bool> DeleteCourseAsync(Guid id, int userId) =>
            throw new NotImplementedException();

        public Task<IEnumerable<CourseSummaryDto>> GetCoursesByEducatorAsync(int userId) =>
            throw new NotImplementedException();

        public async Task<IEnumerable<ModuleSummaryDto>> GetCourseModulesAsync(string courseId)
        {
            var moduleEntities = await _context.Module
                .Where(m => m.CourseId == courseId)
                .OrderBy(m => m.OrderNumber)
                .ToListAsync();

            return moduleEntities.Select(m => new ModuleSummaryDto
            {
                Id = Guid.TryParse(m.Id, out var moduleGuid) ? moduleGuid : Guid.Empty,
                StringId = m.Id,
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
                Id = Guid.TryParse(module.Id, out var moduleGuid) ? moduleGuid : Guid.NewGuid(),
                StringId = module.Id,
                Title = module.Title,
                Description = module.Description,
                OrderNumber = module.OrderNumber,
                IsActive = module.IsActive,
                CreatedAt = DateTime.FromBinary(module.CreatedAt),
                UpdatedAt = module.UpdatedAt.HasValue ? DateTime.FromBinary(module.UpdatedAt.Value) : null,
                CourseId = Guid.TryParse(module.CourseId, out var courseGuid) ? courseGuid : Guid.NewGuid(),
                CourseName = "", // TODO: Get course name if needed
                WorkItemCount = 0,
                WorkItems = workItems
            };
        }

        public Task<ModuleDto> CreateModuleAsync(CreateModuleDto createModuleDto, int userId) =>
            throw new NotImplementedException();

        public Task<bool> UpdateModuleAsync(Guid id, UpdateModuleDto updateModuleDto, int userId) =>
            throw new NotImplementedException();

        public Task<bool> DeleteModuleAsync(Guid id, int userId) =>
            throw new NotImplementedException();

        public Task<bool> ReorderModuleAsync(Guid id, int newOrderNumber, int userId) =>
            throw new NotImplementedException();

        public Task<object> GetCourseStatisticsAsync() =>
            throw new NotImplementedException();
    }
}