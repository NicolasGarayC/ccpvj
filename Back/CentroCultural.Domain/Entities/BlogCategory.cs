using System.ComponentModel.DataAnnotations;

namespace CentroCultural.Domain.Entities
{
    public class BlogCategory
    {
        public Guid Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        [MaxLength(20)]
        public string Color { get; set; } = "#6B7280";
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public ICollection<BlogPost> BlogPosts { get; set; } = new List<BlogPost>();
    }
}