using System.ComponentModel.DataAnnotations;

namespace CentroCultural.Domain.Entities
{
    public class WorkItem
    {
        public Guid Id { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        public string? LongText { get; set; }
        
        public int OrderNumber { get; set; } = 0;
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
        
        [Required]
        public Guid ModuleId { get; set; }
        
        
        // Contextual multimedia paths (stored in WorkItem directly)
        [MaxLength(500)]
        public string? ImagePath { get; set; }
        
        [MaxLength(500)]
        public string? VideoPath { get; set; }
    }
}