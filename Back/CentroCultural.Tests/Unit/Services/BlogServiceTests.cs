using CentroCultural.Application.Services;
using CentroCultural.Application.DTOs;
using CentroCultural.Domain.Entities;
using CentroCultural.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using System.Text.Json;

namespace CentroCultural.Tests.Unit.Services;

/// <summary>
/// Tests Unitarios para BlogService
/// Cubre operaciones CRUD, publicación, búsqueda, filtros y gestión de elementos
/// </summary>
public class BlogServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly BlogService _service;
    private readonly Mock<ILogger<BlogService>> _mockLogger;

    public BlogServiceTests()
    {
        // Configurar base de datos en memoria para tests
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _mockLogger = new Mock<ILogger<BlogService>>();
        _service = new BlogService(_context, _mockLogger.Object);

        // Seed data inicial
        SeedTestData();
    }

    private void SeedTestData()
    {
        var currentTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        // Create test author
        var author = new Usuario
        {
            IdUsuario = 1,
            NombreUsuario = "testauthor",
            Nombre = "Test",
            Apellido = "Author",
            Contrasena = "hashed",
            IdRol = 2, // 2 = Colaborador (autor)
            FechaCreacion = currentTime.ToString(),
            EsActivo = true
        };

        _context.Usuario.Add(author);

        // Create test posts
        var posts = new List<BlogPost>
        {
            new BlogPost
            {
                Id = "post-1",
                Title = "Introducción a .NET",
                Subtitle = "Aprende lo básico de .NET Core",
                Slug = "introduccion-a-net",
                IsPublished = true,
                IsFeatured = true,
                Views = 100,
                AuthorId = 1,
                Status = "published",
                Tags = JsonSerializer.Serialize(new[] { "dotnet", "programación", "tutorial" }),
                CreatedAt = currentTime,
                PublishedAt = currentTime
            },
            new BlogPost
            {
                Id = "post-2",
                Title = "Entity Framework Advanced",
                Subtitle = "Técnicas avanzadas de EF Core",
                Slug = "entity-framework-advanced",
                IsPublished = true,
                IsFeatured = false,
                Views = 50,
                AuthorId = 1,
                Status = "published",
                Tags = JsonSerializer.Serialize(new[] { "ef-core", "database", "orm" }),
                CreatedAt = currentTime - 1000,
                PublishedAt = currentTime - 1000
            },
            new BlogPost
            {
                Id = "post-3",
                Title = "Work in Progress",
                Subtitle = "Este es un borrador",
                Slug = "work-in-progress",
                IsPublished = false,
                IsFeatured = false,
                Views = 0,
                AuthorId = 1,
                Status = "draft",
                CreatedAt = currentTime - 500
            }
        };

        _context.BlogPost.AddRange(posts);

        // Add elements to first post
        var elements = new List<BlogPostElement>
        {
            new BlogPostElement
            {
                Id = "element-1",
                BlogPostId = "post-1",
                ElementType = "text",
                Content = "Este es un párrafo de introducción.",
                OrderNumber = 0,
                IsActive = true,
                CreatedAt = currentTime
            },
            new BlogPostElement
            {
                Id = "element-2",
                BlogPostId = "post-1",
                ElementType = "image",
                FilePath = "/media/blog/test-image.jpg",
                FileName = "test-image.jpg",
                OrderNumber = 1,
                IsActive = true,
                CreatedAt = currentTime
            }
        };

        _context.BlogPostElement.AddRange(elements);
        _context.SaveChanges();
    }

    #region GET Operations

    [Fact]
    public async Task GetBlogPostsAsync_WithNoFilters_ShouldReturnPublishedPosts()
    {
        // Arrange
        var searchDto = new BlogPostSearchDto
        {
            Page = 1,
            PageSize = 10
        };

        // Act
        var result = await _service.GetBlogPostsAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Posts.Should().HaveCount(2); // Solo los publicados
        result.TotalCount.Should().Be(2);
        result.Posts.Should().OnlyContain(p => p.IsPublished == true);
    }

    [Fact]
    public async Task GetBlogPostsAsync_WithSearchTerm_ShouldReturnMatchingPosts()
    {
        // Arrange
        var searchDto = new BlogPostSearchDto
        {
            Page = 1,
            PageSize = 10,
            SearchTerm = "Entity Framework"
        };

        // Act
        var result = await _service.GetBlogPostsAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Posts.Should().HaveCount(1);
        result.Posts.First().Title.Should().Contain("Entity Framework");
    }

    [Fact]
    public async Task GetBlogPostsAsync_WithIsFeaturedFilter_ShouldReturnFeaturedPosts()
    {
        // Arrange
        var searchDto = new BlogPostSearchDto
        {
            Page = 1,
            PageSize = 10,
            IsFeatured = true
        };

        // Act
        var result = await _service.GetBlogPostsAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Posts.Should().HaveCount(1);
        result.Posts.Should().OnlyContain(p => p.IsFeatured == true);
    }

    [Fact]
    public async Task GetBlogPostsAsync_WithPagination_ShouldReturnCorrectPage()
    {
        // Arrange
        var searchDto = new BlogPostSearchDto
        {
            Page = 1,
            PageSize = 1
        };

        // Act
        var result = await _service.GetBlogPostsAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Posts.Should().HaveCount(1);
        result.HasNextPage.Should().BeTrue();
        result.HasPreviousPage.Should().BeFalse();
        result.TotalPages.Should().Be(2);
    }

    [Fact]
    public async Task GetBlogPostByIdAsync_WithValidId_ShouldReturnPost()
    {
        // Arrange
        var validId = "post-1";

        // Act
        var result = await _service.GetBlogPostByIdAsync(validId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(validId);
        result.Title.Should().Be("Introducción a .NET");
        result.Elements.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetBlogPostByIdAsync_WithInvalidId_ShouldReturnNull()
    {
        // Arrange
        var invalidId = "non-existent-id";

        // Act
        var result = await _service.GetBlogPostByIdAsync(invalidId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetBlogPostBySlugAsync_WithValidSlug_ShouldReturnPost()
    {
        // Arrange
        var validSlug = "introduccion-a-net";

        // Act
        var result = await _service.GetBlogPostBySlugAsync(validSlug);

        // Assert
        result.Should().NotBeNull();
        result!.Slug.Should().Be(validSlug);
        result.Title.Should().Be("Introducción a .NET");
    }

    [Fact]
    public async Task GetBlogPostBySlugAsync_WithUnpublishedPost_ShouldReturnNull()
    {
        // Arrange
        var unpublishedSlug = "work-in-progress";

        // Act
        var result = await _service.GetBlogPostBySlugAsync(unpublishedSlug);

        // Assert
        result.Should().BeNull(); // No debería retornar posts no publicados
    }

    #endregion

    #region CREATE Operations

    [Fact]
    public async Task CreateBlogPostAsync_WithValidData_ShouldCreatePost()
    {
        // Arrange
        var createDto = new CreateBlogPostDto
        {
            Title = "Nuevo Post de Prueba",
            Subtitle = "Subtítulo del nuevo post",
            Slug = "nuevo-post-prueba",
            IsPublished = false,
            IsFeatured = false,
            OrderNumber = 0,
            IsActive = true,
            Tags = new List<string> { "test", "nuevo" },
            Status = "draft",
            Elements = new List<BlogPostElementDto>
            {
                new BlogPostElementDto
                {
                    ElementType = "text",
                    Content = "Contenido del nuevo post",
                    OrderNumber = 0,
                    IsActive = true
                }
            }
        };

        // Act
        var result = await _service.CreateBlogPostAsync(createDto, 1);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Nuevo Post de Prueba");
        result.Slug.Should().Be("nuevo-post-prueba");
        result.Elements.Should().HaveCount(1);

        // Verificar que se guardó en la base de datos
        var saved = await _context.BlogPost.FindAsync(result.Id);
        saved.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateBlogPostAsync_WithInvalidAuthor_ShouldThrowException()
    {
        // Arrange
        var createDto = new CreateBlogPostDto
        {
            Title = "Test Post",
            Elements = new List<BlogPostElementDto>()
        };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(async () =>
            await _service.CreateBlogPostAsync(createDto, 999));
    }

    [Fact]
    public async Task CreateBlogPostAsync_WithDuplicateSlug_ShouldThrowException()
    {
        // Arrange
        var createDto = new CreateBlogPostDto
        {
            Title = "Test Post",
            Slug = "introduccion-a-net", // Slug ya existe
            Elements = new List<BlogPostElementDto>()
        };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(async () =>
            await _service.CreateBlogPostAsync(createDto, 1));
    }

    [Fact]
    public async Task CreateBlogPostAsync_AsPublished_ShouldSetPublishedAt()
    {
        // Arrange
        var createDto = new CreateBlogPostDto
        {
            Title = "Post Publicado Inmediatamente",
            IsPublished = true,
            Elements = new List<BlogPostElementDto>()
        };

        // Act
        var result = await _service.CreateBlogPostAsync(createDto, 1);

        // Assert
        result.Should().NotBeNull();
        result.IsPublished.Should().BeTrue();
        result.PublishedAt.Should().NotBeNull();
        result.PublishedAt.Should().BeGreaterThan(0);
    }

    #endregion

    #region UPDATE Operations

    [Fact]
    public async Task UpdateBlogPostAsync_WithValidData_ShouldUpdatePost()
    {
        // Arrange
        var postId = "post-2";
        var updateDto = new UpdateBlogPostDto
        {
            Title = "Entity Framework Advanced - Updated",
            Subtitle = "Técnicas avanzadas actualizadas",
            Slug = "entity-framework-advanced",
            IsPublished = true,
            IsFeatured = true, // Cambiar a destacado
            OrderNumber = 0,
            IsActive = true,
            Tags = new List<string> { "ef-core", "advanced" },
            Status = "published",
            Elements = new List<BlogPostElementDto>
            {
                new BlogPostElementDto
                {
                    ElementType = "text",
                    Content = "Contenido actualizado",
                    OrderNumber = 0,
                    IsActive = true
                }
            }
        };

        // Act
        var result = await _service.UpdateBlogPostAsync(postId, updateDto, 1);

        // Assert
        result.Should().NotBeNull();
        result!.Title.Should().Be("Entity Framework Advanced - Updated");
        result.IsFeatured.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateBlogPostAsync_WithInvalidId_ShouldReturnNull()
    {
        // Arrange
        var invalidId = "non-existent-id";
        var updateDto = new UpdateBlogPostDto
        {
            Title = "Test",
            Slug = "test",
            Elements = new List<BlogPostElementDto>()
        };

        // Act
        var result = await _service.UpdateBlogPostAsync(invalidId, updateDto, 1);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateBlogPostAsync_PublishingDraft_ShouldSetPublishedAt()
    {
        // Arrange
        var postId = "post-3"; // Este es un borrador
        var updateDto = new UpdateBlogPostDto
        {
            Title = "Work in Progress",
            Slug = "work-in-progress",
            IsPublished = true, // Publicar ahora
            Elements = new List<BlogPostElementDto>()
        };

        // Act
        var result = await _service.UpdateBlogPostAsync(postId, updateDto, 1);

        // Assert
        result.Should().NotBeNull();
        result!.IsPublished.Should().BeTrue();
        result.PublishedAt.Should().NotBeNull();
    }

    #endregion

    #region DELETE Operations

    [Fact]
    public async Task DeleteBlogPostAsync_WithValidId_ShouldDeletePost()
    {
        // Arrange
        var postId = "post-2";

        // Act
        var result = await _service.DeleteBlogPostAsync(postId, 1);

        // Assert
        result.Should().BeTrue();

        // Verificar que fue eliminado
        var deleted = await _context.BlogPost.FindAsync(postId);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteBlogPostAsync_WithInvalidId_ShouldReturnFalse()
    {
        // Arrange
        var invalidId = "non-existent-id";

        // Act
        var result = await _service.DeleteBlogPostAsync(invalidId, 1);

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region Publish/Unpublish Operations

    [Fact]
    public async Task PublishBlogPostAsync_WithValidId_ShouldPublishPost()
    {
        // Arrange
        var postId = "post-3"; // Este es un borrador

        // Act
        var result = await _service.PublishBlogPostAsync(postId, 1);

        // Assert
        result.Should().BeTrue();

        // Verificar que se publicó
        var published = await _context.BlogPost.FindAsync(postId);
        published.Should().NotBeNull();
        published!.IsPublished.Should().BeTrue();
        published.PublishedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task PublishBlogPostAsync_WithInvalidId_ShouldReturnFalse()
    {
        // Arrange
        var invalidId = "non-existent-id";

        // Act
        var result = await _service.PublishBlogPostAsync(invalidId, 1);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task UnpublishBlogPostAsync_WithValidId_ShouldUnpublishPost()
    {
        // Arrange
        var postId = "post-1"; // Este está publicado

        // Act
        var result = await _service.UnpublishBlogPostAsync(postId, 1);

        // Assert
        result.Should().BeTrue();

        // Verificar que se despublicó
        var unpublished = await _context.BlogPost.FindAsync(postId);
        unpublished.Should().NotBeNull();
        unpublished!.IsPublished.Should().BeFalse();
        unpublished.PublishedAt.Should().BeNull();
    }

    #endregion

    #region Views and Statistics

    [Fact]
    public async Task IncrementViewsAsync_WithValidId_ShouldIncrementViews()
    {
        // Arrange
        var postId = "post-1";
        var initialViews = (await _context.BlogPost.FindAsync(postId))!.Views;

        // Act
        var result = await _service.IncrementViewsAsync(postId);

        // Assert
        result.Should().BeTrue();

        // Verificar que se incrementó
        var updated = await _context.BlogPost.FindAsync(postId);
        updated!.Views.Should().Be(initialViews + 1);
    }

    [Fact]
    public async Task IncrementViewsAsync_WithUnpublishedPost_ShouldReturnFalse()
    {
        // Arrange
        var postId = "post-3"; // No publicado

        // Act
        var result = await _service.IncrementViewsAsync(postId);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetBlogStatisticsAsync_ShouldReturnCorrectStats()
    {
        // Act
        var result = await _service.GetBlogStatisticsAsync();

        // Assert
        result.Should().NotBeNull();
        var stats = result as dynamic;

        ((int)stats.TotalPosts).Should().Be(3);
        ((int)stats.PublishedPosts).Should().Be(2);
        ((int)stats.DraftPosts).Should().Be(1);
        ((int)stats.TotalViews).Should().Be(150); // 100 + 50 + 0
    }

    #endregion

    #region Featured, Popular, and Recent Posts

    [Fact]
    public async Task GetFeaturedPostsAsync_ShouldReturnFeaturedPosts()
    {
        // Act
        var result = await _service.GetFeaturedPostsAsync(5);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(1); // Solo hay 1 destacado
        result.Should().OnlyContain(p => p.IsFeatured == true);
        result.First().Title.Should().Be("Introducción a .NET");
    }

    [Fact]
    public async Task GetPopularPostsAsync_ShouldReturnPostsByViews()
    {
        // Act
        var result = await _service.GetPopularPostsAsync(10);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2); // 2 publicados
        result.Should().BeInDescendingOrder(p => p.Views);
        result.First().Views.Should().Be(100);
    }

    [Fact]
    public async Task GetRecentPostsAsync_ShouldReturnRecentPosts()
    {
        // Act
        var result = await _service.GetRecentPostsAsync(10);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.Should().BeInDescendingOrder(p => p.PublishedAt);
    }

    #endregion

    #region Slug Utilities

    [Fact]
    public async Task GenerateUniqueSlugAsync_WithUniqueTitle_ShouldReturnSlug()
    {
        // Arrange
        var title = "Mi Nuevo Post Único";

        // Act
        var slug = await _service.GenerateUniqueSlugAsync(title);

        // Assert
        slug.Should().Be("mi-nuevo-post-unico");
    }

    [Fact]
    public async Task GenerateUniqueSlugAsync_WithDuplicateTitle_ShouldReturnNumberedSlug()
    {
        // Arrange
        var title = "Introducción a .NET"; // Ya existe

        // Act
        var slug = await _service.GenerateUniqueSlugAsync(title);

        // Assert
        slug.Should().StartWith("introduccion-a-net-");
        slug.Should().NotBe("introduccion-a-net"); // Debería tener número
    }

    [Fact]
    public async Task IsSlugAvailableAsync_WithAvailableSlug_ShouldReturnTrue()
    {
        // Arrange
        var availableSlug = "slug-disponible-test";

        // Act
        var result = await _service.IsSlugAvailableAsync(availableSlug);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task IsSlugAvailableAsync_WithTakenSlug_ShouldReturnFalse()
    {
        // Arrange
        var takenSlug = "introduccion-a-net";

        // Act
        var result = await _service.IsSlugAvailableAsync(takenSlug);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task IsSlugAvailableAsync_WithExcludeId_ShouldIgnoreThatPost()
    {
        // Arrange
        var slug = "introduccion-a-net";
        var postIdToExclude = "post-1";

        // Act
        var result = await _service.IsSlugAvailableAsync(slug, postIdToExclude);

        // Assert
        result.Should().BeTrue(); // Debería estar disponible porque excluimos el post que lo usa
    }

    #endregion

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
