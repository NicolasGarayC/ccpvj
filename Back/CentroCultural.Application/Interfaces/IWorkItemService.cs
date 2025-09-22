using CentroCultural.Application.DTOs;

namespace CentroCultural.Application.Interfaces
{
    public interface IWorkItemService
    {
        Task<IEnumerable<WorkItemDto>> GetWorkItemsByModuleAsync(string moduleId);
        Task<WorkItemDetailDto?> GetWorkItemByIdAsync(string id);
        Task<IEnumerable<MediaFileDto>> GetWorkItemMediaAsync(string workItemId);
        Task<WorkItemDto> CreateWorkItemAsync(CreateWorkItemDto workItemDto, string userId);
        Task<bool> UpdateWorkItemAsync(string id, UpdateWorkItemDto workItemDto, string userId);
        Task<bool> DeleteWorkItemAsync(string id, string userId);
        Task<bool> ReorderWorkItemAsync(string id, int newOrderNumber, string userId);
        Task<IEnumerable<WorkItemWithModuleDto>> GetWorkItemsByCourseAsync(string courseId);
    }
}