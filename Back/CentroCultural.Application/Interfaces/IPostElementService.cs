using CentroCultural.Application.DTOs;

namespace CentroCultural.Application.Interfaces
{
    public interface IPostElementService
    {
        Task<IEnumerable<PostElementDto>> GetElementsByPostIdAsync(string postId);
        Task<PostElementDto?> GetElementByIdAsync(string elementId);
        Task<PostElementDto> CreateElementAsync(CreatePostElementDto createElementDto, int userId);
        Task<IEnumerable<PostElementDto>> CreateElementsInBatchAsync(CreateElementsBatchDto batchDto, int userId);
        Task<bool> UpdateElementAsync(string elementId, UpdatePostElementDto updateElementDto, int userId);
        Task<bool> DeleteElementAsync(string elementId, int userId);
        Task<bool> ReorderElementAsync(string elementId, int newOrderNumber, int userId);
        Task<bool> DeleteElementsByPostIdAsync(string postId, int userId);
    }
}