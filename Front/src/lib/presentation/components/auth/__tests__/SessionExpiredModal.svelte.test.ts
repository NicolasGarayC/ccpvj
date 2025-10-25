import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import SessionExpiredModal from '../SessionExpiredModal.svelte';
import { authModalStore } from '$lib/presentation/stores/authStore';
import { goto } from '$app/navigation';
import { __setTranslations } from '$lib/i18n';

// Mock dependencies
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

beforeEach(() => {
	__setTranslations({
		'modal.sessionExpired': 'Session Expired',
		'modal.sessionExpiredMessage': 'Your session has expired. Please log in again.',
		'modal.backToHome': 'Back to Login'
	});
});

describe('SessionExpiredModal', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		authModalStore.hide(); // Ensure modal is hidden before each test
	});

	afterEach(() => {
		authModalStore.hide(); // Clean up after each test
	});

	describe('Rendering - Visibility', () => {
		it('should not render modal when store show is false', () => {
			render(SessionExpiredModal);

			const overlay = document.querySelector('.modal-overlay');
			expect(overlay).not.toBeInTheDocument();
		});

		it('should render modal when store show is true', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const overlay = document.querySelector('.modal-overlay');
				expect(overlay).toBeInTheDocument();
			});
		});

		it('should render modal header with warning icon', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const icon = document.querySelector('.icon-warning');
				expect(icon).toBeInTheDocument();
				expect(icon?.textContent).toBe('⚠️');
			});
		});

		it('should render modal header with title', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				expect(screen.getByText('Session Expired')).toBeInTheDocument();
			});
		});
	});

	describe('Message Display', () => {
		it('should display custom message when provided', async () => {
			render(SessionExpiredModal);

			const customMessage = 'Your session has timed out due to inactivity';
			authModalStore.show(customMessage);

			await waitFor(() => {
				expect(screen.getByText(customMessage)).toBeInTheDocument();
			});
		});

		it('should display default message when no message provided', async () => {
			render(SessionExpiredModal);

			authModalStore.show('');

			await waitFor(() => {
				expect(screen.getByText('Your session has expired. Please log in again.')).toBeInTheDocument();
			});
		});

		it('should display default message when message is undefined', async () => {
			render(SessionExpiredModal);

			// @ts-ignore - testing undefined case
			authModalStore.show(undefined);

			await waitFor(() => {
				expect(screen.getByText('Your session has expired. Please log in again.')).toBeInTheDocument();
			});
		});
	});

	describe('Close Button', () => {
		it('should render close button', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const button = screen.getByText('Back to Login');
				expect(button).toBeInTheDocument();
				expect(button.tagName).toBe('BUTTON');
			});
		});

		it('should have correct CSS class for button', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const button = screen.getByText('Back to Login');
				expect(button).toHaveClass('btn-primary');
			});
		});

		it('should call goto with /auth/login when button clicked', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const button = screen.getByText('Back to Login');
				fireEvent.click(button);
			});

			expect(goto).toHaveBeenCalledWith('/auth/login');
		});

		it('should hide modal when button clicked', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const button = screen.getByText('Back to Login');
				fireEvent.click(button);
			});

			await waitFor(() => {
				const overlay = document.querySelector('.modal-overlay');
				expect(overlay).not.toBeInTheDocument();
			});
		});
	});

	describe('Overlay Click', () => {
		it('should close modal when overlay is clicked (self click)', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const overlay = document.querySelector('.modal-overlay');
				expect(overlay).toBeInTheDocument();
			});

			const overlay = document.querySelector('.modal-overlay') as HTMLElement;
			await fireEvent.click(overlay);

			await waitFor(() => {
				expect(goto).toHaveBeenCalledWith('/auth/login');
			});
		});

		it('should not close modal when content is clicked', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const content = document.querySelector('.modal-content');
				expect(content).toBeInTheDocument();
			});

			const content = document.querySelector('.modal-content') as HTMLElement;
			await fireEvent.click(content);

			// Modal should still be visible
			const overlay = document.querySelector('.modal-overlay');
			expect(overlay).toBeInTheDocument();
		});
	});

	describe('Keyboard Handling', () => {
		it('should close modal when Escape key is pressed on overlay', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const overlay = document.querySelector('.modal-overlay');
				expect(overlay).toBeInTheDocument();
			});

			const overlay = document.querySelector('.modal-overlay') as HTMLElement;
			await fireEvent.keyDown(overlay, { key: 'Escape' });

			await waitFor(() => {
				expect(goto).toHaveBeenCalledWith('/auth/login');
			});
		});

		it('should close modal when Enter key is pressed on overlay', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const overlay = document.querySelector('.modal-overlay');
				expect(overlay).toBeInTheDocument();
			});

			const overlay = document.querySelector('.modal-overlay') as HTMLElement;
			await fireEvent.keyDown(overlay, { key: 'Enter' });

			await waitFor(() => {
				expect(goto).toHaveBeenCalledWith('/auth/login');
			});
		});

		it('should close modal when Space key is pressed on overlay', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const overlay = document.querySelector('.modal-overlay');
				expect(overlay).toBeInTheDocument();
			});

			const overlay = document.querySelector('.modal-overlay') as HTMLElement;
			await fireEvent.keyDown(overlay, { key: ' ' });

			await waitFor(() => {
				expect(goto).toHaveBeenCalledWith('/auth/login');
			});
		});

		it('should not close modal when other keys are pressed', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const overlay = document.querySelector('.modal-overlay');
				expect(overlay).toBeInTheDocument();
			});

			const overlay = document.querySelector('.modal-overlay') as HTMLElement;
			await fireEvent.keyDown(overlay, { key: 'a' });

			// Modal should still be visible
			const overlayAfter = document.querySelector('.modal-overlay');
			expect(overlayAfter).toBeInTheDocument();
			expect(goto).not.toHaveBeenCalled();
		});
	});

	describe('Accessibility', () => {
		it('should have role="button" on overlay', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const overlay = document.querySelector('.modal-overlay');
				expect(overlay).toHaveAttribute('role', 'button');
			});
		});

		it('should have tabindex="0" on overlay for keyboard accessibility', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const overlay = document.querySelector('.modal-overlay');
				expect(overlay).toHaveAttribute('tabindex', '0');
			});
		});

		it('should render semantic heading in header', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const heading = document.querySelector('.modal-header h2');
				expect(heading).toBeInTheDocument();
				expect(heading?.textContent).toBe('Session Expired');
			});
		});

		it('should render message in paragraph element', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const paragraph = document.querySelector('.modal-body p');
				expect(paragraph).toBeInTheDocument();
				expect(paragraph?.textContent).toBe('Test message');
			});
		});
	});

	describe('Styling and Classes', () => {
		it('should have modal-overlay class', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const overlay = document.querySelector('.modal-overlay');
				expect(overlay).toHaveClass('modal-overlay');
			});
		});

		it('should have modal-content class', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const content = document.querySelector('.modal-content');
				expect(content).toHaveClass('modal-content');
			});
		});

		it('should have modal-header class', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const header = document.querySelector('.modal-header');
				expect(header).toHaveClass('modal-header');
			});
		});

		it('should have modal-body class', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const body = document.querySelector('.modal-body');
				expect(body).toHaveClass('modal-body');
			});
		});

		it('should have modal-footer class', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test message');

			await waitFor(() => {
				const footer = document.querySelector('.modal-footer');
				expect(footer).toHaveClass('modal-footer');
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle rapid show/hide calls', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Message 1');
			authModalStore.hide();
			authModalStore.show('Message 2');

			await waitFor(() => {
				expect(screen.getByText('Message 2')).toBeInTheDocument();
			});
		});

		it('should handle very long message text', async () => {
			render(SessionExpiredModal);

			const longMessage = 'This is a very long message that should still be displayed correctly in the modal. '.repeat(10);
			authModalStore.show(longMessage);

		await waitFor(() => {
			expect(
				screen.getByText((content) => content.startsWith('This is a very long message'))
			).toBeInTheDocument();
		});
		});

		it('should handle empty message string', async () => {
			render(SessionExpiredModal);

			authModalStore.show('');

			await waitFor(() => {
				// Should show default message
				expect(screen.getByText('Your session has expired. Please log in again.')).toBeInTheDocument();
			});
		});

		it('should handle special characters in message', async () => {
			render(SessionExpiredModal);

			const specialMessage = 'Error: <script>alert("XSS")</script> & special chars!';
			authModalStore.show(specialMessage);

			await waitFor(() => {
				expect(screen.getByText(specialMessage)).toBeInTheDocument();
			});
		});
	});

	describe('Store Integration', () => {
		it('should subscribe to authModalStore on mount', () => {
			render(SessionExpiredModal);

			// Modal should react to store changes
			authModalStore.show('Store test');

			waitFor(() => {
				expect(screen.getByText('Store test')).toBeInTheDocument();
			});
		});

		it('should update when store changes', async () => {
			render(SessionExpiredModal);

			authModalStore.show('First message');

			await waitFor(() => {
				expect(screen.getByText('First message')).toBeInTheDocument();
			});

			authModalStore.show('Second message');

			await waitFor(() => {
				expect(screen.getByText('Second message')).toBeInTheDocument();
			});
		});

		it('should hide modal when store.hide() is called', async () => {
			render(SessionExpiredModal);

			authModalStore.show('Test');

			await waitFor(() => {
				const overlay = document.querySelector('.modal-overlay');
				expect(overlay).toBeInTheDocument();
			});

			authModalStore.hide();

			await waitFor(() => {
				const overlay = document.querySelector('.modal-overlay');
				expect(overlay).not.toBeInTheDocument();
			});
		});
	});
});
