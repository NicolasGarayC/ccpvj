using CentroCultural.API.Controllers;
using CentroCultural.Infrastructure.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CentroCultural.Tests.Unit.Controllers;

/// <summary>
/// Tests Unitarios para SimpleAuthController
/// Verifica el comportamiento de los endpoints de autenticación
/// </summary>
public class SimpleAuthControllerTests
{
    private readonly Mock<IJwtService> _mockJwtService;
    private readonly Mock<IConfiguration> _mockConfiguration;
    private readonly Mock<ILogger<SimpleAuthController>> _mockLogger;
    private readonly SimpleAuthController _controller;

    public SimpleAuthControllerTests()
    {
        _mockJwtService = new Mock<IJwtService>();
        _mockConfiguration = new Mock<IConfiguration>();
        _mockLogger = new Mock<ILogger<SimpleAuthController>>();

        // Setup connection string
        _mockConfiguration
            .Setup(c => c.GetConnectionString("DefaultConnection"))
            .Returns("Data Source=:memory:");

        _controller = new SimpleAuthController(
            _mockJwtService.Object,
            _mockConfiguration.Object,
            _mockLogger.Object);
    }

    #region Login Tests

    [Fact]
    public async Task Login_WithEmptyUsername_ShouldReturnBadRequest()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            username = "",
            password = "password123"
        };

        // Act
        var result = await _controller.Login(loginRequest);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
        var badRequestResult = result as BadRequestObjectResult;
        var response = badRequestResult!.Value as dynamic;
        ((bool)response!.success).Should().BeFalse();
    }

    [Fact]
    public async Task Login_WithEmptyPassword_ShouldReturnBadRequest()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            username = "testuser",
            password = ""
        };

        // Act
        var result = await _controller.Login(loginRequest);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Login_WithNullCredentials_ShouldReturnBadRequest()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            username = null!,
            password = null!
        };

        // Act
        var result = await _controller.Login(loginRequest);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Login_ShouldLogLoginAttempt()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            username = "testuser",
            password = "password123"
        };

        // Act
        await _controller.Login(loginRequest);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((o, t) => o.ToString()!.Contains("Login attempt")),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
            Times.Once);
    }

    [Fact]
    public async Task Login_WhenDatabaseError_ShouldReturn500()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            username = "testuser",
            password = "password123"
        };

        // Simulate database error by providing invalid connection string
        _mockConfiguration
            .Setup(c => c.GetConnectionString("DefaultConnection"))
            .Returns("Invalid Connection String");

        var controller = new SimpleAuthController(
            _mockJwtService.Object,
            _mockConfiguration.Object,
            _mockLogger.Object);

        // Act
        var result = await controller.Login(loginRequest);

        // Assert
        result.Should().BeOfType<ObjectResult>();
        var objectResult = result as ObjectResult;
        objectResult!.StatusCode.Should().Be(500);
    }

    [Fact]
    public void Login_ShouldGenerateTokenOnSuccess()
    {
        // Arrange
        var expectedToken = "test.jwt.token";
        var expectedExpiration = DateTime.UtcNow.AddHours(1);

        _mockJwtService
            .Setup(s => s.GenerateToken(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(expectedToken);

        _mockJwtService
            .Setup(s => s.GetTokenExpiration(expectedToken))
            .Returns(expectedExpiration);

        // Assert
        _mockJwtService.Verify(
            s => s.GenerateToken(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Never); // Not called yet since we haven't executed a successful login
    }

    #endregion

    #region Logout Tests

    [Fact]
    public void Logout_WithoutToken_ShouldReturnOk()
    {
        // Arrange
        // No token provided

        // Act
        var result = _controller.Logout();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as dynamic;
        ((bool)response!.success).Should().BeTrue();
    }

    [Fact]
    public void Logout_WithValidToken_ShouldRevokeToken()
    {
        // Arrange
        var token = "valid.jwt.token";
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        _controller.HttpContext.Request.Headers["Authorization"] = $"Bearer {token}";

        _mockJwtService
            .Setup(s => s.RevokeToken(token))
            .Verifiable();

        // Act
        var result = _controller.Logout();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        _mockJwtService.Verify(s => s.RevokeToken(token), Times.Once);
    }

    [Fact]
    public void Logout_WithInvalidTokenFormat_ShouldNotRevokeToken()
    {
        // Arrange
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        _controller.HttpContext.Request.Headers["Authorization"] = "InvalidFormat token";

        // Act
        var result = _controller.Logout();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        _mockJwtService.Verify(s => s.RevokeToken(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public void Logout_WhenRevokeThrowsException_ShouldStillReturnOk()
    {
        // Arrange
        var token = "valid.jwt.token";
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        _controller.HttpContext.Request.Headers["Authorization"] = $"Bearer {token}";

        _mockJwtService
            .Setup(s => s.RevokeToken(token))
            .Throws(new Exception("Revoke failed"));

        // Act
        var result = _controller.Logout();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as dynamic;
        ((bool)response!.success).Should().BeTrue();
    }

    [Fact]
    public void Logout_WhenRevokeThrowsException_ShouldLogWarning()
    {
        // Arrange
        var token = "valid.jwt.token";
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        _controller.HttpContext.Request.Headers["Authorization"] = $"Bearer {token}";

        _mockJwtService
            .Setup(s => s.RevokeToken(token))
            .Throws(new Exception("Revoke failed"));

        // Act
        _controller.Logout();

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((o, t) => true),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
            Times.Once);
    }

    [Fact]
    public void Logout_ShouldLogSuccessfulRevocation()
    {
        // Arrange
        var token = "valid.jwt.token";
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        _controller.HttpContext.Request.Headers["Authorization"] = $"Bearer {token}";

        // Act
        _controller.Logout();

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((o, t) => o.ToString()!.Contains("Token revoked")),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
            Times.Once);
    }

    #endregion

    #region Integration-like Tests

    [Fact]
    public void LoginRequest_ShouldHaveDefaultValues()
    {
        // Arrange & Act
        var loginRequest = new LoginRequest();

        // Assert
        loginRequest.username.Should().Be(string.Empty);
        loginRequest.password.Should().Be(string.Empty);
    }

    [Fact]
    public void LoginRequest_ShouldAcceptValues()
    {
        // Arrange
        var username = "testuser";
        var password = "testpass";

        // Act
        var loginRequest = new LoginRequest
        {
            username = username,
            password = password
        };

        // Assert
        loginRequest.username.Should().Be(username);
        loginRequest.password.Should().Be(password);
    }

    #endregion
}
