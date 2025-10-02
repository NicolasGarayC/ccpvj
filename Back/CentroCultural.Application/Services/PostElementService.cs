using Microsoft.EntityFrameworkCore;
using CentroCultural.Infrastructure.Data;
using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using CentroCultural.Domain.Entities;
using System.IO;

namespace CentroCultural.Application.Services
{
    public class PostElementService : IPostElementService
    {
        private readonly ApplicationDbContext _context;

        public PostElementService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<PostElementDto>> GetElementsByPostIdAsync(string postId)
        {
            var elements = await _context.PostElements
                .Where(pe => pe.PostId == postId && pe.IsActive)
                .OrderBy(pe => pe.OrderNumber)
                .Select(pe => new PostElementDto
                {
                    Id = pe.Id,
                    PostId = pe.PostId,
                    ElementType = pe.ElementType,
                    Content = pe.Content,
                    FilePath = pe.FilePath,
                    FileName = pe.FileName,
                    FileSize = pe.FileSize,
                    MimeType = pe.MimeType,
                    OrderNumber = pe.OrderNumber,
                    Metadata = pe.Metadata,
                    IsActive = pe.IsActive,
                    CreatedAt = DateTimeOffset.FromUnixTimeSeconds(pe.CreatedAt).DateTime,
                    UpdatedAt = pe.UpdatedAt.HasValue ? DateTimeOffset.FromUnixTimeSeconds(pe.UpdatedAt.Value).DateTime : null
                })
                .ToListAsync();

            return elements;
        }

        public async Task<PostElementDto?> GetElementByIdAsync(string elementId)
        {
            var element = await _context.PostElements
                .Where(pe => pe.Id == elementId && pe.IsActive)
                .Select(pe => new PostElementDto
                {
                    Id = pe.Id,
                    PostId = pe.PostId,
                    ElementType = pe.ElementType,
                    Content = pe.Content,
                    FilePath = pe.FilePath,
                    FileName = pe.FileName,
                    FileSize = pe.FileSize,
                    MimeType = pe.MimeType,
                    OrderNumber = pe.OrderNumber,
                    Metadata = pe.Metadata,
                    IsActive = pe.IsActive,
                    CreatedAt = DateTimeOffset.FromUnixTimeSeconds(pe.CreatedAt).DateTime,
                    UpdatedAt = pe.UpdatedAt.HasValue ? DateTimeOffset.FromUnixTimeSeconds(pe.UpdatedAt.Value).DateTime : null
                })
                .FirstOrDefaultAsync();

            return element;
        }

        public async Task<PostElementDto> CreateElementAsync(CreatePostElementDto createElementDto, int userId)
        {
            var element = new PostElement
            {
                Id = Guid.NewGuid().ToString(),
                PostId = createElementDto.PostId,
                ElementType = createElementDto.ElementType,
                Content = createElementDto.Content,
                FilePath = createElementDto.FilePath,
                FileName = createElementDto.FileName,
                FileSize = createElementDto.FileSize,
                MimeType = createElementDto.MimeType,
                OrderNumber = createElementDto.OrderNumber,
                Metadata = createElementDto.Metadata,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                UpdatedAt = null
            };

            _context.PostElements.Add(element);
            await _context.SaveChangesAsync();

            return new PostElementDto
            {
                Id = element.Id,
                PostId = element.PostId,
                ElementType = element.ElementType,
                Content = element.Content,
                FilePath = element.FilePath,
                FileName = element.FileName,
                FileSize = element.FileSize,
                MimeType = element.MimeType,
                OrderNumber = element.OrderNumber,
                Metadata = element.Metadata,
                IsActive = element.IsActive,
                CreatedAt = DateTimeOffset.FromUnixTimeSeconds(element.CreatedAt).DateTime,
                UpdatedAt = element.UpdatedAt.HasValue ? DateTimeOffset.FromUnixTimeSeconds(element.UpdatedAt.Value).DateTime : null
            };
        }

        public async Task<IEnumerable<PostElementDto>> CreateElementsInBatchAsync(CreateElementsBatchDto batchDto, int userId)
        {
            var elements = new List<PostElement>();

            foreach (var createDto in batchDto.Elements)
            {
                var element = new PostElement
                {
                    Id = Guid.NewGuid().ToString(),
                    PostId = batchDto.PostId,
                    ElementType = createDto.ElementType,
                    Content = createDto.Content,
                    FilePath = createDto.FilePath,
                    FileName = createDto.FileName,
                    FileSize = createDto.FileSize,
                    MimeType = createDto.MimeType,
                    OrderNumber = createDto.OrderNumber,
                    Metadata = createDto.Metadata,
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                    UpdatedAt = null
                };

                elements.Add(element);
            }

            _context.PostElements.AddRange(elements);
            await _context.SaveChangesAsync();

            return elements.Select(e => new PostElementDto
            {
                Id = e.Id,
                PostId = e.PostId,
                ElementType = e.ElementType,
                Content = e.Content,
                FilePath = e.FilePath,
                FileName = e.FileName,
                FileSize = e.FileSize,
                MimeType = e.MimeType,
                OrderNumber = e.OrderNumber,
                Metadata = e.Metadata,
                IsActive = e.IsActive,
                CreatedAt = DateTimeOffset.FromUnixTimeSeconds(e.CreatedAt).DateTime,
                UpdatedAt = e.UpdatedAt.HasValue ? DateTimeOffset.FromUnixTimeSeconds(e.UpdatedAt.Value).DateTime : null
            }).ToList();
        }

