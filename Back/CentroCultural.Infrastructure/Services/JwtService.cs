using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using CentroCultural.Application.DTOs.Auth;
using CentroCultural.Application.Interfaces;
using CentroCultural.Domain.Entities;
using CentroCultural.Infrastructure.Configuration;
using CentroCultural.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CentroCultural.Infrastructure.Services
{
    public class JwtService : IJwtService
    {
        private readonly JwtSettings _jwtSettings;
        private readonly ApplicationDbContext _context;

        public JwtService(IOptions<JwtSettings> jwtSettings, ApplicationDbContext context)
        {
            _jwtSettings = jwtSettings.Value;
            _context = context;
        }

        public async Task<AuthResponse> GenerateTokensAsync(Usuario usuario)
        {
            var jti = Guid.NewGuid().ToString();
            var accessToken = GenerateAccessToken(usuario, jti);
            var refreshToken = GenerateRefreshToken();
            
            var expiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes);

            // Guardar refresh token en la base de datos
            var refreshTokenEntity = new RefreshToken
            {
                Id = Guid.NewGuid(),
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
                CreatedAt = DateTime.UtcNow,
                UserId = usuario.IdUsuario,
                IsRevoked = false
            };

            _context.RefreshTokens.Add(refreshTokenEntity);
            await _context.SaveChangesAsync();

            return new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt,
                Usuario = new UsuarioDto
                {
                    IdUsuario = usuario.IdUsuario,
                    NombreUsuario = usuario.NombreUsuario,
                    Nombre = usuario.Nombre,
                    Apellido = usuario.Apellido,
                    Telefono = usuario.Telefono,
                    NombreRol = usuario.Rol?.NombreRol ?? ""
                }
            };
        }

        public async Task<AuthResponse?> RefreshTokenAsync(string refreshToken)
        {
            var tokenEntity = await _context.RefreshTokens
                .Include(rt => rt.Usuario)
                .ThenInclude(u => u.Rol)
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken && !rt.IsRevoked && rt.ExpiresAt > DateTime.UtcNow);

            if (tokenEntity == null)
                return null;

            // Revocar el refresh token actual
            tokenEntity.IsRevoked = true;
            
            // Generar nuevos tokens
            var newAuthResponse = await GenerateTokensAsync(tokenEntity.Usuario);
            
            await _context.SaveChangesAsync();
            
            return newAuthResponse;
        }

        public async Task RevokeTokenAsync(string refreshToken)
        {
            var tokenEntity = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

            if (tokenEntity != null)
            {
                tokenEntity.IsRevoked = true;
                await _context.SaveChangesAsync();
            }
        }

        public async Task RevokeAllUserTokensAsync(int userId)
        {
            var userTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userId && !rt.IsRevoked)
                .ToListAsync();

            foreach (var token in userTokens)
            {
                token.IsRevoked = true;
            }

            await _context.SaveChangesAsync();
        }

        public async Task BlacklistTokenAsync(string jti, int userId, DateTime expiresAt)
        {
            var blacklistEntry = new TokenBlacklist
            {
                Id = Guid.NewGuid(),
                TokenJti = jti,
                UserId = userId,
                ExpiresAt = expiresAt,
                CreatedAt = DateTime.UtcNow
            };

            _context.TokenBlacklist.Add(blacklistEntry);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> IsTokenBlacklistedAsync(string jti)
        {
            return await _context.TokenBlacklist
                .AnyAsync(tb => tb.TokenJti == jti && tb.ExpiresAt > DateTime.UtcNow);
        }

        public async Task CleanupExpiredTokensAsync()
        {
            var expiredRefreshTokens = _context.RefreshTokens
                .Where(rt => rt.ExpiresAt < DateTime.UtcNow);
            
            var expiredBlacklistTokens = _context.TokenBlacklist
                .Where(tb => tb.ExpiresAt < DateTime.UtcNow);

            _context.RefreshTokens.RemoveRange(expiredRefreshTokens);
            _context.TokenBlacklist.RemoveRange(expiredBlacklistTokens);

            await _context.SaveChangesAsync();
        }

        private string GenerateAccessToken(Usuario usuario, string jti)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, usuario.IdUsuario.ToString()),
                new(ClaimTypes.Name, usuario.NombreUsuario),
                new(ClaimTypes.GivenName, usuario.Nombre),
                new(ClaimTypes.Surname, usuario.Apellido),
                new(ClaimTypes.Role, usuario.Rol?.NombreRol ?? ""),
                new(JwtRegisteredClaimNames.Jti, jti),
                new(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
            };

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string GenerateRefreshToken()
        {
            var randomBytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes);
        }
    }
}