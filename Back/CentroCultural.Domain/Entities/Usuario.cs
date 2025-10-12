using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CentroCultural.Domain.Entities
{
    [Table("Usuario")]
    public class Usuario
    {
        [Key]
        [Column("IdUsuario")]
        public int IdUsuario { get; set; } = 0;
        [Required]
        [MaxLength(100)]
        [Column("NombreUsuario")]
        public string NombreUsuario { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [Column("Contrasena")]
        public string Contrasena { get; set; } = string.Empty;

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
        public int IdRol { get; set; } = 3;

        [Column("FechaCreacion")]
        public string FechaCreacion { get; set; } = string.Empty;

        [Column("FechaActualizacion")]
        public string? FechaActualizacion { get; set; }

        // Propiedades para compatibilidad con código existente
        [NotMapped]
        public int Id => IdUsuario;

        [NotMapped]
        public bool EsActivo { get; set; } = true;

        // Para compatibilidad con código que espera Role string
        [NotMapped]
        public string RoleString
        {
            get => IdRol switch
            {
                1 => "Asistente",
                2 => "Colaborador",
                3 => "Administrador",
                _ => "Asistente"
            };
            set => IdRol = value switch
            {
                "Administrador" => 3,
                "Colaborador" => 2,
                "Asistente" => 1,
                _ => 1
            };
        }

        [NotMapped]
        public string Role => RoleString;

        [NotMapped]
        public string FechaRegistro
        {
            get => FechaCreacion;
            set => FechaCreacion = value;
        }

        // Rol navigation property removed to avoid EF issues
    }
}
