using System.Threading.Tasks;
using Back.Models;
using Back.DTOs;
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
        Task<int> CleanupTempFiles();
        Task<string> GetUploadStatus(Guid uploadId);
        Task<Guid> CreateUploadStatus(string fileName, string userId);
        Task UpdateUploadStatus(Guid uploadId, string status, double progress = 0, string? errorMessage = null, int? mediaId = null);
        Task<bool> DeleteMedia(int mediaId);
        Task<IEnumerable<MediaEntity>> GetMediaList(MediaFilterDto filter);
        Task<MediaEntity?> GetMediaById(int mediaId);
        Task UpdateMediaMetadata(int mediaId, Dictionary<string, object> metadata);
    }
}