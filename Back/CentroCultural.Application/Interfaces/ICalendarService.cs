using CentroCultural.Application.DTOs;

namespace CentroCultural.Application.Interfaces
{
    public interface ICalendarService
    {
        // CRUD básico
        Task<EventDto?> GetEventByIdAsync(Guid id);
        Task<EventPagedResultDto> GetEventsAsync(EventSearchDto searchDto);
        Task<CalendarViewDto> GetCalendarViewAsync(DateTime viewDate, string viewType = "month");
        Task<EventDto> CreateEventAsync(CreateEventDto createEventDto, int organizerId);
        Task<EventDto> UpdateEventAsync(Guid id, UpdateEventDto updateEventDto, int userId);
        Task<bool> DeleteEventAsync(Guid id, int userId);

        // Eventos recurrentes
        Task<IEnumerable<EventSummaryDto>> GenerateRecurringEventsAsync(Guid eventId, DateTime startDate, DateTime endDate);
        Task<EventDto> UpdateRecurringEventAsync(Guid id, UpdateEventDto updateEventDto, int userId, bool updateSeries = false);
        Task<bool> DeleteRecurringEventAsync(Guid id, int userId, bool deleteSeries = false);

        // Eventos por tipo
        Task<IEnumerable<EventTypeDto>> GetEventTypesAsync();
        Task<IEnumerable<EventSummaryDto>> GetEventsByTypeAsync(string eventType, DateTime? startDate = null, DateTime? endDate = null);

        // Eventos relacionados
        Task<IEnumerable<EventSummaryDto>> GetEventsByProjectAsync(Guid projectId);
        Task<IEnumerable<EventSummaryDto>> GetEventsByBlogPostAsync(Guid blogPostId);

        // Registraciones
        Task<bool> RegisterToEventAsync(Guid eventId, int userId);
        Task<bool> UnregisterFromEventAsync(Guid eventId, int userId);
        Task<IEnumerable<EventSummaryDto>> GetUserRegisteredEventsAsync(int userId);

        // Estadísticas
        Task<object> GetEventStatisticsAsync(DateTime? startDate = null, DateTime? endDate = null);

        // Eventos destacados
        Task<IEnumerable<EventSummaryDto>> GetFeaturedEventsAsync(int limit = 5);
        Task<bool> SetEventFeaturedAsync(Guid eventId, bool isFeatured, int userId);

        // Upcoming events
        Task<IEnumerable<EventSummaryDto>> GetUpcomingEventsAsync(int limit = 10);
    }
}