import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import CalendarView from '../CalendarView.svelte';
import type { EventSummary } from '$lib/services/calendar/calendarService';

// Mock del módulo i18n
vi.mock('$lib/i18n', () => {
	const t = {
		subscribe: (fn: any) => {
			fn((key: string) => {
				// Mock translations
				const translations: Record<string, string> = {
					'today': 'Hoy',
					'calendar.months.0': 'Enero',
					'calendar.months.1': 'Febrero',
					'calendar.months.2': 'Marzo',
					'calendar.months.3': 'Abril',
					'calendar.months.4': 'Mayo',
					'calendar.months.5': 'Junio',
					'calendar.months.6': 'Julio',
					'calendar.months.7': 'Agosto',
					'calendar.months.8': 'Septiembre',
					'calendar.months.9': 'Octubre',
					'calendar.months.10': 'Noviembre',
					'calendar.months.11': 'Diciembre',
					'calendar.days.0': 'Dom',
					'calendar.days.1': 'Lun',
					'calendar.days.2': 'Mar',
					'calendar.days.3': 'Mié',
					'calendar.days.4': 'Jue',
					'calendar.days.5': 'Vie',
					'calendar.days.6': 'Sáb'
				};
				return translations[key] || key;
			});
			return () => {};
		}
	};

	const locale = {
		subscribe: (fn: any) => {
			fn('es');
			return () => {};
		}
	};

	return { t, locale };
});

