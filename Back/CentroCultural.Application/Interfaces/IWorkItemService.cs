using CentroCultural.Application.DTOs;

namespace CentroCultural.Application.Interfaces
{
    public interface IWorkItemService
    {
        Task<IEnumerable<WorkItemDto>> GetWorkItemsByModuleAsync(Guid moduleId);
        Task<WorkItemDetailDto?> GetWorkItemByIdAsync(Guid id);
        Task<IEnumerable<MediaFileDto>> GetWorkItemMediaAsync(Guid workItemId);
        Task<WorkItemDto> CreateWorkItemAsync(CreateWorkItemDto workItemDto, string userId);
        Task<bool> UpdateWorkItemAsync(Guid id, UpdateWorkItemDto workItemDto, string userId);
        Task<bool> DeleteWorkItemAsync(Guid id, string userId);
        Task<bool> ReorderWorkItemAsync(Guid id, int newOrderNumber, string userId);
        Task<IEnumerable<WorkItemWithModuleDto>> GetWorkItemsByCourseAsync(Guid courseId);
    }
}