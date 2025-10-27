import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { calendarService } from '../CalendarService';

vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_BACKEND_BASE_URL: 'http://localhost:5251'
	}
}));

const backendEventBase = {
	id: 'event-1',
	title: 'Evento Cultural',
	description: 'Encuentro comunitario',
	startDateTime: '2025-01-01T10:00:00.000Z',
	endDateTime: '2025-01-01T12:00:00.000Z',
	isAllDay: false,
	location: 'Casa Central',
	eventType: 'workshop',
	isActive: true,
	isFeatured: false,
	isRecurring: false,
	recurrencePattern: null,
	recurrenceInterval: null,
	recurrenceEndDate: null,
	recurrenceDaysOfWeek: null,
	organizerId: '1',
	organizerName: 'Equipo Cultura',
	imagePath: null,
	relatedProjectId: null,
	relatedProjectTitle: null,
	relatedBlogPostId: null,
	relatedBlogPostTitle: null,
	relatedBlogPostSlug: null,
	currentAttendees: 0,
	requiresRegistration: false,
	registrationDeadline: null,
	createdAt: '2024-12-01T08:00:00.000Z',
	updatedAt: '2024-12-15T09:00:00.000Z'
};

const createBackendEvent = (overrides: Record<string, unknown> = {}) => ({
	...backendEventBase,
	...overrides
});

