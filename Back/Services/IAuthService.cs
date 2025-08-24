using System.Threading.Tasks;
using Back.DTOs;

namespace Back.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
        Task<bool> ValidateUserAsync(string username, string password);
    }
}
