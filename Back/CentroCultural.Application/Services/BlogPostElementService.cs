using Microsoft.EntityFrameworkCore;
using CentroCultural.Infrastructure.Data;
using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using CentroCultural.Domain.Entities;
using System.IO;

namespace CentroCultural.Application.Services
{
    public class BlogPostElementService : IBlogPostElementService
    {
        private readonly ApplicationDbContext _context;

        public BlogPostElementService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<BlogPostElementDto>> GetElementsByBlogPostIdAsync(string blogPostId)
        {
            var elements = await _context.BlogPostElement
                .Where(pe => pe.BlogPostId == blogPostId && pe.IsActive)
                .OrderBy(pe => pe.OrderNumber)
                .Select(pe => new BlogPostElementDto
                {
                    Id = pe.Id,
                    BlogPostId = pe.BlogPostId,
                    ElementType = pe.ElementType,
                    Content = pe.Content,
                    FilePath = pe.FilePath,
                    FileName = pe.FileName,
                    FileSize = pe.FileSize,
                    MimeType = pe.MimeType,
                    OrderNumber = pe.OrderNumber,
                    Metadata = pe.Metadata,
                    IsActive = pe.IsActive,
                    CreatedAt = pe.CreatedAt,
                    UpdatedAt = pe.UpdatedAt
                })
                .ToListAsync();

            return elements;
        }

        public async Task<BlogPostElementDto?> GetElementByIdAsync(string elementId)
        {
            var element = await _context.BlogPostElement
                .Where(pe => pe.Id == elementId && pe.IsActive)
                .Select(pe => new BlogPostElementDto
                {
                    Id = pe.Id,
                    BlogPostId = pe.BlogPostId,
                    ElementType = pe.ElementType,
                    Content = pe.Content,
                    FilePath = pe.FilePath,
                    FileName = pe.FileName,
                    FileSize = pe.FileSize,
                    MimeType = pe.MimeType,
                    OrderNumber = pe.OrderNumber,
                    Metadata = pe.Metadata,
                    IsActive = pe.IsActive,
                    CreatedAt = pe.CreatedAt,
                    UpdatedAt = pe.UpdatedAt
                })
                .FirstOrDefaultAsync();

            return element;
        }

        public async Task<BlogPostElementDto> CreateElementAsync(CreateBlogPostElementDto createElementDto, int userId)
        {
            var element = new BlogPostElement
            {
                Id = Guid.NewGuid().ToString(),
                BlogPostId = createElementDto.BlogPostId,
                ElementType = createElementDto.ElementType,
                Content = createElementDto.Content,
                FilePath = createElementDto.FilePath,
                FileName = createElementDto.FileName,
                FileSize = createElementDto.FileSize,
                MimeType = createElementDto.MimeType,
                OrderNumber = createElementDto.OrderNumber,
                Metadata = createElementDto.Metadata,
                IsActive = createElementDto.IsActive,
                CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                UpdatedAt = null
            };

            _context.BlogPostElement.Add(element);
            await _context.SaveChangesAsync();

            return new BlogPostElementDto
            {
                Id = element.Id,
                BlogPostId = element.BlogPostId,
                ElementType = element.ElementType,
                Content = element.Content,
                FilePath = element.FilePath,
                FileName = element.FileName,
                FileSize = element.FileSize,
                MimeType = element.MimeType,
                OrderNumber = element.OrderNumber,
                Metadata = element.Metadata,
                IsActive = element.IsActive,
                CreatedAt = element.CreatedAt,
                UpdatedAt = element.UpdatedAt
            };
        }

