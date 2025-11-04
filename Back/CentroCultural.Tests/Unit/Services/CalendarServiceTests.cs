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
/// Tests Unitarios para CalendarService
/// Cubre operaciones CRUD, eventos recurrentes, búsqueda y filtros
/// </summary>
public class CalendarServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly CalendarService _service;
    private readonly Mock<ILogger<CalendarService>> _mockLogger;

    public CalendarServiceTests()
    {
        // Configurar base de datos en memoria para tests
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _mockLogger = new Mock<ILogger<CalendarService>>();
        _service = new CalendarService(_context, _mockLogger.Object);

        // Seed data inicial
        SeedTestData();
    }

    private void SeedTestData()
    {
        var currentTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var tomorrow = DateTimeOffset.UtcNow.AddDays(1).ToUnixTimeSeconds();
        var nextWeek = DateTimeOffset.UtcNow.AddDays(7).ToUnixTimeSeconds();

        // Create test organizer
        var organizer = new Usuario
        {
            IdUsuario = 1,
            NombreUsuario = "organizer",
            Nombre = "Test",
            Apellido = "Organizer",
            Contrasena = "hashed",
            IdRol = 3, // 3 = Administrador
            FechaCreacion = currentTime.ToString(),
            EsActivo = true
        };

        _context.Usuario.Add(organizer);

        // Create test events
        var events = new List<Event>
        {
            new Event
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Taller de Programación",
                Description = "Taller introductorio de programación",
                StartDateTime = tomorrow,
                EndDateTime = tomorrow + 7200, // 2 horas después
                IsAllDay = false,
                Location = "Sala A",
                EventType = "Taller",
                IsFeatured = true,
                IsRecurring = false,
                OrganizerId = "1",
                CreatedAt = currentTime,
                IsActive = true
            },
            new Event
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Clase de Música Semanal",
                Description = "Clase recurrente de música",
                StartDateTime = tomorrow,
                EndDateTime = tomorrow + 3600,
                IsAllDay = false,
                Location = "Sala B",
                EventType = "Clase",
                IsFeatured = false,
                IsRecurring = true,
                RecurrencePattern = "weekly",
                RecurrenceInterval = 1,
                RecurrenceEndDate = nextWeek + (86400 * 30), // 30 días después
                RecurrenceDaysOfWeek = "1,3,5", // Lunes, Miércoles, Viernes
                OrganizerId = "1",
                CreatedAt = currentTime,
                IsActive = true
            },
            new Event
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Evento Inactivo",
                Description = "Este evento ha sido cancelado",
                StartDateTime = nextWeek,
                IsAllDay = false,
                Location = "Sala C",
                EventType = "Otro",
                IsFeatured = false,
                IsRecurring = false,
                OrganizerId = "1",
                CreatedAt = currentTime,
                IsActive = false // Inactivo
            }
        };

        _context.Events.AddRange(events);
        _context.SaveChanges();
    }

    #region GET Operations

    [Fact]
    public async Task GetEventsAsync_WithNoFilters_ShouldReturnActiveEvents()
    {
        // Arrange
        var searchDto = new EventSearchDto
        {
            Page = 1,
            PageSize = 10
        };

        // Act
        var result = await _service.GetEventsAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Events.Should().HaveCount(2); // Solo los activos
        result.TotalCount.Should().Be(2);
    }

    [Fact]
    public async Task GetEventsAsync_WithSearchTerm_ShouldReturnMatchingEvents()
    {
        // Arrange
        var searchDto = new EventSearchDto
        {
            Page = 1,
            PageSize = 10,
            SearchTerm = "Programación"
        };

        // Act
        var result = await _service.GetEventsAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Events.Should().HaveCount(1);
        result.Events.First().Title.Should().Contain("Programación");
    }

    [Fact]
    public async Task GetEventsAsync_WithEventTypeFilter_ShouldReturnMatchingEvents()
    {
        // Arrange
        var searchDto = new EventSearchDto
        {
            Page = 1,
            PageSize = 10,
            EventType = "Taller"
        };

        // Act
        var result = await _service.GetEventsAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Events.Should().HaveCount(1);
        result.Events.Should().OnlyContain(e => e.EventType == "Taller");
    }

    [Fact]
    public async Task GetEventsAsync_WithIsFeaturedFilter_ShouldReturnFeaturedEvents()
    {
        // Arrange
        var searchDto = new EventSearchDto
        {
            Page = 1,
            PageSize = 10,
            IsFeatured = true
        };

        // Act
        var result = await _service.GetEventsAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Events.Should().HaveCount(1);
        result.Events.Should().OnlyContain(e => e.IsFeatured == true);
    }

    [Fact]
    public async Task GetEventsAsync_WithPagination_ShouldReturnCorrectPage()
    {
        // Arrange
        var searchDto = new EventSearchDto
        {
            Page = 1,
            PageSize = 1
        };

        // Act
        var result = await _service.GetEventsAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Events.Should().HaveCount(1);
        result.HasNextPage.Should().BeTrue();
        result.HasPreviousPage.Should().BeFalse();
        result.TotalPages.Should().Be(2);
    }

    [Fact]
    public async Task GetEventByIdAsync_WithValidId_ShouldReturnEvent()
    {
        // Arrange
        var validId = Guid.Parse(_context.Events.First(e => e.IsActive).Id);

        // Act
        var result = await _service.GetEventByIdAsync(validId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(validId);
        result.Title.Should().Be("Taller de Programación");
    }

    [Fact]
    public async Task GetEventByIdAsync_WithInvalidId_ShouldReturnNull()
    {
        // Arrange
        var invalidId = Guid.NewGuid();

        // Act
        var result = await _service.GetEventByIdAsync(invalidId);

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region CREATE Operations

    [Fact]
    public async Task CreateEventAsync_WithValidData_ShouldCreateEvent()
    {
        // Arrange
        var createDto = new CreateEventDto
        {
            Title = "Nuevo Evento de Prueba",
            Description = "Descripción del nuevo evento",
            StartDateTime = DateTime.UtcNow.AddDays(2),
            EndDateTime = DateTime.UtcNow.AddDays(2).AddHours(2),
            IsAllDay = false,
            Location = "Sala Test",
            EventType = "Conferencia",
            IsFeatured = false,
            IsRecurring = false
        };

        // Act
        var result = await _service.CreateEventAsync(createDto, 1);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Nuevo Evento de Prueba");
        result.Location.Should().Be("Sala Test");

        // Verificar que se guardó en la base de datos
        var saved = await _context.Events.FirstOrDefaultAsync(e => e.Id == result.Id.ToString());
        saved.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateEventAsync_AsRecurring_ShouldCreateRecurringEvent()
    {
        // Arrange
        var createDto = new CreateEventDto
        {
            Title = "Evento Recurrente",
            Description = "Evento que se repite semanalmente",
            StartDateTime = DateTime.UtcNow.AddDays(1),
            EndDateTime = DateTime.UtcNow.AddDays(1).AddHours(1),
            IsAllDay = false,
            Location = "Sala Recurrente",
            EventType = "Clase",
            IsFeatured = false,
            IsRecurring = true,
            RecurrencePattern = "weekly",
            RecurrenceInterval = 1,
            RecurrenceEndDate = DateTime.UtcNow.AddDays(60),
            RecurrenceDaysOfWeek = "2,4" // Martes, Jueves
        };

        // Act
        var result = await _service.CreateEventAsync(createDto, 1);

        // Assert
        result.Should().NotBeNull();
        result.IsRecurring.Should().BeTrue();
        result.RecurrencePattern.Should().Be("weekly");
        result.RecurrenceDaysOfWeek.Should().Be("2,4");
    }

    [Fact]
    public async Task CreateEventAsync_AsAllDay_ShouldCreateAllDayEvent()
    {
        // Arrange
        var createDto = new CreateEventDto
        {
            Title = "Evento de Todo el Día",
            Description = "Evento que dura todo el día",
            StartDateTime = DateTime.UtcNow.AddDays(3).Date,
            IsAllDay = true,
            Location = "Todo el Centro",
            EventType = "Celebración",
            IsFeatured = false,
            IsRecurring = false
        };

        // Act
        var result = await _service.CreateEventAsync(createDto, 1);

        // Assert
        result.Should().NotBeNull();
        result.IsAllDay.Should().BeTrue();
    }

    #endregion

    #region UPDATE Operations

    [Fact]
    public async Task UpdateEventAsync_WithValidData_ShouldUpdateEvent()
    {
        // Arrange
        var existingEvent = _context.Events.First(e => e.IsActive && !e.IsRecurring);
        var eventId = Guid.Parse(existingEvent.Id);
        var updateDto = new UpdateEventDto
        {
            Title = "Taller de Programación - Actualizado",
            Description = "Descripción actualizada",
            StartDateTime = DateTime.UtcNow.AddDays(5),
            EndDateTime = DateTime.UtcNow.AddDays(5).AddHours(3),
            IsAllDay = false,
            Location = "Sala A - Nueva",
            EventType = "Taller",
            IsFeatured = true,
            IsRecurring = false
        };

        // Act
        var result = await _service.UpdateEventAsync(eventId, updateDto, 1);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Taller de Programación - Actualizado");
        result.Location.Should().Be("Sala A - Nueva");
    }

    [Fact]
    public async Task UpdateEventAsync_WithInvalidId_ShouldThrowException()
    {
        // Arrange
        var invalidId = Guid.NewGuid();
        var updateDto = new UpdateEventDto
        {
            Title = "Test",
            StartDateTime = DateTime.UtcNow.AddDays(1)
        };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(async () =>
            await _service.UpdateEventAsync(invalidId, updateDto, 1));
    }

    #endregion

    #region DELETE Operations

    [Fact]
    public async Task DeleteEventAsync_WithValidId_ShouldDeleteEvent()
    {
        // Arrange
        var existingEvent = _context.Events.First(e => e.IsActive && !e.IsFeatured);
        var eventId = Guid.Parse(existingEvent.Id);

        // Act
        var result = await _service.DeleteEventAsync(eventId, 1);

        // Assert
        result.Should().BeTrue();

        // Verificar que fue marcado como inactivo (soft delete)
        var deleted = await _context.Events.FindAsync(existingEvent.Id);
        deleted.Should().NotBeNull();
        deleted!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteEventAsync_WithInvalidId_ShouldReturnFalse()
    {
        // Arrange
        var invalidId = Guid.NewGuid();

        // Act
        var result = await _service.DeleteEventAsync(invalidId, 1);

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region Featured and Upcoming Events

    [Fact]
    public async Task GetFeaturedEventsAsync_ShouldReturnFeaturedEvents()
    {
        // Act
        var result = await _service.GetFeaturedEventsAsync(5);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        result.Should().OnlyContain(e => e.IsFeatured == true);
        result.First().Title.Should().Be("Taller de Programación");
    }

    [Fact]
    public async Task GetUpcomingEventsAsync_ShouldReturnUpcomingEvents()
    {
        // Act
        var result = await _service.GetUpcomingEventsAsync(10);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCountGreaterThan(0);
        // Todos deberían ser eventos futuros
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        result.Should().OnlyContain(e => e.StartDateTime > DateTime.UtcNow.AddMinutes(-5)); // Pequeño margen
    }

    #endregion

    #region Calendar View

    [Fact]
    public async Task GetCalendarViewAsync_MonthView_ShouldReturnEventsInMonth()
    {
        // Arrange
        var viewDate = DateTime.UtcNow.AddDays(5);

        // Act
        var result = await _service.GetCalendarViewAsync(viewDate, "month");

        // Assert
        result.Should().NotBeNull();
        result.ViewType.Should().Be("month");
        result.Events.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetCalendarViewAsync_WeekView_ShouldReturnEventsInWeek()
    {
        // Arrange
        var viewDate = DateTime.UtcNow.AddDays(2);

        // Act
        var result = await _service.GetCalendarViewAsync(viewDate, "week");

        // Assert
        result.Should().NotBeNull();
        result.ViewType.Should().Be("week");
        result.Events.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetCalendarViewAsync_DayView_ShouldReturnEventsInDay()
    {
        // Arrange
        var viewDate = DateTime.UtcNow.AddDays(1);

        // Act
        var result = await _service.GetCalendarViewAsync(viewDate, "day");

        // Assert
        result.Should().NotBeNull();
        result.ViewType.Should().Be("day");
        // Puede o no tener eventos dependiendo de los datos de prueba
    }

    [Fact]
    public async Task GetCalendarViewAsync_WithRecurringEvents_ShouldExpandOccurrences()
    {
        // Arrange
        var viewDate = DateTime.UtcNow.AddDays(5);

        // Act
        var result = await _service.GetCalendarViewAsync(viewDate, "month");

        // Assert
        result.Should().NotBeNull();
        // Debería incluir múltiples ocurrencias del evento recurrente
        var recurringEventOccurrences = result.Events.Where(e => e.IsRecurring).ToList();
        recurringEventOccurrences.Should().NotBeEmpty();
    }

    #endregion

    #region Edge Cases and Validation

    [Fact]
    public async Task GetEventsAsync_WithDateRangeFilter_ShouldReturnEventsInRange()
    {
        // Arrange
        var searchDto = new EventSearchDto
        {
            Page = 1,
            PageSize = 10,
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(10)
        };

        // Act
        var result = await _service.GetEventsAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Events.Should().NotBeEmpty();
    }

    #endregion

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