        public async Task<bool> UpdateElementAsync(string elementId, UpdatePostElementDto updateElementDto, int userId)
        {
            var element = await _context.PostElements.FirstOrDefaultAsync(pe => pe.Id == elementId);

            if (element == null)
                return false;

            element.ElementType = updateElementDto.ElementType;
            element.Content = updateElementDto.Content;
            element.FilePath = updateElementDto.FilePath;
            element.FileName = updateElementDto.FileName;
            element.FileSize = updateElementDto.FileSize;
            element.MimeType = updateElementDto.MimeType;
            element.OrderNumber = updateElementDto.OrderNumber;
            element.Metadata = updateElementDto.Metadata;
            element.IsActive = updateElementDto.IsActive;
            element.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteElementAsync(string elementId, int userId)
        {
            var element = await _context.PostElements.FirstOrDefaultAsync(pe => pe.Id == elementId);

            if (element == null)
                return false;

            // Store file path before deletion for physical file cleanup
            string? filePathToDelete = null;
            if (!string.IsNullOrEmpty(element.FilePath))
            {
                filePathToDelete = element.FilePath;
            }

            // Soft delete
            element.IsActive = false;
            element.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            await _context.SaveChangesAsync();

            // Delete physical file if it exists
            if (!string.IsNullOrEmpty(filePathToDelete))
            {
                await DeletePhysicalFile(filePathToDelete);
            }

            Console.WriteLine($"Successfully deleted element {elementId} with file: {filePathToDelete ?? "no file"}");
            return true;
        }

        public async Task<bool> ReorderElementAsync(string elementId, int newOrderNumber, int userId)
        {
            var element = await _context.PostElements.FirstOrDefaultAsync(pe => pe.Id == elementId);

            if (element == null)
                return false;

            var oldOrderNumber = element.OrderNumber;

            // Get other elements from the same post
            var otherElements = await _context.PostElements
                .Where(pe => pe.PostId == element.PostId && pe.Id != elementId && pe.IsActive)
                .ToListAsync();

            // Update order numbers
            if (newOrderNumber > oldOrderNumber)
            {
                // Moving down: decrease order of elements between old and new position
                foreach (var otherElement in otherElements.Where(e => e.OrderNumber > oldOrderNumber && e.OrderNumber <= newOrderNumber))
                {
                    otherElement.OrderNumber--;
                    otherElement.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                }
            }
            else if (newOrderNumber < oldOrderNumber)
            {
                // Moving up: increase order of elements between new and old position
                foreach (var otherElement in otherElements.Where(e => e.OrderNumber >= newOrderNumber && e.OrderNumber < oldOrderNumber))
                {
                    otherElement.OrderNumber++;
                    otherElement.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                }
            }

            // Update the element's order number
            element.OrderNumber = newOrderNumber;
            element.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteElementsByPostIdAsync(string postId, int userId)
        {
            var elements = await _context.PostElements
                .Where(pe => pe.PostId == postId)
                .ToListAsync();

            if (elements.Count == 0)
                return true; // No elements to delete, consider it successful

            // Collect file paths for physical deletion
            var filesToDelete = elements
                .Where(e => !string.IsNullOrEmpty(e.FilePath))
                .Select(e => e.FilePath!)
                .ToList();

            // Soft delete all elements
            foreach (var element in elements)
            {
                element.IsActive = false;
                element.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            }

            await _context.SaveChangesAsync();

            // Delete physical files
            foreach (var filePath in filesToDelete)
            {
                await DeletePhysicalFile(filePath);
            }

            Console.WriteLine($"Successfully deleted {elements.Count} elements with {filesToDelete.Count} files for post {postId}");
            return true;
        }

        private async Task DeletePhysicalFile(string relativePath)
        {
            await Task.Run(() =>
            {
                try
                {
                    Console.WriteLine($"🗑️ Attempting to delete file: {relativePath}");
                    var fullPath = GetFullMediaPath(relativePath);
                    Console.WriteLine($"🗑️ Full path resolved to: {fullPath}");

                    if (File.Exists(fullPath))
                    {
                        File.Delete(fullPath);
                        Console.WriteLine($"✅ Successfully deleted physical file: {fullPath}");
                    }
                    else
                    {
                        Console.WriteLine($"❌ File not found for deletion: {fullPath}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"⚠️ Warning: Could not delete file {relativePath}: {ex.Message}");
                    Console.WriteLine($"⚠️ Exception details: {ex}");
                    // Continue execution even if file deletion fails
                }
            });
        }

        private string GetFullMediaPath(string relativePath)
        {
            // Convert relative path to full file system path
            // Remove leading slash if present and normalize path
            var cleanPath = relativePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);

            // Construct full path to media directory - files are in Back/Data/media
            var mediaDirectory = Path.Combine(Directory.GetCurrentDirectory(), "Data", "media");
            var fullPath = Path.Combine(mediaDirectory, cleanPath);

            Console.WriteLine($"🔧 Debug - Current directory: {Directory.GetCurrentDirectory()}");
            Console.WriteLine($"🔧 Debug - Media directory: {mediaDirectory}");
            Console.WriteLine($"🔧 Debug - Full resolved path: {fullPath}");

            return fullPath;
        }
    }
}