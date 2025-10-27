using CentroCultural.Application.Services;
using CentroCultural.Domain.Entities;
using CentroCultural.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CentroCultural.Tests.Unit.Services;

/// <summary>
/// Tests Unitarios para MaterialApoyoService
/// </summary>
public class MaterialApoyoServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly MaterialApoyoService _service;

    public MaterialApoyoServiceTests()
    {
        // Configurar base de datos en memoria para tests
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _service = new MaterialApoyoService(_context);

        // Seed data inicial
        SeedTestData();
    }

    private void SeedTestData()
    {
        var materiales = new List<MaterialApoyo>
        {
            new MaterialApoyo
            {
                Id = "test-1",
                Title = "Matemáticas Básicas",
                Description = "Curso de matemáticas nivel básico",
                IsActive = true,
                IsFeatured = true,
                CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                EducatorId = "1",
                EducatorName = "Prof. Test"
            },
            new MaterialApoyo
            {
                Id = "test-2",
                Title = "Física Avanzada",
                Description = "Curso avanzado de física",
                IsActive = true,
                IsFeatured = false,
                CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                EducatorId = "1",
                EducatorName = "Prof. Test"
            },
            new MaterialApoyo
            {
                Id = "test-3",
                Title = "Química Orgánica",
                Description = "Introducción a química orgánica",
                IsActive = false, // Inactivo
                IsFeatured = false,
                CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                EducatorId = "2",
                EducatorName = "Prof. Test 2"
            }
        };

        _context.MaterialApoyo.AddRange(materiales);
        _context.SaveChanges();
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllActiveMaterials()
    {
        // Act
        var result = await _service.GetAllAsync();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2); // Solo los activos
        result.Should().OnlyContain(m => m.IsActive == true);
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ShouldReturnMaterial()
    {
        // Arrange
        var validId = "test-1";

        // Act
        var result = await _service.GetByIdAsync(validId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(validId);
        result.Title.Should().Be("Matemáticas Básicas");
    }

    [Fact]
    public async Task GetByIdAsync_WithInvalidId_ShouldReturnNull()
    {
        // Arrange
        var invalidId = "non-existent-id";

        // Act
        var result = await _service.GetByIdAsync(invalidId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task CreateAsync_WithValidData_ShouldCreateMaterial()
    {
        // Arrange
        var newMaterial = new MaterialApoyo
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Nuevo Material",
            Description = "Descripción del nuevo material",
            IsActive = true,
            IsFeatured = false,
            CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            EducatorId = "1",
            EducatorName = "Prof. Test"
        };

        // Act
        var result = await _service.CreateAsync(newMaterial);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(newMaterial.Id);

        // Verificar que se guardó en la base de datos
        var saved = await _context.MaterialApoyo.FindAsync(newMaterial.Id);
        saved.Should().NotBeNull();
        saved!.Title.Should().Be("Nuevo Material");
    }

    [Fact]
    public async Task UpdateAsync_WithValidData_ShouldUpdateMaterial()
    {
        // Arrange
        var materialId = "test-1";
        var material = await _context.MaterialApoyo.FindAsync(materialId);
        material!.Title = "Título Actualizado";

        // Act
        var result = await _service.UpdateAsync(material);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Título Actualizado");

        // Verificar que se actualizó en la base de datos
        var updated = await _context.MaterialApoyo.FindAsync(materialId);
        updated!.Title.Should().Be("Título Actualizado");
    }

    [Fact]
    public async Task DeleteAsync_WithValidId_ShouldDeleteMaterial()
    {
        // Arrange
        var materialId = "test-2";

        // Act
        var result = await _service.DeleteAsync(materialId);

        // Assert
        result.Should().BeTrue();

        // Verificar que fue eliminado
        var deleted = await _context.MaterialApoyo.FindAsync(materialId);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_WithInvalidId_ShouldReturnFalse()
    {
        // Arrange
        var invalidId = "non-existent-id";

        // Act
        var result = await _service.DeleteAsync(invalidId);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetFeaturedAsync_ShouldReturnOnlyFeaturedMaterials()
    {
        // Act
        var result = await _service.GetFeaturedAsync();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(1); // Solo hay 1 destacado
        result.Should().OnlyContain(m => m.IsFeatured == true);
        result.First().Title.Should().Be("Matemáticas Básicas");
    }

    [Fact]
    public async Task GetByEducatorAsync_ShouldReturnMaterialsByEducator()
    {
        // Arrange
        var educatorId = "1";

        // Act
        var result = await _service.GetByEducatorAsync(educatorId);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.Should().OnlyContain(m => m.EducatorId == educatorId);
    }

    [Fact]
    public async Task SearchAsync_WithKeyword_ShouldReturnMatchingMaterials()
    {
        // Arrange
        var keyword = "matemáticas";

        // Act
        var result = await _service.SearchAsync(keyword);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCountGreaterThan(0);
        result.Should().Contain(m => m.Title.Contains(keyword, StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Constructor_ShouldThrowException_WhenContextIsNull()
    {
        // Act & Assert
        Action act = () => new MaterialApoyoService(null!);
        act.Should().Throw<ArgumentNullException>();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
