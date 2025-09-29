using CentroCultural.Application.DTOs;

namespace CentroCultural.Application.Interfaces
{
    public interface IDigitalLibraryService
    {
        Task<LibraryItemPagedResultDto> GetItemsAsync(LibrarySearchDto searchDto);
        Task<LibraryItemDto> GetItemByIdAsync(string id);
        Task<LibraryItemDto> CreateItemAsync(CreateLibraryItemDto createItemDto, int userId);
        Task<bool> UpdateItemAsync(string id, UpdateLibraryItemDto updateItemDto, int userId);
        Task<bool> DeleteItemAsync(string id, int userId);

        Task<IEnumerable<LibraryCollectionDto>> GetCollectionsAsync();
        Task<LibraryCollectionDto> GetCollectionByIdAsync(string id);
        Task<LibraryCollectionDto> CreateCollectionAsync(CreateLibraryCollectionDto createCollectionDto, int userId);
        Task<bool> UpdateCollectionAsync(string id, UpdateLibraryCollectionDto updateCollectionDto, int userId);
        Task<bool> DeleteCollectionAsync(string id, int userId);

        Task<bool> AddItemToCollectionAsync(string itemId, string collectionId, int userId);
        Task<bool> RemoveItemFromCollectionAsync(string itemId, string collectionId, int userId);

        Task<LibraryStatsDto> GetStatsAsync();
        Task<bool> IncrementViewCountAsync(string id);
        Task<bool> IncrementDownloadCountAsync(string id);

        Task<IEnumerable<string>> GetAvailableCategoriesAsync();
        Task<IEnumerable<string>> GetAvailableAuthorsAsync();
        Task<IEnumerable<string>> GetAvailableTagsAsync();
        Task<IEnumerable<string>> GetAvailableLanguagesAsync();
        Task<IEnumerable<int>> GetAvailableYearsAsync();
    }
}