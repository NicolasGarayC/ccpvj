using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/blogpostelement")]
    public class BlogPostElementController : ControllerBase
    {
        private readonly IBlogPostElementService _blogPostElementService;
        private readonly ILogger<BlogPostElementController> _logger;

        public BlogPostElementController(IBlogPostElementService blogPostElementService, ILogger<BlogPostElementController> logger)
        {
            _blogPostElementService = blogPostElementService;
            _logger = logger;
        }

        // GET: api/blogpostelement/by-blog-post/{blogPostId}
        [HttpGet("by-blog-post/{blogPostId}")]
        public async Task<ActionResult<IEnumerable<BlogPostElementDto>>> GetElementsByBlogPostId(string blogPostId)
        {
            try
            {
                var elements = await _blogPostElementService.GetElementsByBlogPostIdAsync(blogPostId);
                return Ok(elements);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving elements for blog post {BlogPostId}", blogPostId);
                return StatusCode(500, "Error retrieving blog post elements");
            }
        }

        // GET: api/blogpostelement/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<BlogPostElementDto>> GetElement(string id)
        {
            try
            {
                var element = await _blogPostElementService.GetElementByIdAsync(id);

                if (element == null)
                {
                    return NotFound($"Element with ID {id} not found");
                }

                return Ok(element);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving element {ElementId}", id);
                return StatusCode(500, "Error retrieving element");
            }
        }

        // POST: api/blogpostelement
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<BlogPostElementDto>> CreateElement([FromBody] CreateBlogPostElementDto createElementDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized("User ID not found in token");
                }

                var element = await _blogPostElementService.CreateElementAsync(createElementDto, userId.Value);

                _logger.LogInformation("Blog post element created successfully with ID {ElementId} by user {UserId}", element.Id, userId);

                return CreatedAtAction(nameof(GetElement), new { id = element.Id }, element);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating blog post element");
                return StatusCode(500, "Error creating blog post element");
            }
        }

        // POST: api/blogpostelement/batch
        [HttpPost("batch")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<BlogPostElementDto>>> CreateElementsInBatch([FromBody] CreateElementsBatchRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized("User ID not found in token");
                }

                var elements = await _blogPostElementService.CreateElementsInBatchAsync(
                    request.BlogPostId,
                    request.Elements,
                    userId.Value);

                _logger.LogInformation("Created {Count} blog post elements for blog post {BlogPostId} by user {UserId}",
                    request.Elements.Count(), request.BlogPostId, userId);

                return Ok(elements);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating blog post elements in batch");
                return StatusCode(500, "Error creating blog post elements");
            }
        }

        // PUT: api/blogpostelement/{id}
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<BlogPostElementDto>> UpdateElement(string id, [FromBody] UpdateBlogPostElementDto updateElementDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized("User ID not found in token");
                }

                var element = await _blogPostElementService.UpdateElementAsync(id, updateElementDto, userId.Value);

                _logger.LogInformation("Blog post element updated successfully with ID {ElementId} by user {UserId}", id, userId);

                return Ok(element);
            }
            catch (KeyNotFoundException)
            {
                return NotFound($"Element with ID {id} not found");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating blog post element {ElementId}", id);
                return StatusCode(500, "Error updating blog post element");
            }
        }

        // DELETE: api/blogpostelement/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<ActionResult> DeleteElement(string id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized("User ID not found in token");
                }

                var success = await _blogPostElementService.DeleteElementAsync(id, userId.Value);

                if (!success)
                {
                    return NotFound($"Element with ID {id} not found");
                }

                _logger.LogInformation("Blog post element deleted successfully with ID {ElementId} by user {UserId}", id, userId);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting blog post element {ElementId}", id);
                return StatusCode(500, "Error deleting blog post element");
            }
        }

        // PATCH: api/blogpostelement/{id}/reorder
        [HttpPatch("{id}/reorder")]
        [Authorize]
        public async Task<ActionResult> ReorderElement(string id, [FromBody] ReorderElementRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized("User ID not found in token");
                }

                var success = await _blogPostElementService.ReorderElementAsync(id, request.NewOrderNumber, userId.Value);

                if (!success)
                {
                    return NotFound($"Element with ID {id} not found");
                }

                _logger.LogInformation("Blog post element reordered successfully with ID {ElementId} to order {OrderNumber} by user {UserId}",
                    id, request.NewOrderNumber, userId);

                return Ok(new { message = "Element reordered successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reordering blog post element {ElementId}", id);
                return StatusCode(500, "Error reordering blog post element");
            }
        }

        // DELETE: api/blogpostelement/by-blog-post/{blogPostId}
        [HttpDelete("by-blog-post/{blogPostId}")]
        [Authorize]
        public async Task<ActionResult> DeleteElementsByBlogPostId(string blogPostId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized("User ID not found in token");
                }

                await _blogPostElementService.DeleteElementsByBlogPostIdAsync(blogPostId, userId.Value);

                _logger.LogInformation("All elements deleted for blog post {BlogPostId} by user {UserId}", blogPostId, userId);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting elements for blog post {BlogPostId}", blogPostId);
                return StatusCode(500, "Error deleting blog post elements");
            }
        }

        // Helper method to get current user ID from JWT token
        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("IdUsuario")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }

            return null;
        }
    }

    // Helper classes for request bodies
    public class CreateElementsBatchRequest
    {
        public string BlogPostId { get; set; } = string.Empty;
        public IEnumerable<CreateBlogPostElementDto> Elements { get; set; } = new List<CreateBlogPostElementDto>();
    }

    public class ReorderElementRequest
    {
        public int NewOrderNumber { get; set; }
    }
}
