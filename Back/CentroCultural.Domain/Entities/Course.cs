using CentroCultural.Domain.Entities;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("Course")]
    public class Course
    {
        [Key]
        [Column("Id")]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(200)]
        [Column("Title")]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        [Column("Description")]
        public string Description { get; set; } = string.Empty;

        [MaxLength(100)]
        [Column("Subject")]
        public string Subject { get; set; } = "General";

        [MaxLength(500)]
        [Column("ImagePath")]
        public string ImagePath { get; set; } = string.Empty;

        [Column("IsActive")]
        public bool IsActive { get; set; } = true;

        [Column("IsFeatured")]
        public bool IsFeatured { get; set; } = false;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("UpdatedAt")]
        public DateTime? UpdatedAt { get; set; }

        [Required]
        [Column("EducatorId")]
        public int EducatorId { get; set; }

        // Navigation properties
        [ForeignKey("EducatorId")]
        public virtual Usuario Educator { get; set; } = null!;

        public virtual ICollection<Module> Modules { get; set; } = new List<Module>();
    }
}