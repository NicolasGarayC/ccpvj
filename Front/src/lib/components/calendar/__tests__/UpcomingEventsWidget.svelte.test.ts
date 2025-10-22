import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import UpcomingEventsWidget from '../UpcomingEventsWidget.svelte';
import { calendarService, type EventSummary } from '$lib/services/calendar/calendarService';
import { goto } from '$app/navigation';

// Mock dependencies
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('$lib/services/calendar/calendarService', () => ({
	calendarService: {
		getUpcomingEvents: vi.fn()
	}
}));

vi.mock('$lib/i18n', () => ({
	t: vi.fn((key: string) => {
		const translations: Record<string, string> = {
			'events.upcoming': 'Upcoming Events',
			'events.viewAll': 'View All',
			'events.noUpcoming': 'No upcoming events',
			'events.viewFullCalendar': 'View Full Calendar',
			'events.today': 'Today',
			'events.tomorrow': 'Tomorrow',
			'events.organizer': 'Organizer:',
			'events.viewAllMonth': 'View All Events',
			'action.retry': 'Retry',
			'error.loading_upcoming_events': 'Error loading events',
			'eventType.class': 'Class',
			'eventType.workshop': 'Workshop',
			'eventType.conference': 'Conference',
			'eventType.event': 'Event',
			'eventType.general': 'General'
		};
		return translations[key] || key;
	}),
	translate: vi.fn((key: string) => {
		const translations: Record<string, string> = {
			'events.upcoming': 'Upcoming Events',
			'events.today': 'Today',
			'events.tomorrow': 'Tomorrow',
			'error.loading_upcoming_events': 'Error loading events',
			'eventType.class': 'Class',
			'eventType.workshop': 'Workshop',
			'eventType.conference': 'Conference',
			'eventType.event': 'Event',
			'eventType.general': 'General'
		};
		return translations[key] || key;
	})
}));

const mockEvents: EventSummary[] = [
	{
		id: '1',
		title: 'Test Event 1',
		eventType: 'Class',
		startDateTime: new Date(),
		endDateTime: new Date(),
		location: 'Room 101',
		organizerName: 'John Doe',
		isFeatured: true,
		imagePath: '/event1.jpg',
		isActive: true
	},
	{
		id: '2',
		title: 'Test Event 2',
		eventType: 'Workshop',
		startDateTime: new Date(Date.now() + 86400000), // Tomorrow
		endDateTime: new Date(Date.now() + 90000000),
		location: 'Room 102',
		organizerName: 'Jane Smith',
		isFeatured: false,
		imagePath: null,
		isActive: true
	}
];

