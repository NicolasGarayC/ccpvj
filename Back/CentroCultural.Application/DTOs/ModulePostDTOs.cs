using System;

namespace CentroCultural.Application.DTOs
{
    public class ModulePostDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? Content { get; set; }
        public string? ImagePath { get; set; }
        public string? VideoPath { get; set; }
        public string? AudioPath { get; set; }
        public int OrderNumber { get; set; }
        public bool IsActive { get; set; }
        public string ModuleId { get; set; } = string.Empty;
        public int AuthorId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateModulePostDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? Content { get; set; }
        public string? ImagePath { get; set; }
        public string? VideoPath { get; set; }
        public string? AudioPath { get; set; }
        public int OrderNumber { get; set; } = 0;
        public string ModuleId { get; set; } = string.Empty;
    }

    public class UpdateModulePostDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? Content { get; set; }
        public string? ImagePath { get; set; }
        public string? VideoPath { get; set; }
        public string? AudioPath { get; set; }
        public int OrderNumber { get; set; }
    }

    public class ModulePostSummaryDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int OrderNumber { get; set; }
        public bool IsActive { get; set; }
        public bool HasImage { get; set; }
        public bool HasVideo { get; set; }
        public bool HasAudio { get; set; }
    }
}
