namespace Back.CentroCultural.Application.DTOs
{
    public class LoginRequestDTO
    {
        public string NombreUsuario { get; set; } = string.Empty;
        public string Contrasena { get; set; } = string.Empty;
    }

    public class LoginResponseDTO
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public int IdUsuario { get; set; }
        public string NombreUsuario { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
        public string ExpiresAt { get; set; } = string.Empty;
    }

    public class ApiResponseDTO<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
    }

    // Compatibilidad con nombres en minúscula/camelCase
    public class LoginRequestDto : LoginRequestDTO { }
    public class LoginResponseDto : LoginResponseDTO { }
}
