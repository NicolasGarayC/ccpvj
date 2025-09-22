using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using CentroCultural.Infrastructure.Data;
using CentroCultural.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CentroCultural.Application.Services
{
    public class WorkItemService : IWorkItemService
    {
        private readonly ApplicationDbContext _context;

        public WorkItemService(ApplicationDbContext context)
        {
            _context = context;
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
                    CreatedAt = mp.CreatedAt,
                    UpdatedAt = mp.UpdatedAt
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
                AuthorId = int.TryParse(userId, out var authorId) ? authorId : 1, // Default to user ID 1
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
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
                CreatedAt = modulePost.CreatedAt,
                UpdatedAt = modulePost.UpdatedAt
            };
        }

        public Task<bool> UpdateWorkItemAsync(string id, UpdateWorkItemDto workItemDto, string userId)
        {
            throw new NotImplementedException();
        }

        public Task<bool> DeleteWorkItemAsync(string id, string userId)
        {
            throw new NotImplementedException();
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