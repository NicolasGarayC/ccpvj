using Microsoft.EntityFrameworkCore;
using CentroCultural.Domain.Entities;
using CentroCultural.Domain.Exceptions;
using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using CentroCultural.Infrastructure.Data;
using MediaTypeEnum = CentroCultural.Domain.Enums.MediaType;

namespace CentroCultural.Application.Services
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
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            var ext = Path.GetExtension(filePath).ToLowerInvariant();
            if (!allowedExtensions.Contains(ext))
                return Task.FromResult(new ValidationResult { IsValid = false, ErrorMessage = "Extensi�n no permitida" });
            if (sizeBytes > 20 * 1024 * 1024)
                return Task.FromResult(new ValidationResult { IsValid = false, ErrorMessage = "Archivo demasiado grande" });
            return Task.FromResult(new ValidationResult { IsValid = true });
        }

        public async Task<MediaEntity> ProcessImageUpload(string tempPath, string userId, string contentType, Guid contentId)
        {
            return await Task.Run(() =>
            {
                var contextualPath = GetContextualPath(contentType, contentId, "images");
                Directory.CreateDirectory(contextualPath);
                Directory.CreateDirectory(ThumbnailsRoot);

                var fileName = Path.GetFileName(tempPath);
                var destPath = Path.Combine(contextualPath, fileName);
                var thumbPath = Path.Combine(ThumbnailsRoot, fileName);

                File.Move(tempPath, destPath, true);
                File.Copy(destPath, thumbPath, true);

                var media = new MediaEntity
                {
                    FileName = fileName,
                    RelativePath = GetRelativePath(contentType, contentId, "images", fileName),
                    ThumbnailPath = $"processed/images/thumbnails/{fileName}",
                    Type = CentroCultural.Domain.Enums.MediaType.Image,
                    SizeBytes = new FileInfo(destPath).Length,
                    MimeType = GetMimeType(fileName),
                    CreatedBy = userId ?? string.Empty,
                    CreatedAt = DateTime.UtcNow,
                    Metadata = new Dictionary<string, object>(),
                    ContentType = contentType,
                    ContentId = contentId,
                    MediaType = "image"
                };

                return media;
            });
        }

        public async Task SaveMediaMetadata(MediaEntity media)
        {
            _context.MediaEntity.Add(media);
            await _context.SaveChangesAsync();
        }

        public async Task<MediaEntity> ProcessVideoUpload(string tempPath, string userId, string contentType, Guid contentId)
        {
            return await Task.Run(() =>
            {
                var contextualPath = GetContextualPath(contentType, contentId, "videos");
                Directory.CreateDirectory(contextualPath);
                var fileName = Path.GetFileName(tempPath);
                var destPath = Path.Combine(contextualPath, fileName);
                File.Move(tempPath, destPath, true);
                var media = new MediaEntity
                {
                    FileName = fileName,
                    RelativePath = GetRelativePath(contentType, contentId, "videos", fileName),
                    ThumbnailPath = string.Empty,
                    Type = CentroCultural.Domain.Enums.MediaType.Video,
                    SizeBytes = new FileInfo(destPath).Length,
                    MimeType = "video/mp4",
                    CreatedBy = userId ?? string.Empty,
                    CreatedAt = DateTime.UtcNow,
                    Metadata = new Dictionary<string, object>(),
                    ContentType = contentType,
                    ContentId = contentId,
                    MediaType = "video"
                };
                return media;
            });
        }

        public async Task<MediaEntity> ProcessAudioUpload(string tempPath, string userId, string contentType, Guid contentId)
        {
            return await Task.Run(() =>
            {
                var contextualPath = GetContextualPath(contentType, contentId, "audio");
                Directory.CreateDirectory(contextualPath);
                var fileName = Path.GetFileName(tempPath);
                var destPath = Path.Combine(contextualPath, fileName);
                File.Move(tempPath, destPath, true);
                var media = new MediaEntity
                {
                    FileName = fileName,
                    RelativePath = GetRelativePath(contentType, contentId, "audio", fileName),
                    ThumbnailPath = string.Empty,
                    Type = CentroCultural.Domain.Enums.MediaType.Audio,
                    SizeBytes = new FileInfo(destPath).Length,
                    MimeType = "audio/mpeg",
                    CreatedBy = userId ?? string.Empty,
                    CreatedAt = DateTime.UtcNow,
                    Metadata = new Dictionary<string, object>(),
                    ContentType = contentType,
                    ContentId = contentId,
                    MediaType = "audio"
                };
                return media;
            });
        }

        public async Task<int> CleanupTempFiles()
        {
            return await Task.Run(() =>
            {
                int deletedCount = 0;
                if (Directory.Exists(TempRoot))
                {
                    var files = Directory.GetFiles(TempRoot, "*", SearchOption.AllDirectories);
                    foreach (var file in files)
                    {
                        try
                        {
                            File.Delete(file);
                            deletedCount++;
                        }
                        catch (UnauthorizedAccessException ex)
                        {
                            throw new MediaCleanupException(file, $"Acceso denegado al intentar eliminar el archivo: {Path.GetFileName(file)}", ex);
                        }
                        catch (DirectoryNotFoundException ex)
                        {
                            throw new MediaCleanupException(file, $"El directorio que contiene el archivo no fue encontrado: {Path.GetFileName(file)}", ex);
                        }   
                        catch (IOException ex)
                        {
                            throw new MediaCleanupException(file, $"Error de E/S al eliminar el archivo: {Path.GetFileName(file)}", ex);
                        }
                        catch (Exception ex)
                        {
                            throw new MediaCleanupException(file, deletedCount, $"Error inesperado al eliminar el archivo: {Path.GetFileName(file)}", ex);
                        }
                    }
                }
                return deletedCount;
            });
        }

        public async Task<string> GetUploadStatus(Guid uploadId)
        {
            var uploadStatus = await _context.UploadStatus.FindAsync(uploadId);
            if (uploadStatus == null)
                return "not_found";
            
            return uploadStatus.Status;
        }

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
                query = query.Where(m => (int)m.Type == (int)filter.Type.Value);
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

        private string GetMimeType(string fileName)
        {
            var ext = Path.GetExtension(fileName).ToLowerInvariant();
            return ext switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".mp4" => "video/mp4",
                ".webm" => "video/webm",
                ".mov" => "video/quicktime",
                ".mp3" => "audio/mpeg",
                ".wav" => "audio/wav",
                ".ogg" => "audio/ogg",
                ".pdf" => "application/pdf",
                _ => "application/octet-stream"
            };
        }

        // CONTEXTUAL MULTIMEDIA HELPER METHODS
        private string GetContextualPath(string contentType, Guid contentId, string mediaType)
        {
            var basePath = "/home/user/ccpvj/Data/var/www/media/uploads";
            return Path.Combine(basePath, mediaType, contentType, contentId.ToString());
        }

        private string GetRelativePath(string contentType, Guid contentId, string mediaType, string fileName)
        {
            return $"{mediaType}/{contentType}/{contentId}/{fileName}";
        }

        public async Task<IEnumerable<MediaEntity>> GetMediaByContentAsync(string contentType, Guid contentId)
        {
            return await _context.MediaEntity
                .Where(m => m.ContentType == contentType && m.ContentId == contentId)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> ValidateContentExistsAsync(string contentType, Guid contentId)
        {
            return contentType.ToLower() switch
            {
                "course" => await _context.Course.AnyAsync(c => c.Id == contentId),
                "module" => await _context.Module.AnyAsync(m => m.Id == contentId),
                "workitem" => await _context.WorkItem.AnyAsync(w => w.Id == contentId),
                "blog" => _context.BlogPost != null && await _context.BlogPost.AnyAsync(b => b.Id == contentId),
                "event" => _context.Event != null && await _context.Event.AnyAsync(e => e.Id == contentId),
                _ => false
            };
        }
    }
}