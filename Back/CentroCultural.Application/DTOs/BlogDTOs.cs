namespace CentroCultural.Application.DTOs
{
    public class BlogPostElementDto
    {
        public string Id { get; set; } = string.Empty;
        public string BlogPostId { get; set; } = string.Empty;
        public string ElementType { get; set; } = string.Empty; // title, text, image, video, audio, document
        public string? Content { get; set; } // For title and text content
        public string? FilePath { get; set; } // For multimedia files
        public string? FileName { get; set; } // Original file name
        public int? FileSize { get; set; } // File size in bytes
        public string? MimeType { get; set; } // MIME type
        public int OrderNumber { get; set; } = 0;
        public string? Metadata { get; set; } // JSON for additional data (alt text, caption, etc.)
        public bool IsActive { get; set; } = true;
        public long CreatedAt { get; set; }
        public long? UpdatedAt { get; set; }
    }

    public class CreateBlogPostElementDto
    {
        public string BlogPostId { get; set; } = string.Empty;
        public string ElementType { get; set; } = string.Empty;
        public string? Content { get; set; }
        public string? FilePath { get; set; }
        public string? FileName { get; set; }
        public int? FileSize { get; set; }
        public string? MimeType { get; set; }
        public int OrderNumber { get; set; } = 0;
        public string? Metadata { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UpdateBlogPostElementDto
    {
        public string? ElementType { get; set; }
        public string? Content { get; set; }
        public string? FilePath { get; set; }
        public string? FileName { get; set; }
        public int? FileSize { get; set; }
        public string? MimeType { get; set; }
        public int? OrderNumber { get; set; }
        public string? Metadata { get; set; }
        public bool? IsActive { get; set; }
    }

    public class BlogPostDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string Slug { get; set; } = string.Empty;
        public bool IsPublished { get; set; }
        public bool IsFeatured { get; set; }
        public int Views { get; set; }
        public int OrderNumber { get; set; }
        public bool IsActive { get; set; } = true;
        public long CreatedAt { get; set; }
        public long? UpdatedAt { get; set; }
        public long? PublishedAt { get; set; }
        public int AuthorId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public List<string> Tags { get; set; } = new List<string>();
        public List<BlogPostElementDto> Elements { get; set; } = new List<BlogPostElementDto>();
    }

    public class BlogPostSummaryDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string Slug { get; set; } = string.Empty;
        public bool IsPublished { get; set; }
        public bool IsFeatured { get; set; }
        public int Views { get; set; }
        public long CreatedAt { get; set; }
        public long? PublishedAt { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        public string? CategoryColor { get; set; }
        public string? FeaturedImagePath { get; set; }
    }

    public class CreateBlogPostDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string Slug { get; set; } = string.Empty;
        public bool IsPublished { get; set; } = false;
        public bool IsFeatured { get; set; } = false;
        public int OrderNumber { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public string? CategoryId { get; set; }
        public List<string> Tags { get; set; } = new List<string>();
        public List<BlogPostElementDto> Elements { get; set; } = new List<BlogPostElementDto>();
    }

    public class UpdateBlogPostDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string Slug { get; set; } = string.Empty;
        public bool IsPublished { get; set; }
        public bool IsFeatured { get; set; }
        public int OrderNumber { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public string? CategoryId { get; set; }
        public List<string> Tags { get; set; } = new List<string>();
        public List<BlogPostElementDto> Elements { get; set; } = new List<BlogPostElementDto>();
    }

    public class BlogCategoryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Color { get; set; } = "#6B7280";
        public DateTime CreatedAt { get; set; }
        public int PostCount { get; set; }
    }

    public class CreateBlogCategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Color { get; set; } = "#6B7280";
    }

    public class UpdateBlogCategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Color { get; set; } = "#6B7280";
    }

    public class BlogPostSearchDto
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SearchTerm { get; set; }
        public Guid? CategoryId { get; set; }
        public bool? IsPublished { get; set; }
        public bool? IsFeatured { get; set; }
        public string? SortBy { get; set; } = "created_desc"; // created_desc, created_asc, title_asc, views_desc
    }

    public class BlogPostPagedResultDto
    {
        public IEnumerable<BlogPostSummaryDto> Posts { get; set; } = new List<BlogPostSummaryDto>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }
}