using System;
using System.Collections.Generic;

namespace CentroCultural.Application.DTOs
{
    public class MaterialApoyoDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public bool IsFeatured { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int EducatorId { get; set; }
        public string EducatorName { get; set; } = string.Empty;
        public string? ImagePath { get; set; }
        public int ModuleCount { get; set; }
        public int PostCount { get; set; }
    }

    public class MaterialApoyoDetailDto : MaterialApoyoDto
    {
        public IEnumerable<ModuleSummaryDto> Modules { get; set; } = new List<ModuleSummaryDto>();
    }

    public class CreateMaterialApoyoDto
    {
        public string? Id { get; set; } // Optional: if provided, will be used instead of auto-generated GUID
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsFeatured { get; set; } = false;
        public string? ImagePath { get; set; }
        public string? EducatorName { get; set; }
    }

    public class UpdateMaterialApoyoDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsFeatured { get; set; }
        public string? ImagePath { get; set; }
        public string? EducatorName { get; set; }
    }

    public class MaterialApoyoSummaryDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsFeatured { get; set; }
        public bool IsActive { get; set; }
        public long CreatedAt { get; set; }
        public string EducatorName { get; set; } = string.Empty;
        public string? ImagePath { get; set; }
        public int ModuleCount { get; set; }
    }

    public class ModuleDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int OrderNumber { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string MaterialApoyoId { get; set; } = string.Empty;
        public string MaterialApoyoName { get; set; } = string.Empty;
        public int PostCount { get; set; }
    }

    public class ModuleDetailDto : ModuleDto
    {
        // WorkItems removed - legacy feature
    }

    public class ModuleSummaryDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int OrderNumber { get; set; }
        public bool IsActive { get; set; }
        public int PostCount { get; set; }
    }

    public class CreateModuleDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int OrderNumber { get; set; } = 0;
        public string MaterialApoyoId { get; set; } = string.Empty;
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

    public class MaterialApoyoSearchDto
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SearchTerm { get; set; }
        public bool? IsFeatured { get; set; }
        public bool? IsActive { get; set; }
        public string? SortBy { get; set; } = "created_desc"; // created_desc, created_asc, title_asc, featured_desc
    }

    public class MaterialApoyoPagedResultDto
    {
        public IEnumerable<MaterialApoyoSummaryDto> MaterialApoyo { get; set; } = new List<MaterialApoyoSummaryDto>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

}