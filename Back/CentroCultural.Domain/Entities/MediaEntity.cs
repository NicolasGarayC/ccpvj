using CentroCultural.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CentroCultural.Domain.Entities
{
    public class MediaEntity
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(500)]
        public string RelativePath { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string ThumbnailPath { get; set; } = string.Empty;
        
        public MediaType Type { get; set; }
        
        public long SizeBytes { get; set; }
        
        public int? DurationSeconds { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string MimeType { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string CreatedBy { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public Dictionary<string, object> Metadata { get; set; } = new();
        
        // CONTEXTUAL MULTIMEDIA PROPERTIES
        // These ensure every media file belongs to specific content
        
        [Required]
        [MaxLength(50)]
        public string ContentType { get; set; } = string.Empty; // 'course', 'workitem', 'blog', 'event'
        
        [Required]
        public Guid ContentId { get; set; } // ID of the related content
        
        [Required]
        [MaxLength(50)]
        public string MediaType { get; set; } = string.Empty; // 'image', 'video', 'pdf', 'audio'
    }
}