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
/// Tests Unitarios para BlogController
/// Verifica el comportamiento de los endpoints HTTP del blog
/// </summary>
public class BlogControllerTests
{
    private readonly Mock<IBlogService> _mockService;
    private readonly Mock<ILogger<BlogController>> _mockLogger;
    private readonly BlogController _controller;

    public BlogControllerTests()
    {
        _mockService = new Mock<IBlogService>();
        _mockLogger = new Mock<ILogger<BlogController>>();
        _controller = new BlogController(_mockService.Object, _mockLogger.Object);
    }

    private void SetupUserClaims(string userId = "1")
    {
        var claims = new List<Claim>
        {
            new Claim("IdUsuario", userId),
            new Claim(ClaimTypes.NameIdentifier, userId)
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
    public async Task GetBlogPosts_WithValidSearch_ShouldReturnOkWithData()
    {
        // Arrange
        var searchDto = new BlogPostSearchDto { PageNumber = 1, PageSize = 10 };
        var expectedResult = new BlogPostPagedResultDto
        {
            Items = new List<BlogPostSummaryDto>
            {
                new BlogPostSummaryDto { Id = "1", Title = "Test Post", Slug = "test-post" }
            },
            TotalItems = 1,
            PageNumber = 1,
            PageSize = 10
        };

        _mockService
            .Setup(s => s.GetBlogPostsAsync(It.IsAny<BlogPostSearchDto>()))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.GetBlogPosts(searchDto);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedResult);
    }

    [Fact]
    public async Task GetBlogPosts_WhenServiceThrows_ShouldReturn500()
    {
        // Arrange
        var searchDto = new BlogPostSearchDto();
        _mockService
            .Setup(s => s.GetBlogPostsAsync(It.IsAny<BlogPostSearchDto>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetBlogPosts(searchDto);

        // Assert
        result.Result.Should().BeOfType<ObjectResult>();
        var objectResult = result.Result as ObjectResult;
        objectResult!.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task GetBlogPost_WithValidId_ShouldReturnOkWithPost()
    {
        // Arrange
        var postId = "test-id";
        var expectedPost = new BlogPostDto
        {
            Id = postId,
            Title = "Test Post",
            Slug = "test-post"
        };

        _mockService
            .Setup(s => s.GetBlogPostByIdAsync(postId))
            .ReturnsAsync(expectedPost);

        // Act
        var result = await _controller.GetBlogPost(postId);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedPost);
    }

    [Fact]
    public async Task GetBlogPost_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        var postId = "non-existent";
        _mockService
            .Setup(s => s.GetBlogPostByIdAsync(postId))
            .ReturnsAsync((BlogPostDto?)null);

        // Act
        var result = await _controller.GetBlogPost(postId);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetBlogPostBySlug_WithValidSlug_ShouldReturnOkWithPost()
    {
        // Arrange
        SetupUserClaims("1");
        var slug = "test-slug";
        var expectedPost = new BlogPostDto
        {
            Id = "1",
            Title = "Test Post",
            Slug = slug
        };

        _mockService
            .Setup(s => s.GetBlogPostBySlugAsync(slug, 1))
            .ReturnsAsync(expectedPost);

        // Act
        var result = await _controller.GetBlogPostBySlug(slug);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedPost);
    }

    [Fact]
    public async Task GetBlogPostBySlug_WithInvalidSlug_ShouldReturnNotFound()
    {
        // Arrange
        SetupUserClaims("1");
        var slug = "non-existent-slug";
        _mockService
            .Setup(s => s.GetBlogPostBySlugAsync(slug, 1))
            .ReturnsAsync((BlogPostDto?)null);

        // Act
        var result = await _controller.GetBlogPostBySlug(slug);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetFeaturedPosts_ShouldReturnOkWithFeaturedPosts()
    {
        // Arrange
        var count = 5;
        var expectedPosts = new List<BlogPostSummaryDto>
        {
            new BlogPostSummaryDto { Id = "1", Title = "Featured 1", IsFeatured = true },
            new BlogPostSummaryDto { Id = "2", Title = "Featured 2", IsFeatured = true }
        };

        _mockService
            .Setup(s => s.GetFeaturedPostsAsync(count))
            .ReturnsAsync(expectedPosts);

        // Act
        var result = await _controller.GetFeaturedPosts(count);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var posts = okResult!.Value as IEnumerable<BlogPostSummaryDto>;
        posts.Should().HaveCount(2);
        posts.Should().OnlyContain(p => p.IsFeatured == true);
    }

    [Fact]
    public async Task GetPopularPosts_ShouldReturnOkWithPopularPosts()
    {
        // Arrange
        var count = 10;
        var expectedPosts = new List<BlogPostSummaryDto>
        {
            new BlogPostSummaryDto { Id = "1", Title = "Popular 1", Views = 1000 },
            new BlogPostSummaryDto { Id = "2", Title = "Popular 2", Views = 900 }
        };

        _mockService
            .Setup(s => s.GetPopularPostsAsync(count))
            .ReturnsAsync(expectedPosts);

        // Act
        var result = await _controller.GetPopularPosts(count);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var posts = okResult!.Value as IEnumerable<BlogPostSummaryDto>;
        posts.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetRecentPosts_ShouldReturnOkWithRecentPosts()
    {
        // Arrange
        var count = 10;
        var expectedPosts = new List<BlogPostSummaryDto>
        {
            new BlogPostSummaryDto { Id = "1", Title = "Recent 1" },
            new BlogPostSummaryDto { Id = "2", Title = "Recent 2" }
        };

        _mockService
            .Setup(s => s.GetRecentPostsAsync(count))
            .ReturnsAsync(expectedPosts);

        // Act
        var result = await _controller.GetRecentPosts(count);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var posts = okResult!.Value as IEnumerable<BlogPostSummaryDto>;
        posts.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetBlogStatistics_ShouldReturnOkWithStatistics()
    {
        // Arrange
        var expectedStats = new { TotalPosts = 50, TotalViews = 10000, TotalPublished = 45 };

        _mockService
            .Setup(s => s.GetBlogStatisticsAsync())
            .ReturnsAsync(expectedStats);

        // Act
        var result = await _controller.GetBlogStatistics();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedStats);
    }

    #endregion

    #region POST/PUT/DELETE Tests

    [Fact]
    public async Task CreateBlogPost_WithValidData_ShouldReturnCreatedAtAction()
    {
        // Arrange
        SetupUserClaims("1");
        var createDto = new CreateBlogPostDto
        {
            Title = "New Post",
            Slug = "new-post",
            Content = "Post content"
        };

        var createdPost = new BlogPostDto
        {
            Id = "new-id",
            Title = createDto.Title,
            Slug = createDto.Slug
        };

        _mockService
            .Setup(s => s.CreateBlogPostAsync(createDto, 1))
            .ReturnsAsync(createdPost);

        // Act
        var result = await _controller.CreateBlogPost(createDto);

        // Assert
        result.Result.Should().BeOfType<CreatedAtActionResult>();
        var createdResult = result.Result as CreatedAtActionResult;
        createdResult!.ActionName.Should().Be(nameof(_controller.GetBlogPost));
        createdResult.RouteValues!["id"].Should().Be("new-id");
    }

    [Fact]
    public async Task CreateBlogPost_WithoutUserId_ShouldReturnUnauthorized()
    {
        // Arrange
        // No se configuran claims, por lo que GetCurrentUserId() retornará null
        var createDto = new CreateBlogPostDto { Title = "Test" };

        // Act
        var result = await _controller.CreateBlogPost(createDto);

        // Assert
        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task CreateBlogPost_WhenServiceThrows_ShouldReturn500()
    {
        // Arrange
        SetupUserClaims("1");
        var createDto = new CreateBlogPostDto { Title = "Test" };

        _mockService
            .Setup(s => s.CreateBlogPostAsync(It.IsAny<CreateBlogPostDto>(), It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.CreateBlogPost(createDto);

        // Assert
        result.Result.Should().BeOfType<ObjectResult>();
        var objectResult = result.Result as ObjectResult;
        objectResult!.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task UpdateBlogPost_WithValidData_ShouldReturnOkWithUpdatedPost()
    {
        // Arrange
        SetupUserClaims("1");
        var postId = "test-id";
        var updateDto = new UpdateBlogPostDto { Title = "Updated Title" };
        var updatedPost = new BlogPostDto
        {
            Id = postId,
            Title = updateDto.Title
        };

        _mockService
            .Setup(s => s.UpdateBlogPostAsync(postId, updateDto, 1))
            .ReturnsAsync(updatedPost);

        // Act
        var result = await _controller.UpdateBlogPost(postId, updateDto);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(updatedPost);
    }

    [Fact]
    public async Task UpdateBlogPost_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        SetupUserClaims("1");
        var postId = "non-existent";
        var updateDto = new UpdateBlogPostDto { Title = "Updated Title" };

        _mockService
            .Setup(s => s.UpdateBlogPostAsync(postId, updateDto, 1))
            .ReturnsAsync((BlogPostDto?)null);

        // Act
        var result = await _controller.UpdateBlogPost(postId, updateDto);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task DeleteBlogPost_WithValidId_ShouldReturnNoContent()
    {
        // Arrange
        SetupUserClaims("1");
        var postId = "test-id";

        _mockService
            .Setup(s => s.DeleteBlogPostAsync(postId, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteBlogPost(postId);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task DeleteBlogPost_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        SetupUserClaims("1");
        var postId = "non-existent";

        _mockService
            .Setup(s => s.DeleteBlogPostAsync(postId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteBlogPost(postId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region Publish/Unpublish Tests

    [Fact]
    public async Task PublishBlogPost_WithValidId_ShouldReturnOk()
    {
        // Arrange
        SetupUserClaims("1");
        var postId = "test-id";

        _mockService
            .Setup(s => s.PublishBlogPostAsync(postId, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.PublishBlogPost(postId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as dynamic;
        ((string)response!.message).Should().Be("Blog post published successfully");
    }

    [Fact]
    public async Task PublishBlogPost_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        SetupUserClaims("1");
        var postId = "non-existent";

        _mockService
            .Setup(s => s.PublishBlogPostAsync(postId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.PublishBlogPost(postId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task UnpublishBlogPost_WithValidId_ShouldReturnOk()
    {
        // Arrange
        SetupUserClaims("1");
        var postId = "test-id";

        _mockService
            .Setup(s => s.UnpublishBlogPostAsync(postId, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.UnpublishBlogPost(postId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task UnpublishBlogPost_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        SetupUserClaims("1");
        var postId = "non-existent";

        _mockService
            .Setup(s => s.UnpublishBlogPostAsync(postId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.UnpublishBlogPost(postId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region Views and Slug Tests

    [Fact]
    public async Task IncrementViews_WithValidId_ShouldReturnOk()
    {
        // Arrange
        var postId = "test-id";

        _mockService
            .Setup(s => s.IncrementViewsAsync(postId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.IncrementViews(postId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task IncrementViews_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        var postId = "non-existent";

        _mockService
            .Setup(s => s.IncrementViewsAsync(postId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.IncrementViews(postId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task CheckSlugAvailability_WithAvailableSlug_ShouldReturnTrue()
    {
        // Arrange
        var slug = "available-slug";

        _mockService
            .Setup(s => s.IsSlugAvailableAsync(slug, null))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.CheckSlugAvailability(slug);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as dynamic;
        ((bool)response!.isAvailable).Should().BeTrue();
    }

    [Fact]
    public async Task CheckSlugAvailability_WithTakenSlug_ShouldReturnFalse()
    {
        // Arrange
        var slug = "taken-slug";

        _mockService
            .Setup(s => s.IsSlugAvailableAsync(slug, null))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.CheckSlugAvailability(slug);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as dynamic;
        ((bool)response!.isAvailable).Should().BeFalse();
    }

    [Fact]
    public async Task GenerateUniqueSlug_WithTitle_ShouldReturnGeneratedSlug()
    {
        // Arrange
        var generateDto = new GenerateSlugDto
        {
            Title = "Test Title",
            ExcludePostId = null
        };

        var expectedSlug = "test-title";

        _mockService
            .Setup(s => s.GenerateUniqueSlugAsync(generateDto.Title, generateDto.ExcludePostId))
            .ReturnsAsync(expectedSlug);

        // Act
        var result = await _controller.GenerateUniqueSlug(generateDto);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as dynamic;
        ((string)response!.slug).Should().Be(expectedSlug);
    }

    #endregion

    #region Error Handling Tests

    [Fact]
    public async Task GetBlogPosts_WhenServiceThrows_ShouldLogError()
    {
        // Arrange
        var searchDto = new BlogPostSearchDto();
        _mockService
            .Setup(s => s.GetBlogPostsAsync(It.IsAny<BlogPostSearchDto>()))
            .ThrowsAsync(new Exception("Test error"));

        // Act
        await _controller.GetBlogPosts(searchDto);

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
    public async Task CreateBlogPost_Success_ShouldLogInformation()
    {
        // Arrange
        SetupUserClaims("1");
        var createDto = new CreateBlogPostDto { Title = "Test" };
        var createdPost = new BlogPostDto { Id = "new-id", Title = "Test" };

        _mockService
            .Setup(s => s.CreateBlogPostAsync(It.IsAny<CreateBlogPostDto>(), It.IsAny<int>()))
            .ReturnsAsync(createdPost);

        // Act
        await _controller.CreateBlogPost(createDto);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((o, t) => true),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
            Times.Once);
    }

    #endregion
}
