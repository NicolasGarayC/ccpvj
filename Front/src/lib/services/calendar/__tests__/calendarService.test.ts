import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calendarService } from '../calendarService';

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
			const mockEvents = [
				{
					id: '1',
					title: 'Event 1',
					description: 'Description 1',
					startDateTime: 1735689600,
					isAllDay: false,
					eventType: 'workshop',
					isActive: true,
					isFeatured: false,
					organizerId: '1'
				}
			];

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
				expect.stringContaining('/events'),
				expect.objectContaining({ method: 'GET' })
			);
			expect(result).toHaveLength(1);
			expect(result[0].title).toBe('Event 1');
		});

		it('should get event by ID without authentication', async () => {
			const mockEvent = {
				id: '1',
				title: 'Test Event',
				description: 'Test Description',
				startDateTime: 1735689600,
				isAllDay: false,
				eventType: 'workshop',
				isActive: true,
				isFeatured: false,
				organizerId: '1'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => mockEvent
			});

			const result = await calendarService.getEventById('1');

			expect(result).toBeDefined();
			expect(result?.title).toBe('Test Event');
		});

		it('should get upcoming events', async () => {
			const mockEvents = [
				{
					id: '1',
					title: 'Upcoming Event',
					startDateTime: Date.now() / 1000 + 86400, // Tomorrow
					isActive: true,
					isFeatured: false,
					eventType: 'workshop',
					organizerId: '1'
				}
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

			expect(result).toHaveLength(1);
			expect(result[0].title).toBe('Upcoming Event');
		});

		it('should get events by date range', async () => {
			const mockEvents = [
				{
					id: '1',
					title: 'Event in Range',
					startDateTime: 1735689600,
					isActive: true,
					isFeatured: false,
					eventType: 'workshop',
					organizerId: '1'
				}
			];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => mockEvents
			});

			const startDate = new Date('2025-01-01');
			const endDate = new Date('2025-12-31');
			const result = await calendarService.getEventsByDateRange(startDate, endDate);

			expect(result).toHaveLength(1);
		});

		it('should get featured events', async () => {
			const mockEvents = [
				{
					id: '1',
					title: 'Featured Event',
					startDateTime: 1735689600,
					isActive: true,
					isFeatured: true,
					eventType: 'conference',
					organizerId: '1'
				}
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

			expect(result).toHaveLength(1);
			expect(result[0].isFeatured).toBe(true);
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

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 201,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => ({ id: 'new-id', ...newEvent })
			});

			const result = await calendarService.createEvent(newEvent);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/events'),
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						Authorization: 'Bearer valid-jwt-token'
					})
				})
			);
			expect(result).toBeDefined();
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

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 201,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => ({ id: 'recurring-id', ...recurringEvent })
			});

			const result = await calendarService.createEvent(recurringEvent);

			expect(result).toBeDefined();
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

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => ({ id: '1', ...updateData })
			});

			const result = await calendarService.updateEvent('1', updateData);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/events/1'),
				expect.objectContaining({
					method: 'PUT',
					headers: expect.objectContaining({
						Authorization: 'Bearer valid-jwt-token'
					})
				})
			);
			expect(result).toBeDefined();
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
				expect.stringContaining('/events/1'),
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
					status: 'confirmed'
				})
			});

			const result = await calendarService.registerForEvent('1');

			expect(result).toBeDefined();
			expect(result.status).toBe('confirmed');
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
				expect.stringContaining('/events/1/registrations/reg-1'),
				expect.objectContaining({
					method: 'DELETE'
				})
			);
		});
	});

	describe('Date Handling', () => {
		it('should convert Unix timestamps to Date objects', async () => {
			const mockEvent = {
				id: '1',
				title: 'Test Event',
				startDateTime: 1735689600, // Unix timestamp
				endDateTime: 1735693200,
				isActive: true,
				isFeatured: false,
				eventType: 'workshop',
				organizerId: '1'
			};

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
			const mockEvent = {
				id: '1',
				title: 'All Day Event',
				startDateTime: 1735689600,
				isAllDay: true,
				isActive: true,
				isFeatured: false,
				eventType: 'holiday',
				organizerId: '1'
			};

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
