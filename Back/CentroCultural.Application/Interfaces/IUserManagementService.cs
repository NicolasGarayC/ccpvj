using CentroCultural.Application.DTOs;

namespace CentroCultural.Application.Interfaces
{
    public interface IUserManagementService
    {
        // CRUD básico
        Task<UserDto?> GetUserByIdAsync(int id);
        Task<UserPagedResultDto> GetUsersAsync(UserSearchDto searchDto);
        Task<UserDto> CreateUserAsync(CreateUserDto createUserDto, int createdByUserId);
        Task<UserDto> UpdateUserAsync(int id, UpdateUserDto updateUserDto, int updatedByUserId);
        Task<bool> DeleteUserAsync(int id, int deletedByUserId);
        Task<bool> ActivateDeactivateUserAsync(int id, bool isActive, int modifiedByUserId);

        // Roles
        Task<IEnumerable<RoleDto>> GetAvailableRolesAsync();
        Task<bool> ChangeUserRoleAsync(int userId, string newRole, int changedByUserId);

        // Validaciones
        Task<bool> IsUsernameAvailableAsync(string username, int? excludeUserId = null);
        Task<bool> CanUserManageOtherUsersAsync(int userId);
        Task<bool> CanUserChangeRoleAsync(int userId, string targetRole);

        // Estadísticas
        Task<UserStatsDto> GetUserStatisticsAsync();

        // Gestión de contraseñas
        Task<bool> ResetUserPasswordAsync(int userId, string newPassword, int resetByUserId);
        Task<bool> ForcePasswordChangeAsync(int userId, int forcedByUserId);

        // Auditoría
        Task<IEnumerable<object>> GetUserActivityLogAsync(int userId, int days = 30);
    }
}