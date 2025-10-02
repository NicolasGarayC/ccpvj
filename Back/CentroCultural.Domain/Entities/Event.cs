using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CentroCultural.Domain.Entities
{
    [Table("event")]
    public class Event
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [MaxLength(200)]
        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        [Column("description")]
        public string? Description { get; set; }

        [Required]
        [Column("start_date_time")]
        public long StartDateTime { get; set; }

        [Column("end_date_time")]
        public long? EndDateTime { get; set; }

        [Column("is_all_day")]
        public bool IsAllDay { get; set; } = false;

        [MaxLength(200)]
        [Column("location")]
        public string? Location { get; set; }

        [Required]
        [Column("event_type")]
        public string EventType { get; set; } = "General"; // Clase, Evento, Taller, Conferencia, etc.

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("is_featured")]
        public bool IsFeatured { get; set; } = false;

        [Column("max_attendees")]
        public int? MaxAttendees { get; set; }

        [Column("current_attendees")]
        public int CurrentAttendees { get; set; } = 0;

        [Column("requires_registration")]
        public bool RequiresRegistration { get; set; } = false;

        [Column("registration_deadline")]
        public long? RegistrationDeadline { get; set; }

        // Multimedia contextual
        [MaxLength(500)]
        [Column("image_path")]
        public string? ImagePath { get; set; }

        [MaxLength(500)]
        [Column("pdf_path")]
        public string? PdfPath { get; set; }

        // Eventos recurrentes
        [Column("is_recurring")]
        public bool IsRecurring { get; set; } = false;

        [MaxLength(50)]
        [Column("recurrence_pattern")]
        public string? RecurrencePattern { get; set; } // Daily, Weekly, Monthly, Yearly

        [Column("recurrence_interval")]
        public int? RecurrenceInterval { get; set; } = 1; // cada cuanto se repite

        [Column("recurrence_end_date")]
        public long? RecurrenceEndDate { get; set; }

        [MaxLength(100)]
        [Column("recurrence_days_of_week")]
        public string? RecurrenceDaysOfWeek { get; set; } // "1,3,5" para Lun, Mie, Vie

        // Referencias opcionales a contenido relacionado
        [Column("related_course_id")]
        public string? RelatedCourseId { get; set; }

        [Column("related_blog_post_id")]
        public string? RelatedBlogPostId { get; set; }

        // Información de creación y actualización
        [Required]
        [Column("created_at")]
        public long CreatedAt { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        [Column("updated_at")]
        public long? UpdatedAt { get; set; }

        [Required]
        [Column("organizer_id")]
        public string OrganizerId { get; set; } = string.Empty;

        // Navigation properties
        public virtual ICollection<BlogPostEvent> BlogPostRelations { get; set; } = new List<BlogPostEvent>();

    }
}