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

                return eventEntity == null ? null : MapToEventDto(eventEntity);
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

                if (searchDto.RequiresRegistration.HasValue)
                {
                    query = query.Where(e => e.RequiresRegistration == searchDto.RequiresRegistration.Value);
                }

                if (searchDto.RelatedCourseId.HasValue)
                {
                    query = query.Where(e => e.RelatedCourseId == searchDto.RelatedCourseId.ToString());
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

                var events = await query
                    .Skip((searchDto.Page - 1) * searchDto.PageSize)
                    .Take(searchDto.PageSize)
                    .Select(e => MapToEventSummaryDto(e))
                    .ToListAsync();

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

                var events = await _context.Events
                    .Where(e => e.IsActive && e.StartDateTime >= startTimestamp && e.StartDateTime < endTimestamp)
                    .OrderBy(e => e.StartDateTime)
                    .Select(e => MapToEventSummaryDto(e))
                    .ToListAsync();

                return new CalendarViewDto
                {
                    ViewDate = viewDate,
                    ViewType = viewType,
                    Events = events
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving calendar view for {ViewDate} with type {ViewType}", viewDate, viewType);
                throw;
            }
        }

        public async Task<IEnumerable<EventSummaryDto>> GetFeaturedEventsAsync(int limit = 5)
        {
            try
            {
                var currentTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                return await _context.Events
                    .Where(e => e.IsActive && e.IsFeatured && e.StartDateTime >= currentTime)
                    .OrderBy(e => e.StartDateTime)
                    .Take(limit)
                    .Select(e => MapToEventSummaryDto(e))
                    .ToListAsync();
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
                return await _context.Events
                    .Where(e => e.IsActive && e.StartDateTime >= currentTime)
                    .OrderBy(e => e.StartDateTime)
                    .Take(limit)
                    .Select(e => MapToEventSummaryDto(e))
                    .ToListAsync();
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
                    MaxAttendees = createEventDto.MaxAttendees,
                    RequiresRegistration = createEventDto.RequiresRegistration,
                    RegistrationDeadline = createEventDto.RegistrationDeadline.HasValue
                        ? new DateTimeOffset(createEventDto.RegistrationDeadline.Value).ToUnixTimeSeconds()
                        : null,
                    ImagePath = createEventDto.ImagePath,
                    PdfPath = createEventDto.PdfPath,
                    IsRecurring = createEventDto.IsRecurring,
                    RecurrencePattern = createEventDto.RecurrencePattern,
                    RecurrenceInterval = createEventDto.RecurrenceInterval,
                    RecurrenceEndDate = createEventDto.RecurrenceEndDate.HasValue
                        ? new DateTimeOffset(createEventDto.RecurrenceEndDate.Value).ToUnixTimeSeconds()
                        : null,
                    RecurrenceDaysOfWeek = createEventDto.RecurrenceDaysOfWeek,
                    RelatedCourseId = createEventDto.RelatedCourseId?.ToString(),
                    RelatedBlogPostId = createEventDto.RelatedBlogPostId?.ToString(),
                    CreatedAt = currentTime,
                    OrganizerId = organizerId.ToString(),
                    IsActive = true
                };

                _context.Events.Add(eventEntity);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Event created successfully with ID {EventId}", eventEntity.Id);
                return MapToEventDto(eventEntity);
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
                eventEntity.MaxAttendees = updateEventDto.MaxAttendees;
                eventEntity.RequiresRegistration = updateEventDto.RequiresRegistration;
                eventEntity.RegistrationDeadline = updateEventDto.RegistrationDeadline.HasValue
                    ? new DateTimeOffset(updateEventDto.RegistrationDeadline.Value).ToUnixTimeSeconds()
                    : null;
                eventEntity.ImagePath = updateEventDto.ImagePath;
                eventEntity.PdfPath = updateEventDto.PdfPath;
                eventEntity.IsRecurring = updateEventDto.IsRecurring;
                eventEntity.RecurrencePattern = updateEventDto.RecurrencePattern;
                eventEntity.RecurrenceInterval = updateEventDto.RecurrenceInterval;
                eventEntity.RecurrenceEndDate = updateEventDto.RecurrenceEndDate.HasValue
                    ? new DateTimeOffset(updateEventDto.RecurrenceEndDate.Value).ToUnixTimeSeconds()
                    : null;
                eventEntity.RecurrenceDaysOfWeek = updateEventDto.RecurrenceDaysOfWeek;
                eventEntity.RelatedCourseId = updateEventDto.RelatedCourseId?.ToString();
                eventEntity.RelatedBlogPostId = updateEventDto.RelatedBlogPostId?.ToString();
                eventEntity.UpdatedAt = currentTime;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Event updated successfully with ID {EventId}", id);
                return MapToEventDto(eventEntity);
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

        public async Task<IEnumerable<EventSummaryDto>> GenerateRecurringEventsAsync(Guid eventId, DateTime startDate, DateTime endDate)
        {
            // TODO: Implement recurring event generation logic
            return new List<EventSummaryDto>();
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

                return await query
                    .OrderBy(e => e.StartDateTime)
                    .Select(e => MapToEventSummaryDto(e))
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving events by type {EventType}", eventType);
                throw;
            }
        }

        public async Task<IEnumerable<EventSummaryDto>> GetEventsByCourseAsync(Guid courseId)
        {
            try
            {
                return await _context.Events
                    .Where(e => e.IsActive && e.RelatedCourseId == courseId.ToString())
                    .OrderBy(e => e.StartDateTime)
                    .Select(e => MapToEventSummaryDto(e))
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving events by course {CourseId}", courseId);
                throw;
            }
        }

        public async Task<IEnumerable<EventSummaryDto>> GetEventsByBlogPostAsync(Guid blogPostId)
        {
            try
            {
                return await _context.Events
                    .Where(e => e.IsActive && e.RelatedBlogPostId == blogPostId.ToString())
                    .OrderBy(e => e.StartDateTime)
                    .Select(e => MapToEventSummaryDto(e))
                    .ToListAsync();
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

        public async Task<IEnumerable<EventSummaryDto>> GetUserRegisteredEventsAsync(int userId)
        {
            // TODO: Implement user registered events logic
            return new List<EventSummaryDto>();
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
                var eventsWithRegistration = await query.Where(e => e.RequiresRegistration).CountAsync();

                return new
                {
                    TotalEvents = totalEvents,
                    UpcomingEvents = upcomingEvents,
                    FeaturedEvents = featuredEvents,
                    EventsWithRegistration = eventsWithRegistration
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

        private static EventDto MapToEventDto(Event eventEntity)
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
                MaxAttendees = eventEntity.MaxAttendees,
                CurrentAttendees = eventEntity.CurrentAttendees,
                RequiresRegistration = eventEntity.RequiresRegistration,
                RegistrationDeadline = eventEntity.RegistrationDeadline.HasValue
                    ? DateTimeOffset.FromUnixTimeSeconds(eventEntity.RegistrationDeadline.Value).DateTime
                    : null,
                ImagePath = eventEntity.ImagePath,
                PdfPath = eventEntity.PdfPath,
                IsRecurring = eventEntity.IsRecurring,
                RecurrencePattern = eventEntity.RecurrencePattern,
                RecurrenceInterval = eventEntity.RecurrenceInterval,
                RecurrenceEndDate = eventEntity.RecurrenceEndDate.HasValue
                    ? DateTimeOffset.FromUnixTimeSeconds(eventEntity.RecurrenceEndDate.Value).DateTime
                    : null,
                RecurrenceDaysOfWeek = eventEntity.RecurrenceDaysOfWeek,
                RelatedCourseId = eventEntity.RelatedCourseId != null && Guid.TryParse(eventEntity.RelatedCourseId, out var courseGuid) ? courseGuid : null,
                RelatedCourseTitle = null, // Navigation property removed - use manual lookup if needed
                RelatedBlogPostId = eventEntity.RelatedBlogPostId != null && Guid.TryParse(eventEntity.RelatedBlogPostId, out var blogGuid) ? blogGuid : null,
                RelatedBlogPostTitle = null, // Navigation property removed - use manual lookup if needed
                RelatedBlogPostSlug = null, // Navigation property removed - use manual lookup if needed
                CreatedAt = DateTimeOffset.FromUnixTimeSeconds(eventEntity.CreatedAt).DateTime,
                UpdatedAt = eventEntity.UpdatedAt.HasValue
                    ? DateTimeOffset.FromUnixTimeSeconds(eventEntity.UpdatedAt.Value).DateTime
                    : null,
                OrganizerId = int.TryParse(eventEntity.OrganizerId, out var organizerId) ? organizerId : 0,
                OrganizerName = "Organizer" // Navigation property removed - use manual lookup if needed
            };
        }

        private static EventSummaryDto MapToEventSummaryDto(Event eventEntity)
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
                ImagePath = eventEntity.ImagePath,
                IsRecurring = eventEntity.IsRecurring,
                OrganizerName = "Organizer", // Navigation property removed - use manual lookup if needed
                RelatedCourseId = eventEntity.RelatedCourseId != null && Guid.TryParse(eventEntity.RelatedCourseId, out var courseGuid) ? courseGuid : null,
                RelatedCourseTitle = null, // Navigation property removed - use manual lookup if needed
                RelatedBlogPostId = eventEntity.RelatedBlogPostId != null && Guid.TryParse(eventEntity.RelatedBlogPostId, out var blogGuid) ? blogGuid : null,
                RelatedBlogPostTitle = null, // Navigation property removed - use manual lookup if needed
                RelatedBlogPostSlug = null // Navigation property removed - use manual lookup if needed
            };
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