using CentroCultural.Application.DTOs.Auth;
using CentroCultural.Domain.Entities;

namespace CentroCultural.Application.Interfaces
{
    public interface IJwtService
    {
        Task<AuthResponse> GenerateTokensAsync(Usuario usuario);
        Task<AuthResponse?> RefreshTokenAsync(string refreshToken);
        Task RevokeTokenAsync(string refreshToken);
        Task RevokeAllUserTokensAsync(int userId);
        Task BlacklistTokenAsync(string jti, int userId, DateTime expiresAt);
        Task<bool> IsTokenBlacklistedAsync(string jti);
        Task CleanupExpiredTokensAsync();
    }
}