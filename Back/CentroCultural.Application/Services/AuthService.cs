using CentroCultural.Application.DTOs.Auth;
using CentroCultural.Application.Interfaces;
using CentroCultural.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CentroCultural.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;

        public AuthService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<AuthResponse?> LoginAsync(LoginRequest request)
        {
            var usuario = await _context.Usuario
                .Include(u => u.Rol)
                .FirstOrDefaultAsync(u => u.NombreUsuario == request.NombreUsuario);

            if (usuario == null || !BCrypt.Net.BCrypt.Verify(request.Contrasena, usuario.Contrasena))
                return null;

            // Return a simple response indicating successful authentication
            // The actual cookie creation will be handled by the AuthController
            return new AuthResponse
            {
                AccessToken = "cookie-auth", // Placeholder since we're using cookies
                RefreshToken = "cookie-auth", // Placeholder since we're using cookies
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                Usuario = new UsuarioDto
                {
                    IdUsuario = usuario.IdUsuario,
                    NombreUsuario = usuario.NombreUsuario,
                    Nombre = usuario.Nombre,
                    Apellido = usuario.Apellido,
                    Telefono = usuario.Telefono,
                    NombreRol = usuario.Rol?.NombreRol ?? "Asistente"
                }
            };
        }

        public async Task<AuthResponse?> RefreshTokenAsync(RefreshTokenRequest request)
        {
            // With cookie authentication, refresh is handled automatically
            // This method is now just a placeholder
            return null;
        }

        public async Task<bool> LogoutAsync(string refreshToken)
        {
            // With cookie authentication, logout is handled by the controller
            // This method is now just a placeholder
            return true;
        }

        public async Task<bool> LogoutAllDevicesAsync(int userId)
        {
            // With cookie authentication, this is handled differently
            // This method is now just a placeholder
            return true;
        }
    }
}