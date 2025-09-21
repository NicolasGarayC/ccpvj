using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CentroCultural.Domain.Entities
{
    [Table("user")]
    public class Usuario
    {
        [Key]
        [Column("id")]
        public int IdUsuario { get; set; } = 0;
        [Required]
        [MaxLength(100)]
        [Column("username")]
        public string NombreUsuario { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [Column("password_hash")]
        public string Contrasena { get; set; } = string.Empty;

        [MaxLength(100)]
        [Column("nombre")]
        public string? Nombre { get; set; }

        [MaxLength(100)]
        [Column("apellido")]
        public string? Apellido { get; set; }

        [MaxLength(20)]
        [Column("telefono")]
        public string? Telefono { get; set; }

        [Required]
        [Column("role")]
        public string RoleString { get; set; } = "asistente";

        [Column("created_at")]
        public long CreatedAt { get; set; }

        [Column("updated_at")]
        public long UpdatedAt { get; set; }

        // Propiedades para compatibilidad con código existente
        [NotMapped]
        public int Id => IdUsuario;

        [NotMapped]
        public bool EsActivo { get; set; } = true;

        [NotMapped]
        public DateTime FechaCreacion
        {
            get => CreatedAt > 0 ? DateTimeOffset.FromUnixTimeMilliseconds(CreatedAt).DateTime : DateTime.UtcNow;
            set => CreatedAt = ((DateTimeOffset)value).ToUnixTimeMilliseconds();
        }

        [NotMapped]
        public DateTime? FechaActualizacion
        {
            get => UpdatedAt > 0 ? DateTimeOffset.FromUnixTimeMilliseconds(UpdatedAt).DateTime : null;
            set => UpdatedAt = value.HasValue ? ((DateTimeOffset)value.Value).ToUnixTimeMilliseconds() : 0;
        }

        [NotMapped]
        public string FechaRegistro
        {
            get => FechaCreacion.ToString("yyyy-MM-dd HH:mm:ss");
            set => FechaCreacion = DateTime.TryParse(value, out var date) ? date : DateTime.UtcNow;
        }

        // Para compatibilidad con código existente que espera IdRol numérico
        [NotMapped]
        public int IdRol
        {
            get => RoleString switch
            {
                "administrador" => 1,
                "colaborador" => 2,
                "asistente" => 3,
                _ => 3
            };
            set => RoleString = value switch
            {
                1 => "administrador",
                2 => "colaborador",
                3 => "asistente",
                _ => "asistente"
            };
        }

        // Para compatibilidad con código que espera Role string
        [NotMapped]
        public string Role => RoleString;

        // Navigation property para compatibilidad con código existente
        [NotMapped]
        public virtual Rol? Rol { get; set; }
    }
}
