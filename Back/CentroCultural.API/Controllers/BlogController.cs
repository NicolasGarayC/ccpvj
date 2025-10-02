using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BlogController : ControllerBase
    {
        private readonly IBlogService _blogService;
        private readonly ILogger<BlogController> _logger;

        public BlogController(IBlogService blogService, ILogger<BlogController> logger)
        {
            _blogService = blogService;
            _logger = logger;
        }

        // GET: api/blog
        [HttpGet]
        public async Task<ActionResult<BlogPostPagedResultDto>> GetBlogPosts([FromQuery] BlogPostSearchDto searchDto)
        {
            try
            {
                var result = await _blogService.GetBlogPostsAsync(searchDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving blog posts");
                return StatusCode(500, "Error retrieving blog posts");
            }
        }

        // GET: api/blog/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<BlogPostDto>> GetBlogPost(string id)
        {
            try
            {
                var blogPost = await _blogService.GetBlogPostByIdAsync(id);

                if (blogPost == null)
                {
                    return NotFound($"Blog post with ID {id} not found");
                }

                return Ok(blogPost);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving blog post {BlogPostId}", id);
                return StatusCode(500, "Error retrieving blog post");
            }
        }

        // GET: api/blog/slug/{slug}
        [HttpGet("slug/{slug}")]
        public async Task<ActionResult<BlogPostDto>> GetBlogPostBySlug(string slug)
        {
            try
            {
                var userId = GetCurrentUserId();
                var blogPost = await _blogService.GetBlogPostBySlugAsync(slug, userId);

                if (blogPost == null)
                {
                    return NotFound($"Blog post with slug '{slug}' not found");
                }

                return Ok(blogPost);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving blog post with slug {Slug}", slug);
                return StatusCode(500, "Error retrieving blog post");
            }
        }

        // GET: api/blog/featured
        [HttpGet("featured")]
        public async Task<ActionResult<IEnumerable<BlogPostSummaryDto>>> GetFeaturedPosts([FromQuery] int count = 5)
        {
            try
            {
                var posts = await _blogService.GetFeaturedPostsAsync(count);
                return Ok(posts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving featured posts");
                return StatusCode(500, "Error retrieving featured posts");
            }
        }

        // GET: api/blog/popular
        [HttpGet("popular")]
        public async Task<ActionResult<IEnumerable<BlogPostSummaryDto>>> GetPopularPosts([FromQuery] int count = 10)
        {
            try
            {
                var posts = await _blogService.GetPopularPostsAsync(count);
                return Ok(posts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving popular posts");
                return StatusCode(500, "Error retrieving popular posts");
            }
        }

        // GET: api/blog/recent
        [HttpGet("recent")]
        public async Task<ActionResult<IEnumerable<BlogPostSummaryDto>>> GetRecentPosts([FromQuery] int count = 10)
        {
            try
            {
                var posts = await _blogService.GetRecentPostsAsync(count);
                return Ok(posts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving recent posts");
                return StatusCode(500, "Error retrieving recent posts");
            }
        }

        // GET: api/blog/statistics
        [HttpGet("statistics")]
        public async Task<ActionResult<object>> GetBlogStatistics()
        {
            try
            {
                var statistics = await _blogService.GetBlogStatisticsAsync();
                return Ok(statistics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving blog statistics");
                return StatusCode(500, "Error retrieving blog statistics");
            }
        }

        // POST: api/blog
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<BlogPostDto>> CreateBlogPost([FromBody] CreateBlogPostDto createBlogPostDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized("User ID not found in token");
                }

                var blogPost = await _blogService.CreateBlogPostAsync(createBlogPostDto, userId.Value);

                _logger.LogInformation("Blog post created successfully with ID {BlogPostId} by user {UserId}", blogPost.Id, userId);

                return CreatedAtAction(nameof(GetBlogPost), new { id = blogPost.Id }, blogPost);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating blog post");
                return StatusCode(500, "Error creating blog post");
            }
        }

        // PUT: api/blog/{id}
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<BlogPostDto>> UpdateBlogPost(string id, [FromBody] UpdateBlogPostDto updateBlogPostDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized("User ID not found in token");
                }

                var blogPost = await _blogService.UpdateBlogPostAsync(id, updateBlogPostDto, userId.Value);

                if (blogPost == null)
                {
                    return NotFound($"Blog post with ID {id} not found");
                }

                _logger.LogInformation("Blog post updated successfully with ID {BlogPostId} by user {UserId}", id, userId);

                return Ok(blogPost);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating blog post {BlogPostId}", id);
                return StatusCode(500, "Error updating blog post");
            }
        }

        // DELETE: api/blog/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<ActionResult> DeleteBlogPost(string id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized("User ID not found in token");
                }

                var success = await _blogService.DeleteBlogPostAsync(id, userId.Value);

                if (!success)
                {
                    return NotFound($"Blog post with ID {id} not found");
                }

                _logger.LogInformation("Blog post deleted successfully with ID {BlogPostId} by user {UserId}", id, userId);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting blog post {BlogPostId}", id);
                return StatusCode(500, "Error deleting blog post");
            }
        }

        // PUT: api/blog/{id}/publish
        [HttpPut("{id}/publish")]
        [Authorize]
        public async Task<ActionResult> PublishBlogPost(string id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized("User ID not found in token");
                }

                var success = await _blogService.PublishBlogPostAsync(id, userId.Value);

                if (!success)
                {
                    return NotFound($"Blog post with ID {id} not found");
                }

                _logger.LogInformation("Blog post published successfully with ID {BlogPostId} by user {UserId}", id, userId);

                return Ok(new { message = "Blog post published successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error publishing blog post {BlogPostId}", id);
                return StatusCode(500, "Error publishing blog post");
            }
        }

        // PUT: api/blog/{id}/unpublish
        [HttpPut("{id}/unpublish")]
        [Authorize]
        public async Task<ActionResult> UnpublishBlogPost(string id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized("User ID not found in token");
                }

                var success = await _blogService.UnpublishBlogPostAsync(id, userId.Value);

                if (!success)
                {
                    return NotFound($"Blog post with ID {id} not found");
                }

                _logger.LogInformation("Blog post unpublished successfully with ID {BlogPostId} by user {UserId}", id, userId);

                return Ok(new { message = "Blog post unpublished successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unpublishing blog post {BlogPostId}", id);
                return StatusCode(500, "Error unpublishing blog post");
            }
        }

        // POST: api/blog/{id}/view
        [HttpPost("{id}/view")]
        public async Task<ActionResult> IncrementViews(string id)
        {
            try
            {
                var success = await _blogService.IncrementViewsAsync(id);

                if (!success)
                {
                    return NotFound($"Blog post with ID {id} not found");
                }

                return Ok(new { message = "View count incremented successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error incrementing views for blog post {BlogPostId}", id);
                return StatusCode(500, "Error incrementing views");
            }
        }

        // GET: api/blog/slug/check/{slug}
        [HttpGet("slug/check/{slug}")]
        public async Task<ActionResult<object>> CheckSlugAvailability(string slug, [FromQuery] string? excludePostId = null)
        {
            try
            {
                var isAvailable = await _blogService.IsSlugAvailableAsync(slug, excludePostId);
                return Ok(new { slug, isAvailable });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking slug availability for {Slug}", slug);
                return StatusCode(500, "Error checking slug availability");
            }
        }

        // POST: api/blog/slug/generate
        [HttpPost("slug/generate")]
        public async Task<ActionResult<object>> GenerateUniqueSlug([FromBody] GenerateSlugDto generateSlugDto)
        {
            try
            {
                var uniqueSlug = await _blogService.GenerateUniqueSlugAsync(generateSlugDto.Title, generateSlugDto.ExcludePostId);
                return Ok(new { title = generateSlugDto.Title, slug = uniqueSlug });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating unique slug for title {Title}", generateSlugDto.Title);
                return StatusCode(500, "Error generating unique slug");
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

    // Helper DTO for slug generation
    public class GenerateSlugDto
    {
        public string Title { get; set; } = string.Empty;
        public string? ExcludePostId { get; set; }
    }
}