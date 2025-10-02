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

            // Update only provided fields
            if (updateElementDto.ElementType != null) element.ElementType = updateElementDto.ElementType;
            if (updateElementDto.Content != null) element.Content = updateElementDto.Content;
            if (updateElementDto.FilePath != null) element.FilePath = updateElementDto.FilePath;
            if (updateElementDto.FileName != null) element.FileName = updateElementDto.FileName;
            if (updateElementDto.FileSize.HasValue) element.FileSize = updateElementDto.FileSize;
            if (updateElementDto.MimeType != null) element.MimeType = updateElementDto.MimeType;
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

            Console.WriteLine($"Successfully deleted blog element {elementId} with file: {filePathToDelete ?? "no file"}");
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

            Console.WriteLine($"Successfully deleted {elements.Count} blog elements with {filesToDelete.Count} files for post {blogPostId}");
        }

        private async Task DeletePhysicalFile(string relativePath)
        {
            await Task.Run(() =>
            {
                try
                {
                    Console.WriteLine($"🗑️ Attempting to delete blog file: {relativePath}");
                    var fullPath = GetFullMediaPath(relativePath);
                    Console.WriteLine($"🗑️ Full path resolved to: {fullPath}");

                    if (File.Exists(fullPath))
                    {
                        File.Delete(fullPath);
                        Console.WriteLine($"✅ Successfully deleted physical blog file: {fullPath}");
                    }
                    else
                    {
                        Console.WriteLine($"❌ Blog file not found for deletion: {fullPath}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"⚠️ Warning: Could not delete blog file {relativePath}: {ex.Message}");
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

            Console.WriteLine($"🔧 Debug - Blog media path: {fullPath}");
            return fullPath;
        }
    }
}
