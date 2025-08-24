using System.Threading.Tasks;
using System;

namespace Back.Services
{
    public class MediaService : IMediaService
    {
        public Task<ValidationResult> ValidateImageFile(string filePath, long sizeBytes) => Task.FromResult(new ValidationResult { IsValid = true });
        public Task<MediaEntity> ProcessImageUpload(string tempPath, string userId) => Task.FromResult(new MediaEntity());
        public Task SaveMediaMetadata(MediaEntity media) => Task.CompletedTask;
    }
}
