using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using CentroCultural.Domain.Entities;
using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using CentroCultural.Infrastructure.Data;
using System.Text.RegularExpressions;
using System.Text.Json;

namespace CentroCultural.Application.Services
{
    public class BlogService : IBlogService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BlogService> _logger;

        public BlogService(ApplicationDbContext context, ILogger<BlogService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<BlogPostPagedResultDto> GetBlogPostsAsync(BlogPostSearchDto searchDto)
        {
            var query = _context.BlogPost
                .Include(p => p.Elements)
                .Include(p => p.Author)
                .AsQueryable();

            // Apply filters
            if (searchDto.IsPublished.HasValue)
                query = query.Where(p => p.IsPublished == searchDto.IsPublished.Value);

            if (searchDto.IsFeatured.HasValue)
                query = query.Where(p => p.IsFeatured == searchDto.IsFeatured.Value);

            if (!string.IsNullOrEmpty(searchDto.SearchTerm))
            {
                var searchTerm = searchDto.SearchTerm.ToLower();
                query = query.Where(p => p.Title.ToLower().Contains(searchTerm) ||
                                       (p.Subtitle != null && p.Subtitle.ToLower().Contains(searchTerm)) ||
                                       p.Elements.Any(e => e.Content != null && e.Content.ToLower().Contains(searchTerm)));
            }

            // Apply sorting
            query = searchDto.SortBy?.ToLower() switch
            {
                "created_asc" => query.OrderBy(p => p.CreatedAt),
                "title_asc" => query.OrderBy(p => p.Title),
                "views_desc" => query.OrderByDescending(p => p.Views),
                _ => query.OrderByDescending(p => p.CreatedAt) // default: created_desc
            };

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)searchDto.PageSize);

            // Fetch the posts with basic data first
            var postEntities = await query
                .Skip((searchDto.Page - 1) * searchDto.PageSize)
                .Take(searchDto.PageSize)
                .ToListAsync();

            // Map to DTOs with featured image resolution
            var authorIds = postEntities
                .Select(p => p.AuthorId)
                .Distinct()
                .ToList();

            var authorNames = await GetAuthorNamesAsync(authorIds);

            var posts = postEntities.Select(p => new BlogPostSummaryDto
            {
                Id = p.Id,
                Title = p.Title,
                Summary = p.Subtitle,
                Slug = p.Slug,
                IsPublished = p.IsPublished,
                IsFeatured = p.IsFeatured,
                Views = p.Views,
                CreatedAt = p.CreatedAt,
                PublishedAt = p.PublishedAt,
                AuthorName = ResolveAuthorName(p, authorNames),
                FeaturedImagePath = p.Elements?
                    .Where(e => e.ElementType == "image" && e.OrderNumber == 0)
                    .FirstOrDefault()?.FilePath,
                Status = p.Status
            }).ToList();

