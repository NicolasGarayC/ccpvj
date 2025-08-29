using System.Threading.Tasks;
using Back.CentroCultural.Application.DTOs;

namespace Back.CentroCultural.Application.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
        Task<bool> ValidateUserAsync(string username, string password);
    }
}
