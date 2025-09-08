using System.ComponentModel.DataAnnotations;

namespace CentroCultural.Domain.Entities
{
    public class BlogPost
    {
        public Guid Id { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Content { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? Summary { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Slug { get; set; } = string.Empty;
        
        public bool IsPublished { get; set; } = false;
        public bool IsFeatured { get; set; } = false;
        public int Views { get; set; } = 0;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? PublishedAt { get; set; }
        
        [Required]
        public int AuthorId { get; set; }
        
        public Guid? CategoryId { get; set; }
        
        // Navigation properties
        public Usuario Author { get; set; } = null!;
        public BlogCategory? Category { get; set; }
        
        // Contextual multimedia paths
        [MaxLength(500)]
        public string? FeaturedImagePath { get; set; }
        
        [MaxLength(500)]
        public string? PdfPath { get; set; }
        
        [MaxLength(500)]
        public string? VideoPath { get; set; }
    }
}