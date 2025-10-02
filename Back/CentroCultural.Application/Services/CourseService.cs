using Microsoft.EntityFrameworkCore;
using CentroCultural.Infrastructure.Data;
using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using CentroCultural.Domain.Entities;
using System.IO;

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
            var courses = await _context.Course
                .Select(c => new CourseSummaryDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    IsFeatured = c.IsFeatured,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt,
                    EducatorName = "Instructor",
                    ImagePath = c.ImagePath ?? "",
                    ModuleCount = _context.Module.Count(m => m.CourseId == c.Id)
                })
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return courses;
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
                IsActive = m.IsActive
            }).ToList();

            return new CourseDetailDto
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                IsActive = course.IsActive,
                IsFeatured = course.IsFeatured,
                CreatedAt = DateTimeOffset.FromUnixTimeSeconds(course.CreatedAt).DateTime,
                UpdatedAt = course.UpdatedAt.HasValue ? DateTimeOffset.FromUnixTimeSeconds(course.UpdatedAt.Value).DateTime : null,
                EducatorId = int.TryParse(course.EducatorId, out var educatorId) ? educatorId : 1,
                EducatorName = "Instructor",
                ImagePath = course.ImagePath,
                ModuleCount = modules.Count(),
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
                ModuleCount = 0
            };
        }

        public async Task<bool> UpdateCourseAsync(string id, UpdateCourseDto updateCourseDto, int userId)
        {
            try
            {
                var course = await _context.Course.FirstOrDefaultAsync(c => c.Id == id);
                if (course == null)
                    return false;

                // Update course properties
                course.Title = updateCourseDto.Title;
                course.Description = updateCourseDto.Description;
                course.IsFeatured = updateCourseDto.IsFeatured;
                course.ImagePath = updateCourseDto.ImagePath;
                course.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

                _context.Course.Update(course);
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating course {id}: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteCourseAsync(string id, int userId)
        {
            try
            {
                // 1. Verify course exists
                var course = await _context.Course.FirstOrDefaultAsync(c => c.Id == id);
                if (course == null)
                    return false;

                // 2. Get all modules for this course (use corrected table reference)
                var modules = await _context.Module
                    .Where(m => m.CourseId == id)
                    .ToListAsync();

                // 3. Get all posts from all modules and collect multimedia paths
                var mediaFilesToDelete = new List<string>();

                foreach (var module in modules)
                {
                    // Get all posts for this module
                    var posts = await _context.ModulePosts
                        .Where(p => p.ModuleId == module.Id)
                        .ToListAsync();

                    // Collect multimedia file paths from posts (COMPLETE CASCADE)
                    foreach (var post in posts)
                    {
                        if (!string.IsNullOrEmpty(post.ImagePath))
                            mediaFilesToDelete.Add(post.ImagePath);
                        if (!string.IsNullOrEmpty(post.VideoPath))
                            mediaFilesToDelete.Add(post.VideoPath);
                        if (!string.IsNullOrEmpty(post.AudioPath))
                            mediaFilesToDelete.Add(post.AudioPath);
                    }

                    // Note: Module entity doesn't have ImagePath property in current schema

                    // Delete all posts for this module explicitly (don't rely on cascade)
                    _context.ModulePosts.RemoveRange(posts);
                }

                // 4. Delete course image if exists
                if (!string.IsNullOrEmpty(course.ImagePath))
                    mediaFilesToDelete.Add(course.ImagePath);

                // 5. Delete using raw SQL to avoid EF tracking issues
                await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM module_post WHERE module_id IN (SELECT id FROM module WHERE course_id = {0})", id);
                await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM module WHERE course_id = {0}", id);
                await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM course WHERE id = {0}", id);

                // 8. Delete physical multimedia files in cascade order
                await DeleteMultiMediaFiles(mediaFilesToDelete);

                Console.WriteLine($"Successfully deleted course {id} with {modules.Count} modules and {mediaFilesToDelete.Count} media files");
                return true;
            }
            catch (Exception ex)
            {
                // Log error and rethrow for proper error handling
                Console.WriteLine($"Error deleting course {id}: {ex.Message}");
                throw;
            }
        }

        private async Task DeleteMultiMediaFiles(List<string> filePaths)
        {
            foreach (var filePath in filePaths.Where(f => !string.IsNullOrEmpty(f)))
            {
                try
                {
                    var fullPath = GetFullMediaPath(filePath);
                    if (File.Exists(fullPath))
                    {
                        File.Delete(fullPath);
                        Console.WriteLine($"Deleted media file: {fullPath}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Warning: Could not delete media file {filePath}: {ex.Message}");
                    // Continue with other files even if one fails
                }
            }
        }

        private string GetFullMediaPath(string relativePath)
        {
            // Convert relative path to full file system path
            // Remove leading slash if present and normalize path
            var cleanPath = relativePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);

            // Construct full path to media directory - files are in Back/Data/media
            var mediaDirectory = Path.Combine(Directory.GetCurrentDirectory(), "Data", "media");
            var fullPath = Path.Combine(mediaDirectory, cleanPath);

            Console.WriteLine($"🔧 CourseService - Media directory: {mediaDirectory}");
            Console.WriteLine($"🔧 CourseService - Full resolved path: {fullPath}");

            return fullPath;
        }

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
                IsActive = m.IsActive
            }).ToList();
        }

        public async Task<ModuleDetailDto?> GetModuleByIdAsync(string moduleId)
        {
            var module = await _context.Module.FirstOrDefaultAsync(m => m.Id == moduleId);

            if (module == null)
                return null;

            return new ModuleDetailDto
            {
                Id = module.Id,
                Title = module.Title,
                Description = module.Description,
                OrderNumber = module.OrderNumber,
                IsActive = module.IsActive,
                CreatedAt = DateTimeOffset.FromUnixTimeSeconds(module.CreatedAt).DateTime,
                UpdatedAt = module.UpdatedAt.HasValue ? DateTimeOffset.FromUnixTimeSeconds(module.UpdatedAt.Value).DateTime : null,
                CourseId = module.CourseId,
                CourseName = "" // TODO: Get course name if needed
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
                UpdatedAt = module.UpdatedAt.HasValue ? DateTimeOffset.FromUnixTimeSeconds(module.UpdatedAt.Value).DateTime : null
            };
        }

        public Task<bool> UpdateModuleAsync(string id, UpdateModuleDto updateModuleDto, int userId) =>
            throw new NotImplementedException();

        public async Task<bool> DeleteModuleAsync(string id, int userId)
        {
            try
            {
                // 1. Verify module exists
                var module = await _context.Module.FirstOrDefaultAsync(m => m.Id == id);
                if (module == null)
                    return false;

                // 2. Get all posts for this module and collect multimedia paths
                var posts = await _context.ModulePosts
                    .Where(p => p.ModuleId == id)
                    .ToListAsync();

                var mediaFilesToDelete = new List<string>();

                // 3. Collect multimedia file paths from all posts
                foreach (var post in posts)
                {
                    if (!string.IsNullOrEmpty(post.ImagePath))
                        mediaFilesToDelete.Add(post.ImagePath);
                    if (!string.IsNullOrEmpty(post.VideoPath))
                        mediaFilesToDelete.Add(post.VideoPath);
                    if (!string.IsNullOrEmpty(post.AudioPath))
                        mediaFilesToDelete.Add(post.AudioPath);
                }

                // Note: Module entity doesn't have ImagePath property in current schema

                // 5. Delete all posts for this module explicitly
                _context.ModulePosts.RemoveRange(posts);

                // 6. Delete module
                _context.Module.Remove(module);

                // 7. Save database changes first
                await _context.SaveChangesAsync();

                // 8. Delete physical multimedia files
                await DeleteMultiMediaFiles(mediaFilesToDelete);

                Console.WriteLine($"Successfully deleted module {id} with {posts.Count} posts and {mediaFilesToDelete.Count} media files");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting module {id}: {ex.Message}");
                throw;
            }
        }

        public Task<bool> ReorderModuleAsync(string id, int newOrderNumber, int userId) =>
            throw new NotImplementedException();

        public Task<object> GetCourseStatisticsAsync() =>
            throw new NotImplementedException();
    }
}