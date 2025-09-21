using CentroCultural.Domain.Entities;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    public class Course
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Subject { get; set; } = "General";
        public string? ImagePath { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsFeatured { get; set; } = false;
        public long CreatedAt { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        public long? UpdatedAt { get; set; }
        public string EducatorId { get; set; } = "1";
    }
}