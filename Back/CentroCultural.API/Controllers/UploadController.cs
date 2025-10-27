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
        /// Cleanup orphan files that were uploaded but not saved
        /// </summary>
        [HttpPost("cleanup")]
        public IActionResult CleanupOrphanFiles([FromBody] CleanupRequest request)
        {
            _logger.LogInformation("Cleanup request received for {Count} files", request.Files?.Count ?? 0);

            if (request.Files == null || request.Files.Count == 0)
                return Ok(new { message = "No files to cleanup" });

            int deletedCount = 0;
            var errors = new List<string>();

            foreach (var relativePath in request.Files)
            {
                try
                {
                    // Construct full path - relativePath doesn't include 'media/' prefix
                    var filePath = Path.Combine("Data", "media", relativePath);

                    if (System.IO.File.Exists(filePath))
                    {
                        System.IO.File.Delete(filePath);
                        _logger.LogInformation("Deleted orphan file: {FilePath}", filePath);
                        deletedCount++;

                        // Try to clean up empty parent directories
                        CleanupEmptyDirectories(Path.GetDirectoryName(filePath));
                    }
                    else
                    {
                        _logger.LogWarning("File not found for cleanup: {FilePath}", filePath);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error deleting file: {RelativePath}", relativePath);
                    errors.Add($"{relativePath}: {ex.Message}");
                }
            }

            return Ok(new
            {
                message = $"Cleanup completed. Deleted {deletedCount} file(s)",
                deletedCount = deletedCount,
                errors = errors.Count > 0 ? errors : null
            });
        }

        private void CleanupEmptyDirectories(string? directoryPath)
        {
            if (string.IsNullOrEmpty(directoryPath) || !Directory.Exists(directoryPath))
                return;

            try
            {
                // Don't delete the base Data/media directory or its direct children
                var dataMediaPath = Path.Combine("Data", "media");
                if (directoryPath == dataMediaPath ||
                    Path.GetDirectoryName(directoryPath) == dataMediaPath)
                    return;

                // If directory is empty, delete it and try parent
                if (!Directory.EnumerateFileSystemEntries(directoryPath).Any())
                {
                    Directory.Delete(directoryPath);
                    _logger.LogInformation("Deleted empty directory: {DirectoryPath}", directoryPath);

                    // Recursively clean parent
                    CleanupEmptyDirectories(Path.GetDirectoryName(directoryPath));
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not cleanup directory: {DirectoryPath}", directoryPath);
            }
        }

        /// <summary>
        /// Upload material apoyo banner image
        /// </summary>
        [HttpPost("material-apoyo/{materialApoyoId}")]
        public async Task<IActionResult> UploadMaterialApoyoImage(string materialApoyoId, [FromForm] IFormFile file, [FromForm] string? oldImagePath = null)
        {
            _logger.LogInformation("Material Apoyo image upload request received for {MaterialApoyoId}", materialApoyoId);
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { error = "No se proporcionó ningún archivo" });

                if (file.Length > 20_971_520) // 20MB
                    return BadRequest(new { error = "Imagen demasiado grande. Tamaño máximo: 20MB" });

                if (!file.ContentType.StartsWith("image/"))
                    return BadRequest(new { error = "El archivo debe ser una imagen" });

                // Directory structure: Data/media/material-apoyo/{materialApoyoId}/
                var uploadsDir = Path.Combine("Data", "media", "material-apoyo", materialApoyoId);

                if (!Directory.Exists(uploadsDir))
                    Directory.CreateDirectory(uploadsDir);

                // Generate filename
                var extension = Path.GetExtension(file.FileName);
                var fileName = $"banner{extension}";
                var filePath = Path.Combine(uploadsDir, fileName);

                // Delete old file if specified
                if (!string.IsNullOrEmpty(oldImagePath))
                {
                    var oldFullPath = Path.Combine("Data", oldImagePath.TrimStart('/'));
                    if (System.IO.File.Exists(oldFullPath))
                    {
                        System.IO.File.Delete(oldFullPath);
                        _logger.LogInformation("Deleted old image: {OldFile}", oldFullPath);
                    }
                }

                // Save the file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Get relative path from Data folder
                var relativePath = Path.GetRelativePath("Data", filePath).Replace("\\", "/");

                // Remove 'media/' prefix if present to avoid duplication in URL
                var cleanRelativePath = relativePath.StartsWith("media/")
                    ? relativePath.Substring(6)
                    : relativePath;

                var result = new
                {
                    success = true,
                    filename = fileName,
                    relativePath = cleanRelativePath,
                    url = $"/media/{cleanRelativePath}",
                    size = file.Length,
                    type = file.ContentType,
                    context = "material-apoyo",
                    contentId = materialApoyoId
                };

                _logger.LogInformation("Material Apoyo image uploaded successfully: {FilePath}", filePath);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading Material Apoyo image for {MaterialApoyoId}", materialApoyoId);
                return StatusCode(500, new { error = "Error interno del servidor al subir la imagen" });
            }
        }

        /// <summary>
        /// Upload media for module post
        /// </summary>
        [HttpPost("posts/{postId}")]
        public async Task<IActionResult> UploadPostMedia(
            string postId,
            [FromForm] IFormFile file,
            [FromForm] string mediaType,
            [FromForm] string courseId,
            [FromForm] string moduleId,
            [FromForm] string? oldFilePath = null)
        {
            _logger.LogInformation("Post media upload request received for post {PostId}", postId);
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { error = "No se proporcionó ningún archivo" });

                // Validate media type
                if (string.IsNullOrEmpty(mediaType) || !new[] { "image", "video", "audio" }.Contains(mediaType))
                    return BadRequest(new { error = "Tipo de media inválido" });

                // Validate file size based on media type
                long maxSize = mediaType switch
                {
                    "image" => 20_971_520,        // 20MB
                    "video" => 21_474_836_480,    // 20GB for movies
                    "audio" => 104_857_600,       // 100MB
                    _ => 20_971_520
                };

                if (file.Length > maxSize)
                    return BadRequest(new { error = $"Archivo demasiado grande. Tamaño máximo: {maxSize / 1_048_576}MB" });

                // Validate content type
                bool isValidType = mediaType switch
                {
                    "image" => file.ContentType.StartsWith("image/"),
                    "video" => file.ContentType.StartsWith("video/"),
                    "audio" => file.ContentType.StartsWith("audio/"),
                    _ => false
                };

                if (!isValidType)
                    return BadRequest(new { error = $"El archivo no coincide con el tipo {mediaType}" });

                // Directory structure: Data/media/material-apoyo/{courseId}/modules/{moduleId}/posts/{postId}/{mediaType}s/
                var mediaFolder = mediaType + "s"; // images, videos, audios
                var uploadsDir = Path.Combine("Data", "media", "material-apoyo", courseId, "modules", moduleId, "posts", postId, mediaFolder);

                if (!Directory.Exists(uploadsDir))
                    Directory.CreateDirectory(uploadsDir);

                // Generate unique filename
                var extension = Path.GetExtension(file.FileName);
                var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                var safeFileName = Path.GetFileNameWithoutExtension(file.FileName)
                    .Replace(" ", "_")
                    .Replace("(", "")
                    .Replace(")", "");
                var fileName = $"{safeFileName}_{timestamp}{extension}";
                var filePath = Path.Combine(uploadsDir, fileName);

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

                // Save the file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Get relative path from Data folder
                var relativePath = Path.GetRelativePath("Data", filePath).Replace("\\", "/");

                // Remove 'media/' prefix if present to avoid duplication in URL
                var cleanRelativePath = relativePath.StartsWith("media/")
                    ? relativePath.Substring(6)
                    : relativePath;

                var result = new
                {
                    success = true,
                    filename = fileName,
                    relativePath = cleanRelativePath,
                    url = $"/media/{cleanRelativePath}",
                    size = file.Length,
                    type = file.ContentType,
                    mediaType = mediaType,
                    context = "post",
                    contentId = postId
                };

                _logger.LogInformation("Post media uploaded successfully: {FilePath}", filePath);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading post media for {PostId}", postId);
                return StatusCode(500, new { error = "Error interno del servidor al subir el archivo" });
            }
        }

        /// <summary>
        /// Upload media for blog post
        /// </summary>
        [HttpPost("blog/{blogPostId}")]
        public async Task<IActionResult> UploadBlogMedia(
            string blogPostId,
            [FromForm] IFormFile file,
            [FromForm] string mediaType,
            [FromForm] string? oldFilePath = null)
        {
            _logger.LogInformation("Blog media upload request received for blog post {BlogPostId}", blogPostId);
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { error = "No se proporcionó ningún archivo" });

                // Validate media type
                if (string.IsNullOrEmpty(mediaType) || !new[] { "image", "video", "audio", "document" }.Contains(mediaType))
                    return BadRequest(new { error = "Tipo de media inválido" });

                // Validate file size based on media type
                long maxSize = mediaType switch
                {
                    "image" => 20_971_520,        // 20MB
                    "video" => 21_474_836_480,    // 20GB for movies
                    "audio" => 104_857_600,       // 100MB
                    "document" => 1_073_741_824,  // 1GB
                    _ => 20_971_520
                };

                if (file.Length > maxSize)
                    return BadRequest(new { error = $"Archivo demasiado grande. Tamaño máximo: {maxSize / 1_048_576}MB" });

                // Validate content type
                bool isValidType = mediaType switch
                {
                    "image" => file.ContentType.StartsWith("image/"),
                    "video" => file.ContentType.StartsWith("video/"),
                    "audio" => file.ContentType.StartsWith("audio/"),
                    "document" => file.ContentType.Contains("pdf") || file.ContentType.Contains("document") ||
                                  file.ContentType.Contains("word") || file.ContentType.Contains("excel") ||
                                  file.ContentType.Contains("powerpoint") || file.ContentType.Contains("text/"),
                    _ => false
                };

                if (!isValidType)
                    return BadRequest(new { error = $"El archivo no coincide con el tipo {mediaType}" });

                // Directory structure: Data/media/blog/posts/{blogPostId}/{mediaType}s/
                var mediaFolder = mediaType + "s"; // images, videos, audios, documents
                var uploadsDir = Path.Combine("Data", "media", "blog", "posts", blogPostId, mediaFolder);

                if (!Directory.Exists(uploadsDir))
                    Directory.CreateDirectory(uploadsDir);

                // Generate unique filename
                var extension = Path.GetExtension(file.FileName);
                var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                var safeFileName = Path.GetFileNameWithoutExtension(file.FileName)
                    .Replace(" ", "_")
                    .Replace("(", "")
                    .Replace(")", "");
                var fileName = $"{safeFileName}_{timestamp}{extension}";
                var filePath = Path.Combine(uploadsDir, fileName);

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

                // Save the file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Get relative path from Data folder
                var relativePath = Path.GetRelativePath("Data", filePath).Replace("\\", "/");

                // Remove 'media/' prefix if present to avoid duplication in URL
                var cleanRelativePath = relativePath.StartsWith("media/")
                    ? relativePath.Substring(6)
                    : relativePath;

                var result = new
                {
                    success = true,
                    filename = fileName,
                    relativePath = cleanRelativePath,
                    url = $"/media/{cleanRelativePath}",
                    size = file.Length,
                    type = file.ContentType,
                    mediaType = mediaType,
                    context = "blog",
                    contentId = blogPostId
                };

                _logger.LogInformation("Blog media uploaded successfully: {FilePath}", filePath);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading blog media for {BlogPostId}", blogPostId);
                return StatusCode(500, new { error = "Error interno del servidor al subir el archivo" });
            }
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

                // Validate file size (20GB max for movies)
                if (file.Length > 21_474_836_480) // 20GB
                    return BadRequest(new { error = "Archivo demasiado grande. Tamaño máximo: 20GB" });

                // Get file type based on content type (for metadata only)
                string fileType = "document";
                if (file.ContentType.StartsWith("image/")) fileType = "image";
                else if (file.ContentType.StartsWith("video/")) fileType = "video";
                else if (file.ContentType.StartsWith("audio/")) fileType = "audio";

                // Simple directory structure: Data/media/library/
                var finalDir = Path.Combine("Data", "media", "library");

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

                // Remove 'media/' prefix if present to avoid duplication in URL
                var cleanRelativePath = relativePath.StartsWith("media/")
                    ? relativePath.Substring(6)
                    : relativePath;

                var result = new
                {
                    success = true,
                    filename = fileName,
                    relativePath = cleanRelativePath,
                    url = $"/media/{cleanRelativePath}",
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

    public class CleanupRequest
    {
        public List<string> Files { get; set; } = new List<string>();
    }
}
