using System.ComponentModel.DataAnnotations;

namespace CentroCultural.Application.DTOs
{
    // DTOs para LibraryItem
    public class LibraryItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Author { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string UploadedBy { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string? MimeType { get; set; }
        public List<string> Tags { get; set; } = new();
        public string? Language { get; set; }
        public int? Year { get; set; }
        public string? Category { get; set; }
        public string? Subcategory { get; set; }
        public int DownloadCount { get; set; }
        public int ViewCount { get; set; }
        public bool IsActive { get; set; }
        public bool IsFeatured { get; set; }
        public List<LibraryCollectionSummaryDto> Collections { get; set; } = new();
    }

    public class CreateLibraryItemDto
    {
        [Required]
        [MaxLength(500)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [MaxLength(200)]
        public string? Author { get; set; }

        [Required]
        [MaxLength(20)]
        public string FileType { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string FilePath { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string FileName { get; set; } = string.Empty;

        public long FileSize { get; set; }

        [MaxLength(100)]
        public string? MimeType { get; set; }

        public List<string> Tags { get; set; } = new();

        [MaxLength(10)]
        public string? Language { get; set; } = "es";

        public int? Year { get; set; }

        [MaxLength(100)]
        public string? Category { get; set; }

        [MaxLength(100)]
        public string? Subcategory { get; set; }

        public bool IsFeatured { get; set; } = false;

        public List<string> CollectionIds { get; set; } = new();
    }

    public class UpdateLibraryItemDto
    {
        [Required]
        [MaxLength(500)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [MaxLength(200)]
        public string? Author { get; set; }

        public List<string> Tags { get; set; } = new();

        [MaxLength(10)]
        public string? Language { get; set; }

        public int? Year { get; set; }

        [MaxLength(100)]
        public string? Category { get; set; }

        [MaxLength(100)]
        public string? Subcategory { get; set; }

        public bool IsFeatured { get; set; }

        public bool IsActive { get; set; }

        public List<string> CollectionIds { get; set; } = new();
    }

    // DTOs para LibraryCollection
    public class LibraryCollectionDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? CoverImage { get; set; }
        public string? ColorTheme { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public int OrderNumber { get; set; }
        public bool IsActive { get; set; }
        public bool IsFeatured { get; set; }
        public int ItemCount { get; set; }
        public List<LibraryItemSummaryDto> Items { get; set; } = new();
    }

    public class LibraryCollectionSummaryDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? CoverImage { get; set; }
        public string? ColorTheme { get; set; }
        public int ItemCount { get; set; }
        public bool IsFeatured { get; set; }
    }

    public class CreateLibraryCollectionDto
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [MaxLength(500)]
        public string? CoverImage { get; set; }

        [MaxLength(7)]
        public string? ColorTheme { get; set; }

        public int OrderNumber { get; set; } = 0;

        public bool IsFeatured { get; set; } = false;
    }

    public class UpdateLibraryCollectionDto
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [MaxLength(500)]
        public string? CoverImage { get; set; }

        [MaxLength(7)]
        public string? ColorTheme { get; set; }

        public int OrderNumber { get; set; }

        public bool IsFeatured { get; set; }

        public bool IsActive { get; set; }
    }

    // DTOs para búsqueda y filtros
    public class LibraryItemSummaryDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Author { get; set; }
        public string FileType { get; set; } = string.Empty;
        public string? Category { get; set; }
        public DateTime CreatedAt { get; set; }
        public int DownloadCount { get; set; }
        public bool IsFeatured { get; set; }
        public string? ThumbnailUrl { get; set; }
    }

    public class LibrarySearchDto
    {
        public string? Query { get; set; }
        public string? FileType { get; set; }
        public string? Category { get; set; }
        public string? Subcategory { get; set; }
        public string? Author { get; set; }
        public string? Language { get; set; }
        public int? YearFrom { get; set; }
        public int? YearTo { get; set; }
        public List<string> Tags { get; set; } = new();
        public string? CollectionId { get; set; }
        public bool? IsFeatured { get; set; }
        public string SortBy { get; set; } = "created_at";
        public string SortOrder { get; set; } = "desc";
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class LibraryItemPagedResultDto
    {
        public List<LibraryItemDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    // DTOs para estadísticas
    public class LibraryStatsDto
    {
        public int TotalItems { get; set; }
        public int TotalCollections { get; set; }
        public Dictionary<string, int> FileTypeDistribution { get; set; } = new();
        public Dictionary<string, int> CategoryDistribution { get; set; } = new();
        public Dictionary<string, int> LanguageDistribution { get; set; } = new();
        public List<LibraryItemSummaryDto> MostDownloaded { get; set; } = new();
        public List<LibraryItemSummaryDto> MostViewed { get; set; } = new();
        public List<LibraryItemSummaryDto> RecentlyAdded { get; set; } = new();
    }
}