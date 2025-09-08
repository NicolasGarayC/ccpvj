using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WorkItemController : ControllerBase
    {
        private readonly IWorkItemService _workItemService;
        private readonly ILogger<WorkItemController> _logger;

        public WorkItemController(IWorkItemService workItemService, ILogger<WorkItemController> logger)
        {
            _workItemService = workItemService;
            _logger = logger;
        }

        // GET: api/workitem/module/{moduleId}
        [HttpGet("module/{moduleId}")]
        public async Task<ActionResult<IEnumerable<WorkItemDto>>> GetWorkItemsByModule(Guid moduleId)
        {
            try
            {
                var workItems = await _workItemService.GetWorkItemsByModuleAsync(moduleId);
                return Ok(workItems);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo WorkItems del módulo: {ModuleId}", moduleId);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/workitem/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<WorkItemDetailDto>> GetWorkItem(Guid id)
        {
            try
            {
                var workItem = await _workItemService.GetWorkItemByIdAsync(id);
                
                if (workItem == null)
                    return NotFound($"WorkItem con ID {id} no encontrado");

                return Ok(workItem);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo WorkItem con ID: {WorkItemId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/workitem/{id}/media
        [HttpGet("{id}/media")]
        public async Task<ActionResult<IEnumerable<MediaFileDto>>> GetWorkItemMedia(Guid id)
        {
            try
            {
                var mediaFiles = await _workItemService.GetWorkItemMediaAsync(id);
                return Ok(mediaFiles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo media del WorkItem: {WorkItemId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // POST: api/workitem
        [Authorize(Roles = "Colaborador,Administrador")]
        [HttpPost]
        public async Task<ActionResult<WorkItemDto>> CreateWorkItem([FromBody] CreateWorkItemDto workItemDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var workItem = await _workItemService.CreateWorkItemAsync(workItemDto, userIdClaim);
                return CreatedAtAction(nameof(GetWorkItem), new { id = workItem.Id }, workItem);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para crear WorkItems en este módulo");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando WorkItem");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // PUT: api/workitem/{id}
        [Authorize(Roles = "Colaborador,Administrador")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWorkItem(Guid id, [FromBody] UpdateWorkItemDto workItemDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var result = await _workItemService.UpdateWorkItemAsync(id, workItemDto, userIdClaim);

                if (!result)
                    return NotFound($"WorkItem con ID {id} no encontrado o no tienes permisos para editarlo");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para editar este WorkItem");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error actualizando WorkItem: {WorkItemId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // DELETE: api/workitem/{id}
        [Authorize(Roles = "Colaborador,Administrador")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWorkItem(Guid id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var result = await _workItemService.DeleteWorkItemAsync(id, userIdClaim);

                if (!result)
                    return NotFound($"WorkItem con ID {id} no encontrado o no tienes permisos para eliminarlo");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para eliminar este WorkItem");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error eliminando WorkItem: {WorkItemId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // POST: api/workitem/{id}/reorder
        [Authorize(Roles = "Colaborador,Administrador")]
        [HttpPost("{id}/reorder")]
        public async Task<IActionResult> ReorderWorkItem(Guid id, [FromBody] ReorderWorkItemDto reorderDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var result = await _workItemService.ReorderWorkItemAsync(id, reorderDto.NewOrderNumber, userIdClaim);

                if (!result)
                    return NotFound($"WorkItem con ID {id} no encontrado o no tienes permisos para reordenarlo");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para reordenar WorkItems en este módulo");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reordenando WorkItem: {WorkItemId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/workitem/course/{courseId}/all
        [HttpGet("course/{courseId}/all")]
        public async Task<ActionResult<IEnumerable<WorkItemWithModuleDto>>> GetWorkItemsByCourse(Guid courseId)
        {
            try
            {
                var workItems = await _workItemService.GetWorkItemsByCourseAsync(courseId);
                return Ok(workItems);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo WorkItems del curso: {CourseId}", courseId);
                return StatusCode(500, "Error interno del servidor");
            }
        }
    }
}