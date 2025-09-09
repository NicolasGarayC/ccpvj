namespace CentroCultural.Application.DTOs
{
    public class EventDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime StartDateTime { get; set; }
        public DateTime? EndDateTime { get; set; }
        public bool IsAllDay { get; set; }
        public string? Location { get; set; }
        public string EventType { get; set; } = "General";
        public bool IsActive { get; set; }
        public bool IsFeatured { get; set; }
        public int? MaxAttendees { get; set; }
        public int CurrentAttendees { get; set; }
        public bool RequiresRegistration { get; set; }
        public DateTime? RegistrationDeadline { get; set; }
        public string? ImagePath { get; set; }
        public string? PdfPath { get; set; }
        
        // Eventos recurrentes
        public bool IsRecurring { get; set; }
        public string? RecurrencePattern { get; set; }
        public int? RecurrenceInterval { get; set; }
        public DateTime? RecurrenceEndDate { get; set; }
        public string? RecurrenceDaysOfWeek { get; set; }
        
        // Referencias a contenido relacionado
        public Guid? RelatedCourseId { get; set; }
        public string? RelatedCourseTitle { get; set; }
        public Guid? RelatedBlogPostId { get; set; }
        public string? RelatedBlogPostTitle { get; set; }
        public string? RelatedBlogPostSlug { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int OrganizerId { get; set; }
        public string OrganizerName { get; set; } = string.Empty;
    }

    public class EventSummaryDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime StartDateTime { get; set; }
        public DateTime? EndDateTime { get; set; }
        public bool IsAllDay { get; set; }
        public string? Location { get; set; }
        public string EventType { get; set; } = "General";
        public bool IsFeatured { get; set; }
        public string? ImagePath { get; set; }
        public bool IsRecurring { get; set; }
        public string OrganizerName { get; set; } = string.Empty;
        
        // Referencias simplificadas
        public Guid? RelatedCourseId { get; set; }
        public string? RelatedCourseTitle { get; set; }
        public Guid? RelatedBlogPostId { get; set; }
        public string? RelatedBlogPostTitle { get; set; }
        public string? RelatedBlogPostSlug { get; set; }
    }

    public class CreateEventDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime StartDateTime { get; set; }
        public DateTime? EndDateTime { get; set; }
        public bool IsAllDay { get; set; } = false;
        public string? Location { get; set; }
        public string EventType { get; set; } = "General";
        public bool IsFeatured { get; set; } = false;
        public int? MaxAttendees { get; set; }
        public bool RequiresRegistration { get; set; } = false;
        public DateTime? RegistrationDeadline { get; set; }
        public string? ImagePath { get; set; }
        public string? PdfPath { get; set; }
        
        // Eventos recurrentes
        public bool IsRecurring { get; set; } = false;
        public string? RecurrencePattern { get; set; }
        public int? RecurrenceInterval { get; set; } = 1;
        public DateTime? RecurrenceEndDate { get; set; }
        public string? RecurrenceDaysOfWeek { get; set; }
        
        // Referencias a contenido relacionado
        public Guid? RelatedCourseId { get; set; }
        public Guid? RelatedBlogPostId { get; set; }
    }

    public class UpdateEventDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime StartDateTime { get; set; }
        public DateTime? EndDateTime { get; set; }
        public bool IsAllDay { get; set; }
        public string? Location { get; set; }
        public string EventType { get; set; } = "General";
        public bool IsFeatured { get; set; }
        public int? MaxAttendees { get; set; }
        public bool RequiresRegistration { get; set; }
        public DateTime? RegistrationDeadline { get; set; }
        public string? ImagePath { get; set; }
        public string? PdfPath { get; set; }
        
        // Eventos recurrentes
        public bool IsRecurring { get; set; }
        public string? RecurrencePattern { get; set; }
        public int? RecurrenceInterval { get; set; }
        public DateTime? RecurrenceEndDate { get; set; }
        public string? RecurrenceDaysOfWeek { get; set; }
        
        // Referencias a contenido relacionado
        public Guid? RelatedCourseId { get; set; }
        public Guid? RelatedBlogPostId { get; set; }
    }

    public class EventSearchDto
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string? SearchTerm { get; set; }
        public string? EventType { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool? IsActive { get; set; } = true;
        public bool? IsFeatured { get; set; }
        public bool? RequiresRegistration { get; set; }
        public Guid? RelatedCourseId { get; set; }
        public string? SortBy { get; set; } = "start_asc"; // start_asc, start_desc, created_desc, title_asc
    }

    public class EventPagedResultDto
    {
        public IEnumerable<EventSummaryDto> Events { get; set; } = new List<EventSummaryDto>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    public class CalendarViewDto
    {
        public DateTime ViewDate { get; set; }
        public string ViewType { get; set; } = "month"; // month, week, day
        public IEnumerable<EventSummaryDto> Events { get; set; } = new List<EventSummaryDto>();
    }

    public class EventTypeDto
    {
        public string Type { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Color { get; set; } = "#6B7280";
        public string Icon { get; set; } = "calendar";
        public int Count { get; set; }
    }

    // DTOs para eventos detallados
    public class EventDetailDto : EventDto
    {
        public List<EventRegistrationDto> Registrations { get; set; } = new List<EventRegistrationDto>();
        public bool IsUserRegistered { get; set; }
        public bool CanUserRegister { get; set; }
    }

    // DTOs para registraciones de eventos
    public class EventRegistrationDto
    {
        public Guid Id { get; set; }
        public Guid EventId { get; set; }
        public string EventTitle { get; set; } = string.Empty;
        public int? UserId { get; set; }
        public string? UserName { get; set; }
        public string ContactName { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public string? ContactPhone { get; set; }
        public string Status { get; set; } = "Pendiente"; // Pendiente, Confirmada, Cancelada
        public DateTime RegisteredAt { get; set; }
        public string? Notes { get; set; }
    }

    public class CreateEventRegistrationDto
    {
        public string ContactName { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public string? ContactPhone { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateRegistrationStatusDto
    {
        public string Status { get; set; } = string.Empty; // Pendiente, Confirmada, Cancelada
        public string? Notes { get; set; }
    }
}