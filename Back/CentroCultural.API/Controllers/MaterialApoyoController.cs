using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MaterialApoyoController : ControllerBase
    {
        private readonly IMaterialApoyoService _materialApoyoService;
        private readonly ILogger<MaterialApoyoController> _logger;

        public MaterialApoyoController(IMaterialApoyoService materialApoyoService, ILogger<MaterialApoyoController> logger)
        {
            _materialApoyoService = materialApoyoService;
            _logger = logger;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : 0;
        }

        // GET: api/materialapoyo
        [HttpGet]
        public async Task<ActionResult<MaterialApoyoPagedResultDto>> GetMaterialApoyo([FromQuery] MaterialApoyoSearchDto searchDto)
        {
            try
            {
                var materialApoyo = await _materialApoyoService.GetMaterialApoyoAsync(searchDto);
                return Ok(materialApoyo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo material de apoyo");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/materialapoyo/all
        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<MaterialApoyoSummaryDto>>> GetAllMaterialApoyo()
        {
            try
            {
                var materialApoyo = await _materialApoyoService.GetAllMaterialApoyoAsync();
                return Ok(materialApoyo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo todo el material de apoyo");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/materialapoyo/featured
        [HttpGet("featured")]
        public async Task<ActionResult<IEnumerable<MaterialApoyoSummaryDto>>> GetFeaturedMaterialApoyo([FromQuery] int count = 6)
        {
            try
            {
                var materialApoyo = await _materialApoyoService.GetFeaturedMaterialApoyoAsync(count);
                return Ok(materialApoyo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo material de apoyo destacado");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/materialapoyo/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<MaterialApoyoDetailDto>> GetMaterialApoyo(string id)
        {
            try
            {
                var materialApoyo = await _materialApoyoService.GetMaterialApoyoByIdAsync(id);

                if (materialApoyo == null)
                    return NotFound($"Material de apoyo con ID {id} no encontrado");

                return Ok(materialApoyo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo material de apoyo con ID: {MaterialApoyoId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("{materialApoyoId}/modules")]
        public async Task<ActionResult<IEnumerable<ModuleSummaryDto>>> GetMaterialApoyoModules(string materialApoyoId)
        {
            try
            {
                var modules = await _materialApoyoService.GetMaterialApoyoModulesAsync(materialApoyoId);
                return Ok(modules);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo módulos del material de apoyo: {MaterialApoyoId}", materialApoyoId);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // POST: api/materialapoyo
        [HttpPost]
        [Authorize(Roles = "administrador")]
        public async Task<ActionResult<MaterialApoyoDto>> CreateMaterialApoyo([FromBody] CreateMaterialApoyoDto materialApoyoDto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var materialApoyo = await _materialApoyoService.CreateMaterialApoyoAsync(materialApoyoDto, userId);
                return CreatedAtAction(nameof(GetMaterialApoyo), new { id = materialApoyo.Id }, materialApoyo);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para crear material de apoyo");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando material de apoyo");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // PUT: api/materialapoyo/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "administrador")]
        public async Task<IActionResult> UpdateMaterialApoyo(string id, [FromBody] UpdateMaterialApoyoDto materialApoyoDto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var result = await _materialApoyoService.UpdateMaterialApoyoAsync(id, materialApoyoDto, userId);

                if (!result)
                    return NotFound($"Material de apoyo con ID {id} no encontrado");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para editar este material de apoyo");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error actualizando material de apoyo: {MaterialApoyoId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // DELETE: api/materialapoyo/{id}
        [HttpDelete("{id}")]
        // [Authorize(Roles = "administrador")] // Temporarily disabled for testing
        public async Task<IActionResult> DeleteMaterialApoyo(string id)
        {
            try
            {
                var userId = 1; // Hardcoded for testing
                // var userId = GetCurrentUserId();

                var result = await _materialApoyoService.DeleteMaterialApoyoAsync(id, userId);

                if (!result)
                    return NotFound($"Material de apoyo con ID {id} no encontrado");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para eliminar este material de apoyo");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error eliminando material de apoyo: {MaterialApoyoId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("my-material-apoyo")]
        public async Task<ActionResult<IEnumerable<MaterialApoyoSummaryDto>>> GetMyMaterialApoyo()
        {
            try
            {
                var userId = GetCurrentUserId();

                var materialApoyo = await _materialApoyoService.GetMaterialApoyoByEducatorAsync(userId);
                return Ok(materialApoyo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo material de apoyo del educador");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("statistics")]
        public async Task<ActionResult<object>> GetMaterialApoyoStatistics()
        {
            try
            {
                var statistics = await _materialApoyoService.GetMaterialApoyoStatisticsAsync();
                return Ok(statistics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo estadísticas de material de apoyo");
                return StatusCode(500, "Error interno del servidor");
            }
        }


        [HttpGet("modules/{id}")]
        public async Task<ActionResult<ModuleDetailDto>> GetModule(string id)
        {
            try
            {
                var module = await _materialApoyoService.GetModuleByIdAsync(id);

                if (module == null)
                    return NotFound($"Módulo con ID {id} no encontrado");

                return Ok(module);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo módulo con ID: {ModuleId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPost("modules")]
        [Authorize(Roles = "administrador")]
        public async Task<ActionResult<ModuleDto>> CreateModule([FromBody] CreateModuleDto moduleDto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var module = await _materialApoyoService.CreateModuleAsync(moduleDto, userId);
                return CreatedAtAction(nameof(GetModule), new { id = module.Id }, module);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para crear módulos en este material de apoyo");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando módulo");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPut("modules/{id}")]
        [Authorize(Roles = "administrador")]
        public async Task<IActionResult> UpdateModule(string id, [FromBody] UpdateModuleDto moduleDto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var result = await _materialApoyoService.UpdateModuleAsync(id, moduleDto, userId);

                if (!result)
                    return NotFound($"Módulo con ID {id} no encontrado");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para editar este módulo");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error actualizando módulo: {ModuleId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpDelete("modules/{id}")]
        [Authorize(Roles = "administrador")]
        public async Task<IActionResult> DeleteModule(string id)
        {
            try
            {
                var userId = GetCurrentUserId();

                var result = await _materialApoyoService.DeleteModuleAsync(id, userId);

                if (!result)
                    return NotFound($"Módulo con ID {id} no encontrado");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para eliminar este módulo");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error eliminando módulo: {ModuleId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPatch("modules/{id}/reorder")]
        public async Task<IActionResult> ReorderModule(string id, [FromBody] ReorderModuleDto reorderDto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var result = await _materialApoyoService.ReorderModuleAsync(id, reorderDto.NewOrderNumber, userId);

                if (!result)
                    return NotFound($"Módulo con ID {id} no encontrado");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para reordenar módulos en este material de apoyo");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reordenando módulo: {ModuleId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // ==================== ModulePost Operations ====================

        [HttpGet("modules/{moduleId}/posts")]
        public async Task<ActionResult<IEnumerable<ModulePostDto>>> GetModulePosts(string moduleId)
        {
            try
            {
                var posts = await _materialApoyoService.GetModulePostsAsync(moduleId);
                return Ok(posts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo posts del módulo: {ModuleId}", moduleId);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("posts/{id}")]
        public async Task<ActionResult<ModulePostDto>> GetPost(string id)
        {
            try
            {
                var post = await _materialApoyoService.GetPostByIdAsync(id);

                if (post == null)
                    return NotFound($"Post con ID {id} no encontrado");

                return Ok(post);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo post con ID: {PostId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPost("posts")]
        [Authorize(Roles = "administrador")]
        public async Task<ActionResult<ModulePostDto>> CreatePost([FromBody] CreateModulePostDto postDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var post = await _materialApoyoService.CreatePostAsync(postDto, userId);
                return CreatedAtAction(nameof(GetPost), new { id = post.Id }, post);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para crear posts");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando post");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPut("posts/{id}")]
        [Authorize(Roles = "administrador")]
        public async Task<IActionResult> UpdatePost(string id, [FromBody] UpdateModulePostDto postDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _materialApoyoService.UpdatePostAsync(id, postDto, userId);

                if (!result)
                    return NotFound($"Post con ID {id} no encontrado");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para editar este post");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error actualizando post: {PostId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpDelete("posts/{id}")]
        [Authorize(Roles = "administrador")]
        public async Task<IActionResult> DeletePost(string id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _materialApoyoService.DeletePostAsync(id, userId);

                if (!result)
                    return NotFound($"Post con ID {id} no encontrado");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para eliminar este post");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error eliminando post: {PostId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPost("posts/{id}/reorder")]
        [Authorize(Roles = "administrador")]
        public async Task<IActionResult> ReorderPost(string id, [FromBody] ReorderModuleDto reorderDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _materialApoyoService.ReorderPostAsync(id, reorderDto.NewOrderNumber, userId);

                if (!result)
                    return NotFound($"Post con ID {id} no encontrado");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para reordenar posts");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reordenando post: {PostId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }
    }
}