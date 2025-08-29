using System.Threading.Tasks;
using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using Back.Models;

namespace Back.Services
{
    public class MediaService : IMediaService
    {
        private static readonly string UploadsRootImages = "/home/user/ccpvj/Data/media/uploads/images";
        private static readonly string ThumbnailsRoot = "/home/user/ccpvj/Data/media/processed/images/thumbnails";
        private static readonly string UploadsRootAudio = "/home/user/ccpvj/Data/media/uploads/audio";
        private static readonly string UploadsRootVideos = "/home/user/ccpvj/Data/media/uploads/videos";

        public Task<ValidationResult> ValidateImageFile(string filePath, long sizeBytes)
        {
            // Validar extensión y tamaño (ejemplo: solo jpg/png, < 20MB)
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            var ext = Path.GetExtension(filePath).ToLowerInvariant();
            if (!allowedExtensions.Contains(ext))
                return Task.FromResult(new ValidationResult { IsValid = false, ErrorMessage = "Extensión no permitida" });
            if (sizeBytes > 20 * 1024 * 1024)
                return Task.FromResult(new ValidationResult { IsValid = false, ErrorMessage = "Archivo demasiado grande" });
            return Task.FromResult(new ValidationResult { IsValid = true });
        }

        public async Task<MediaEntity> ProcessImageUpload(string tempPath, string userId)
        {
            // Crear carpetas si no existen
            Directory.CreateDirectory(UploadsRootImages);
            Directory.CreateDirectory(ThumbnailsRoot);

            var fileName = Path.GetFileName(tempPath);
            var destPath = Path.Combine(UploadsRootImages, fileName);
            var thumbPath = Path.Combine(ThumbnailsRoot, fileName);

            // Mover archivo a uploads
            File.Move(tempPath, destPath, true);

            // Mock: copiar como thumbnail (en real, generar thumbnail)
            File.Copy(destPath, thumbPath, true);

            var media = new MediaEntity
            {
                FileName = fileName,
                RelativePath = $"images/{fileName}",
                ThumbnailPath = $"processed/images/thumbnails/{fileName}",
                Type = MediaType.Image,
                SizeBytes = new FileInfo(destPath).Length,
                MimeType = GetMimeType(fileName),
                CreatedBy = userId ?? string.Empty,
                CreatedAt = DateTime.UtcNow,
                Metadata = new Dictionary<string, object>()
            };
            return media;
        }

        public Task SaveMediaMetadata(MediaEntity media)
        {
            // Aquí deberías guardar en la base de datos (mock: no-op)
            return Task.CompletedTask;
        }

        // Métodos mock para videos y audio (puedes expandir lógica real según necesidad)
        public async Task<MediaEntity> ProcessVideoUpload(string tempPath, string userId)
        {
            Directory.CreateDirectory(UploadsRootVideos);
            var fileName = Path.GetFileName(tempPath);
            var destPath = Path.Combine(UploadsRootVideos, fileName);
            File.Move(tempPath, destPath, true);
            var media = new MediaEntity
            {
                FileName = fileName,
                RelativePath = $"videos/{fileName}",
                ThumbnailPath = string.Empty,
                Type = MediaType.Video,
                SizeBytes = new FileInfo(destPath).Length,
                MimeType = "video/mp4",
                CreatedBy = userId ?? string.Empty,
                CreatedAt = DateTime.UtcNow,
                Metadata = new Dictionary<string, object>()
            };
            return media;
        }

        public async Task<MediaEntity> ProcessAudioUpload(string tempPath, string userId)
        {
            Directory.CreateDirectory(UploadsRootAudio);
            var fileName = Path.GetFileName(tempPath);
            var destPath = Path.Combine(UploadsRootAudio, fileName);
            File.Move(tempPath, destPath, true);
            var media = new MediaEntity
            {
                FileName = fileName,
                RelativePath = $"audio/{fileName}",
                ThumbnailPath = string.Empty,
                Type = MediaType.Audio,
                SizeBytes = new FileInfo(destPath).Length,
                MimeType = "audio/mpeg",
                CreatedBy = userId ?? string.Empty,
                CreatedAt = DateTime.UtcNow,
                Metadata = new Dictionary<string, object>()
            };
            return media;
        }

        private string GetMimeType(string fileName)
        {
            var ext = Path.GetExtension(fileName).ToLowerInvariant();
            return ext switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                _ => "application/octet-stream"
            };
        }
    }

    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
    }
}
