using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using CentroCultural.Domain.Entities;
using CentroCultural.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Models;

namespace CentroCultural.Application.Services
{
    public class EventService : IEventService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<EventService> _logger;

        public EventService(ApplicationDbContext context, ILogger<EventService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<EventPagedResultDto> GetEventsAsync(EventSearchDto searchDto)
        {
            var query = _context.Event
                .Include(e => e.Organizer)
                .Include(e => e.RelatedCourse)
                .Include(e => e.RelatedBlogPost)
                .Where(e => e.IsActive);

            // Aplicar filtros
            if (!string.IsNullOrEmpty(searchDto.SearchTerm))
            {
                query = query.Where(e => e.Title.Contains(searchDto.SearchTerm) ||
                                        e.Description != null && e.Description.Contains(searchDto.SearchTerm));
            }

            if (!string.IsNullOrEmpty(searchDto.EventType))
            {
                query = query.Where(e => e.EventType == searchDto.EventType);
            }

            if (searchDto.StartDate.HasValue)
            {
                query = query.Where(e => e.StartDateTime >= searchDto.StartDate.Value);
            }

            if (searchDto.EndDate.HasValue)
            {
                query = query.Where(e => e.StartDateTime <= searchDto.EndDate.Value);
            }

            if (searchDto.IsFeatured.HasValue)
            {
                query = query.Where(e => e.IsFeatured == searchDto.IsFeatured.Value);
            }

            if (searchDto.RelatedCourseId.HasValue)
            {
                query = query.Where(e => e.RelatedCourseId == searchDto.RelatedCourseId.Value);
            }

            // Ordenamiento
            query = searchDto.SortBy?.ToLower() switch
            {
                "start_desc" => query.OrderByDescending(e => e.StartDateTime),
                "created_desc" => query.OrderByDescending(e => e.CreatedAt),
                "title_asc" => query.OrderBy(e => e.Title),
                _ => query.OrderBy(e => e.StartDateTime) // start_asc por defecto
            };

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalCount / searchDto.PageSize);

            var events = await query
                .Skip((searchDto.Page - 1) * searchDto.PageSize)
                .Take(searchDto.PageSize)
                .Select(e => new EventSummaryDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    Description = e.Description,
                    StartDateTime = e.StartDateTime,
                    EndDateTime = e.EndDateTime,
                    IsAllDay = e.IsAllDay,
                    Location = e.Location,
                    EventType = e.EventType,
                    IsFeatured = e.IsFeatured,
                    ImagePath = e.ImagePath,
                    IsRecurring = e.IsRecurring,
                    OrganizerName = e.Organizer.Nombre + " " + e.Organizer.Apellido,
                    RelatedCourseId = e.RelatedCourseId,
                    RelatedCourseTitle = e.RelatedCourse != null ? e.RelatedCourse.Title : null,
                    RelatedBlogPostId = e.RelatedBlogPostId,
                    RelatedBlogPostTitle = e.RelatedBlogPost != null ? e.RelatedBlogPost.Title : null,
                    RelatedBlogPostSlug = e.RelatedBlogPost != null ? e.RelatedBlogPost.Slug : null
                })
                .ToListAsync();

