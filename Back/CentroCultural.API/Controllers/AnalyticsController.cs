using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "administrador")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _analyticsService;
        private readonly ILogger<AnalyticsController> _logger;

        public AnalyticsController(IAnalyticsService analyticsService, ILogger<AnalyticsController> logger)
        {
            _analyticsService = analyticsService;
            _logger = logger;
        }

        // GET: api/analytics/summary
        [HttpGet("summary")]
        public async Task<ActionResult<AnalyticsSummaryDto>> GetSummary()
        {
            try
            {
                var summary = await _analyticsService.GetSummaryAsync();
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting analytics summary");
                return StatusCode(500, new { message = "Error retrieving analytics summary" });
            }
        }

        // GET: api/analytics/visitors?days=30
        [HttpGet("visitors")]
        public async Task<ActionResult<VisitorsChartDto>> GetVisitors([FromQuery] int days = 30)
        {
            try
            {
                if (days <= 0 || days > 365)
                {
                    return BadRequest(new { message = "Days parameter must be between 1 and 365" });
                }

                var visitorsData = await _analyticsService.GetVisitorsChartAsync(days);
                return Ok(visitorsData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting visitors chart data for {Days} days", days);
                return StatusCode(500, new { message = "Error retrieving visitors data" });
            }
        }

        // GET: api/analytics/top-downloads?limit=5
        [HttpGet("top-downloads")]
        public async Task<ActionResult<TopResourcesDto>> GetTopDownloads([FromQuery] int limit = 5)
        {
            try
            {
                if (limit <= 0 || limit > 50)
                {
                    return BadRequest(new { message = "Limit parameter must be between 1 and 50" });
                }

                var topDownloads = await _analyticsService.GetTopDownloadsAsync(limit);
                return Ok(topDownloads);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting top downloads data with limit {Limit}", limit);
                return StatusCode(500, new { message = "Error retrieving top downloads data" });
            }
        }

        // POST: api/analytics/track-visitor
        [HttpPost("track-visitor")]
        [AllowAnonymous]
        public async Task<ActionResult> TrackVisitor([FromBody] TrackVisitorRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.PageVisited))
                {
                    return BadRequest(new { message = "Page visited is required" });
                }

                // Get IP address from request
                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

                // Get user ID if authenticated
                int? userId = null;
                var userIdClaim = HttpContext.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int parsedUserId))
                {
                    userId = parsedUserId;
                }

                await _analyticsService.TrackVisitorAsync(ipAddress, userAgent, request.PageVisited, userId);
                return Ok(new { message = "Visitor tracked successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error tracking visitor");
                return StatusCode(500, new { message = "Error tracking visitor" });
            }
        }

        // POST: api/analytics/track-download
        [HttpPost("track-download")]
        [AllowAnonymous]
        public async Task<ActionResult> TrackDownload([FromBody] TrackDownloadRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.ResourceId) || string.IsNullOrEmpty(request.ResourceType) ||
                    string.IsNullOrEmpty(request.FileName))
                {
                    return BadRequest(new { message = "ResourceId, ResourceType, and FileName are required" });
                }

                // Get IP address from request
                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                // Get user ID if authenticated
                int? userId = null;
                var userIdClaim = HttpContext.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int parsedUserId))
                {
                    userId = parsedUserId;
                }

                await _analyticsService.TrackDownloadAsync(
                    request.ResourceId,
                    request.ResourceType,
                    request.FilePath ?? string.Empty,
                    request.FileName,
                    userId,
                    ipAddress,
                    request.FileSize
                );

                return Ok(new { message = "Download tracked successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error tracking download");
                return StatusCode(500, new { message = "Error tracking download" });
            }
        }
    }

    public class TrackVisitorRequest
    {
        public string PageVisited { get; set; } = string.Empty;
    }

    public class TrackDownloadRequest
    {
        public string ResourceId { get; set; } = string.Empty;
        public string ResourceType { get; set; } = string.Empty;
        public string? FilePath { get; set; }
        public string FileName { get; set; } = string.Empty;
        public int? FileSize { get; set; }
    }
}