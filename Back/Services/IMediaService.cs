using System.Threading.Tasks;
using Back.Models;
using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;

namespace Back.Services
{
    public interface IMediaService
    {
        Task<ValidationResult> ValidateImageFile(string filePath, long sizeBytes);
        Task<MediaEntity> ProcessImageUpload(string tempPath, string userId);
        Task<MediaEntity> ProcessVideoUpload(string tempPath, string userId);
        Task<MediaEntity> ProcessAudioUpload(string tempPath, string userId);
        Task SaveMediaMetadata(MediaEntity media);
        // ...otros métodos para cleanup, status, delete, get...
    }
}