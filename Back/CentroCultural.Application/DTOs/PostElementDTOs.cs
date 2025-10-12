namespace CentroCultural.Application.DTOs
{
    public class PostElementDto
    {
        public string Id { get; set; } = string.Empty;
        public string PostId { get; set; } = string.Empty;
        public string ElementType { get; set; } = string.Empty; // title, text, image, video, audio
        public string? Content { get; set; } // For title and text content
        public string? FilePath { get; set; } // For multimedia files
        public string? FileName { get; set; } // Original file name
        public int? FileSize { get; set; } // File size in bytes
        public string? MimeType { get; set; } // MIME type
        public int OrderNumber { get; set; }
        public string? Metadata { get; set; } // JSON for additional data (alt text, caption, etc.)
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreatePostElementDto
    {
        public string PostId { get; set; } = string.Empty;
        public string ElementType { get; set; } = string.Empty;
        public string? Content { get; set; }
        public string? FilePath { get; set; }
        public string? FileName { get; set; }
        public int? FileSize { get; set; }
        public string? MimeType { get; set; }
        public int OrderNumber { get; set; }
        public string? Metadata { get; set; }
    }

    public class UpdatePostElementDto
    {
        public string ElementType { get; set; } = string.Empty;
        public string? Content { get; set; }
        public string? FilePath { get; set; }
        public string? FileName { get; set; }
        public int? FileSize { get; set; }
        public string? MimeType { get; set; }
        public int OrderNumber { get; set; }
        public string? Metadata { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class CreateElementsBatchDto
    {
        public string PostId { get; set; } = string.Empty;
        public List<CreatePostElementDto> Elements { get; set; } = new();
    }

    public class ReorderElementDto
    {
        public int NewOrderNumber { get; set; }
    }
}