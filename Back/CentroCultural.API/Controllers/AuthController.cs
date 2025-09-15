using CentroCultural.Application.DTOs.Auth;
using CentroCultural.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using CentroCultural.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ApplicationDbContext _context;

        public AuthController(IAuthService authService, ApplicationDbContext context)
        {
            _authService = authService;
            _context = context;
        }

        [HttpPost("login")]
        public async Task<ActionResult> Login([FromBody] LoginRequest request)
        {
            // Use existing auth service to validate credentials
            var authResult = await _authService.LoginAsync(request);
            if (authResult == null)
                return Unauthorized(new { success = false, error = "Credenciales inválidas" });

            // Get user info from database
            var user = await _context.Usuarios
                .Include(u => u.Rol)
                .FirstOrDefaultAsync(u => u.NombreUsuario == request.NombreUsuario);

            if (user == null)
                return Unauthorized(new { success = false, error = "Usuario no encontrado" });

            // Create claims for cookie authentication
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.IdUsuario.ToString()),
                new Claim(ClaimTypes.Name, user.NombreUsuario),
                new Claim("nombre", user.Nombre ?? ""),
                new Claim("apellido", user.Apellido ?? ""),
                new Claim(ClaimTypes.Role, user.Role ?? "asistente")
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

            // Return user data (similar to SvelteKit format)
            return Ok(new
            {
                success = true,
                user = new
                {
                    id = user.IdUsuario.ToString(),
                    username = user.NombreUsuario,
                    nombre = user.Nombre,
                    apellido = user.Apellido,
                    role = user.Role
                }
            });
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Ok(new { success = true });
        }

        [HttpGet("me")]
        public async Task<ActionResult> GetCurrentUser()
        {
            if (!User.Identity.IsAuthenticated)
            {
                return Ok(new { success = true, data = new { user = (object)null } });
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Ok(new { success = true, data = new { user = (object)null } });
            }

            // Get fresh user data from database
            var user = await _context.Usuarios
                .Include(u => u.Rol)
                .FirstOrDefaultAsync(u => u.IdUsuario.ToString() == userId);

            if (user == null)
            {
                await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return Ok(new { success = true, data = new { user = (object)null } });
            }

            return Ok(new
            {
                success = true,
                data = new
                {
                    user = new
                    {
                        id = user.IdUsuario.ToString(),
                        username = user.NombreUsuario,
                        nombre = user.Nombre,
                        apellido = user.Apellido,
                        role = user.Role
                    }
                }
            });
        }

        [HttpPost("refresh")]
        public async Task<ActionResult> RefreshToken()
        {
            // With cookie authentication, refresh is automatic via sliding expiration
            // Just return current user status
            return await GetCurrentUser();
        }
    }
}