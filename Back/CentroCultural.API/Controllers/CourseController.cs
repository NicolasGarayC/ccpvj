using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CentroCultural.Application.DTOs.Course;
using CentroCultural.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CourseController : ControllerBase
    {
        private readonly ICourseService _courseService;

        public CourseController(ICourseService courseService)
        {
            _courseService = courseService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourseDto>>> GetAllCourses()
        {
            var courses = await _courseService.GetAllCoursesAsync();
            return Ok(courses);
        }

        [HttpGet("featured")]
        public async Task<ActionResult<IEnumerable<CourseDto>>> GetFeaturedCourses()
        {
            var courses = await _courseService.GetFeaturedCoursesAsync();
            return Ok(courses);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CourseDetailDto>> GetCourse(Guid id)
        {
            var course = await _courseService.GetCourseByIdAsync(id);
            
            if (course == null)
                return NotFound();
                
            return Ok(course);
        }

        [HttpGet("{courseId}/modules")]
        public async Task<ActionResult<IEnumerable<ModuleDto>>> GetCourseModules(Guid courseId)
        {
            var modules = await _courseService.GetCourseModulesAsync(courseId);
            return Ok(modules);
        }

        [Authorize(Roles = "educator")]
        [HttpPost]
        public async Task<ActionResult<CourseDto>> CreateCourse(CreateCourseDto courseDto)
        {
            var userId = User.FindFirst("sub")?.Value;
            
            var course = await _courseService.CreateCourseAsync(courseDto, Guid.Parse(userId));
            return CreatedAtAction(nameof(GetCourse), new { id = course.Id }, course);
        }

        [Authorize(Roles = "educator")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCourse(Guid id, UpdateCourseDto courseDto)
        {
            var userId = User.FindFirst("sub")?.Value;
            
            var result = await _courseService.UpdateCourseAsync(id, courseDto, Guid.Parse(userId));
            
            if (!result)
                return NotFound();
                
            return NoContent();
        }

        [Authorize(Roles = "educator")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCourse(Guid id)
        {
            var userId = User.FindFirst("sub")?.Value;
            
            var result = await _courseService.DeleteCourseAsync(id, Guid.Parse(userId));
            
            if (!result)
                return NotFound();
                
            return NoContent();
        }
    }
}
