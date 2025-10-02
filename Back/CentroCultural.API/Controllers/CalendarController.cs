using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CalendarController : ControllerBase
    {
        private readonly ICalendarService _calendarService;
        private readonly ILogger<CalendarController> _logger;

        public CalendarController(ICalendarService calendarService, ILogger<CalendarController> logger)
        {
            _calendarService = calendarService;
            _logger = logger;
        }

        // GET: api/calendar
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EventSummaryDto>>> GetEvents([FromQuery] EventSearchDto searchDto)
        {
            try
            {
                var result = await _calendarService.GetEventsAsync(searchDto);
                return Ok(result.Events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving events");
                return StatusCode(500, "Error retrieving events");
            }
        }

        // GET: api/calendar/paged
        [HttpPost("search")]
        public async Task<ActionResult<EventPagedResultDto>> GetEventsPaged([FromBody] EventSearchDto searchDto)
        {
            try
            {
                var result = await _calendarService.GetEventsAsync(searchDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving paginated events");
                return StatusCode(500, "Error retrieving events");
            }
        }

        // GET: api/calendar/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<EventDto>> GetEvent(Guid id)
        {
            try
            {
                var eventDto = await _calendarService.GetEventByIdAsync(id);

                if (eventDto == null)
                {
                    return NotFound($"Event with ID {id} not found");
                }

                return Ok(eventDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving event {EventId}", id);
                return StatusCode(500, "Error retrieving event");
            }
        }

        // GET: api/calendar/view
        [HttpGet("view")]
        public async Task<ActionResult<CalendarViewDto>> GetCalendarView(
            [FromQuery] DateTime viewDate,
            [FromQuery] string viewType = "month")
        {
            try
            {
                var result = await _calendarService.GetCalendarViewAsync(viewDate, viewType);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving calendar view for {ViewDate} with type {ViewType}", viewDate, viewType);
                return StatusCode(500, "Error retrieving calendar view");
            }
        }

        // GET: api/calendar/upcoming
        [HttpGet("upcoming")]
        public async Task<ActionResult<IEnumerable<EventSummaryDto>>> GetUpcomingEvents([FromQuery] int limit = 10)
        {
            try
            {
                var events = await _calendarService.GetUpcomingEventsAsync(limit);
                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving upcoming events");
                return StatusCode(500, "Error retrieving upcoming events");
            }
        }

        // GET: api/calendar/featured
        [HttpGet("featured")]
        public async Task<ActionResult<IEnumerable<EventSummaryDto>>> GetFeaturedEvents([FromQuery] int limit = 5)
        {
            try
            {
                var events = await _calendarService.GetFeaturedEventsAsync(limit);
                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving featured events");
                return StatusCode(500, "Error retrieving featured events");
            }
        }

        // GET: api/calendar/types
        [HttpGet("types")]
        public async Task<ActionResult<IEnumerable<EventTypeDto>>> GetEventTypes()
        {
            try
            {
                var eventTypes = await _calendarService.GetEventTypesAsync();
                return Ok(eventTypes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving event types");
                return StatusCode(500, "Error retrieving event types");
            }
        }

        // GET: api/calendar/type/{eventType}
        [HttpGet("type/{eventType}")]
        public async Task<ActionResult<IEnumerable<EventSummaryDto>>> GetEventsByType(
            string eventType,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var events = await _calendarService.GetEventsByTypeAsync(eventType, startDate, endDate);
                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving events by type {EventType}", eventType);
                return StatusCode(500, "Error retrieving events by type");
            }
        }

        // GET: api/calendar/course/{courseId}
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<IEnumerable<EventSummaryDto>>> GetEventsByCourse(Guid courseId)
        {
            try
            {
                var events = await _calendarService.GetEventsByCourseAsync(courseId);
                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving events by course {CourseId}", courseId);
                return StatusCode(500, "Error retrieving events by course");
            }
        }

        // GET: api/calendar/blog/{blogPostId}
        [HttpGet("blog/{blogPostId}")]
        public async Task<ActionResult<IEnumerable<EventSummaryDto>>> GetEventsByBlogPost(Guid blogPostId)
        {
            try
            {
                var events = await _calendarService.GetEventsByBlogPostAsync(blogPostId);
                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving events by blog post {BlogPostId}", blogPostId);
                return StatusCode(500, "Error retrieving events by blog post");
            }
        }

        // GET: api/calendar/statistics
        [HttpGet("statistics")]
        public async Task<ActionResult<object>> GetEventStatistics(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var stats = await _calendarService.GetEventStatisticsAsync(startDate, endDate);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving event statistics");
                return StatusCode(500, "Error retrieving event statistics");
            }
        }

        // POST: api/calendar
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<EventDto>> CreateEvent([FromBody] CreateEventDto createEventDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized("User ID not found in token");
                }

                var eventDto = await _calendarService.CreateEventAsync(createEventDto, userId.Value);

                _logger.LogInformation("Event created successfully with ID {EventId} by user {UserId}", eventDto.Id, userId);

                return CreatedAtAction(nameof(GetEvent), new { id = eventDto.Id }, eventDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating event");
                return StatusCode(500, "Error creating event");
            }
        }

        // PUT: api/calendar/{id}
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<EventDto>> UpdateEvent(Guid id, [FromBody] UpdateEventDto updateEventDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized("User ID not found in token");
                }

                var eventDto = await _calendarService.UpdateEventAsync(id, updateEventDto, userId.Value);

                _logger.LogInformation("Event updated successfully with ID {EventId} by user {UserId}", id, userId);

                return Ok(eventDto);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Event not found for update: {EventId}", id);
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating event {EventId}", id);
                return StatusCode(500, "Error updating event");
            }
        }

        // DELETE: api/calendar/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<ActionResult> DeleteEvent(Guid id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized("User ID not found in token");
                }

                var success = await _calendarService.DeleteEventAsync(id, userId.Value);

                if (!success)
                {
                    return NotFound($"Event with ID {id} not found");
                }

                _logger.LogInformation("Event deleted successfully with ID {EventId} by user {UserId}", id, userId);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting event {EventId}", id);
                return StatusCode(500, "Error deleting event");
            }
        }

        // PUT: api/calendar/{id}/featured
        [HttpPut("{id}/featured")]
        [Authorize]
        public async Task<ActionResult> SetEventFeatured(Guid id, [FromBody] bool isFeatured)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized("User ID not found in token");
                }

                var success = await _calendarService.SetEventFeaturedAsync(id, isFeatured, userId.Value);

                if (!success)
                {
                    return NotFound($"Event with ID {id} not found");
                }

                _logger.LogInformation("Event featured status updated for ID {EventId} to {IsFeatured} by user {UserId}", id, isFeatured, userId);

                return Ok(new { message = "Event featured status updated successfully", isFeatured });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating featured status for event {EventId}", id);
                return StatusCode(500, "Error updating featured status");
            }
        }

        // POST: api/calendar/{id}/register
        [HttpPost("{id}/register")]
        [Authorize]
        public async Task<ActionResult> RegisterToEvent(Guid id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized("User ID not found in token");
                }

                var success = await _calendarService.RegisterToEventAsync(id, userId.Value);

                if (!success)
                {
                    return BadRequest("Unable to register to event. It may be full or registration may be closed.");
                }

                _logger.LogInformation("User {UserId} registered to event {EventId}", userId, id);

                return Ok(new { message = "Registration successful" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering user to event {EventId}", id);
                return StatusCode(500, "Error processing registration");
            }
        }

        // DELETE: api/calendar/{id}/register
        [HttpDelete("{id}/register")]
        [Authorize]
        public async Task<ActionResult> UnregisterFromEvent(Guid id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized("User ID not found in token");
                }

                var success = await _calendarService.UnregisterFromEventAsync(id, userId.Value);

                if (!success)
                {
                    return BadRequest("Unable to unregister from event");
                }

                _logger.LogInformation("User {UserId} unregistered from event {EventId}", userId, id);

                return Ok(new { message = "Unregistration successful" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unregistering user from event {EventId}", id);
                return StatusCode(500, "Error processing unregistration");
            }
        }

        // GET: api/calendar/user/registered
        [HttpGet("user/registered")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<EventSummaryDto>>> GetUserRegisteredEvents()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized("User ID not found in token");
                }

                var events = await _calendarService.GetUserRegisteredEventsAsync(userId.Value);
                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user registered events");
                return StatusCode(500, "Error retrieving registered events");
            }
        }

        // Helper method to get current user ID from JWT token
        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("IdUsuario")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }

            return null;
        }
    }
}