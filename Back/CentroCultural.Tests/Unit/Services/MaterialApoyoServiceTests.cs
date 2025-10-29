using CentroCultural.Application.Services;
using CentroCultural.Application.DTOs;
using CentroCultural.Domain.Entities;
using CentroCultural.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
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
        // Configurar base de datos SQLite en memoria para tests (soporta raw SQL)
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;

        _context = new ApplicationDbContext(options);

        // Crear el schema de la base de datos
        _context.Database.OpenConnection();
        _context.Database.EnsureCreated();

        var mockLogger = new Mock<ILogger<MaterialApoyoService>>();
        _service = new MaterialApoyoService(_context, mockLogger.Object);

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
        var result = await _service.GetAllMaterialApoyoAsync();

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
        var result = await _service.GetMaterialApoyoByIdAsync(validId);

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
        var result = await _service.GetMaterialApoyoByIdAsync(invalidId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task CreateAsync_WithValidData_ShouldCreateMaterial()
    {
        // Arrange
        var createDto = new CreateMaterialApoyoDto
        {
            Title = "Nuevo Material",
            Description = "Descripción del nuevo material",
            IsFeatured = false,
            EducatorName = "Prof. Test"
        };

        // Act
        var result = await _service.CreateMaterialApoyoAsync(createDto, 1);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Nuevo Material");

        // Verificar que se guardó en la base de datos
        var saved = await _context.MaterialApoyo.FirstOrDefaultAsync(m => m.Title == "Nuevo Material");
        saved.Should().NotBeNull();
        saved!.Title.Should().Be("Nuevo Material");
    }

    [Fact]
    public async Task UpdateAsync_WithValidData_ShouldUpdateMaterial()
    {
        // Arrange
        var materialId = "test-1";
        var updateDto = new UpdateMaterialApoyoDto
        {
            Title = "Título Actualizado",
            Description = "Descripción",
            EducatorName = "Prof. Test"
        };

        // Act
        var result = await _service.UpdateMaterialApoyoAsync(materialId, updateDto, 1);

        // Assert
        result.Should().BeTrue();

        // Verificar que se actualizó en la base de datos
        var updated = await _context.MaterialApoyo.FindAsync(materialId);
        updated.Should().NotBeNull();
        updated!.Title.Should().Be("Título Actualizado");
    }

    [Fact]
    public async Task DeleteAsync_WithValidId_ShouldDeleteMaterial()
    {
        // Arrange
        var materialId = "test-2";

        // Act
        var result = await _service.DeleteMaterialApoyoAsync(materialId, 1);

        // Assert
        result.Should().BeTrue();

        // Limpiar el ChangeTracker para forzar reload desde DB
        _context.ChangeTracker.Clear();

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
        var result = await _service.DeleteMaterialApoyoAsync(invalidId, 1);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetFeaturedAsync_ShouldReturnOnlyFeaturedMaterials()
    {
        // Act
        var result = await _service.GetFeaturedMaterialApoyoAsync();

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
        var educatorId = 1;

        // Act
        var result = await _service.GetMaterialApoyoByEducatorAsync(educatorId);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task SearchAsync_WithKeyword_ShouldReturnMatchingMaterials()
    {
        // Arrange
        var searchDto = new MaterialApoyoSearchDto
        {
            SearchTerm = "matemáticas",
            Page = 1,
            PageSize = 10
        };

        // Act
        var result = await _service.GetMaterialApoyoAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.MaterialApoyo.Should().HaveCountGreaterThan(0);
        result.MaterialApoyo.Should().Contain(m => m.Title.Contains("matemáticas", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Constructor_ShouldThrowException_WhenContextIsNull()
    {
        // Arrange
        var mockLogger = new Mock<ILogger<MaterialApoyoService>>();

        // Act & Assert
        Action act = () => new MaterialApoyoService(null!, mockLogger.Object);
        act.Should().Throw<ArgumentNullException>();
    }

    public void Dispose()
    {
        _context.Database.CloseConnection();
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
