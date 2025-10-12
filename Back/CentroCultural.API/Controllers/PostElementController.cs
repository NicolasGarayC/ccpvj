using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PostElementController : ControllerBase
    {
        private readonly IPostElementService _postElementService;
        private readonly ILogger<PostElementController> _logger;

        public PostElementController(IPostElementService postElementService, ILogger<PostElementController> logger)
        {
            _postElementService = postElementService;
            _logger = logger;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : 0;
        }

        // GET: api/postelement/by-post/{postId}
        [HttpGet("by-post/{postId}")]
        public async Task<ActionResult<IEnumerable<PostElementDto>>> GetElementsByPostId(string postId)
        {
            try
            {
                var elements = await _postElementService.GetElementsByPostIdAsync(postId);
                return Ok(elements);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo elementos del post: {PostId}", postId);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/postelement/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<PostElementDto>> GetElement(string id)
        {
            try
            {
                var element = await _postElementService.GetElementByIdAsync(id);

                if (element == null)
                    return NotFound($"Elemento con ID {id} no encontrado");

                return Ok(element);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo elemento con ID: {ElementId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // POST: api/postelement
        [HttpPost]
        public async Task<ActionResult<PostElementDto>> CreateElement([FromBody] CreatePostElementDto elementDto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var element = await _postElementService.CreateElementAsync(elementDto, userId);
                return CreatedAtAction(nameof(GetElement), new { id = element.Id }, element);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para crear elementos de post");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando elemento de post");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // POST: api/postelement/batch
        [HttpPost("batch")]
        public async Task<ActionResult<IEnumerable<PostElementDto>>> CreateElementsBatch([FromBody] CreateElementsBatchDto batchDto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var elements = await _postElementService.CreateElementsInBatchAsync(batchDto, userId);
                return Ok(elements);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para crear elementos de post");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando elementos de post en lote");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // PUT: api/postelement/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateElement(string id, [FromBody] UpdatePostElementDto elementDto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var result = await _postElementService.UpdateElementAsync(id, elementDto, userId);

                if (!result)
                    return NotFound($"Elemento con ID {id} no encontrado");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para editar este elemento");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error actualizando elemento: {ElementId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // DELETE: api/postelement/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteElement(string id)
        {
            try
            {
                var userId = GetCurrentUserId();

                var result = await _postElementService.DeleteElementAsync(id, userId);

                if (!result)
                    return NotFound($"Elemento con ID {id} no encontrado");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para eliminar este elemento");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error eliminando elemento: {ElementId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // PATCH: api/postelement/{id}/reorder
        [HttpPatch("{id}/reorder")]
        public async Task<IActionResult> ReorderElement(string id, [FromBody] ReorderElementDto reorderDto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var result = await _postElementService.ReorderElementAsync(id, reorderDto.NewOrderNumber, userId);

                if (!result)
                    return NotFound($"Elemento con ID {id} no encontrado");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para reordenar elementos en este post");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reordenando elemento: {ElementId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // DELETE: api/postelement/by-post/{postId}
        [HttpDelete("by-post/{postId}")]
        public async Task<IActionResult> DeleteElementsByPostId(string postId)
        {
            try
            {
                var userId = GetCurrentUserId();

                var result = await _postElementService.DeleteElementsByPostIdAsync(postId, userId);

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para eliminar elementos de este post");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error eliminando elementos del post: {PostId}", postId);
                return StatusCode(500, "Error interno del servidor");
            }
        }
    }
}