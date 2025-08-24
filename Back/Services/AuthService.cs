using System.Threading.Tasks;
using Back.DTOs;

namespace Back.Services
{
    public class AuthService : IAuthService
    {
        public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
        {
            // Implementación simulada para compilación
            if (request.NombreUsuario == "admin" && request.Contrasena == "admin123")
            {
                return new LoginResponseDto
                {
                    Success = true,
                    Token = "fake-jwt-token",
                    IdUsuario = 1,
                    NombreUsuario = "admin",
                    Rol = "Educador"
                };
            }
            return new LoginResponseDto { Success = false };
        }

        public async Task<bool> ValidateUserAsync(string username, string password)
        {
            // Implementación simulada para compilación
            return username == "admin" && password == "admin123";
        }
    }
}
