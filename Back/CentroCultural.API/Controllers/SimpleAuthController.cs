using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using Microsoft.Data.Sqlite;
using BCrypt.Net;
using CentroCultural.API.Utils;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/simple-auth")]
    public class SimpleAuthController : ControllerBase
    {
        private readonly string _connectionString;

        public SimpleAuthController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestSimple request)
        {
            try
            {
                string username, encryptedPassword;

                // Verificar si las credenciales están cifradas
                if (request.IsEncrypted && !string.IsNullOrEmpty(request.EncryptedUsername) && !string.IsNullOrEmpty(request.EncryptedPassword))
                {
                    // Descifrar solo el username, mantener la contraseña cifrada
                    username = CryptoUtils.SimpleDecrypt(request.EncryptedUsername);
                    encryptedPassword = request.EncryptedPassword; // Mantener cifrada para comparar
                    Console.WriteLine($"[DEBUG] Username descifrado: {username}");
                    Console.WriteLine($"[DEBUG] Password encriptada recibida: {encryptedPassword}");
                }
                else
                {
                    // Usar credenciales sin cifrar (fallback)
                    username = request.NombreUsuario;
                    // Encriptar la contraseña para comparar con la BD
                    encryptedPassword = CryptoUtils.SimpleEncrypt(request.Contrasena);
                    Console.WriteLine($"[DEBUG] Credenciales sin cifrar - username: {username}");
                    Console.WriteLine($"[DEBUG] Password sin cifrar convertida a cifrada: {encryptedPassword}");
                }

                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var command = new SqliteCommand(
                    "SELECT id, username, password_hash, role, nombre, apellido FROM user WHERE username = @username",
                    connection);
                command.Parameters.AddWithValue("@username", username);

                using var reader = await command.ExecuteReaderAsync();

                if (!reader.Read())
                {
                    Console.WriteLine($"[DEBUG] Usuario no encontrado: {username}");
                    return Unauthorized(new { success = false, error = "Usuario no encontrado" });
                }

                var storedPasswordHash = reader["password_hash"].ToString()!;
                Console.WriteLine($"[DEBUG] Password hash en BD: {storedPasswordHash}");
                Console.WriteLine($"[DEBUG] Password encriptada recibida: {encryptedPassword}");

                // Comparar contraseñas encriptadas directamente
                if (storedPasswordHash != encryptedPassword)
                {
                    Console.WriteLine($"[DEBUG] Contraseñas no coinciden");
                    return Unauthorized(new { success = false, error = "Credenciales inválidas" });
                }

                Console.WriteLine($"[DEBUG] Login exitoso para usuario: {username}");

                // Crear claims para cookie authentication
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, reader["id"].ToString()!),
                    new Claim(ClaimTypes.Name, reader["username"].ToString()!),
                    new Claim("nombre", reader["nombre"]?.ToString() ?? ""),
                    new Claim("apellido", reader["apellido"]?.ToString() ?? ""),
                    new Claim(ClaimTypes.Role, reader["role"].ToString()!)
                };

                var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                var authProperties = new AuthenticationProperties
                {
                    IsPersistent = true,
                    ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7)
                };

                // Sign in with cookie
                await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,
                    new ClaimsPrincipal(claimsIdentity), authProperties);

                // Crear respuesta con datos del usuario (sin cifrar para evitar problemas de compatibilidad)
                var responseData = new
                {
                    success = true,
                    data = new
                    {
                        user = new
                        {
                            id = reader["id"].ToString()!,
                            username = reader["username"].ToString()!,
                            nombre = reader["nombre"]?.ToString() ?? "",
                            apellido = reader["apellido"]?.ToString() ?? "",
                            role = reader["role"].ToString()!
                        }
                    }
                };

                return Ok(responseData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Ok(new { success = true });
        }

        [HttpGet("me")]
        public IActionResult GetCurrentUser()
        {
            if (!User.Identity?.IsAuthenticated ?? false)
            {
                return Unauthorized(new { success = false, error = "No autenticado" });
            }

            return Ok(new
            {
                success = true,
                user = new
                {
                    id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                    username = User.FindFirst(ClaimTypes.Name)?.Value,
                    nombre = User.FindFirst("nombre")?.Value ?? "",
                    apellido = User.FindFirst("apellido")?.Value ?? "",
                    role = User.FindFirst(ClaimTypes.Role)?.Value
                }
            });
        }
    }

    public class LoginRequestSimple
    {
        public string NombreUsuario { get; set; } = string.Empty;
        public string Contrasena { get; set; } = string.Empty;

        // Campos para credenciales cifradas
        public bool IsEncrypted { get; set; } = false;
        public string? EncryptedUsername { get; set; }
        public string? EncryptedPassword { get; set; }
    }
}