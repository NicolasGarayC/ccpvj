using CentroCultural.Application.DTOs;

namespace CentroCultural.Application.Interfaces
{
    public interface IBlogService
    {
        // Blog Post CRUD Operations
        Task<BlogPostPagedResultDto> GetBlogPostsAsync(BlogPostSearchDto searchDto);
        Task<BlogPostDto?> GetBlogPostByIdAsync(Guid id);
        Task<BlogPostDto?> GetBlogPostBySlugAsync(string slug);
        Task<BlogPostDto> CreateBlogPostAsync(CreateBlogPostDto createDto, int authorId);
        Task<BlogPostDto?> UpdateBlogPostAsync(Guid id, UpdateBlogPostDto updateDto, int userId);
        Task<bool> DeleteBlogPostAsync(Guid id, int userId);
        Task<bool> PublishBlogPostAsync(Guid id, int userId);
        Task<bool> UnpublishBlogPostAsync(Guid id, int userId);
        Task<bool> IncrementViewsAsync(Guid id);

        // Blog Categories
        Task<IEnumerable<BlogCategoryDto>> GetBlogCategoriesAsync();
        Task<BlogCategoryDto?> GetBlogCategoryByIdAsync(Guid id);
        Task<BlogCategoryDto> CreateBlogCategoryAsync(CreateBlogCategoryDto createDto);
        Task<BlogCategoryDto?> UpdateBlogCategoryAsync(Guid id, UpdateBlogCategoryDto updateDto);
        Task<bool> DeleteBlogCategoryAsync(Guid id);

        // Featured and popular posts
        Task<IEnumerable<BlogPostSummaryDto>> GetFeaturedPostsAsync(int count = 5);
        Task<IEnumerable<BlogPostSummaryDto>> GetPopularPostsAsync(int count = 10);
        Task<IEnumerable<BlogPostSummaryDto>> GetRecentPostsAsync(int count = 10);

        // Blog statistics
        Task<object> GetBlogStatisticsAsync();

        // Slug utilities
        Task<string> GenerateUniqueSlugAsync(string title, Guid? excludePostId = null);
        Task<bool> IsSlugAvailableAsync(string slug, Guid? excludePostId = null);
    }
}