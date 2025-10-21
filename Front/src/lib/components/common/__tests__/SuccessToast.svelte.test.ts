import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import SuccessToast from '../SuccessToast.svelte';

describe('SuccessToast Component', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	describe('Rendering - Visibility', () => {
		it('should not render when visible is false', () => {
			render(SuccessToast, { props: { visible: false, message: 'Test message' } });

			expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		});

		it('should not render when message is empty', () => {
			render(SuccessToast, { props: { visible: true, message: '' } });

			expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		});

		it('should render when both visible and message are provided', () => {
			render(SuccessToast, { props: { visible: true, message: 'Success!' } });

			expect(screen.getByRole('alert')).toBeInTheDocument();
		});

		it('should display the message text', () => {
			render(SuccessToast, { props: { visible: true, message: 'Operation completed successfully' } });

			expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
		});
	});

	describe('Icons and Elements', () => {
		it('should render success icon', () => {
			const { container } = render(SuccessToast, {
				props: { visible: true, message: 'Success!' }
			});

			const icon = container.querySelector('.toast-icon svg');
			expect(icon).toBeInTheDocument();
		});

		it('should render close button', () => {
			render(SuccessToast, { props: { visible: true, message: 'Success!' } });

			const closeButton = screen.getByLabelText('Cerrar notificación');
			expect(closeButton).toBeInTheDocument();
		});

		it('should render progress bar', () => {
			const { container } = render(SuccessToast, {
				props: { visible: true, message: 'Success!' }
			});

			const progressBar = container.querySelector('.progress-bar');
			const progressFill = container.querySelector('.progress-fill');

			expect(progressBar).toBeInTheDocument();
			expect(progressFill).toBeInTheDocument();
		});
	});

	describe('Auto-close Behavior', () => {
		it('should auto-close after default duration (3000ms)', async () => {
			const { component } = render(SuccessToast, {
				props: { visible: true, message: 'Success!' }
			});

			const closeHandler = vi.fn();
			component.$on('close', closeHandler);

			// Fast-forward time by 3000ms
			vi.advanceTimersByTime(3000);

			await waitFor(() => {
				expect(closeHandler).toHaveBeenCalledTimes(1);
			});
		});

		it('should auto-close after custom duration', async () => {
			const { component } = render(SuccessToast, {
				props: { visible: true, message: 'Success!', duration: 5000 }
			});

			const closeHandler = vi.fn();
			component.$on('close', closeHandler);

			// Fast-forward time by 5000ms
			vi.advanceTimersByTime(5000);

			await waitFor(() => {
				expect(closeHandler).toHaveBeenCalledTimes(1);
			});
		});

		it('should not auto-close before duration is complete', async () => {
			const { component } = render(SuccessToast, {
				props: { visible: true, message: 'Success!', duration: 3000 }
			});

			const closeHandler = vi.fn();
			component.$on('close', closeHandler);

			// Fast-forward time by 2999ms (1ms before duration)
			vi.advanceTimersByTime(2999);

			expect(closeHandler).not.toHaveBeenCalled();
		});

		it('should reset timer when visible changes from false to true', async () => {
			const { component } = render(SuccessToast, {
				props: { visible: false, message: 'Success!', duration: 3000 }
			});

			const closeHandler = vi.fn();
			component.$on('close', closeHandler);

			// Make visible
			await component.$set({ visible: true });

			// Fast-forward time
			vi.advanceTimersByTime(3000);

			await waitFor(() => {
				expect(closeHandler).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('Manual Close Actions', () => {
		it('should close when close button is clicked', async () => {
			const { component } = render(SuccessToast, {
				props: { visible: true, message: 'Success!' }
			});

			const closeHandler = vi.fn();
			component.$on('close', closeHandler);

			const closeButton = screen.getByLabelText('Cerrar notificación');
			await fireEvent.click(closeButton);

			expect(closeHandler).toHaveBeenCalledTimes(1);
		});

		it('should close when toast is clicked', async () => {
			const { component } = render(SuccessToast, {
				props: { visible: true, message: 'Success!' }
			});

			const closeHandler = vi.fn();
			component.$on('close', closeHandler);

			const toast = screen.getByRole('alert');
			await fireEvent.click(toast);

			expect(closeHandler).toHaveBeenCalledTimes(1);
		});

		it('should stop propagation when clicking close button', async () => {
			const { component } = render(SuccessToast, {
				props: { visible: true, message: 'Success!' }
			});

			const closeHandler = vi.fn();
			component.$on('close', closeHandler);

			const closeButton = screen.getByLabelText('Cerrar notificación');
			await fireEvent.click(closeButton);

			// Should only call once (not twice from both toast and button)
			expect(closeHandler).toHaveBeenCalledTimes(1);
		});
	});

	describe('Accessibility', () => {
		it('should have role="alert"', () => {
			render(SuccessToast, { props: { visible: true, message: 'Success!' } });

			const toast = screen.getByRole('alert');
			expect(toast).toBeInTheDocument();
		});

		it('should have aria-live="polite"', () => {
			render(SuccessToast, { props: { visible: true, message: 'Success!' } });

			const toast = screen.getByRole('alert');
			expect(toast).toHaveAttribute('aria-live', 'polite');
		});

		it('should have aria-label on close button', () => {
			render(SuccessToast, { props: { visible: true, message: 'Success!' } });

			const closeButton = screen.getByLabelText('Cerrar notificación');
			expect(closeButton).toBeInTheDocument();
		});
	});

	describe('Message Content', () => {
		it('should display short messages correctly', () => {
			render(SuccessToast, { props: { visible: true, message: 'OK' } });

			expect(screen.getByText('OK')).toBeInTheDocument();
		});

		it('should display long messages correctly', () => {
			const longMessage =
				'This is a very long success message that should still be displayed correctly in the toast notification component';
			render(SuccessToast, { props: { visible: true, message: longMessage } });

			expect(screen.getByText(longMessage)).toBeInTheDocument();
		});

		it('should handle special characters in message', () => {
			const specialMessage = 'Success! <>&"\'';
			render(SuccessToast, { props: { visible: true, message: specialMessage } });

			expect(screen.getByText(specialMessage)).toBeInTheDocument();
		});

		it('should handle line breaks in message', () => {
			const messageWithBreaks = 'Line 1\nLine 2\nLine 3';
			render(SuccessToast, { props: { visible: true, message: messageWithBreaks } });

			expect(screen.getByText(messageWithBreaks)).toBeInTheDocument();
		});
	});

	describe('Edge Cases', () => {
		it('should handle duration of 0', async () => {
			const { component } = render(SuccessToast, {
				props: { visible: true, message: 'Success!', duration: 0 }
			});

			const closeHandler = vi.fn();
			component.$on('close', closeHandler);

			// Should close immediately
			vi.advanceTimersByTime(0);

			await waitFor(() => {
				expect(closeHandler).toHaveBeenCalled();
			});
		});

		it('should handle very long duration', async () => {
			const { component } = render(SuccessToast, {
				props: { visible: true, message: 'Success!', duration: 100000 }
			});

			const closeHandler = vi.fn();
			component.$on('close', closeHandler);

			// Should not close before duration
			vi.advanceTimersByTime(99999);
			expect(closeHandler).not.toHaveBeenCalled();

			// Should close after duration
			vi.advanceTimersByTime(1);
			await waitFor(() => {
				expect(closeHandler).toHaveBeenCalled();
			});
		});

		it('should update message when prop changes', async () => {
			const { component } = render(SuccessToast, {
				props: { visible: true, message: 'First message' }
			});

			expect(screen.getByText('First message')).toBeInTheDocument();

			await component.$set({ message: 'Second message' });

			expect(screen.queryByText('First message')).not.toBeInTheDocument();
			expect(screen.getByText('Second message')).toBeInTheDocument();
		});

		it('should hide when visible is set to false', async () => {
			const { component } = render(SuccessToast, {
				props: { visible: true, message: 'Success!' }
			});

			expect(screen.getByRole('alert')).toBeInTheDocument();

			await component.$set({ visible: false });

			expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		});

		it('should cancel auto-close when manually closed', async () => {
			const { component } = render(SuccessToast, {
				props: { visible: true, message: 'Success!', duration: 5000 }
			});

			const closeHandler = vi.fn();
			component.$on('close', closeHandler);

			// Manually close before auto-close
			const closeButton = screen.getByLabelText('Cerrar notificación');
			await fireEvent.click(closeButton);

			expect(closeHandler).toHaveBeenCalledTimes(1);

			// Advance time to when auto-close would have happened
			vi.advanceTimersByTime(5000);

			// Should still only be called once (manual close)
			expect(closeHandler).toHaveBeenCalledTimes(1);
		});
	});

	describe('Component Lifecycle', () => {
		it('should clean up timeout on unmount', () => {
			const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

			const { unmount } = render(SuccessToast, {
				props: { visible: true, message: 'Success!' }
			});

			unmount();

			expect(clearTimeoutSpy).toHaveBeenCalled();
		});
	});
});
