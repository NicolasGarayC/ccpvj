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
/// Tests Unitarios para MaterialApoyoController
/// Verifica el comportamiento de los endpoints HTTP y el manejo de errores
/// </summary>
public class MaterialApoyoControllerTests
{
    private readonly Mock<IMaterialApoyoService> _mockService;
    private readonly Mock<ILogger<MaterialApoyoController>> _mockLogger;
    private readonly MaterialApoyoController _controller;

    public MaterialApoyoControllerTests()
    {
        _mockService = new Mock<IMaterialApoyoService>();
        _mockLogger = new Mock<ILogger<MaterialApoyoController>>();
        _controller = new MaterialApoyoController(_mockService.Object, _mockLogger.Object);
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

    #region GET MaterialApoyo Tests

    [Fact]
    public async Task GetMaterialApoyo_WithValidSearch_ShouldReturnOkWithData()
    {
        // Arrange
        var searchDto = new MaterialApoyoSearchDto { PageNumber = 1, PageSize = 10 };
        var expectedResult = new MaterialApoyoPagedResultDto
        {
            Items = new List<MaterialApoyoSummaryDto>
            {
                new MaterialApoyoSummaryDto { Id = "1", Title = "Test Material" }
            },
            TotalItems = 1,
            PageNumber = 1,
            PageSize = 10
        };

        _mockService
            .Setup(s => s.GetMaterialApoyoAsync(It.IsAny<MaterialApoyoSearchDto>()))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.GetMaterialApoyo(searchDto);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedResult);
        _mockService.Verify(s => s.GetMaterialApoyoAsync(searchDto), Times.Once);
    }

