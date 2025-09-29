using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.IO;
using System.Linq;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using CentroCultural.Application.Interfaces;
using CentroCultural.Application.DTOs;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly IMediaService? _mediaService;
        private readonly ILogger<UploadController> _logger;

        public UploadController(ILogger<UploadController> logger, IMediaService? mediaService = null)
            => (_mediaService, _logger) = (mediaService, logger);

        [HttpPost("{contentType}/{contentId}/images")]
        public async Task<IActionResult> ProcessImageUpload(string contentType, Guid contentId)
        {
            // Validate content type
            var validContentTypes = new[] { "course", "workitem", "blog", "event" };
            if (!validContentTypes.Contains(contentType.ToLower()))
                return BadRequest("Tipo de contenido no válido. Debe ser: course, workitem, blog, event");

            // Validate that content exists
            if (!await _mediaService.ValidateContentExistsAsync(contentType.ToLower(), contentId))
                return BadRequest("El contenido especificado no existe");

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
            var media = await _mediaService.ProcessImageUpload(tempFilePath, userId, contentType.ToLower(), contentId);
            await _mediaService.SaveMediaMetadata(media);

            return Ok(new { 
                id = media.Id, 
                url = $"/media/{media.RelativePath}", 
                thumbnail = $"/media/{media.ThumbnailPath}", 
                size = media.SizeBytes,
                contentType = media.ContentType,
                contentId = media.ContentId
            });
        }

        [HttpPost("{contentType}/{contentId}/videos")]
        public async Task<IActionResult> ProcessVideoUpload(string contentType, Guid contentId)
        {
            // Validate content type
            var validContentTypes = new[] { "course", "workitem", "blog", "event" };
            if (!validContentTypes.Contains(contentType.ToLower()))
                return BadRequest("Tipo de contenido no válido. Debe ser: course, workitem, blog, event");

            // Validate that content exists
            if (!await _mediaService.ValidateContentExistsAsync(contentType.ToLower(), contentId))
                return BadRequest("El contenido especificado no existe");

            var tempFilePath = Request.Headers["X-File-Path"].FirstOrDefault();
            if (string.IsNullOrEmpty(tempFilePath) || !System.IO.File.Exists(tempFilePath))
                return BadRequest("Archivo temporal no encontrado");

            var ext = Path.GetExtension(tempFilePath).ToLowerInvariant();
            var allowed = new[] { ".mp4", ".webm", ".mov" };
            if (!allowed.Contains(ext))
            {
                System.IO.File.Delete(tempFilePath);
                return BadRequest("Extensi�n de video no permitida");
            }
            if (new FileInfo(tempFilePath).Length > 500 * 1024 * 1024)
            {
                System.IO.File.Delete(tempFilePath);
                return BadRequest("Archivo de video demasiado grande");
            }

            var userId = User?.Identity?.Name ?? "unknown";
            var fileName = Path.GetFileName(tempFilePath);
            
            var uploadId = await _mediaService.CreateUploadStatus(fileName, userId);
            
            _ = Task.Run(async () =>
            {
                try
                {
                    await _mediaService.UpdateUploadStatus(uploadId, "processing", 10);
                    var media = await _mediaService.ProcessVideoUpload(tempFilePath, userId, contentType.ToLower(), contentId);
                    await _mediaService.UpdateUploadStatus(uploadId, "processing", 80);
                    await _mediaService.SaveMediaMetadata(media);
                    await _mediaService.UpdateUploadStatus(uploadId, "completed", 100, null, media.Id);
                }
                catch (Exception ex)
                {
                    await _mediaService.UpdateUploadStatus(uploadId, "error", 0, ex.Message);
                }
            });
            
            return Accepted(new { 
                uploadId, 
                status = "processing", 
                message = "Video en procesamiento. Usa /api/upload/status/{uploadId} para verificar progreso",
                contentType,
                contentId
            });
        }

        [HttpPost("{contentType}/{contentId}/audio")]
        public async Task<IActionResult> ProcessAudioUpload(string contentType, Guid contentId)
        {
            // Validate content type
            var validContentTypes = new[] { "course", "workitem", "blog", "event" };
            if (!validContentTypes.Contains(contentType.ToLower()))
                return BadRequest("Tipo de contenido no válido. Debe ser: course, workitem, blog, event");

            // Validate that content exists
            if (!await _mediaService.ValidateContentExistsAsync(contentType.ToLower(), contentId))
                return BadRequest("El contenido especificado no existe");

            var tempFilePath = Request.Headers["X-File-Path"].FirstOrDefault();
            if (string.IsNullOrEmpty(tempFilePath) || !System.IO.File.Exists(tempFilePath))
                return BadRequest("Archivo temporal no encontrado");

            var ext = Path.GetExtension(tempFilePath).ToLowerInvariant();
            var allowed = new[] { ".mp3", ".wav", ".ogg" };
            if (!allowed.Contains(ext))
            {
                System.IO.File.Delete(tempFilePath);
                return BadRequest("Extensi�n de audio no permitida");
            }
            if (new FileInfo(tempFilePath).Length > 100 * 1024 * 1024)
            {
                System.IO.File.Delete(tempFilePath);
                return BadRequest("Archivo de audio demasiado grande");
            }

            var userId = User?.Identity?.Name ?? "unknown";
            var media = await _mediaService.ProcessAudioUpload(tempFilePath, userId, contentType.ToLower(), contentId);
            await _mediaService.SaveMediaMetadata(media);
            
            return Ok(new { 
                id = media.Id, 
                url = $"/media/{media.RelativePath}", 
                size = media.SizeBytes,
                contentType = media.ContentType,
                contentId = media.ContentId
            });
        }

        [HttpPost("cleanup")]
        [AllowAnonymous]
        public async Task<IActionResult> CleanupTempFiles()
        {
            var deletedCount = await _mediaService.CleanupTempFiles();
            return Ok(new { deletedFiles = deletedCount });
        }

        [HttpGet("status/{uploadId}")]
        public async Task<IActionResult> GetUploadStatus(Guid uploadId)
        {
            var status = await _mediaService.GetUploadStatus(uploadId);
            if (status == "not_found")
                return NotFound(new { uploadId, status = "not_found", message = "Upload ID no encontrado" });
            
            return Ok(new { uploadId, status });
        }

        [HttpDelete("{mediaId}")]
        public async Task<IActionResult> DeleteMedia(int mediaId)
        {
            var result = await _mediaService.DeleteMedia(mediaId);
            if (!result)
                return NotFound();
            
            return NoContent();
        }

        [HttpGet]
        public async Task<IActionResult> GetMediaList([FromQuery] MediaFilterDto filter)
        {
            var mediaList = await _mediaService.GetMediaList(filter);
            return Ok(mediaList);
        }

        [HttpGet("{contentType}/{contentId}")]
        public async Task<IActionResult> GetMediaByContent(string contentType, Guid contentId)
        {
            // Validate content type
            var validContentTypes = new[] { "course", "workitem", "blog", "event" };
            if (!validContentTypes.Contains(contentType.ToLower()))
                return BadRequest("Tipo de contenido no válido. Debe ser: course, workitem, blog, event");

            var mediaList = await _mediaService.GetMediaByContentAsync(contentType.ToLower(), contentId);
            return Ok(mediaList);
        }

        [HttpPost("library/{itemId}")]
        public async Task<IActionResult> UploadLibraryFile(string itemId, [FromForm] IFormFile file, [FromForm] string? category = null, [FromForm] string? oldFilePath = null)
        {
            _logger.LogInformation("Library upload request received for item {ItemId}", itemId);
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { error = "No se proporcionó ningún archivo" });

                // Validate file size (5GB max for movies)
                if (file.Length > 5_368_709_120) // 5GB
                    return BadRequest(new { error = "Archivo demasiado grande. Tamaño máximo: 5GB" });

                // Get file type based on content type
                string fileType = "document";
                if (file.ContentType.StartsWith("image/")) fileType = "image";
                else if (file.ContentType.StartsWith("video/")) fileType = "video";
                else if (file.ContentType.StartsWith("audio/")) fileType = "audio";

                // Create directory structure based on category and file type
                var uploadsDir = Path.Combine("Data", "media");
                var categoryDir = !string.IsNullOrEmpty(category) ? category.ToLower().Replace(" ", "-") : "general";
                var finalDir = Path.Combine(uploadsDir, categoryDir, fileType);

                if (!Directory.Exists(finalDir))
                    Directory.CreateDirectory(finalDir);

                // Generate unique filename
                var extension = Path.GetExtension(file.FileName);
                var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                var safeFileName = Path.GetFileNameWithoutExtension(file.FileName)
                    .Replace(" ", "_")
                    .Replace("(", "")
                    .Replace(")", "");
                var fileName = $"{itemId}_{timestamp}_{safeFileName}{extension}";
                var filePath = Path.Combine(finalDir, fileName);

                // Delete old file if specified
                if (!string.IsNullOrEmpty(oldFilePath))
                {
                    var oldFullPath = Path.Combine("Data", oldFilePath.TrimStart('/'));
                    if (System.IO.File.Exists(oldFullPath))
                    {
                        System.IO.File.Delete(oldFullPath);
                        _logger.LogInformation("Deleted old file: {OldFile}", oldFullPath);
                    }
                }

                // Save the new file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Generate relative path for URL
                var relativePath = Path.GetRelativePath("Data", filePath).Replace("\\", "/");

                var result = new
                {
                    success = true,
                    filename = fileName,
                    relativePath = relativePath,
                    url = $"/media/{relativePath}",
                    size = file.Length,
                    type = file.ContentType,
                    fileType = fileType,
                    category = category ?? "general",
                    context = "library",
                    contentId = itemId
                };

                _logger.LogInformation("Library file uploaded successfully: {FilePath}", filePath);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading library file for item {ItemId}", itemId);
                return StatusCode(500, new { error = "Error interno del servidor al subir el archivo" });
            }
        }

    }
}