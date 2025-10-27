using CentroCultural.API.Controllers;
using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using Xunit;

namespace CentroCultural.Tests.Unit.Controllers;

/// <summary>
/// Tests Unitarios para DigitalLibraryController
/// Verifica el comportamiento de los endpoints HTTP de la biblioteca digital
/// </summary>
public class DigitalLibraryControllerTests
{
    private readonly Mock<IDigitalLibraryService> _mockService;
    private readonly Mock<ILogger<DigitalLibraryController>> _mockLogger;
    private readonly DigitalLibraryController _controller;

    public DigitalLibraryControllerTests()
    {
        _mockService = new Mock<IDigitalLibraryService>();
        _mockLogger = new Mock<ILogger<DigitalLibraryController>>();
        _controller = new DigitalLibraryController(_mockService.Object, _mockLogger.Object);
    }

    private void SetupUserClaims(string userId = "1", string role = "administrador")
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Role, role)
        };

        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    #region GET Tests

    [Fact]
    public async Task GetItems_WithValidSearch_ShouldReturnOkWithData()
    {
        // Arrange
        var searchDto = new LibrarySearchDto { PageNumber = 1, PageSize = 10 };
        var expectedResult = new LibraryItemPagedResultDto
        {
            Items = new List<LibraryItemSummaryDto>
            {
                new LibraryItemSummaryDto { Id = "1", Title = "Test Resource" }
            },
            TotalItems = 1,
            PageNumber = 1,
            PageSize = 10
        };

        _mockService
            .Setup(s => s.GetItemsAsync(It.IsAny<LibrarySearchDto>()))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.GetItems(searchDto);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedResult);
    }

    [Fact]
    public async Task GetItems_WhenServiceThrows_ShouldReturn500()
    {
        // Arrange
        var searchDto = new LibrarySearchDto();
        _mockService
            .Setup(s => s.GetItemsAsync(It.IsAny<LibrarySearchDto>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetItems(searchDto);

        // Assert
        result.Result.Should().BeOfType<ObjectResult>();
        var objectResult = result.Result as ObjectResult;
        objectResult!.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task GetItem_WithValidId_ShouldReturnOkWithItem()
    {
        // Arrange
        var itemId = "test-id";
        var expectedItem = new LibraryItemDto
        {
            Id = itemId,
            Title = "Test Resource",
            FileType = "PDF"
        };

        _mockService
            .Setup(s => s.GetItemByIdAsync(itemId))
            .ReturnsAsync(expectedItem);

        // Act
        var result = await _controller.GetItem(itemId);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedItem);
    }

    [Fact]
    public async Task GetItem_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        var itemId = "non-existent";
        _mockService
            .Setup(s => s.GetItemByIdAsync(itemId))
            .ReturnsAsync((LibraryItemDto?)null);

        // Act
        var result = await _controller.GetItem(itemId);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetCollections_ShouldReturnOkWithCollections()
    {
        // Arrange
        var expectedCollections = new List<LibraryCollectionDto>
        {
            new LibraryCollectionDto { Id = "1", Name = "Collection 1" },
            new LibraryCollectionDto { Id = "2", Name = "Collection 2" }
        };

        _mockService
            .Setup(s => s.GetCollectionsAsync())
            .ReturnsAsync(expectedCollections);

        // Act
        var result = await _controller.GetCollections();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var collections = okResult!.Value as IEnumerable<LibraryCollectionDto>;
        collections.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetCollection_WithValidId_ShouldReturnOkWithCollection()
    {
        // Arrange
        var collectionId = "test-id";
        var expectedCollection = new LibraryCollectionDto
        {
            Id = collectionId,
            Name = "Test Collection"
        };

        _mockService
            .Setup(s => s.GetCollectionByIdAsync(collectionId))
            .ReturnsAsync(expectedCollection);

        // Act
        var result = await _controller.GetCollection(collectionId);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedCollection);
    }

    [Fact]
    public async Task GetCollection_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        var collectionId = "non-existent";
        _mockService
            .Setup(s => s.GetCollectionByIdAsync(collectionId))
            .ReturnsAsync((LibraryCollectionDto?)null);

        // Act
        var result = await _controller.GetCollection(collectionId);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region POST/PUT/DELETE Tests

    [Fact]
    public async Task CreateItem_WithValidDataAsAdmin_ShouldReturnCreatedAtAction()
    {
        // Arrange
        SetupUserClaims("1", "administrador");
        var createDto = new CreateLibraryItemDto
        {
            Title = "New Resource",
            FileType = "PDF"
        };

        var createdItem = new LibraryItemDto
        {
            Id = "new-id",
            Title = createDto.Title,
            FileType = createDto.FileType
        };

        _mockService
            .Setup(s => s.CreateItemAsync(createDto, 1))
            .ReturnsAsync(createdItem);

        // Act
        var result = await _controller.CreateItem(createDto);

        // Assert
        result.Result.Should().BeOfType<CreatedAtActionResult>();
        var createdResult = result.Result as CreatedAtActionResult;
        createdResult!.ActionName.Should().Be(nameof(_controller.GetItem));
        createdResult.RouteValues!["id"].Should().Be("new-id");
    }

    [Fact]
    public async Task CreateItem_WithValidDataAsColaborador_ShouldReturnCreatedAtAction()
    {
        // Arrange
        SetupUserClaims("1", "colaborador");
        var createDto = new CreateLibraryItemDto
        {
            Title = "New Resource",
            FileType = "Video"
        };

        var createdItem = new LibraryItemDto
        {
            Id = "new-id",
            Title = createDto.Title
        };

        _mockService
            .Setup(s => s.CreateItemAsync(createDto, 1))
            .ReturnsAsync(createdItem);

        // Act
        var result = await _controller.CreateItem(createDto);

        // Assert
        result.Result.Should().BeOfType<CreatedAtActionResult>();
    }

    [Fact]
    public async Task CreateItem_WithInvalidRole_ShouldReturnForbid()
    {
        // Arrange
        SetupUserClaims("1", "usuario"); // Usuario regular sin permisos
        var createDto = new CreateLibraryItemDto { Title = "Test" };

        // Act
        var result = await _controller.CreateItem(createDto);

        // Assert
        result.Result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task CreateItem_WithoutUserId_ShouldReturnUnauthorized()
    {
        // Arrange
        // No se configuran claims
        var createDto = new CreateLibraryItemDto { Title = "Test" };

        // Act
        var result = await _controller.CreateItem(createDto);

        // Assert
        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task UpdateItem_WithValidDataAsAdmin_ShouldReturnNoContent()
    {
        // Arrange
        SetupUserClaims("1", "administrador");
        var itemId = "test-id";
        var updateDto = new UpdateLibraryItemDto { Title = "Updated Title" };

        _mockService
            .Setup(s => s.UpdateItemAsync(itemId, updateDto, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.UpdateItem(itemId, updateDto);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task UpdateItem_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        SetupUserClaims("1", "administrador");
        var itemId = "non-existent";
        var updateDto = new UpdateLibraryItemDto { Title = "Updated Title" };

        _mockService
            .Setup(s => s.UpdateItemAsync(itemId, updateDto, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.UpdateItem(itemId, updateDto);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task UpdateItem_WithInvalidRole_ShouldReturnForbid()
    {
        // Arrange
        SetupUserClaims("1", "usuario");
        var itemId = "test-id";
        var updateDto = new UpdateLibraryItemDto { Title = "Updated Title" };

        // Act
        var result = await _controller.UpdateItem(itemId, updateDto);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task DeleteItem_WithValidIdAsAdmin_ShouldReturnNoContent()
    {
        // Arrange
        SetupUserClaims("1", "administrador");
        var itemId = "test-id";

        _mockService
            .Setup(s => s.DeleteItemAsync(itemId, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteItem(itemId);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task DeleteItem_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        SetupUserClaims("1", "administrador");
        var itemId = "non-existent";

        _mockService
            .Setup(s => s.DeleteItemAsync(itemId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteItem(itemId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task DeleteItem_WithInvalidRole_ShouldReturnForbid()
    {
        // Arrange
        SetupUserClaims("1", "usuario");
        var itemId = "test-id";

        // Act
        var result = await _controller.DeleteItem(itemId);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    #endregion

    #region Error Handling Tests

    [Fact]
    public async Task GetItems_WhenServiceThrows_ShouldLogError()
    {
        // Arrange
        var searchDto = new LibrarySearchDto();
        _mockService
            .Setup(s => s.GetItemsAsync(It.IsAny<LibrarySearchDto>()))
            .ThrowsAsync(new Exception("Test error"));

        // Act
        await _controller.GetItems(searchDto);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((o, t) => true),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
            Times.Once);
    }

    [Fact]
    public async Task CreateItem_WhenServiceThrows_ShouldReturn500()
    {
        // Arrange
        SetupUserClaims("1", "administrador");
        var createDto = new CreateLibraryItemDto { Title = "Test" };

        _mockService
            .Setup(s => s.CreateItemAsync(It.IsAny<CreateLibraryItemDto>(), It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.CreateItem(createDto);

        // Assert
        result.Result.Should().BeOfType<ObjectResult>();
        var objectResult = result.Result as ObjectResult;
        objectResult!.StatusCode.Should().Be(500);
    }

    #endregion
}
