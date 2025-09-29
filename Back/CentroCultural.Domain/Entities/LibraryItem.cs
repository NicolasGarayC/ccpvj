using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CentroCultural.Domain.Entities
{
    [Table("library_item")]
    public class LibraryItem
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Required]
        [Column("title")]
        [MaxLength(500)]
        public string Title { get; set; } = string.Empty;

        [Column("description")]
        [MaxLength(2000)]
        public string? Description { get; set; }

        [Column("author")]
        [MaxLength(200)]
        public string? Author { get; set; }

        [Column("created_at")]
        public long CreatedAt { get; set; }

        [Column("updated_at")]
        public long? UpdatedAt { get; set; }

        [Required]
        [Column("uploaded_by")]
        [MaxLength(100)]
        public string UploadedBy { get; set; } = string.Empty;

        [Required]
        [Column("file_type")]
        [MaxLength(20)]
        public string FileType { get; set; } = string.Empty; // video, audio, document, image

        [Required]
        [Column("file_path")]
        [MaxLength(1000)]
        public string FilePath { get; set; } = string.Empty;

        [Required]
        [Column("file_name")]
        [MaxLength(500)]
        public string FileName { get; set; } = string.Empty;

        [Column("file_size")]
        public long FileSize { get; set; }

        [Column("mime_type")]
        [MaxLength(100)]
        public string? MimeType { get; set; }

        // Metadatos para filtros
        [Column("tags")]
        [MaxLength(1000)]
        public string? Tags { get; set; } // JSON array of strings

        [Column("language")]
        [MaxLength(10)]
        public string? Language { get; set; } // es, en, fr, etc.

        [Column("year")]
        public int? Year { get; set; }

        [Column("category")]
        [MaxLength(100)]
        public string? Category { get; set; } // Categoría principal

        [Column("subcategory")]
        [MaxLength(100)]
        public string? Subcategory { get; set; }

        // Estadísticas
        [Column("download_count")]
        public int DownloadCount { get; set; } = 0;

        [Column("view_count")]
        public int ViewCount { get; set; } = 0;

        // Control
        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("is_featured")]
        public bool IsFeatured { get; set; } = false;

        // Relaciones
        public virtual ICollection<LibraryItemCollection> ItemCollections { get; set; } = new List<LibraryItemCollection>();
    }
}