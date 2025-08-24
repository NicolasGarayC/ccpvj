using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Back.Data;
using Back.DTOs;
using Back.Models;

namespace Back.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AuthController> _logger;

        public AuthController(ApplicationDbContext context, ILogger<AuthController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<ActionResult<Back.DTOs.LoginResponseDTO>> Login([FromBody] Back.DTOs.LoginRequestDTO request)
        {
            try
            {
                // DEBUGGING: Log de los parámetros recibidos
                _logger.LogInformation("=== LOGIN ATTEMPT DEBUG ===");
                _logger.LogInformation("Usuario recibido: '{NombreUsuario}'", request?.NombreUsuario ?? "NULL");
                _logger.LogInformation("Contraseña recibida: '{Contrasena}' (longitud: {Length})", 
                    request?.Contrasena ?? "NULL", request?.Contrasena?.Length ?? 0);
                
                // También escribir en consola para debugging inmediato
                Console.WriteLine($"=== LOGIN DEBUG ===");
                Console.WriteLine($"Usuario: '{request?.NombreUsuario ?? "NULL"}'");
                Console.WriteLine($"Contraseña: '{request?.Contrasena ?? "NULL"}' (longitud: {request?.Contrasena?.Length ?? 0})");
                Console.WriteLine($"Request es null: {request == null}");

                // Validación básica
                if (request == null)
                {
                    _logger.LogWarning("Request es null");
                    return BadRequest(new LoginResponseDTO
                    {
                        Success = false,
                        Message = "Datos de login no proporcionados"
                    });
                }

                if (string.IsNullOrWhiteSpace(request.NombreUsuario) || string.IsNullOrWhiteSpace(request.Contrasena))
                {
                    _logger.LogWarning("Usuario o contraseña vacíos");
                    return BadRequest(new LoginResponseDTO
                    {
                        Success = false,
                        Message = "Usuario y contraseña son requeridos"
                    });
                }

                // Buscar usuario en la base de datos con la información del rol
                _logger.LogInformation("Buscando usuario en la base de datos...");
                var usuario = await _context.Usuario
                    .Include(u => u.Rol)
                    .FirstOrDefaultAsync(u => u.NombreUsuario == request.NombreUsuario);

                _logger.LogInformation("Usuario encontrado: {UsuarioEncontrado}", usuario != null);
                
                if (usuario != null)
                {
                    _logger.LogInformation("Usuario DB - ID: {Id}, Nombre: '{Nombre}', Rol: '{Rol}', IdRol: {IdRol}", 
                        usuario.IdUsuario, usuario.NombreUsuario, usuario.Rol?.NombreRol ?? "SIN ROL", usuario.IdRol);
                    
                    Console.WriteLine($"Usuario encontrado - ID: {usuario.IdUsuario}, Nombre: '{usuario.NombreUsuario}', IdRol: {usuario.IdRol}");
                    Console.WriteLine($"Rol: {usuario.Rol?.NombreRol ?? "SIN ROL"}");
                    Console.WriteLine($"Hash en DB: {usuario.Contrasena}");
                    Console.WriteLine($"Tipo de contraseña: {GetPasswordType(usuario.Contrasena)}");
                }
                else
                {
                    _logger.LogWarning("Usuario no encontrado");
                    Console.WriteLine("Usuario no encontrado en la base de datos");
                }

                // Verificar credenciales
                if (usuario == null)
                {
                    return Unauthorized(new LoginResponseDTO
                    {
                        Success = false,
                        Message = "Credenciales inválidas"
                    });
                }

                // Verificar contraseña
                bool passwordMatch = await VerifyPassword(request.Contrasena, usuario.Contrasena, usuario);
                
                if (!passwordMatch)
                {
                    return Unauthorized(new LoginResponseDTO
                    {
                        Success = false,
                        Message = "Credenciales inválidas"
                    });
                }

                // Token simple por ahora
                var token = $"token_{usuario.IdUsuario}_{DateTime.UtcNow.Ticks}";
                var expiresAt = DateTime.UtcNow.AddMinutes(120);

                _logger.LogInformation("Login exitoso para usuario: {Usuario}", usuario.NombreUsuario);

                return Ok(new LoginResponseDTO
                {
                    Success = true,
                    Message = "Login exitoso",
                    Token = token,
                    IdUsuario = usuario.IdUsuario,
                    NombreUsuario = usuario.NombreUsuario,
                    Rol = usuario.Rol?.NombreRol ?? "Sin Rol",
                    ExpiresAt = expiresAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en login: {Message}", ex.Message);
                Console.WriteLine($"ERROR en login: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new LoginResponseDTO
                {
                    Success = false,
                    Message = "Error interno del servidor"
                });
            }
        }

        private async Task<bool> VerifyPassword(string inputPassword, string storedPassword, Usuario usuario)
        {
            try
            {
                // Verificar si es un hash BCrypt válido
                if (IsBCryptHash(storedPassword))
                {
                    Console.WriteLine("Verificando como hash BCrypt...");
                    bool result = BCrypt.Net.BCrypt.Verify(inputPassword, storedPassword);
                    Console.WriteLine($"Resultado BCrypt: {result}");
                    return result;
                }
                else
                {
                    // Comparar como texto plano
                    Console.WriteLine("Verificando como texto plano...");
                    bool isMatch = storedPassword == inputPassword;
                    Console.WriteLine($"Resultado texto plano: {isMatch}");
                    
                    if (isMatch)
                    {
                        // Migrar a BCrypt automáticamente
                        Console.WriteLine("Migrando contraseña a BCrypt...");
                        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(inputPassword);
                        usuario.Contrasena = hashedPassword;
                        await _context.SaveChangesAsync();
                        Console.WriteLine($"Contraseña migrada exitosamente para usuario: {usuario.NombreUsuario}");
                        _logger.LogInformation("Contraseña migrada automáticamente a BCrypt para usuario: {Usuario}", usuario.NombreUsuario);
                    }
                    return isMatch;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verificando contraseña: {Error}", ex.Message);
                Console.WriteLine($"Error en verificación de contraseña: {ex.Message}");
                
                // Fallback a comparación de texto plano
                bool fallbackResult = storedPassword == inputPassword;
                Console.WriteLine($"Fallback a texto plano: {fallbackResult}");
                return fallbackResult;
            }
        }

        private bool IsBCryptHash(string password)
        {
            return password.StartsWith("$2a$") || password.StartsWith("$2b$") || 
                   password.StartsWith("$2y$") || password.StartsWith("$2x$");
        }

        private string GetPasswordType(string password)
        {
            return IsBCryptHash(password) ? "BCrypt Hash" : "Texto Plano";
        }

        [HttpGet("verify")]
        public async Task<ActionResult<ApiResponseDTO<object>>> VerifyToken()
        {
            return Ok(new ApiResponseDTO<object>
            {
                Success = true,
                Message = "Token válido"
            });
        }
    }
}