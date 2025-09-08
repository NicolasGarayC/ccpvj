using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using System.Security.Claims;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Todas las operaciones requieren autenticación
    public class UserManagementController : ControllerBase
    {
        private readonly IUserManagementService _userManagementService;
        private readonly ILogger<UserManagementController> _logger;

        public UserManagementController(IUserManagementService userManagementService, ILogger<UserManagementController> logger)
        {
            _userManagementService = userManagementService;
            _logger = logger;
        }

        /// <summary>
        /// Obtiene un usuario específico por ID (solo admin/colaboradores)
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(int id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue) return Unauthorized();

                var canManage = await _userManagementService.CanUserManageOtherUsersAsync(currentUserId.Value);
                if (!canManage) return Forbid("No tienes permisos para gestionar usuarios");

                var user = await _userManagementService.GetUserByIdAsync(id);
                if (user == null) return NotFound("Usuario no encontrado");

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener usuario {UserId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Obtiene lista paginada de usuarios con filtros (solo admin/colaboradores)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<UserPagedResultDto>> GetUsers([FromQuery] UserSearchDto searchDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue) return Unauthorized();

                var canManage = await _userManagementService.CanUserManageOtherUsersAsync(currentUserId.Value);
                if (!canManage) return Forbid("No tienes permisos para gestionar usuarios");

                var result = await _userManagementService.GetUsersAsync(searchDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener lista de usuarios");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Crea un nuevo usuario (solo admin/colaboradores)
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserDto createUserDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue) return Unauthorized();

                var user = await _userManagementService.CreateUserAsync(createUserDto, currentUserId.Value);
                return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear usuario");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Actualiza un usuario existente (solo admin/colaboradores)
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> UpdateUser(int id, [FromBody] UpdateUserDto updateUserDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue) return Unauthorized();

                var user = await _userManagementService.UpdateUserAsync(id, updateUserDto, currentUserId.Value);
                return Ok(user);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar usuario {UserId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Elimina (desactiva) un usuario (solo administradores)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<ActionResult> DeleteUser(int id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue) return Unauthorized();

                var success = await _userManagementService.DeleteUserAsync(id, currentUserId.Value);
                if (!success) return NotFound("Usuario no encontrado");

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar usuario {UserId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Activa o desactiva un usuario
        /// </summary>
        [HttpPatch("{id}/status")]
        public async Task<ActionResult> ToggleUserStatus(int id, [FromBody] bool isActive)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue) return Unauthorized();

                var success = await _userManagementService.ActivateDeactivateUserAsync(id, isActive, currentUserId.Value);
                if (!success) return NotFound("Usuario no encontrado o sin permisos");

                return Ok(new { message = $"Usuario {(isActive ? "activado" : "desactivado")} exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cambiar estado del usuario {UserId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Obtiene los roles disponibles
        /// </summary>
        [HttpGet("roles")]
        public async Task<ActionResult<IEnumerable<RoleDto>>> GetAvailableRoles()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue) return Unauthorized();

                var canManage = await _userManagementService.CanUserManageOtherUsersAsync(currentUserId.Value);
                if (!canManage) return Forbid("No tienes permisos para gestionar usuarios");

                var roles = await _userManagementService.GetAvailableRolesAsync();
                return Ok(roles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener roles disponibles");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Cambia el rol de un usuario
        /// </summary>
        [HttpPatch("{id}/role")]
        public async Task<ActionResult> ChangeUserRole(int id, [FromBody] string newRole)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue) return Unauthorized();

                var success = await _userManagementService.ChangeUserRoleAsync(id, newRole, currentUserId.Value);
                if (!success) return BadRequest("No se pudo cambiar el rol del usuario");

                return Ok(new { message = $"Rol cambiado a {newRole} exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cambiar rol del usuario {UserId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Verifica si un nombre de usuario está disponible
        /// </summary>
        [HttpGet("check-username/{username}")]
        public async Task<ActionResult<bool>> CheckUsernameAvailability(string username, [FromQuery] int? excludeUserId = null)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue) return Unauthorized();

                var canManage = await _userManagementService.CanUserManageOtherUsersAsync(currentUserId.Value);
                if (!canManage) return Forbid("No tienes permisos para gestionar usuarios");

                var isAvailable = await _userManagementService.IsUsernameAvailableAsync(username, excludeUserId);
                return Ok(new { username, isAvailable });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar disponibilidad del username {Username}", username);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Obtiene estadísticas de usuarios (solo administradores)
        /// </summary>
        [HttpGet("statistics")]
        [Authorize(Roles = "Administrador")]
        public async Task<ActionResult<UserStatsDto>> GetUserStatistics()
        {
            try
            {
                var stats = await _userManagementService.GetUserStatisticsAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener estadísticas de usuarios");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Restablece la contraseña de un usuario
        /// </summary>
        [HttpPost("{id}/reset-password")]
        public async Task<ActionResult> ResetUserPassword(int id, [FromBody] string newPassword)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue) return Unauthorized();

                var success = await _userManagementService.ResetUserPasswordAsync(id, newPassword, currentUserId.Value);
                if (!success) return BadRequest("No se pudo restablecer la contraseña");

                return Ok(new { message = "Contraseña restablecida exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al restablecer contraseña del usuario {UserId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Obtiene información del usuario actual
        /// </summary>
        [HttpGet("me")]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue) return Unauthorized();

                var user = await _userManagementService.GetUserByIdAsync(currentUserId.Value);
                if (user == null) return NotFound("Usuario no encontrado");

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener información del usuario actual");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Verifica si el usuario actual puede gestionar otros usuarios
        /// </summary>
        [HttpGet("can-manage")]
        public async Task<ActionResult<bool>> CanManageUsers()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!currentUserId.HasValue) return Unauthorized();

                var canManage = await _userManagementService.CanUserManageOtherUsersAsync(currentUserId.Value);
                return Ok(new { canManage });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar permisos de gestión de usuarios");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Obtiene el ID del usuario actual desde el token JWT
        /// </summary>
        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }
    }
}