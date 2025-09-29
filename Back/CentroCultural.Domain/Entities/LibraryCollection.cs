using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CentroCultural.Domain.Entities
{
    [Table("library_collection")]
    public class LibraryCollection
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Required]
        [Column("name")]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Column("description")]
        [MaxLength(1000)]
        public string? Description { get; set; }

        [Column("cover_image")]
        [MaxLength(500)]
        public string? CoverImage { get; set; }

        [Column("color_theme")]
        [MaxLength(7)]
        public string? ColorTheme { get; set; } // Hex color for UI theming

        [Column("created_at")]
        public long CreatedAt { get; set; }

        [Column("updated_at")]
        public long? UpdatedAt { get; set; }

        [Required]
        [Column("created_by")]
        [MaxLength(100)]
        public string CreatedBy { get; set; } = string.Empty;

        [Column("order_number")]
        public int OrderNumber { get; set; } = 0;

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("is_featured")]
        public bool IsFeatured { get; set; } = false;

        // Relaciones
        public virtual ICollection<LibraryItemCollection> ItemCollections { get; set; } = new List<LibraryItemCollection>();
    }
}