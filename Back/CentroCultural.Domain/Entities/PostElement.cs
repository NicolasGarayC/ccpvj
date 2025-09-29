using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CentroCultural.Domain.Entities
{
    [Table("post_element")]
    public class PostElement
    {
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Required]
        [Column("post_id")]
        public string PostId { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        [Column("element_type")]
        public string ElementType { get; set; } = string.Empty; // title, text, image, video, audio

        [Column("content")]
        public string? Content { get; set; } // For title and text content

        [Column("file_path")]
        public string? FilePath { get; set; } // For multimedia files

        [Column("file_name")]
        public string? FileName { get; set; } // Original file name

        [Column("file_size")]
        public int? FileSize { get; set; } // File size in bytes

        [Column("mime_type")]
        public string? MimeType { get; set; } // MIME type

        [Column("order_number")]
        public int OrderNumber { get; set; } = 0;

        [Column("metadata")]
        public string? Metadata { get; set; } // JSON for additional data (alt text, caption, etc.)

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public long CreatedAt { get; set; } // Unix timestamp

        [Column("updated_at")]
        public long? UpdatedAt { get; set; } // Unix timestamp

        // Navigation property
        [ForeignKey("PostId")]
        public virtual ModulePost? Post { get; set; }
    }
}