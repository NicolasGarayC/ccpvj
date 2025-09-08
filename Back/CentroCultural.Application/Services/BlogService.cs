using Microsoft.EntityFrameworkCore;
using CentroCultural.Domain.Entities;
using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using CentroCultural.Infrastructure.Data;
using System.Text.RegularExpressions;

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
                .Include(p => p.Author)
                .Include(p => p.Category)
                .AsQueryable();

            // Apply filters
            if (searchDto.IsPublished.HasValue)
                query = query.Where(p => p.IsPublished == searchDto.IsPublished.Value);

            if (searchDto.IsFeatured.HasValue)
                query = query.Where(p => p.IsFeatured == searchDto.IsFeatured.Value);

            if (searchDto.CategoryId.HasValue)
                query = query.Where(p => p.CategoryId == searchDto.CategoryId.Value);

            if (!string.IsNullOrEmpty(searchDto.SearchTerm))
            {
                var searchTerm = searchDto.SearchTerm.ToLower();
                query = query.Where(p => p.Title.ToLower().Contains(searchTerm) ||
                                       p.Content.ToLower().Contains(searchTerm) ||
                                       (p.Summary != null && p.Summary.ToLower().Contains(searchTerm)));
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

            var posts = await query
                .Skip((searchDto.Page - 1) * searchDto.PageSize)
                .Take(searchDto.PageSize)
                .Select(p => new BlogPostSummaryDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Summary = p.Summary,
                    Slug = p.Slug,
                    IsPublished = p.IsPublished,
                    IsFeatured = p.IsFeatured,
                    Views = p.Views,
                    CreatedAt = p.CreatedAt,
                    PublishedAt = p.PublishedAt,
                    AuthorName = $"{p.Author.Nombre} {p.Author.Apellido}".Trim(),
                    CategoryName = p.Category != null ? p.Category.Name : null,
                    CategoryColor = p.Category != null ? p.Category.Color : null,
                    FeaturedImagePath = p.FeaturedImagePath
                })
                .ToListAsync();

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

        public async Task<BlogPostDto?> GetBlogPostByIdAsync(Guid id)
        {
            var post = await _context.BlogPost
                .Include(p => p.Author)
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (post == null)
                return null;

            return new BlogPostDto
            {
                Id = post.Id,
                Title = post.Title,
                Content = post.Content,
                Summary = post.Summary,
                Slug = post.Slug,
                IsPublished = post.IsPublished,
                IsFeatured = post.IsFeatured,
                Views = post.Views,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                PublishedAt = post.PublishedAt,
                AuthorId = post.AuthorId,
                AuthorName = $"{post.Author.Nombre} {post.Author.Apellido}".Trim(),
                CategoryId = post.CategoryId,
                CategoryName = post.Category?.Name,
                FeaturedImagePath = post.FeaturedImagePath,
                PdfPath = post.PdfPath,
                VideoPath = post.VideoPath
            };
        }

        public async Task<BlogPostDto?> GetBlogPostBySlugAsync(string slug)
        {
            var post = await _context.BlogPost
                .Include(p => p.Author)
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Slug == slug && p.IsPublished);

            if (post == null)
                return null;

            return new BlogPostDto
            {
                Id = post.Id,
                Title = post.Title,
                Content = post.Content,
                Summary = post.Summary,
                Slug = post.Slug,
                IsPublished = post.IsPublished,
                IsFeatured = post.IsFeatured,
                Views = post.Views,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                PublishedAt = post.PublishedAt,
                AuthorId = post.AuthorId,
                AuthorName = $"{post.Author.Nombre} {post.Author.Apellido}".Trim(),
                CategoryId = post.CategoryId,
                CategoryName = post.Category?.Name,
                FeaturedImagePath = post.FeaturedImagePath,
                PdfPath = post.PdfPath,
                VideoPath = post.VideoPath
            };
        }

        public async Task<BlogPostDto> CreateBlogPostAsync(CreateBlogPostDto createDto, string authorId)
        {
            // Validate author exists
            var author = await _context.Usuario.FirstOrDefaultAsync(u => u.IdUsuario.ToString() == authorId);
            if (author == null)
                throw new ArgumentException("Author not found");

            // Generate unique slug if not provided or validate provided slug
            var slug = string.IsNullOrEmpty(createDto.Slug) 
                ? await GenerateUniqueSlugAsync(createDto.Title)
                : createDto.Slug;

            if (!await IsSlugAvailableAsync(slug))
                throw new ArgumentException("El slug ya está en uso");

            var blogPost = new BlogPost
            {
                Id = Guid.NewGuid(),
                Title = createDto.Title,
                Content = createDto.Content,
                Summary = createDto.Summary,
                Slug = slug,
                IsPublished = createDto.IsPublished,
                IsFeatured = createDto.IsFeatured,
                AuthorId = author.IdUsuario,
                CategoryId = createDto.CategoryId,
                FeaturedImagePath = createDto.FeaturedImagePath,
                PdfPath = createDto.PdfPath,
                VideoPath = createDto.VideoPath,
                CreatedAt = DateTime.UtcNow
            };

            if (createDto.IsPublished)
                blogPost.PublishedAt = DateTime.UtcNow;

            _context.BlogPost.Add(blogPost);
            await _context.SaveChangesAsync();

            // Return the created post
            return await GetBlogPostByIdAsync(blogPost.Id) ?? throw new Exception("Failed to retrieve created post");
        }

        public async Task<BlogPostDto?> UpdateBlogPostAsync(Guid id, UpdateBlogPostDto updateDto, string userId)
        {
            var post = await _context.BlogPost
                .Include(p => p.Author)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (post == null)
                return null;

            // Check permissions - author or admin
            var user = await _context.Usuario.Include(u => u.Rol).FirstOrDefaultAsync(u => u.IdUsuario.ToString() == userId);
            if (user == null || (post.AuthorId.ToString() != userId && user.Rol.NombreRol != "Administrador"))
                throw new UnauthorizedAccessException("No tienes permisos para editar este post");

            // Validate slug uniqueness if changed
            if (post.Slug != updateDto.Slug && !await IsSlugAvailableAsync(updateDto.Slug, id))
                throw new ArgumentException("El slug ya está en uso");

            // Track if publication status changed
            var wasPublished = post.IsPublished;
            var willBePublished = updateDto.IsPublished;

            post.Title = updateDto.Title;
            post.Content = updateDto.Content;
            post.Summary = updateDto.Summary;
            post.Slug = updateDto.Slug;
            post.IsPublished = updateDto.IsPublished;
            post.IsFeatured = updateDto.IsFeatured;
            post.CategoryId = updateDto.CategoryId;
            post.FeaturedImagePath = updateDto.FeaturedImagePath;
            post.PdfPath = updateDto.PdfPath;
            post.VideoPath = updateDto.VideoPath;
            post.UpdatedAt = DateTime.UtcNow;

            // Set published date if publishing for first time
            if (!wasPublished && willBePublished)
                post.PublishedAt = DateTime.UtcNow;
            else if (wasPublished && !willBePublished)
                post.PublishedAt = null;

            await _context.SaveChangesAsync();

            return await GetBlogPostByIdAsync(id);
        }

        public async Task<bool> DeleteBlogPostAsync(Guid id, string userId)
        {
            var post = await _context.BlogPost
                .Include(p => p.Author)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (post == null)
                return false;

            // Check permissions
            var user = await _context.Usuario.Include(u => u.Rol).FirstOrDefaultAsync(u => u.IdUsuario.ToString() == userId);
            if (user == null || (post.AuthorId.ToString() != userId && user.Rol.NombreRol != "Administrador"))
                throw new UnauthorizedAccessException("No tienes permisos para eliminar este post");

            // Delete associated media files
            var mediaFiles = await _context.MediaEntity
                .Where(m => m.ContentType == "blog" && m.ContentId == id)
                .ToListAsync();

            _context.MediaEntity.RemoveRange(mediaFiles);
            _context.BlogPost.Remove(post);

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> PublishBlogPostAsync(Guid id, string userId)
        {
            var post = await _context.BlogPost.FirstOrDefaultAsync(p => p.Id == id);
            if (post == null) return false;

            // Check permissions
            var user = await _context.Usuario.Include(u => u.Rol).FirstOrDefaultAsync(u => u.IdUsuario.ToString() == userId);
            if (user == null || (post.AuthorId.ToString() != userId && user.Rol.NombreRol != "Administrador"))
                throw new UnauthorizedAccessException("No tienes permisos para publicar este post");

            post.IsPublished = true;
            post.PublishedAt = DateTime.UtcNow;
            post.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UnpublishBlogPostAsync(Guid id, string userId)
        {
            var post = await _context.BlogPost.FirstOrDefaultAsync(p => p.Id == id);
            if (post == null) return false;

            // Check permissions
            var user = await _context.Usuario.Include(u => u.Rol).FirstOrDefaultAsync(u => u.IdUsuario.ToString() == userId);
            if (user == null || (post.AuthorId.ToString() != userId && user.Rol.NombreRol != "Administrador"))
                throw new UnauthorizedAccessException("No tienes permisos para despublicar este post");

            post.IsPublished = false;
            post.PublishedAt = null;
            post.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> IncrementViewsAsync(Guid id)
        {
            var post = await _context.BlogPost.FirstOrDefaultAsync(p => p.Id == id && p.IsPublished);
            if (post == null) return false;

            post.Views++;
            await _context.SaveChangesAsync();
            return true;
        }

        // Blog Categories

        public async Task<IEnumerable<BlogCategoryDto>> GetBlogCategoriesAsync()
        {
            var categories = await _context.BlogPost.GroupBy(p => p.Category)
                .Select(g => new BlogCategoryDto
                {
                    Id = g.Key!.Id,
                    Name = g.Key.Name,
                    Description = g.Key.Description,
                    Color = g.Key.Color,
                    CreatedAt = g.Key.CreatedAt,
                    PostCount = g.Count(p => p.IsPublished)
                })
                .OrderBy(c => c.Name)
                .ToListAsync();

            return categories;
        }

        public async Task<BlogCategoryDto?> GetBlogCategoryByIdAsync(Guid id)
        {
            var category = await _context.BlogPost
                .Where(p => p.CategoryId == id)
                .GroupBy(p => p.Category)
                .Select(g => new BlogCategoryDto
                {
                    Id = g.Key!.Id,
                    Name = g.Key.Name,
                    Description = g.Key.Description,
                    Color = g.Key.Color,
                    CreatedAt = g.Key.CreatedAt,
                    PostCount = g.Count(p => p.IsPublished)
                })
                .FirstOrDefaultAsync();

            return category;
        }

        public async Task<BlogCategoryDto> CreateBlogCategoryAsync(CreateBlogCategoryDto createDto)
        {
            var category = new BlogCategory
            {
                Id = Guid.NewGuid(),
                Name = createDto.Name,
                Description = createDto.Description,
                Color = createDto.Color,
                CreatedAt = DateTime.UtcNow
            };

            _context.Set<BlogCategory>().Add(category);
            await _context.SaveChangesAsync();

            return new BlogCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                Color = category.Color,
                CreatedAt = category.CreatedAt,
                PostCount = 0
            };
        }

        public async Task<BlogCategoryDto?> UpdateBlogCategoryAsync(Guid id, UpdateBlogCategoryDto updateDto)
        {
            var category = await _context.Set<BlogCategory>().FirstOrDefaultAsync(c => c.Id == id);
            if (category == null) return null;

            category.Name = updateDto.Name;
            category.Description = updateDto.Description;
            category.Color = updateDto.Color;

            await _context.SaveChangesAsync();

            return new BlogCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                Color = category.Color,
                CreatedAt = category.CreatedAt,
                PostCount = await _context.BlogPost.CountAsync(p => p.CategoryId == id && p.IsPublished)
            };
        }

        public async Task<bool> DeleteBlogCategoryAsync(Guid id)
        {
            var category = await _context.Set<BlogCategory>().FirstOrDefaultAsync(c => c.Id == id);
            if (category == null) return false;

            // Update posts to remove category reference
            var posts = await _context.BlogPost.Where(p => p.CategoryId == id).ToListAsync();
            foreach (var post in posts)
            {
                post.CategoryId = null;
            }

            _context.Set<BlogCategory>().Remove(category);
            await _context.SaveChangesAsync();
            return true;
        }

        // Featured and Popular Posts

        public async Task<IEnumerable<BlogPostSummaryDto>> GetFeaturedPostsAsync(int count = 5)
        {
            var posts = await _context.BlogPost
                .Include(p => p.Author)
                .Include(p => p.Category)
                .Where(p => p.IsPublished && p.IsFeatured)
                .OrderByDescending(p => p.PublishedAt)
                .Take(count)
                .Select(p => new BlogPostSummaryDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Summary = p.Summary,
                    Slug = p.Slug,
                    IsPublished = p.IsPublished,
                    IsFeatured = p.IsFeatured,
                    Views = p.Views,
                    CreatedAt = p.CreatedAt,
                    PublishedAt = p.PublishedAt,
                    AuthorName = $"{p.Author.Nombre} {p.Author.Apellido}".Trim(),
                    CategoryName = p.Category != null ? p.Category.Name : null,
                    CategoryColor = p.Category != null ? p.Category.Color : null,
                    FeaturedImagePath = p.FeaturedImagePath
                })
                .ToListAsync();

            return posts;
        }

        public async Task<IEnumerable<BlogPostSummaryDto>> GetPopularPostsAsync(int count = 10)
        {
            var posts = await _context.BlogPost
                .Include(p => p.Author)
                .Include(p => p.Category)
                .Where(p => p.IsPublished)
                .OrderByDescending(p => p.Views)
                .Take(count)
                .Select(p => new BlogPostSummaryDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Summary = p.Summary,
                    Slug = p.Slug,
                    IsPublished = p.IsPublished,
                    IsFeatured = p.IsFeatured,
                    Views = p.Views,
                    CreatedAt = p.CreatedAt,
                    PublishedAt = p.PublishedAt,
                    AuthorName = $"{p.Author.Nombre} {p.Author.Apellido}".Trim(),
                    CategoryName = p.Category != null ? p.Category.Name : null,
                    CategoryColor = p.Category != null ? p.Category.Color : null,
                    FeaturedImagePath = p.FeaturedImagePath
                })
                .ToListAsync();

            return posts;
        }

        public async Task<IEnumerable<BlogPostSummaryDto>> GetRecentPostsAsync(int count = 10)
        {
            var posts = await _context.BlogPost
                .Include(p => p.Author)
                .Include(p => p.Category)
                .Where(p => p.IsPublished)
                .OrderByDescending(p => p.PublishedAt)
                .Take(count)
                .Select(p => new BlogPostSummaryDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Summary = p.Summary,
                    Slug = p.Slug,
                    IsPublished = p.IsPublished,
                    IsFeatured = p.IsFeatured,
                    Views = p.Views,
                    CreatedAt = p.CreatedAt,
                    PublishedAt = p.PublishedAt,
                    AuthorName = $"{p.Author.Nombre} {p.Author.Apellido}".Trim(),
                    CategoryName = p.Category != null ? p.Category.Name : null,
                    CategoryColor = p.Category != null ? p.Category.Color : null,
                    FeaturedImagePath = p.FeaturedImagePath
                })
                .ToListAsync();

            return posts;
        }

        public async Task<object> GetBlogStatisticsAsync()
        {
            var totalPosts = await _context.BlogPost.CountAsync();
            var publishedPosts = await _context.BlogPost.CountAsync(p => p.IsPublished);
            var draftPosts = totalPosts - publishedPosts;
            var totalViews = await _context.BlogPost.SumAsync(p => p.Views);
            var totalCategories = await _context.Set<BlogCategory>().CountAsync();

            return new
            {
                TotalPosts = totalPosts,
                PublishedPosts = publishedPosts,
                DraftPosts = draftPosts,
                TotalViews = totalViews,
                TotalCategories = totalCategories
            };
        }

        // Slug utilities

        public async Task<string> GenerateUniqueSlugAsync(string title, Guid? excludePostId = null)
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

        public async Task<bool> IsSlugAvailableAsync(string slug, Guid? excludePostId = null)
        {
            var query = _context.BlogPost.Where(p => p.Slug == slug);
            
            if (excludePostId.HasValue)
                query = query.Where(p => p.Id != excludePostId.Value);

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
    }
}