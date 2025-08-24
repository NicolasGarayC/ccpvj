using Back.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.IO;
using System.Linq;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly IMediaService _mediaService;
    private readonly ILogger<UploadController> _logger;

    public UploadController(IMediaService mediaService, ILogger<UploadController> logger)
    {
        _mediaService = mediaService;
        _logger = logger;
    }

    [HttpPost("images")]
    [Authorize]
    public async Task<IActionResult> ProcessImageUpload()
    {
        var tempFilePath = Request.Headers["X-File-Path"].FirstOrDefault();
        if (string.IsNullOrEmpty(tempFilePath) || !System.IO.File.Exists(tempFilePath))
            return BadRequest("Archivo temporal no encontrado");

        var validation = await _mediaService.ValidateImageFile(tempFilePath, new FileInfo(tempFilePath).Length);
        if (!validation.IsValid)
        {
            System.IO.File.Delete(tempFilePath);
            return BadRequest(validation.ErrorMessage);
        }

        var userId = User?.Identity?.Name ?? "unknown";
        var media = await _mediaService.ProcessImageUpload(tempFilePath, userId);
        await _mediaService.SaveMediaMetadata(media);

        return Ok(new { id = media.Id, url = $"/media/{media.RelativePath}", thumbnail = $"/media/{media.ThumbnailPath}", size = media.SizeBytes });
    }

    // Implementa videos, audio, cleanup, status, delete y get como en tu ejemplo.
}