using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using Back.DTOs;
using Back.Services;

namespace Back.Controllers
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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourseDto>>> GetAllCourses()
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

        [HttpGet("featured")]
        public async Task<ActionResult<IEnumerable<CourseDto>>> GetFeaturedCourses()
        {
            try
            {
                var courses = await _courseService.GetFeaturedCoursesAsync();
                return Ok(courses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo cursos destacados");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CourseDetailDto>> GetCourse(Guid id)
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
        public async Task<ActionResult<IEnumerable<ModuleDto>>> GetCourseModules(Guid courseId)
        {
            try
            {
                var modules = await _courseService.GetCourseModulesAsync(courseId);
                return Ok(modules);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo módulos del curso: {CourseId}", courseId);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [Authorize(Roles = "Educador")]
        [HttpPost]
        public async Task<ActionResult<CourseDto>> CreateCourse([FromBody] CreateCourseDto courseDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId)) // Changed Guid.TryParse to int.TryParse
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var course = await _courseService.CreateCourseAsync(courseDto, userId); // userId is now an int
                return CreatedAtAction(nameof(GetCourse), new { id = course.Id }, course);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando curso");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [Authorize(Roles = "Educador")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCourse(Guid id, [FromBody] UpdateCourseDto courseDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId)) // Changed Guid.TryParse to int.TryParse
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var result = await _courseService.UpdateCourseAsync(id, courseDto, userId); // userId is now an int

                if (!result)
                    return NotFound($"Curso con ID {id} no encontrado o no tienes permisos para editarlo");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error actualizando curso: {CourseId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [Authorize(Roles = "Educador")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCourse(Guid id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId)) // Changed Guid.TryParse to int.TryParse
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var result = await _courseService.DeleteCourseAsync(id, userId); // Changed userId type to int

                if (!result)
                    return NotFound($"Curso con ID {id} no encontrado o no tienes permisos para eliminarlo");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error eliminando curso: {CourseId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [Authorize(Roles = "Educador")]
        [HttpGet("my-courses")]
        public async Task<ActionResult<IEnumerable<CourseDto>>> GetMyCourses()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized("Usuario no autenticado correctamente");
                }

                var courses = await _courseService.GetCoursesByEducatorAsync(userId);
                return Ok(courses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo cursos del educador");
                return StatusCode(500, "Error interno del servidor");
            }
        }
    }
}
