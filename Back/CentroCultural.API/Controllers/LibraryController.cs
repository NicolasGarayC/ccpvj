using CentroCultural.Application.DTOs.Library;
using CentroCultural.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LibraryController : ControllerBase
    {
        private readonly ILibraryService _libraryService;
        private readonly ILogger<LibraryController> _logger;

        public LibraryController(ILibraryService libraryService, ILogger<LibraryController> logger)
        {
            _libraryService = libraryService;
            _logger = logger;
        }

        /// <summary>
        /// Obtener todos los recursos de la biblioteca con filtros opcionales
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllResources([FromQuery] LibrarySearchFiltersDto filters)
        {
            try
            {
                var result = await _libraryService.GetAllResourcesAsync(filters);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting library resources");
                return StatusCode(500, new LibraryResourceResponseDto
                {
                    Success = false,
                    Error = "Error interno del servidor"
                });
            }
        }

        /// <summary>
        /// Obtener un recurso específico por ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetResourceById(string id)
        {
            try
            {
                var result = await _libraryService.GetResourceByIdAsync(id);
                
                if (!result.Success)
                {
                    return NotFound(result);
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting library resource {Id}", id);
                return StatusCode(500, new LibraryResourceResponseDto
                {
                    Success = false,
                    Error = "Error interno del servidor"
                });
            }
        }

        /// <summary>
        /// Crear un nuevo recurso de biblioteca
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateResource([FromForm] CreateLibraryResourceRequest request)
        {
            try
            {
                // Verificar permisos del usuario
                var userRole = User.FindFirst("role")?.Value;
                if (!CanManageLibrary(userRole))
                {
                    return Forbid("No tienes permisos para gestionar la biblioteca");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(new LibraryResourceResponseDto
                    {
                        Success = false,
                        Error = "Datos inválidos"
                    });
                }

                if (request.File == null || request.File.Length == 0)
                {
                    return BadRequest(new LibraryResourceResponseDto
                    {
                        Success = false,
                        Error = "Debe seleccionar un archivo"
                    });
                }

                var dto = System.Text.Json.JsonSerializer.Deserialize<CreateLibraryResourceDto>(request.Data);
                if (dto == null)
                {
                    return BadRequest(new LibraryResourceResponseDto
                    {
                        Success = false,
                        Error = "Datos del recurso inválidos"
                    });
                }

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0";
                if (!int.TryParse(userIdClaim, out int userId))
                {
                    return BadRequest("ID de usuario inválido");
                }
                var result = await _libraryService.CreateResourceAsync(dto, request.File, userId);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return CreatedAtAction(nameof(GetResourceById), new { id = ((LibraryResourceDto)result.Data!).Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating library resource");
                return StatusCode(500, new LibraryResourceResponseDto
                {
                    Success = false,
                    Error = "Error interno del servidor"
                });
            }
        }

        /// <summary>
        /// Actualizar un recurso existente
        /// </summary>
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateResource(string id, [FromBody] UpdateLibraryResourceDto dto)
        {
            try
            {
                // Verificar permisos del usuario
                var userRole = User.FindFirst("role")?.Value;
                if (!CanManageLibrary(userRole))
                {
                    return Forbid("No tienes permisos para gestionar la biblioteca");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(new LibraryResourceResponseDto
                    {
                        Success = false,
                        Error = "Datos inválidos"
                    });
                }

                var result = await _libraryService.UpdateResourceAsync(id, dto);

                if (!result.Success)
                {
                    return result.Error == "Recurso no encontrado" ? NotFound(result) : BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating library resource {Id}", id);
                return StatusCode(500, new LibraryResourceResponseDto
                {
                    Success = false,
                    Error = "Error interno del servidor"
                });
            }
        }

        /// <summary>
        /// Eliminar un recurso (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteResource(string id)
        {
            try
            {
                // Verificar permisos del usuario
                var userRole = User.FindFirst("role")?.Value;
                if (!CanManageLibrary(userRole))
                {
                    return Forbid("No tienes permisos para gestionar la biblioteca");
                }

                var result = await _libraryService.DeleteResourceAsync(id);

                if (!result.Success)
                {
                    return result.Error == "Recurso no encontrado" ? NotFound(result) : BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting library resource {Id}", id);
                return StatusCode(500, new LibraryResourceResponseDto
                {
                    Success = false,
                    Error = "Error interno del servidor"
                });
            }
        }

        /// <summary>
        /// Descargar un archivo de recurso
        /// </summary>
        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadResource(string id)
        {
            try
            {
                var fileResult = await _libraryService.DownloadResourceAsync(id);
                
                // Incrementar contador de descargas
                await _libraryService.IncrementDownloadCountAsync(id);

                return File(fileResult.FileContents, fileResult.ContentType, fileResult.FileName);
            }
            catch (FileNotFoundException)
            {
                return NotFound(new LibraryResourceResponseDto
                {
                    Success = false,
                    Error = "Archivo no encontrado"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading library resource {Id}", id);
                return StatusCode(500, new LibraryResourceResponseDto
                {
                    Success = false,
                    Error = "Error al descargar el archivo"
                });
            }
        }

        /// <summary>
        /// Obtener estadísticas de la biblioteca
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var result = await _libraryService.GetStatsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting library stats");
                return StatusCode(500, new LibraryResourceResponseDto
                {
                    Success = false,
                    Error = "Error interno del servidor"
                });
            }
        }

        private static bool CanManageLibrary(string? userRole)
        {
            return userRole is "Administrador" or "Educador" or "Colaborador";
        }
    }

    /// <summary>
    /// Clase para manejar la subida de archivos con datos
    /// </summary>
    public class CreateLibraryResourceRequest
    {
        public IFormFile File { get; set; } = null!;
        public string Data { get; set; } = string.Empty;
    }
}