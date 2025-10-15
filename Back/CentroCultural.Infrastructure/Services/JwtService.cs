using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CentroCultural.Infrastructure.Configuration;
using System.Collections.Concurrent;
using System.Linq;

namespace CentroCultural.Infrastructure.Services
{
    public interface IJwtService
    {
        string GenerateToken(int userId, string username, string role, string? nombre = null, string? apellido = null);
        ClaimsPrincipal? ValidateToken(string token);
        int? GetUserIdFromToken(string token);
        string? GetUsernameFromToken(string token);
        string? GetRoleFromToken(string token);
        bool IsTokenValid(string token);
        DateTime GetTokenExpiration(string token);
        void RevokeToken(string token);
        bool IsTokenRevoked(string token);
    }

    public class JwtService : IJwtService
    {
        private readonly JwtSettings _jwtSettings;
        private readonly ILogger<JwtService> _logger;
        private static readonly ConcurrentDictionary<string, DateTime> _revokedTokens = new();

        public JwtService(IOptions<JwtSettings> jwtSettings, ILogger<JwtService> logger)
        {
            _jwtSettings = jwtSettings.Value;
            _logger = logger;
        }

        public string GenerateToken(int userId, string username, string role, string? nombre = null, string? apellido = null)
        {
            try
            {
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
                var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var claims = new List<Claim>
                {
                    new(JwtRegisteredClaimNames.Sub, userId.ToString()),
                    new(JwtRegisteredClaimNames.UniqueName, username),
                    new(ClaimTypes.NameIdentifier, userId.ToString()),
                    new(ClaimTypes.Name, username),
                    new(ClaimTypes.Role, role),
                    new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                    new(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
                };

                // Añadir claims opcionales si están disponibles
                if (!string.IsNullOrEmpty(nombre))
                    claims.Add(new Claim("nombre", nombre));

                if (!string.IsNullOrEmpty(apellido))
                    claims.Add(new Claim("apellido", apellido));

                var token = new JwtSecurityToken(
                    issuer: _jwtSettings.Issuer,
                    audience: _jwtSettings.Audience,
                    claims: claims,
                    expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes),
                    signingCredentials: credentials
                );

                var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

                _logger.LogInformation("JWT token generated successfully for user {Username} (ID: {UserId})", username, userId);
                return tokenString;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating JWT token for user {Username} (ID: {UserId})", username, userId);
                throw;
            }
        }

        public ClaimsPrincipal? ValidateToken(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(_jwtSettings.SecretKey);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = _jwtSettings.ValidateIssuerSigningKey,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = _jwtSettings.ValidateIssuer,
                    ValidIssuer = _jwtSettings.Issuer,
                    ValidateAudience = _jwtSettings.ValidateAudience,
                    ValidAudience = _jwtSettings.Audience,
                    ValidateLifetime = _jwtSettings.ValidateLifetime,
                    ClockSkew = TimeSpan.FromMinutes(_jwtSettings.ClockSkewMinutes)
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);

                if (IsTokenRevoked(token))
                {
                    _logger.LogWarning("JWT token has been revoked and is no longer valid");
                    return null;
                }

                _logger.LogDebug("JWT token validated successfully");
                return principal;
            }
            catch (SecurityTokenExpiredException)
            {
                _logger.LogWarning("JWT token has expired");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "JWT token validation failed");
                return null;
            }
        }

        public int? GetUserIdFromToken(string token)
        {
            var principal = ValidateToken(token);
            if (principal == null) return null;

            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }

        public string? GetUsernameFromToken(string token)
        {
            var principal = ValidateToken(token);
            return principal?.FindFirst(ClaimTypes.Name)?.Value;
        }

        public string? GetRoleFromToken(string token)
        {
            var principal = ValidateToken(token);
            return principal?.FindFirst(ClaimTypes.Role)?.Value;
        }

        public bool IsTokenValid(string token)
        {
            return ValidateToken(token) != null;
        }

        public void RevokeToken(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return;
            }

            try
            {
                CleanupRevokedTokens();
                var expiration = GetTokenExpiration(token);
                if (expiration == DateTime.MinValue)
                {
                    expiration = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes);
                }

                _revokedTokens[token] = expiration.ToUniversalTime();
                _logger.LogInformation("JWT token revoked until {Expiration}", expiration);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to revoke JWT token");
            }
        }

        public bool IsTokenRevoked(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return false;
            }

            CleanupRevokedTokens();
            return _revokedTokens.ContainsKey(token);
        }

        private void CleanupRevokedTokens()
        {
            foreach (var entry in _revokedTokens.ToArray())
            {
                if (entry.Value <= DateTime.UtcNow)
                {
                    _revokedTokens.TryRemove(entry.Key, out _);
                }
            }
        }

        public DateTime GetTokenExpiration(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var jwtToken = tokenHandler.ReadJwtToken(token);
                return jwtToken.ValidTo.ToUniversalTime();
            }
            catch
            {
                return DateTime.MinValue;
            }
        }
    }
}
