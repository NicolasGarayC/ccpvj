using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CentroCultural.Application.DTOs;

namespace CentroCultural.Application.Interfaces
{
    public interface ICourseService
    {
        // Course CRUD operations
        Task<CoursePagedResultDto> GetCoursesAsync(CourseSearchDto searchDto);
        Task<IEnumerable<CourseSummaryDto>> GetAllCoursesAsync();
        Task<IEnumerable<CourseSummaryDto>> GetFeaturedCoursesAsync(int count = 6);
        Task<CourseDetailDto?> GetCourseByIdAsync(Guid id);
        Task<CourseDto> CreateCourseAsync(CreateCourseDto createCourseDto, string userId);
        Task<bool> UpdateCourseAsync(Guid id, UpdateCourseDto updateCourseDto, string userId);
        Task<bool> DeleteCourseAsync(Guid id, string userId);
        Task<IEnumerable<CourseSummaryDto>> GetCoursesByEducatorAsync(string userId);

        // Module operations (kept in CourseService for consistency)
        Task<IEnumerable<ModuleSummaryDto>> GetCourseModulesAsync(Guid courseId);
        Task<ModuleDetailDto?> GetModuleByIdAsync(Guid moduleId);
        Task<ModuleDto> CreateModuleAsync(CreateModuleDto createModuleDto, string userId);
        Task<bool> UpdateModuleAsync(Guid id, UpdateModuleDto updateModuleDto, string userId);
        Task<bool> DeleteModuleAsync(Guid id, string userId);
        Task<bool> ReorderModuleAsync(Guid id, int newOrderNumber, string userId);

        // Statistics and utility methods
        Task<object> GetCourseStatisticsAsync();
        Task<IEnumerable<string>> GetAvailableSubjectsAsync();
    }
}