using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CentroCultural.Domain.Entities
{
    [Table("module_post")]
    public class ModulePost
    {
        [Key]
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

        [MaxLength(500)]
        [Column("image_path")]
        public string? ImagePath { get; set; }

        [MaxLength(500)]
        [Column("video_path")]
        public string? VideoPath { get; set; }

        [MaxLength(500)]
        [Column("audio_path")]
        public string? AudioPath { get; set; }

        [Column("order_number")]
        public int OrderNumber { get; set; } = 0;

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Required]
        [Column("module_id")]
        public string ModuleId { get; set; } = string.Empty;

        [Column("author_id")]
        public int AuthorId { get; set; } = 1;

        [Column("created_at")]
        public long CreatedAt { get; set; }

        [Column("updated_at")]
        public long? UpdatedAt { get; set; }

        // Navigation property (optional - can be null if module not loaded)
        [ForeignKey("ModuleId")]
        public virtual Modulo? Modulo { get; set; }
    }
}
