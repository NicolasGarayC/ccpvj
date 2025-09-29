using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CentroCultural.Domain.Entities
{
    [Table("module_post")]
    public class ModulePost
    {
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [MaxLength(500)]
        [Column("subtitle")]
        public string? Subtitle { get; set; }

        [Column("content")]
        public string? Content { get; set; }

        [Column("order_number")]
        public int OrderNumber { get; set; } = 0;

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public long CreatedAt { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        [Column("updated_at")]
        public long? UpdatedAt { get; set; }

        [Required]
        [Column("module_id")]
        public string ModuleId { get; set; } = string.Empty;

        [Required]
        [Column("author_id")]
        public string AuthorId { get; set; } = string.Empty;

        // Contextual multimedia paths
        [MaxLength(500)]
        [Column("image_path")]
        public string? ImagePath { get; set; }

        [MaxLength(500)]
        [Column("video_path")]
        public string? VideoPath { get; set; }

        [MaxLength(500)]
        [Column("audio_path")]
        public string? AudioPath { get; set; }
    }
}