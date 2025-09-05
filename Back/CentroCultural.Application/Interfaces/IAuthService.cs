using CentroCultural.Application.DTOs.Auth;
using CentroCultural.Application.Interfaces;
using CentroCultural.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CentroCultural.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse?> LoginAsync(LoginRequest request);
        Task<AuthResponse?> RefreshTokenAsync(RefreshTokenRequest request);
        Task<bool> LogoutAsync(string refreshToken);
        Task<bool> LogoutAllDevicesAsync(int userId);
    }
}
