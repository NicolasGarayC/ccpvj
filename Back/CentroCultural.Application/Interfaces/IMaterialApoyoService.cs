using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CentroCultural.Application.DTOs;

namespace CentroCultural.Application.Interfaces
{
    public interface IMaterialApoyoService
    {
        // Material Apoyo CRUD operations
        Task<MaterialApoyoPagedResultDto> GetMaterialApoyoAsync(MaterialApoyoSearchDto searchDto);
        Task<IEnumerable<MaterialApoyoSummaryDto>> GetAllMaterialApoyoAsync();
        Task<IEnumerable<MaterialApoyoSummaryDto>> GetFeaturedMaterialApoyoAsync(int count = 6);
        Task<MaterialApoyoDetailDto?> GetMaterialApoyoByIdAsync(string id);
        Task<MaterialApoyoDto> CreateMaterialApoyoAsync(CreateMaterialApoyoDto createMaterialApoyoDto, int userId);
        Task<bool> UpdateMaterialApoyoAsync(string id, UpdateMaterialApoyoDto updateMaterialApoyoDto, int userId);
        Task<bool> DeleteMaterialApoyoAsync(string id, int userId);
        Task<IEnumerable<MaterialApoyoSummaryDto>> GetMaterialApoyoByEducatorAsync(int userId);

        // Module operations (kept in MaterialApoyoService for consistency)
        Task<IEnumerable<ModuleSummaryDto>> GetMaterialApoyoModulesAsync(string materialApoyoId);
        Task<ModuleDetailDto?> GetModuleByIdAsync(string moduleId);
        Task<ModuleDto> CreateModuleAsync(CreateModuleDto createModuleDto, int userId);
        Task<bool> UpdateModuleAsync(string id, UpdateModuleDto updateModuleDto, int userId);
        Task<bool> DeleteModuleAsync(string id, int userId);
        Task<bool> ReorderModuleAsync(string id, int newOrderNumber, int userId);

        // Statistics and utility methods
        Task<object> GetMaterialApoyoStatisticsAsync();
    }
}