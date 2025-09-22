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
        Task<CourseDetailDto?> GetCourseByIdAsync(string id);
        Task<CourseDto> CreateCourseAsync(CreateCourseDto createCourseDto, int userId);
        Task<bool> UpdateCourseAsync(string id, UpdateCourseDto updateCourseDto, int userId);
        Task<bool> DeleteCourseAsync(string id, int userId);
        Task<IEnumerable<CourseSummaryDto>> GetCoursesByEducatorAsync(int userId);

        // Module operations (kept in CourseService for consistency)
        Task<IEnumerable<ModuleSummaryDto>> GetCourseModulesAsync(string courseId);
        Task<ModuleDetailDto?> GetModuleByIdAsync(string moduleId);
        Task<ModuleDto> CreateModuleAsync(CreateModuleDto createModuleDto, int userId);
        Task<bool> UpdateModuleAsync(string id, UpdateModuleDto updateModuleDto, int userId);
        Task<bool> DeleteModuleAsync(string id, int userId);
        Task<bool> ReorderModuleAsync(string id, int newOrderNumber, int userId);

        // Statistics and utility methods
        Task<object> GetCourseStatisticsAsync();
    }
}