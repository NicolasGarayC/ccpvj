using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CentroCultural.Application.DTOs;

namespace CentroCultural.Application.Interfaces
{
    public interface ICourseService
    {
        Task<IEnumerable<CourseDto>> GetAllCoursesAsync();
        Task<IEnumerable<CourseDto>> GetFeaturedCoursesAsync();
        Task<CourseDetailDto?> GetCourseByIdAsync(Guid id);
        Task<IEnumerable<ModuleDto>> GetCourseModulesAsync(Guid courseId);
        Task<CourseDto> CreateCourseAsync(CreateCourseDto createCourseDto, int educatorId);
        Task<bool> UpdateCourseAsync(Guid id, UpdateCourseDto updateCourseDto, int educatorId);
        Task<bool> DeleteCourseAsync(Guid id, int educatorId);
        Task<IEnumerable<CourseDto>> GetCoursesByEducatorAsync(int educatorId);
    }
}