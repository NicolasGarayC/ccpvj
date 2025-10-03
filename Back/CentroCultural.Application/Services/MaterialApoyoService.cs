using Microsoft.EntityFrameworkCore;
using CentroCultural.Infrastructure.Data;
using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using CentroCultural.Domain.Entities;
using System.IO;

namespace CentroCultural.Application.Services
{
    public class MaterialApoyoService : IMaterialApoyoService
    {
        private readonly ApplicationDbContext _context;

        public MaterialApoyoService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<MaterialApoyoSummaryDto>> GetAllMaterialApoyoAsync()
        {
            var materialApoyo = await _context.MaterialApoyo
                .Select(c => new MaterialApoyoSummaryDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    IsFeatured = c.IsFeatured,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt,
                    EducatorName = "Instructor",
                    ImagePath = c.ImagePath ?? "",
                    ModuleCount = _context.Modulo.Count(m => m.MaterialApoyoId == c.Id)
                })
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return materialApoyo;
        }


        public async Task<MaterialApoyoPagedResultDto> GetMaterialApoyoAsync(MaterialApoyoSearchDto searchDto)
        {
            var query = _context.MaterialApoyo.AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(searchDto.SearchTerm))
            {
                query = query.Where(m => m.Title.Contains(searchDto.SearchTerm) ||
                                       m.Description.Contains(searchDto.SearchTerm));
            }

            if (searchDto.IsFeatured.HasValue)
            {
                query = query.Where(m => m.IsFeatured == searchDto.IsFeatured.Value);
            }

            if (searchDto.IsActive.HasValue)
            {
                query = query.Where(m => m.IsActive == searchDto.IsActive.Value);
            }

            // Apply sorting
            query = searchDto.SortBy?.ToLower() switch
            {
                "title" => query.OrderBy(m => m.Title),
                "title_desc" => query.OrderByDescending(m => m.Title),
                "created" => query.OrderBy(m => m.CreatedAt),
                "created_desc" => query.OrderByDescending(m => m.CreatedAt),
                _ => query.OrderByDescending(m => m.CreatedAt)
            };

            // Count total items
            var totalCount = await query.CountAsync();

            // Apply pagination
            var items = await query
                .Skip((searchDto.Page - 1) * searchDto.PageSize)
                .Take(searchDto.PageSize)
                .Select(m => new MaterialApoyoSummaryDto
                {
                    Id = m.Id,
                    Title = m.Title,
                    Description = m.Description,
                    IsFeatured = m.IsFeatured,
                    IsActive = m.IsActive,
                    CreatedAt = m.CreatedAt,
                    EducatorName = "Instructor",
                    ImagePath = m.ImagePath ?? "",
                    ModuleCount = _context.Modulo.Count(mod => mod.MaterialApoyoId == m.Id)
                })
                .ToListAsync();

            var totalPages = (int)Math.Ceiling((double)totalCount / searchDto.PageSize);

