using System.Text.Json;
using CentroCultural.Application.DTOs.Library;
using CentroCultural.Domain.Entities;
using CentroCultural.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CentroCultural.Application.Services
{
    public interface ILibraryService
    {
        Task<LibraryResourceResponseDto> GetAllResourcesAsync(LibrarySearchFiltersDto filters);
        Task<LibraryResourceResponseDto> GetResourceByIdAsync(string id);
        Task<LibraryResourceResponseDto> CreateResourceAsync(CreateLibraryResourceDto dto, IFormFile file, int uploadedBy);
        Task<LibraryResourceResponseDto> UpdateResourceAsync(string id, UpdateLibraryResourceDto dto);
        Task<LibraryResourceResponseDto> DeleteResourceAsync(string id);
        Task<LibraryResourceResponseDto> GetStatsAsync();
        Task<FileResult> DownloadResourceAsync(string id);
        Task IncrementDownloadCountAsync(string id);
    }

    public class LibraryService : ILibraryService
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<LibraryService> _logger;

        public LibraryService(
            ApplicationDbContext context,
            IFileStorageService fileStorageService,
            ILogger<LibraryService> logger)
        {
            _context = context;
            _fileStorageService = fileStorageService;
            _logger = logger;
        }

        public async Task<LibraryResourceResponseDto> GetAllResourcesAsync(LibrarySearchFiltersDto filters)
        {
            try
            {
                var query = _context.LibraryResources
                    .Where(r => r.IsActive)
                    .AsQueryable();

                // Aplicar filtros
                if (!string.IsNullOrEmpty(filters.Search))
                {
                    var searchLower = filters.Search.ToLower();
                    query = query.Where(r => 
                        r.Name.ToLower().Contains(searchLower) ||
                        r.Description != null && r.Description.ToLower().Contains(searchLower) ||
                        r.Authors.ToLower().Contains(searchLower) ||
                        r.Tags != null && r.Tags.ToLower().Contains(searchLower));
                }

                if (!string.IsNullOrEmpty(filters.Category))
                    query = query.Where(r => r.Category == filters.Category);

                if (!string.IsNullOrEmpty(filters.MediaType))
                    query = query.Where(r => r.MediaType == filters.MediaType);

                if (!string.IsNullOrEmpty(filters.Language))
                    query = query.Where(r => r.Language == filters.Language);

                if (filters.PublishYear.HasValue)
                    query = query.Where(r => r.PublishYear == filters.PublishYear);

                if (filters.Downloadable.HasValue)
                    query = query.Where(r => r.Downloadable == filters.Downloadable);

                if (filters.IsFeatured.HasValue)
                    query = query.Where(r => r.IsFeatured == filters.IsFeatured);

                if (!string.IsNullOrEmpty(filters.Authors))
                    query = query.Where(r => r.Authors.ToLower().Contains(filters.Authors.ToLower()));

                if (filters.Tags?.Any() == true)
                {
                    foreach (var tag in filters.Tags)
                    {
                        query = query.Where(r => r.Tags != null && r.Tags.ToLower().Contains(tag.ToLower()));
                    }
                }

                var totalCount = await query.CountAsync();

                // Paginación
                var resources = await query
                    .OrderByDescending(r => r.UploadedAt)
                    .Skip((filters.Page - 1) * filters.Limit)
                    .Take(filters.Limit)
                    .ToListAsync();

                var resourceDtos = resources.Select(r => new LibraryResourceDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    Description = r.Description,
                    Authors = JsonSerializer.Deserialize<List<string>>(r.Authors) ?? new List<string>(),
                    PublishYear = r.PublishYear,
                    Category = r.Category,
                    MediaType = r.MediaType,
                    FileName = r.FileName,
                    FilePath = r.FilePath,
                    FileSize = r.FileSize,
                    MimeType = r.MimeType,
                    ThumbnailPath = r.ThumbnailPath,
                    Downloadable = r.Downloadable,
                    DownloadCount = r.DownloadCount,
                    Tags = r.Tags != null ? JsonSerializer.Deserialize<List<string>>(r.Tags) : null,
                    ISBN = r.ISBN,
                    Duration = r.Duration,
                    Language = r.Language,
                    UploadedBy = r.UploadedBy,
                    UploadedAt = r.UploadedAt,
                    UpdatedAt = r.UpdatedAt,
                    IsActive = r.IsActive,
                    IsFeatured = r.IsFeatured
                }).ToList();

                return new LibraryResourceResponseDto
                {
                    Success = true,
                    Data = resourceDtos,
                    Total = totalCount,
                    Page = filters.Page,
                    Limit = filters.Limit
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting library resources");
                return new LibraryResourceResponseDto
                {
                    Success = false,
                    Error = "Error al obtener recursos de la biblioteca"
                };
            }
        }

        public async Task<LibraryResourceResponseDto> GetResourceByIdAsync(string id)
        {
            try
            {
                var resourceEntity = await _context.LibraryResources
                    .Where(r => r.Id == id && r.IsActive)
                    .FirstOrDefaultAsync();

                if (resourceEntity == null)
                {
                    return new LibraryResourceResponseDto
                    {
                        Success = false,
                        Error = "Recurso no encontrado"
                    };
                }

                var resource = new LibraryResourceDto
                {
                    Id = resourceEntity.Id,
                    Name = resourceEntity.Name,
                    Description = resourceEntity.Description,
                    Authors = JsonSerializer.Deserialize<List<string>>(resourceEntity.Authors) ?? new List<string>(),
                    PublishYear = resourceEntity.PublishYear,
                    Category = resourceEntity.Category,
                    MediaType = resourceEntity.MediaType,
                    FileName = resourceEntity.FileName,
                    FilePath = resourceEntity.FilePath,
                    FileSize = resourceEntity.FileSize,
                    MimeType = resourceEntity.MimeType,
                    ThumbnailPath = resourceEntity.ThumbnailPath,
                    Downloadable = resourceEntity.Downloadable,
                    DownloadCount = resourceEntity.DownloadCount,
                    Tags = resourceEntity.Tags != null ? JsonSerializer.Deserialize<List<string>>(resourceEntity.Tags) : null,
                    ISBN = resourceEntity.ISBN,
                    Duration = resourceEntity.Duration,
                    Language = resourceEntity.Language,
                    UploadedBy = resourceEntity.UploadedBy,
                    UploadedAt = resourceEntity.UploadedAt,
                    UpdatedAt = resourceEntity.UpdatedAt,
                    IsActive = resourceEntity.IsActive,
                    IsFeatured = resourceEntity.IsFeatured
                };

                return new LibraryResourceResponseDto
                {
                    Success = true,
                    Data = resource
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting library resource {Id}", id);
                return new LibraryResourceResponseDto
                {
                    Success = false,
                    Error = "Error al obtener el recurso"
                };
            }
        }

        public async Task<LibraryResourceResponseDto> CreateResourceAsync(CreateLibraryResourceDto dto, IFormFile file, int uploadedBy)
        {
            try
            {
                // Guardar archivo
                var fileResult = await _fileStorageService.SaveFileAsync(file, "library");
                if (!fileResult.Success)
                {
                    return new LibraryResourceResponseDto
                    {
                        Success = false,
                        Error = fileResult.Error
                    };
                }

                var resource = new LibraryResource
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    Authors = JsonSerializer.Serialize(dto.Authors),
                    PublishYear = dto.PublishYear,
                    Category = dto.Category,
                    MediaType = dto.MediaType,
                    FileName = file.FileName,
                    FilePath = fileResult.FilePath!,
                    FileSize = file.Length,
                    MimeType = file.ContentType,
                    Downloadable = dto.Downloadable,
                    Tags = dto.Tags?.Any() == true ? JsonSerializer.Serialize(dto.Tags) : null,
                    ISBN = dto.ISBN,
                    Duration = dto.Duration,
                    Language = dto.Language,
                    UploadedBy = uploadedBy,
                    IsFeatured = dto.IsFeatured
                };

                _context.LibraryResources.Add(resource);
                await _context.SaveChangesAsync();

                var createdResource = new LibraryResourceDto
                {
                    Id = resource.Id,
                    Name = resource.Name,
                    Description = resource.Description,
                    Authors = dto.Authors,
                    PublishYear = resource.PublishYear,
                    Category = resource.Category,
                    MediaType = resource.MediaType,
                    FileName = resource.FileName,
                    FilePath = resource.FilePath,
                    FileSize = resource.FileSize,
                    MimeType = resource.MimeType,
                    Downloadable = resource.Downloadable,
                    DownloadCount = resource.DownloadCount,
                    Tags = dto.Tags,
                    ISBN = resource.ISBN,
                    Duration = resource.Duration,
                    Language = resource.Language,
                    UploadedBy = resource.UploadedBy,
                    UploadedAt = resource.UploadedAt,
                    IsActive = resource.IsActive,
                    IsFeatured = resource.IsFeatured
                };

                return new LibraryResourceResponseDto
                {
                    Success = true,
                    Data = createdResource
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating library resource");
                return new LibraryResourceResponseDto
                {
                    Success = false,
                    Error = "Error al crear el recurso"
                };
            }
        }

        public async Task<LibraryResourceResponseDto> UpdateResourceAsync(string id, UpdateLibraryResourceDto dto)
        {
            try
            {
                var resource = await _context.LibraryResources
                    .FirstOrDefaultAsync(r => r.Id == id && r.IsActive);

                if (resource == null)
                {
                    return new LibraryResourceResponseDto
                    {
                        Success = false,
                        Error = "Recurso no encontrado"
                    };
                }

                // Actualizar campos
                if (!string.IsNullOrEmpty(dto.Name))
                    resource.Name = dto.Name;
                
                if (dto.Description != null)
                    resource.Description = dto.Description;
                
                if (dto.Authors?.Any() == true)
                    resource.Authors = JsonSerializer.Serialize(dto.Authors);
                
                if (dto.PublishYear.HasValue)
                    resource.PublishYear = dto.PublishYear;
                
                if (!string.IsNullOrEmpty(dto.Category))
                    resource.Category = dto.Category;
                
                if (!string.IsNullOrEmpty(dto.MediaType))
                    resource.MediaType = dto.MediaType;
                
                if (dto.Downloadable.HasValue)
                    resource.Downloadable = dto.Downloadable.Value;
                
                if (dto.Tags != null)
                    resource.Tags = dto.Tags.Any() ? JsonSerializer.Serialize(dto.Tags) : null;
                
                if (!string.IsNullOrEmpty(dto.ISBN))
                    resource.ISBN = dto.ISBN;
                
                if (dto.Duration.HasValue)
                    resource.Duration = dto.Duration;
                
                if (!string.IsNullOrEmpty(dto.Language))
                    resource.Language = dto.Language;
                
                if (dto.IsFeatured.HasValue)
                    resource.IsFeatured = dto.IsFeatured.Value;

                resource.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var updatedResource = new LibraryResourceDto
                {
                    Id = resource.Id,
                    Name = resource.Name,
                    Description = resource.Description,
                    Authors = JsonSerializer.Deserialize<List<string>>(resource.Authors) ?? new List<string>(),
                    PublishYear = resource.PublishYear,
                    Category = resource.Category,
                    MediaType = resource.MediaType,
                    FileName = resource.FileName,
                    FilePath = resource.FilePath,
                    FileSize = resource.FileSize,
                    MimeType = resource.MimeType,
                    Downloadable = resource.Downloadable,
                    DownloadCount = resource.DownloadCount,
                    Tags = resource.Tags != null ? JsonSerializer.Deserialize<List<string>>(resource.Tags) : null,
                    ISBN = resource.ISBN,
                    Duration = resource.Duration,
                    Language = resource.Language,
                    UploadedBy = resource.UploadedBy,
                    UploadedAt = resource.UploadedAt,
                    UpdatedAt = resource.UpdatedAt,
                    IsActive = resource.IsActive,
                    IsFeatured = resource.IsFeatured
                };

                return new LibraryResourceResponseDto
                {
                    Success = true,
                    Data = updatedResource
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating library resource {Id}", id);
                return new LibraryResourceResponseDto
                {
                    Success = false,
                    Error = "Error al actualizar el recurso"
                };
            }
        }

        public async Task<LibraryResourceResponseDto> DeleteResourceAsync(string id)
        {
            try
            {
                var resource = await _context.LibraryResources
                    .FirstOrDefaultAsync(r => r.Id == id && r.IsActive);

                if (resource == null)
                {
                    return new LibraryResourceResponseDto
                    {
                        Success = false,
                        Error = "Recurso no encontrado"
                    };
                }

                // Soft delete
                resource.IsActive = false;
                resource.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Opcional: eliminar archivo físico
                await _fileStorageService.DeleteFileAsync(resource.FilePath);

                return new LibraryResourceResponseDto
                {
                    Success = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting library resource {Id}", id);
                return new LibraryResourceResponseDto
                {
                    Success = false,
                    Error = "Error al eliminar el recurso"
                };
            }
        }

        public async Task<LibraryResourceResponseDto> GetStatsAsync()
        {
            try
            {
                var totalResources = await _context.LibraryResources
                    .CountAsync(r => r.IsActive);

                var totalDownloads = await _context.LibraryResources
                    .Where(r => r.IsActive)
                    .SumAsync(r => r.DownloadCount);

                var resourcesByType = await _context.LibraryResources
                    .Where(r => r.IsActive)
                    .GroupBy(r => r.MediaType)
                    .Select(g => new { Type = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.Type, x => x.Count);

                var resourcesByCategory = await _context.LibraryResources
                    .Where(r => r.IsActive)
                    .GroupBy(r => r.Category)
                    .Select(g => new { Category = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.Category, x => x.Count);

                var popularResources = await _context.LibraryResources
                    .Where(r => r.IsActive)
                    .OrderByDescending(r => r.DownloadCount)
                    .Take(5)
                    .Select(r => new LibraryResourceDto
                    {
                        Id = r.Id,
                        Name = r.Name,
                        DownloadCount = r.DownloadCount,
                        MediaType = r.MediaType,
                        Category = r.Category
                    })
                    .ToListAsync();

                var recentUploads = await _context.LibraryResources
                    .Where(r => r.IsActive)
                    .OrderByDescending(r => r.UploadedAt)
                    .Take(5)
                    .Select(r => new LibraryResourceDto
                    {
                        Id = r.Id,
                        Name = r.Name,
                        UploadedAt = r.UploadedAt,
                        MediaType = r.MediaType,
                        Category = r.Category
                    })
                    .ToListAsync();

                var stats = new LibraryStatsDto
                {
                    TotalResources = totalResources,
                    TotalDownloads = totalDownloads,
                    ResourcesByType = resourcesByType,
                    ResourcesByCategory = resourcesByCategory,
                    PopularResources = popularResources,
                    RecentUploads = recentUploads
                };

                return new LibraryResourceResponseDto
                {
                    Success = true,
                    Data = stats
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting library stats");
                return new LibraryResourceResponseDto
                {
                    Success = false,
                    Error = "Error al obtener estadísticas"
                };
            }
        }

        public async Task<FileResult> DownloadResourceAsync(string id)
        {
            var resource = await _context.LibraryResources
                .FirstOrDefaultAsync(r => r.Id == id && r.IsActive && r.Downloadable);

            if (resource == null)
                throw new FileNotFoundException("Recurso no encontrado o no disponible para descarga");

            return await _fileStorageService.GetFileAsync(resource.FilePath, resource.FileName, resource.MimeType);
        }

        public async Task IncrementDownloadCountAsync(string id)
        {
            var resource = await _context.LibraryResources
                .FirstOrDefaultAsync(r => r.Id == id && r.IsActive);

            if (resource != null)
            {
                resource.DownloadCount++;
                await _context.SaveChangesAsync();
            }
        }
    }

    public class FileResult
    {
        public byte[] FileContents { get; set; } = Array.Empty<byte>();
        public string ContentType { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
    }

    public class FileStorageResult
    {
        public bool Success { get; set; }
        public string? FilePath { get; set; }
        public string? Error { get; set; }
    }

    public interface IFileStorageService
    {
        Task<FileStorageResult> SaveFileAsync(IFormFile file, string folder);
        Task<FileResult> GetFileAsync(string filePath, string fileName, string contentType);
        Task<bool> DeleteFileAsync(string filePath);
    }
}