describe('CalendarService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('GET Operations (Public)', () => {
		it('should get all events without authentication', async () => {
			const mockEvents = [createBackendEvent()];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => mockEvents
			});

			const result = await calendarService.getAllEvents();

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/calendar'),
				expect.objectContaining({ method: 'GET' })
			);
			expect(result).toHaveLength(1);
			expect(result[0].title).toBe(backendEventBase.title);
			expect(result[0].startDateTime).toBeInstanceOf(Date);
			expect(result[0].startDateTime.toISOString()).toBe(backendEventBase.startDateTime);
		});

		it('should get event by ID without authentication', async () => {
			const mockEvent = createBackendEvent({
				id: 'detalle-1',
				title: 'Test Event',
				recurrencePattern: 'weekly',
				recurrenceInterval: 1,
				recurrenceEndDate: '2025-06-01T00:00:00.000Z',
				recurrenceDaysOfWeek: 'monday'
			});

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => mockEvent
			});

			const result = await calendarService.getEventById('detalle-1');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/calendar/detalle-1'),
				expect.objectContaining({ method: 'GET' })
			);
			expect(result).toBeDefined();
			expect(result?.title).toBe('Test Event');
			expect(result?.createdAt).toBeInstanceOf(Date);
			expect(result?.recurrencePattern).toBe('weekly');
			expect(result?.organizerId).toBe(mockEvent.organizerId);
		});

		it('should get upcoming events', async () => {
			const mockEvents = [
				createBackendEvent({
					id: 'evento-proximo',
					title: 'Upcoming Event',
					startDateTime: '2025-02-01T10:00:00.000Z',
					isFeatured: true
				})
			];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => mockEvents
			});

			const result = await calendarService.getUpcomingEvents();

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/calendar/upcoming'),
				expect.objectContaining({ method: 'GET' })
			);
			expect(result).toHaveLength(1);
			expect(result[0].title).toBe('Upcoming Event');
			expect(result[0].isFeatured).toBe(true);
		});

		it('should get events by date range', async () => {
			const mockEvents = [
				createBackendEvent({
					id: 'evento-rango',
					title: 'Event in Range',
					startDateTime: '2025-03-10T15:00:00.000Z'
				})
			];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => mockEvents
			});

			const startDate = new Date('2025-01-01T00:00:00.000Z');
			const endDate = new Date('2025-12-31T23:59:59.000Z');
			const result = await calendarService.getEventsByDateRange(startDate, endDate);

			const [requestUrl] = (global.fetch as Mock).mock.calls[0];
			expect(requestUrl).toContain('/calendar/range?');
			expect(requestUrl).toContain(`start=${encodeURIComponent(startDate.toISOString())}`);
			expect(requestUrl).toContain(`end=${encodeURIComponent(endDate.toISOString())}`);
			expect(result).toHaveLength(1);
			expect(result[0].startDateTime.toISOString()).toBe('2025-03-10T15:00:00.000Z');
		});

		it('should get featured events', async () => {
			const mockEvents = [
				createBackendEvent({
					id: 'destacado',
					title: 'Featured Event',
					startDateTime: '2025-04-20T18:00:00.000Z',
					isFeatured: true,
					eventType: 'conference'
				})
			];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => mockEvents
			});

			const result = await calendarService.getFeaturedEvents();

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/calendar/featured'),
				expect.objectContaining({ method: 'GET' })
			);
			expect(result).toHaveLength(1);
			expect(result[0].isFeatured).toBe(true);
			expect(result[0].eventType).toBe('conference');
		});
	});

	describe('CREATE Operations (Protected)', () => {
		beforeEach(() => {
			(global.localStorage.getItem as any) = vi.fn((key: string) => {
				if (key === 'jwt_token') return 'valid-jwt-token';
				if (key === 'jwt_user')
					return JSON.stringify({ id: 1, username: 'admin', role: 'administrador' });
				return null;
			});
		});

		it('should create event with JWT token', async () => {
			const newEvent = {
				title: 'New Event',
				description: 'New Description',
				startDateTime: new Date('2025-06-01T10:00:00'),
				endDateTime: new Date('2025-06-01T12:00:00'),
				isAllDay: false,
				eventType: 'workshop',
				location: 'Main Hall'
			};

			const backendResponse = createBackendEvent({
				id: 'new-id',
				title: newEvent.title,
				description: newEvent.description,
				startDateTime: newEvent.startDateTime.toISOString(),
				endDateTime: newEvent.endDateTime?.toISOString(),
				eventType: newEvent.eventType,
				location: newEvent.location,
				isFeatured: false
			});

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 201,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => backendResponse
			});

			const result = await calendarService.createEvent(newEvent);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/calendar'),
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						Authorization: 'Bearer valid-jwt-token'
					}),
					body: expect.any(String)
				})
			);
			const [, requestInit] = (global.fetch as Mock).mock.calls[0];
			const payload = JSON.parse(requestInit.body as string);
			expect(payload.startDateTime).toBe(newEvent.startDateTime.toISOString());
			expect(payload.endDateTime).toBe(newEvent.endDateTime?.toISOString());
			expect(result).toBeDefined();
			expect(result.startDateTime).toBeInstanceOf(Date);
			expect(result.organizerId).toBe(String(backendResponse.organizerId));
		});

		it('should create recurring event', async () => {
			const recurringEvent = {
				title: 'Weekly Meeting',
				startDateTime: new Date('2025-06-01T10:00:00'),
				isAllDay: false,
				eventType: 'meeting',
				isRecurring: true,
				recurrencePattern: 'weekly',
				recurrenceInterval: 1,
				recurrenceDaysOfWeek: 'monday',
				recurrenceEndDate: new Date('2025-12-31')
			};

			const backendResponse = createBackendEvent({
				id: 'recurring-id',
				title: recurringEvent.title,
				startDateTime: recurringEvent.startDateTime.toISOString(),
				isRecurring: true,
				recurrencePattern: recurringEvent.recurrencePattern,
				recurrenceInterval: recurringEvent.recurrenceInterval,
				recurrenceDaysOfWeek: recurringEvent.recurrenceDaysOfWeek,
				recurrenceEndDate: recurringEvent.recurrenceEndDate?.toISOString()
			});

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 201,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => backendResponse
			});

			const result = await calendarService.createEvent(recurringEvent);

			expect(result).toBeDefined();
			expect(result.isRecurring).toBe(true);
			expect(result.recurrencePattern).toBe('weekly');
		});

		it('should reject create without valid JWT', async () => {
			localStorage.clear();

			await expect(
				calendarService.createEvent({
					title: 'Test Event',
					startDateTime: new Date(),
					isAllDay: false,
					eventType: 'workshop'
				})
			).rejects.toThrow();
		});
	});

	describe('UPDATE Operations (Protected)', () => {
		beforeEach(() => {
			(global.localStorage.getItem as any) = vi.fn((key: string) => {
				if (key === 'jwt_token') return 'valid-jwt-token';
				if (key === 'jwt_user')
					return JSON.stringify({ id: 1, username: 'admin', role: 'administrador' });
				return null;
			});
		});

		it('should update event with JWT', async () => {
			const updateData = {
				title: 'Updated Event',
				description: 'Updated Description',
				startDateTime: new Date('2025-06-15T10:00:00')
			};

			const backendResponse = createBackendEvent({
				id: '1',
				title: updateData.title,
				description: updateData.description,
				startDateTime: updateData.startDateTime.toISOString()
			});

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => backendResponse
			});

			const result = await calendarService.updateEvent('1', updateData);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/calendar/1'),
				expect.objectContaining({
					method: 'PUT',
					headers: expect.objectContaining({
						Authorization: 'Bearer valid-jwt-token'
					})
				})
			);
			expect(result).toBeDefined();
			expect(result.title).toBe('Updated Event');
			expect(result.startDateTime).toBeInstanceOf(Date);
		});
	});

	describe('DELETE Operations (Protected)', () => {
		beforeEach(() => {
			(global.localStorage.getItem as any) = vi.fn((key: string) => {
				if (key === 'jwt_token') return 'valid-jwt-token';
				if (key === 'jwt_user')
					return JSON.stringify({ id: 1, username: 'admin', role: 'administrador' });
				return null;
			});
		});

		it('should delete event with JWT', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 204,
				headers: {
					get: (name: string) => (name === 'content-length' ? '0' : null)
				}
			});

			await calendarService.deleteEvent('1');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/calendar/1'),
				expect.objectContaining({
					method: 'DELETE',
					headers: expect.objectContaining({
						Authorization: 'Bearer valid-jwt-token'
					})
				})
			);
		});
	});

	describe('Event Registration', () => {
		beforeEach(() => {
			(global.localStorage.getItem as any) = vi.fn((key: string) => {
				if (key === 'jwt_token') return 'valid-jwt-token';
				if (key === 'jwt_user')
					return JSON.stringify({ id: 1, username: 'user', role: 'colaborador' });
				return null;
			});
		});

		it('should register for event', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 201,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => ({
					id: 'reg-1',
					eventId: '1',
					userId: '1',
					status: 'confirmed',
					registrationDate: '2025-01-10T12:30:00.000Z'
				})
			});

			const result = await calendarService.registerForEvent('1');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/calendar/1/registrations'),
				expect.objectContaining({
					method: 'POST'
				})
			);
			expect(result).toBeDefined();
			expect(result.status).toBe('confirmed');
			expect(result.registrationDate).toBeInstanceOf(Date);
			expect(result.registrationDate.toISOString()).toBe('2025-01-10T12:30:00.000Z');
		});

		it('should cancel event registration', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 204,
				headers: {
					get: (name: string) => (name === 'content-length' ? '0' : null)
				}
			});

			await calendarService.cancelEventRegistration('1', 'reg-1');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/calendar/1/registrations/reg-1'),
				expect.objectContaining({
					method: 'DELETE'
				})
			);
		});
	});

	describe('Date Handling', () => {
		it('should convert Unix timestamps to Date objects', async () => {
			const mockEvent = createBackendEvent({
				startDateTime: '2025-01-05T10:00:00.000Z',
				endDateTime: '2025-01-05T12:00:00.000Z'
			});

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => mockEvent
			});

			const result = await calendarService.getEventById('1');

			expect(result?.startDateTime).toBeInstanceOf(Date);
			expect(result?.endDateTime).toBeInstanceOf(Date);
		});

		it('should handle all-day events', async () => {
			const mockEvent = createBackendEvent({
				id: 'all-day',
				title: 'All Day Event',
				startDateTime: '2025-01-05T00:00:00.000Z',
				endDateTime: '2025-01-05T23:59:59.000Z',
				isAllDay: true,
				eventType: 'holiday'
			});

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => mockEvent
			});

			const result = await calendarService.getEventById('1');

			expect(result?.isAllDay).toBe(true);
		});
	});

	describe('Error Handling', () => {
		it('should handle network errors', async () => {
			(global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

			await expect(calendarService.getAllEvents()).rejects.toThrow('Network error');
		});

		it('should handle 404 errors', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 404,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => ({ error: 'Not found' })
			});

			const result = await calendarService.getEventById('non-existent');

			expect(result).toBeNull();
		});

		it('should handle unauthorized access', async () => {
			localStorage.clear();

			await expect(
				calendarService.createEvent({
					title: 'Test',
					startDateTime: new Date(),
					isAllDay: false,
					eventType: 'workshop'
				})
			).rejects.toThrow();
		});
	});
});