            return new MaterialApoyoPagedResultDto
            {
                MaterialApoyo = items,
                TotalCount = totalCount,
                Page = searchDto.Page,
                PageSize = searchDto.PageSize,
                TotalPages = totalPages,
                HasNextPage = searchDto.Page < totalPages,
                HasPreviousPage = searchDto.Page > 1
            };
        }

        public async Task<IEnumerable<MaterialApoyoSummaryDto>> GetFeaturedMaterialApoyoAsync(int count = 6)
        {
            var materialApoyo = await _context.MaterialApoyo
                .Where(m => m.IsFeatured && m.IsActive)
                .Select(m => new MaterialApoyoSummaryDto
                {
                    Id = m.Id,
                    Title = m.Title,
                    Description = m.Description,
                    IsFeatured = m.IsFeatured,
                    IsActive = m.IsActive,
                    CreatedAt = m.CreatedAt,
                    EducatorName = "Instructor",
                    ImagePath = m.ImagePath ?? "",
                    ModuleCount = _context.Modulo.Count(mod => mod.MaterialApoyoId == m.Id)
                })
                .OrderByDescending(m => m.CreatedAt)
                .Take(count)
                .ToListAsync();

            return materialApoyo;
        }

        public async Task<MaterialApoyoDetailDto?> GetMaterialApoyoByIdAsync(string id)
        {
            var materialApoyo = await _context.MaterialApoyo.FirstOrDefaultAsync(c => c.Id == id);

            // Si no se encuentra por ID y no es un GUID válido, buscar por título
            if (materialApoyo == null && !Guid.TryParse(id, out _))
            {
                materialApoyo = await _context.MaterialApoyo.FirstOrDefaultAsync(c => c.Title == id);
            }

            if (materialApoyo == null)
                return null;

            // Get modules for this material de apoyo
            var moduleEntities = await _context.Modulo
                .Where(m => m.MaterialApoyoId == materialApoyo.Id)
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

            return new MaterialApoyoDetailDto
            {
                Id = materialApoyo.Id,
                Title = materialApoyo.Title,
                Description = materialApoyo.Description,
                IsActive = materialApoyo.IsActive,
                IsFeatured = materialApoyo.IsFeatured,
                CreatedAt = DateTimeOffset.FromUnixTimeSeconds(materialApoyo.CreatedAt).DateTime,
                UpdatedAt = materialApoyo.UpdatedAt.HasValue ? DateTimeOffset.FromUnixTimeSeconds(materialApoyo.UpdatedAt.Value).DateTime : null,
                EducatorId = int.TryParse(materialApoyo.EducatorId, out var educatorId) ? educatorId : 1,
                EducatorName = "Instructor",
                ImagePath = materialApoyo.ImagePath,
                ModuleCount = modules.Count(),
                Modules = modules
            };
        }

        public async Task<MaterialApoyoDto> CreateMaterialApoyoAsync(CreateMaterialApoyoDto createMaterialApoyoDto, int userId)
        {
            var materialApoyo = new MaterialApoyo
            {
                Id = Guid.NewGuid().ToString(),
                Title = createMaterialApoyoDto.Title,
                Description = createMaterialApoyoDto.Description,
                IsFeatured = createMaterialApoyoDto.IsFeatured,
                ImagePath = createMaterialApoyoDto.ImagePath,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                UpdatedAt = null,
                EducatorId = userId.ToString()
            };

            _context.MaterialApoyo.Add(materialApoyo);
            await _context.SaveChangesAsync();

            return new MaterialApoyoDto
            {
                Id = materialApoyo.Id,
                Title = materialApoyo.Title,
                Description = materialApoyo.Description,
                IsActive = materialApoyo.IsActive,
                IsFeatured = materialApoyo.IsFeatured,
                CreatedAt = DateTimeOffset.FromUnixTimeSeconds(materialApoyo.CreatedAt).DateTime,
                UpdatedAt = materialApoyo.UpdatedAt.HasValue ? DateTimeOffset.FromUnixTimeSeconds(materialApoyo.UpdatedAt.Value).DateTime : null,
                EducatorId = int.Parse(materialApoyo.EducatorId),
                EducatorName = "Instructor",
                ImagePath = materialApoyo.ImagePath,
                ModuleCount = 0
            };
        }

        public async Task<bool> UpdateMaterialApoyoAsync(string id, UpdateMaterialApoyoDto updateMaterialApoyoDto, int userId)
        {
            try
            {
                var materialApoyo = await _context.MaterialApoyo.FirstOrDefaultAsync(c => c.Id == id);
                if (materialApoyo == null)
                    return false;

                // Update material apoyo properties
                materialApoyo.Title = updateMaterialApoyoDto.Title;
                materialApoyo.Description = updateMaterialApoyoDto.Description;
                materialApoyo.IsFeatured = updateMaterialApoyoDto.IsFeatured;
                materialApoyo.ImagePath = updateMaterialApoyoDto.ImagePath;
                materialApoyo.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

                _context.MaterialApoyo.Update(materialApoyo);
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating material apoyo {id}: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteMaterialApoyoAsync(string id, int userId)
        {
            try
            {
                // 1. Verify material apoyo exists
                var materialApoyo = await _context.MaterialApoyo.FirstOrDefaultAsync(c => c.Id == id);
                if (materialApoyo == null)
                    return false;

                // 2. Get all modules for this material apoyo (use corrected table reference)
                var modules = await _context.Modulo
                    .Where(m => m.MaterialApoyoId == id)
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

                // 4. Delete material apoyo image if exists
                if (!string.IsNullOrEmpty(materialApoyo.ImagePath))
                    mediaFilesToDelete.Add(materialApoyo.ImagePath);

                // 5. Delete using raw SQL to avoid EF tracking issues
                await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM module_post WHERE module_id IN (SELECT id FROM modulo WHERE material_apoyo_id = {0})", id);
                await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM modulo WHERE material_apoyo_id = {0}", id);
                await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM material_apoyo WHERE id = {0}", id);

                // 8. Delete physical multimedia files in cascade order
                await DeleteMultiMediaFiles(mediaFilesToDelete);

                Console.WriteLine($"Successfully deleted material apoyo {id} with {modules.Count} modules and {mediaFilesToDelete.Count} media files");
                return true;
            }
            catch (Exception ex)
            {
                // Log error and rethrow for proper error handling
                Console.WriteLine($"Error deleting material apoyo {id}: {ex.Message}");
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

            Console.WriteLine($"🔧 MaterialApoyoService - Media directory: {mediaDirectory}");
            Console.WriteLine($"🔧 MaterialApoyoService - Full resolved path: {fullPath}");

            return fullPath;
        }

        public Task<IEnumerable<MaterialApoyoSummaryDto>> GetMaterialApoyoByEducatorAsync(int userId) =>
            throw new NotImplementedException();

        public async Task<IEnumerable<ModuleSummaryDto>> GetMaterialApoyoModulesAsync(string materialApoyoId)
        {
            // Si no es un GUID válido, buscar el material apoyo por título para obtener el ID real
            string actualMaterialApoyoId = materialApoyoId;
            if (!Guid.TryParse(materialApoyoId, out _))
            {
                var materialApoyo = await _context.MaterialApoyo.FirstOrDefaultAsync(c => c.Title == materialApoyoId);
                if (materialApoyo != null)
                {
                    actualMaterialApoyoId = materialApoyo.Id;
                }
            }

            var moduleEntities = await _context.Modulo
                .Where(m => m.MaterialApoyoId == actualMaterialApoyoId)
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
            var module = await _context.Modulo.FirstOrDefaultAsync(m => m.Id == moduleId);

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
                MaterialApoyoId = module.MaterialApoyoId,
                MaterialApoyoName = "" // TODO: Get material apoyo name if needed
            };
        }

        public async Task<ModuleDto> CreateModuleAsync(CreateModuleDto createModuleDto, int userId)
        {
            var module = new Modulo
            {
                Id = Guid.NewGuid().ToString(),
                Title = createModuleDto.Title,
                Description = createModuleDto.Description,
                OrderNumber = createModuleDto.OrderNumber,
                MaterialApoyoId = createModuleDto.MaterialApoyoId,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                UpdatedAt = null
            };

            _context.Modulo.Add(module);
            await _context.SaveChangesAsync();

            return new ModuleDto
            {
                Id = module.Id,
                Title = module.Title,
                Description = module.Description,
                OrderNumber = module.OrderNumber,
                IsActive = module.IsActive,
                MaterialApoyoId = module.MaterialApoyoId,
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
                var module = await _context.Modulo.FirstOrDefaultAsync(m => m.Id == id);
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
                _context.Modulo.Remove(module);

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

        public async Task<object> GetMaterialApoyoStatisticsAsync()
        {
            var totalMaterialApoyo = await _context.MaterialApoyo.CountAsync();
            var activeMaterialApoyo = await _context.MaterialApoyo.CountAsync(m => m.IsActive);
            var featuredMaterialApoyo = await _context.MaterialApoyo.CountAsync(m => m.IsFeatured);
            var totalModules = await _context.Modulo.CountAsync();
            var averageModulesPerMaterial = totalMaterialApoyo > 0 ? (double)totalModules / totalMaterialApoyo : 0;

            return new
            {
                TotalMaterialApoyo = totalMaterialApoyo,
                ActiveMaterialApoyo = activeMaterialApoyo,
                FeaturedMaterialApoyo = featuredMaterialApoyo,
                TotalModules = totalModules,
                AverageModulesPerMaterial = Math.Round(averageModulesPerMaterial, 2)
            };
        }
    }
}