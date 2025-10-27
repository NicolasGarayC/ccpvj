using CentroCultural.Application.Services;
using CentroCultural.Application.DTOs;
using CentroCultural.Domain.Entities;
using CentroCultural.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;
using System.Text.Json;

namespace CentroCultural.Tests.Unit.Services;

/// <summary>
/// Tests Unitarios para DigitalLibraryService
/// Cubre operaciones CRUD, colecciones, búsqueda, filtros y estadísticas
/// </summary>
public class DigitalLibraryServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly DigitalLibraryService _service;

    public DigitalLibraryServiceTests()
    {
        // Configurar base de datos en memoria para tests
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _service = new DigitalLibraryService(_context);

        // Seed data inicial
        SeedTestData();
    }

    private void SeedTestData()
    {
        var currentTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        // Create test library items
        var items = new List<LibraryItem>
        {
            new LibraryItem
            {
                Id = "item-1",
                Title = "Introducción a la Música Folclórica",
                Description = "Libro sobre música folclórica chilena",
                Author = "Juan Pérez",
                FileType = "document",
                FilePath = "/media/library/intro-folklore.pdf",
                FileName = "intro-folklore.pdf",
                FileSize = 1024000,
                MimeType = "application/pdf",
                Category = "Literatura",
                Language = "es",
                Year = 2020,
                IsFeatured = true,
                IsActive = true,
                ViewCount = 100,
                DownloadCount = 50,
                Tags = JsonSerializer.Serialize(new[] { "folclore", "música", "chile" }),
                CreatedAt = currentTime,
                UploadedBy = "1"
            },
            new LibraryItem
            {
                Id = "item-2",
                Title = "Fotografía de la Cueca",
                Description = "Colección de fotografías de la cueca",
                Author = "María González",
                FileType = "image",
                FilePath = "/media/library/cueca-photos.jpg",
                FileName = "cueca-photos.jpg",
                FileSize = 512000,
                MimeType = "image/jpeg",
                Category = "Fotografía",
                Language = "es",
                Year = 2021,
                IsFeatured = false,
                IsActive = true,
                ViewCount = 75,
                DownloadCount = 30,
                Tags = JsonSerializer.Serialize(new[] { "cueca", "fotografía", "tradición" }),
                CreatedAt = currentTime - 1000,
                UploadedBy = "1"
            },
            new LibraryItem
            {
                Id = "item-3",
                Title = "Documental Inactivo",
                Description = "Este item fue eliminado",
                Author = "Test Author",
                FileType = "video",
                FilePath = "/media/library/inactive-doc.mp4",
                FileName = "inactive-doc.mp4",
                FileSize = 2048000,
                MimeType = "video/mp4",
                Category = "Documentales",
                IsActive = false, // Inactivo
                CreatedAt = currentTime - 2000,
                UploadedBy = "1"
            }
        };

        _context.LibraryItems.AddRange(items);

        // Create test collections
        var collections = new List<LibraryCollection>
        {
            new LibraryCollection
            {
                Id = "collection-1",
                Name = "Folclore Chileno",
                Description = "Colección sobre folclore chileno",
                ColorTheme = "blue",
                IsFeatured = true,
                IsActive = true,
                OrderNumber = 1,
                CreatedAt = currentTime,
                CreatedBy = "1"
            },
            new LibraryCollection
            {
                Id = "collection-2",
                Name = "Danza Tradicional",
                Description = "Recursos sobre danza tradicional",
                ColorTheme = "green",
                IsFeatured = false,
                IsActive = true,
                OrderNumber = 2,
                CreatedAt = currentTime,
                CreatedBy = "1"
            }
        };

        _context.LibraryCollections.AddRange(collections);

        // Associate items with collections
        var itemCollections = new List<LibraryItemCollection>
        {
            new LibraryItemCollection
            {
                Id = Guid.NewGuid().ToString(),
                LibraryItemId = "item-1",
                LibraryCollectionId = "collection-1",
                OrderNumber = 1,
                AddedAt = currentTime,
                AddedBy = "1"
            },
            new LibraryItemCollection
            {
                Id = Guid.NewGuid().ToString(),
                LibraryItemId = "item-2",
                LibraryCollectionId = "collection-1",
                OrderNumber = 2,
                AddedAt = currentTime,
                AddedBy = "1"
            }
        };

        _context.LibraryItemCollections.AddRange(itemCollections);
        _context.SaveChanges();
    }

    #region GET Operations - Items

    [Fact]
    public async Task GetItemsAsync_WithNoFilters_ShouldReturnActiveItems()
    {
        // Arrange
        var searchDto = new LibrarySearchDto
        {
            Page = 1,
            PageSize = 10
        };

        // Act
        var result = await _service.GetItemsAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(2); // Solo los activos
        result.TotalCount.Should().Be(2);
    }

    [Fact]
    public async Task GetItemsAsync_WithSearchQuery_ShouldReturnMatchingItems()
    {
        // Arrange
        var searchDto = new LibrarySearchDto
        {
            Page = 1,
            PageSize = 10,
            Query = "Música"
        };

        // Act
        var result = await _service.GetItemsAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(1);
        result.Items.First().Title.Should().Contain("Música");
    }

    [Fact]
    public async Task GetItemsAsync_WithFileTypeFilter_ShouldReturnMatchingItems()
    {
        // Arrange
        var searchDto = new LibrarySearchDto
        {
            Page = 1,
            PageSize = 10,
            FileType = "document"
        };

        // Act
        var result = await _service.GetItemsAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(1);
        result.Items.Should().OnlyContain(i => i.FileType == "document");
    }

    [Fact]
    public async Task GetItemsAsync_WithCategoryFilter_ShouldReturnMatchingItems()
    {
        // Arrange
        var searchDto = new LibrarySearchDto
        {
            Page = 1,
            PageSize = 10,
            Category = "Fotografía"
        };

        // Act
        var result = await _service.GetItemsAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(1);
        result.Items.First().Category.Should().Be("Fotografía");
    }

    [Fact]
    public async Task GetItemsAsync_WithAuthorFilter_ShouldReturnMatchingItems()
    {
        // Arrange
        var searchDto = new LibrarySearchDto
        {
            Page = 1,
            PageSize = 10,
            Author = "Juan Pérez"
        };

        // Act
        var result = await _service.GetItemsAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(1);
        result.Items.First().Author.Should().Be("Juan Pérez");
    }

    [Fact]
    public async Task GetItemsAsync_WithIsFeaturedFilter_ShouldReturnFeaturedItems()
    {
        // Arrange
        var searchDto = new LibrarySearchDto
        {
            Page = 1,
            PageSize = 10,
            IsFeatured = true
        };

        // Act
        var result = await _service.GetItemsAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(1);
        result.Items.Should().OnlyContain(i => i.IsFeatured == true);
    }

    [Fact]
    public async Task GetItemsAsync_WithPagination_ShouldReturnCorrectPage()
    {
        // Arrange
        var searchDto = new LibrarySearchDto
        {
            Page = 1,
            PageSize = 1
        };

        // Act
        var result = await _service.GetItemsAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(1);
        result.HasNextPage.Should().BeTrue();
        result.HasPreviousPage.Should().BeFalse();
        result.TotalPages.Should().Be(2);
    }

    [Fact]
    public async Task GetItemByIdAsync_WithValidId_ShouldReturnItem()
    {
        // Arrange
        var validId = "item-1";

        // Act
        var result = await _service.GetItemByIdAsync(validId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(validId);
        result.Title.Should().Be("Introducción a la Música Folclórica");
    }

    [Fact]
    public async Task GetItemByIdAsync_WithInvalidId_ShouldReturnNull()
    {
        // Arrange
        var invalidId = "non-existent-id";

        // Act
        var result = await _service.GetItemByIdAsync(invalidId);

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region CREATE Operations - Items

    [Fact]
    public async Task CreateItemAsync_WithValidData_ShouldCreateItem()
    {
        // Arrange
        var createDto = new CreateLibraryItemDto
        {
            Title = "Nuevo Recurso de Prueba",
            Description = "Descripción del nuevo recurso",
            Author = "Test Author",
            FileType = "audio",
            FilePath = "/media/library/test-audio.mp3",
            FileName = "test-audio.mp3",
            FileSize = 256000,
            MimeType = "audio/mpeg",
            Category = "Música",
            Language = "es",
            Year = 2024,
            Tags = new List<string> { "test", "nuevo" },
            IsFeatured = false,
            CollectionIds = new List<string>()
        };

        // Act
        var result = await _service.CreateItemAsync(createDto, 1);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Nuevo Recurso de Prueba");
        result.FileType.Should().Be("audio");

        // Verificar que se guardó en la base de datos
        var saved = await _context.LibraryItems.FindAsync(result.Id);
        saved.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateItemAsync_WithCollections_ShouldAssociateToCollections()
    {
        // Arrange
        var createDto = new CreateLibraryItemDto
        {
            Title = "Item con Colección",
            Author = "Test",
            FileType = "image",
            FilePath = "/test.jpg",
            FileName = "test.jpg",
            Tags = new List<string>(),
            CollectionIds = new List<string> { "collection-1" }
        };

        // Act
        var result = await _service.CreateItemAsync(createDto, 1);

        // Assert
        result.Should().NotBeNull();
        result.Collections.Should().HaveCount(1);
        result.Collections.First().Id.Should().Be("collection-1");
    }

    #endregion

    #region UPDATE Operations - Items

    [Fact]
    public async Task UpdateItemAsync_WithValidData_ShouldUpdateItem()
    {
        // Arrange
        var itemId = "item-2";
        var updateDto = new UpdateLibraryItemDto
        {
            Title = "Fotografía de la Cueca - Actualizada",
            Description = "Descripción actualizada",
            Author = "María González",
            Language = "es",
            Year = 2022,
            Category = "Fotografía",
            Tags = new List<string> { "cueca", "actualizada" },
            IsFeatured = true,
            IsActive = true,
            CollectionIds = new List<string>()
        };

        // Act
        var result = await _service.UpdateItemAsync(itemId, updateDto, 1);

        // Assert
        result.Should().BeTrue();

        // Verificar que se actualizó
        var updated = await _context.LibraryItems.FindAsync(itemId);
        updated!.Title.Should().Be("Fotografía de la Cueca - Actualizada");
        updated.IsFeatured.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateItemAsync_WithInvalidId_ShouldReturnFalse()
    {
        // Arrange
        var invalidId = "non-existent-id";
        var updateDto = new UpdateLibraryItemDto
        {
            Title = "Test",
            Tags = new List<string>(),
            CollectionIds = new List<string>()
        };

        // Act
        var result = await _service.UpdateItemAsync(invalidId, updateDto, 1);

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region DELETE Operations - Items

    [Fact]
    public async Task DeleteItemAsync_WithValidId_ShouldSoftDeleteItem()
    {
        // Arrange
        var itemId = "item-2";

        // Act
        var result = await _service.DeleteItemAsync(itemId, 1);

        // Assert
        result.Should().BeTrue();

        // Verificar que fue marcado como inactivo (soft delete)
        var deleted = await _context.LibraryItems.FindAsync(itemId);
        deleted.Should().NotBeNull();
        deleted!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteItemAsync_WithInvalidId_ShouldReturnFalse()
    {
        // Arrange
        var invalidId = "non-existent-id";

        // Act
        var result = await _service.DeleteItemAsync(invalidId, 1);

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region Collection Operations

    [Fact]
    public async Task GetCollectionsAsync_ShouldReturnActiveCollections()
    {
        // Act
        var result = await _service.GetCollectionsAsync();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.Should().BeInAscendingOrder(c => c.OrderNumber);
    }

    [Fact]
    public async Task GetCollectionByIdAsync_WithValidId_ShouldReturnCollection()
    {
        // Arrange
        var validId = "collection-1";

        // Act
        var result = await _service.GetCollectionByIdAsync(validId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(validId);
        result.Name.Should().Be("Folclore Chileno");
    }

    [Fact]
    public async Task CreateCollectionAsync_WithValidData_ShouldCreateCollection()
    {
        // Arrange
        var createDto = new CreateLibraryCollectionDto
        {
            Name = "Nueva Colección",
            Description = "Descripción de nueva colección",
            ColorTheme = "red",
            OrderNumber = 3,
            IsFeatured = false
        };

        // Act
        var result = await _service.CreateCollectionAsync(createDto, 1);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("Nueva Colección");
        result.ColorTheme.Should().Be("red");

        // Verificar que se guardó en la base de datos
        var saved = await _context.LibraryCollections.FindAsync(result.Id);
        saved.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateCollectionAsync_WithValidData_ShouldUpdateCollection()
    {
        // Arrange
        var collectionId = "collection-2";
        var updateDto = new UpdateLibraryCollectionDto
        {
            Name = "Danza Tradicional - Actualizada",
            Description = "Descripción actualizada",
            ColorTheme = "purple",
            OrderNumber = 1,
            IsFeatured = true,
            IsActive = true
        };

        // Act
        var result = await _service.UpdateCollectionAsync(collectionId, updateDto, 1);

        // Assert
        result.Should().BeTrue();

        // Verificar que se actualizó
        var updated = await _context.LibraryCollections.FindAsync(collectionId);
        updated!.Name.Should().Be("Danza Tradicional - Actualizada");
        updated.IsFeatured.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteCollectionAsync_WithValidId_ShouldSoftDeleteCollection()
    {
        // Arrange
        var collectionId = "collection-2";

        // Act
        var result = await _service.DeleteCollectionAsync(collectionId, 1);

        // Assert
        result.Should().BeTrue();

        // Verificar que fue marcado como inactivo
        var deleted = await _context.LibraryCollections.FindAsync(collectionId);
        deleted.Should().NotBeNull();
        deleted!.IsActive.Should().BeFalse();
    }

    #endregion

    #region Collection Item Management

    [Fact]
    public async Task AddItemToCollectionAsync_ShouldAssociateItem()
    {
        // Arrange
        var itemId = "item-2";
        var collectionId = "collection-2";

        // Act
        var result = await _service.AddItemToCollectionAsync(itemId, collectionId, 1);

        // Assert
        result.Should().BeTrue();

        // Verificar la asociación
        var association = await _context.LibraryItemCollections
            .FirstOrDefaultAsync(ic => ic.LibraryItemId == itemId && ic.LibraryCollectionId == collectionId);
        association.Should().NotBeNull();
    }

    [Fact]
    public async Task RemoveItemFromCollectionAsync_ShouldRemoveAssociation()
    {
        // Arrange
        var itemId = "item-1";
        var collectionId = "collection-1";

        // Act
        var result = await _service.RemoveItemFromCollectionAsync(itemId, collectionId, 1);

        // Assert
        result.Should().BeTrue();

        // Verificar que se eliminó la asociación
        var association = await _context.LibraryItemCollections
            .FirstOrDefaultAsync(ic => ic.LibraryItemId == itemId && ic.LibraryCollectionId == collectionId);
        association.Should().BeNull();
    }

    [Fact]
    public async Task ReorderItemInCollectionAsync_ShouldUpdateOrder()
    {
        // Arrange
        var itemId = "item-1";
        var collectionId = "collection-1";
        var newOrder = 10;

        // Act
        var result = await _service.ReorderItemInCollectionAsync(itemId, collectionId, newOrder, 1);

        // Assert
        result.Should().BeTrue();

        // Verificar el nuevo orden
        var association = await _context.LibraryItemCollections
            .FirstOrDefaultAsync(ic => ic.LibraryItemId == itemId && ic.LibraryCollectionId == collectionId);
        association!.OrderNumber.Should().Be(newOrder);
    }

    #endregion

    #region Statistics

    [Fact]
    public async Task GetStatsAsync_ShouldReturnStatistics()
    {
        // Act
        var result = await _service.GetStatsAsync();

        // Assert
        result.Should().NotBeNull();
        result.TotalItems.Should().Be(2); // Solo activos
        result.TotalCollections.Should().Be(2);
        result.FileTypeDistribution.Should().ContainKey("document");
        result.FileTypeDistribution.Should().ContainKey("image");
    }

    #endregion

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
