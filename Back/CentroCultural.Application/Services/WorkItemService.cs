using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using CentroCultural.Infrastructure.Data;
using CentroCultural.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

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
        public async Task<IEnumerable<WorkItemDto>> GetWorkItemsByModuleAsync(string moduleId)
        {
            var modulePosts = await _context.ModulePosts
                .Where(mp => mp.ModuleId == moduleId && mp.IsActive)
                .OrderBy(mp => mp.OrderNumber)
                .Select(mp => new WorkItemDto
                {
                    Id = mp.Id,
                    Title = mp.Title,
                    Description = mp.Subtitle, // Using subtitle as description
                    LongText = mp.Content,
                    OrderNumber = mp.OrderNumber,
                    ModuleId = mp.ModuleId,
                    ImagePath = mp.ImagePath,
                    VideoPath = mp.VideoPath,
                    IsActive = mp.IsActive,
                    CreatedAt = DateTimeOffset.FromUnixTimeSeconds(mp.CreatedAt).DateTime,
                    UpdatedAt = mp.UpdatedAt.HasValue ? DateTimeOffset.FromUnixTimeSeconds(mp.UpdatedAt.Value).DateTime : null
                })
                .ToListAsync();

            return modulePosts;
        }

        public Task<WorkItemDetailDto?> GetWorkItemByIdAsync(string id)
        {
            return Task.FromResult<WorkItemDetailDto?>(null);
        }

        public Task<IEnumerable<MediaFileDto>> GetWorkItemMediaAsync(string workItemId)
        {
            return Task.FromResult(Enumerable.Empty<MediaFileDto>());
        }

        public async Task<WorkItemDto> CreateWorkItemAsync(CreateWorkItemDto workItemDto, string userId)
        {
            var modulePost = new ModulePost
            {
                Id = Guid.NewGuid().ToString(),
                Title = workItemDto.Title,
                Subtitle = workItemDto.Description, // Map description to subtitle
                Content = workItemDto.LongText,
                OrderNumber = workItemDto.OrderNumber,
                ModuleId = workItemDto.ModuleId,
                ImagePath = workItemDto.ImagePath,
                VideoPath = workItemDto.VideoPath,
                AuthorId = userId, // Store as string
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                UpdatedAt = null
            };

            _context.ModulePosts.Add(modulePost);
            await _context.SaveChangesAsync();

            return new WorkItemDto
            {
                Id = modulePost.Id,
                Title = modulePost.Title,
                Description = modulePost.Subtitle,
                LongText = modulePost.Content,
                OrderNumber = modulePost.OrderNumber,
                ModuleId = modulePost.ModuleId,
                ImagePath = modulePost.ImagePath,
                VideoPath = modulePost.VideoPath,
                IsActive = modulePost.IsActive,
                CreatedAt = DateTimeOffset.FromUnixTimeSeconds(modulePost.CreatedAt).DateTime,
                UpdatedAt = modulePost.UpdatedAt.HasValue ? DateTimeOffset.FromUnixTimeSeconds(modulePost.UpdatedAt.Value).DateTime : null
            };
        }

        public async Task<bool> UpdateWorkItemAsync(string id, UpdateWorkItemDto workItemDto, string userId)
        {
            try
            {
                var post = await _context.ModulePosts.FirstOrDefaultAsync(p => p.Id == id);

                if (post == null)
                    return false;

                // Update post properties
                post.Title = workItemDto.Title;
                post.Subtitle = workItemDto.Description; // Map description to subtitle
                post.Content = workItemDto.LongText;
                post.OrderNumber = workItemDto.OrderNumber;
                post.ImagePath = workItemDto.ImagePath;
                post.VideoPath = workItemDto.VideoPath;
                post.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating WorkItem: {WorkItemId}", id);
                return false;
            }
        }

        public async Task<bool> DeleteWorkItemAsync(string id, string userId)
        {
            try
            {
                var post = await _context.ModulePosts.FirstOrDefaultAsync(p => p.Id == id);

                if (post == null)
                    return false;

                // Collect multimedia files to delete BEFORE database deletion
                var mediaFilesToDelete = new List<string>();

                if (!string.IsNullOrEmpty(post.ImagePath))
                    mediaFilesToDelete.Add(post.ImagePath);
                if (!string.IsNullOrEmpty(post.VideoPath))
                    mediaFilesToDelete.Add(post.VideoPath);
                if (!string.IsNullOrEmpty(post.AudioPath))
                    mediaFilesToDelete.Add(post.AudioPath);

                // HARD DELETE - remove completely from database to ensure multimedia cleanup
                _context.ModulePosts.Remove(post);

                // Save database changes first
                await _context.SaveChangesAsync();

                // Delete physical multimedia files after successful database deletion
                await DeleteMultiMediaFiles(mediaFilesToDelete);

                _logger.LogInformation("Successfully deleted WorkItem {WorkItemId} with {MediaCount} media files",
                    id, mediaFilesToDelete.Count);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting WorkItem: {WorkItemId}", id);
                return false;
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
                        _logger.LogInformation("Deleted media file: {FilePath}", fullPath);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Warning: Could not delete media file {FilePath}", filePath);
                    // Continue with other files even if one fails
                }
            }
        }

        private string GetFullMediaPath(string relativePath)
        {
            // Adjust this path based on your media storage configuration
            var mediaRoot = Path.Combine(Directory.GetCurrentDirectory(), "..", "Data", "media");
            return Path.Combine(mediaRoot, relativePath.TrimStart('/'));
        }

        public Task<bool> ReorderWorkItemAsync(string id, int newOrderNumber, string userId)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<WorkItemWithModuleDto>> GetWorkItemsByCourseAsync(string courseId)
        {
            return Task.FromResult(Enumerable.Empty<WorkItemWithModuleDto>());
        }
    }
}