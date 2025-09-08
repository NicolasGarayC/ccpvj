using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CentroCultural.Domain.Entities
{
    [Table("Event")]
    public class Event
    {
        [Key]
        [Column("Id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(200)]
        [Column("Title")]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        [Column("Description")]
        public string? Description { get; set; }

        [Required]
        [Column("StartDateTime")]
        public DateTime StartDateTime { get; set; }

        [Column("EndDateTime")]
        public DateTime? EndDateTime { get; set; }

        [Column("IsAllDay")]
        public bool IsAllDay { get; set; } = false;

        [MaxLength(200)]
        [Column("Location")]
        public string? Location { get; set; }

        [Required]
        [Column("EventType")]
        public string EventType { get; set; } = "General"; // Clase, Evento, Taller, Conferencia, etc.

        [Column("IsActive")]
        public bool IsActive { get; set; } = true;

        [Column("IsFeatured")]
        public bool IsFeatured { get; set; } = false;

        [Column("MaxAttendees")]
        public int? MaxAttendees { get; set; }

        [Column("CurrentAttendees")]
        public int CurrentAttendees { get; set; } = 0;

        [Column("RequiresRegistration")]
        public bool RequiresRegistration { get; set; } = false;

        [Column("RegistrationDeadline")]
        public DateTime? RegistrationDeadline { get; set; }

        // Multimedia contextual
        [MaxLength(500)]
        [Column("ImagePath")]
        public string? ImagePath { get; set; }

        [MaxLength(500)]
        [Column("PdfPath")]
        public string? PdfPath { get; set; }

        // Eventos recurrentes
        [Column("IsRecurring")]
        public bool IsRecurring { get; set; } = false;

        [MaxLength(50)]
        [Column("RecurrencePattern")]
        public string? RecurrencePattern { get; set; } // Daily, Weekly, Monthly, Yearly

        [Column("RecurrenceInterval")]
        public int? RecurrenceInterval { get; set; } = 1; // cada cuanto se repite

        [Column("RecurrenceEndDate")]
        public DateTime? RecurrenceEndDate { get; set; }

        [MaxLength(100)]
        [Column("RecurrenceDaysOfWeek")]
        public string? RecurrenceDaysOfWeek { get; set; } // "1,3,5" para Lun, Mie, Vie

        // Referencias opcionales a contenido relacionado
        [Column("RelatedCourseId")]
        public Guid? RelatedCourseId { get; set; }

        [Column("RelatedBlogPostId")]
        public Guid? RelatedBlogPostId { get; set; }

        // Información de creación y actualización
        [Required]
        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("UpdatedAt")]
        public DateTime? UpdatedAt { get; set; }

        [Required]
        [Column("OrganizerId")]
        public int OrganizerId { get; set; }

        // Propiedades de navegación
        [ForeignKey("OrganizerId")]
        public virtual Usuario Organizer { get; set; } = null!;

        [ForeignKey("RelatedCourseId")]
        public virtual Course? RelatedCourse { get; set; }

        [ForeignKey("RelatedBlogPostId")]
        public virtual BlogPost? RelatedBlogPost { get; set; }

        public virtual ICollection<EventRegistration> Registrations { get; set; } = new List<EventRegistration>();
    }
}