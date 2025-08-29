using System.Threading.Tasks;
using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using Back.Models;
using Back.Data;
using Back.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Back.Services
{
    public class MediaService : IMediaService
    {
        private readonly ApplicationDbContext _context;
        private static readonly string UploadsRootImages = "/home/user/ccpvj/Data/media/uploads/images";
        private static readonly string ThumbnailsRoot = "/home/user/ccpvj/Data/media/processed/images/thumbnails";
        private static readonly string UploadsRootAudio = "/home/user/ccpvj/Data/media/uploads/audio";
        private static readonly string UploadsRootVideos = "/home/user/ccpvj/Data/media/uploads/videos";
        private static readonly string TempRoot = "/home/user/ccpvj/Data/media/temp/uploads";

        public MediaService(ApplicationDbContext context)
        {
            _context = context;
        }

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

        public async Task SaveMediaMetadata(MediaEntity media)
        {
            _context.MediaEntity.Add(media);
            await _context.SaveChangesAsync();
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

        public async Task<int> CleanupTempFiles()
        {
            int deletedCount = 0;
            if (Directory.Exists(TempRoot))
            {
                var files = Directory.GetFiles(TempRoot, "*", SearchOption.AllDirectories);
                foreach (var file in files)
                {
                    try { File.Delete(file); deletedCount++; } catch { }
                }
            }
            return deletedCount;
        }

        public async Task<string> GetUploadStatus(Guid uploadId)
        {
            var uploadStatus = await _context.UploadStatus.FindAsync(uploadId);
            if (uploadStatus == null)
                return "not_found";
            
            return uploadStatus.Status;
        }

        // Método para crear un nuevo estado de upload
        public async Task<Guid> CreateUploadStatus(string fileName, string userId)
        {
            var uploadId = Guid.NewGuid();
            var uploadStatus = new UploadStatus
            {
                UploadId = uploadId,
                Status = "pending",
                FileName = fileName,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                Progress = 0
            };
            
            _context.UploadStatus.Add(uploadStatus);
            await _context.SaveChangesAsync();
            
            return uploadId;
        }

        // Método para actualizar el estado de upload
        public async Task UpdateUploadStatus(Guid uploadId, string status, double progress = 0, string? errorMessage = null, int? mediaId = null)
        {
            var uploadStatus = await _context.UploadStatus.FindAsync(uploadId);
            if (uploadStatus != null)
            {
                uploadStatus.Status = status;
                uploadStatus.Progress = progress;
                uploadStatus.ErrorMessage = errorMessage;
                uploadStatus.MediaId = mediaId;
                
                if (status == "completed" || status == "error")
                    uploadStatus.CompletedAt = DateTime.UtcNow;
                
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> DeleteMedia(int mediaId)
        {
            var media = await _context.MediaEntity.FindAsync(mediaId);
            if (media == null) return false;
            _context.MediaEntity.Remove(media);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<MediaEntity>> GetMediaList(MediaFilterDto filter)
        {
            var query = _context.MediaEntity.AsQueryable();
            if (filter.Type.HasValue)
                query = query.Where(m => m.Type == filter.Type.Value);
            if (!string.IsNullOrEmpty(filter.CreatedBy))
                query = query.Where(m => m.CreatedBy == filter.CreatedBy);
            return await query.ToListAsync();
        }

        public async Task<MediaEntity?> GetMediaById(int mediaId)
        {
            return await _context.MediaEntity.FindAsync(mediaId);
        }

        public async Task UpdateMediaMetadata(int mediaId, Dictionary<string, object> metadata)
        {
            var media = await _context.MediaEntity.FindAsync(mediaId);
            if (media != null)
            {
                media.Metadata = metadata;
                await _context.SaveChangesAsync();
            }
        }
    }

    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
    }
}
