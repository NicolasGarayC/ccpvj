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
/// Tests Unitarios para CalendarController
/// Verifica el comportamiento de los endpoints HTTP del calendario
/// </summary>
public class CalendarControllerTests
{
    private readonly Mock<ICalendarService> _mockService;
    private readonly Mock<ILogger<CalendarController>> _mockLogger;
    private readonly CalendarController _controller;

    public CalendarControllerTests()
    {
        _mockService = new Mock<ICalendarService>();
        _mockLogger = new Mock<ILogger<CalendarController>>();
        _controller = new CalendarController(_mockService.Object, _mockLogger.Object);
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
    public async Task GetEvents_WithValidSearch_ShouldReturnOkWithEvents()
    {
        // Arrange
        var searchDto = new EventSearchDto { Page = 1, PageSize = 10 };
        var expectedResult = new EventPagedResultDto
        {
            Events = new List<EventSummaryDto>
            {
                new EventSummaryDto { Id = Guid.NewGuid(), Title = "Test Event" }
            },
            TotalCount = 1,
            Page = 1,
            PageSize = 10
        };

        _mockService
            .Setup(s => s.GetEventsAsync(It.IsAny<EventSearchDto>()))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.GetEvents(searchDto);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var events = okResult!.Value as IEnumerable<EventSummaryDto>;
        events.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetEvents_WhenServiceThrows_ShouldReturn500()
    {
        // Arrange
        var searchDto = new EventSearchDto();
        _mockService
            .Setup(s => s.GetEventsAsync(It.IsAny<EventSearchDto>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetEvents(searchDto);

        // Assert
        result.Result.Should().BeOfType<ObjectResult>();
        var objectResult = result.Result as ObjectResult;
        objectResult!.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task GetEventsPaged_WithValidSearch_ShouldReturnOkWithPagedResult()
    {
        // Arrange
        var searchDto = new EventSearchDto { Page = 1, PageSize = 10 };
        var expectedResult = new EventPagedResultDto
        {
            Events = new List<EventSummaryDto>
            {
                new EventSummaryDto { Id = Guid.NewGuid(), Title = "Event 1" },
                new EventSummaryDto { Id = Guid.NewGuid(), Title = "Event 2" }
            },
            TotalCount = 2,
            Page = 1,
            PageSize = 10
        };

        _mockService
            .Setup(s => s.GetEventsAsync(searchDto))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.GetEventsPaged(searchDto);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedResult);
    }

    [Fact]
    public async Task GetEvent_WithValidId_ShouldReturnOkWithEvent()
    {
        // Arrange
        var eventId = Guid.NewGuid();
        var expectedEvent = new EventDto
        {
            Id = eventId,
            Title = "Test Event"
        };

        _mockService
            .Setup(s => s.GetEventByIdAsync(eventId))
            .ReturnsAsync(expectedEvent);

        // Act
        var result = await _controller.GetEvent(eventId);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedEvent);
    }

    [Fact]
    public async Task GetEvent_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        var eventId = Guid.NewGuid();
        _mockService
            .Setup(s => s.GetEventByIdAsync(eventId))
            .ReturnsAsync((EventDto?)null);

        // Act
        var result = await _controller.GetEvent(eventId);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetCalendarView_WithValidDate_ShouldReturnOkWithView()
    {
        // Arrange
        var viewDate = DateTime.Now;
        var viewType = "month";
        var expectedView = new CalendarViewDto
        {
            ViewDate = viewDate,
            Events = new List<EventSummaryDto>()
        };

        _mockService
            .Setup(s => s.GetCalendarViewAsync(viewDate, viewType))
            .ReturnsAsync(expectedView);

        // Act
        var result = await _controller.GetCalendarView(viewDate, viewType);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetUpcomingEvents_ShouldReturnOkWithEvents()
    {
        // Arrange
        var limit = 10;
        var expectedEvents = new List<EventSummaryDto>
        {
            new EventSummaryDto { Id = Guid.NewGuid(), Title = "Upcoming 1" },
            new EventSummaryDto { Id = Guid.NewGuid(), Title = "Upcoming 2" }
        };

        _mockService
            .Setup(s => s.GetUpcomingEventsAsync(limit))
            .ReturnsAsync(expectedEvents);

        // Act
        var result = await _controller.GetUpcomingEvents(limit);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var events = okResult!.Value as IEnumerable<EventSummaryDto>;
        events.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetFeaturedEvents_ShouldReturnOkWithFeaturedEvents()
    {
        // Arrange
        var limit = 5;
        var expectedEvents = new List<EventSummaryDto>
        {
            new EventSummaryDto { Id = Guid.NewGuid(), Title = "Featured 1", IsFeatured = true }
        };

        _mockService
            .Setup(s => s.GetFeaturedEventsAsync(limit))
            .ReturnsAsync(expectedEvents);

        // Act
        var result = await _controller.GetFeaturedEvents(limit);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var events = okResult!.Value as IEnumerable<EventSummaryDto>;
        events.Should().OnlyContain(e => e.IsFeatured == true);
    }

    [Fact]
    public async Task GetEventTypes_ShouldReturnOkWithEventTypes()
    {
        // Arrange
        var expectedTypes = new List<EventTypeDto>
        {
            new EventTypeDto { Type = "Workshop", DisplayName = "Workshop", Color = "blue" },
            new EventTypeDto { Type = "Concert", DisplayName = "Concert", Color = "red" }
        };

        _mockService
            .Setup(s => s.GetEventTypesAsync())
            .ReturnsAsync(expectedTypes);

        // Act
        var result = await _controller.GetEventTypes();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var types = okResult!.Value as IEnumerable<EventTypeDto>;
        types.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetEventsByType_ShouldReturnOkWithFilteredEvents()
    {
        // Arrange
        var eventType = "Workshop";
        var expectedEvents = new List<EventSummaryDto>
        {
            new EventSummaryDto { Id = Guid.NewGuid(), Title = "Workshop 1", EventType = eventType }
        };

        _mockService
            .Setup(s => s.GetEventsByTypeAsync(eventType, null, null))
            .ReturnsAsync(expectedEvents);

        // Act
        var result = await _controller.GetEventsByType(eventType);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetEventStatistics_ShouldReturnOkWithStatistics()
    {
        // Arrange
        var expectedStats = new { TotalEvents = 100, UpcomingEvents = 25, FeaturedEvents = 10 };

        _mockService
            .Setup(s => s.GetEventStatisticsAsync(null, null))
            .ReturnsAsync(expectedStats);

        // Act
        var result = await _controller.GetEventStatistics();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
    }

    #endregion

    #region POST/PUT/DELETE Tests

    [Fact]
    public async Task CreateEvent_WithValidData_ShouldReturnCreatedAtAction()
    {
        // Arrange
        SetupUserClaims("1");
        var createDto = new CreateEventDto
        {
            Title = "New Event",
            StartDateTime = DateTime.Now.AddDays(7)
        };

        var createdEvent = new EventDto
        {
            Id = Guid.NewGuid(),
            Title = createDto.Title
        };

        _mockService
            .Setup(s => s.CreateEventAsync(createDto, 1))
            .ReturnsAsync(createdEvent);

        // Act
        var result = await _controller.CreateEvent(createDto);

        // Assert
        result.Result.Should().BeOfType<CreatedAtActionResult>();
        var createdResult = result.Result as CreatedAtActionResult;
        createdResult!.ActionName.Should().Be(nameof(_controller.GetEvent));
    }

    [Fact]
    public async Task CreateEvent_WithoutUserId_ShouldReturnUnauthorized()
    {
        // Arrange
        var createDto = new CreateEventDto { Title = "Test" };

        // Act
        var result = await _controller.CreateEvent(createDto);

        // Assert
        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task UpdateEvent_WithValidData_ShouldReturnOkWithUpdatedEvent()
    {
        // Arrange
        SetupUserClaims("1");
        var eventId = Guid.NewGuid();
        var updateDto = new UpdateEventDto { Title = "Updated Event" };
        var updatedEvent = new EventDto
        {
            Id = eventId,
            Title = updateDto.Title
        };

        _mockService
            .Setup(s => s.UpdateEventAsync(eventId, updateDto, 1))
            .ReturnsAsync(updatedEvent);

        // Act
        var result = await _controller.UpdateEvent(eventId, updateDto);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task UpdateEvent_WhenNotFound_ShouldReturnNotFound()
    {
        // Arrange
        SetupUserClaims("1");
        var eventId = Guid.NewGuid();
        var updateDto = new UpdateEventDto { Title = "Updated Event" };

        _mockService
            .Setup(s => s.UpdateEventAsync(eventId, updateDto, 1))
            .ThrowsAsync(new ArgumentException("Event not found"));

        // Act
        var result = await _controller.UpdateEvent(eventId, updateDto);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task DeleteEvent_WithValidId_ShouldReturnNoContent()
    {
        // Arrange
        SetupUserClaims("1");
        var eventId = Guid.NewGuid();

        _mockService
            .Setup(s => s.DeleteEventAsync(eventId, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteEvent(eventId);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task DeleteEvent_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        SetupUserClaims("1");
        var eventId = Guid.NewGuid();

        _mockService
            .Setup(s => s.DeleteEventAsync(eventId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteEvent(eventId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region Featured and Registration Tests

    [Fact]
    public async Task SetEventFeatured_WithValidId_ShouldReturnOk()
    {
        // Arrange
        SetupUserClaims("1");
        var eventId = Guid.NewGuid();
        var isFeatured = true;

        _mockService
            .Setup(s => s.SetEventFeaturedAsync(eventId, isFeatured, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.SetEventFeatured(eventId, isFeatured);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RegisterToEvent_WithValidId_ShouldReturnOk()
    {
        // Arrange
        SetupUserClaims("1");
        var eventId = Guid.NewGuid();

        _mockService
            .Setup(s => s.RegisterToEventAsync(eventId, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.RegisterToEvent(eventId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RegisterToEvent_WhenFull_ShouldReturnBadRequest()
    {
        // Arrange
        SetupUserClaims("1");
        var eventId = Guid.NewGuid();

        _mockService
            .Setup(s => s.RegisterToEventAsync(eventId, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.RegisterToEvent(eventId);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task UnregisterFromEvent_WithValidId_ShouldReturnOk()
    {
        // Arrange
        SetupUserClaims("1");
        var eventId = Guid.NewGuid();

        _mockService
            .Setup(s => s.UnregisterFromEventAsync(eventId, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.UnregisterFromEvent(eventId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetUserRegisteredEvents_ShouldReturnOkWithEvents()
    {
        // Arrange
        SetupUserClaims("1");
        var expectedEvents = new List<EventSummaryDto>
        {
            new EventSummaryDto { Id = Guid.NewGuid(), Title = "Registered Event 1" }
        };

        _mockService
            .Setup(s => s.GetUserRegisteredEventsAsync(1))
            .ReturnsAsync(expectedEvents);

        // Act
        var result = await _controller.GetUserRegisteredEvents();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var events = okResult!.Value as IEnumerable<EventSummaryDto>;
        events.Should().HaveCount(1);
    }

    #endregion

    #region Error Handling Tests

    [Fact]
    public async Task GetEvents_WhenServiceThrows_ShouldLogError()
    {
        // Arrange
        var searchDto = new EventSearchDto();
        _mockService
            .Setup(s => s.GetEventsAsync(It.IsAny<EventSearchDto>()))
            .ThrowsAsync(new Exception("Test error"));

        // Act
        await _controller.GetEvents(searchDto);

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
    public async Task CreateEvent_Success_ShouldLogInformation()
    {
        // Arrange
        SetupUserClaims("1");
        var createDto = new CreateEventDto { Title = "Test" };
        var createdEvent = new EventDto { Id = Guid.NewGuid(), Title = "Test" };

        _mockService
            .Setup(s => s.CreateEventAsync(It.IsAny<CreateEventDto>(), It.IsAny<int>()))
            .ReturnsAsync(createdEvent);

        // Act
        await _controller.CreateEvent(createDto);

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