            return new EventPagedResultDto
            {
                Events = events,
                TotalCount = totalCount,
                Page = searchDto.Page,
                PageSize = searchDto.PageSize,
                TotalPages = totalPages,
                HasNextPage = searchDto.Page < totalPages,
                HasPreviousPage = searchDto.Page > 1
            };
        }

        public async Task<EventDetailDto?> GetEventByIdAsync(Guid id)
        {
            var eventEntity = await _context.Event
                .Include(e => e.Organizer)
                .Include(e => e.RelatedCourse)
                .Include(e => e.RelatedBlogPost)
                .Include(e => e.Registrations)
                .FirstOrDefaultAsync(e => e.Id == id && e.IsActive);

            if (eventEntity == null)
                return null;

            return new EventDetailDto
            {
                Id = eventEntity.Id,
                Title = eventEntity.Title,
                Description = eventEntity.Description,
                StartDateTime = eventEntity.StartDateTime,
                EndDateTime = eventEntity.EndDateTime,
                IsAllDay = eventEntity.IsAllDay,
                Location = eventEntity.Location,
                EventType = eventEntity.EventType,
                IsActive = eventEntity.IsActive,
                IsFeatured = eventEntity.IsFeatured,
                MaxAttendees = eventEntity.MaxAttendees,
                CurrentAttendees = eventEntity.Registrations.Count(r => r.Status == RegistrationStatus.Confirmed),
                RequiresRegistration = eventEntity.RequiresRegistration,
                RegistrationDeadline = eventEntity.RegistrationDeadline,
                ImagePath = eventEntity.ImagePath,
                PdfPath = eventEntity.PdfPath,
                IsRecurring = eventEntity.IsRecurring,
                RecurrencePattern = eventEntity.RecurrencePattern,
                RecurrenceInterval = eventEntity.RecurrenceInterval,
                RecurrenceEndDate = eventEntity.RecurrenceEndDate,
                RecurrenceDaysOfWeek = eventEntity.RecurrenceDaysOfWeek,
                RelatedCourseId = eventEntity.RelatedCourseId,
                RelatedCourseTitle = eventEntity.RelatedCourse?.Title,
                RelatedBlogPostId = eventEntity.RelatedBlogPostId,
                RelatedBlogPostTitle = eventEntity.RelatedBlogPost?.Title,
                RelatedBlogPostSlug = eventEntity.RelatedBlogPost?.Slug,
                CreatedAt = eventEntity.CreatedAt,
                UpdatedAt = eventEntity.UpdatedAt,
                OrganizerId = eventEntity.OrganizerId,
                OrganizerName = eventEntity.Organizer.Nombre + " " + eventEntity.Organizer.Apellido,
                Registrations = eventEntity.Registrations.Select(r => new EventRegistrationDto
                {
                    Id = r.Id,
                    EventId = r.EventId,
                    EventTitle = eventEntity.Title,
                    UserId = r.IsGuest ? null : r.UserId,
                    UserName = r.User != null ? r.User.Nombre + " " + r.User.Apellido : null,
                    ContactName = r.IsGuest ? r.GuestName ?? "" : (r.User?.Nombre + " " + r.User?.Apellido) ?? "",
                    ContactEmail = r.IsGuest ? r.GuestEmail ?? "" : "",
                    ContactPhone = r.IsGuest ? r.GuestPhone : "",
                    Status = r.Status.ToString(),
                    RegisteredAt = r.RegistrationDate,
                    Notes = r.Notes
                }).ToList()
            };
        }

        public async Task<IEnumerable<EventSummaryDto>> GetEventsForMonthAsync(int year, int month)
        {
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);

            return await _context.Event
                .Include(e => e.Organizer)
                .Where(e => e.IsActive && e.StartDateTime >= startDate && e.StartDateTime <= endDate)
                .OrderBy(e => e.StartDateTime)
                .Select(e => new EventSummaryDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    Description = e.Description,
                    StartDateTime = e.StartDateTime,
                    EndDateTime = e.EndDateTime,
                    IsAllDay = e.IsAllDay,
                    Location = e.Location,
                    EventType = e.EventType,
                    IsFeatured = e.IsFeatured,
                    ImagePath = e.ImagePath,
                    IsRecurring = e.IsRecurring,
                    OrganizerName = e.Organizer.Nombre + " " + e.Organizer.Apellido
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<EventSummaryDto>> GetUpcomingEventsAsync(int count = 6)
        {
            var now = DateTime.Now;

            return await _context.Event
                .Include(e => e.Organizer)
                .Where(e => e.IsActive && e.StartDateTime > now)
                .OrderBy(e => e.StartDateTime)
                .Take(count)
                .Select(e => new EventSummaryDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    Description = e.Description,
                    StartDateTime = e.StartDateTime,
                    EndDateTime = e.EndDateTime,
                    IsAllDay = e.IsAllDay,
                    Location = e.Location,
                    EventType = e.EventType,
                    IsFeatured = e.IsFeatured,
                    ImagePath = e.ImagePath,
                    IsRecurring = e.IsRecurring,
                    OrganizerName = e.Organizer.Nombre + " " + e.Organizer.Apellido
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<EventSummaryDto>> GetFeaturedEventsAsync(int count = 6)
        {
            return await _context.Event
                .Include(e => e.Organizer)
                .Where(e => e.IsActive && e.IsFeatured)
                .OrderBy(e => e.StartDateTime)
                .Take(count)
                .Select(e => new EventSummaryDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    Description = e.Description,
                    StartDateTime = e.StartDateTime,
                    EndDateTime = e.EndDateTime,
                    IsAllDay = e.IsAllDay,
                    Location = e.Location,
                    EventType = e.EventType,
                    IsFeatured = e.IsFeatured,
                    ImagePath = e.ImagePath,
                    IsRecurring = e.IsRecurring,
                    OrganizerName = e.Organizer.Nombre + " " + e.Organizer.Apellido
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<EventSummaryDto>> GetEventsByOrganizerAsync(string organizerId)
        {
            if (!int.TryParse(organizerId, out int userId))
                return new List<EventSummaryDto>();

            return await _context.Event
                .Include(e => e.Organizer)
                .Where(e => e.OrganizerId == userId && e.IsActive)
                .OrderByDescending(e => e.CreatedAt)
                .Select(e => new EventSummaryDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    Description = e.Description,
                    StartDateTime = e.StartDateTime,
                    EndDateTime = e.EndDateTime,
                    IsAllDay = e.IsAllDay,
                    Location = e.Location,
                    EventType = e.EventType,
                    IsFeatured = e.IsFeatured,
                    ImagePath = e.ImagePath,
                    IsRecurring = e.IsRecurring,
                    OrganizerName = e.Organizer.Nombre + " " + e.Organizer.Apellido
                })
                .ToListAsync();
        }

        public async Task<EventDto> CreateEventAsync(CreateEventDto eventDto, string organizerId)
        {
            if (!int.TryParse(organizerId, out int userId))
                throw new ArgumentException("ID de organizador inválido");

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = eventDto.Title,
                Description = eventDto.Description,
                StartDateTime = eventDto.StartDateTime,
                EndDateTime = eventDto.EndDateTime,
                IsAllDay = eventDto.IsAllDay,
                Location = eventDto.Location,
                EventType = eventDto.EventType,
                IsFeatured = eventDto.IsFeatured,
                MaxAttendees = eventDto.MaxAttendees,
                RequiresRegistration = eventDto.RequiresRegistration,
                RegistrationDeadline = eventDto.RegistrationDeadline,
                ImagePath = eventDto.ImagePath,
                PdfPath = eventDto.PdfPath,
                IsRecurring = eventDto.IsRecurring,
                RecurrencePattern = eventDto.RecurrencePattern,
                RecurrenceInterval = eventDto.RecurrenceInterval,
                RecurrenceEndDate = eventDto.RecurrenceEndDate,
                RecurrenceDaysOfWeek = eventDto.RecurrenceDaysOfWeek,
                RelatedCourseId = eventDto.RelatedCourseId,
                RelatedBlogPostId = eventDto.RelatedBlogPostId,
                IsActive = true,
                OrganizerId = userId,
                CreatedAt = DateTime.Now
            };

            _context.Event.Add(eventEntity);
            await _context.SaveChangesAsync();

            return new EventDto
            {
                Id = eventEntity.Id,
                Title = eventEntity.Title,
                Description = eventEntity.Description,
                StartDateTime = eventEntity.StartDateTime,
                EndDateTime = eventEntity.EndDateTime,
                IsAllDay = eventEntity.IsAllDay,
                Location = eventEntity.Location,
                EventType = eventEntity.EventType,
                IsActive = eventEntity.IsActive,
                IsFeatured = eventEntity.IsFeatured,
                MaxAttendees = eventEntity.MaxAttendees,
                CurrentAttendees = 0,
                RequiresRegistration = eventEntity.RequiresRegistration,
                RegistrationDeadline = eventEntity.RegistrationDeadline,
                ImagePath = eventEntity.ImagePath,
                PdfPath = eventEntity.PdfPath,
                IsRecurring = eventEntity.IsRecurring,
                RecurrencePattern = eventEntity.RecurrencePattern,
                RecurrenceInterval = eventEntity.RecurrenceInterval,
                RecurrenceEndDate = eventEntity.RecurrenceEndDate,
                RecurrenceDaysOfWeek = eventEntity.RecurrenceDaysOfWeek,
                RelatedCourseId = eventEntity.RelatedCourseId,
                RelatedBlogPostId = eventEntity.RelatedBlogPostId,
                CreatedAt = eventEntity.CreatedAt,
                OrganizerId = eventEntity.OrganizerId,
                OrganizerName = "Usuario" // Se podría obtener del contexto
            };
        }

        public async Task<bool> UpdateEventAsync(Guid id, UpdateEventDto eventDto, string userId)
        {
            if (!int.TryParse(userId, out int userIdInt))
                return false;

            var eventEntity = await _context.Event.FirstOrDefaultAsync(e => e.Id == id && e.IsActive);
            if (eventEntity == null)
                return false;

            // Verificar permisos (solo organizador o admin puede editar)
            var user = await _context.Usuario.FirstOrDefaultAsync(u => u.IdUsuario == userIdInt);
            if (user == null || (eventEntity.OrganizerId != userIdInt && user.IdRol != 3)) // 3 = Admin
                throw new UnauthorizedAccessException();

            // Actualizar propiedades
            eventEntity.Title = eventDto.Title;
            eventEntity.Description = eventDto.Description;
            eventEntity.StartDateTime = eventDto.StartDateTime;
            eventEntity.EndDateTime = eventDto.EndDateTime;
            eventEntity.IsAllDay = eventDto.IsAllDay;
            eventEntity.Location = eventDto.Location;
            eventEntity.EventType = eventDto.EventType;
            eventEntity.IsFeatured = eventDto.IsFeatured;
            eventEntity.MaxAttendees = eventDto.MaxAttendees;
            eventEntity.RequiresRegistration = eventDto.RequiresRegistration;
            eventEntity.RegistrationDeadline = eventDto.RegistrationDeadline;
            eventEntity.ImagePath = eventDto.ImagePath;
            eventEntity.PdfPath = eventDto.PdfPath;
            eventEntity.IsRecurring = eventDto.IsRecurring;
            eventEntity.RecurrencePattern = eventDto.RecurrencePattern;
            eventEntity.RecurrenceInterval = eventDto.RecurrenceInterval;
            eventEntity.RecurrenceEndDate = eventDto.RecurrenceEndDate;
            eventEntity.RecurrenceDaysOfWeek = eventDto.RecurrenceDaysOfWeek;
            eventEntity.RelatedCourseId = eventDto.RelatedCourseId;
            eventEntity.RelatedBlogPostId = eventDto.RelatedBlogPostId;
            eventEntity.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteEventAsync(Guid id, string userId)
        {
            if (!int.TryParse(userId, out int userIdInt))
                return false;

            var eventEntity = await _context.Event.FirstOrDefaultAsync(e => e.Id == id && e.IsActive);
            if (eventEntity == null)
                return false;

            // Verificar permisos
            var user = await _context.Usuario.FirstOrDefaultAsync(u => u.IdUsuario == userIdInt);
            if (user == null || (eventEntity.OrganizerId != userIdInt && user.IdRol != 3)) // 3 = Admin
                throw new UnauthorizedAccessException();

            eventEntity.IsActive = false;
            eventEntity.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<EventRegistrationDto>> GetEventRegistrationsAsync(Guid eventId, string userId)
        {
            if (!int.TryParse(userId, out int userIdInt))
                throw new UnauthorizedAccessException();

            var eventEntity = await _context.Event.FirstOrDefaultAsync(e => e.Id == eventId && e.IsActive);
            if (eventEntity == null)
                throw new ArgumentException("Evento no encontrado");

            // Verificar permisos
            var user = await _context.Usuario.FirstOrDefaultAsync(u => u.IdUsuario == userIdInt);
            if (user == null || (eventEntity.OrganizerId != userIdInt && user.IdRol != 3))
                throw new UnauthorizedAccessException();

            return await _context.EventRegistration
                .Include(r => r.User)
                .Where(r => r.EventId == eventId)
                .Select(r => new EventRegistrationDto
                {
                    Id = r.Id,
                    EventId = r.EventId,
                    EventTitle = eventEntity.Title,
                    UserId = r.IsGuest ? null : r.UserId,
                    UserName = r.User != null ? r.User.Nombre + " " + r.User.Apellido : null,
                    ContactName = r.IsGuest ? r.GuestName ?? "" : (r.User?.Nombre + " " + r.User?.Apellido) ?? "",
                    ContactEmail = r.IsGuest ? r.GuestEmail ?? "" : "",
                    ContactPhone = r.IsGuest ? r.GuestPhone : "",
                    Status = r.Status.ToString(),
                    RegisteredAt = r.RegistrationDate,
                    Notes = r.Notes
                })
                .ToListAsync();
        }

        public async Task<EventRegistrationDto> RegisterForEventAsync(Guid eventId, CreateEventRegistrationDto registrationDto, string? userId = null)
        {
            var eventEntity = await _context.Event.FirstOrDefaultAsync(e => e.Id == eventId && e.IsActive);
            if (eventEntity == null)
                throw new ArgumentException("Evento no encontrado");

            // Verificar si el evento requiere inscripción
            if (!eventEntity.RequiresRegistration)
                throw new InvalidOperationException("Este evento no requiere inscripción");

            // Verificar deadline de inscripción
            if (eventEntity.RegistrationDeadline.HasValue && DateTime.Now > eventEntity.RegistrationDeadline.Value)
                throw new InvalidOperationException("El período de inscripción ha terminado");

            // Verificar cupo
            var currentRegistrations = await _context.EventRegistration
                .CountAsync(r => r.EventId == eventId && r.Status == RegistrationStatus.Confirmed);

            if (eventEntity.MaxAttendees.HasValue && currentRegistrations >= eventEntity.MaxAttendees.Value)
                throw new InvalidOperationException("No hay cupos disponibles");

            int userIdInt = 0;
            bool isGuest = string.IsNullOrEmpty(userId) || !int.TryParse(userId, out userIdInt);

            // Verificar si ya está inscrito (solo para usuarios registrados)
            if (!isGuest)
            {
                var existingRegistration = await _context.EventRegistration
                    .FirstOrDefaultAsync(r => r.EventId == eventId && r.UserId == userIdInt);
                if (existingRegistration != null)
                    throw new InvalidOperationException("Ya estás inscrito en este evento");
            }

            var registration = new EventRegistration
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                UserId = isGuest ? 0 : userIdInt, // 0 para guests
                IsGuest = isGuest,
                GuestName = isGuest ? registrationDto.ContactName : null,
                GuestEmail = isGuest ? registrationDto.ContactEmail : null,
                GuestPhone = isGuest ? registrationDto.ContactPhone : null,
                Status = RegistrationStatus.Pending,
                RegistrationDate = DateTime.Now,
                Notes = registrationDto.Notes
            };

            _context.EventRegistration.Add(registration);
            await _context.SaveChangesAsync();

            return new EventRegistrationDto
            {
                Id = registration.Id,
                EventId = registration.EventId,
                EventTitle = eventEntity.Title,
                UserId = registration.IsGuest ? null : registration.UserId,
                ContactName = registration.IsGuest ? registration.GuestName ?? "" : "",
                ContactEmail = registration.IsGuest ? registration.GuestEmail ?? "" : "",
                ContactPhone = registration.IsGuest ? registration.GuestPhone : "",
                Status = registration.Status.ToString(),
                RegisteredAt = registration.RegistrationDate,
                Notes = registration.Notes
            };
        }

        public async Task<bool> UpdateRegistrationStatusAsync(Guid registrationId, UpdateRegistrationStatusDto statusDto, string userId)
        {
            if (!int.TryParse(userId, out int userIdInt))
                return false;

            var registration = await _context.EventRegistration
                .Include(r => r.Event)
                .FirstOrDefaultAsync(r => r.Id == registrationId);

            if (registration == null)
                return false;

            // Verificar permisos
            var user = await _context.Usuario.FirstOrDefaultAsync(u => u.IdUsuario == userIdInt);
            if (user == null || (registration.Event.OrganizerId != userIdInt && user.IdRol != 3))
                throw new UnauthorizedAccessException();

            if (Enum.TryParse<RegistrationStatus>(statusDto.Status, out var status))
                registration.Status = status;
            else
                throw new ArgumentException("Estado de inscripción inválido");
            registration.Notes = statusDto.Notes;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<string>> GetEventTypesAsync()
        {
            return await _context.Event
                .Where(e => e.IsActive)
                .Select(e => e.EventType)
                .Distinct()
                .OrderBy(t => t)
                .ToListAsync();
        }
    }
}