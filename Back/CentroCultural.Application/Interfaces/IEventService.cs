using CentroCultural.Application.DTOs;

namespace CentroCultural.Application.Interfaces
{
    public interface IEventService
    {
        // Obtener eventos
        Task<EventPagedResultDto> GetEventsAsync(EventSearchDto searchDto);
        Task<EventDetailDto?> GetEventByIdAsync(Guid id);
        Task<IEnumerable<EventSummaryDto>> GetEventsForMonthAsync(int year, int month);
        Task<IEnumerable<EventSummaryDto>> GetUpcomingEventsAsync(int count = 6);
        Task<IEnumerable<EventSummaryDto>> GetFeaturedEventsAsync(int count = 6);
        Task<IEnumerable<EventSummaryDto>> GetEventsByOrganizerAsync(string organizerId);
        
        // Crear, actualizar y eliminar eventos
        Task<EventDto> CreateEventAsync(CreateEventDto eventDto, string organizerId);
        Task<bool> UpdateEventAsync(Guid id, UpdateEventDto eventDto, string userId);
        Task<bool> DeleteEventAsync(Guid id, string userId);
        
        // Gestión de inscripciones
        Task<IEnumerable<EventRegistrationDto>> GetEventRegistrationsAsync(Guid eventId, string userId);
        Task<EventRegistrationDto> RegisterForEventAsync(Guid eventId, CreateEventRegistrationDto registrationDto, string? userId = null);
        Task<bool> UpdateRegistrationStatusAsync(Guid registrationId, UpdateRegistrationStatusDto statusDto, string userId);
        
        // Utilidades
        Task<IEnumerable<string>> GetEventTypesAsync();
    }
}