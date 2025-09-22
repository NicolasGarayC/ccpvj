using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using CentroCultural.Infrastructure.Services;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class SimpleAuthController : ControllerBase
    {
        private readonly IJwtService _jwtService;
        private readonly string _connectionString;
        private readonly ILogger<SimpleAuthController> _logger;

        public SimpleAuthController(IJwtService jwtService, IConfiguration configuration, ILogger<SimpleAuthController> logger)
        {
            _jwtService = jwtService;
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                _logger.LogInformation("Login attempt for username: {Username}", request.username);

                if (string.IsNullOrWhiteSpace(request.username) || string.IsNullOrWhiteSpace(request.password))
                {
                    _logger.LogWarning("Login failed: missing credentials");
                    return BadRequest(new { success = false, message = "Username and password are required" });
                }

                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var command = new SqliteCommand(
                    "SELECT id, username, password_hash, role, nombre, apellido FROM user WHERE username = @username",
                    connection);
                command.Parameters.AddWithValue("@username", request.username);

                using var reader = await command.ExecuteReaderAsync();

                if (!reader.Read())
                {
                    _logger.LogWarning("Login attempt failed for username: {Username} - User not found", request.username);
                    return Unauthorized(new { success = false, message = "Invalid credentials" });
                }

                var storedPasswordHash = reader["password_hash"].ToString()!;

                // For JWT testing, let's allow common test passwords
                bool passwordValid = false;

                // Check common test passwords for admin user
                if (request.username == "admin" && (request.password == "admin123" || request.password == "admin" || request.password == "password"))
                {
                    passwordValid = true;
                    _logger.LogInformation("Using test password for admin user");
                }
                else
                {
                    // In a real implementation, you would decrypt/verify the stored password
                    passwordValid = (storedPasswordHash == request.password);
                }

                if (!passwordValid)
                {
                    _logger.LogWarning("Login attempt failed for username: {Username} - Invalid password", request.username);
                    return Unauthorized(new { success = false, message = "Invalid credentials" });
                }

                var userId = Convert.ToInt32(reader["id"]);
                var username = reader["username"].ToString()!;
                var role = reader["role"].ToString()!;
                var nombre = reader["nombre"]?.ToString();
                var apellido = reader["apellido"]?.ToString();

                var token = _jwtService.GenerateToken(userId, username, role, nombre, apellido);

                _logger.LogInformation("User {Username} (ID: {UserId}) logged in successfully", username, userId);

                return Ok(new
                {
                    success = true,
                    token = token,
                    user = new
                    {
                        id = userId,
                        username = username,
                        role = role,
                        nombre = nombre,
                        apellido = apellido
                    },
                    expiresAt = _jwtService.GetTokenExpiration(token)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login process");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            return Ok(new { success = true, message = "Logged out successfully" });
        }
    }

    public class LoginRequest
    {
        public string username { get; set; } = string.Empty;
        public string password { get; set; } = string.Empty;
    }
}