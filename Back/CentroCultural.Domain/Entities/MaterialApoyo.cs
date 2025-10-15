using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CentroCultural.Domain.Entities
{
    [Table("material_apoyo")]
    public class MaterialApoyo
    {
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Column("description")]
        public string Description { get; set; } = string.Empty;

        [Column("image_path")]
        public string? ImagePath { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("is_featured")]
        public bool IsFeatured { get; set; } = false;

        [Column("created_at")]
        public long CreatedAt { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        [Column("updated_at")]
        public long? UpdatedAt { get; set; }

        [Column("educator_id")]
        public string EducatorId { get; set; } = "1";

        [Column("educator_name")]
        public string? EducatorName { get; set; }
    }
}