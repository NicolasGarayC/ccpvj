using Back.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.IO;
using System.Linq;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Back.Models;

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

    [HttpPost("videos")]
    [Authorize]
    public async Task<IActionResult> ProcessVideoUpload()
    {
        var tempFilePath = Request.Headers["X-File-Path"].FirstOrDefault();
        if (string.IsNullOrEmpty(tempFilePath) || !System.IO.File.Exists(tempFilePath))
            return BadRequest("Archivo temporal no encontrado");

        // Validación básica
        var ext = Path.GetExtension(tempFilePath).ToLowerInvariant();
        var allowed = new[] { ".mp4", ".webm", ".mov" };
        if (!allowed.Contains(ext))
        {
            System.IO.File.Delete(tempFilePath);
            return BadRequest("Extensión de video no permitida");
        }
        if (new FileInfo(tempFilePath).Length > 500 * 1024 * 1024)
        {
            System.IO.File.Delete(tempFilePath);
            return BadRequest("Archivo de video demasiado grande");
        }

        var userId = User?.Identity?.Name ?? "unknown";
        var media = await _mediaService.ProcessVideoUpload(tempFilePath, userId);
        await _mediaService.SaveMediaMetadata(media);
        var uploadId = Guid.NewGuid();
        return Accepted(new { uploadId, status = "processing", message = "Video en procesamiento. Usa /api/upload/status/{uploadId} para verificar progreso" });
    }

    [HttpPost("audio")]
    [Authorize]
    public async Task<IActionResult> ProcessAudioUpload()
    {
        var tempFilePath = Request.Headers["X-File-Path"].FirstOrDefault();
        if (string.IsNullOrEmpty(tempFilePath) || !System.IO.File.Exists(tempFilePath))
            return BadRequest("Archivo temporal no encontrado");

        var ext = Path.GetExtension(tempFilePath).ToLowerInvariant();
        var allowed = new[] { ".mp3", ".wav", ".ogg" };
        if (!allowed.Contains(ext))
        {
            System.IO.File.Delete(tempFilePath);
            return BadRequest("Extensión de audio no permitida");
        }
        if (new FileInfo(tempFilePath).Length > 100 * 1024 * 1024)
        {
            System.IO.File.Delete(tempFilePath);
            return BadRequest("Archivo de audio demasiado grande");
        }

        var userId = User?.Identity?.Name ?? "unknown";
        var media = await _mediaService.ProcessAudioUpload(tempFilePath, userId);
        await _mediaService.SaveMediaMetadata(media);
        return Ok(new { id = media.Id, url = $"/media/{media.RelativePath}", size = media.SizeBytes });
    }

    [HttpPost("cleanup")]
    [AllowAnonymous]
    public async Task<IActionResult> CleanupTempFiles()
    {
        var tempPath = "/home/user/ccpvj/Data/media/temp/uploads";
        int deletedCount = 0;
        if (Directory.Exists(tempPath))
        {
            var files = Directory.GetFiles(tempPath, "*", SearchOption.AllDirectories);
            foreach (var file in files)
            {
                try { System.IO.File.Delete(file); deletedCount++; } catch { }
            }
        }
        return Ok(new { deletedFiles = deletedCount });
    }

    [HttpGet("status/{uploadId}")]
    public async Task<IActionResult> GetUploadStatus(Guid uploadId)
    {
        // Simulación: siempre "processing"
        return Ok(new { uploadId, status = "processing" });
    }

    [HttpDelete("{mediaId}")]
    [Authorize]
    public async Task<IActionResult> DeleteMedia(int mediaId)
    {
        // Simulación: solo responde 204
        return NoContent();
    }

    [HttpGet]
    public async Task<IActionResult> GetMediaList()
    {
        // Simulación: lista vacía
        return Ok(new List<object>());
    }
}