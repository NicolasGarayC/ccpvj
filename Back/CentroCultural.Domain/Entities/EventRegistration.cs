using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CentroCultural.Domain.Entities
{
    [Table("EventRegistration")]
    public class EventRegistration
    {
        [Key]
        [Column("Id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [Column("EventId")]
        public Guid EventId { get; set; }

        [Required]
        [Column("UserId")]
        public int? UserId { get; set; } = 0;

        [Required]
        [Column("RegistrationDate")]
        public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;

        [Column("Status")]
        public RegistrationStatus Status { get; set; } = RegistrationStatus.Confirmed;

        [MaxLength(500)]
        [Column("Notes")]
        public string? Notes { get; set; }

        // Contact info for non-registered users
        [MaxLength(100)]
        [Column("GuestName")]
        public string? GuestName { get; set; }

        [MaxLength(100)]
        [Column("GuestEmail")]
        public string? GuestEmail { get; set; }

        [MaxLength(20)]
        [Column("GuestPhone")]
        public string? GuestPhone { get; set; }

        [Column("IsGuest")]
        public bool IsGuest { get; set; } = false;

        // Navigation properties
        [ForeignKey("EventId")]
        public virtual Event Event { get; set; } = null!;

        [ForeignKey("UserId")]
        public virtual Usuario? User { get; set; }
    }

    public enum RegistrationStatus
    {
        Pending = 0,
        Confirmed = 1,
        Cancelled = 2,
        Attended = 3,
        NoShow = 4
    }
}