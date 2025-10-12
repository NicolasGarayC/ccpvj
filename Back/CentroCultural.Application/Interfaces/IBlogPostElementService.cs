using CentroCultural.Application.DTOs;

namespace CentroCultural.Application.Interfaces
{
    public interface IBlogPostElementService
    {
        Task<IEnumerable<BlogPostElementDto>> GetElementsByBlogPostIdAsync(string blogPostId);
        Task<BlogPostElementDto?> GetElementByIdAsync(string elementId);
        Task<BlogPostElementDto> CreateElementAsync(CreateBlogPostElementDto createElementDto, int userId);
        Task<BlogPostElementDto> UpdateElementAsync(string elementId, UpdateBlogPostElementDto updateElementDto, int userId);
        Task<bool> DeleteElementAsync(string elementId, int userId);
        Task<IEnumerable<BlogPostElementDto>> CreateElementsInBatchAsync(string blogPostId, IEnumerable<CreateBlogPostElementDto> elements, int userId);
        Task<bool> ReorderElementAsync(string elementId, int newOrderNumber, int userId);
        Task DeleteElementsByBlogPostIdAsync(string blogPostId, int userId);
    }
}
