using System.Threading.Tasks;

namespace Back.Services
{
    public interface IMediaService
    {
        Task<ValidationResult> ValidateImageFile(string filePath, long sizeBytes);
        Task<MediaEntity> ProcessImageUpload(string tempPath, string userId);
        Task SaveMediaMetadata(MediaEntity media);
        // ...otros métodos para video, audio, cleanup, status, delete, get...
    }

    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
    }

    public class MediaEntity
    {
        public int Id { get; set; }
        public string RelativePath { get; set; } = string.Empty;
        public string ThumbnailPath { get; set; } = string.Empty;
        public long SizeBytes { get; set; }
    }
}