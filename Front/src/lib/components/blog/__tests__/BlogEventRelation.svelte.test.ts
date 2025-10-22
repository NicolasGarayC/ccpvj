import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import BlogEventRelation from '../BlogEventRelation.svelte';
import { calendarService, type EventSummary } from '$lib/services/calendar/calendarService';

vi.mock('$lib/services/calendar/calendarService', () => ({
	calendarService: {
		getUpcomingEvents: vi.fn(),
		getEventsByBlogPost: vi.fn()
	}
}));

const mockEvents: EventSummary[] = [
	{
		id: '1',
		title: 'Taller de Programación',
		startDateTime: new Date('2024-06-15T10:00:00'),
		endDateTime: new Date('2024-06-15T12:00:00'),
		location: 'Sala A',
		eventType: 'Taller',
		isRecurring: false
	},
	{
		id: '2',
		title: 'Conferencia de Tecnología',
		startDateTime: new Date('2024-06-20T14:00:00'),
		endDateTime: new Date('2024-06-20T16:00:00'),
		location: 'Auditorio',
		eventType: 'Conferencia',
		isRecurring: false
	},
	{
		id: '3',
		title: 'Seminario Web',
		startDateTime: new Date('2024-06-25T16:00:00'),
		endDateTime: new Date('2024-06-25T18:00:00'),
		location: null,
		eventType: 'Webinar',
		isRecurring: false
	}
];

