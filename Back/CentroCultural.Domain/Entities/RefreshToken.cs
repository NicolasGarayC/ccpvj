using CentroCultural.Domain.Entities;

namespace CentroCultural.Domain.Entities
{
    public class RefreshToken
    {
        public Guid Id { get; set; }
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsRevoked { get; set; }
        public int UserId { get; set; }
        public Usuario Usuario { get; set; } = null!;
    }
}