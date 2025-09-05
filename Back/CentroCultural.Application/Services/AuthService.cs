using CentroCultural.Application.DTOs.Auth;
using CentroCultural.Application.Interfaces;
using CentroCultural.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CentroCultural.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtService _jwtService;

        public AuthService(ApplicationDbContext context, IJwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        public async Task<AuthResponse?> LoginAsync(LoginRequest request)
        {
            var usuario = await _context.Usuario
                .Include(u => u.Rol)
                .FirstOrDefaultAsync(u => u.NombreUsuario == request.NombreUsuario);

            if (usuario == null || !BCrypt.Net.BCrypt.Verify(request.Contrasena, usuario.Contrasena))
                return null;

            return await _jwtService.GenerateTokensAsync(usuario);
        }

        public async Task<AuthResponse?> RefreshTokenAsync(RefreshTokenRequest request)
        {
            return await _jwtService.RefreshTokenAsync(request.RefreshToken);
        }

        public async Task<bool> LogoutAsync(string refreshToken)
        {
            await _jwtService.RevokeTokenAsync(refreshToken);
            return true;
        }

        public async Task<bool> LogoutAllDevicesAsync(int userId)
        {
            await _jwtService.RevokeAllUserTokensAsync(userId);
            return true;
        }
    }
}