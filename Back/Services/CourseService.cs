using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Back.Data;
using Back.DTOs;
using Back.Models;

namespace Back.Services
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

        public async Task<IEnumerable<CourseDto>> GetAllCoursesAsync()
        {
            try
            {
                var courses = await _context.Course
                    .Include(c => c.Educator)
                    .Include(c => c.Modules)
                    .Where(c => c.IsActive)
                    .OrderByDescending(c => c.CreatedAt)
                    .Select(c => new CourseDto
                    {
                        Id = c.Id,
                        Title = c.Title,
                        Description = c.Description,
                        ImagePath = c.ImagePath,
                        IsActive = c.IsActive,
                        IsFeatured = c.IsFeatured,
                        CreatedAt = c.CreatedAt,
                        UpdatedAt = c.UpdatedAt,
                        EducatorName = c.Educator.NombreUsuario,
                        EducatorId = c.EducatorId,
                        ModuleCount = c.Modules.Count(m => m.IsActive)
                    })
                    .ToListAsync();

                return courses;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo todos los cursos");
                throw;
            }
        }

        public async Task<IEnumerable<CourseDto>> GetFeaturedCoursesAsync()
        {
            try
            {
                var courses = await _context.Course
                    .Include(c => c.Educator)
                    .Include(c => c.Modules)
                    .Where(c => c.IsActive && c.IsFeatured)
                    .OrderByDescending(c => c.CreatedAt)
                    .Select(c => new CourseDto
                    {
                        Id = c.Id,
                        Title = c.Title,
                        Description = c.Description,
                        ImagePath = c.ImagePath,
                        IsActive = c.IsActive,
                        IsFeatured = c.IsFeatured,
                        CreatedAt = c.CreatedAt,
                        UpdatedAt = c.UpdatedAt,
                        EducatorName = c.Educator.NombreUsuario,
                        EducatorId = c.EducatorId,
                        ModuleCount = c.Modules.Count(m => m.IsActive)
                    })
                    .ToListAsync();

                return courses;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo cursos destacados");
                throw;
            }
        }

        public async Task<CourseDetailDto?> GetCourseByIdAsync(Guid id)
        {
            try
            {
                var course = await _context.Course
                    .Include(c => c.Educator)
                    .Include(c => c.Modules.Where(m => m.IsActive))
                    .Where(c => c.Id == id && c.IsActive)
                    .FirstOrDefaultAsync();

                if (course == null)
                    return null;

                return new CourseDetailDto
                {
                    Id = course.Id,
                    Title = course.Title,
                    Description = course.Description,
                    ImagePath = course.ImagePath,
                    IsActive = course.IsActive,
                    IsFeatured = course.IsFeatured,
                    CreatedAt = course.CreatedAt,
                    UpdatedAt = course.UpdatedAt,
                    EducatorName = course.Educator.NombreUsuario,
                    EducatorId = course.EducatorId,
                    ModuleCount = course.Modules.Count,
                    Modules = course.Modules.OrderBy(m => m.OrderNumber).Select(m => new ModuleDto
                    {
                        Id = m.Id,
                        Title = m.Title,
                        Description = m.Description,
                        Content = m.Content,
                        OrderNumber = m.OrderNumber,
                        IsActive = m.IsActive,
                        CreatedAt = m.CreatedAt,
                        UpdatedAt = m.UpdatedAt,
                        CourseId = m.CourseId,
                        CourseName = course.Title
                    }).ToList()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo curso por ID: {CourseId}", id);
                throw;
            }
        }

        public async Task<IEnumerable<ModuleDto>> GetCourseModulesAsync(Guid courseId)
        {
            try
            {
                var modules = await _context.Module
                    .Include(m => m.Course)
                    .Where(m => m.CourseId == courseId && m.IsActive)
                    .OrderBy(m => m.OrderNumber)
                    .Select(m => new ModuleDto
                    {
                        Id = m.Id,
                        Title = m.Title,
                        Description = m.Description,
                        Content = m.Content,
                        OrderNumber = m.OrderNumber,
                        IsActive = m.IsActive,
                        CreatedAt = m.CreatedAt,
                        UpdatedAt = m.UpdatedAt,
                        CourseId = m.CourseId,
                        CourseName = m.Course.Title
                    })
                    .ToListAsync();

                return modules;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo módulos del curso: {CourseId}", courseId);
                throw;
            }
        }

        public async Task<CourseDto> CreateCourseAsync(CreateCourseDto createCourseDto, int educatorId)
        {
            try
            {
                var course = new Course
                {
                    Id = Guid.NewGuid(),
                    Title = createCourseDto.Title,
                    Description = createCourseDto.Description,
                    ImagePath = createCourseDto.ImagePath,
                    IsFeatured = createCourseDto.IsFeatured,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    EducatorId = educatorId
                };

                _context.Course.Add(course);
                await _context.SaveChangesAsync();

                // Cargar el educador para devolver en el DTO
                await _context.Entry(course)
                    .Reference(c => c.Educator)
                    .LoadAsync();

                return new CourseDto
                {
                    Id = course.Id,
                    Title = course.Title,
                    Description = course.Description,
                    ImagePath = course.ImagePath,
                    IsActive = course.IsActive,
                    IsFeatured = course.IsFeatured,
                    CreatedAt = course.CreatedAt,
                    UpdatedAt = course.UpdatedAt,
                    EducatorName = course.Educator.NombreUsuario,
                    EducatorId = course.EducatorId,
                    ModuleCount = 0
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando curso");
                throw;
            }
        }

        public async Task<bool> UpdateCourseAsync(Guid id, UpdateCourseDto updateCourseDto, int educatorId)
        {
            try
            {
                var course = await _context.Course
                    .Where(c => c.Id == id && c.EducatorId == educatorId)
                    .FirstOrDefaultAsync();

                if (course == null)
                    return false;

                course.Title = updateCourseDto.Title;
                course.Description = updateCourseDto.Description;
                course.ImagePath = updateCourseDto.ImagePath;
                course.IsActive = updateCourseDto.IsActive;
                course.IsFeatured = updateCourseDto.IsFeatured;
                course.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error actualizando curso: {CourseId}", id);
                throw;
            }
        }

        public async Task<bool> DeleteCourseAsync(Guid id, int educatorId)
        {
            try
            {
                var course = await _context.Course
                    .Where(c => c.Id == id && c.EducatorId == educatorId)
                    .FirstOrDefaultAsync();

                if (course == null)
                    return false;

                // Soft delete
                course.IsActive = false;
                course.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error eliminando curso: {CourseId}", id);
                throw;
            }
        }

        public async Task<IEnumerable<CourseDto>> GetCoursesByEducatorAsync(int educatorId)
        {
            try
            {
                var courses = await _context.Course
                    .Include(c => c.Educator)
                    .Include(c => c.Modules)
                    .Where(c => c.EducatorId == educatorId && c.IsActive)
                    .OrderByDescending(c => c.CreatedAt)
                    .Select(c => new CourseDto
                    {
                        Id = c.Id,
                        Title = c.Title,
                        Description = c.Description,
                        ImagePath = c.ImagePath,
                        IsActive = c.IsActive,
                        IsFeatured = c.IsFeatured,
                        CreatedAt = c.CreatedAt,
                        UpdatedAt = c.UpdatedAt,
                        EducatorName = c.Educator.NombreUsuario,
                        EducatorId = c.EducatorId,
                        ModuleCount = c.Modules.Count(m => m.IsActive)
                    })
                    .ToListAsync();

                return courses;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo cursos del educador: {EducatorId}", educatorId);
                throw;
            }
        }
    }
}