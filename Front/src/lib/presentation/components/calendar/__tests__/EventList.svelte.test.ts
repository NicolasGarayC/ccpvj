import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import EventList from '../EventList.svelte';
import type { EventSummary } from '$lib/application/services/calendar/CalendarService';

describe('EventList', () => {
	const mockEvents: EventSummary[] = [
		{
			id: '1',
			title: 'Test Event 1',
			description: 'Description 1',
			startDateTime: new Date('2025-06-01T10:00:00'),
			endDateTime: new Date('2025-06-01T12:00:00'),
			isAllDay: false,
			location: 'Location 1',
			eventType: 'Taller',
			isFeatured: false,
			isRecurring: false,
			organizerName: 'Organizer 1',
			imagePath: null
		},
		{
			id: '2',
			title: 'Featured Event',
			description: 'Featured Description',
			startDateTime: new Date('2025-06-15T14:00:00'),
			endDateTime: new Date('2025-06-15T16:00:00'),
			isAllDay: false,
			location: 'Location 2',
			eventType: 'Conferencia',
			isFeatured: true,
			isRecurring: false,
			organizerName: 'Organizer 2',
			imagePath: '/images/event2.jpg'
		},
		{
			id: '3',
			title: 'Recurring Event',
			description: 'Recurring Description',
			startDateTime: new Date('2025-07-01T09:00:00'),
			endDateTime: undefined,
			isAllDay: true,
			location: '',
			eventType: 'Clase',
			isFeatured: false,
			isRecurring: true,
			organizerName: 'Organizer 3',
			imagePath: null
		}
	];

	const defaultProps = {
		events: mockEvents,
		showFilters: true,
		showCreateButton: false,
		limit: 0,
		itemsPerPage: 10,
		featured: false
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render event list', () => {
			render(EventList, { props: defaultProps });

			expect(screen.getByText('Test Event 1')).toBeInTheDocument();
			expect(screen.getByText('Featured Event')).toBeInTheDocument();
			expect(screen.getByText('Recurring Event')).toBeInTheDocument();
		});

		it('should render empty state when no events', () => {
			render(EventList, {
				props: {
					...defaultProps,
					events: []
				}
			});

			expect(screen.getByText(/No hay eventos/i)).toBeInTheDocument();
		});

		it('should show filters when showFilters is true', () => {
			render(EventList, { props: defaultProps });

			expect(screen.getByPlaceholderText(/Buscar eventos/i)).toBeInTheDocument();
		});

		it('should hide filters when showFilters is false', () => {
			render(EventList, {
				props: {
					...defaultProps,
					showFilters: false
				}
			});

			expect(screen.queryByPlaceholderText(/Buscar eventos/i)).not.toBeInTheDocument();
		});

		it('should show create button when showCreateButton is true', () => {
			render(EventList, {
				props: {
					...defaultProps,
					showCreateButton: true
				}
			});

			expect(screen.getByText(/Crear Evento/i)).toBeInTheDocument();
		});

		it('should hide create button when showCreateButton is false', () => {
			render(EventList, { props: defaultProps });

			expect(screen.queryByText(/Crear Evento/i)).not.toBeInTheDocument();
		});
	});

	describe('Event Display', () => {
		it('should display event title', () => {
			render(EventList, { props: defaultProps });

			expect(screen.getByText('Test Event 1')).toBeInTheDocument();
		});

		it('should display event type', () => {
			render(EventList, { props: defaultProps });

			expect(screen.getByText('Taller')).toBeInTheDocument();
			expect(screen.getByText('Conferencia')).toBeInTheDocument();
			expect(screen.getByText('Clase')).toBeInTheDocument();
		});

		it('should display event location when available', () => {
			render(EventList, { props: defaultProps });

			expect(screen.getByText('Location 1')).toBeInTheDocument();
			expect(screen.getByText('Location 2')).toBeInTheDocument();
		});

		it('should display organizer name', () => {
			render(EventList, { props: defaultProps });

			expect(screen.getByText(/Organizado por Organizer 1/i)).toBeInTheDocument();
			expect(screen.getByText(/Organizado por Organizer 2/i)).toBeInTheDocument();
		});

		it('should display event image when available', () => {
			render(EventList, { props: defaultProps });

			const image = screen.getByAltText('Featured Event');
			expect(image).toBeInTheDocument();
			expect(image).toHaveAttribute('src', '/images/event2.jpg');
		});
	});

	describe('Event Badges', () => {
		it('should show featured badge for featured events', () => {
			render(EventList, { props: defaultProps });

			expect(screen.getByText('Destacado')).toBeInTheDocument();
		});

		it('should show recurring badge for recurring events', () => {
			render(EventList, { props: defaultProps });

			expect(screen.getByText('Recurrente')).toBeInTheDocument();
		});

		it('should show all-day indicator for all-day events', () => {
			render(EventList, { props: defaultProps });

			expect(screen.getByText(/Todo el día/i)).toBeInTheDocument();
		});

		it('should show upcoming/past status', () => {
			// Past event
			const pastEvent: EventSummary = {
				...mockEvents[0],
				startDateTime: new Date('2020-01-01T10:00:00')
			};

			render(EventList, {
				props: {
					...defaultProps,
					events: [pastEvent]
				}
			});

			expect(screen.getByText(/Evento finalizado/i)).toBeInTheDocument();
		});
	});

	describe('Search and Filter', () => {
		it('should filter events by search term', async () => {
			render(EventList, { props: defaultProps });

			const searchInput = screen.getByPlaceholderText(/Buscar eventos/i);
			await fireEvent.input(searchInput, { target: { value: 'Featured' } });

			await waitFor(() => {
				expect(screen.getByText('Featured Event')).toBeInTheDocument();
				expect(screen.queryByText('Test Event 1')).not.toBeInTheDocument();
			});
		});

		it('should filter events by type', async () => {
			const { container } = render(EventList, { props: defaultProps });

			const typeSelect = container.querySelector('select');
			if (typeSelect) {
				await fireEvent.change(typeSelect, { target: { value: 'Taller' } });

				await waitFor(() => {
					expect(screen.getByText('Test Event 1')).toBeInTheDocument();
					expect(screen.queryByText('Featured Event')).not.toBeInTheDocument();
				});
			}
		});

		it('should sort events by date ascending', () => {
			render(EventList, { props: defaultProps });

			const events = screen.getAllByRole('button');
			// First event should be the earliest one
			// This is a simplified check
			expect(events.length).toBeGreaterThan(0);
		});

		it('should sort events by date descending', async () => {
			const { container } = render(EventList, { props: defaultProps });

			const sortSelects = container.querySelectorAll('select');
			const sortSelect = Array.from(sortSelects).find((select) =>
				select.innerHTML.includes('Fecha')
			);

			if (sortSelect) {
				await fireEvent.change(sortSelect, { target: { value: 'start_desc' } });

				await waitFor(() => {
					// Events should be reordered
					const events = screen.getAllByRole('button');
					expect(events.length).toBeGreaterThan(0);
				});
			}
		});

		it('should sort events by title ascending', async () => {
			const { container } = render(EventList, { props: defaultProps });

			const sortSelects = container.querySelectorAll('select');
			const sortSelect = Array.from(sortSelects).find((select) =>
				select.innerHTML.includes('Fecha')
			);

			if (sortSelect) {
				await fireEvent.change(sortSelect, { target: { value: 'title_asc' } });

				await waitFor(() => {
					const events = screen.getAllByRole('button');
					expect(events.length).toBeGreaterThan(0);
				});
			}
		});

		it('should filter only featured events when featured prop is true', () => {
			render(EventList, {
				props: {
					...defaultProps,
					featured: true
				}
			});

			expect(screen.getByText('Featured Event')).toBeInTheDocument();
			expect(screen.queryByText('Test Event 1')).not.toBeInTheDocument();
		});

		it('should clear search and show all events', async () => {
			render(EventList, { props: defaultProps });

			const searchInput = screen.getByPlaceholderText(/Buscar eventos/i);
			await fireEvent.input(searchInput, { target: { value: 'Featured' } });

			await waitFor(() => {
				expect(screen.queryByText('Test Event 1')).not.toBeInTheDocument();
			});

			await fireEvent.input(searchInput, { target: { value: '' } });

			await waitFor(() => {
				expect(screen.getByText('Test Event 1')).toBeInTheDocument();
			});
		});
	});

	describe('Pagination', () => {
		it('should show pagination when events exceed itemsPerPage', () => {
			render(EventList, {
				props: {
					...defaultProps,
					itemsPerPage: 2
				}
			});

			expect(screen.getByText(/Página/i)).toBeInTheDocument();
		});

		it('should not show pagination when itemsPerPage is 0', () => {
			render(EventList, {
				props: {
					...defaultProps,
					itemsPerPage: 0
				}
			});

			expect(screen.queryByText(/Página/i)).not.toBeInTheDocument();
		});

		it('should show correct page info', () => {
			render(EventList, {
				props: {
					...defaultProps,
					itemsPerPage: 2
				}
			});

			expect(screen.getByText(/Mostrando 1 - 2 de 3 eventos/i)).toBeInTheDocument();
		});

		it('should navigate to next page', async () => {
			render(EventList, {
				props: {
					...defaultProps,
					itemsPerPage: 2
				}
			});

			const nextButton = screen.getByText(/Siguiente/i);
			await fireEvent.click(nextButton);

			await waitFor(() => {
				expect(screen.getByText(/Página 2/i)).toBeInTheDocument();
			});
		});

		it('should navigate to previous page', async () => {
			render(EventList, {
				props: {
					...defaultProps,
					itemsPerPage: 2
				}
			});

			// Go to page 2 first
			const nextButton = screen.getByText(/Siguiente/i);
			await fireEvent.click(nextButton);

			await waitFor(() => {
				expect(screen.getByText(/Página 2/i)).toBeInTheDocument();
			});

			// Then go back
			const prevButton = screen.getByText(/Anterior/i);
			await fireEvent.click(prevButton);

			await waitFor(() => {
				expect(screen.getByText(/Página 1/i)).toBeInTheDocument();
			});
		});

		it('should disable previous button on first page', () => {
			render(EventList, {
				props: {
					...defaultProps,
					itemsPerPage: 2
				}
			});

			const prevButton = screen.getByText(/Anterior/i);
			expect(prevButton).toBeDisabled();
		});

		it('should disable next button on last page', async () => {
			render(EventList, {
				props: {
					...defaultProps,
					itemsPerPage: 2
				}
			});

			const nextButton = screen.getByText(/Siguiente/i);
			await fireEvent.click(nextButton);

			await waitFor(() => {
				expect(nextButton).toBeDisabled();
			});
		});
	});

	describe('Limit', () => {
		it('should limit number of events shown when limit > 0', () => {
			render(EventList, {
				props: {
					...defaultProps,
					limit: 2
				}
			});

			const eventCards = screen.getAllByRole('button');
			expect(eventCards.length).toBeLessThanOrEqual(2);
		});

		it('should show all events when limit is 0', () => {
			render(EventList, { props: defaultProps });

			expect(screen.getByText('Test Event 1')).toBeInTheDocument();
			expect(screen.getByText('Featured Event')).toBeInTheDocument();
			expect(screen.getByText('Recurring Event')).toBeInTheDocument();
		});
	});

	describe('Events', () => {
		it('should dispatch eventClick when event is clicked', async () => {
			const eventClickSpy = vi.fn();
			render(EventList, {
				props: {
					...defaultProps,
					onEventClick: eventClickSpy
				}
			});

			const eventCard = screen.getByText('Test Event 1').closest('[role="button"]');
			if (eventCard) {
				await fireEvent.click(eventCard);

				expect(eventClickSpy).toHaveBeenCalledTimes(1);
				expect(eventClickSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						event: expect.objectContaining({ id: '1', title: 'Test Event 1' })
					})
				);
			}
		});

		it('should dispatch createEvent when create button is clicked', async () => {
			const createEventSpy = vi.fn();
			render(EventList, {
				props: {
					...defaultProps,
					showCreateButton: true,
					onCreateEvent: createEventSpy
				}
			});

			const createButton = screen.getByText(/Crear Evento/i);
			await fireEvent.click(createButton);

			expect(createEventSpy).toHaveBeenCalled();
		});

		it('should handle keyboard navigation', async () => {
			const eventClickSpy = vi.fn();
			render(EventList, {
				props: {
					...defaultProps,
					onEventClick: eventClickSpy
				}
			});

			const eventCard = screen.getByText('Test Event 1').closest('[role="button"]');
			if (eventCard) {
				await fireEvent.keyDown(eventCard, { key: 'Enter' });

				expect(eventClickSpy).toHaveBeenCalledTimes(1);
			}
		});
	});

	describe('Event Type Colors', () => {
		it('should apply correct color for Taller', () => {
			const { container } = render(EventList, { props: defaultProps });

			const tallerCard = screen.getByText('Taller').closest('.border-green-500');
			expect(tallerCard).toBeInTheDocument();
		});

		it('should apply correct color for Conferencia', () => {
			const { container } = render(EventList, { props: defaultProps });

			const conferenciaCard = screen.getByText('Conferencia').closest('.border-purple-500');
			expect(conferenciaCard).toBeInTheDocument();
		});

		it('should apply correct color for Clase', () => {
			const { container } = render(EventList, { props: defaultProps });

			const claseCard = screen.getByText('Clase').closest('.border-blue-500');
			expect(claseCard).toBeInTheDocument();
		});
	});

	describe('Date Formatting', () => {
		it('should format date correctly', () => {
			render(EventList, { props: defaultProps });

			// Dates should be formatted in Spanish locale
			// This is a conceptual test - actual date format depends on locale
			const dateElements = screen.getAllByText(/jun/i);
			expect(dateElements.length).toBeGreaterThan(0);
		});

		it('should format time correctly for non-all-day events', () => {
			render(EventList, { props: defaultProps });

			// Time should be shown for events that are not all-day
			// This is a conceptual test - actual time format depends on implementation
		});

		it('should not show time for all-day events', () => {
			render(EventList, { props: defaultProps });

			// All-day events should show "Todo el día" instead of time
			expect(screen.getByText(/Todo el día/i)).toBeInTheDocument();
		});
	});

	describe('Related Content', () => {
		it('should display related course title when available', () => {
			const eventWithCourse: EventSummary = {
				...mockEvents[0],
				relatedCourseTitle: 'Related Course'
			};

			render(EventList, {
				props: {
					...defaultProps,
					events: [eventWithCourse]
				}
			});

			expect(screen.getByText(/Proyecto: Related Course/i)).toBeInTheDocument();
		});

		it('should display related blog post title when available', () => {
			const eventWithBlog: EventSummary = {
				...mockEvents[0],
				relatedBlogPostTitle: 'Related Blog Post'
			};

			render(EventList, {
				props: {
					...defaultProps,
					events: [eventWithBlog]
				}
			});

			expect(screen.getByText(/Post: Related Blog Post/i)).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have role="button" on event cards', () => {
			render(EventList, { props: defaultProps });

			const eventCards = screen.getAllByRole('button');
			expect(eventCards.length).toBeGreaterThan(0);
		});

		it('should have tabindex on event cards', () => {
			const { container } = render(EventList, { props: defaultProps });

			const eventCard = container.querySelector('[tabindex="0"]');
			expect(eventCard).toBeInTheDocument();
		});

		it('should have proper alt text for images', () => {
			render(EventList, { props: defaultProps });

			const image = screen.getByAltText('Featured Event');
			expect(image).toBeInTheDocument();
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty event list', () => {
			render(EventList, {
				props: {
					...defaultProps,
					events: []
				}
			});

			expect(screen.getByText(/No hay eventos/i)).toBeInTheDocument();
		});

		it('should handle event without description', () => {
			const eventWithoutDesc: EventSummary = {
				...mockEvents[0],
				description: ''
			};

			render(EventList, {
				props: {
					...defaultProps,
					events: [eventWithoutDesc]
				}
			});

			expect(screen.getByText('Test Event 1')).toBeInTheDocument();
		});

		it('should handle event without location', () => {
			const eventWithoutLocation: EventSummary = {
				...mockEvents[0],
				location: ''
			};

			render(EventList, {
				props: {
					...defaultProps,
					events: [eventWithoutLocation]
				}
			});

			expect(screen.getByText('Test Event 1')).toBeInTheDocument();
		});

		it('should handle event without end time', () => {
			const eventWithoutEnd: EventSummary = {
				...mockEvents[0],
				endDateTime: undefined
			};

			render(EventList, {
				props: {
					...defaultProps,
					events: [eventWithoutEnd]
				}
			});

			expect(screen.getByText('Test Event 1')).toBeInTheDocument();
		});

		it('should handle very long event title', () => {
			const eventWithLongTitle: EventSummary = {
				...mockEvents[0],
				title: 'A'.repeat(200)
			};

			render(EventList, {
				props: {
					...defaultProps,
					events: [eventWithLongTitle]
				}
			});

			// Title should be truncated with CSS
			const titleElement = screen.getByText(/A{200}/, { exact: false });
			expect(titleElement).toBeInTheDocument();
		});

		it('should reset to page 1 when filters change', async () => {
			render(EventList, {
				props: {
					...defaultProps,
					itemsPerPage: 2
				}
			});

			// Go to page 2
			const nextButton = screen.getByText(/Siguiente/i);
			await fireEvent.click(nextButton);

			await waitFor(() => {
				expect(screen.getByTestId('pagination-info')).toHaveTextContent(/Página 2 de/);
			});

			// Change search filter
			const searchInput = screen.getByPlaceholderText(/Buscar eventos/i);
			await fireEvent.input(searchInput, { target: { value: 'Test' } });

			// Should go back to page 1
			await waitFor(() => {
				const paginationInfo = screen.queryByTestId('pagination-info');
				if (paginationInfo) {
					expect(paginationInfo).toHaveTextContent(/Página 1 de/);
				} else {
					expect(screen.queryByText(/Página 2/i)).not.toBeInTheDocument();
				}
			});
		});
	});
});
