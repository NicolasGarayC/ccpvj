using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
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

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : 0;
        }

        // GET: api/workitem/module/{moduleId}
        [HttpGet("module/{moduleId}")]
        public async Task<ActionResult<IEnumerable<WorkItemDto>>> GetWorkItemsByModule(string moduleId)
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
        public async Task<ActionResult<WorkItemDetailDto>> GetWorkItem(string id)
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
        public async Task<ActionResult<IEnumerable<MediaFileDto>>> GetWorkItemMedia(string id)
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
        [HttpPost]
        public async Task<ActionResult<WorkItemDto>> CreateWorkItem([FromBody] CreateWorkItemDto workItemDto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var workItem = await _workItemService.CreateWorkItemAsync(workItemDto, userId.ToString());
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
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWorkItem(string id, [FromBody] UpdateWorkItemDto workItemDto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var result = await _workItemService.UpdateWorkItemAsync(id, workItemDto, userId.ToString());

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
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWorkItem(string id)
        {
            try
            {
                var userId = GetCurrentUserId();

                var result = await _workItemService.DeleteWorkItemAsync(id, userId.ToString());

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
        [HttpPost("{id}/reorder")]
        public async Task<IActionResult> ReorderWorkItem(string id, [FromBody] ReorderWorkItemDto reorderDto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var result = await _workItemService.ReorderWorkItemAsync(id, reorderDto.NewOrderNumber, userId.ToString());

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
        public async Task<ActionResult<IEnumerable<WorkItemWithModuleDto>>> GetWorkItemsByCourse(string courseId)
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