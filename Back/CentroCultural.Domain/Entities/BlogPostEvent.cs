using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CentroCultural.Domain.Entities
{
    /// <summary>
    /// Entidad de relación N:M entre BlogPost y Event
    /// Permite establecer relaciones bidireccionales entre posts del blog y eventos del calendario
    /// </summary>
    [Table("blog_post_event")]
    public class BlogPostEvent
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Foreign Keys
        [Required]
        [Column("blog_post_id")]
        public string BlogPostId { get; set; } = string.Empty;

        [Required]
        [Column("event_id")]
        public string EventId { get; set; } = string.Empty;

        // Metadata de la relación
        [MaxLength(50)]
        [Column("relation_type")]
        public string RelationType { get; set; } = "Related"; // Related, Featured, Announcement, Preview, etc.

        [MaxLength(500)]
        [Column("relation_description")]
        public string? RelationDescription { get; set; }

        [Column("display_order")]
        public int DisplayOrder { get; set; } = 0;

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        // Auditoría
        [Required]
        [Column("created_at")]
        public long CreatedAt { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        [Column("updated_at")]
        public long? UpdatedAt { get; set; }

        [Required]
        [Column("created_by")]
        public string CreatedBy { get; set; } = string.Empty;

        // Navigation Properties
        public virtual BlogPost? BlogPost { get; set; }

        public virtual Event? Event { get; set; }
    }
}