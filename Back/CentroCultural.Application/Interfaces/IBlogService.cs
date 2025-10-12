using CentroCultural.Application.DTOs;

namespace CentroCultural.Application.Interfaces
{
    public interface IBlogService
    {
        // Blog Post CRUD Operations
        Task<BlogPostPagedResultDto> GetBlogPostsAsync(BlogPostSearchDto searchDto);
        Task<BlogPostDto?> GetBlogPostByIdAsync(string id);
        Task<BlogPostDto?> GetBlogPostBySlugAsync(string slug);
        Task<BlogPostDto?> GetBlogPostBySlugAsync(string slug, int? currentUserId);
        Task<BlogPostDto> CreateBlogPostAsync(CreateBlogPostDto createDto, int authorId);
        Task<BlogPostDto?> UpdateBlogPostAsync(string id, UpdateBlogPostDto updateDto, int userId);
        Task<bool> DeleteBlogPostAsync(string id, int userId);
        Task<bool> PublishBlogPostAsync(string id, int userId);
        Task<bool> UnpublishBlogPostAsync(string id, int userId);
        Task<bool> IncrementViewsAsync(string id);

        // Blog Categories - All methods removed due to category system elimination
        // The following method signatures have been removed:
        // - Task<IEnumerable<BlogCategoryDto>> GetBlogCategoriesAsync()
        // - Task<BlogCategoryDto?> GetBlogCategoryByIdAsync(Guid id)
        // - Task<BlogCategoryDto> CreateBlogCategoryAsync(CreateBlogCategoryDto createDto)
        // - Task<BlogCategoryDto?> UpdateBlogCategoryAsync(Guid id, UpdateBlogCategoryDto updateDto)
        // - Task<bool> DeleteBlogCategoryAsync(Guid id)

        // Featured and popular posts
        Task<IEnumerable<BlogPostSummaryDto>> GetFeaturedPostsAsync(int count = 5);
        Task<IEnumerable<BlogPostSummaryDto>> GetPopularPostsAsync(int count = 10);
        Task<IEnumerable<BlogPostSummaryDto>> GetRecentPostsAsync(int count = 10);

        // Blog statistics
        Task<object> GetBlogStatisticsAsync();

        // Slug utilities
        Task<string> GenerateUniqueSlugAsync(string title, string? excludePostId = null);
        Task<bool> IsSlugAvailableAsync(string slug, string? excludePostId = null);
    }
}