            return new BlogPostPagedResultDto
            {
                Posts = posts,
                TotalCount = totalCount,
                Page = searchDto.Page,
                PageSize = searchDto.PageSize,
                TotalPages = totalPages,
                HasNextPage = searchDto.Page < totalPages,
                HasPreviousPage = searchDto.Page > 1
            };
        }

        public async Task<BlogPostDto?> GetBlogPostByIdAsync(string id)
        {
            var post = await _context.BlogPost
                .Include(p => p.Author)
                .Include(p => p.Elements.OrderBy(e => e.OrderNumber))
                .FirstOrDefaultAsync(p => p.Id == id);

            if (post == null)
                return null;

            var authorName = await GetAuthorNameAsync(post.AuthorId);
            return MapToBlogPostDto(post, authorName);
        }

        public async Task<BlogPostDto?> GetBlogPostBySlugAsync(string slug)
        {
            var post = await _context.BlogPost
                .Include(p => p.Author)
                .Include(p => p.Elements.OrderBy(e => e.OrderNumber))
                .FirstOrDefaultAsync(p => p.Slug == slug && p.IsPublished);

            if (post == null)
                return null;

            var authorName = await GetAuthorNameAsync(post.AuthorId);
            return MapToBlogPostDto(post, authorName);
        }

        public async Task<BlogPostDto?> GetBlogPostBySlugAsync(string slug, int? currentUserId)
        {
            var query = _context.BlogPost
                .Include(p => p.Author)
                .Include(p => p.Elements.OrderBy(e => e.OrderNumber))
                .Where(p => p.Slug == slug);

            if (currentUserId.HasValue)
            {
                query = query.Where(p => p.IsPublished || p.AuthorId == currentUserId.Value);
            }
            else
            {
                query = query.Where(p => p.IsPublished);
            }

            var post = await query.FirstOrDefaultAsync();

            if (post == null)
                return null;

            var authorName = await GetAuthorNameAsync(post.AuthorId);
            return MapToBlogPostDto(post, authorName);
        }

        public async Task<BlogPostDto> CreateBlogPostAsync(CreateBlogPostDto createDto, int authorId)
        {
            // Validate author exists
            var author = await _context.Usuario.FirstOrDefaultAsync(u => u.IdUsuario == authorId);
            if (author == null)
                throw new ArgumentException("Author not found");

            // Generate unique slug if not provided or validate provided slug
            var slug = string.IsNullOrEmpty(createDto.Slug)
                ? await GenerateUniqueSlugAsync(createDto.Title)
                : createDto.Slug;

            if (!await IsSlugAvailableAsync(slug))
                throw new ArgumentException("El slug ya está en uso");

            var postId = Guid.NewGuid().ToString();
            var currentTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            var blogPost = new BlogPost
            {
                Id = postId,
                Title = createDto.Title,
                Subtitle = createDto.Subtitle,
                Slug = slug,
                IsPublished = createDto.IsPublished,
                IsFeatured = createDto.IsFeatured,
                OrderNumber = createDto.OrderNumber,
                IsActive = createDto.IsActive,
                AuthorId = author.IdUsuario,
                CategoryId = createDto.CategoryId,
                Tags = createDto.Tags.Any() ? JsonSerializer.Serialize(createDto.Tags) : null,
                Status = string.IsNullOrWhiteSpace(createDto.Status) ? "draft" : createDto.Status!,
                CreatedAt = currentTime
            };

            if (createDto.IsPublished)
                blogPost.PublishedAt = currentTime;

            _context.BlogPost.Add(blogPost);

            // Add elements
            foreach (var elementDto in createDto.Elements)
            {
                var element = new BlogPostElement
                {
                    Id = Guid.NewGuid().ToString(),
                    BlogPostId = postId,
                    ElementType = elementDto.ElementType,
                    Content = elementDto.Content,
                    FilePath = elementDto.FilePath,
                    FileName = elementDto.FileName,
                    FileSize = elementDto.FileSize,
                    MimeType = elementDto.MimeType,
                    OrderNumber = elementDto.OrderNumber,
                    Metadata = elementDto.Metadata,
                    IsActive = elementDto.IsActive,
                    CreatedAt = currentTime
                };

                _context.BlogPostElement.Add(element);
            }

            await _context.SaveChangesAsync();

            // Return the created post
            return await GetBlogPostByIdAsync(postId) ?? throw new Exception("Failed to retrieve created post");
        }

        public async Task<BlogPostDto?> UpdateBlogPostAsync(string id, UpdateBlogPostDto updateDto, int userId)
        {
            var post = await _context.BlogPost
                .Include(p => p.Author)
                .Include(p => p.Elements)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (post == null)
                return null;

            // Check permissions - author or admin
            var user = await _context.Usuario.FirstOrDefaultAsync(u => u.IdUsuario == userId);
            if (user == null || (post.AuthorId != userId && user.RoleString != "administrador"))
                throw new UnauthorizedAccessException("No tienes permisos para editar este post");

            // Validate slug uniqueness if changed
            if (post.Slug != updateDto.Slug && !await IsSlugAvailableAsync(updateDto.Slug, id))
                throw new ArgumentException("El slug ya está en uso");

            // Track if publication status changed
            var wasPublished = post.IsPublished;
            var willBePublished = updateDto.IsPublished;
            var currentTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            post.Title = updateDto.Title;
            post.Subtitle = updateDto.Subtitle;
            post.Slug = updateDto.Slug;
            post.IsPublished = updateDto.IsPublished;
            post.IsFeatured = updateDto.IsFeatured;
            post.OrderNumber = updateDto.OrderNumber;
            post.IsActive = updateDto.IsActive;
            post.CategoryId = updateDto.CategoryId;
            post.Tags = updateDto.Tags.Any() ? JsonSerializer.Serialize(updateDto.Tags) : null;
            post.Status = string.IsNullOrWhiteSpace(updateDto.Status) ? post.Status : updateDto.Status!;
            post.UpdatedAt = currentTime;

            // Set published date if publishing for first time
            if (!wasPublished && willBePublished)
                post.PublishedAt = currentTime;
            else if (wasPublished && !willBePublished)
                post.PublishedAt = null;

            // Update elements - collect file paths for cleanup before removing
            var oldFilesToDelete = new List<string>();
            foreach (var oldElement in post.Elements)
            {
                if (!string.IsNullOrEmpty(oldElement.FilePath))
                {
                    oldFilesToDelete.Add(oldElement.FilePath);
                }
            }

            // Remove existing elements from database
            _context.BlogPostElement.RemoveRange(post.Elements);

            foreach (var elementDto in updateDto.Elements)
            {
                var element = new BlogPostElement
                {
                    Id = Guid.NewGuid().ToString(),
                    BlogPostId = id,
                    ElementType = elementDto.ElementType,
                    Content = elementDto.Content,
                    FilePath = elementDto.FilePath,
                    FileName = elementDto.FileName,
                    FileSize = elementDto.FileSize,
                    MimeType = elementDto.MimeType,
                    OrderNumber = elementDto.OrderNumber,
                    Metadata = elementDto.Metadata,
                    IsActive = elementDto.IsActive,
                    CreatedAt = currentTime
                };

                _context.BlogPostElement.Add(element);
            }

            await _context.SaveChangesAsync();

            // Delete old files that are no longer used (not in the new elements)
            var newFilePaths = updateDto.Elements
                .Where(e => !string.IsNullOrEmpty(e.FilePath))
                .Select(e => e.FilePath!)
                .ToHashSet();

            var filesToDelete = oldFilesToDelete
                .Where(oldPath => !newFilePaths.Contains(oldPath))
                .ToList();

            if (filesToDelete.Any())
            {
                _logger.LogInformation($"🧹 Cleaning up {filesToDelete.Count} old file(s) after blog post update");
                await DeleteMultiMediaFiles(filesToDelete);
            }

            return await GetBlogPostByIdAsync(id);
        }

        public async Task<bool> DeleteBlogPostAsync(string id, int userId)
        {
            var post = await _context.BlogPost
                .Include(p => p.Elements)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (post == null)
                return false;

            // Check permissions
            var user = await _context.Usuario.FirstOrDefaultAsync(u => u.IdUsuario == userId);
            if (user == null || (post.AuthorId != userId && user.RoleString != "administrador"))
                throw new UnauthorizedAccessException("No tienes permisos para eliminar este post");

            // Collect all media file paths before deletion
            var mediaFilesToDelete = new List<string>();
            foreach (var element in post.Elements)
            {
                if (!string.IsNullOrEmpty(element.FilePath))
                {
                    mediaFilesToDelete.Add(element.FilePath);
                    _logger.LogInformation($"Marcando archivo para eliminar: {element.FilePath}");
                }
            }

            // Remove elements first
            _context.BlogPostElement.RemoveRange(post.Elements);
            _context.BlogPost.Remove(post);

            await _context.SaveChangesAsync();

            // Delete physical files after successful DB commit
            await DeleteMultiMediaFiles(mediaFilesToDelete);

            return true;
        }

        public async Task<bool> PublishBlogPostAsync(string id, int userId)
        {
            var post = await _context.BlogPost.FirstOrDefaultAsync(p => p.Id == id);
            if (post == null) return false;

            // Check permissions
            var user = await _context.Usuario.FirstOrDefaultAsync(u => u.IdUsuario == userId);
            if (user == null || (post.AuthorId != userId && user.RoleString != "administrador"))
                throw new UnauthorizedAccessException("No tienes permisos para publicar este post");

            var currentTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            post.IsPublished = true;
            post.PublishedAt = currentTime;
            post.UpdatedAt = currentTime;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UnpublishBlogPostAsync(string id, int userId)
        {
            var post = await _context.BlogPost.FirstOrDefaultAsync(p => p.Id == id);
            if (post == null) return false;

            // Check permissions
            var user = await _context.Usuario.FirstOrDefaultAsync(u => u.IdUsuario == userId);
            if (user == null || (post.AuthorId != userId && user.RoleString != "administrador"))
                throw new UnauthorizedAccessException("No tienes permisos para despublicar este post");

            post.IsPublished = false;
            post.PublishedAt = null;
            post.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> IncrementViewsAsync(string id)
        {
            var post = await _context.BlogPost.FirstOrDefaultAsync(p => p.Id == id && p.IsPublished);
            if (post == null) return false;

            post.Views++;
            await _context.SaveChangesAsync();
            return true;
        }

        // Featured and Popular Posts

        public async Task<IEnumerable<BlogPostSummaryDto>> GetFeaturedPostsAsync(int count = 5)
        {
            var postEntities = await _context.BlogPost
                .Include(p => p.Elements)
                .Where(p => p.IsPublished && p.IsFeatured)
                .OrderByDescending(p => p.PublishedAt)
                .Take(count)
                .ToListAsync();

            var authorIds = postEntities
                .Select(p => p.AuthorId)
                .Distinct()
                .ToList();

            var authorNames = await GetAuthorNamesAsync(authorIds);

            var posts = postEntities.Select(p => new BlogPostSummaryDto
            {
                Id = p.Id,
                Title = p.Title,
                Summary = p.Subtitle,
                Slug = p.Slug,
                IsPublished = p.IsPublished,
                IsFeatured = p.IsFeatured,
                Views = p.Views,
                CreatedAt = p.CreatedAt,
                PublishedAt = p.PublishedAt,
                AuthorName = ResolveAuthorName(p, authorNames),
                FeaturedImagePath = p.Elements?
                    .Where(e => e.ElementType == "image" && e.OrderNumber == 0)
                    .FirstOrDefault()?.FilePath,
                Status = p.Status
            }).ToList();

            return posts;
        }

        public async Task<IEnumerable<BlogPostSummaryDto>> GetPopularPostsAsync(int count = 10)
        {
            var postEntities = await _context.BlogPost
                .Include(p => p.Elements)
                .Where(p => p.IsPublished)
                .OrderByDescending(p => p.Views)
                .Take(count)
                .ToListAsync();

            var authorIds = postEntities
                .Select(p => p.AuthorId)
                .Distinct()
                .ToList();

            var authorNames = await GetAuthorNamesAsync(authorIds);

            var posts = postEntities.Select(p => new BlogPostSummaryDto
            {
                Id = p.Id,
                Title = p.Title,
                Summary = p.Subtitle,
                Slug = p.Slug,
                IsPublished = p.IsPublished,
                IsFeatured = p.IsFeatured,
                Views = p.Views,
                CreatedAt = p.CreatedAt,
                PublishedAt = p.PublishedAt,
                AuthorName = ResolveAuthorName(p, authorNames),
                FeaturedImagePath = p.Elements?
                    .Where(e => e.ElementType == "image" && e.OrderNumber == 0)
                    .FirstOrDefault()?.FilePath,
                Status = p.Status
            }).ToList();

            return posts;
        }

        public async Task<IEnumerable<BlogPostSummaryDto>> GetRecentPostsAsync(int count = 10)
        {
            var postEntities = await _context.BlogPost
                .Include(p => p.Elements)
                .Where(p => p.IsPublished)
                .OrderByDescending(p => p.PublishedAt)
                .Take(count)
                .ToListAsync();

            var authorIds = postEntities
                .Select(p => p.AuthorId)
                .Distinct()
                .ToList();

            var authorNames = await GetAuthorNamesAsync(authorIds);

            var posts = postEntities.Select(p => new BlogPostSummaryDto
            {
                Id = p.Id,
                Title = p.Title,
                Summary = p.Subtitle,
                Slug = p.Slug,
                IsPublished = p.IsPublished,
                IsFeatured = p.IsFeatured,
                Views = p.Views,
                CreatedAt = p.CreatedAt,
                PublishedAt = p.PublishedAt,
                AuthorName = ResolveAuthorName(p, authorNames),
                FeaturedImagePath = p.Elements?
                    .Where(e => e.ElementType == "image" && e.OrderNumber == 0)
                    .FirstOrDefault()?.FilePath,
                Status = p.Status
            }).ToList();

            return posts;
        }

        public async Task<object> GetBlogStatisticsAsync()
        {
            var totalPosts = await _context.BlogPost.CountAsync();
            var publishedPosts = await _context.BlogPost.CountAsync(p => p.IsPublished);
            var draftPosts = totalPosts - publishedPosts;
            var totalViews = await _context.BlogPost.SumAsync(p => p.Views);

            return new
            {
                TotalPosts = totalPosts,
                PublishedPosts = publishedPosts,
                DraftPosts = draftPosts,
                TotalViews = totalViews
            };
        }

        // Slug utilities

        public async Task<string> GenerateUniqueSlugAsync(string title, string? excludePostId = null)
        {
            var baseSlug = GenerateSlugFromTitle(title);
            var slug = baseSlug;
            var counter = 1;

            while (!await IsSlugAvailableAsync(slug, excludePostId))
            {
                slug = $"{baseSlug}-{counter}";
                counter++;
            }

            return slug;
        }

        public async Task<bool> IsSlugAvailableAsync(string slug, string? excludePostId = null)
        {
            var query = _context.BlogPost.Where(p => p.Slug == slug);

            if (excludePostId != null)
                query = query.Where(p => p.Id != excludePostId);

            return !await query.AnyAsync();
        }

        private static string GenerateSlugFromTitle(string title)
        {
            // Convert to lowercase and remove special characters
            var slug = title.ToLowerInvariant();

            // Replace spaces and special characters with hyphens
            slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
            slug = Regex.Replace(slug, @"\s+", "-").Trim('-');

            // Remove consecutive hyphens
            slug = Regex.Replace(slug, @"-+", "-");

            return slug;
        }

        private BlogPostDto MapToBlogPostDto(BlogPost post, string? authorNameOverride = null)
        {
            var tags = new List<string>();
            if (!string.IsNullOrEmpty(post.Tags))
            {
                try
                {
                    tags = JsonSerializer.Deserialize<List<string>>(post.Tags) ?? new List<string>();
                }
                catch
                {
                    // Fallback to splitting by comma if JSON deserialization fails
                    tags = post.Tags.Split(',').Select(t => t.Trim()).ToList();
                }
            }

            return new BlogPostDto
            {
                Id = post.Id,
                Title = post.Title,
                Subtitle = post.Subtitle,
                Slug = post.Slug,
                IsPublished = post.IsPublished,
                IsFeatured = post.IsFeatured,
                Views = post.Views,
                OrderNumber = post.OrderNumber,
                IsActive = post.IsActive,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                PublishedAt = post.PublishedAt,
                AuthorId = post.AuthorId,
                AuthorName = ResolveAuthorName(post, authorNameOverride),
                CategoryId = post.CategoryId,
                Tags = tags,
                Status = post.Status,
                Elements = post.Elements.OrderBy(e => e.OrderNumber).Select(e => new BlogPostElementDto
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
                }).ToList()
            };
        }

        private string ResolveAuthorName(BlogPost post, IDictionary<int, string> authorNames)
        {
            if (post.Author != null)
            {
                var displayName = BuildAuthorDisplayName(post.Author.NombreUsuario, post.Author.Nombre, post.Author.Apellido);
                if (!string.IsNullOrWhiteSpace(displayName))
                {
                    return displayName;
                }
            }

            return ResolveAuthorName(post.AuthorId, authorNames);
        }

        private string ResolveAuthorName(BlogPost post, string? authorNameOverride)
        {
            if (!string.IsNullOrWhiteSpace(authorNameOverride))
            {
                return authorNameOverride.Trim();
            }

            if (post.Author != null)
            {
                var displayName = BuildAuthorDisplayName(post.Author.NombreUsuario, post.Author.Nombre, post.Author.Apellido);
                if (!string.IsNullOrWhiteSpace(displayName))
                {
                    return displayName;
                }
            }

            return ResolveAuthorName(post.AuthorId, new Dictionary<int, string>());
        }

        private async Task<Dictionary<int, string>> GetAuthorNamesAsync(IEnumerable<int> authorIds)
        {
            var distinctIds = authorIds
                .Where(id => id > 0)
                .Distinct()
                .ToList();

            var authorNames = new Dictionary<int, string>();

            if (!distinctIds.Any())
            {
                return authorNames;
            }

            var authors = await _context.Usuario
                .AsNoTracking()
                .Where(u => distinctIds.Contains(u.IdUsuario))
                .Select(u => new { u.IdUsuario, u.NombreUsuario, u.Nombre, u.Apellido })
                .ToListAsync();

            foreach (var author in authors)
            {
                authorNames[author.IdUsuario] = BuildAuthorDisplayName(author.NombreUsuario, author.Nombre, author.Apellido);
            }

            return authorNames;
        }

        private async Task<string> GetAuthorNameAsync(int authorId)
        {
            if (authorId <= 0)
            {
                return "Autor";
            }

            var names = await GetAuthorNamesAsync(new[] { authorId });
            return ResolveAuthorName(authorId, names);
        }

        private string ResolveAuthorName(int authorId, IDictionary<int, string> authorNames)
        {
            if (authorId <= 0)
            {
                return "Autor";
            }

            if (authorNames.TryGetValue(authorId, out var name) && !string.IsNullOrWhiteSpace(name))
            {
                return name;
            }

            var fallbackAuthor = _context.Usuario
                .AsNoTracking()
                .Where(u => u.IdUsuario == authorId)
                .Select(u => new { u.NombreUsuario, u.Nombre, u.Apellido })
                .FirstOrDefault();

            if (fallbackAuthor != null)
            {
                var displayName = BuildAuthorDisplayName(fallbackAuthor.NombreUsuario, fallbackAuthor.Nombre, fallbackAuthor.Apellido);
                if (!string.IsNullOrWhiteSpace(displayName))
                {
                    return displayName;
                }
            }

            return "Autor";
        }

        private static string BuildAuthorDisplayName(string? username, string? firstName, string? lastName)
        {
            var nameParts = new[] { firstName, lastName }
                .Where(part => !string.IsNullOrWhiteSpace(part))
                .Select(part => part!.Trim())
                .ToArray();

            if (nameParts.Length > 0)
            {
                return string.Join(" ", nameParts);
            }

            if (!string.IsNullOrWhiteSpace(username))
            {
                return username.Trim();
            }

            return string.Empty;
        }

        // File cleanup methods
        private async Task DeleteMultiMediaFiles(List<string> filePaths)
        {
            foreach (var filePath in filePaths.Where(f => !string.IsNullOrEmpty(f)))
            {
                try
                {
                    var fullPath = GetFullMediaPath(filePath);
                    if (File.Exists(fullPath))
                    {
                        File.Delete(fullPath);
                        _logger.LogInformation($"🗑️ Archivo eliminado: {fullPath}");
                    }
                    else
                    {
                        _logger.LogWarning($"⚠️ Archivo no encontrado (ya eliminado o nunca existió): {fullPath}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"⚠️ Error al eliminar archivo {filePath}: {ex.Message}");
                    // Continue with other files even if one fails
                }
            }

            await Task.CompletedTask; // Maintain async signature for consistency
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