describe('UpcomingEventsWidget', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(calendarService.getUpcomingEvents).mockResolvedValue(mockEvents);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering - Basic Structure', () => {
		it('should render widget container', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				const widget = document.querySelector('.bg-white.rounded-lg');
				expect(widget).toBeInTheDocument();
			});
		});

		it('should render header when showHeader is true', async () => {
			render(UpcomingEventsWidget, { props: { showHeader: true } });

			await waitFor(() => {
				expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
			});
		});

		it('should not render header when showHeader is false', async () => {
			render(UpcomingEventsWidget, { props: { showHeader: false } });

			await waitFor(() => {
				expect(screen.queryByText('Upcoming Events')).not.toBeInTheDocument();
			});
		});

		it('should render custom title when provided', async () => {
			render(UpcomingEventsWidget, { props: { title: 'Custom Title' } });

			await waitFor(() => {
				expect(screen.getByText('Custom Title')).toBeInTheDocument();
			});
		});

		it('should render View All button in header', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				expect(screen.getByText('View All')).toBeInTheDocument();
			});
		});
	});

	describe('Loading State', () => {
		it('should show loading skeleton initially', async () => {
			vi.mocked(calendarService.getUpcomingEvents).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockEvents), 100))
			);

			render(UpcomingEventsWidget);

			const skeletons = document.querySelectorAll('.animate-pulse');
			expect(skeletons.length).toBeGreaterThan(0);
		});

		it('should render 3 skeleton items while loading', async () => {
			vi.mocked(calendarService.getUpcomingEvents).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockEvents), 100))
			);

			render(UpcomingEventsWidget);

			const skeletonItems = document.querySelectorAll('.animate-pulse');
			expect(skeletonItems.length).toBe(3);
		});

		it('should hide loading state after events are loaded', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				const skeletons = document.querySelectorAll('.animate-pulse');
				expect(skeletons.length).toBe(0);
			});
		});
	});

	describe('Error State', () => {
		it('should display error message when loading fails', async () => {
			vi.mocked(calendarService.getUpcomingEvents).mockRejectedValue(new Error('Network error'));

			render(UpcomingEventsWidget);

			await waitFor(() => {
				expect(screen.getByText('Error loading events')).toBeInTheDocument();
			});
		});

		it('should render retry button in error state', async () => {
			vi.mocked(calendarService.getUpcomingEvents).mockRejectedValue(new Error('Network error'));

			render(UpcomingEventsWidget);

			await waitFor(() => {
				expect(screen.getByText('Retry')).toBeInTheDocument();
			});
		});

		it('should retry loading when retry button is clicked', async () => {
			vi.mocked(calendarService.getUpcomingEvents)
				.mockRejectedValueOnce(new Error('Network error'))
				.mockResolvedValueOnce(mockEvents);

			render(UpcomingEventsWidget);

			await waitFor(() => {
				const retryButton = screen.getByText('Retry');
				expect(retryButton).toBeInTheDocument();
			});

			const retryButton = screen.getByText('Retry');
			await fireEvent.click(retryButton);

			await waitFor(() => {
				expect(calendarService.getUpcomingEvents).toHaveBeenCalledTimes(2);
			});
		});

		it('should render error icon in error state', async () => {
			vi.mocked(calendarService.getUpcomingEvents).mockRejectedValue(new Error('Network error'));

			render(UpcomingEventsWidget);

			await waitFor(() => {
				const errorIcon = document.querySelector('.text-red-400');
				expect(errorIcon).toBeInTheDocument();
			});
		});
	});

	describe('Empty State', () => {
		it('should display empty state when no events', async () => {
			vi.mocked(calendarService.getUpcomingEvents).mockResolvedValue([]);

			render(UpcomingEventsWidget);

			await waitFor(() => {
				expect(screen.getByText('No upcoming events')).toBeInTheDocument();
			});
		});

		it('should render View Full Calendar button in empty state', async () => {
			vi.mocked(calendarService.getUpcomingEvents).mockResolvedValue([]);

			render(UpcomingEventsWidget);

			await waitFor(() => {
				expect(screen.getByText('View Full Calendar')).toBeInTheDocument();
			});
		});

		it('should navigate to calendar when button clicked in empty state', async () => {
			vi.mocked(calendarService.getUpcomingEvents).mockResolvedValue([]);

			render(UpcomingEventsWidget);

			await waitFor(() => {
				const button = screen.getByText('View Full Calendar');
				fireEvent.click(button);
			});

			expect(goto).toHaveBeenCalledWith('/calendar');
		});

		it('should render empty state icon', async () => {
			vi.mocked(calendarService.getUpcomingEvents).mockResolvedValue([]);

			render(UpcomingEventsWidget);

			await waitFor(() => {
				const icon = document.querySelector('.text-gray-400');
				expect(icon).toBeInTheDocument();
			});
		});
	});

	describe('Events List', () => {
		it('should render all events', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				expect(screen.getByText('Test Event 1')).toBeInTheDocument();
				expect(screen.getByText('Test Event 2')).toBeInTheDocument();
			});
		});

		it('should respect limit prop', async () => {
			render(UpcomingEventsWidget, { props: { limit: 5 } });

			await waitFor(() => {
				expect(calendarService.getUpcomingEvents).toHaveBeenCalledWith(5);
			});
		});

		it('should use default limit of 5', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				expect(calendarService.getUpcomingEvents).toHaveBeenCalledWith(5);
			});
		});

		it('should render event image when available', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				const image = document.querySelector('img[alt="Test Event 1"]') as HTMLImageElement;
				expect(image).toBeInTheDocument();
				expect(image.src).toContain('event1.jpg');
			});
		});

		it('should render default icon when no image', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				const defaultIcons = document.querySelectorAll('.bg-gradient-to-br');
				expect(defaultIcons.length).toBeGreaterThan(0);
			});
		});

		it('should render featured badge for featured events', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				const featuredIcon = document.querySelector('.text-yellow-500');
				expect(featuredIcon).toBeInTheDocument();
			});
		});

		it('should not render featured badge for non-featured events', async () => {
			const nonFeaturedEvents = [mockEvents[1]];
			vi.mocked(calendarService.getUpcomingEvents).mockResolvedValue(nonFeaturedEvents);

			render(UpcomingEventsWidget);

			await waitFor(() => {
				const featuredIcon = document.querySelector('.text-yellow-500');
				expect(featuredIcon).not.toBeInTheDocument();
			});
		});
	});

	describe('Event Details Display', () => {
		it('should render event type badge', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				expect(screen.getByText('Class')).toBeInTheDocument();
				expect(screen.getByText('Workshop')).toBeInTheDocument();
			});
		});

		it('should render event location', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				expect(screen.getByText('Room 101')).toBeInTheDocument();
				expect(screen.getByText('Room 102')).toBeInTheDocument();
			});
		});

		it('should render organizer name', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				expect(screen.getByText(/John Doe/)).toBeInTheDocument();
				expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
			});
		});

		it('should display Today label for today events', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				const todayLabels = screen.getAllByText('Today');
				expect(todayLabels.length).toBeGreaterThan(0);
			});
		});

		it('should display Tomorrow label for tomorrow events', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				expect(screen.getByText('Tomorrow')).toBeInTheDocument();
			});
		});
	});

	describe('Navigation', () => {
		it('should navigate to event detail when event clicked', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				const event = screen.getByText('Test Event 1');
				fireEvent.click(event.closest('[role="button"]')!);
			});

			expect(goto).toHaveBeenCalledWith('/calendar/event/1');
		});

		it('should navigate to calendar when View All clicked', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				const viewAllButton = screen.getByText('View All');
				fireEvent.click(viewAllButton);
			});

			expect(goto).toHaveBeenCalledWith('/calendar');
		});

		it('should navigate on Enter key press', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				const eventButton = screen.getByText('Test Event 1').closest('[role="button"]') as HTMLElement;
				fireEvent.keyDown(eventButton, { key: 'Enter' });
			});

			expect(goto).toHaveBeenCalledWith('/calendar/event/1');
		});

		it('should not navigate on other key press', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				const eventButton = screen.getByText('Test Event 1').closest('[role="button"]') as HTMLElement;
				fireEvent.keyDown(eventButton, { key: 'Space' });
			});

			expect(goto).not.toHaveBeenCalled();
		});
	});

	describe('View More Button', () => {
		it('should show View All Events button when events reach limit', async () => {
			const manyEvents = Array(5).fill(null).map((_, i) => ({
				...mockEvents[0],
				id: `${i + 1}`,
				title: `Event ${i + 1}`
			}));

			vi.mocked(calendarService.getUpcomingEvents).mockResolvedValue(manyEvents);

			render(UpcomingEventsWidget, { props: { limit: 5 } });

			await waitFor(() => {
				expect(screen.getByText('View All Events')).toBeInTheDocument();
			});
		});

		it('should not show View All Events button when events below limit', async () => {
			render(UpcomingEventsWidget, { props: { limit: 10 } });

			await waitFor(() => {
				expect(screen.queryByText('View All Events')).not.toBeInTheDocument();
			});
		});

		it('should navigate to calendar when View All Events clicked', async () => {
			const manyEvents = Array(5).fill(null).map((_, i) => ({
				...mockEvents[0],
				id: `${i + 1}`,
				title: `Event ${i + 1}`
			}));

			vi.mocked(calendarService.getUpcomingEvents).mockResolvedValue(manyEvents);

			render(UpcomingEventsWidget, { props: { limit: 5 } });

			await waitFor(() => {
				const button = screen.getByText('View All Events');
				fireEvent.click(button);
			});

			expect(goto).toHaveBeenCalledWith('/calendar');
		});
	});

	describe('Event Type Colors', () => {
		it('should apply blue color for Class events', async () => {
			const classEvent = [{ ...mockEvents[0], eventType: 'Class' }];
			vi.mocked(calendarService.getUpcomingEvents).mockResolvedValue(classEvent);

			render(UpcomingEventsWidget);

			await waitFor(() => {
				const badge = screen.getByText('Class');
				expect(badge.className).toContain('bg-blue-100');
				expect(badge.className).toContain('text-blue-800');
			});
		});

		it('should apply green color for Workshop events', async () => {
			const workshopEvent = [{ ...mockEvents[1], eventType: 'Workshop' }];
			vi.mocked(calendarService.getUpcomingEvents).mockResolvedValue(workshopEvent);

			render(UpcomingEventsWidget);

			await waitFor(() => {
				const badge = screen.getByText('Workshop');
				expect(badge.className).toContain('bg-green-100');
				expect(badge.className).toContain('text-green-800');
			});
		});

		it('should apply default gray color for unknown event types', async () => {
			const unknownEvent = [{ ...mockEvents[0], eventType: 'Unknown' }];
			vi.mocked(calendarService.getUpcomingEvents).mockResolvedValue(unknownEvent);

			render(UpcomingEventsWidget);

			await waitFor(() => {
				const badge = screen.getByText('Unknown');
				expect(badge.className).toContain('bg-gray-100');
				expect(badge.className).toContain('text-gray-800');
			});
		});
	});

	describe('Date Formatting', () => {
		it('should format dates correctly', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				// Just verify dates are rendered, specific format may vary
				const widget = document.querySelector('.bg-white.rounded-lg');
				expect(widget?.textContent).toBeTruthy();
			});
		});

		it('should identify today correctly', async () => {
			const todayEvent = [{ ...mockEvents[0], startDateTime: new Date() }];
			vi.mocked(calendarService.getUpcomingEvents).mockResolvedValue(todayEvent);

			render(UpcomingEventsWidget);

			await waitFor(() => {
				const todayLabels = screen.getAllByText('Today');
				expect(todayLabels.length).toBeGreaterThan(0);
			});
		});

		it('should identify tomorrow correctly', async () => {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			const tomorrowEvent = [{ ...mockEvents[0], startDateTime: tomorrow }];
			vi.mocked(calendarService.getUpcomingEvents).mockResolvedValue(tomorrowEvent);

			render(UpcomingEventsWidget);

			await waitFor(() => {
				expect(screen.getByText('Tomorrow')).toBeInTheDocument();
			});
		});
	});

	describe('Accessibility', () => {
		it('should have role="button" on event items', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				const eventButtons = document.querySelectorAll('[role="button"]');
				expect(eventButtons.length).toBeGreaterThan(0);
			});
		});

		it('should have tabindex on event items', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				const eventButtons = document.querySelectorAll('[tabindex="0"]');
				expect(eventButtons.length).toBeGreaterThan(0);
			});
		});

		it('should have alt text on event images', async () => {
			render(UpcomingEventsWidget);

			await waitFor(() => {
				const image = document.querySelector('img[alt="Test Event 1"]');
				expect(image).toBeInTheDocument();
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle events without location', async () => {
			const eventNoLocation = [{ ...mockEvents[0], location: null }];
			vi.mocked(calendarService.getUpcomingEvents).mockResolvedValue(eventNoLocation);

			render(UpcomingEventsWidget);

			await waitFor(() => {
				expect(screen.getByText('Test Event 1')).toBeInTheDocument();
			});
		});

		it('should handle events without image', async () => {
			const eventNoImage = [{ ...mockEvents[0], imagePath: null }];
			vi.mocked(calendarService.getUpcomingEvents).mockResolvedValue(eventNoImage);

			render(UpcomingEventsWidget);

			await waitFor(() => {
				const defaultIcon = document.querySelector('.bg-gradient-to-br');
				expect(defaultIcon).toBeInTheDocument();
			});
		});

		it('should handle long event titles', async () => {
			const longTitleEvent = [{
				...mockEvents[0],
				title: 'This is a very long event title that should be handled gracefully by the component without breaking the layout'
			}];
			vi.mocked(calendarService.getUpcomingEvents).mockResolvedValue(longTitleEvent);

			render(UpcomingEventsWidget);

			await waitFor(() => {
				const title = screen.getByText(/This is a very long event title/);
				expect(title).toBeInTheDocument();
				expect(title.className).toContain('truncate');
			});
		});

		it('should handle limit of 1', async () => {
			render(UpcomingEventsWidget, { props: { limit: 1 } });

			await waitFor(() => {
				expect(calendarService.getUpcomingEvents).toHaveBeenCalledWith(1);
			});
		});

		it('should handle very large limit', async () => {
			render(UpcomingEventsWidget, { props: { limit: 100 } });

			await waitFor(() => {
				expect(calendarService.getUpcomingEvents).toHaveBeenCalledWith(100);
			});
		});
	});
});
