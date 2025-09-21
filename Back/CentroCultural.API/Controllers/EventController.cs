using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventController : ControllerBase
    {
        private readonly IEventService _eventService;
        private readonly ILogger<EventController> _logger;

        public EventController(IEventService eventService, ILogger<EventController> logger)
        {
            _eventService = eventService;
            _logger = logger;
        }

        // GET: api/event
        [HttpGet]
        public async Task<ActionResult<EventPagedResultDto>> GetEvents([FromQuery] EventSearchDto searchDto)
        {
            try
            {
                var events = await _eventService.GetEventsAsync(searchDto);
                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo eventos");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/event/calendar/{year}/{month}
        [HttpGet("calendar/{year}/{month}")]
        public async Task<ActionResult<IEnumerable<EventSummaryDto>>> GetEventsForMonth(int year, int month)
        {
            try
            {
                var events = await _eventService.GetEventsForMonthAsync(year, month);
                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo eventos del calendario para {Year}-{Month}", year, month);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/event/upcoming
        [HttpGet("upcoming")]
        public async Task<ActionResult<IEnumerable<EventSummaryDto>>> GetUpcomingEvents([FromQuery] int count = 6)
        {
            try
            {
                var events = await _eventService.GetUpcomingEventsAsync(count);
                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo próximos eventos");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/event/featured
        [HttpGet("featured")]
        public async Task<ActionResult<IEnumerable<EventSummaryDto>>> GetFeaturedEvents([FromQuery] int count = 6)
        {
            try
            {
                var events = await _eventService.GetFeaturedEventsAsync(count);
                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo eventos destacados");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/event/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<EventDetailDto>> GetEvent(Guid id)
        {
            try
            {
                var eventItem = await _eventService.GetEventByIdAsync(id);

                if (eventItem == null)
                    return NotFound($"Evento con ID {id} no encontrado");

                return Ok(eventItem);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo evento con ID: {EventId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // POST: api/event
        [Authorize(Roles = "Colaborador,Administrador")]
        [HttpPost]
        public async Task<ActionResult<EventDto>> CreateEvent([FromBody] CreateEventDto eventDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var eventItem = await _eventService.CreateEventAsync(eventDto, int.Parse(userIdClaim));
                return CreatedAtAction(nameof(GetEvent), new { id = eventItem.Id }, eventItem);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para crear eventos");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando evento");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // PUT: api/event/{id}
        [Authorize(Roles = "Colaborador,Administrador")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEvent(Guid id, [FromBody] UpdateEventDto eventDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var result = await _eventService.UpdateEventAsync(id, eventDto, int.Parse(userIdClaim));

                if (!result)
                    return NotFound($"Evento con ID {id} no encontrado");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para editar este evento");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error actualizando evento: {EventId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // DELETE: api/event/{id}
        [Authorize(Roles = "Colaborador,Administrador")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEvent(Guid id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var result = await _eventService.DeleteEventAsync(id, int.Parse(userIdClaim));

                if (!result)
                    return NotFound($"Evento con ID {id} no encontrado");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para eliminar este evento");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error eliminando evento: {EventId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/event/{id}/registrations
        [Authorize(Roles = "Colaborador,Administrador")]
        [HttpGet("{id}/registrations")]
        public async Task<ActionResult<IEnumerable<EventRegistrationDto>>> GetEventRegistrations(Guid id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var registrations = await _eventService.GetEventRegistrationsAsync(id, int.Parse(userIdClaim));
                return Ok(registrations);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para ver las inscripciones de este evento");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo inscripciones del evento: {EventId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // POST: api/event/{id}/register
        [HttpPost("{id}/register")]
        public async Task<ActionResult<EventRegistrationDto>> RegisterForEvent(Guid id, [FromBody] CreateEventRegistrationDto registrationDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                var registration = await _eventService.RegisterForEventAsync(id, registrationDto, int.TryParse(userIdClaim, out var userId) ? userId : (int?)null);
                return CreatedAtAction(nameof(GetEventRegistrations), new { id }, registration);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registrando para el evento: {EventId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // PUT: api/event/registration/{registrationId}/status
        [Authorize(Roles = "Colaborador,Administrador")]
        [HttpPut("registration/{registrationId}/status")]
        public async Task<IActionResult> UpdateRegistrationStatus(Guid registrationId, [FromBody] UpdateRegistrationStatusDto statusDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var result = await _eventService.UpdateRegistrationStatusAsync(registrationId, statusDto, int.Parse(userIdClaim));

                if (!result)
                    return NotFound($"Inscripción con ID {registrationId} no encontrada");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para actualizar esta inscripción");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error actualizando estado de inscripción: {RegistrationId}", registrationId);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/event/my-events
        [Authorize(Roles = "Colaborador,Administrador")]
        [HttpGet("my-events")]
        public async Task<ActionResult<IEnumerable<EventSummaryDto>>> GetMyEvents()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var events = await _eventService.GetEventsByOrganizerAsync(int.Parse(userIdClaim));
                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo eventos del organizador");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/event/types
        [HttpGet("types")]
        public async Task<ActionResult<IEnumerable<string>>> GetEventTypes()
        {
            try
            {
                var types = await _eventService.GetEventTypesAsync();
                return Ok(types);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo tipos de evento");
                return StatusCode(500, "Error interno del servidor");
            }
        }
    }
}