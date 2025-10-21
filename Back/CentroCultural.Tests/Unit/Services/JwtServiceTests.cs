using CentroCultural.Infrastructure.Services;
using CentroCultural.Infrastructure.Configuration;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using System.Security.Claims;

namespace CentroCultural.Tests.Unit.Services;

/// <summary>
/// Tests Unitarios para JwtService
/// Cubre generación, validación y revocación de tokens JWT
/// </summary>
public class JwtServiceTests
{
    private readonly JwtService _service;
    private readonly Mock<ILogger<JwtService>> _mockLogger;
    private readonly JwtSettings _jwtSettings;

    public JwtServiceTests()
    {
        // Configurar settings de JWT para tests
        _jwtSettings = new JwtSettings
        {
            SecretKey = "super-secret-key-for-testing-at-least-32-characters-long",
            Issuer = "TestIssuer",
            Audience = "TestAudience",
            ExpirationMinutes = 60,
            ValidateIssuerSigningKey = true,
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ClockSkewMinutes = 5
        };

        var optionsMock = new Mock<IOptions<JwtSettings>>();
        optionsMock.Setup(o => o.Value).Returns(_jwtSettings);

        _mockLogger = new Mock<ILogger<JwtService>>();

        _service = new JwtService(optionsMock.Object, _mockLogger.Object);
    }

    #region Token Generation

    [Fact]
    public void GenerateToken_WithValidData_ShouldReturnToken()
    {
        // Arrange
        var userId = 1;
        var username = "testuser";
        var role = "administrador";

        // Act
        var token = _service.GenerateToken(userId, username, role);

        // Assert
        token.Should().NotBeNullOrEmpty();
        token.Split('.').Should().HaveCount(3); // Header.Payload.Signature
    }

    [Fact]
    public void GenerateToken_WithOptionalFields_ShouldIncludeInToken()
    {
        // Arrange
        var userId = 1;
        var username = "testuser";
        var role = "autor";
        var nombre = "Juan";
        var apellido = "Pérez";

        // Act
        var token = _service.GenerateToken(userId, username, role, nombre, apellido);

        // Assert
        token.Should().NotBeNullOrEmpty();

        // Verificar que los claims opcionales están presentes
        var principal = _service.ValidateToken(token);
        principal.Should().NotBeNull();
        principal!.FindFirst("nombre")?.Value.Should().Be(nombre);
        principal.FindFirst("apellido")?.Value.Should().Be(apellido);
    }

    [Fact]
    public void GenerateToken_ShouldIncludeRequiredClaims()
    {
        // Arrange
        var userId = 1;
        var username = "testuser";
        var role = "autor";

        // Act
        var token = _service.GenerateToken(userId, username, role);
        var principal = _service.ValidateToken(token);

        // Assert
        principal.Should().NotBeNull();
        principal!.FindFirst(ClaimTypes.NameIdentifier)?.Value.Should().Be(userId.ToString());
        principal.FindFirst(ClaimTypes.Name)?.Value.Should().Be(username);
        principal.FindFirst(ClaimTypes.Role)?.Value.Should().Be(role);
    }

    #endregion

    #region Token Validation

    [Fact]
    public void ValidateToken_WithValidToken_ShouldReturnPrincipal()
    {
        // Arrange
        var token = _service.GenerateToken(1, "testuser", "administrador");

        // Act
        var principal = _service.ValidateToken(token);

        // Assert
        principal.Should().NotBeNull();
        principal!.Identity!.IsAuthenticated.Should().BeTrue();
    }

    [Fact]
    public void ValidateToken_WithInvalidToken_ShouldReturnNull()
    {
        // Arrange
        var invalidToken = "invalid.token.here";

        // Act
        var principal = _service.ValidateToken(invalidToken);

        // Assert
        principal.Should().BeNull();
    }

    [Fact]
    public void ValidateToken_WithRevokedToken_ShouldReturnNull()
    {
        // Arrange
        var token = _service.GenerateToken(1, "testuser", "administrador");
        _service.RevokeToken(token);

        // Act
        var principal = _service.ValidateToken(token);

        // Assert
        principal.Should().BeNull();
    }

    [Fact]
    public void IsTokenValid_WithValidToken_ShouldReturnTrue()
    {
        // Arrange
        var token = _service.GenerateToken(1, "testuser", "administrador");

        // Act
        var isValid = _service.IsTokenValid(token);

        // Assert
        isValid.Should().BeTrue();
    }

    [Fact]
    public void IsTokenValid_WithInvalidToken_ShouldReturnFalse()
    {
        // Arrange
        var invalidToken = "invalid.token.here";

        // Act
        var isValid = _service.IsTokenValid(invalidToken);

        // Assert
        isValid.Should().BeFalse();
    }

