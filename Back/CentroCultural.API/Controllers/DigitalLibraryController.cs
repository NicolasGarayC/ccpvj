using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using System.Security.Claims;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DigitalLibraryController : ControllerBase
    {
        private readonly IDigitalLibraryService _libraryService;
        private readonly ILogger<DigitalLibraryController> _logger;

        public DigitalLibraryController(IDigitalLibraryService libraryService, ILogger<DigitalLibraryController> logger)
        {
            _libraryService = libraryService;
            _logger = logger;
        }

        /// <summary>
        /// Get library items with filtering, searching and pagination
        /// </summary>
        [HttpGet("items")]
        public async Task<ActionResult<LibraryItemPagedResultDto>> GetItems([FromQuery] LibrarySearchDto searchDto)
        {
            try
            {
                var result = await _libraryService.GetItemsAsync(searchDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting library items");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Get a specific library item by ID
        /// </summary>
        [HttpGet("items/{id}")]
        public async Task<ActionResult<LibraryItemDto>> GetItem(string id)
        {
            try
            {
                var item = await _libraryService.GetItemByIdAsync(id);
                if (item == null)
                    return NotFound("Recurso no encontrado");

                return Ok(item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting library item {Id}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Create a new library item
        /// </summary>
        [HttpPost("items")]
        [Authorize]
        public async Task<ActionResult<LibraryItemDto>> CreateItem([FromBody] CreateLibraryItemDto createItemDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized("Usuario no válido");
                }

                // Check user role - only collaborators and admins can create items
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (userRole != "colaborador" && userRole != "administrador")
                {
                    return Forbid("No tienes permisos para crear recursos en la biblioteca");
                }

                var result = await _libraryService.CreateItemAsync(createItemDto, userId);
                return CreatedAtAction(nameof(GetItem), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating library item");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Update a library item
        /// </summary>
        [HttpPut("items/{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateItem(string id, [FromBody] UpdateLibraryItemDto updateItemDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized("Usuario no válido");
                }

                // Check user role - only collaborators and admins can update items
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (userRole != "colaborador" && userRole != "administrador")
                {
                    return Forbid("No tienes permisos para modificar recursos de la biblioteca");
                }

                var success = await _libraryService.UpdateItemAsync(id, updateItemDto, userId);
                if (!success)
                    return NotFound("Recurso no encontrado");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating library item {Id}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Delete a library item
        /// </summary>
        [HttpDelete("items/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteItem(string id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized("Usuario no válido");
                }

                // Check user role - only collaborators and admins can delete items
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (userRole != "colaborador" && userRole != "administrador")
                {
                    return Forbid("No tienes permisos para eliminar recursos de la biblioteca");
                }

                var success = await _libraryService.DeleteItemAsync(id, userId);
                if (!success)
                    return NotFound("Recurso no encontrado");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting library item {Id}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Get all collections
        /// </summary>
        [HttpGet("collections")]
        public async Task<ActionResult<IEnumerable<LibraryCollectionDto>>> GetCollections()
        {
            try
            {
                var collections = await _libraryService.GetCollectionsAsync();
                return Ok(collections);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting library collections");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Get a specific collection by ID
        /// </summary>
        [HttpGet("collections/{id}")]
        public async Task<ActionResult<LibraryCollectionDto>> GetCollection(string id)
        {
            try
            {
                var collection = await _libraryService.GetCollectionByIdAsync(id);
                if (collection == null)
                    return NotFound("Colección no encontrada");

                return Ok(collection);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting library collection {Id}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Create a new collection
        /// </summary>
        [HttpPost("collections")]
        [Authorize]
        public async Task<ActionResult<LibraryCollectionDto>> CreateCollection([FromBody] CreateLibraryCollectionDto createCollectionDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized("Usuario no válido");
                }

                // Check user role - only collaborators and admins can create collections
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (userRole != "colaborador" && userRole != "administrador")
                {
                    return Forbid("No tienes permisos para crear colecciones en la biblioteca");
                }

                var result = await _libraryService.CreateCollectionAsync(createCollectionDto, userId);
                return CreatedAtAction(nameof(GetCollection), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating library collection");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Update a collection
        /// </summary>
        [HttpPut("collections/{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateCollection(string id, [FromBody] UpdateLibraryCollectionDto updateCollectionDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized("Usuario no válido");
                }

                // Check user role - only collaborators and admins can update collections
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (userRole != "colaborador" && userRole != "administrador")
                {
                    return Forbid("No tienes permisos para modificar colecciones de la biblioteca");
                }

                var success = await _libraryService.UpdateCollectionAsync(id, updateCollectionDto, userId);
                if (!success)
                    return NotFound("Colección no encontrada");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating library collection {Id}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Delete a collection
        /// </summary>
        [HttpDelete("collections/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteCollection(string id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized("Usuario no válido");
                }

                // Check user role - only collaborators and admins can delete collections
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (userRole != "colaborador" && userRole != "administrador")
                {
                    return Forbid("No tienes permisos para eliminar colecciones de la biblioteca");
                }

                var success = await _libraryService.DeleteCollectionAsync(id, userId);
                if (!success)
                    return NotFound("Colección no encontrada");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting library collection {Id}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Add an item to a collection
        /// </summary>
        [HttpPost("collections/{collectionId}/items/{itemId}")]
        [Authorize]
        public async Task<IActionResult> AddItemToCollection(string collectionId, string itemId)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized("Usuario no válido");
                }

                // Check user role - only collaborators and admins can manage collections
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (userRole != "colaborador" && userRole != "administrador")
                {
                    return Forbid("No tienes permisos para gestionar colecciones de la biblioteca");
                }

                var success = await _libraryService.AddItemToCollectionAsync(itemId, collectionId, userId);
                if (!success)
                    return BadRequest("No se pudo agregar el elemento a la colección");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding item {ItemId} to collection {CollectionId}", itemId, collectionId);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Remove an item from a collection
        /// </summary>
        [HttpDelete("collections/{collectionId}/items/{itemId}")]
        [Authorize]
        public async Task<IActionResult> RemoveItemFromCollection(string collectionId, string itemId)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized("Usuario no válido");
                }

                // Check user role - only collaborators and admins can manage collections
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (userRole != "colaborador" && userRole != "administrador")
                {
                    return Forbid("No tienes permisos para gestionar colecciones de la biblioteca");
                }

                var success = await _libraryService.RemoveItemFromCollectionAsync(itemId, collectionId, userId);
                if (!success)
                    return NotFound("Elemento no encontrado en la colección");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing item {ItemId} from collection {CollectionId}", itemId, collectionId);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Get library statistics
        /// </summary>
        [HttpGet("stats")]
        public async Task<ActionResult<LibraryStatsDto>> GetStats()
        {
            try
            {
                var stats = await _libraryService.GetStatsAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting library stats");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Increment view count for an item
        /// </summary>
        [HttpPost("items/{id}/view")]
        public async Task<IActionResult> IncrementViewCount(string id)
        {
            try
            {
                var success = await _libraryService.IncrementViewCountAsync(id);
                if (!success)
                    return NotFound("Recurso no encontrado");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error incrementing view count for item {Id}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Increment download count for an item
        /// </summary>
        [HttpPost("items/{id}/download")]
        public async Task<IActionResult> IncrementDownloadCount(string id)
        {
            try
            {
                var success = await _libraryService.IncrementDownloadCountAsync(id);
                if (!success)
                    return NotFound("Recurso no encontrado");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error incrementing download count for item {Id}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Get available filter options
        /// </summary>
        [HttpGet("filters/categories")]
        public async Task<ActionResult<IEnumerable<string>>> GetAvailableCategories()
        {
            try
            {
                var categories = await _libraryService.GetAvailableCategoriesAsync();
                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available categories");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("filters/authors")]
        public async Task<ActionResult<IEnumerable<string>>> GetAvailableAuthors()
        {
            try
            {
                var authors = await _libraryService.GetAvailableAuthorsAsync();
                return Ok(authors);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available authors");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("filters/tags")]
        public async Task<ActionResult<IEnumerable<string>>> GetAvailableTags()
        {
            try
            {
                var tags = await _libraryService.GetAvailableTagsAsync();
                return Ok(tags);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available tags");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("filters/languages")]
        public async Task<ActionResult<IEnumerable<string>>> GetAvailableLanguages()
        {
            try
            {
                var languages = await _libraryService.GetAvailableLanguagesAsync();
                return Ok(languages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available languages");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("filters/years")]
        public async Task<ActionResult<IEnumerable<int>>> GetAvailableYears()
        {
            try
            {
                var years = await _libraryService.GetAvailableYearsAsync();
                return Ok(years);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available years");
                return StatusCode(500, "Error interno del servidor");
            }
        }
    }
}