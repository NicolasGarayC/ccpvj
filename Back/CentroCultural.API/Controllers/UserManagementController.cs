using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Data.Sqlite;
using CentroCultural.Application.DTOs;
using CentroCultural.Infrastructure.Services;
using System.Security.Claims;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/usermanagement")]
    [Authorize] // Requiere autenticación JWT para todos los endpoints
    public class UserManagementController : ControllerBase
    {
        private readonly string _connectionString;
        private readonly ILogger<UserManagementController> _logger;

        public UserManagementController(IConfiguration configuration, ILogger<UserManagementController> logger)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
            _logger = logger;
        }

        // GET: api/usermanagement
        [HttpGet]
        [Authorize(Roles = "administrador")] // Solo administradores pueden ver todos los usuarios
        public async Task<ActionResult<UserPagedResultDto>> GetUsers([FromQuery] UserSearchDto searchParams)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var baseQuery = @"
                    SELECT u.IdUsuario as Id, u.NombreUsuario as Username, u.Nombre, u.Apellido,
                           u.Telefono, r.NombreRol as Role, u.FechaCreacion as CreatedAt,
                           u.FechaActualizacion as UpdatedAt, u.EsActivo as IsActive
                    FROM Usuario u
                    JOIN Rol r ON u.IdRol = r.IdRol";

                var whereConditions = new List<string>();
                var parameters = new List<SqliteParameter>();

                // Filtros
                if (!string.IsNullOrEmpty(searchParams.SearchTerm))
                {
                    whereConditions.Add("(u.NombreUsuario LIKE @searchTerm OR u.Nombre LIKE @searchTerm OR u.Apellido LIKE @searchTerm)");
                    parameters.Add(new SqliteParameter("@searchTerm", $"%{searchParams.SearchTerm}%"));
                }

                if (!string.IsNullOrEmpty(searchParams.Role))
                {
                    whereConditions.Add("r.NombreRol = @role");
                    parameters.Add(new SqliteParameter("@role", searchParams.Role));
                }

                if (searchParams.IsActive.HasValue)
                {
                    whereConditions.Add("u.EsActivo = @isActive");
                    parameters.Add(new SqliteParameter("@isActive", searchParams.IsActive.Value ? 1 : 0));
                }

                string whereClause = whereConditions.Count > 0 ? " WHERE " + string.Join(" AND ", whereConditions) : "";

                // Orden
                string orderClause = searchParams.SortBy switch
                {
                    "name_asc" => " ORDER BY u.Nombre ASC",
                    "username_asc" => " ORDER BY u.NombreUsuario ASC",
                    "created_asc" => " ORDER BY u.FechaCreacion ASC",
                    _ => " ORDER BY u.FechaCreacion DESC"
                };

                // Contar total
                var countQuery = $"SELECT COUNT(*) FROM Usuario u JOIN Rol r ON u.IdRol = r.IdRol{whereClause}";
                var countCommand = new SqliteCommand(countQuery, connection);
                foreach (var param in parameters)
                {
                    countCommand.Parameters.Add(new SqliteParameter(param.ParameterName, param.Value));
                }
                var totalCount = Convert.ToInt32(await countCommand.ExecuteScalarAsync());

                // Paginación
                var offset = (searchParams.Page - 1) * searchParams.PageSize;
                var dataQuery = $"{baseQuery}{whereClause}{orderClause} LIMIT @pageSize OFFSET @offset";

                var dataCommand = new SqliteCommand(dataQuery, connection);
                foreach (var param in parameters)
                {
                    dataCommand.Parameters.Add(new SqliteParameter(param.ParameterName, param.Value));
                }
                dataCommand.Parameters.AddWithValue("@pageSize", searchParams.PageSize);
                dataCommand.Parameters.AddWithValue("@offset", offset);

                var users = new List<UserDto>();
                using var reader = await dataCommand.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    users.Add(new UserDto
                    {
                        Id = Convert.ToInt32(reader["Id"]),
                        Username = reader["Username"].ToString()!,
                        Nombre = reader["Nombre"].ToString()!,
                        Apellido = reader["Apellido"].ToString()!,
                        Telefono = reader["Telefono"] == DBNull.Value ? null : reader["Telefono"].ToString(),
                        Role = reader["Role"].ToString()!,
                        CreatedAt = DateTime.Parse(reader["CreatedAt"].ToString()!),
                        UpdatedAt = reader["UpdatedAt"] == DBNull.Value ? null : DateTime.Parse(reader["UpdatedAt"].ToString()!),
                        IsActive = Convert.ToInt32(reader["IsActive"]) == 1
                    });
                }

                var totalPages = (int)Math.Ceiling((double)totalCount / searchParams.PageSize);

                var result = new UserPagedResultDto
                {
                    Users = users,
                    TotalCount = totalCount,
                    Page = searchParams.Page,
                    PageSize = searchParams.PageSize,
                    TotalPages = totalPages,
                    HasNextPage = searchParams.Page < totalPages,
                    HasPreviousPage = searchParams.Page > 1
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return StatusCode(500, new { error = "Error interno del servidor" });
            }
        }

        // GET: api/usermanagement/{id}
        [HttpGet("{id}")]
        [Authorize(Roles = "administrador,colaborador")] // Administradores y colaboradores pueden ver usuarios individuales
        public async Task<ActionResult<UserDto>> GetUser(int id)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT u.IdUsuario as Id, u.NombreUsuario as Username, u.Nombre, u.Apellido,
                           u.Telefono, r.NombreRol as Role, u.FechaCreacion as CreatedAt,
                           u.FechaActualizacion as UpdatedAt, u.EsActivo as IsActive
                    FROM Usuario u
                    JOIN Rol r ON u.IdRol = r.IdRol
                    WHERE u.IdUsuario = @id";

                var command = new SqliteCommand(query, connection);
                command.Parameters.AddWithValue("@id", id);

                using var reader = await command.ExecuteReaderAsync();
                if (!await reader.ReadAsync())
                {
                    return NotFound(new { error = "Usuario no encontrado" });
                }

                var user = new UserDto
                {
                    Id = Convert.ToInt32(reader["Id"]),
                    Username = reader["Username"].ToString()!,
                    Nombre = reader["Nombre"].ToString()!,
                    Apellido = reader["Apellido"].ToString()!,
                    Telefono = reader["Telefono"] == DBNull.Value ? null : reader["Telefono"].ToString(),
                    Role = reader["Role"].ToString()!,
                    CreatedAt = DateTime.Parse(reader["CreatedAt"].ToString()!),
                    UpdatedAt = reader["UpdatedAt"] == DBNull.Value ? null : DateTime.Parse(reader["UpdatedAt"].ToString()!),
                    IsActive = Convert.ToInt32(reader["IsActive"]) == 1
                };

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user {UserId}", id);
                return StatusCode(500, new { error = "Error interno del servidor" });
            }
        }

        // POST: api/usermanagement
        [HttpPost]
        [Authorize(Roles = "administrador")] // Solo administradores pueden crear usuarios
        public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserDto createUserDto)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                // Verificar que el rol existe
                var roleQuery = "SELECT IdRol FROM Rol WHERE NombreRol = @role";
                var roleCommand = new SqliteCommand(roleQuery, connection);
                roleCommand.Parameters.AddWithValue("@role", createUserDto.Role);
                var roleId = await roleCommand.ExecuteScalarAsync();

                if (roleId == null)
                {
                    return BadRequest(new { error = "Rol no válido" });
                }

                // Verificar que el username no exista
                var checkUserQuery = "SELECT COUNT(*) FROM Usuario WHERE NombreUsuario = @username";
                var checkUserCommand = new SqliteCommand(checkUserQuery, connection);
                checkUserCommand.Parameters.AddWithValue("@username", createUserDto.Username);
                var userExists = Convert.ToInt32(await checkUserCommand.ExecuteScalarAsync()) > 0;

                if (userExists)
                {
                    return BadRequest(new { error = "El nombre de usuario ya existe" });
                }

                // Crear usuario
                var insertQuery = @"
                    INSERT INTO Usuario (NombreUsuario, Contrasena, Nombre, Apellido, Telefono, IdRol, FechaRegistro, FechaCreacion, EsActivo)
                    VALUES (@username, @password, @nombre, @apellido, @telefono, @roleId, @fechaRegistro, @createdAt, 1);
                    SELECT last_insert_rowid();";

                var insertCommand = new SqliteCommand(insertQuery, connection);
                insertCommand.Parameters.AddWithValue("@username", createUserDto.Username);
                insertCommand.Parameters.AddWithValue("@password", createUserDto.Password); // En producción esto debería estar hasheado
                insertCommand.Parameters.AddWithValue("@nombre", createUserDto.Nombre);
                insertCommand.Parameters.AddWithValue("@apellido", createUserDto.Apellido);
                insertCommand.Parameters.AddWithValue("@telefono", (object?)createUserDto.Telefono ?? DBNull.Value);
                insertCommand.Parameters.AddWithValue("@roleId", roleId);
                insertCommand.Parameters.AddWithValue("@fechaRegistro", DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
                insertCommand.Parameters.AddWithValue("@createdAt", DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                var userId = Convert.ToInt32(await insertCommand.ExecuteScalarAsync());

                // Retornar el usuario creado
                return await GetUser(userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user");
                return StatusCode(500, new { error = "Error interno del servidor" });
            }
        }

        // PUT: api/usermanagement/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "administrador")] // Solo administradores pueden actualizar usuarios
        public async Task<ActionResult<UserDto>> UpdateUser(int id, [FromBody] UpdateUserDto updateUserDto)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                // Verificar que el usuario existe
                var checkUserQuery = "SELECT COUNT(*) FROM Usuario WHERE IdUsuario = @id";
                var checkUserCommand = new SqliteCommand(checkUserQuery, connection);
                checkUserCommand.Parameters.AddWithValue("@id", id);
                var userExists = Convert.ToInt32(await checkUserCommand.ExecuteScalarAsync()) > 0;

                if (!userExists)
                {
                    return NotFound(new { error = "Usuario no encontrado" });
                }

                // Verificar que el rol existe
                var roleQuery = "SELECT IdRol FROM Rol WHERE NombreRol = @role";
                var roleCommand = new SqliteCommand(roleQuery, connection);
                roleCommand.Parameters.AddWithValue("@role", updateUserDto.Role);
                var roleId = await roleCommand.ExecuteScalarAsync();

                if (roleId == null)
                {
                    return BadRequest(new { error = "Rol no válido" });
                }

                // Verificar que el username no exista para otro usuario
                var checkUsernameQuery = "SELECT COUNT(*) FROM Usuario WHERE NombreUsuario = @username AND IdUsuario != @id";
                var checkUsernameCommand = new SqliteCommand(checkUsernameQuery, connection);
                checkUsernameCommand.Parameters.AddWithValue("@username", updateUserDto.Username);
                checkUsernameCommand.Parameters.AddWithValue("@id", id);
                var usernameExists = Convert.ToInt32(await checkUsernameCommand.ExecuteScalarAsync()) > 0;

                if (usernameExists)
                {
                    return BadRequest(new { error = "El nombre de usuario ya existe" });
                }

                // Actualizar usuario
                var updateQuery = @"
                    UPDATE Usuario
                    SET NombreUsuario = @username, Nombre = @nombre, Apellido = @apellido,
                        Telefono = @telefono, IdRol = @roleId, EsActivo = @isActive,
                        FechaActualizacion = @updatedAt" +
                    (string.IsNullOrEmpty(updateUserDto.NewPassword) ? "" : ", Contrasena = @newPassword") +
                    " WHERE IdUsuario = @id";

                var updateCommand = new SqliteCommand(updateQuery, connection);
                updateCommand.Parameters.AddWithValue("@username", updateUserDto.Username);
                updateCommand.Parameters.AddWithValue("@nombre", updateUserDto.Nombre);
                updateCommand.Parameters.AddWithValue("@apellido", updateUserDto.Apellido);
                updateCommand.Parameters.AddWithValue("@telefono", (object?)updateUserDto.Telefono ?? DBNull.Value);
                updateCommand.Parameters.AddWithValue("@roleId", roleId);
                updateCommand.Parameters.AddWithValue("@isActive", updateUserDto.IsActive ? 1 : 0);
                updateCommand.Parameters.AddWithValue("@updatedAt", DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
                updateCommand.Parameters.AddWithValue("@id", id);

                if (!string.IsNullOrEmpty(updateUserDto.NewPassword))
                {
                    updateCommand.Parameters.AddWithValue("@newPassword", updateUserDto.NewPassword);
                }

                await updateCommand.ExecuteNonQueryAsync();

                // Retornar el usuario actualizado
                return await GetUser(id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user {UserId}", id);
                return StatusCode(500, new { error = "Error interno del servidor" });
            }
        }

        // DELETE: api/usermanagement/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "administrador")] // Solo administradores pueden eliminar usuarios
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                if (currentUserId == id)
                {
                    return BadRequest(new { error = "No puedes eliminar tu propio usuario" });
                }

                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                // Verificar que el usuario existe
                var checkUserQuery = "SELECT COUNT(*) FROM Usuario WHERE IdUsuario = @id";
                var checkUserCommand = new SqliteCommand(checkUserQuery, connection);
                checkUserCommand.Parameters.AddWithValue("@id", id);
                var userExists = Convert.ToInt32(await checkUserCommand.ExecuteScalarAsync()) > 0;

                if (!userExists)
                {
                    return NotFound(new { error = "Usuario no encontrado" });
                }

                // Desactivar usuario en lugar de eliminarlo
                var updateQuery = "UPDATE Usuario SET EsActivo = 0, FechaActualizacion = @updatedAt WHERE IdUsuario = @id";
                var updateCommand = new SqliteCommand(updateQuery, connection);
                updateCommand.Parameters.AddWithValue("@updatedAt", DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
                updateCommand.Parameters.AddWithValue("@id", id);

                await updateCommand.ExecuteNonQueryAsync();

                return Ok(new { success = true, message = "Usuario desactivado correctamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user {UserId}", id);
                return StatusCode(500, new { error = "Error interno del servidor" });
            }
        }

        // PATCH: api/usermanagement/{id}/status
        [HttpPatch("{id}/status")]
        [Authorize(Roles = "administrador")] // Solo administradores pueden cambiar el estado
        public async Task<IActionResult> ToggleUserStatus(int id, [FromBody] bool isActive)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var updateQuery = "UPDATE Usuario SET EsActivo = @isActive, FechaActualizacion = @updatedAt WHERE IdUsuario = @id";
                var updateCommand = new SqliteCommand(updateQuery, connection);
                updateCommand.Parameters.AddWithValue("@isActive", isActive ? 1 : 0);
                updateCommand.Parameters.AddWithValue("@updatedAt", DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
                updateCommand.Parameters.AddWithValue("@id", id);

                var rowsAffected = await updateCommand.ExecuteNonQueryAsync();

                if (rowsAffected == 0)
                {
                    return NotFound(new { error = "Usuario no encontrado" });
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling user status {UserId}", id);
                return StatusCode(500, new { error = "Error interno del servidor" });
            }
        }

        // GET: api/usermanagement/roles
        [HttpGet("roles")]
        [Authorize(Roles = "administrador,colaborador")] // Administradores y colaboradores pueden ver roles
        public async Task<ActionResult<IEnumerable<RoleDto>>> GetAvailableRoles()
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var query = "SELECT NombreRol as Name, NombreRol as DisplayName, 'Role' as Description FROM Rol";
                var command = new SqliteCommand(query, connection);

                var roles = new List<RoleDto>();
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    roles.Add(new RoleDto
                    {
                        Name = reader["Name"].ToString()!,
                        DisplayName = reader["DisplayName"].ToString()!,
                        Description = reader["Description"].ToString()!,
                        Permissions = Array.Empty<string>() // Por ahora sin permisos específicos
                    });
                }

                return Ok(roles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting roles");
                return StatusCode(500, new { error = "Error interno del servidor" });
            }
        }

        // GET: api/usermanagement/me
        [HttpGet("me")]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { error = "Token inválido" });
                }

                return await GetUser(userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current user");
                return StatusCode(500, new { error = "Error interno del servidor" });
            }
        }

        // GET: api/usermanagement/can-manage
        [HttpGet("can-manage")]
        public IActionResult CanManageUsers()
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var canManage = userRole == "administrador" || userRole == "colaborador";

            return Ok(new { canManage });
        }

        // GET: api/usermanagement/check-username/{username}
        [HttpGet("check-username/{username}")]
        [Authorize(Roles = "administrador,colaborador")]
        public async Task<ActionResult> CheckUsernameAvailability(string username, [FromQuery] int? excludeUserId = null)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var query = excludeUserId.HasValue
                    ? "SELECT COUNT(*) FROM Usuario WHERE NombreUsuario = @username AND IdUsuario != @excludeUserId"
                    : "SELECT COUNT(*) FROM Usuario WHERE NombreUsuario = @username";

                var command = new SqliteCommand(query, connection);
                command.Parameters.AddWithValue("@username", username);

                if (excludeUserId.HasValue)
                {
                    command.Parameters.AddWithValue("@excludeUserId", excludeUserId.Value);
                }

                var count = Convert.ToInt32(await command.ExecuteScalarAsync());
                var isAvailable = count == 0;

                return Ok(new { isAvailable });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking username availability");
                return StatusCode(500, new { error = "Error interno del servidor" });
            }
        }
    }
}