        public async Task<BlogPostElementDto> UpdateElementAsync(string elementId, UpdateBlogPostElementDto updateElementDto, int userId)
        {
            var element = await _context.BlogPostElement
                .FirstOrDefaultAsync(pe => pe.Id == elementId && pe.IsActive);

            if (element == null)
            {
                throw new KeyNotFoundException($"Element with ID {elementId} not found");
            }

            // Update only provided fields (skip empty strings to preserve existing values)
            if (updateElementDto.ElementType != null) element.ElementType = updateElementDto.ElementType;
            if (updateElementDto.Content != null) element.Content = updateElementDto.Content;
            if (!string.IsNullOrEmpty(updateElementDto.FilePath)) element.FilePath = updateElementDto.FilePath;
            if (!string.IsNullOrEmpty(updateElementDto.FileName)) element.FileName = updateElementDto.FileName;
            if (updateElementDto.FileSize.HasValue) element.FileSize = updateElementDto.FileSize;
            if (!string.IsNullOrEmpty(updateElementDto.MimeType)) element.MimeType = updateElementDto.MimeType;
            if (updateElementDto.OrderNumber.HasValue) element.OrderNumber = updateElementDto.OrderNumber.Value;
            if (updateElementDto.Metadata != null) element.Metadata = updateElementDto.Metadata;
            if (updateElementDto.IsActive.HasValue) element.IsActive = updateElementDto.IsActive.Value;

            element.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            await _context.SaveChangesAsync();

            return new BlogPostElementDto
            {
                Id = element.Id,
                BlogPostId = element.BlogPostId,
                ElementType = element.ElementType,
                Content = element.Content,
                FilePath = element.FilePath,
                FileName = element.FileName,
                FileSize = element.FileSize,
                MimeType = element.MimeType,
                OrderNumber = element.OrderNumber,
                Metadata = element.Metadata,
                IsActive = element.IsActive,
                CreatedAt = element.CreatedAt,
                UpdatedAt = element.UpdatedAt
            };
        }

        public async Task<bool> DeleteElementAsync(string elementId, int userId)
        {
            var element = await _context.BlogPostElement
                .FirstOrDefaultAsync(pe => pe.Id == elementId);

            if (element == null)
            {
                return false;
            }

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

            return true;
        }

        public async Task<IEnumerable<BlogPostElementDto>> CreateElementsInBatchAsync(string blogPostId, IEnumerable<CreateBlogPostElementDto> elements, int userId)
        {
            var createdElements = new List<BlogPostElement>();

            foreach (var elementDto in elements)
            {
                var element = new BlogPostElement
                {
                    Id = Guid.NewGuid().ToString(),
                    BlogPostId = blogPostId,
                    ElementType = elementDto.ElementType,
                    Content = elementDto.Content,
                    FilePath = elementDto.FilePath,
                    FileName = elementDto.FileName,
                    FileSize = elementDto.FileSize,
                    MimeType = elementDto.MimeType,
                    OrderNumber = elementDto.OrderNumber,
                    Metadata = elementDto.Metadata,
                    IsActive = elementDto.IsActive,
                    CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                    UpdatedAt = null
                };

                createdElements.Add(element);
            }

            _context.BlogPostElement.AddRange(createdElements);
            await _context.SaveChangesAsync();

            return createdElements.Select(e => new BlogPostElementDto
            {
                Id = e.Id,
                BlogPostId = e.BlogPostId,
                ElementType = e.ElementType,
                Content = e.Content,
                FilePath = e.FilePath,
                FileName = e.FileName,
                FileSize = e.FileSize,
                MimeType = e.MimeType,
                OrderNumber = e.OrderNumber,
                Metadata = e.Metadata,
                IsActive = e.IsActive,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            });
        }

        public async Task<bool> ReorderElementAsync(string elementId, int newOrderNumber, int userId)
        {
            var element = await _context.BlogPostElement
                .FirstOrDefaultAsync(pe => pe.Id == elementId && pe.IsActive);

            if (element == null)
            {
                return false;
            }

            element.OrderNumber = newOrderNumber;
            element.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task DeleteElementsByBlogPostIdAsync(string blogPostId, int userId)
        {
            var elements = await _context.BlogPostElement
                .Where(pe => pe.BlogPostId == blogPostId)
                .ToListAsync();

            // Collect file paths to delete
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
        }

        private async Task DeletePhysicalFile(string relativePath)
        {
            await Task.Run(() =>
            {
                try
                {
                    var fullPath = GetFullMediaPath(relativePath);

                    if (File.Exists(fullPath))
                    {
                        File.Delete(fullPath);
                    }
                }
                catch (Exception)
                {
                    // Continue execution even if file deletion fails
                }
            });
        }

        private string GetFullMediaPath(string relativePath)
        {
            // Clean the path
            var cleanPath = relativePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);

            // Remove 'media/' prefix if present
            if (cleanPath.StartsWith("media" + Path.DirectorySeparatorChar))
            {
                cleanPath = cleanPath.Substring(("media" + Path.DirectorySeparatorChar).Length);
            }

            // Build full path: Back/Data/media/{relativePath}
            var mediaDirectory = Path.Combine(Directory.GetCurrentDirectory(), "Data", "media");
            var fullPath = Path.Combine(mediaDirectory, cleanPath);

            return fullPath;
        }
    }
}
