namespace CentroCultural.Domain.Entities
{
    public class TokenBlacklist
    {
        public Guid Id { get; set; }
        public string TokenJti { get; set; } = string.Empty; // JWT ID
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public int UserId { get; set; }
    }
}