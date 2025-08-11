using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Back.Models
{
    [Table("Usuario")]
    public class Usuario
    {
        [Key]
        [Column("IdUsuario")]
        public int IdUsuario { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("NombreUsuario")]
        public string NombreUsuario { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [Column("Contrasena")]
        public string Contrasena { get; set; } = string.Empty;

        [Required]
        [Column("FechaRegistro")]
        public string FechaRegistro { get; set; } = string.Empty;

        [MaxLength(100)]
        [Column("Nombre")]
        public string? Nombre { get; set; }

        [MaxLength(100)]
        [Column("Apellido")]
        public string? Apellido { get; set; }

        [MaxLength(20)]
        [Column("Telefono")]
        public string? Telefono { get; set; }

        [Required]
        [Column("IdRol")]
        public int IdRol { get; set; }

        // Navigation property
        [ForeignKey("IdRol")]
        public virtual Rol Rol { get; set; } = null!;
    }
}
