using System;
using System.Collections.Generic;

namespace CentroCultural.Application.DTOs
{
    public class CourseDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public bool IsFeatured { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int EducatorId { get; set; }
        public string EducatorName { get; set; } = string.Empty;
        public string? ImagePath { get; set; }
        public int ModuleCount { get; set; }
        public int WorkItemCount { get; set; }
    }

    public class CourseDetailDto : CourseDto
    {
        public string StringId { get; set; } = string.Empty;
        public IEnumerable<ModuleSummaryDto> Modules { get; set; } = new List<ModuleSummaryDto>();
    }

    public class CreateCourseDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public bool IsFeatured { get; set; } = false;
        public string? ImagePath { get; set; }
    }

    public class UpdateCourseDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public bool IsFeatured { get; set; }
        public string? ImagePath { get; set; }
    }

    public class CourseSummaryDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public bool IsFeatured { get; set; }
        public bool IsActive { get; set; }
        public long CreatedAt { get; set; }
        public string EducatorName { get; set; } = string.Empty;
        public string? ImagePath { get; set; }
        public int ModuleCount { get; set; }
    }

    public class ModuleDto
    {
        public Guid Id { get; set; }
        public string StringId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int OrderNumber { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public int WorkItemCount { get; set; }
    }

    public class ModuleDetailDto : ModuleDto
    {
        public IEnumerable<WorkItemDto> WorkItems { get; set; } = new List<WorkItemDto>();
    }

    public class ModuleSummaryDto
    {
        public Guid Id { get; set; }
        public string StringId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int OrderNumber { get; set; }
        public bool IsActive { get; set; }
        public int WorkItemCount { get; set; }
    }

    public class CreateModuleDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int OrderNumber { get; set; } = 0;
        public Guid CourseId { get; set; }
    }

    public class UpdateModuleDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int OrderNumber { get; set; }
    }

    public class ReorderModuleDto
    {
        public int NewOrderNumber { get; set; }
    }

    public class CourseSearchDto
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SearchTerm { get; set; }
        public string? Subject { get; set; }
        public bool? IsFeatured { get; set; }
        public bool? IsActive { get; set; }
        public string? SortBy { get; set; } = "created_desc"; // created_desc, created_asc, title_asc, featured_desc
    }

    public class CoursePagedResultDto
    {
        public IEnumerable<CourseSummaryDto> Courses { get; set; } = new List<CourseSummaryDto>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    // Constants for subjects
    public static class CourseSubjects
    {
        public const string Matematicas = "Matemáticas";
        public const string Fisica = "Física";
        public const string Sociales = "Sociales";
        public const string Economia = "Economía";

        public static readonly string[] All = { Matematicas, Fisica, Sociales, Economia };
    }
}