describe('CalendarView Component', () => {
	const mockDate = new Date('2024-03-15T10:00:00Z');

	const mockEvents: EventSummary[] = [
		{
			id: 'event-1',
			title: 'Taller de Arte',
			startDateTime: new Date('2024-03-15T14:00:00Z').toISOString(),
			endDateTime: new Date('2024-03-15T16:00:00Z').toISOString(),
			eventType: 'Taller',
			isAllDay: false,
			isFeatured: false,
			isRecurring: false
		},
		{
			id: 'event-2',
			title: 'Conferencia',
			startDateTime: new Date('2024-03-20T10:00:00Z').toISOString(),
			endDateTime: new Date('2024-03-20T12:00:00Z').toISOString(),
			eventType: 'Conferencia',
			isAllDay: false,
			isFeatured: true,
			isRecurring: false
		},
		{
			id: 'event-3',
			title: 'Clase de Música',
			startDateTime: new Date('2024-03-15T09:00:00Z').toISOString(),
			endDateTime: new Date('2024-03-15T11:00:00Z').toISOString(),
			eventType: 'Clase',
			isAllDay: false,
			isFeatured: false,
			isRecurring: true
		},
		{
			id: 'event-4',
			title: 'Evento Todo el Día',
			startDateTime: new Date('2024-03-25T00:00:00Z').toISOString(),
			endDateTime: new Date('2024-03-25T23:59:59Z').toISOString(),
			eventType: 'Evento',
			isAllDay: true,
			isFeatured: false,
			isRecurring: false
		}
	];

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(mockDate);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	describe('Rendering - Header and Navigation', () => {
		it('should render calendar header with month and year', () => {
			render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			expect(screen.getByText('Marzo')).toBeInTheDocument();
			expect(screen.getByText('2024')).toBeInTheDocument();
		});

		it('should render navigation buttons', () => {
			render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			const prevButton = screen.getByLabelText('Mes anterior');
			const nextButton = screen.getByLabelText('Mes siguiente');

			expect(prevButton).toBeInTheDocument();
			expect(nextButton).toBeInTheDocument();
		});

		it('should render "Hoy" (Today) button', () => {
			render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			expect(screen.getByText('Hoy')).toBeInTheDocument();
		});

		it('should render all day names', () => {
			render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
			dayNames.forEach(day => {
				expect(screen.getByText(day)).toBeInTheDocument();
			});
		});
	});

	describe('Rendering - Calendar Days', () => {
		it('should render calendar grid with days', () => {
			render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			const gridCells = screen.getAllByRole('gridcell');
			// Calendar should show at least 28 days (4 weeks minimum)
			expect(gridCells.length).toBeGreaterThanOrEqual(28);
		});

		it('should show day numbers correctly', () => {
			render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			// March has 31 days, check for day 1 and day 31
			expect(screen.getByText('1')).toBeInTheDocument();
			expect(screen.getByText('31')).toBeInTheDocument();
		});

		it('should highlight today\'s date', () => {
			render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			// Day 15 is today (mockDate)
			const todayCell = screen.getByText('15').closest('div[role="gridcell"]');
			expect(todayCell).toHaveClass('from-blue-100');
		});

		it('should render days from previous/next months with different styling', () => {
			render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			// Days from other months should have bg-slate-50 class
			const gridCells = screen.getAllByRole('gridcell');
			const otherMonthCells = gridCells.filter(cell => cell.className.includes('bg-slate-50'));

			expect(otherMonthCells.length).toBeGreaterThan(0);
		});
	});

	describe('Event Display', () => {
		it('should display events on their corresponding days', async () => {
			render(CalendarView, { props: { events: mockEvents, currentDate: mockDate, viewType: 'month' } });

			await waitFor(() => {
				expect(screen.getByText('Taller de Arte')).toBeInTheDocument();
				expect(screen.getByText('Conferencia')).toBeInTheDocument();
				expect(screen.getByText('Clase de Música')).toBeInTheDocument();
			});
		});

		it('should show event count badge when day has events', async () => {
			render(CalendarView, { props: { events: mockEvents, currentDate: mockDate, viewType: 'month' } });

			await waitFor(() => {
				// Day 15 has 2 events (Taller de Arte and Clase de Música)
				const eventCountBadge = screen.getByText('2');
				expect(eventCountBadge).toBeInTheDocument();
			});
		});

		it('should truncate events to show max 3 per day', async () => {
			const manyEvents: EventSummary[] = [
				...mockEvents.filter(e => e.startDateTime.includes('2024-03-15')),
				{
					id: 'event-5',
					title: 'Evento Extra 1',
					startDateTime: new Date('2024-03-15T12:00:00Z').toISOString(),
					endDateTime: new Date('2024-03-15T13:00:00Z').toISOString(),
					eventType: 'Evento',
					isAllDay: false,
					isFeatured: false,
					isRecurring: false
				},
				{
					id: 'event-6',
					title: 'Evento Extra 2',
					startDateTime: new Date('2024-03-15T15:00:00Z').toISOString(),
					endDateTime: new Date('2024-03-15T16:00:00Z').toISOString(),
					eventType: 'Evento',
					isAllDay: false,
					isFeatured: false,
					isRecurring: false
				}
			];

			render(CalendarView, { props: { events: manyEvents, currentDate: mockDate, viewType: 'month' } });

			await waitFor(() => {
				// Should show "+X eventos más" message
				expect(screen.getByText(/eventos más/i)).toBeInTheDocument();
			});
		});

		it('should display time for non-all-day events', async () => {
			render(CalendarView, { props: { events: mockEvents, currentDate: mockDate, viewType: 'month' } });

			await waitFor(() => {
				// Events should show their time
				const timeElements = document.querySelectorAll('.text-\\[10px\\]');
				expect(timeElements.length).toBeGreaterThan(0);
			});
		});

		it('should not display time for all-day events', async () => {
			const allDayEvent: EventSummary[] = [{
				id: 'all-day',
				title: 'Todo el Día',
				startDateTime: new Date('2024-03-15T00:00:00Z').toISOString(),
				endDateTime: new Date('2024-03-15T23:59:59Z').toISOString(),
				eventType: 'Evento',
				isAllDay: true,
				isFeatured: false,
				isRecurring: false
			}];

			render(CalendarView, { props: { events: allDayEvent, currentDate: mockDate, viewType: 'month' } });

			await waitFor(() => {
				const eventTitle = screen.getByText('Todo el Día');
				const parent = eventTitle.closest('.group\\/event');
				const timeElement = parent?.querySelector('.text-\\[10px\\]');
				expect(timeElement).not.toBeInTheDocument();
			});
		});

		it('should show recurring event indicator', async () => {
			render(CalendarView, { props: { events: mockEvents, currentDate: mockDate, viewType: 'month' } });

			await waitFor(() => {
				const recurringEvent = screen.getByText('Clase de Música').closest('.group\\/event');
				expect(recurringEvent?.querySelector('[title*="recurrente"]')).toBeInTheDocument();
			});
		});
	});

	describe('Event Type Colors', () => {
		it('should apply correct color for "Clase" event type', async () => {
			const claseEvent: EventSummary[] = [{
				id: 'clase-1',
				title: 'Clase Test',
				startDateTime: new Date('2024-03-15T10:00:00Z').toISOString(),
				endDateTime: new Date('2024-03-15T11:00:00Z').toISOString(),
				eventType: 'Clase',
				isAllDay: false,
				isFeatured: false,
				isRecurring: false
			}];

			render(CalendarView, { props: { events: claseEvent, currentDate: mockDate, viewType: 'month' } });

			await waitFor(() => {
				const eventElement = screen.getByText('Clase Test').closest('div');
				expect(eventElement).toHaveClass('bg-blue-500');
			});
		});

		it('should apply correct color for "Taller" event type', async () => {
			render(CalendarView, { props: { events: mockEvents, currentDate: mockDate, viewType: 'month' } });

			await waitFor(() => {
				const eventElement = screen.getByText('Taller de Arte').closest('div');
				expect(eventElement).toHaveClass('bg-green-500');
			});
		});

		it('should apply correct color for "Conferencia" event type', async () => {
			render(CalendarView, { props: { events: mockEvents, currentDate: mockDate, viewType: 'month' } });

			await waitFor(() => {
				const eventElement = screen.getByText('Conferencia').closest('div');
				expect(eventElement).toHaveClass('bg-purple-500');
			});
		});

		it('should apply default gray color for unknown event type', async () => {
			const unknownEvent: EventSummary[] = [{
				id: 'unknown-1',
				title: 'Evento Desconocido',
				startDateTime: new Date('2024-03-15T10:00:00Z').toISOString(),
				endDateTime: new Date('2024-03-15T11:00:00Z').toISOString(),
				eventType: 'TipoDesconocido',
				isAllDay: false,
				isFeatured: false,
				isRecurring: false
			}];

			render(CalendarView, { props: { events: unknownEvent, currentDate: mockDate, viewType: 'month' } });

			await waitFor(() => {
				const eventElement = screen.getByText('Evento Desconocido').closest('div');
				expect(eventElement).toHaveClass('bg-gray-500');
			});
		});
	});

	describe('Navigation Actions', () => {
		it('should navigate to previous month when clicking previous button', async () => {
			const { component } = render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			const viewChangeHandler = vi.fn();
			component.$on('viewChange', viewChangeHandler);

			const prevButton = screen.getByLabelText('Mes anterior');
			await fireEvent.click(prevButton);

			await waitFor(() => {
				expect(screen.getByText('Febrero')).toBeInTheDocument();
				expect(viewChangeHandler).toHaveBeenCalled();
			});
		});

		it('should navigate to next month when clicking next button', async () => {
			const { component } = render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			const viewChangeHandler = vi.fn();
			component.$on('viewChange', viewChangeHandler);

			const nextButton = screen.getByLabelText('Mes siguiente');
			await fireEvent.click(nextButton);

			await waitFor(() => {
				expect(screen.getByText('Abril')).toBeInTheDocument();
				expect(viewChangeHandler).toHaveBeenCalled();
			});
		});

		it('should navigate to today when clicking "Hoy" button', async () => {
			const pastDate = new Date('2024-01-15T10:00:00Z');
			const { component } = render(CalendarView, { props: { events: [], currentDate: pastDate, viewType: 'month' } });

			const viewChangeHandler = vi.fn();
			component.$on('viewChange', viewChangeHandler);

			const todayButton = screen.getByText('Hoy');
			await fireEvent.click(todayButton);

			await waitFor(() => {
				expect(screen.getByText('Marzo')).toBeInTheDocument();
				expect(viewChangeHandler).toHaveBeenCalled();
			});
		});

		it('should dispatch viewChange event with correct data when navigating', async () => {
			const { component } = render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			const viewChangeHandler = vi.fn();
			component.$on('viewChange', viewChangeHandler);

			const nextButton = screen.getByLabelText('Mes siguiente');
			await fireEvent.click(nextButton);

			await waitFor(() => {
				expect(viewChangeHandler).toHaveBeenCalledWith(
					expect.objectContaining({
						detail: expect.objectContaining({
							viewType: 'month'
						})
					})
				);
			});
		});
	});

	describe('Event Click Handler', () => {
		it('should dispatch eventClick event when clicking on an event', async () => {
			const { component } = render(CalendarView, { props: { events: mockEvents, currentDate: mockDate, viewType: 'month' } });

			const eventClickHandler = vi.fn();
			component.$on('eventClick', eventClickHandler);

			const eventElement = await screen.findByText('Taller de Arte');
			await fireEvent.click(eventElement);

			expect(eventClickHandler).toHaveBeenCalledTimes(1);
			expect(eventClickHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: expect.objectContaining({
						event: expect.objectContaining({
							id: 'event-1',
							title: 'Taller de Arte'
						})
					})
				})
			);
		});

		it('should stop propagation when clicking event to prevent date click', async () => {
			const { component } = render(CalendarView, { props: { events: mockEvents, currentDate: mockDate, viewType: 'month' } });

			const eventClickHandler = vi.fn();
			const dateClickHandler = vi.fn();
			component.$on('eventClick', eventClickHandler);
			component.$on('dateClick', dateClickHandler);

			const eventElement = await screen.findByText('Taller de Arte');
			await fireEvent.click(eventElement);

			expect(eventClickHandler).toHaveBeenCalledTimes(1);
			// dateClick should NOT be called because stopPropagation is used
			expect(dateClickHandler).not.toHaveBeenCalled();
		});
	});

	describe('Date Click Handler', () => {
		it('should dispatch dateClick event when clicking on a day', async () => {
			const { component } = render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			const dateClickHandler = vi.fn();
			component.$on('dateClick', dateClickHandler);

			const dayCell = screen.getByText('20').closest('[role="gridcell"]');
			await fireEvent.click(dayCell!);

			expect(dateClickHandler).toHaveBeenCalledTimes(1);
			expect(dateClickHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: expect.objectContaining({
						date: expect.any(Date)
					})
				})
			);
		});

		it('should support keyboard navigation (Enter key) on day cells', async () => {
			const { component } = render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			const dateClickHandler = vi.fn();
			component.$on('dateClick', dateClickHandler);

			const dayCell = screen.getByText('20').closest('[role="gridcell"]');
			await fireEvent.keyDown(dayCell!, { key: 'Enter' });

			expect(dateClickHandler).toHaveBeenCalledTimes(1);
		});
	});

	describe('Date Utilities and Formatting', () => {
		it('should correctly identify weekend days', () => {
			render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			// March 2024: Day 2 is Saturday, Day 3 is Sunday
			const saturday = screen.getByText('2').closest('[role="gridcell"]');
			const sunday = screen.getByText('3').closest('[role="gridcell"]');

			expect(saturday?.className).toMatch(/from-orange-50|to-yellow-50/);
			expect(sunday?.className).toMatch(/from-orange-50|to-yellow-50/);
		});

		it('should format time correctly', async () => {
			render(CalendarView, { props: { events: mockEvents, currentDate: mockDate, viewType: 'month' } });

			await waitFor(() => {
				// Check that time is displayed in HH:mm format
				const timeElements = document.querySelectorAll('.text-\\[10px\\]');
				timeElements.forEach(element => {
					expect(element.textContent).toMatch(/\d{2}:\d{2}/);
				});
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty events array', () => {
			render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			// Should render calendar without errors
			expect(screen.getByText('Marzo')).toBeInTheDocument();
		});

		it('should handle month with 31 days (March)', () => {
			render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			expect(screen.getByText('31')).toBeInTheDocument();
		});

		it('should handle month with 28 days (February non-leap year)', () => {
			const febDate = new Date('2023-02-15T10:00:00Z');
			render(CalendarView, { props: { events: [], currentDate: febDate, viewType: 'month' } });

			expect(screen.getByText('Febrero')).toBeInTheDocument();
			expect(screen.getByText('28')).toBeInTheDocument();
			expect(screen.queryByText('29')).not.toBeInTheDocument();
		});

		it('should handle month with 29 days (February leap year)', () => {
			const febLeapDate = new Date('2024-02-15T10:00:00Z');
			render(CalendarView, { props: { events: [], currentDate: febLeapDate, viewType: 'month' } });

			expect(screen.getByText('Febrero')).toBeInTheDocument();
			expect(screen.getByText('29')).toBeInTheDocument();
		});

		it('should handle year transition (December to January)', async () => {
			const decDate = new Date('2024-12-15T10:00:00Z');
			const { component } = render(CalendarView, { props: { events: [], currentDate: decDate, viewType: 'month' } });

			expect(screen.getByText('Diciembre')).toBeInTheDocument();
			expect(screen.getByText('2024')).toBeInTheDocument();

			const nextButton = screen.getByLabelText('Mes siguiente');
			await fireEvent.click(nextButton);

			await waitFor(() => {
				expect(screen.getByText('Enero')).toBeInTheDocument();
				expect(screen.getByText('2025')).toBeInTheDocument();
			});
		});

		it('should regenerate calendar when currentDate prop changes', async () => {
			const { component } = render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			expect(screen.getByText('Marzo')).toBeInTheDocument();

			// Change currentDate prop
			await component.$set({ currentDate: new Date('2024-06-15T10:00:00Z') });

			await waitFor(() => {
				expect(screen.getByText('Junio')).toBeInTheDocument();
			});
		});

		it('should regenerate calendar when events prop changes', async () => {
			const { component } = render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			// Initially no events
			expect(screen.queryByText('Taller de Arte')).not.toBeInTheDocument();

			// Add events
			await component.$set({ events: mockEvents });

			await waitFor(() => {
				expect(screen.getByText('Taller de Arte')).toBeInTheDocument();
			});
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA labels for navigation buttons', () => {
			render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			expect(screen.getByLabelText('Mes anterior')).toBeInTheDocument();
			expect(screen.getByLabelText('Mes siguiente')).toBeInTheDocument();
		});

		it('should have role="gridcell" for calendar days', () => {
			render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			const gridCells = screen.getAllByRole('gridcell');
			expect(gridCells.length).toBeGreaterThan(0);
		});

		it('should have tabindex on day cells for keyboard navigation', () => {
			render(CalendarView, { props: { events: [], currentDate: mockDate, viewType: 'month' } });

			const dayCell = screen.getByText('15').closest('[role="gridcell"]');
			expect(dayCell).toHaveAttribute('tabindex', '0');
		});

		it('should have role="button" on event elements', async () => {
			render(CalendarView, { props: { events: mockEvents, currentDate: mockDate, viewType: 'month' } });

			await waitFor(() => {
				const eventElement = screen.getByText('Taller de Arte').closest('[role="button"]');
				expect(eventElement).toBeInTheDocument();
			});
		});
	});
});
