import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import ConfirmationModal from '../ConfirmationModal.svelte';
import { __setTranslations } from '$lib/i18n';

beforeEach(() => {
	__setTranslations({
		'modal.confirmAction': 'Confirmar Acción',
		'modal.confirmMessage': '¿Está seguro de que desea continuar?',
		'modal.confirm': 'Confirmar',
		'action.cancel': 'Cancelar',
		'modal.closeModal': 'Cerrar modal'
	});
});

describe('ConfirmationModal Component', () => {
	describe('Rendering - Visibility', () => {
		it('should not render when isOpen is false', () => {
			render(ConfirmationModal, { props: { isOpen: false } });

			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		it('should render when isOpen is true', () => {
			render(ConfirmationModal, { props: { isOpen: true } });

			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});

		it('should show default title when not provided', () => {
			render(ConfirmationModal, { props: { isOpen: true } });

			expect(screen.getByText('Confirmar Acción')).toBeInTheDocument();
		});

		it('should show custom title when provided', () => {
			render(ConfirmationModal, {
				props: { isOpen: true, title: 'Eliminar Elemento' }
			});

			expect(screen.getByText('Eliminar Elemento')).toBeInTheDocument();
		});

		it('should show default message when not provided', () => {
			render(ConfirmationModal, { props: { isOpen: true } });

			expect(screen.getByText('¿Está seguro de que desea continuar?')).toBeInTheDocument();
		});

		it('should show custom message when provided', () => {
			render(ConfirmationModal, {
				props: { isOpen: true, message: 'Esta acción no se puede deshacer.' }
			});

			expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument();
		});
	});

	describe('Type Variants - Icons', () => {
		it('should display danger icon when type is danger', () => {
			const { container } = render(ConfirmationModal, {
				props: { isOpen: true, type: 'danger' }
			});

			const iconContainer = container.querySelector('.icon-container.danger');
			expect(iconContainer).toBeInTheDocument();
		});

		it('should display warning icon when type is warning', () => {
			const { container } = render(ConfirmationModal, {
				props: { isOpen: true, type: 'warning' }
			});

			const iconContainer = container.querySelector('.icon-container.warning');
			expect(iconContainer).toBeInTheDocument();
		});

		it('should display info icon when type is info', () => {
			const { container } = render(ConfirmationModal, {
				props: { isOpen: true, type: 'info' }
			});

			const iconContainer = container.querySelector('.icon-container.info');
			expect(iconContainer).toBeInTheDocument();
		});

		it('should display warning icon by default', () => {
			const { container } = render(ConfirmationModal, {
				props: { isOpen: true }
			});

			const iconContainer = container.querySelector('.icon-container.warning');
			expect(iconContainer).toBeInTheDocument();
		});
	});

	describe('Buttons - Text and Styling', () => {
		it('should show default confirm button text', () => {
			render(ConfirmationModal, { props: { isOpen: true } });

			expect(screen.getByText('Confirmar')).toBeInTheDocument();
		});

		it('should show custom confirm button text', () => {
			render(ConfirmationModal, {
				props: { isOpen: true, confirmText: 'Eliminar' }
			});

			expect(screen.getByText('Eliminar')).toBeInTheDocument();
		});

		it('should show default cancel button text', () => {
			render(ConfirmationModal, { props: { isOpen: true } });

			expect(screen.getByText('Cancelar')).toBeInTheDocument();
		});

		it('should show custom cancel button text', () => {
			render(ConfirmationModal, {
				props: { isOpen: true, cancelText: 'Cerrar' }
			});

			expect(screen.getByText('Cerrar')).toBeInTheDocument();
		});

		it('should apply danger button class when type is danger', () => {
			const { container } = render(ConfirmationModal, {
				props: { isOpen: true, type: 'danger', confirmText: 'Delete' }
			});

			const confirmButton = screen.getByText('Delete');
			expect(confirmButton).toHaveClass('btn-danger');
		});

		it('should apply warning button class when type is warning', () => {
			const { container } = render(ConfirmationModal, {
				props: { isOpen: true, type: 'warning', confirmText: 'Proceed' }
			});

			const confirmButton = screen.getByText('Proceed');
			expect(confirmButton).toHaveClass('btn-warning');
		});

		it('should apply primary button class when type is info', () => {
			const { container } = render(ConfirmationModal, {
				props: { isOpen: true, type: 'info', confirmText: 'OK' }
			});

			const confirmButton = screen.getByText('OK');
			expect(confirmButton).toHaveClass('btn-primary');
		});
	});

	describe('Button Actions - Events', () => {
		it('should dispatch confirm event when confirm button is clicked', async () => {
			const confirmHandler = vi.fn();
			render(ConfirmationModal, { props: { isOpen: true, onConfirmCallback: confirmHandler } });

			const confirmButton = screen.getByText('Confirmar');
			await fireEvent.click(confirmButton);

			expect(confirmHandler).toHaveBeenCalledTimes(1);
		});

		it('should dispatch cancel event when cancel button is clicked', async () => {
			const cancelHandler = vi.fn();
			render(ConfirmationModal, {
				props: { isOpen: true, onCancelCallback: cancelHandler }
			});

			const cancelButton = screen.getByText('Cancelar');
			await fireEvent.click(cancelButton);

			expect(cancelHandler).toHaveBeenCalledTimes(1);
		});

		it('should dispatch cancel event when close button is clicked', async () => {
			const cancelHandler = vi.fn();
			render(ConfirmationModal, {
				props: { isOpen: true, onCancelCallback: cancelHandler }
			});

			const closeButton = screen.getByLabelText('Cerrar modal');
			await fireEvent.click(closeButton);

			expect(cancelHandler).toHaveBeenCalledTimes(1);
		});
	});

	describe('Loading State', () => {
		it('should disable confirm button when loading', () => {
			render(ConfirmationModal, {
				props: { isOpen: true, loading: true }
			});

			const confirmButton = screen.getByText('Confirmar');
			expect(confirmButton).toBeDisabled();
		});

		it('should disable cancel button when loading', () => {
			render(ConfirmationModal, {
				props: { isOpen: true, loading: true }
			});

			const cancelButton = screen.getByText('Cancelar');
			expect(cancelButton).toBeDisabled();
		});

		it('should hide close button when loading', () => {
			render(ConfirmationModal, {
				props: { isOpen: true, loading: true }
			});

			expect(screen.queryByLabelText('Cerrar modal')).not.toBeInTheDocument();
		});

		it('should show loading spinner in confirm button when loading', () => {
			const { container } = render(ConfirmationModal, {
				props: { isOpen: true, loading: true }
			});

			const confirmButton = screen.getByText('Confirmar');
			const spinner = confirmButton.querySelector('.loading-spinner');
			expect(spinner).toBeInTheDocument();
		});

		it('should not dispatch cancel when backdrop is clicked during loading', async () => {
			const cancelHandler = vi.fn();
			render(ConfirmationModal, {
				props: { isOpen: true, loading: true, onCancelCallback: cancelHandler }
			});

			const backdrop = screen.getByRole('dialog');
			await fireEvent.click(backdrop);

			expect(cancelHandler).not.toHaveBeenCalled();
		});

		it('should not dispatch cancel when Escape is pressed during loading', async () => {
			const cancelHandler = vi.fn();
			render(ConfirmationModal, {
				props: { isOpen: true, loading: true, onCancelCallback: cancelHandler }
			});

			await fireEvent.keyDown(window, { key: 'Escape' });

			expect(cancelHandler).not.toHaveBeenCalled();
		});
	});

	describe('Keyboard Handling', () => {
		it('should dispatch cancel event when Escape key is pressed', async () => {
			const cancelHandler = vi.fn();
			render(ConfirmationModal, {
				props: { isOpen: true, loading: false, onCancelCallback: cancelHandler }
			});

			await fireEvent.keyDown(window, { key: 'Escape' });

			expect(cancelHandler).toHaveBeenCalledTimes(1);
		});

		it('should not dispatch cancel when other keys are pressed', async () => {
			const cancelHandler = vi.fn();
			render(ConfirmationModal, {
				props: { isOpen: true, onCancelCallback: cancelHandler }
			});

			await fireEvent.keyDown(window, { key: 'Enter' });
			await fireEvent.keyDown(window, { key: 'Space' });
			await fireEvent.keyDown(window, { key: 'Tab' });

			expect(cancelHandler).not.toHaveBeenCalled();
		});
	});

	describe('Backdrop Click', () => {
		it('should dispatch cancel event when backdrop is clicked', async () => {
			const cancelHandler = vi.fn();
			render(ConfirmationModal, {
				props: { isOpen: true, onCancelCallback: cancelHandler }
			});

			const backdrop = screen.getByRole('dialog');
			await fireEvent.click(backdrop);

			expect(cancelHandler).toHaveBeenCalledTimes(1);
		});

		it('should not dispatch cancel when clicking inside modal container', async () => {
			const cancelHandler = vi.fn();
			const { container } = render(ConfirmationModal, {
				props: { isOpen: true, onCancelCallback: cancelHandler }
			});

			const modalContainer = container.querySelector('.modal-container');
			await fireEvent.click(modalContainer!);

			expect(cancelHandler).not.toHaveBeenCalled();
		});
	});

	describe('Accessibility', () => {
		it('should have role="dialog"', () => {
			render(ConfirmationModal, { props: { isOpen: true } });

			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});

		it('should have aria-modal="true"', () => {
			render(ConfirmationModal, { props: { isOpen: true } });

			const dialog = screen.getByRole('dialog');
			expect(dialog).toHaveAttribute('aria-modal', 'true');
		});

		it('should have aria-labelledby pointing to title', () => {
			render(ConfirmationModal, { props: { isOpen: true } });

			const dialog = screen.getByRole('dialog');
			expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
		});

		it('should have aria-describedby pointing to message', () => {
			render(ConfirmationModal, { props: { isOpen: true } });

			const dialog = screen.getByRole('dialog');
			expect(dialog).toHaveAttribute('aria-describedby', 'modal-message');
		});

		it('should have id="modal-title" on title element', () => {
			render(ConfirmationModal, { props: { isOpen: true } });

			const title = document.querySelector('#modal-title');
			expect(title).toBeInTheDocument();
		});

		it('should have id="modal-message" on message element', () => {
			render(ConfirmationModal, { props: { isOpen: true } });

			const message = document.querySelector('#modal-message');
			expect(message).toBeInTheDocument();
		});

		it('should have aria-label on close button', () => {
			render(ConfirmationModal, { props: { isOpen: true } });

			const closeButton = screen.getByLabelText('Cerrar modal');
			expect(closeButton).toBeInTheDocument();
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty title gracefully', () => {
			render(ConfirmationModal, {
				props: { isOpen: true, title: '' }
			});

			const titleElement = document.querySelector('#modal-title');
			expect(titleElement?.textContent).toBe('');
		});

		it('should handle empty message gracefully', () => {
			render(ConfirmationModal, {
				props: { isOpen: true, message: '' }
			});

			const messageElement = document.querySelector('#modal-message');
			expect(messageElement?.textContent).toBe('');
		});

		it('should toggle visibility correctly', async () => {
			const { rerender } = render(ConfirmationModal, { props: { isOpen: true } });

			expect(screen.getByRole('dialog')).toBeInTheDocument();

			await rerender({ isOpen: false });

			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

			await rerender({ isOpen: true });

			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});

		it('should update type correctly', async () => {
			const { rerender, container } = render(ConfirmationModal, {
				props: { isOpen: true, type: 'warning' }
			});

			expect(container.querySelector('.icon-container.warning')).toBeInTheDocument();

			await rerender({ isOpen: true, type: 'danger' });

			expect(container.querySelector('.icon-container.danger')).toBeInTheDocument();
			expect(container.querySelector('.icon-container.warning')).not.toBeInTheDocument();
		});
	});
});
