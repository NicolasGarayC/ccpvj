using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CentroCultural.Domain.Entities
{
    [Table("Rol")]
    public class Rol
    {
        [Key]
        [Column("IdRol")]
        public int IdRol { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("NombreRol")]
        public string NombreRol { get; set; } = string.Empty;

        [MaxLength(255)]
        [Column("Descripcion")]
        public string? Descripcion { get; set; }

        // Navigation property
        public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
    }
}