using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CentroCultural.Domain.Entities
{
    public class LibraryResource
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [MaxLength(500)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Required]
        public string Authors { get; set; } = string.Empty; // JSON array

        public int? PublishYear { get; set; }

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string MediaType { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string FilePath { get; set; } = string.Empty;

        public long FileSize { get; set; }

        [Required]
        [MaxLength(100)]
        public string MimeType { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? ThumbnailPath { get; set; }

        public bool Downloadable { get; set; } = true;

        public int DownloadCount { get; set; } = 0;

        public string? Tags { get; set; } // JSON array

        [MaxLength(50)]
        public string? ISBN { get; set; }

        public int? Duration { get; set; } // En segundos para videos/audio

        [Required]
        [MaxLength(10)]
        public string Language { get; set; } = "es";

        [Required]
        public int UploadedBy { get; set; } = 0;

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public bool IsActive { get; set; } = true;

        public bool IsFeatured { get; set; } = false;

        // Navigation properties
        [ForeignKey("UploadedBy")]
        public Usuario? Uploader { get; set; }
    }


    public enum ResourceCategory
    {
        Educacion,
        Cultura,
        Historia,
        Arte,
        Literatura,
        Ciencias,
        Otros
    }
}