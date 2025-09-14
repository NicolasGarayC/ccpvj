using System.ComponentModel.DataAnnotations;

namespace CentroCultural.Application.DTOs.Library
{
    public class LibraryResourceDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<string> Authors { get; set; } = new();
        public int? PublishYear { get; set; }
        public string Category { get; set; } = string.Empty;
        public string MediaType { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string MimeType { get; set; } = string.Empty;
        public string? ThumbnailPath { get; set; }
        public bool Downloadable { get; set; } = true;
        public int DownloadCount { get; set; }
        public List<string>? Tags { get; set; }
        public string? ISBN { get; set; }
        public int? Duration { get; set; }
        public string Language { get; set; } = "es";
        public int UploadedBy { get; set; }
        public DateTime UploadedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsFeatured { get; set; } = false;
    }

    public class CreateLibraryResourceDto
    {
        [Required]
        [MaxLength(500)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Required]
        public List<string> Authors { get; set; } = new();

        [Range(1000, 3000)]
        public int? PublishYear { get; set; }

        [Required]
        public string Category { get; set; } = string.Empty;

        [Required]
        public string MediaType { get; set; } = string.Empty;

        public bool Downloadable { get; set; } = true;

        public List<string>? Tags { get; set; }

        [MaxLength(50)]
        public string? ISBN { get; set; }

        [Range(1, int.MaxValue)]
        public int? Duration { get; set; }

        [Required]
        [MaxLength(10)]
        public string Language { get; set; } = "es";

        public bool IsFeatured { get; set; } = false;
    }

    public class UpdateLibraryResourceDto
    {
        [MaxLength(500)]
        public string? Name { get; set; }

        [MaxLength(2000)]
        public string? Description { get; set; }

        public List<string>? Authors { get; set; }

        [Range(1000, 3000)]
        public int? PublishYear { get; set; }

        public string? Category { get; set; }

        public string? MediaType { get; set; }

        public bool? Downloadable { get; set; }

        public List<string>? Tags { get; set; }

        [MaxLength(50)]
        public string? ISBN { get; set; }

        [Range(1, int.MaxValue)]
        public int? Duration { get; set; }

        [MaxLength(10)]
        public string? Language { get; set; }

        public bool? IsFeatured { get; set; }
    }

    public class LibrarySearchFiltersDto
    {
        public string? Search { get; set; }
        public string? Category { get; set; }
        public string? MediaType { get; set; }
        public string? Authors { get; set; }
        public int? PublishYear { get; set; }
        public string? Language { get; set; }
        public List<string>? Tags { get; set; }
        public bool? Downloadable { get; set; }
        public bool? IsFeatured { get; set; }
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 12;
    }

    public class LibraryStatsDto
    {
        public int TotalResources { get; set; }
        public int TotalDownloads { get; set; }
        public Dictionary<string, int> ResourcesByType { get; set; } = new();
        public Dictionary<string, int> ResourcesByCategory { get; set; } = new();
        public List<LibraryResourceDto> PopularResources { get; set; } = new();
        public List<LibraryResourceDto> RecentUploads { get; set; } = new();
    }

    public class LibraryResourceResponseDto
    {
        public bool Success { get; set; }
        public object? Data { get; set; }
        public string? Error { get; set; }
        public int? Total { get; set; }
        public int? Page { get; set; }
        public int? Limit { get; set; }
    }
}