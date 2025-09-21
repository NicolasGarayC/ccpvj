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
        Task<IEnumerable<EventSummaryDto>> GetEventsByOrganizerAsync(int organizerId);
        
        // Crear, actualizar y eliminar eventos
        Task<EventDto> CreateEventAsync(CreateEventDto eventDto, int organizerId);
        Task<bool> UpdateEventAsync(Guid id, UpdateEventDto eventDto, int userId);
        Task<bool> DeleteEventAsync(Guid id, int userId);
        
        // Gestión de inscripciones
        Task<IEnumerable<EventRegistrationDto>> GetEventRegistrationsAsync(Guid eventId, int userId);
        Task<EventRegistrationDto> RegisterForEventAsync(Guid eventId, CreateEventRegistrationDto registrationDto, int? userId = null);
        Task<bool> UpdateRegistrationStatusAsync(Guid registrationId, UpdateRegistrationStatusDto statusDto, int userId);
        
        // Utilidades
        Task<IEnumerable<string>> GetEventTypesAsync();
    }
}