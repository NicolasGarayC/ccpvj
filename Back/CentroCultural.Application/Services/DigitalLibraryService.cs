using Microsoft.EntityFrameworkCore;
using CentroCultural.Infrastructure.Data;
using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using CentroCultural.Domain.Entities;
using System.Text.Json;
using System.IO;

namespace CentroCultural.Application.Services
{
    public class DigitalLibraryService : IDigitalLibraryService
    {
        private readonly ApplicationDbContext _context;

        public DigitalLibraryService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<LibraryItemPagedResultDto> GetItemsAsync(LibrarySearchDto searchDto)
        {
            var query = _context.LibraryItems
                .Where(li => li.IsActive)
                .Include(li => li.ItemCollections)
                .ThenInclude(ic => ic.LibraryCollection)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(searchDto.Query))
            {
                var searchTerm = searchDto.Query.ToLower();
                query = query.Where(li =>
                    li.Title.ToLower().Contains(searchTerm) ||
                    (li.Description != null && li.Description.ToLower().Contains(searchTerm)) ||
                    (li.Author != null && li.Author.ToLower().Contains(searchTerm)));
            }

            if (!string.IsNullOrEmpty(searchDto.FileType))
                query = query.Where(li => li.FileType == searchDto.FileType);

            if (!string.IsNullOrEmpty(searchDto.Category))
                query = query.Where(li => li.Category == searchDto.Category);

            if (!string.IsNullOrEmpty(searchDto.Subcategory))
                query = query.Where(li => li.Subcategory == searchDto.Subcategory);

            if (!string.IsNullOrEmpty(searchDto.Author))
                query = query.Where(li => li.Author == searchDto.Author);

            if (!string.IsNullOrEmpty(searchDto.Language))
                query = query.Where(li => li.Language == searchDto.Language);

            if (searchDto.YearFrom.HasValue)
                query = query.Where(li => li.Year >= searchDto.YearFrom.Value);

            if (searchDto.YearTo.HasValue)
                query = query.Where(li => li.Year <= searchDto.YearTo.Value);

            if (searchDto.Tags.Any())
            {
                foreach (var tag in searchDto.Tags)
                {
                    query = query.Where(li => li.Tags != null && li.Tags.Contains(tag));
                }
            }

            if (!string.IsNullOrEmpty(searchDto.CollectionId))
            {
                query = query.Where(li => li.ItemCollections.Any(ic => ic.LibraryCollectionId == searchDto.CollectionId));
            }

            if (searchDto.IsFeatured.HasValue)
                query = query.Where(li => li.IsFeatured == searchDto.IsFeatured.Value);

            // Apply sorting
            query = searchDto.SortBy.ToLower() switch
            {
                "title" => searchDto.SortOrder.ToLower() == "asc" ?
                    query.OrderBy(li => li.Title) : query.OrderByDescending(li => li.Title),
                "author" => searchDto.SortOrder.ToLower() == "asc" ?
                    query.OrderBy(li => li.Author) : query.OrderByDescending(li => li.Author),
                "download_count" => searchDto.SortOrder.ToLower() == "asc" ?
                    query.OrderBy(li => li.DownloadCount) : query.OrderByDescending(li => li.DownloadCount),
                "view_count" => searchDto.SortOrder.ToLower() == "asc" ?
                    query.OrderBy(li => li.ViewCount) : query.OrderByDescending(li => li.ViewCount),
                "file_size" => searchDto.SortOrder.ToLower() == "asc" ?
                    query.OrderBy(li => li.FileSize) : query.OrderByDescending(li => li.FileSize),
                _ => searchDto.SortOrder.ToLower() == "asc" ?
                    query.OrderBy(li => li.CreatedAt) : query.OrderByDescending(li => li.CreatedAt)
            };

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply pagination
            var items = await query
                .Skip((searchDto.Page - 1) * searchDto.PageSize)
                .Take(searchDto.PageSize)
                .ToListAsync();

            var totalPages = (int)Math.Ceiling((double)totalCount / searchDto.PageSize);