describe('BlogEventRelation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(calendarService.getUpcomingEvents).mockResolvedValue(mockEvents);
		vi.mocked(calendarService.getEventsByBlogPost).mockResolvedValue([]);
	});

	describe('Rendering', () => {
		it('should render with default props', async () => {
			render(BlogEventRelation);
			await waitFor(() => {
				expect(screen.getByText('Relacionar con Eventos')).toBeInTheDocument();
			});
		});

		it('should render in compact mode', async () => {
			const { container } = render(BlogEventRelation, { props: { compact: true } });
			await waitFor(() => {
				expect(container.querySelector('.blog-event-relation.compact')).toBeInTheDocument();
			});
		});

		it('should show help text', async () => {
			render(BlogEventRelation);
			await waitFor(() => {
				expect(
					screen.getByText('Selecciona los eventos que deseas relacionar con este artículo del blog')
				).toBeInTheDocument();
			});
		});
	});

	describe('Loading Events', () => {
		it('should load available events on mount', async () => {
			render(BlogEventRelation);
			await waitFor(() => {
				expect(calendarService.getUpcomingEvents).toHaveBeenCalledWith(50);
			});
		});

		it('should display filtered events after loading', async () => {
			render(BlogEventRelation);
			await waitFor(() => {
				expect(screen.getByText('Taller de Programación')).toBeInTheDocument();
			});
		});

		it('should show loading spinner while loading', () => {
			vi.mocked(calendarService.getUpcomingEvents).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockEvents), 100))
			);
			const { container } = render(BlogEventRelation);
			expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
		});

		it('should load related events when blogPostId is provided', async () => {
			const blogPostId = 'blog-123';
			vi.mocked(calendarService.getEventsByBlogPost).mockResolvedValue([mockEvents[0]]);

			render(BlogEventRelation, { props: { blogPostId } });

			await waitFor(() => {
				expect(calendarService.getEventsByBlogPost).toHaveBeenCalledWith(blogPostId);
			});
		});

		it('should not load related events when blogPostId is undefined', async () => {
			render(BlogEventRelation);
			await waitFor(() => {
				expect(calendarService.getEventsByBlogPost).not.toHaveBeenCalled();
			});
		});
	});

	describe('Error Handling', () => {
		it('should show error message when loading fails', async () => {
			vi.mocked(calendarService.getUpcomingEvents).mockRejectedValue(
				new Error('Error cargando eventos')
			);
			render(BlogEventRelation);

			await waitFor(() => {
				expect(screen.getByText('Error cargando eventos')).toBeInTheDocument();
			});
		});

		it('should close error message when close button is clicked', async () => {
			vi.mocked(calendarService.getUpcomingEvents).mockRejectedValue(
				new Error('Error cargando eventos')
			);
			render(BlogEventRelation);

			await waitFor(() => {
				expect(screen.getByText('Error cargando eventos')).toBeInTheDocument();
			});

			const closeButton = screen.getByRole('button', { name: '×' });
			await fireEvent.click(closeButton);

			await waitFor(() => {
				expect(screen.queryByText('Error cargando eventos')).not.toBeInTheDocument();
			});
		});

		it('should handle non-Error exceptions', async () => {
			vi.mocked(calendarService.getUpcomingEvents).mockRejectedValue('String error');
			render(BlogEventRelation);

			await waitFor(() => {
				expect(screen.getByText('Error cargando eventos')).toBeInTheDocument();
			});
		});

		it('should continue rendering when related events loading fails', async () => {
			vi.mocked(calendarService.getEventsByBlogPost).mockRejectedValue(
				new Error('Failed to load related')
			);

			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			render(BlogEventRelation, { props: { blogPostId: 'blog-123' } });

			await waitFor(() => {
				expect(consoleErrorSpy).toHaveBeenCalledWith(
					'Error loading related events:',
					expect.any(Error)
				);
			});

			consoleErrorSpy.mockRestore();
		});
	});

	describe('Search Functionality', () => {
		it('should filter events by search term', async () => {
			render(BlogEventRelation);

			await waitFor(() => {
				expect(screen.getByText('Taller de Programación')).toBeInTheDocument();
			});

			const searchInput = screen.getByPlaceholderText('Buscar eventos por título...');
			await fireEvent.input(searchInput, { target: { value: 'Conferencia' } });

			await waitFor(() => {
				expect(screen.getByText('Conferencia de Tecnología')).toBeInTheDocument();
				expect(screen.queryByText('Taller de Programación')).not.toBeInTheDocument();
			});
		});

		it('should show all events when search is cleared', async () => {
			render(BlogEventRelation);

			const searchInput = screen.getByPlaceholderText('Buscar eventos por título...');
			await fireEvent.input(searchInput, { target: { value: 'Conferencia' } });

			await waitFor(() => {
				expect(screen.queryByText('Taller de Programación')).not.toBeInTheDocument();
			});

			await fireEvent.input(searchInput, { target: { value: '' } });

			await waitFor(() => {
				expect(screen.getByText('Taller de Programación')).toBeInTheDocument();
			});
		});

		it('should show empty state when no events match search', async () => {
			render(BlogEventRelation);

			const searchInput = screen.getByPlaceholderText('Buscar eventos por título...');
			await fireEvent.input(searchInput, { target: { value: 'NonExistentEvent' } });

			await waitFor(() => {
				expect(screen.getByText('No se encontraron eventos')).toBeInTheDocument();
			});
		});

		it('should be case insensitive when searching', async () => {
			render(BlogEventRelation);

			const searchInput = screen.getByPlaceholderText('Buscar eventos por título...');
			await fireEvent.input(searchInput, { target: { value: 'CONFERENCIA' } });

			await waitFor(() => {
				expect(screen.getByText('Conferencia de Tecnología')).toBeInTheDocument();
			});
		});

		it('should limit filtered results to 10 events', async () => {
			const manyEvents = Array.from({ length: 20 }, (_, i) => ({
				id: `${i}`,
				title: `Event ${i}`,
				startDateTime: new Date(),
				endDateTime: new Date(),
				location: 'Location',
				eventType: 'Type',
				isRecurring: false
			}));

			vi.mocked(calendarService.getUpcomingEvents).mockResolvedValue(manyEvents);

			const { container } = render(BlogEventRelation);

			await waitFor(() => {
				const items = container.querySelectorAll('.dropdown-item');
				expect(items.length).toBeLessThanOrEqual(10);
			});
		});
	});

	describe('Event Selection', () => {
		it('should toggle event selection when clicked', async () => {
			render(BlogEventRelation);

			await waitFor(() => {
				expect(screen.getByText('Taller de Programación')).toBeInTheDocument();
			});

			const eventButton = screen
				.getAllByRole('button')
				.find((btn) => btn.textContent?.includes('Taller de Programación'));
			await fireEvent.click(eventButton!);

			await waitFor(() => {
				expect(screen.getByText('Eventos Relacionados (1)')).toBeInTheDocument();
			});
		});

		it('should deselect event when clicked again', async () => {
			render(BlogEventRelation);

			await waitFor(() => {
				expect(screen.getByText('Taller de Programación')).toBeInTheDocument();
			});

			const eventButton = screen
				.getAllByRole('button')
				.find((btn) => btn.textContent?.includes('Taller de Programación'));

			await fireEvent.click(eventButton!);
			await waitFor(() => {
				expect(screen.getByText('Eventos Relacionados (1)')).toBeInTheDocument();
			});

			await fireEvent.click(eventButton!);
			await waitFor(() => {
				expect(screen.queryByText('Eventos Relacionados (1)')).not.toBeInTheDocument();
			});
		});

		it('should show selected badge for selected events', async () => {
			render(BlogEventRelation);

			await waitFor(() => {
				expect(screen.getByText('Taller de Programación')).toBeInTheDocument();
			});

			const eventButton = screen
				.getAllByRole('button')
				.find((btn) => btn.textContent?.includes('Taller de Programación'));
			await fireEvent.click(eventButton!);

			await waitFor(() => {
				expect(screen.getByText('✓ Seleccionado')).toBeInTheDocument();
			});
		});

		it('should call onChange callback when event is selected', async () => {
			const onChangeMock = vi.fn();
			render(BlogEventRelation, { props: { onChange: onChangeMock } });

			await waitFor(() => {
				expect(screen.getByText('Taller de Programación')).toBeInTheDocument();
			});

			const eventButton = screen
				.getAllByRole('button')
				.find((btn) => btn.textContent?.includes('Taller de Programación'));
			await fireEvent.click(eventButton!);

			await waitFor(() => {
				expect(onChangeMock).toHaveBeenCalledWith(['1']);
			});
		});

		it('should call onChange callback when event is deselected', async () => {
			const onChangeMock = vi.fn();
			render(BlogEventRelation, { props: { onChange: onChangeMock } });

			await waitFor(() => {
				expect(screen.getByText('Taller de Programación')).toBeInTheDocument();
			});

			const eventButton = screen
				.getAllByRole('button')
				.find((btn) => btn.textContent?.includes('Taller de Programación'));

			await fireEvent.click(eventButton!);
			await fireEvent.click(eventButton!);

			await waitFor(() => {
				expect(onChangeMock).toHaveBeenLastCalledWith([]);
			});
		});

		it('should allow selecting multiple events', async () => {
			render(BlogEventRelation);

			await waitFor(() => {
				expect(screen.getByText('Taller de Programación')).toBeInTheDocument();
			});

			const event1Button = screen
				.getAllByRole('button')
				.find((btn) => btn.textContent?.includes('Taller de Programación'));
			const event2Button = screen
				.getAllByRole('button')
				.find((btn) => btn.textContent?.includes('Conferencia de Tecnología'));

			await fireEvent.click(event1Button!);
			await fireEvent.click(event2Button!);

			await waitFor(() => {
				expect(screen.getByText('Eventos Relacionados (2)')).toBeInTheDocument();
			});
		});
	});

	describe('Selected Events Display', () => {
		it('should show selected events section when events are selected', async () => {
			render(BlogEventRelation);

			await waitFor(() => {
				expect(screen.getByText('Taller de Programación')).toBeInTheDocument();
			});

			const eventButton = screen
				.getAllByRole('button')
				.find((btn) => btn.textContent?.includes('Taller de Programación'));
			await fireEvent.click(eventButton!);

			await waitFor(() => {
				expect(screen.getByText('Eventos Relacionados (1)')).toBeInTheDocument();
			});
		});

		it('should display event details in selected events list', async () => {
			render(BlogEventRelation);

			await waitFor(() => {
				expect(screen.getByText('Taller de Programación')).toBeInTheDocument();
			});

			const eventButton = screen
				.getAllByRole('button')
				.find((btn) => btn.textContent?.includes('Taller de Programación'));
			await fireEvent.click(eventButton!);

			await waitFor(() => {
				const eventCards = document.querySelectorAll('.event-card');
				expect(eventCards.length).toBe(1);
				expect(screen.getAllByText('Taller de Programación').length).toBeGreaterThan(0);
			});
		});

		it('should show event location when available', async () => {
			render(BlogEventRelation);

			await waitFor(() => {
				expect(screen.getByText('Taller de Programación')).toBeInTheDocument();
			});

			const eventButton = screen
				.getAllByRole('button')
				.find((btn) => btn.textContent?.includes('Taller de Programación'));
			await fireEvent.click(eventButton!);

			await waitFor(() => {
				expect(screen.getByText(/📍 Sala A/)).toBeInTheDocument();
			});
		});

		it('should not show location icon when location is null', async () => {
			render(BlogEventRelation);

			await waitFor(() => {
				expect(screen.getByText('Seminario Web')).toBeInTheDocument();
			});

			const eventButton = screen
				.getAllByRole('button')
				.find((btn) => btn.textContent?.includes('Seminario Web'));
			await fireEvent.click(eventButton!);

			await waitFor(() => {
				const eventCards = document.querySelectorAll('.event-card');
				const card = Array.from(eventCards).find((card) =>
					card.textContent?.includes('Seminario Web')
				);
				expect(card?.textContent).not.toContain('📍');
			});
		});

		it('should show event type badge', async () => {
			render(BlogEventRelation);

			await waitFor(() => {
				expect(screen.getByText('Taller de Programación')).toBeInTheDocument();
			});

			const eventButton = screen
				.getAllByRole('button')
				.find((btn) => btn.textContent?.includes('Taller de Programación'));
			await fireEvent.click(eventButton!);

			await waitFor(() => {
				const badges = document.querySelectorAll('.event-type');
				const tallerBadge = Array.from(badges).find((badge) => badge.textContent === 'Taller');
				expect(tallerBadge).toBeInTheDocument();
			});
		});

		it('should format event date correctly', async () => {
			render(BlogEventRelation);

			await waitFor(() => {
				expect(screen.getByText('Taller de Programación')).toBeInTheDocument();
			});

			const eventButton = screen
				.getAllByRole('button')
				.find((btn) => btn.textContent?.includes('Taller de Programación'));
			await fireEvent.click(eventButton!);

			await waitFor(() => {
				expect(screen.getByText(/📅.*15.*jun/i)).toBeInTheDocument();
			});
		});

		it('should change title when events are selected', async () => {
			render(BlogEventRelation);

			await waitFor(() => {
				expect(screen.getByText('Relacionar con Eventos')).toBeInTheDocument();
			});

			const eventButton = screen
				.getAllByRole('button')
				.find((btn) => btn.textContent?.includes('Taller de Programación'));
			await fireEvent.click(eventButton!);

			await waitFor(() => {
				expect(screen.getByText('Agregar Más Eventos')).toBeInTheDocument();
				expect(screen.queryByText('Relacionar con Eventos')).not.toBeInTheDocument();
			});
		});
	});

	describe('Remove Event', () => {
		it('should remove event when remove button is clicked', async () => {
			render(BlogEventRelation);

			await waitFor(() => {
				expect(screen.getByText('Taller de Programación')).toBeInTheDocument();
			});

			const eventButton = screen
				.getAllByRole('button')
				.find((btn) => btn.textContent?.includes('Taller de Programación'));
			await fireEvent.click(eventButton!);

			await waitFor(() => {
				expect(screen.getByText('Eventos Relacionados (1)')).toBeInTheDocument();
			});

			const removeButton = screen
				.getAllByRole('button')
				.find((btn) => btn.classList.contains('remove-btn'));
			await fireEvent.click(removeButton!);

			await waitFor(() => {
				expect(screen.queryByText('Eventos Relacionados (1)')).not.toBeInTheDocument();
			});
		});

		it('should call onChange callback when event is removed', async () => {
			const onChangeMock = vi.fn();
			render(BlogEventRelation, { props: { onChange: onChangeMock } });

			await waitFor(() => {
				expect(screen.getByText('Taller de Programación')).toBeInTheDocument();
			});

			const eventButton = screen
				.getAllByRole('button')
				.find((btn) => btn.textContent?.includes('Taller de Programación'));
			await fireEvent.click(eventButton!);

			await waitFor(() => {
				expect(screen.getByText('Eventos Relacionados (1)')).toBeInTheDocument();
			});

			const removeButton = screen
				.getAllByRole('button')
				.find((btn) => btn.classList.contains('remove-btn'));
			await fireEvent.click(removeButton!);

			await waitFor(() => {
				expect(onChangeMock).toHaveBeenLastCalledWith([]);
			});
		});

		it('should disable remove button when loading', () => {
			vi.mocked(calendarService.getUpcomingEvents).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockEvents), 100))
			);

			render(BlogEventRelation);

			const removeButtons = document.querySelectorAll('.remove-btn');
			removeButtons.forEach((btn) => {
				expect(btn).toBeDisabled();
			});
		});
	});

	describe('Empty States', () => {
		it('should show empty state when no events are available', async () => {
			vi.mocked(calendarService.getUpcomingEvents).mockResolvedValue([]);
			render(BlogEventRelation);

			await waitFor(() => {
				expect(screen.getByText('No hay eventos disponibles')).toBeInTheDocument();
			});
		});

		it('should not show selected events section when no events are selected', async () => {
			render(BlogEventRelation);

			await waitFor(() => {
				expect(screen.getByText('Taller de Programación')).toBeInTheDocument();
			});

			expect(screen.queryByText(/Eventos Relacionados/)).not.toBeInTheDocument();
		});
	});

	describe('Pre-loaded Related Events', () => {
		it('should pre-select related events from API', async () => {
			vi.mocked(calendarService.getEventsByBlogPost).mockResolvedValue([
				mockEvents[0],
				mockEvents[1]
			]);

			render(BlogEventRelation, { props: { blogPostId: 'blog-123' } });

			await waitFor(() => {
				expect(screen.getByText('Eventos Relacionados (2)')).toBeInTheDocument();
			});
		});

		it('should show selected badges for pre-selected events', async () => {
			vi.mocked(calendarService.getEventsByBlogPost).mockResolvedValue([mockEvents[0]]);

			render(BlogEventRelation, { props: { blogPostId: 'blog-123' } });

			await waitFor(() => {
				expect(screen.getByText('✓ Seleccionado')).toBeInTheDocument();
			});
		});

		it('should log pre-loaded events to console', async () => {
			const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
			vi.mocked(calendarService.getEventsByBlogPost).mockResolvedValue([mockEvents[0]]);

			render(BlogEventRelation, { props: { blogPostId: 'blog-123' } });

			await waitFor(() => {
				expect(consoleLogSpy).toHaveBeenCalledWith(
					'📅 Eventos ya relacionados cargados:',
					['1']
				);
			});

			consoleLogSpy.mockRestore();
		});
	});

	describe('Checkbox Interaction', () => {
		it('should show checked checkbox for selected events', async () => {
			render(BlogEventRelation);

			await waitFor(() => {
				expect(screen.getByText('Taller de Programación')).toBeInTheDocument();
			});

			const eventButton = screen
				.getAllByRole('button')
				.find((btn) => btn.textContent?.includes('Taller de Programación'));
			await fireEvent.click(eventButton!);

			await waitFor(() => {
				const checkboxes = screen.getAllByRole('checkbox');
				const checkedCheckbox = checkboxes.find((cb) => (cb as HTMLInputElement).checked);
				expect(checkedCheckbox).toBeInTheDocument();
			});
		});

		it('should disable dropdown items when loading', () => {
			vi.mocked(calendarService.getUpcomingEvents).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockEvents), 100))
			);

			render(BlogEventRelation);

			const dropdownItems = document.querySelectorAll('.dropdown-item');
			dropdownItems.forEach((item) => {
				expect(item).toBeDisabled();
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle missing event gracefully in selected list', async () => {
			vi.mocked(calendarService.getEventsByBlogPost).mockResolvedValue([
				{ ...mockEvents[0], id: 'non-existent-id' } as EventSummary
			]);

			render(BlogEventRelation, { props: { blogPostId: 'blog-123' } });

			await waitFor(() => {
				const eventCards = document.querySelectorAll('.event-card');
				expect(eventCards.length).toBe(0);
			});
		});

		it('should trim whitespace from search term', async () => {
			render(BlogEventRelation);

			const searchInput = screen.getByPlaceholderText('Buscar eventos por título...');
			await fireEvent.input(searchInput, { target: { value: '   ' } });

			await waitFor(() => {
				expect(screen.getByText('Taller de Programación')).toBeInTheDocument();
			});
		});
	});
});