    #endregion

    #region Extract Claims

    [Fact]
    public void GetUserIdFromToken_WithValidToken_ShouldReturnUserId()
    {
        // Arrange
        var expectedUserId = 42;
        var token = _service.GenerateToken(expectedUserId, "testuser", "autor");

        // Act
        var userId = _service.GetUserIdFromToken(token);

        // Assert
        userId.Should().Be(expectedUserId);
    }

    [Fact]
    public void GetUserIdFromToken_WithInvalidToken_ShouldReturnNull()
    {
        // Arrange
        var invalidToken = "invalid.token.here";

        // Act
        var userId = _service.GetUserIdFromToken(invalidToken);

        // Assert
        userId.Should().BeNull();
    }

    [Fact]
    public void GetUsernameFromToken_WithValidToken_ShouldReturnUsername()
    {
        // Arrange
        var expectedUsername = "testuser";
        var token = _service.GenerateToken(1, expectedUsername, "autor");

        // Act
        var username = _service.GetUsernameFromToken(token);

        // Assert
        username.Should().Be(expectedUsername);
    }

    [Fact]
    public void GetUsernameFromToken_WithInvalidToken_ShouldReturnNull()
    {
        // Arrange
        var invalidToken = "invalid.token.here";

        // Act
        var username = _service.GetUsernameFromToken(invalidToken);

        // Assert
        username.Should().BeNull();
    }

    [Fact]
    public void GetRoleFromToken_WithValidToken_ShouldReturnRole()
    {
        // Arrange
        var expectedRole = "administrador";
        var token = _service.GenerateToken(1, "testuser", expectedRole);

        // Act
        var role = _service.GetRoleFromToken(token);

        // Assert
        role.Should().Be(expectedRole);
    }

    [Fact]
    public void GetRoleFromToken_WithInvalidToken_ShouldReturnNull()
    {
        // Arrange
        var invalidToken = "invalid.token.here";

        // Act
        var role = _service.GetRoleFromToken(invalidToken);

        // Assert
        role.Should().BeNull();
    }

    #endregion

    #region Token Expiration

    [Fact]
    public void GetTokenExpiration_WithValidToken_ShouldReturnExpirationDate()
    {
        // Arrange
        var token = _service.GenerateToken(1, "testuser", "administrador");

        // Act
        var expiration = _service.GetTokenExpiration(token);

        // Assert
        expiration.Should().BeAfter(DateTime.UtcNow);
        expiration.Should().BeBefore(DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes + 1));
    }

    [Fact]
    public void GetTokenExpiration_WithInvalidToken_ShouldReturnMinValue()
    {
        // Arrange
        var invalidToken = "invalid.token.here";

        // Act
        var expiration = _service.GetTokenExpiration(invalidToken);

        // Assert
        expiration.Should().Be(DateTime.MinValue);
    }

    #endregion

    #region Token Revocation

    [Fact]
    public void RevokeToken_WithValidToken_ShouldMarkAsRevoked()
    {
        // Arrange
        var token = _service.GenerateToken(1, "testuser", "administrador");

        // Act
        _service.RevokeToken(token);
        var isRevoked = _service.IsTokenRevoked(token);

        // Assert
        isRevoked.Should().BeTrue();
    }

    [Fact]
    public void IsTokenRevoked_WithNonRevokedToken_ShouldReturnFalse()
    {
        // Arrange
        var token = _service.GenerateToken(1, "testuser", "administrador");

        // Act
        var isRevoked = _service.IsTokenRevoked(token);

        // Assert
        isRevoked.Should().BeFalse();
    }

    [Fact]
    public void RevokeToken_WithEmptyToken_ShouldNotThrowException()
    {
        // Arrange
        var emptyToken = "";

        // Act & Assert
        var act = () => _service.RevokeToken(emptyToken);
        act.Should().NotThrow();
    }

    [Fact]
    public void IsTokenRevoked_WithEmptyToken_ShouldReturnFalse()
    {
        // Arrange
        var emptyToken = "";

        // Act
        var isRevoked = _service.IsTokenRevoked(emptyToken);

        // Assert
        isRevoked.Should().BeFalse();
    }

    #endregion

    #region Multiple Roles

    [Theory]
    [InlineData("administrador")]
    [InlineData("autor")]
    [InlineData("colaborador")]
    [InlineData("asistente")]
    public void GenerateToken_WithDifferentRoles_ShouldIncludeRole(string role)
    {
        // Arrange & Act
        var token = _service.GenerateToken(1, "testuser", role);
        var extractedRole = _service.GetRoleFromToken(token);

        // Assert
        extractedRole.Should().Be(role);
    }

    #endregion
}
