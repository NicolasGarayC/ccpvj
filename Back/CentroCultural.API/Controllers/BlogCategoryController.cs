using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BlogCategoryController : ControllerBase
    {
        private readonly IBlogService _blogService;
        private readonly ILogger<BlogCategoryController> _logger;

        public BlogCategoryController(IBlogService blogService, ILogger<BlogCategoryController> logger)
        {
            _blogService = blogService;
            _logger = logger;
        }

        // GET: api/blogcategory
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BlogCategoryDto>>> GetCategories()
        {
            try
            {
                var categories = await _blogService.GetBlogCategoriesAsync();
                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting blog categories");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/blogcategory/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<BlogCategoryDto>> GetCategory(Guid id)
        {
            try
            {
                var category = await _blogService.GetBlogCategoryByIdAsync(id);
                if (category == null)
                    return NotFound($"Categoría con ID {id} no encontrada");

                return Ok(category);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting blog category with ID: {CategoryId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // POST: api/blogcategory
        [Authorize(Roles = "Administrador")]
        [HttpPost]
        public async Task<ActionResult<BlogCategoryDto>> CreateCategory([FromBody] CreateBlogCategoryDto createDto)
        {
            try
            {
                var category = await _blogService.CreateBlogCategoryAsync(createDto);
                return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating blog category");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // PUT: api/blogcategory/{id}
        [Authorize(Roles = "Administrador")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] UpdateBlogCategoryDto updateDto)
        {
            try
            {
                var category = await _blogService.UpdateBlogCategoryAsync(id, updateDto);
                if (category == null)
                    return NotFound($"Categoría con ID {id} no encontrada");

                return Ok(category);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating blog category: {CategoryId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // DELETE: api/blogcategory/{id}
        [Authorize(Roles = "Administrador")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(Guid id)
        {
            try
            {
                var result = await _blogService.DeleteBlogCategoryAsync(id);
                if (!result)
                    return NotFound($"Categoría con ID {id} no encontrada");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting blog category: {CategoryId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }
    }
}