            return new LibraryItemPagedResultDto
            {
                Items = items.Select(MapToDto).ToList(),
                TotalCount = totalCount,
                Page = searchDto.Page,
                PageSize = searchDto.PageSize,
                TotalPages = totalPages,
                HasNextPage = searchDto.Page < totalPages,
                HasPreviousPage = searchDto.Page > 1
            };
        }

        public async Task<LibraryItemDto?> GetItemByIdAsync(string id)
        {
            var item = await _context.LibraryItems
                .Include(li => li.ItemCollections)
                .ThenInclude(ic => ic.LibraryCollection)
                .FirstOrDefaultAsync(li => li.Id == id && li.IsActive);

            return item != null ? MapToDto(item) : null;
        }

        public async Task<LibraryItemDto> CreateItemAsync(CreateLibraryItemDto createItemDto, int userId)
        {
            var item = new LibraryItem
            {
                Id = Guid.NewGuid().ToString(),
                Title = createItemDto.Title,
                Description = createItemDto.Description,
                Author = createItemDto.Author,
                CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                UploadedBy = userId.ToString(),
                FileType = createItemDto.FileType,
                FilePath = createItemDto.FilePath,
                FileName = createItemDto.FileName,
                FileSize = createItemDto.FileSize,
                MimeType = createItemDto.MimeType,
                Tags = createItemDto.Tags.Any() ? JsonSerializer.Serialize(createItemDto.Tags) : null,
                Language = createItemDto.Language,
                Year = createItemDto.Year,
                Category = createItemDto.Category,
                Subcategory = createItemDto.Subcategory,
                IsFeatured = createItemDto.IsFeatured,
                IsActive = true
            };

            _context.LibraryItems.Add(item);
            await _context.SaveChangesAsync();

            // Add to collections if specified
            if (createItemDto.CollectionIds.Any())
            {
                await AddItemToCollectionsAsync(item.Id, createItemDto.CollectionIds, userId);
            }

            return await GetItemByIdAsync(item.Id) ?? throw new InvalidOperationException("Failed to retrieve created item");
        }

