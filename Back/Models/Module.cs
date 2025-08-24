using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Back.Models
{
    [Table("Module")]
    public class Module
    {
        [Key]
        [Column("Id")]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(200)]
        [Column("Title")]
        public string Title { get; set; } = string.Empty;

        [MaxLength(500)]
        [Column("Description")]
        public string Description { get; set; } = string.Empty;

        [Column("Content")]
        public string Content { get; set; } = string.Empty;

        [Column("OrderNumber")]
        public int OrderNumber { get; set; }

        [Column("IsActive")]
        public bool IsActive { get; set; } = true;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("UpdatedAt")]
        public DateTime? UpdatedAt { get; set; }

        [Required]
        [Column("CourseId")]
        public Guid CourseId { get; set; }

        // Navigation property
        [ForeignKey("CourseId")]
        public virtual Course Course { get; set; } = null!;
    }
}