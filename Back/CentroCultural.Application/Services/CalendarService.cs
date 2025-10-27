using System;
using System.Collections.Generic;
using System.Linq;
using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using CentroCultural.Domain.Entities;
using CentroCultural.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CentroCultural.Application.Services
{
    public class CalendarService : ICalendarService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CalendarService> _logger;

        public CalendarService(ApplicationDbContext context, ILogger<CalendarService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<EventDto?> GetEventByIdAsync(Guid id)
        {
            try
            {
                var eventEntity = await _context.Events
                    .FirstOrDefaultAsync(e => e.Id == id.ToString() && e.IsActive);

                if (eventEntity == null) return null;

                // Load related blog post if exists
                string? relatedBlogPostTitle = null;
                string? relatedBlogPostSlug = null;
                if (!string.IsNullOrEmpty(eventEntity.RelatedBlogPostId))
                {
                    var blogPost = await _context.BlogPost
                        .FirstOrDefaultAsync(b => b.Id == eventEntity.RelatedBlogPostId && b.IsActive);
                    if (blogPost != null)
                    {
                        relatedBlogPostTitle = blogPost.Title;
                        relatedBlogPostSlug = blogPost.Slug;
                    }
                }

                // Load related project if exists
                string? relatedProjectTitle = null;
                if (!string.IsNullOrEmpty(eventEntity.RelatedProjectId))
                {
                    var project = await _context.MaterialApoyo
                        .FirstOrDefaultAsync(c => c.Id == eventEntity.RelatedProjectId && c.IsActive);
                    if (project != null)
                    {
                        relatedProjectTitle = project.Title;
                    }
                }

                // Load organizer name if exists
                string organizerName = "Organizer";
                if (!string.IsNullOrEmpty(eventEntity.OrganizerId) && int.TryParse(eventEntity.OrganizerId, out var organizerId))
                {
                    var organizer = await _context.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == organizerId);
                    if (organizer != null)
                    {
                        organizerName = organizer.Nombre ?? organizer.NombreUsuario;
                    }
                }

                return MapToEventDto(eventEntity, relatedBlogPostTitle, relatedBlogPostSlug, relatedProjectTitle, organizerName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving event with ID {EventId}", id);
                throw;
            }
        }

        public async Task<EventPagedResultDto> GetEventsAsync(EventSearchDto searchDto)
        {
            try
            {
                var query = _context.Events
                    .Where(e => e.IsActive);

                // Apply filters
                if (!string.IsNullOrEmpty(searchDto.SearchTerm))
                {
                    query = query.Where(e => e.Title.Contains(searchDto.SearchTerm) ||
                                            (e.Description != null && e.Description.Contains(searchDto.SearchTerm)));
                }

                if (!string.IsNullOrEmpty(searchDto.EventType))
                {
                    query = query.Where(e => e.EventType == searchDto.EventType);
                }

                if (searchDto.StartDate.HasValue)
                {
                    var startTimestamp = new DateTimeOffset(searchDto.StartDate.Value).ToUnixTimeSeconds();
                    query = query.Where(e => e.StartDateTime >= startTimestamp);
                }

                if (searchDto.EndDate.HasValue)
                {
                    var endTimestamp = new DateTimeOffset(searchDto.EndDate.Value).ToUnixTimeSeconds();
                    query = query.Where(e => e.StartDateTime <= endTimestamp);
                }

                if (searchDto.IsFeatured.HasValue)
                {
                    query = query.Where(e => e.IsFeatured == searchDto.IsFeatured.Value);
                }

                if (searchDto.RelatedProjectId.HasValue)
                {
                    query = query.Where(e => e.RelatedProjectId == searchDto.RelatedProjectId.ToString());
                }

                // Apply sorting
                query = searchDto.SortBy?.ToLower() switch
                {
                    "start_desc" => query.OrderByDescending(e => e.StartDateTime),
                    "created_desc" => query.OrderByDescending(e => e.CreatedAt),
                    "title_asc" => query.OrderBy(e => e.Title),
                    _ => query.OrderBy(e => e.StartDateTime) // default: start_asc
                };

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)searchDto.PageSize);

                var eventEntities = await query
                    .Skip((searchDto.Page - 1) * searchDto.PageSize)
                    .Take(searchDto.PageSize)
                    .ToListAsync();

                var organizerNames = await GetOrganizerNamesAsync(eventEntities);

                var events = eventEntities
                    .Select(e => MapToEventSummaryDto(e, ResolveOrganizerName(e, organizerNames)))
                    .ToList();

                return new EventPagedResultDto
                {
                    Events = events,
                    TotalCount = totalCount,
                    Page = searchDto.Page,
                    PageSize = searchDto.PageSize,
                    TotalPages = totalPages,
                    HasNextPage = searchDto.Page < totalPages,
                    HasPreviousPage = searchDto.Page > 1
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving paginated events");
                throw;
            }
        }

        public async Task<CalendarViewDto> GetCalendarViewAsync(DateTime viewDate, string viewType = "month")
        {
            try
            {
                DateTime startDate, endDate;

                switch (viewType.ToLower())
                {
                    case "day":
                        startDate = viewDate.Date;
                        endDate = startDate.AddDays(1);
                        break;
                    case "week":
                        var daysFromMonday = (int)viewDate.DayOfWeek - (int)DayOfWeek.Monday;
                        if (daysFromMonday < 0) daysFromMonday += 7;
                        startDate = viewDate.AddDays(-daysFromMonday).Date;
                        endDate = startDate.AddDays(7);
                        break;
                    case "month":
                    default:
                        startDate = new DateTime(viewDate.Year, viewDate.Month, 1);
                        endDate = startDate.AddMonths(1);
                        break;
                }

                var startTimestamp = new DateTimeOffset(startDate).ToUnixTimeSeconds();
                var endTimestamp = new DateTimeOffset(endDate).ToUnixTimeSeconds();

                // Obtener eventos no recurrentes que caen en el rango
                var nonRecurringEvents = await _context.Events
                    .Where(e => e.IsActive && !e.IsRecurring && e.StartDateTime >= startTimestamp && e.StartDateTime < endTimestamp)
                    .OrderBy(e => e.StartDateTime)
                    .ToListAsync();

                // Obtener eventos recurrentes activos que puedan tener ocurrencias en el rango
                var recurringEvents = await _context.Events
                    .Where(e => e.IsActive && e.IsRecurring &&
                                (e.RecurrenceEndDate == null || e.RecurrenceEndDate >= startTimestamp))
                    .ToListAsync();

                var allEvents = new List<EventSummaryDto>();

                var organizerNames = await GetOrganizerNamesAsync(nonRecurringEvents.Concat(recurringEvents));

                // Agregar eventos no recurrentes
                allEvents.AddRange(nonRecurringEvents.Select(e => MapToEventSummaryDto(e, ResolveOrganizerName(e, organizerNames))));

                // Expandir eventos recurrentes en múltiples instancias
                foreach (var recurringEvent in recurringEvents)
                {
                    var occurrences = GenerateRecurringOccurrences(recurringEvent, startDate, endDate, ResolveOrganizerName(recurringEvent, organizerNames));
                    allEvents.AddRange(occurrences);
                }

                // Ordenar todos los eventos por fecha
                allEvents = allEvents.OrderBy(e => e.StartDateTime).ToList();

                return new CalendarViewDto
                {
                    ViewDate = viewDate,
                    ViewType = viewType,
                    Events = allEvents
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving calendar view for {ViewDate} with type {ViewType}", viewDate, viewType);
                throw;
            }
        }

        private List<EventSummaryDto> GenerateRecurringOccurrences(Event recurringEvent, DateTime rangeStart, DateTime rangeEnd, string organizerName)
        {
            var occurrences = new List<EventSummaryDto>();

            var eventStart = DateTimeOffset.FromUnixTimeSeconds(recurringEvent.StartDateTime).DateTime;
            var eventEnd = recurringEvent.EndDateTime.HasValue
                ? DateTimeOffset.FromUnixTimeSeconds(recurringEvent.EndDateTime.Value).DateTime
                : eventStart;
            var recurrenceEnd = recurringEvent.RecurrenceEndDate.HasValue
                ? DateTimeOffset.FromUnixTimeSeconds(recurringEvent.RecurrenceEndDate.Value).DateTime
                : rangeEnd;

            var interval = recurringEvent.RecurrenceInterval ?? 1;
            var duration = eventEnd - eventStart;

            // Manejo especial para eventos semanales con días específicos
            if (recurringEvent.RecurrencePattern?.ToLower() == "weekly" && !string.IsNullOrEmpty(recurringEvent.RecurrenceDaysOfWeek))
            {
                // Parsear los días de la semana seleccionados
                var selectedDays = recurringEvent.RecurrenceDaysOfWeek
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(d => int.Parse(d.Trim()))
                    .OrderBy(d => d)
                    .ToList();

                // Encontrar el lunes de la semana donde empieza el evento
                var weekStart = eventStart.Date;
                while (weekStart.DayOfWeek != DayOfWeek.Monday)
                {
                    weekStart = weekStart.AddDays(-1);
                }

                // Iterar semana por semana
                var currentWeek = weekStart;
                while (currentWeek <= recurrenceEnd)
                {
                    // Para cada día seleccionado en esta semana
                    foreach (var selectedDay in selectedDays)
                    {
                        // Calcular la fecha de esta ocurrencia
                        var occurrenceDate = currentWeek.AddDays(selectedDay == 0 ? 6 : selectedDay - 1); // 0=domingo se mapea a día 6 de la semana

                        // Agregar la hora del evento original
                        occurrenceDate = new DateTime(
                            occurrenceDate.Year,
                            occurrenceDate.Month,
                            occurrenceDate.Day,
                            eventStart.Hour,
                            eventStart.Minute,
                            eventStart.Second
                        );

                        // Verificar que esté dentro de todos los rangos
                        if (occurrenceDate >= eventStart &&
                            occurrenceDate <= recurrenceEnd &&
                            occurrenceDate >= rangeStart &&
                            occurrenceDate < rangeEnd)
                        {
                            occurrences.Add(new EventSummaryDto
                            {
                                Id = Guid.TryParse(recurringEvent.Id, out var guid) ? guid : Guid.Empty,
                                Title = recurringEvent.Title,
                                Description = recurringEvent.Description,
                                StartDateTime = occurrenceDate,
                                EndDateTime = occurrenceDate + duration,
                                IsAllDay = recurringEvent.IsAllDay,
                                Location = recurringEvent.Location,
                                EventType = recurringEvent.EventType,
                                IsFeatured = recurringEvent.IsFeatured,
                                IsRecurring = true,
                                OrganizerName = organizerName
                            });
                        }
                    }

                    // Avanzar a la siguiente semana según el intervalo
                    currentWeek = currentWeek.AddDays(interval * 7);
                }
            }
            else
            {
                // Para patrones daily, monthly, yearly (sin días específicos)
                var current = eventStart;

                while (current <= recurrenceEnd && current < rangeEnd.AddDays(1))
                {
                    // Verificar si esta ocurrencia cae dentro del rango de visualización
                    if (current >= rangeStart && current < rangeEnd)
                    {
                        occurrences.Add(new EventSummaryDto
                        {
                            Id = Guid.TryParse(recurringEvent.Id, out var guid) ? guid : Guid.Empty,
                            Title = recurringEvent.Title,
                            Description = recurringEvent.Description,
                            StartDateTime = current,
                            EndDateTime = current + duration,
                            IsAllDay = recurringEvent.IsAllDay,
                            Location = recurringEvent.Location,
                            EventType = recurringEvent.EventType,
                            IsFeatured = recurringEvent.IsFeatured,
                            IsRecurring = true,
                            OrganizerName = organizerName
                        });
                    }

                    // Avanzar al siguiente intervalo según el patrón
                    switch (recurringEvent.RecurrencePattern?.ToLower())
                    {
                        case "daily":
                            current = current.AddDays(interval);
                            break;
                        case "weekly":
                            current = current.AddDays(interval * 7);
                            break;
                        case "monthly":
                            current = current.AddMonths(interval);
                            break;
                        case "yearly":
                            current = current.AddYears(interval);
                            break;
                        default:
                            // Si no hay patrón válido, salir del bucle
                            return occurrences;
                    }
                }
            }

            return occurrences;
        }

        public async Task<IEnumerable<EventSummaryDto>> GetFeaturedEventsAsync(int limit = 5)
        {
            try
            {
                var currentTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                var events = await _context.Events
                    .Where(e => e.IsActive && e.IsFeatured && e.StartDateTime >= currentTime)
                    .OrderBy(e => e.StartDateTime)
                    .Take(limit)
                    .ToListAsync();

                var organizerNames = await GetOrganizerNamesAsync(events);

                return events
                    .Select(e => MapToEventSummaryDto(e, ResolveOrganizerName(e, organizerNames)))
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving featured events");
                throw;
            }
        }

        public async Task<IEnumerable<EventSummaryDto>> GetUpcomingEventsAsync(int limit = 10)
        {
            try
            {
                var currentTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                var events = await _context.Events
                    .Where(e => e.IsActive && e.StartDateTime >= currentTime)
                    .OrderBy(e => e.StartDateTime)
                    .Take(limit)
                    .ToListAsync();

                var organizerNames = await GetOrganizerNamesAsync(events);

                return events
                    .Select(e => MapToEventSummaryDto(e, ResolveOrganizerName(e, organizerNames)))
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving upcoming events");
                throw;
            }
        }

        public async Task<EventDto> CreateEventAsync(CreateEventDto createEventDto, int organizerId)
        {
            try
            {
                var currentTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                var eventEntity = new Event
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = createEventDto.Title,
                    Description = createEventDto.Description,
                    StartDateTime = new DateTimeOffset(createEventDto.StartDateTime).ToUnixTimeSeconds(),
                    EndDateTime = createEventDto.EndDateTime.HasValue
                        ? new DateTimeOffset(createEventDto.EndDateTime.Value).ToUnixTimeSeconds()
                        : null,
                    IsAllDay = createEventDto.IsAllDay,
                    Location = createEventDto.Location,
                    EventType = createEventDto.EventType,
                    IsFeatured = createEventDto.IsFeatured,
                    IsRecurring = createEventDto.IsRecurring,
                    RecurrencePattern = createEventDto.RecurrencePattern,
                    RecurrenceInterval = createEventDto.RecurrenceInterval,
                    RecurrenceEndDate = createEventDto.RecurrenceEndDate.HasValue
                        ? new DateTimeOffset(createEventDto.RecurrenceEndDate.Value).ToUnixTimeSeconds()
                        : null,
                    RecurrenceDaysOfWeek = createEventDto.RecurrenceDaysOfWeek,
                    RelatedProjectId = createEventDto.RelatedProjectId?.ToString(),
                    RelatedBlogPostId = createEventDto.RelatedBlogPostId?.ToString(),
                    CreatedAt = currentTime,
                    OrganizerId = organizerId.ToString(),
                    IsActive = true
                };

                _context.Events.Add(eventEntity);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Event created successfully with ID {EventId}", eventEntity.Id);
                var organizerName = await GetOrganizerNameAsync(organizerId);
                return MapToEventDto(eventEntity, organizerName: organizerName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating event");
                throw;
            }
        }

        public async Task<EventDto> UpdateEventAsync(Guid id, UpdateEventDto updateEventDto, int userId)
        {
            try
            {
                var eventEntity = await _context.Events
                    .FirstOrDefaultAsync(e => e.Id == id.ToString() && e.IsActive);

                if (eventEntity == null)
                {
                    throw new ArgumentException($"Event with ID {id} not found");
                }

                var currentTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

                // Update properties
                eventEntity.Title = updateEventDto.Title;
                eventEntity.Description = updateEventDto.Description;
                eventEntity.StartDateTime = new DateTimeOffset(updateEventDto.StartDateTime).ToUnixTimeSeconds();
                eventEntity.EndDateTime = updateEventDto.EndDateTime.HasValue
                    ? new DateTimeOffset(updateEventDto.EndDateTime.Value).ToUnixTimeSeconds()
                    : null;
                eventEntity.IsAllDay = updateEventDto.IsAllDay;
                eventEntity.Location = updateEventDto.Location;
                eventEntity.EventType = updateEventDto.EventType;
                eventEntity.IsFeatured = updateEventDto.IsFeatured;
                eventEntity.IsRecurring = updateEventDto.IsRecurring;
                eventEntity.RecurrencePattern = updateEventDto.RecurrencePattern;
                eventEntity.RecurrenceInterval = updateEventDto.RecurrenceInterval;
                eventEntity.RecurrenceEndDate = updateEventDto.RecurrenceEndDate.HasValue
                    ? new DateTimeOffset(updateEventDto.RecurrenceEndDate.Value).ToUnixTimeSeconds()
                    : null;
                eventEntity.RecurrenceDaysOfWeek = updateEventDto.RecurrenceDaysOfWeek;
                eventEntity.RelatedProjectId = updateEventDto.RelatedProjectId?.ToString();
                eventEntity.RelatedBlogPostId = updateEventDto.RelatedBlogPostId?.ToString();
                eventEntity.UpdatedAt = currentTime;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Event updated successfully with ID {EventId}", id);
                var organizerName = await GetOrganizerNameAsync(int.TryParse(eventEntity.OrganizerId, out var organizerId) ? organizerId : userId);
                return MapToEventDto(eventEntity, organizerName: organizerName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating event with ID {EventId}", id);
                throw;
            }
        }

        public async Task<bool> DeleteEventAsync(Guid id, int userId)
        {
            try
            {
                var eventEntity = await _context.Events.FirstOrDefaultAsync(e => e.Id == id.ToString() && e.IsActive);

                if (eventEntity == null)
                {
                    return false;
                }

                var currentTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

                // Soft delete
                eventEntity.IsActive = false;
                eventEntity.UpdatedAt = currentTime;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Event soft deleted successfully with ID {EventId}", id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting event with ID {EventId}", id);
                throw;
            }
        }

        // Additional interface methods (simplified implementations)

        public Task<IEnumerable<EventSummaryDto>> GenerateRecurringEventsAsync(Guid eventId, DateTime startDate, DateTime endDate)
        {
            // TODO: Implement recurring event generation logic
            return Task.FromResult<IEnumerable<EventSummaryDto>>(new List<EventSummaryDto>());
        }

        public async Task<EventDto> UpdateRecurringEventAsync(Guid id, UpdateEventDto updateEventDto, int userId, bool updateSeries = false)
        {
            // For now, just update the single event
            return await UpdateEventAsync(id, updateEventDto, userId);
        }

        public async Task<bool> DeleteRecurringEventAsync(Guid id, int userId, bool deleteSeries = false)
        {
            // For now, just delete the single event
            return await DeleteEventAsync(id, userId);
        }

        public async Task<IEnumerable<EventTypeDto>> GetEventTypesAsync()
        {
            try
            {
                var eventTypes = await _context.Events
                    .Where(e => e.IsActive)
                    .GroupBy(e => e.EventType)
                    .Select(g => new EventTypeDto
                    {
                        Type = g.Key,
                        DisplayName = g.Key,
                        Count = g.Count(),
                        Color = GetEventTypeColor(g.Key),
                        Icon = GetEventTypeIcon(g.Key)
                    })
                    .ToListAsync();

                return eventTypes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving event types");
                throw;
            }
        }

        public async Task<IEnumerable<EventSummaryDto>> GetEventsByTypeAsync(string eventType, DateTime? startDate = null, DateTime? endDate = null)
        {
            try
            {
                var query = _context.Events
                    .Where(e => e.IsActive && e.EventType == eventType);

                if (startDate.HasValue)
                {
                    var startTimestamp = new DateTimeOffset(startDate.Value).ToUnixTimeSeconds();
                    query = query.Where(e => e.StartDateTime >= startTimestamp);
                }

                if (endDate.HasValue)
                {
                    var endTimestamp = new DateTimeOffset(endDate.Value).ToUnixTimeSeconds();
                    query = query.Where(e => e.StartDateTime <= endTimestamp);
                }

                var events = await query
                    .OrderBy(e => e.StartDateTime)
                    .ToListAsync();

                var organizerNames = await GetOrganizerNamesAsync(events);

                return events
                    .Select(e => MapToEventSummaryDto(e, ResolveOrganizerName(e, organizerNames)))
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving events by type {EventType}", eventType);
                throw;
            }
        }

        public async Task<IEnumerable<EventSummaryDto>> GetEventsByProjectAsync(Guid projectId)
        {
            try
            {
                var events = await _context.Events
                    .Where(e => e.IsActive && e.RelatedProjectId == projectId.ToString())
                    .OrderBy(e => e.StartDateTime)
                    .ToListAsync();

                var organizerNames = await GetOrganizerNamesAsync(events);

                return events
                    .Select(e => MapToEventSummaryDto(e, ResolveOrganizerName(e, organizerNames)))
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving events by project {ProjectId}", projectId);
                throw;
            }
        }

        public async Task<IEnumerable<EventSummaryDto>> GetEventsByBlogPostAsync(Guid blogPostId)
        {
            try
            {
                var events = await _context.Events
                    .Where(e => e.IsActive && e.RelatedBlogPostId == blogPostId.ToString())
                    .OrderBy(e => e.StartDateTime)
                    .ToListAsync();

                var organizerNames = await GetOrganizerNamesAsync(events);

                return events
                    .Select(e => MapToEventSummaryDto(e, ResolveOrganizerName(e, organizerNames)))
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving events by blog post {BlogPostId}", blogPostId);
                throw;
            }
        }

        public async Task<bool> RegisterToEventAsync(Guid eventId, int userId)
        {
            // TODO: Implement registration logic
            return await Task.FromResult(false);
        }

        public async Task<bool> UnregisterFromEventAsync(Guid eventId, int userId)
        {
            // TODO: Implement unregistration logic
            return await Task.FromResult(false);
        }

        public Task<IEnumerable<EventSummaryDto>> GetUserRegisteredEventsAsync(int userId)
        {
            // TODO: Implement user registered events logic
            return Task.FromResult<IEnumerable<EventSummaryDto>>(new List<EventSummaryDto>());
        }

        public async Task<object> GetEventStatisticsAsync(DateTime? startDate = null, DateTime? endDate = null)
        {
            try
            {
                var query = _context.Events.Where(e => e.IsActive);

                if (startDate.HasValue)
                {
                    var startTimestamp = new DateTimeOffset(startDate.Value).ToUnixTimeSeconds();
                    query = query.Where(e => e.StartDateTime >= startTimestamp);
                }

                if (endDate.HasValue)
                {
                    var endTimestamp = new DateTimeOffset(endDate.Value).ToUnixTimeSeconds();
                    query = query.Where(e => e.StartDateTime <= endTimestamp);
                }

                var currentTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                var totalEvents = await query.CountAsync();
                var upcomingEvents = await query.Where(e => e.StartDateTime >= currentTime).CountAsync();
                var featuredEvents = await query.Where(e => e.IsFeatured).CountAsync();

                return new
                {
                    TotalEvents = totalEvents,
                    UpcomingEvents = upcomingEvents,
                    FeaturedEvents = featuredEvents
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving event statistics");
                throw;
            }
        }

        public async Task<bool> SetEventFeaturedAsync(Guid eventId, bool isFeatured, int userId)
        {
            try
            {
                var eventEntity = await _context.Events.FirstOrDefaultAsync(e => e.Id == eventId.ToString() && e.IsActive);

                if (eventEntity == null)
                {
                    return false;
                }

                var currentTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                eventEntity.IsFeatured = isFeatured;
                eventEntity.UpdatedAt = currentTime;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Event featured status updated for ID {EventId} to {IsFeatured}", eventId, isFeatured);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating featured status for event {EventId}", eventId);
                throw;
            }
        }

        // Private helper methods

        private static EventDto MapToEventDto(Event eventEntity, string? relatedBlogPostTitle = null, string? relatedBlogPostSlug = null, string? relatedProjectTitle = null, string? organizerName = null)
        {
            return new EventDto
            {
                Id = Guid.TryParse(eventEntity.Id, out var eventGuid) ? eventGuid : Guid.Empty,
                Title = eventEntity.Title,
                Description = eventEntity.Description,
                StartDateTime = DateTimeOffset.FromUnixTimeSeconds(eventEntity.StartDateTime).DateTime,
                EndDateTime = eventEntity.EndDateTime.HasValue
                    ? DateTimeOffset.FromUnixTimeSeconds(eventEntity.EndDateTime.Value).DateTime
                    : null,
                IsAllDay = eventEntity.IsAllDay,
                Location = eventEntity.Location,
                EventType = eventEntity.EventType,
                IsActive = eventEntity.IsActive,
                IsFeatured = eventEntity.IsFeatured,
                IsRecurring = eventEntity.IsRecurring,
                RecurrencePattern = eventEntity.RecurrencePattern,
                RecurrenceInterval = eventEntity.RecurrenceInterval,
                RecurrenceEndDate = eventEntity.RecurrenceEndDate.HasValue
                    ? DateTimeOffset.FromUnixTimeSeconds(eventEntity.RecurrenceEndDate.Value).DateTime
                    : null,
                RecurrenceDaysOfWeek = eventEntity.RecurrenceDaysOfWeek,
                RelatedProjectId = eventEntity.RelatedProjectId != null && Guid.TryParse(eventEntity.RelatedProjectId, out var projectGuid) ? projectGuid : null,
                RelatedProjectTitle = relatedProjectTitle,
                RelatedBlogPostId = eventEntity.RelatedBlogPostId != null && Guid.TryParse(eventEntity.RelatedBlogPostId, out var blogGuid) ? blogGuid : null,
                RelatedBlogPostTitle = relatedBlogPostTitle,
                RelatedBlogPostSlug = relatedBlogPostSlug,
                CreatedAt = DateTimeOffset.FromUnixTimeSeconds(eventEntity.CreatedAt).DateTime,
                UpdatedAt = eventEntity.UpdatedAt.HasValue
                    ? DateTimeOffset.FromUnixTimeSeconds(eventEntity.UpdatedAt.Value).DateTime
                    : null,
                OrganizerId = int.TryParse(eventEntity.OrganizerId, out var organizerId) ? organizerId : 0,
                OrganizerName = organizerName ?? "Organizer"
            };
        }

        private static EventSummaryDto MapToEventSummaryDto(Event eventEntity, string? organizerName = null)
        {
            return new EventSummaryDto
            {
                Id = Guid.TryParse(eventEntity.Id, out var eventGuid) ? eventGuid : Guid.Empty,
                Title = eventEntity.Title,
                Description = eventEntity.Description,
                StartDateTime = DateTimeOffset.FromUnixTimeSeconds(eventEntity.StartDateTime).DateTime,
                EndDateTime = eventEntity.EndDateTime.HasValue
                    ? DateTimeOffset.FromUnixTimeSeconds(eventEntity.EndDateTime.Value).DateTime
                    : null,
                IsAllDay = eventEntity.IsAllDay,
                Location = eventEntity.Location,
                EventType = eventEntity.EventType,
                IsFeatured = eventEntity.IsFeatured,
                IsRecurring = eventEntity.IsRecurring,
                OrganizerName = organizerName ?? "Organizer",
                RelatedProjectId = eventEntity.RelatedProjectId != null && Guid.TryParse(eventEntity.RelatedProjectId, out var projectGuid) ? projectGuid : null,
                RelatedProjectTitle = null, // Navigation property removed - use manual lookup if needed
                RelatedBlogPostId = eventEntity.RelatedBlogPostId != null && Guid.TryParse(eventEntity.RelatedBlogPostId, out var blogGuid) ? blogGuid : null,
                RelatedBlogPostTitle = null, // Navigation property removed - use manual lookup if needed
                RelatedBlogPostSlug = null // Navigation property removed - use manual lookup if needed
            };
        }

        private async Task<Dictionary<int, string>> GetOrganizerNamesAsync(IEnumerable<Event> events)
        {
            var organizerIds = events
                .Select(e => e.OrganizerId)
                .Select(id =>
                {
                    if (string.IsNullOrWhiteSpace(id) || !int.TryParse(id, out var parsed))
                    {
                        return (int?)null;
                    }

                    return parsed;
                })
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();

            var organizerNames = new Dictionary<int, string>();

            if (!organizerIds.Any())
            {
                return organizerNames;
            }

            var organizers = await _context.Usuarios
                .Where(u => organizerIds.Contains(u.IdUsuario))
                .Select(u => new { u.IdUsuario, u.NombreUsuario, u.Nombre, u.Apellido })
                .ToListAsync();

            foreach (var organizer in organizers)
            {
                var nameParts = new[] { organizer.Nombre, organizer.Apellido }
                    .Where(part => !string.IsNullOrWhiteSpace(part))
                    .ToArray();

                var displayName = nameParts.Length > 0
                    ? string.Join(" ", nameParts)
                    : organizer.NombreUsuario;

                organizerNames[organizer.IdUsuario] = string.IsNullOrWhiteSpace(displayName)
                    ? organizer.NombreUsuario
                    : displayName;
            }

            return organizerNames;
        }

        private async Task<string> GetOrganizerNameAsync(int organizerId)
        {
            var organizer = await _context.Usuarios
                .Where(u => u.IdUsuario == organizerId)
                .Select(u => new { u.NombreUsuario, u.Nombre, u.Apellido })
                .FirstOrDefaultAsync();

            if (organizer == null)
            {
                return "Organizer";
            }

            var nameParts = new[] { organizer.Nombre, organizer.Apellido }
                .Where(part => !string.IsNullOrWhiteSpace(part))
                .ToArray();

            var displayName = nameParts.Length > 0 ? string.Join(" ", nameParts) : organizer.NombreUsuario;

            return string.IsNullOrWhiteSpace(displayName) ? organizer.NombreUsuario : displayName;
        }

        private static string ResolveOrganizerName(Event eventEntity, IDictionary<int, string> organizerNames)
        {
            if (!string.IsNullOrWhiteSpace(eventEntity.OrganizerId) && int.TryParse(eventEntity.OrganizerId, out var organizerId) && organizerNames.TryGetValue(organizerId, out var name))
            {
                return name;
            }

            return "Organizer";
        }

        private static string GetEventTypeColor(string eventType)
        {
            return eventType.ToLower() switch
            {
                "clase" or "clases" => "#3B82F6", // blue
                "taller" or "talleres" => "#10B981", // green
                "conferencia" or "conferencias" => "#8B5CF6", // purple
                "evento cultural" or "eventos culturales" => "#F59E0B", // yellow
                _ => "#6B7280" // gray
            };
        }

        private static string GetEventTypeIcon(string eventType)
        {
            return eventType.ToLower() switch
            {
                "clase" or "clases" => "academic-cap",
                "taller" or "talleres" => "cog",
                "conferencia" or "conferencias" => "microphone",
                "evento cultural" or "eventos culturales" => "music-note",
                _ => "calendar"
            };
        }
    }
}