        public async Task<bool> UpdateItemAsync(string id, UpdateLibraryItemDto updateItemDto, int userId)
        {
            var item = await _context.LibraryItems.FirstOrDefaultAsync(li => li.Id == id);
            if (item == null) return false;

            item.Title = updateItemDto.Title;
            item.Description = updateItemDto.Description;
            item.Author = updateItemDto.Author;
            item.Tags = updateItemDto.Tags.Any() ? JsonSerializer.Serialize(updateItemDto.Tags) : null;
            item.Language = updateItemDto.Language;
            item.Year = updateItemDto.Year;
            item.Category = updateItemDto.Category;
            item.Subcategory = updateItemDto.Subcategory;
            item.IsFeatured = updateItemDto.IsFeatured;
            item.IsActive = updateItemDto.IsActive;
            item.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            // Update file fields if provided (when file is replaced)
            if (!string.IsNullOrEmpty(updateItemDto.FileType))
                item.FileType = updateItemDto.FileType;

            if (!string.IsNullOrEmpty(updateItemDto.FilePath))
                item.FilePath = updateItemDto.FilePath;

            if (!string.IsNullOrEmpty(updateItemDto.FileName))
                item.FileName = updateItemDto.FileName;

            if (updateItemDto.FileSize.HasValue)
                item.FileSize = updateItemDto.FileSize.Value;

            if (!string.IsNullOrEmpty(updateItemDto.MimeType))
                item.MimeType = updateItemDto.MimeType;

            // Update collections
            await UpdateItemCollectionsAsync(id, updateItemDto.CollectionIds, userId);

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteItemAsync(string id, int userId)
        {
            try
            {
                var item = await _context.LibraryItems.FirstOrDefaultAsync(li => li.Id == id);
                if (item == null) return false;

                // Store file path before deletion for cleanup
                string? filePathToDelete = null;
                if (!string.IsNullOrEmpty(item.FilePath))
                {
                    filePathToDelete = item.FilePath;
                }

                // Remove from collections first
                var itemCollections = await _context.LibraryItemCollections
                    .Where(ic => ic.LibraryItemId == id)
                    .ToListAsync();
                _context.LibraryItemCollections.RemoveRange(itemCollections);

                // Soft delete the item
                item.IsActive = false;
                item.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

                await _context.SaveChangesAsync();

                // Delete physical file
                if (!string.IsNullOrEmpty(filePathToDelete))
                {
                    await DeletePhysicalFile(filePathToDelete);
                }

                return true;
            }
            catch (Exception)
            {
                throw;
            }
        }

        // Collection operations
        public async Task<IEnumerable<LibraryCollectionDto>> GetCollectionsAsync()
        {
            var collections = await _context.LibraryCollections
                .Where(lc => lc.IsActive)
                .Include(lc => lc.ItemCollections)
                .ThenInclude(ic => ic.LibraryItem)
                .OrderBy(lc => lc.OrderNumber)
                .ThenBy(lc => lc.Name)
                .ToListAsync();

            return collections.Select(MapCollectionToDto);
        }

        public async Task<LibraryCollectionDto?> GetCollectionByIdAsync(string id)
        {
            var collection = await _context.LibraryCollections
                .Include(lc => lc.ItemCollections)
                .ThenInclude(ic => ic.LibraryItem)
                .FirstOrDefaultAsync(lc => lc.Id == id && lc.IsActive);

            return collection != null ? MapCollectionToDto(collection) : null;
        }

        public async Task<LibraryCollectionDto> CreateCollectionAsync(CreateLibraryCollectionDto createCollectionDto, int userId)
        {
            var collection = new LibraryCollection
            {
                Id = Guid.NewGuid().ToString(),
                Name = createCollectionDto.Name,
                Description = createCollectionDto.Description,
                CoverImage = createCollectionDto.CoverImage,
                ColorTheme = createCollectionDto.ColorTheme,
                CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                CreatedBy = userId.ToString(),
                OrderNumber = createCollectionDto.OrderNumber,
                IsFeatured = createCollectionDto.IsFeatured,
                IsActive = true
            };

            _context.LibraryCollections.Add(collection);
            await _context.SaveChangesAsync();

            return await GetCollectionByIdAsync(collection.Id) ?? throw new InvalidOperationException("Failed to retrieve created collection");
        }

        public async Task<bool> UpdateCollectionAsync(string id, UpdateLibraryCollectionDto updateCollectionDto, int userId)
        {
            var collection = await _context.LibraryCollections.FirstOrDefaultAsync(lc => lc.Id == id);
            if (collection == null) return false;

            // 🧹 Track old cover image for cleanup if it's being replaced
            string? oldCoverImageToDelete = null;
            if (!string.IsNullOrEmpty(collection.CoverImage) &&
                collection.CoverImage != updateCollectionDto.CoverImage)
            {
                oldCoverImageToDelete = collection.CoverImage;
            }

            collection.Name = updateCollectionDto.Name;
            collection.Description = updateCollectionDto.Description;
            collection.CoverImage = updateCollectionDto.CoverImage;
            collection.ColorTheme = updateCollectionDto.ColorTheme;
            collection.OrderNumber = updateCollectionDto.OrderNumber;
            collection.IsFeatured = updateCollectionDto.IsFeatured;
            collection.IsActive = updateCollectionDto.IsActive;
            collection.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            await _context.SaveChangesAsync();

            // 🧹 Delete old cover image file if it was replaced
            if (!string.IsNullOrEmpty(oldCoverImageToDelete))
            {
                await DeletePhysicalFile(oldCoverImageToDelete);
            }

            return true;
        }

        public async Task<bool> DeleteCollectionAsync(string id, int userId)
        {
            var collection = await _context.LibraryCollections.FirstOrDefaultAsync(lc => lc.Id == id);
            if (collection == null) return false;

            // Remove all item associations first
            var itemCollections = await _context.LibraryItemCollections
                .Where(ic => ic.LibraryCollectionId == id)
                .ToListAsync();
            _context.LibraryItemCollections.RemoveRange(itemCollections);

            // Soft delete the collection
            collection.IsActive = false;
            collection.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            await _context.SaveChangesAsync();
            return true;
        }

        // Collection item management
        public async Task<bool> AddItemToCollectionAsync(string itemId, string collectionId, int userId)
        {
            // Check if association already exists
            var existingAssociation = await _context.LibraryItemCollections
                .FirstOrDefaultAsync(ic => ic.LibraryItemId == itemId && ic.LibraryCollectionId == collectionId);

            if (existingAssociation != null) return true; // Already exists

            var nextOrder = await _context.LibraryItemCollections
                .Where(ic => ic.LibraryCollectionId == collectionId)
                .MaxAsync(ic => (int?)ic.OrderNumber) ?? 0;

            var itemCollection = new LibraryItemCollection
            {
                Id = Guid.NewGuid().ToString(),
                LibraryItemId = itemId,
                LibraryCollectionId = collectionId,
                OrderNumber = nextOrder + 1,
                AddedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                AddedBy = userId.ToString()
            };

            _context.LibraryItemCollections.Add(itemCollection);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveItemFromCollectionAsync(string itemId, string collectionId, int userId)
        {
            var itemCollection = await _context.LibraryItemCollections
                .FirstOrDefaultAsync(ic => ic.LibraryItemId == itemId && ic.LibraryCollectionId == collectionId);

            if (itemCollection == null) return false;

            _context.LibraryItemCollections.Remove(itemCollection);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ReorderItemInCollectionAsync(string itemId, string collectionId, int newOrder, int userId)
        {
            var itemCollection = await _context.LibraryItemCollections
                .FirstOrDefaultAsync(ic => ic.LibraryItemId == itemId && ic.LibraryCollectionId == collectionId);

            if (itemCollection == null) return false;

            itemCollection.OrderNumber = newOrder;
            await _context.SaveChangesAsync();
            return true;
        }

        // Statistics
        public async Task<LibraryStatsDto> GetStatsAsync()
        {
            var totalItems = await _context.LibraryItems.CountAsync(li => li.IsActive);
            var totalCollections = await _context.LibraryCollections.CountAsync(lc => lc.IsActive);

            var fileTypeDistribution = await _context.LibraryItems
                .Where(li => li.IsActive)
                .GroupBy(li => li.FileType)
                .Select(g => new { FileType = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.FileType, x => x.Count);

            var categoryDistribution = await _context.LibraryItems
                .Where(li => li.IsActive && li.Category != null)
                .GroupBy(li => li.Category)
                .Select(g => new { Category = g.Key!, Count = g.Count() })
                .ToDictionaryAsync(x => x.Category, x => x.Count);

            var languageDistribution = await _context.LibraryItems
                .Where(li => li.IsActive && li.Language != null)
                .GroupBy(li => li.Language)
                .Select(g => new { Language = g.Key!, Count = g.Count() })
                .ToDictionaryAsync(x => x.Language, x => x.Count);

            var mostDownloaded = await _context.LibraryItems
                .Where(li => li.IsActive)
                .OrderByDescending(li => li.DownloadCount)
                .Take(10)
                .Select(li => MapToSummaryDto(li))
                .ToListAsync();

            var mostViewed = await _context.LibraryItems
                .Where(li => li.IsActive)
                .OrderByDescending(li => li.ViewCount)
                .Take(10)
                .Select(li => MapToSummaryDto(li))
                .ToListAsync();

            var recentlyAdded = await _context.LibraryItems
                .Where(li => li.IsActive)
                .OrderByDescending(li => li.CreatedAt)
                .Take(10)
                .Select(li => MapToSummaryDto(li))
                .ToListAsync();

            return new LibraryStatsDto
            {
                TotalItems = totalItems,
                TotalCollections = totalCollections,
                FileTypeDistribution = fileTypeDistribution,
                CategoryDistribution = categoryDistribution,
                LanguageDistribution = languageDistribution,
                MostDownloaded = mostDownloaded,
                MostViewed = mostViewed,
                RecentlyAdded = recentlyAdded
            };
        }

        public async Task<bool> IncrementViewCountAsync(string itemId)
        {
            var item = await _context.LibraryItems.FirstOrDefaultAsync(li => li.Id == itemId);
            if (item == null) return false;

            item.ViewCount++;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> IncrementDownloadCountAsync(string itemId)
        {
            var item = await _context.LibraryItems.FirstOrDefaultAsync(li => li.Id == itemId);
            if (item == null) return false;

            item.DownloadCount++;
            await _context.SaveChangesAsync();
            return true;
        }

        // Utility methods
        public async Task<IEnumerable<string>> GetAvailableCategoriesAsync()
        {
            // Siempre devolver categorías predefinidas para que estén disponibles al crear recursos
            var predefinedCategories = new List<string>
            {
                "Literatura",
                "Historia",
                "Arte y Música",
                "Ciencias Sociales",
                "Ciencias Exactas",
                "Educación",
                "Filosofía",
                "Medio Ambiente",
                "Política",
                "Cultura Popular",
                "Derechos Humanos",
                "Tecnología",
                "Salud",
                "Economía",
                "Documentales"
            };

            // Obtener categorías que existen en la base de datos
            var dbCategories = await _context.LibraryItems
                .Where(li => li.IsActive && li.Category != null)
                .Select(li => li.Category!)
                .Distinct()
                .ToListAsync();

            // Combinar categorías predefinidas con las de la base de datos (si hay alguna personalizada)
            var allCategories = predefinedCategories
                .Union(dbCategories)
                .Distinct()
                .OrderBy(c => c)
                .ToList();

            return allCategories;
        }

        public async Task<IEnumerable<string>> GetAvailableAuthorsAsync()
        {
            return await _context.LibraryItems
                .Where(li => li.IsActive && li.Author != null)
                .Select(li => li.Author!)
                .Distinct()
                .OrderBy(a => a)
                .ToListAsync();
        }

        public async Task<IEnumerable<string>> GetAvailableTagsAsync()
        {
            var items = await _context.LibraryItems
                .Where(li => li.IsActive && li.Tags != null)
                .Select(li => li.Tags!)
                .ToListAsync();

            var allTags = new HashSet<string>();
            foreach (var tagJson in items)
            {
                try
                {
                    var tags = JsonSerializer.Deserialize<List<string>>(tagJson);
                    if (tags != null)
                    {
                        foreach (var tag in tags)
                        {
                            allTags.Add(tag);
                        }
                    }
                }
                catch
                {
                    // Skip invalid JSON
                }
            }

            return allTags.OrderBy(t => t);
        }

        public async Task<IEnumerable<string>> GetAvailableLanguagesAsync()
        {
            return await _context.LibraryItems
                .Where(li => li.IsActive && li.Language != null)
                .Select(li => li.Language!)
                .Distinct()
                .OrderBy(l => l)
                .ToListAsync();
        }

        public async Task<IEnumerable<int>> GetAvailableYearsAsync()
        {
            return await _context.LibraryItems
                .Where(li => li.IsActive && li.Year.HasValue)
                .Select(li => li.Year!.Value)
                .Distinct()
                .OrderByDescending(y => y)
                .ToListAsync();
        }

        // Private helper methods
        private LibraryItemDto MapToDto(LibraryItem item)
        {
            var tags = new List<string>();
            if (!string.IsNullOrEmpty(item.Tags))
            {
                try
                {
                    tags = JsonSerializer.Deserialize<List<string>>(item.Tags) ?? new List<string>();
                }
                catch
                {
                    // Skip invalid JSON
                }
            }

            return new LibraryItemDto
            {
                Id = item.Id,
                Title = item.Title,
                Description = item.Description,
                Author = item.Author,
                CreatedAt = DateTimeOffset.FromUnixTimeSeconds(item.CreatedAt).DateTime,
                UpdatedAt = item.UpdatedAt.HasValue ? DateTimeOffset.FromUnixTimeSeconds(item.UpdatedAt.Value).DateTime : null,
                UploadedBy = item.UploadedBy,
                FileType = item.FileType,
                FilePath = item.FilePath,
                FileName = item.FileName,
                FileSize = item.FileSize,
                MimeType = item.MimeType,
                Tags = tags,
                Language = item.Language,
                Year = item.Year,
                Category = item.Category,
                Subcategory = item.Subcategory,
                DownloadCount = item.DownloadCount,
                ViewCount = item.ViewCount,
                IsActive = item.IsActive,
                IsFeatured = item.IsFeatured,
                Collections = item.ItemCollections.Select(ic => new LibraryCollectionSummaryDto
                {
                    Id = ic.LibraryCollection.Id,
                    Name = ic.LibraryCollection.Name,
                    Description = ic.LibraryCollection.Description,
                    CoverImage = ic.LibraryCollection.CoverImage,
                    ColorTheme = ic.LibraryCollection.ColorTheme,
                    IsFeatured = ic.LibraryCollection.IsFeatured,
                    ItemCount = ic.LibraryCollection.ItemCollections.Count
                }).ToList()
            };
        }

        private static LibraryItemSummaryDto MapToSummaryDto(LibraryItem item)
        {
            return new LibraryItemSummaryDto
            {
                Id = item.Id,
                Title = item.Title,
                Author = item.Author,
                FileType = item.FileType,
                Category = item.Category,
                CreatedAt = DateTimeOffset.FromUnixTimeSeconds(item.CreatedAt).DateTime,
                DownloadCount = item.DownloadCount,
                IsFeatured = item.IsFeatured
            };
        }

        private LibraryCollectionDto MapCollectionToDto(LibraryCollection collection)
        {
            return new LibraryCollectionDto
            {
                Id = collection.Id,
                Name = collection.Name,
                Description = collection.Description,
                CoverImage = collection.CoverImage,
                ColorTheme = collection.ColorTheme,
                CreatedAt = DateTimeOffset.FromUnixTimeSeconds(collection.CreatedAt).DateTime,
                UpdatedAt = collection.UpdatedAt.HasValue ? DateTimeOffset.FromUnixTimeSeconds(collection.UpdatedAt.Value).DateTime : null,
                CreatedBy = collection.CreatedBy,
                OrderNumber = collection.OrderNumber,
                IsActive = collection.IsActive,
                IsFeatured = collection.IsFeatured,
                ItemCount = collection.ItemCollections.Count(ic => ic.LibraryItem.IsActive),
                Items = collection.ItemCollections
                    .Where(ic => ic.LibraryItem.IsActive)
                    .OrderBy(ic => ic.OrderNumber)
                    .Select(ic => MapToSummaryDto(ic.LibraryItem))
                    .ToList()
            };
        }

        private async Task AddItemToCollectionsAsync(string itemId, List<string> collectionIds, int userId)
        {
            foreach (var collectionId in collectionIds)
            {
                await AddItemToCollectionAsync(itemId, collectionId, userId);
            }
        }

        private async Task UpdateItemCollectionsAsync(string itemId, List<string> newCollectionIds, int userId)
        {
            // Remove from collections not in the new list
            var currentCollections = await _context.LibraryItemCollections
                .Where(ic => ic.LibraryItemId == itemId)
                .ToListAsync();

            var collectionsToRemove = currentCollections
                .Where(ic => !newCollectionIds.Contains(ic.LibraryCollectionId))
                .ToList();

            _context.LibraryItemCollections.RemoveRange(collectionsToRemove);

            // Add to new collections
            var currentCollectionIds = currentCollections.Select(ic => ic.LibraryCollectionId).ToList();
            var collectionsToAdd = newCollectionIds.Where(id => !currentCollectionIds.Contains(id)).ToList();

            foreach (var collectionId in collectionsToAdd)
            {
                await AddItemToCollectionAsync(itemId, collectionId, userId);
            }
        }

        private async Task DeletePhysicalFile(string relativePath)
        {
            await Task.Run(() =>
            {
                try
                {
                    var fullPath = GetFullMediaPath(relativePath);

                    if (File.Exists(fullPath))
                    {
                        File.Delete(fullPath);
                    }
                }
                catch (Exception)
                {
                    // Continue execution even if file deletion fails
                }
            });
        }

        private string GetFullMediaPath(string relativePath)
        {
            // Convert relative path to full file system path
            var cleanPath = relativePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);

            // Remove 'media/' prefix if present (paths in DB include '/media/' prefix)
            if (cleanPath.StartsWith("media" + Path.DirectorySeparatorChar))
            {
                cleanPath = cleanPath.Substring(("media" + Path.DirectorySeparatorChar).Length);
            }

            // Construct full path to media directory
            var mediaDirectory = Path.Combine(Directory.GetCurrentDirectory(), "Data", "media");
            var fullPath = Path.Combine(mediaDirectory, cleanPath);

            return fullPath;
        }
    }
}