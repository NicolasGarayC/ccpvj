namespace CentroCultural.Application.DTOs
{
    public class BlogPostDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string Slug { get; set; } = string.Empty;
        public bool IsPublished { get; set; }
        public bool IsFeatured { get; set; }
        public int Views { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? PublishedAt { get; set; }
        public int AuthorId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public Guid? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public string? FeaturedImagePath { get; set; }
        public string? PdfPath { get; set; }
        public string? VideoPath { get; set; }
    }

    public class BlogPostSummaryDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string Slug { get; set; } = string.Empty;
        public bool IsPublished { get; set; }
        public bool IsFeatured { get; set; }
        public int Views { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? PublishedAt { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        public string? CategoryColor { get; set; }
        public string? FeaturedImagePath { get; set; }
    }

    public class CreateBlogPostDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string Slug { get; set; } = string.Empty;
        public bool IsPublished { get; set; } = false;
        public bool IsFeatured { get; set; } = false;
        public Guid? CategoryId { get; set; }
        public string? FeaturedImagePath { get; set; }
        public string? PdfPath { get; set; }
        public string? VideoPath { get; set; }
    }

    public class UpdateBlogPostDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string Slug { get; set; } = string.Empty;
        public bool IsPublished { get; set; }
        public bool IsFeatured { get; set; }
        public Guid? CategoryId { get; set; }
        public string? FeaturedImagePath { get; set; }
        public string? PdfPath { get; set; }
        public string? VideoPath { get; set; }
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