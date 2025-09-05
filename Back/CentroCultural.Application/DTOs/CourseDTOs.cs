using System;
using System.Collections.Generic;

namespace CentroCultural.Application.DTOs
{
    public class CourseDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImagePath { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public bool IsFeatured { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string EducatorName { get; set; } = string.Empty;
        public int EducatorId { get; set; }
        public int ModuleCount { get; set; }
    }

    public class CourseDetailDto : CourseDto
    {
        public List<ModuleDto> Modules { get; set; } = new List<ModuleDto>();
        public string EducatorEmail { get; set; } = string.Empty;
    }

    public class CreateCourseDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImagePath { get; set; } = string.Empty;
        public bool IsFeatured { get; set; } = false;
    }

    public class UpdateCourseDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImagePath { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public bool IsFeatured { get; set; } = false;
    }

    public class ModuleDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int OrderNumber { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
    }

    public class CreateModuleDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int OrderNumber { get; set; }
        public Guid CourseId { get; set; }
    }

    public class UpdateModuleDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int OrderNumber { get; set; }
        public bool IsActive { get; set; } = true;
    }
}