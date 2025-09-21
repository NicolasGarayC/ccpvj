using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CourseController : ControllerBase
    {
        private readonly ICourseService _courseService;
        private readonly ILogger<CourseController> _logger;

        public CourseController(ICourseService courseService, ILogger<CourseController> logger)
        {
            _courseService = courseService;
            _logger = logger;
        }

        // GET: api/course
        [HttpGet]
        public async Task<ActionResult<CoursePagedResultDto>> GetCourses([FromQuery] CourseSearchDto searchDto)
        {
            try
            {
                var courses = await _courseService.GetCoursesAsync(searchDto);
                return Ok(courses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo cursos");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/course/all
        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<CourseSummaryDto>>> GetAllCourses()
        {
            try
            {
                var courses = await _courseService.GetAllCoursesAsync();
                return Ok(courses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo todos los cursos");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/course/featured
        [HttpGet("featured")]
        public async Task<ActionResult<IEnumerable<CourseSummaryDto>>> GetFeaturedCourses([FromQuery] int count = 6)
        {
            try
            {
                var courses = await _courseService.GetFeaturedCoursesAsync(count);
                return Ok(courses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo cursos destacados");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/course/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<CourseDetailDto>> GetCourse(string id)
        {
            try
            {
                var course = await _courseService.GetCourseByIdAsync(id);

                if (course == null)
                    return NotFound($"Curso con ID {id} no encontrado");

                return Ok(course);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo curso con ID: {CourseId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("{courseId}/modules")]
        public async Task<ActionResult<IEnumerable<ModuleSummaryDto>>> GetCourseModules(string courseId)
        {
            try
            {
                var modules = await _courseService.GetCourseModulesAsync(courseId);
                return Ok(modules);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo m�dulos del curso: {CourseId}", courseId);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // POST: api/course
        [Authorize(Roles = "Colaborador,Administrador")]
        [HttpPost]
        public async Task<ActionResult<CourseDto>> CreateCourse([FromBody] CreateCourseDto courseDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var course = await _courseService.CreateCourseAsync(courseDto, int.Parse(userIdClaim));
                return CreatedAtAction(nameof(GetCourse), new { id = course.Id }, course);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para crear cursos");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando curso");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // PUT: api/course/{id}
        [Authorize(Roles = "Colaborador,Administrador")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCourse(Guid id, [FromBody] UpdateCourseDto courseDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var result = await _courseService.UpdateCourseAsync(id, courseDto, int.Parse(userIdClaim));

                if (!result)
                    return NotFound($"Curso con ID {id} no encontrado");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para editar este curso");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error actualizando curso: {CourseId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // DELETE: api/course/{id}
        [Authorize(Roles = "Colaborador,Administrador")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCourse(Guid id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var result = await _courseService.DeleteCourseAsync(id, int.Parse(userIdClaim));

                if (!result)
                    return NotFound($"Curso con ID {id} no encontrado");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para eliminar este curso");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error eliminando curso: {CourseId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [Authorize(Roles = "Colaborador,Administrador")]
        [HttpGet("my-courses")]
        public async Task<ActionResult<IEnumerable<CourseSummaryDto>>> GetMyCourses()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var courses = await _courseService.GetCoursesByEducatorAsync(int.Parse(userIdClaim));
                return Ok(courses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo cursos del educador");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [Authorize(Roles = "Administrador")]
        [HttpGet("statistics")]
        public async Task<ActionResult<object>> GetCourseStatistics()
        {
            try
            {
                var statistics = await _courseService.GetCourseStatisticsAsync();
                return Ok(statistics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo estadísticas de cursos");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("subjects")]
        public async Task<ActionResult<IEnumerable<string>>> GetAvailableSubjects()
        {
            try
            {
                var subjects = await _courseService.GetAvailableSubjectsAsync();
                return Ok(subjects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo materias disponibles");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("modules/{id}")]
        public async Task<ActionResult<ModuleDetailDto>> GetModule(string id)
        {
            try
            {
                var module = await _courseService.GetModuleByIdAsync(id);

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

        [Authorize(Roles = "Colaborador,Administrador")]
        [HttpPost("modules")]
        public async Task<ActionResult<ModuleDto>> CreateModule([FromBody] CreateModuleDto moduleDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var module = await _courseService.CreateModuleAsync(moduleDto, int.Parse(userIdClaim));
                return CreatedAtAction(nameof(GetModule), new { id = module.Id }, module);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para crear módulos en este curso");
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

        [Authorize(Roles = "Colaborador,Administrador")]
        [HttpPut("modules/{id}")]
        public async Task<IActionResult> UpdateModule(Guid id, [FromBody] UpdateModuleDto moduleDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var result = await _courseService.UpdateModuleAsync(id, moduleDto, int.Parse(userIdClaim));

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

        [Authorize(Roles = "Colaborador,Administrador")]
        [HttpDelete("modules/{id}")]
        public async Task<IActionResult> DeleteModule(Guid id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var result = await _courseService.DeleteModuleAsync(id, int.Parse(userIdClaim));

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

        [Authorize(Roles = "Colaborador,Administrador")]
        [HttpPatch("modules/{id}/reorder")]
        public async Task<IActionResult> ReorderModule(Guid id, [FromBody] ReorderModuleDto reorderDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var result = await _courseService.ReorderModuleAsync(id, reorderDto.NewOrderNumber, int.Parse(userIdClaim));

                if (!result)
                    return NotFound($"Módulo con ID {id} no encontrado");

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("No tienes permisos para reordenar módulos en este curso");
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
    }
}
