namespace CentroCultural.Application.DTOs
{
    public class WorkItemDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? LongText { get; set; }
        public int OrderNumber { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid ModuleId { get; set; }
        public string? ImagePath { get; set; }
        public string? VideoPath { get; set; }
    }

    public class WorkItemDetailDto : WorkItemDto
    {
        public string ModuleName { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
    }

    public class CreateWorkItemDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? LongText { get; set; }
        public int OrderNumber { get; set; } = 0;
        public Guid ModuleId { get; set; }
        public string? ImagePath { get; set; }
        public string? VideoPath { get; set; }
    }

    public class UpdateWorkItemDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? LongText { get; set; }
        public int OrderNumber { get; set; }
        public string? ImagePath { get; set; }
        public string? VideoPath { get; set; }
    }

    public class ReorderWorkItemDto
    {
        public int NewOrderNumber { get; set; }
    }

    public class WorkItemWithModuleDto : WorkItemDto
    {
        public string ModuleName { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
    }

    public class MediaFileDto
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string RelativePath { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string MimeType { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public string ContentId { get; set; } = string.Empty;
        public string MediaType { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
        public string UploadedBy { get; set; } = string.Empty;
    }
}