using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CentroCultural.Domain.Entities
{
    [Table("module")]
    public class Module
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [MaxLength(500)]
        [Column("description")]
        public string Description { get; set; } = string.Empty;


        [Column("order_number")]
        public int OrderNumber { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public long CreatedAt { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        [Column("updated_at")]
        public long? UpdatedAt { get; set; }

        [Required]
        [Column("course_id")]
        public string CourseId { get; set; } = string.Empty;

    }
}