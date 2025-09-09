using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using CentroCultural.Domain.Entities;
using CentroCultural.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace CentroCultural.Application.Services
{
    public class UserManagementService : IUserManagementService
    {
        private readonly ApplicationDbContext _context;

        public UserManagementService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<UserDto?> GetUserByIdAsync(int id)
        {
            var user = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
            return user != null ? MapToUserDto(user) : null;
        }

        public async Task<UserPagedResultDto> GetUsersAsync(UserSearchDto searchDto)
        {
            var query = _context.Usuarios.AsQueryable();

            // Aplicar filtros
            if (!string.IsNullOrEmpty(searchDto.SearchTerm))
            {
                var searchTerm = searchDto.SearchTerm.ToLower();
                query = query.Where(u => u.NombreUsuario.ToLower().Contains(searchTerm) ||
                                       u.Nombre.ToLower().Contains(searchTerm) ||
                                       u.Apellido.ToLower().Contains(searchTerm));
            }

            if (!string.IsNullOrEmpty(searchDto.Role))
            {
                query = query.Where(u => u.Rol.NombreRol == searchDto.Role);
            }

            if (searchDto.IsActive.HasValue)
            {
                query = query.Where(u => u.EsActivo == searchDto.IsActive.Value);
            }

            // Aplicar ordenamiento
            query = searchDto.SortBy switch
            {
                "created_asc" => query.OrderBy(u => u.FechaCreacion),
                "name_asc" => query.OrderBy(u => u.Nombre).ThenBy(u => u.Apellido),
                "username_asc" => query.OrderBy(u => u.NombreUsuario),
                _ => query.OrderByDescending(u => u.FechaCreacion) // created_desc default
            };

            var totalCount = await query.CountAsync();
            var users = await query
                .Skip((searchDto.Page - 1) * searchDto.PageSize)
                .Take(searchDto.PageSize)
                .Select(u => MapToUserDto(u))
                .ToListAsync();

            var totalPages = (int)Math.Ceiling(totalCount / (double)searchDto.PageSize);

            return new UserPagedResultDto
            {
                Users = users,
                TotalCount = totalCount,
                Page = searchDto.Page,
                PageSize = searchDto.PageSize,
                TotalPages = totalPages,
                HasNextPage = searchDto.Page < totalPages,
                HasPreviousPage = searchDto.Page > 1
            };
        }

        public async Task<UserDto> CreateUserAsync(CreateUserDto createUserDto, int createdByUserId)
        {
            // Verificar permisos del usuario que crea
            var creatorUser = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == createdByUserId);
            if (creatorUser == null || !CanManageUsers(creatorUser.Rol.NombreRol))
            {
                throw new UnauthorizedAccessException("No tienes permisos para crear usuarios");
            }

            // Verificar si el username ya existe
            if (await _context.Usuarios.AnyAsync(u => u.NombreUsuario == createUserDto.Username))
            {
                throw new InvalidOperationException("El nombre de usuario ya existe");
            }

            // Verificar si el rol es válido y si el creador puede asignarlo
            if (!IsValidRole(createUserDto.Role))
            {
                throw new InvalidOperationException("Rol inválido");
            }

            if (!CanAssignRole(creatorUser.Rol.NombreRol, createUserDto.Role))
            {
                throw new UnauthorizedAccessException($"No tienes permisos para asignar el rol {createUserDto.Role}");
            }

            // Crear el usuario
            // Convertir string role a IdRol
            int rolId = createUserDto.Role switch
            {
                "Asistente" => 1,
                "Colaborador" => 2,
                "Administrador" => 3,
                _ => 1 // Default Asistente
            };

            var user = new Usuario
            {
                NombreUsuario = createUserDto.Username,
                Contrasena = BCrypt.Net.BCrypt.HashPassword(createUserDto.Password),
                Nombre = createUserDto.Nombre,
                Apellido = createUserDto.Apellido,
                Telefono = createUserDto.Telefono,
                IdRol = rolId,
                EsActivo = true,
                FechaCreacion = DateTime.UtcNow,
                FechaRegistro = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss")
            };

            _context.Usuarios.Add(user);
            await _context.SaveChangesAsync();

            return MapToUserDto(user);
        }

        public async Task<UserDto> UpdateUserAsync(int id, UpdateUserDto updateUserDto, int updatedByUserId)
        {
            var user = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
            {
                throw new InvalidOperationException("Usuario no encontrado");
            }

            var updaterUser = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == updatedByUserId);
            if (updaterUser == null || !CanManageUsers(updaterUser.Rol))
            {
                throw new UnauthorizedAccessException("No tienes permisos para actualizar usuarios");
            }

            // Solo admin puede editar otros admins
            if (user.Rol.NombreRol == "Administrador" && updaterUser.Rol.NombreRol != "Administrador" && user.Id != updatedByUserId)
            {
                throw new UnauthorizedAccessException("Solo un administrador puede editar otro administrador");
            }

            // Verificar username único (excluyendo el usuario actual)
            if (updateUserDto.Username != user.NombreUsuario)
            {
                if (await _context.Usuarios.AnyAsync(u => u.NombreUsuario == updateUserDto.Username && u.Id != id))
                {
                    throw new InvalidOperationException("El nombre de usuario ya existe");
                }
            }

            // Verificar cambio de rol
            if (updateUserDto.Role != user.Rol.NombreRol)
            {
                if (!IsValidRole(updateUserDto.Role) || !CanAssignRole(updaterUser.Rol.NombreRol, updateUserDto.Role))
                {
                    throw new UnauthorizedAccessException($"No tienes permisos para asignar el rol {updateUserDto.Role}");
                }
                
                // Convertir rol string a IdRol
                int newRolId = updateUserDto.Role switch
                {
                    "Asistente" => 1,
                    "Colaborador" => 2,
                    "Administrador" => 3,
                    _ => user.IdRol // Mantener rol actual si es inválido
                };
                user.IdRol = newRolId;
            }

            // Actualizar campos
            user.NombreUsuario = updateUserDto.Username;
            user.Nombre = updateUserDto.Nombre;
            user.Apellido = updateUserDto.Apellido;
            user.Telefono = updateUserDto.Telefono;
            user.EsActivo = updateUserDto.IsActive;
            user.FechaActualizacion = DateTime.UtcNow;

            // Cambiar contraseña si se proporciona
            if (!string.IsNullOrEmpty(updateUserDto.NewPassword))
            {
                user.Contrasena = BCrypt.Net.BCrypt.HashPassword(updateUserDto.NewPassword);
            }

            await _context.SaveChangesAsync();
            return MapToUserDto(user);
        }

        public async Task<bool> DeleteUserAsync(int id, int deletedByUserId)
        {
            var user = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return false;

            var deleterUser = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == deletedByUserId);
            if (deleterUser == null || deleterUser.Rol.NombreRol != "Administrador")
            {
                throw new UnauthorizedAccessException("Solo los administradores pueden eliminar usuarios");
            }

            // No permitir que un admin se elimine a sí mismo
            if (user.Id == deletedByUserId)
            {
                throw new InvalidOperationException("No puedes eliminarte a ti mismo");
            }

            // En lugar de eliminación física, desactivar el usuario
            user.EsActivo = false;
            user.FechaActualizacion = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ActivateDeactivateUserAsync(int id, bool isActive, int modifiedByUserId)
        {
            var user = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return false;

            var modifierUser = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == modifiedByUserId);
            if (modifierUser == null || !CanManageUsers(modifierUser.Rol))
            {
                return false;
            }

            user.EsActivo = isActive;
            user.FechaActualizacion = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<RoleDto>> GetAvailableRolesAsync()
        {
            return new List<RoleDto>
            {
                new RoleDto
                {
                    Name = "Asistente",
                    DisplayName = "Asistente",
                    Description = "Solo lectura, sin autenticación requerida",
                    Permissions = new[] { "read" }
                },
                new RoleDto
                {
                    Name = "Colaborador",
                    DisplayName = "Colaborador",
                    Description = "Puede crear y editar contenido propio",
                    Permissions = new[] { "read", "create", "edit_own", "delete_own" }
                },
                new RoleDto
                {
                    Name = "Administrador",
                    DisplayName = "Administrador",
                    Description = "Acceso completo al sistema",
                    Permissions = new[] { "read", "create", "edit", "delete", "admin" }
                }
            };
        }

        public async Task<bool> ChangeUserRoleAsync(int userId, string newRole, int changedByUserId)
        {
            var user = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == userId);
            var changerUser = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == changedByUserId);
            
            if (user == null || changerUser == null) return false;
            if (!IsValidRole(newRole) || !CanAssignRole(changerUser.Rol.NombreRol, newRole)) return false;

            // Convertir rol string a IdRol
            int newRolId = newRole switch
            {
                "Asistente" => 1,
                "Colaborador" => 2,
                "Administrador" => 3,
                _ => user.IdRol // Mantener rol actual si es inválido
            };
            user.IdRol = newRolId;
            user.FechaActualizacion = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> IsUsernameAvailableAsync(string username, int? excludeUserId = null)
        {
            var query = _context.Usuarios.Where(u => u.NombreUsuario == username);
            if (excludeUserId.HasValue)
            {
                query = query.Where(u => u.Id != excludeUserId.Value);
            }
            return !await query.AnyAsync();
        }

        public async Task<bool> CanUserManageOtherUsersAsync(int userId)
        {
            var user = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == userId);
            return user != null && CanManageUsers(user.Rol.NombreRol);
        }

        public async Task<bool> CanUserChangeRoleAsync(int userId, string targetRole)
        {
            var user = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == userId);
            return user != null && CanAssignRole(user.Rol.NombreRol, targetRole);
        }

        public async Task<UserStatsDto> GetUserStatisticsAsync()
        {
            var totalUsers = await _context.Usuarios.CountAsync();
            var activeUsers = await _context.Usuarios.CountAsync(u => u.EsActivo);
            var usersByRole = await _context.Usuarios
                .Include(u => u.Rol)
                .Where(u => u.EsActivo)
                .GroupBy(u => u.Rol.NombreRol)
                .ToDictionaryAsync(g => g.Key, g => g.Count());
            
            var lastUserCreated = await _context.Usuarios
                .OrderByDescending(u => u.FechaCreacion)
                .Select(u => u.FechaCreacion)
                .FirstOrDefaultAsync();

            return new UserStatsDto
            {
                TotalUsers = totalUsers,
                ActiveUsers = activeUsers,
                InactiveUsers = totalUsers - activeUsers,
                UsersByRole = usersByRole,
                LastUserCreated = lastUserCreated
            };
        }

        public async Task<bool> ResetUserPasswordAsync(int userId, string newPassword, int resetByUserId)
        {
            var user = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == userId);
            var resetterUser = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == resetByUserId);
            
            if (user == null || resetterUser == null || !CanManageUsers(resetterUser.Rol))
                return false;

            user.Contrasena = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.FechaActualizacion = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ForcePasswordChangeAsync(int userId, int forcedByUserId)
        {
            var user = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == userId);
            var forcerUser = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == forcedByUserId);
            
            if (user == null || forcerUser == null || !CanManageUsers(forcerUser.Rol))
                return false;

            // Implementar lógica para forzar cambio de contraseña en el próximo login
            // Esto podría ser un campo adicional en la entidad Usuario
            user.FechaActualizacion = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<object>> GetUserActivityLogAsync(int userId, int days = 30)
        {
            // Implementar lógica de auditoría si tienes una tabla de logs
            // Por ahora, retornar una lista vacía
            return new List<object>();
        }

        // Métodos auxiliares privados
        private static UserDto MapToUserDto(Usuario user)
        {
            return new UserDto
            {
                Id = user.Id,
                Username = user.NombreUsuario,
                Nombre = user.Nombre,
                Apellido = user.Apellido,
                Telefono = user.Telefono,
                Role = user.Rol?.NombreRol ?? "Asistente",
                CreatedAt = user.FechaCreacion,
                UpdatedAt = user.FechaActualizacion,
                IsActive = user.EsActivo
            };
        }

        private static bool CanManageUsers(string userRole)
        {
            return userRole == "Administrador" || userRole == "Colaborador";
        }

        private static bool IsValidRole(string role)
        {
            return role == "Asistente" || role == "Colaborador" || role == "Administrador";
        }

        private static bool CanAssignRole(string assignerRole, string targetRole)
        {
            // Solo administradores pueden asignar rol de administrador
            if (targetRole == "Administrador")
                return assignerRole == "Administrador";

            // Colaboradores y admins pueden asignar roles de Asistente y Colaborador
            return assignerRole == "Administrador" || assignerRole == "Colaborador";
        }
    }
}