    [Fact]
    public async Task GetMaterialApoyo_WhenServiceThrowsException_ShouldReturn500()
    {
        // Arrange
        var searchDto = new MaterialApoyoSearchDto();
        _mockService
            .Setup(s => s.GetMaterialApoyoAsync(It.IsAny<MaterialApoyoSearchDto>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetMaterialApoyo(searchDto);

        // Assert
        result.Result.Should().BeOfType<ObjectResult>();
        var objectResult = result.Result as ObjectResult;
        objectResult!.StatusCode.Should().Be(500);
        objectResult.Value.Should().Be("Error interno del servidor");
    }

    [Fact]
    public async Task GetAllMaterialApoyo_ShouldReturnOkWithAllMaterials()
    {
        // Arrange
        var expectedMaterials = new List<MaterialApoyoSummaryDto>
        {
            new MaterialApoyoSummaryDto { Id = "1", Title = "Material 1" },
            new MaterialApoyoSummaryDto { Id = "2", Title = "Material 2" }
        };

        _mockService
            .Setup(s => s.GetAllMaterialApoyoAsync())
            .ReturnsAsync(expectedMaterials);

        // Act
        var result = await _controller.GetAllMaterialApoyo();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var materials = okResult!.Value as IEnumerable<MaterialApoyoSummaryDto>;
        materials.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetFeaturedMaterialApoyo_WithCount_ShouldReturnOkWithFeaturedMaterials()
    {
        // Arrange
        var count = 3;
        var expectedMaterials = new List<MaterialApoyoSummaryDto>
        {
            new MaterialApoyoSummaryDto { Id = "1", Title = "Featured 1", IsFeatured = true },
            new MaterialApoyoSummaryDto { Id = "2", Title = "Featured 2", IsFeatured = true },
            new MaterialApoyoSummaryDto { Id = "3", Title = "Featured 3", IsFeatured = true }
        };

        _mockService
            .Setup(s => s.GetFeaturedMaterialApoyoAsync(count))
            .ReturnsAsync(expectedMaterials);

        // Act
        var result = await _controller.GetFeaturedMaterialApoyo(count);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var materials = okResult!.Value as IEnumerable<MaterialApoyoSummaryDto>;
        materials.Should().HaveCount(3);
        materials.Should().OnlyContain(m => m.IsFeatured == true);
    }

    [Fact]
    public async Task GetMaterialApoyoById_WithValidId_ShouldReturnOkWithMaterial()
    {
        // Arrange
        var materialId = "test-id";
        var expectedMaterial = new MaterialApoyoDetailDto
        {
            Id = materialId,
            Title = "Test Material",
            Description = "Test Description"
        };

        _mockService
            .Setup(s => s.GetMaterialApoyoByIdAsync(materialId))
            .ReturnsAsync(expectedMaterial);

        // Act
        var result = await _controller.GetMaterialApoyo(materialId);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedMaterial);
    }

    [Fact]
    public async Task GetMaterialApoyoById_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        var materialId = "non-existent";
        _mockService
            .Setup(s => s.GetMaterialApoyoByIdAsync(materialId))
            .ReturnsAsync((MaterialApoyoDetailDto?)null);

        // Act
        var result = await _controller.GetMaterialApoyo(materialId);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
        var notFoundResult = result.Result as NotFoundObjectResult;
        notFoundResult!.Value.Should().Be($"Material de apoyo con ID {materialId} no encontrado");
    }

    [Fact]
    public async Task GetMaterialApoyoModules_WithValidId_ShouldReturnOkWithModules()
    {
        // Arrange
        var materialId = "test-id";
        var expectedModules = new List<ModuleSummaryDto>
        {
            new ModuleSummaryDto { Id = "mod-1", Title = "Module 1" },
            new ModuleSummaryDto { Id = "mod-2", Title = "Module 2" }
        };

        _mockService
            .Setup(s => s.GetMaterialApoyoModulesAsync(materialId))
            .ReturnsAsync(expectedModules);

        // Act
        var result = await _controller.GetMaterialApoyoModules(materialId);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var modules = okResult!.Value as IEnumerable<ModuleSummaryDto>;
        modules.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetMyMaterialApoyo_ShouldReturnOkWithUserMaterials()
    {
        // Arrange
        SetupUserClaims("1");
        var expectedMaterials = new List<MaterialApoyoSummaryDto>
        {
            new MaterialApoyoSummaryDto { Id = "1", Title = "My Material 1", EducatorId = "1" }
        };

        _mockService
            .Setup(s => s.GetMaterialApoyoByEducatorAsync(1))
            .ReturnsAsync(expectedMaterials);

        // Act
        var result = await _controller.GetMyMaterialApoyo();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var materials = okResult!.Value as IEnumerable<MaterialApoyoSummaryDto>;
        materials.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetMaterialApoyoStatistics_ShouldReturnOkWithStatistics()
    {
        // Arrange
        var expectedStats = new { TotalMaterials = 10, TotalModules = 25, TotalPosts = 100 };

        _mockService
            .Setup(s => s.GetMaterialApoyoStatisticsAsync())
            .ReturnsAsync(expectedStats);

        // Act
        var result = await _controller.GetMaterialApoyoStatistics();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedStats);
    }

    #endregion

    #region POST/PUT/DELETE MaterialApoyo Tests

    [Fact]
    public async Task CreateMaterialApoyo_WithValidData_ShouldReturnCreatedAtAction()
    {
        // Arrange
        SetupUserClaims("1");
        var createDto = new CreateMaterialApoyoDto
        {
            Title = "New Material",
            Description = "New Description"
        };

        var createdMaterial = new MaterialApoyoDto
        {
            Id = "new-id",
            Title = createDto.Title,
            Description = createDto.Description
        };

        _mockService
            .Setup(s => s.CreateMaterialApoyoAsync(createDto, 1))
            .ReturnsAsync(createdMaterial);

        // Act
        var result = await _controller.CreateMaterialApoyo(createDto);

        // Assert
        result.Result.Should().BeOfType<CreatedAtActionResult>();
        var createdResult = result.Result as CreatedAtActionResult;
        createdResult!.ActionName.Should().Be(nameof(_controller.GetMaterialApoyo));
        createdResult.RouteValues!["id"].Should().Be("new-id");
        createdResult.Value.Should().BeEquivalentTo(createdMaterial);
    }

    [Fact]
    public async Task CreateMaterialApoyo_WhenUnauthorized_ShouldReturnForbid()
    {
        // Arrange
        SetupUserClaims("1");
        var createDto = new CreateMaterialApoyoDto { Title = "Test" };

        _mockService
            .Setup(s => s.CreateMaterialApoyoAsync(It.IsAny<CreateMaterialApoyoDto>(), It.IsAny<int>()))
            .ThrowsAsync(new UnauthorizedAccessException());

        // Act
        var result = await _controller.CreateMaterialApoyo(createDto);

        // Assert
        result.Result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task CreateMaterialApoyo_WithInvalidData_ShouldReturnBadRequest()
    {
        // Arrange
        SetupUserClaims("1");
        var createDto = new CreateMaterialApoyoDto { Title = "" }; // Invalid

        _mockService
            .Setup(s => s.CreateMaterialApoyoAsync(It.IsAny<CreateMaterialApoyoDto>(), It.IsAny<int>()))
            .ThrowsAsync(new ArgumentException("Title is required"));

        // Act
        var result = await _controller.CreateMaterialApoyo(createDto);

        // Assert
        result.Result.Should().BeOfType<BadRequestObjectResult>();
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult!.Value.Should().Be("Title is required");
    }

    [Fact]
    public async Task UpdateMaterialApoyo_WithValidData_ShouldReturnNoContent()
    {
        // Arrange
        SetupUserClaims("1");
        var materialId = "test-id";
        var updateDto = new UpdateMaterialApoyoDto { Title = "Updated Title" };

        _mockService
            .Setup(s => s.UpdateMaterialApoyoAsync(materialId, updateDto, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.UpdateMaterialApoyo(materialId, updateDto);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task UpdateMaterialApoyo_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        SetupUserClaims("1");
        var materialId = "non-existent";
        var updateDto = new UpdateMaterialApoyoDto { Title = "Updated Title" };

        _mockService
            .Setup(s => s.UpdateMaterialApoyoAsync(materialId, updateDto, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.UpdateMaterialApoyo(materialId, updateDto);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task DeleteMaterialApoyo_WithValidId_ShouldReturnNoContent()
    {
        // Arrange
        var materialId = "test-id";

        _mockService
            .Setup(s => s.DeleteMaterialApoyoAsync(materialId, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteMaterialApoyo(materialId);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task DeleteMaterialApoyo_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        var materialId = "non-existent";

        _mockService
            .Setup(s => s.DeleteMaterialApoyoAsync(materialId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteMaterialApoyo(materialId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region Module Tests

    [Fact]
    public async Task GetModule_WithValidId_ShouldReturnOkWithModule()
    {
        // Arrange
        var moduleId = "mod-1";
        var expectedModule = new ModuleDetailDto
        {
            Id = moduleId,
            Title = "Test Module"
        };

        _mockService
            .Setup(s => s.GetModuleByIdAsync(moduleId))
            .ReturnsAsync(expectedModule);

        // Act
        var result = await _controller.GetModule(moduleId);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedModule);
    }

    [Fact]
    public async Task GetModule_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        var moduleId = "non-existent";

        _mockService
            .Setup(s => s.GetModuleByIdAsync(moduleId))
            .ReturnsAsync((ModuleDetailDto?)null);

        // Act
        var result = await _controller.GetModule(moduleId);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task CreateModule_WithValidData_ShouldReturnCreatedAtAction()
    {
        // Arrange
        SetupUserClaims("1");
        var createDto = new CreateModuleDto
        {
            Title = "New Module",
            MaterialApoyoId = "mat-1"
        };

        var createdModule = new ModuleDto
        {
            Id = "new-mod-id",
            Title = createDto.Title
        };

        _mockService
            .Setup(s => s.CreateModuleAsync(createDto, 1))
            .ReturnsAsync(createdModule);

        // Act
        var result = await _controller.CreateModule(createDto);

        // Assert
        result.Result.Should().BeOfType<CreatedAtActionResult>();
        var createdResult = result.Result as CreatedAtActionResult;
        createdResult!.RouteValues!["id"].Should().Be("new-mod-id");
    }

    [Fact]
    public async Task UpdateModule_WithValidData_ShouldReturnNoContent()
    {
        // Arrange
        SetupUserClaims("1");
        var moduleId = "mod-1";
        var updateDto = new UpdateModuleDto { Title = "Updated Module" };

        _mockService
            .Setup(s => s.UpdateModuleAsync(moduleId, updateDto, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.UpdateModule(moduleId, updateDto);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task DeleteModule_WithValidId_ShouldReturnNoContent()
    {
        // Arrange
        SetupUserClaims("1");
        var moduleId = "mod-1";

        _mockService
            .Setup(s => s.DeleteModuleAsync(moduleId, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteModule(moduleId);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task ReorderModule_WithValidData_ShouldReturnNoContent()
    {
        // Arrange
        SetupUserClaims("1");
        var moduleId = "mod-1";
        var reorderDto = new ReorderModuleDto { NewOrderNumber = 5 };

        _mockService
            .Setup(s => s.ReorderModuleAsync(moduleId, reorderDto.NewOrderNumber, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.ReorderModule(moduleId, reorderDto);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    #endregion

    #region ModulePost Tests

    [Fact]
    public async Task GetModulePosts_WithValidModuleId_ShouldReturnOkWithPosts()
    {
        // Arrange
        var moduleId = "mod-1";
        var expectedPosts = new List<ModulePostDto>
        {
            new ModulePostDto { Id = "post-1", Title = "Post 1" },
            new ModulePostDto { Id = "post-2", Title = "Post 2" }
        };

        _mockService
            .Setup(s => s.GetModulePostsAsync(moduleId))
            .ReturnsAsync(expectedPosts);

        // Act
        var result = await _controller.GetModulePosts(moduleId);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var posts = okResult!.Value as IEnumerable<ModulePostDto>;
        posts.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetPost_WithValidId_ShouldReturnOkWithPost()
    {
        // Arrange
        var postId = "post-1";
        var expectedPost = new ModulePostDto
        {
            Id = postId,
            Title = "Test Post"
        };

        _mockService
            .Setup(s => s.GetPostByIdAsync(postId))
            .ReturnsAsync(expectedPost);

        // Act
        var result = await _controller.GetPost(postId);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedPost);
    }

    [Fact]
    public async Task GetPost_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        var postId = "non-existent";

        _mockService
            .Setup(s => s.GetPostByIdAsync(postId))
            .ReturnsAsync((ModulePostDto?)null);

        // Act
        var result = await _controller.GetPost(postId);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task CreatePost_WithValidData_ShouldReturnCreatedAtAction()
    {
        // Arrange
        SetupUserClaims("1");
        var createDto = new CreateModulePostDto
        {
            Title = "New Post",
            ModuleId = "mod-1"
        };

        var createdPost = new ModulePostDto
        {
            Id = "new-post-id",
            Title = createDto.Title
        };

        _mockService
            .Setup(s => s.CreatePostAsync(createDto, 1))
            .ReturnsAsync(createdPost);

        // Act
        var result = await _controller.CreatePost(createDto);

        // Assert
        result.Result.Should().BeOfType<CreatedAtActionResult>();
        var createdResult = result.Result as CreatedAtActionResult;
        createdResult!.RouteValues!["id"].Should().Be("new-post-id");
    }

    [Fact]
    public async Task UpdatePost_WithValidData_ShouldReturnNoContent()
    {
        // Arrange
        SetupUserClaims("1");
        var postId = "post-1";
        var updateDto = new UpdateModulePostDto { Title = "Updated Post" };

        _mockService
            .Setup(s => s.UpdatePostAsync(postId, updateDto, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.UpdatePost(postId, updateDto);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task DeletePost_WithValidId_ShouldReturnNoContent()
    {
        // Arrange
        SetupUserClaims("1");
        var postId = "post-1";

        _mockService
            .Setup(s => s.DeletePostAsync(postId, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeletePost(postId);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task ReorderPost_WithValidData_ShouldReturnNoContent()
    {
        // Arrange
        SetupUserClaims("1");
        var postId = "post-1";
        var reorderDto = new ReorderModuleDto { NewOrderNumber = 3 };

        _mockService
            .Setup(s => s.ReorderPostAsync(postId, reorderDto.NewOrderNumber, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.ReorderPost(postId, reorderDto);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    #endregion

    #region Error Handling Tests

    [Fact]
    public async Task GetMaterialApoyo_WhenServiceThrows_ShouldLogError()
    {
        // Arrange
        var searchDto = new MaterialApoyoSearchDto();
        _mockService
            .Setup(s => s.GetMaterialApoyoAsync(It.IsAny<MaterialApoyoSearchDto>()))
            .ThrowsAsync(new Exception("Test error"));

        // Act
        await _controller.GetMaterialApoyo(searchDto);

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
    public async Task CreateMaterialApoyo_WhenServiceThrowsGeneralException_ShouldReturn500()
    {
        // Arrange
        SetupUserClaims("1");
        var createDto = new CreateMaterialApoyoDto { Title = "Test" };

        _mockService
            .Setup(s => s.CreateMaterialApoyoAsync(It.IsAny<CreateMaterialApoyoDto>(), It.IsAny<int>()))
            .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.CreateMaterialApoyo(createDto);

        // Assert
        result.Result.Should().BeOfType<ObjectResult>();
        var objectResult = result.Result as ObjectResult;
        objectResult!.StatusCode.Should().Be(500);
    }

    #endregion
}
