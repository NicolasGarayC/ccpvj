using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CentroCultural.Domain.Entities
{
    /// <summary>
    /// Tabla de relación many-to-many entre LibraryItem y LibraryCollection
    /// </summary>
    [Table("library_item_collection")]
    public class LibraryItemCollection
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Required]
        [Column("library_item_id")]
        public string LibraryItemId { get; set; } = string.Empty;

        [Required]
        [Column("library_collection_id")]
        public string LibraryCollectionId { get; set; } = string.Empty;

        [Column("order_number")]
        public int OrderNumber { get; set; } = 0;

        [Column("added_at")]
        public long AddedAt { get; set; }

        [Column("added_by")]
        [MaxLength(100)]
        public string? AddedBy { get; set; }

        // Navegación
        [ForeignKey("LibraryItemId")]
        public virtual LibraryItem LibraryItem { get; set; } = null!;

        [ForeignKey("LibraryCollectionId")]
        public virtual LibraryCollection LibraryCollection { get; set; } = null!;
    }
}