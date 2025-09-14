using CentroCultural.Application.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace CentroCultural.Infrastructure.Services
{
    public class FileStorageService : IFileStorageService
    {
        private readonly ILogger<FileStorageService> _logger;
        private readonly string _uploadsPath;

        public FileStorageService(ILogger<FileStorageService> logger)
        {
            _logger = logger;
            _uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            
            // Crear directorio si no existe
            if (!Directory.Exists(_uploadsPath))
            {
                Directory.CreateDirectory(_uploadsPath);
            }
        }

        public async Task<FileStorageResult> SaveFileAsync(IFormFile file, string folder)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return new FileStorageResult
                    {
                        Success = false,
                        Error = "Archivo no válido"
                    };
                }

                // Validar tipo de archivo
                var allowedTypes = new[]
                {
                    "application/pdf",
                    "video/mp4", "video/webm", "video/mov", "video/avi",
                    "image/jpeg", "image/png", "image/gif", "image/webp",
                    "audio/mp3", "audio/wav", "audio/ogg", "audio/m4a",
                    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "text/plain"
                };

                if (!allowedTypes.Contains(file.ContentType.ToLower()))
                {
                    return new FileStorageResult
                    {
                        Success = false,
                        Error = $"Tipo de archivo no permitido: {file.ContentType}"
                    };
                }

                // Validar tamaño (500MB máximo)
                if (file.Length > 500 * 1024 * 1024)
                {
                    return new FileStorageResult
                    {
                        Success = false,
                        Error = "El archivo es demasiado grande (máximo 500MB)"
                    };
                }

                // Crear directorio de la carpeta específica
                var folderPath = Path.Combine(_uploadsPath, folder);
                if (!Directory.Exists(folderPath))
                {
                    Directory.CreateDirectory(folderPath);
                }

                // Generar nombre único para el archivo
                var fileExtension = Path.GetExtension(file.FileName);
                var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(folderPath, uniqueFileName);

                // Guardar archivo
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Retornar path relativo para almacenar en BD
                var relativePath = Path.Combine("uploads", folder, uniqueFileName).Replace("\\", "/");

                return new FileStorageResult
                {
                    Success = true,
                    FilePath = relativePath
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving file {FileName}", file?.FileName);
                return new FileStorageResult
                {
                    Success = false,
                    Error = "Error al guardar el archivo"
                };
            }
        }

        public async Task<FileResult> GetFileAsync(string filePath, string fileName, string contentType)
        {
            try
            {
                var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", filePath);
                
                if (!File.Exists(fullPath))
                {
                    throw new FileNotFoundException("Archivo no encontrado");
                }

                var fileBytes = await File.ReadAllBytesAsync(fullPath);
                
                return new FileResult
                {
                    FileContents = fileBytes,
                    ContentType = contentType,
                    FileName = fileName
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting file {FilePath}", filePath);
                throw;
            }
        }

        public async Task<bool> DeleteFileAsync(string filePath)
        {
            try
            {
                var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", filePath);
                
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                    return true;
                }
                
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file {FilePath}", filePath);
                return false;
            }
        }
    }
}