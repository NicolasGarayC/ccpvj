using System.Threading.Tasks;
using System;
using System.Collections.Generic;
using CentroCultural.Domain.Entities;
using CentroCultural.Application.DTOs;

namespace CentroCultural.Application.Interfaces
{
    public interface IMediaService
    {
        // File validation
        Task<ValidationResult> ValidateImageFile(string filePath, long sizeBytes);
        
        // Contextual media processing (updated signatures)
        Task<MediaEntity> ProcessImageUpload(string tempPath, string userId, string contentType, Guid contentId);
        Task<MediaEntity> ProcessVideoUpload(string tempPath, string userId, string contentType, Guid contentId);
        Task<MediaEntity> ProcessAudioUpload(string tempPath, string userId, string contentType, Guid contentId);
        
        // Media metadata management
        Task SaveMediaMetadata(MediaEntity media);
        Task<MediaEntity?> GetMediaById(int mediaId);
        Task UpdateMediaMetadata(int mediaId, Dictionary<string, object> metadata);
        Task<bool> DeleteMedia(int mediaId);
        
        // Media listing and filtering
        Task<IEnumerable<MediaEntity>> GetMediaList(MediaFilterDto filter);
        Task<IEnumerable<MediaEntity>> GetMediaByContentAsync(string contentType, Guid contentId);
        
        // Upload status tracking
        Task<string> GetUploadStatus(Guid uploadId);
        Task<Guid> CreateUploadStatus(string fileName, string userId);
        Task UpdateUploadStatus(Guid uploadId, string status, double progress = 0, string? errorMessage = null, int? mediaId = null);
        
        // Maintenance
        Task<int> CleanupTempFiles();
        
        // Content validation
        Task<bool> ValidateContentExistsAsync(string contentType, Guid contentId);
    }
}