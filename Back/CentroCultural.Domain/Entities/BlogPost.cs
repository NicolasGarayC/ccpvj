using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CentroCultural.Domain.Entities
{
    [Table("blog_post")]
    public class BlogPost
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

        [Required]
        [MaxLength(200)]
        [Column("slug")]
        public string Slug { get; set; } = string.Empty;

        [Column("is_published")]
        public bool IsPublished { get; set; } = false;

        [Column("is_featured")]
        public bool IsFeatured { get; set; } = false;

        [Column("views")]
        public int Views { get; set; } = 0;

        [Column("order_number")]
        public int OrderNumber { get; set; } = 0;

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public long CreatedAt { get; set; }

        [Column("updated_at")]
        public long? UpdatedAt { get; set; }

        [Column("published_at")]
        public long? PublishedAt { get; set; }

        [Required]
        [Column("author_id")]
        public int AuthorId { get; set; } = 1;

        [Column("category_id")]
        public string? CategoryId { get; set; }

        [Column("tags")]
        public string? Tags { get; set; } // JSON array of tags

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "draft";

        // Navigation properties
        public virtual ICollection<BlogPostElement> Elements { get; set; } = new List<BlogPostElement>();
        [ForeignKey("AuthorId")]
        public virtual Usuario? Author { get; set; }

        // Relaciones con eventos
        public virtual ICollection<BlogPostEvent> EventRelations { get; set; } = new List<BlogPostEvent>();
    }
}
