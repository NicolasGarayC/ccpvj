using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.IO;
using System;
using System.Threading.Tasks;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly ILogger<UploadController> _logger;

        public UploadController(ILogger<UploadController> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Upload file for digital library item
        /// </summary>
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
