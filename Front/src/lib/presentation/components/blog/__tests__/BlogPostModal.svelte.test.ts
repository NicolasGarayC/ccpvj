import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import BlogPostModal from '../BlogPostModal.svelte';
import BlogPostFormStub from './BlogPostFormStub.svelte';
import type { BlogPost } from '$lib/types/api';

type ModalCallbacks = {
	onCreated?: (detail: unknown) => void;
	onUpdated?: (detail: unknown) => void;
	onClose?: () => void;
};

type RenderOptions = {
	visible?: boolean;
	post?: BlogPost | null;
	nextOrderNumber?: number;
} & ModalCallbacks;

const mockPost: BlogPost = {
	id: 'post-1',
	title: 'Test Post',
	slug: 'test-post',
	excerpt: 'Test excerpt',
	content: 'Test content',
	category: 'Test Category',
	tags: ['tag1', 'tag2'],
	featuredImage: null,
	status: 'published',
	publishedAt: '2024-01-15T10:00:00Z',
	isActive: true,
	createdAt: '2024-01-01T10:00:00Z',
	updatedAt: '2024-01-10T10:00:00Z',
	relatedEventIds: []
};

const renderModal = (options: RenderOptions = {}) =>
	render(BlogPostModal, {
		props: {
			visible: options.visible ?? false,
			post: options.post ?? null,
			nextOrderNumber: options.nextOrderNumber ?? 1,
			formComponent: BlogPostFormStub,
			onCreated: options.onCreated,
			onUpdated: options.onUpdated,
			onClose: options.onClose
		}
	});

const getFormStub = () => screen.getByTestId('blog-post-form-mock');

describe('BlogPostModal', () => {
	describe('Rendering', () => {
		it('renders BlogPostForm via injected component', () => {
			renderModal({ visible: true });
			expect(getFormStub()).toBeInTheDocument();
		});

		it('passes visible prop to the form component', () => {
			renderModal({ visible: true });
			expect(getFormStub().dataset.visible).toBe('true');
		});

		it('passes post prop to the form component', () => {
			renderModal({ visible: true, post: mockPost });
			expect(getFormStub().dataset.hasPost).toBe('true');
		});

		it('passes nextOrderNumber to the form component', () => {
			renderModal({ visible: true, nextOrderNumber: 7 });
			expect(getFormStub().dataset.nextOrder).toBe('7');
		});
	});

	describe('Event Dispatching', () => {
		it('invokes onCreated callback when form emits created', async () => {
			const onCreated = vi.fn();
			renderModal({ visible: true, onCreated });

			await fireEvent.click(screen.getByTestId('emit-created'));

			await waitFor(() => {
				expect(onCreated).toHaveBeenCalledWith(
					expect.objectContaining({ id: 'new-post', title: 'Nuevo Artículo' })
				);
			});
		});

		it('invokes onUpdated callback when form emits updated', async () => {
			const onUpdated = vi.fn();
			renderModal({ visible: true, post: mockPost, onUpdated });

			await fireEvent.click(screen.getByTestId('emit-updated'));

			await waitFor(() => {
				expect(onUpdated).toHaveBeenCalledWith(
					expect.objectContaining({ id: 'post-1', title: 'Test Post' })
				);
			});
		});

		it('invokes onClose callback when form emits close', async () => {
			const onClose = vi.fn();
			renderModal({ visible: true, onClose });

			await fireEvent.click(screen.getByTestId('emit-close'));

			await waitFor(() => {
				expect(onClose).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('Global Events', () => {
		it('handles session-expired event by closing modal', async () => {
            const onClose = vi.fn();
            renderModal({ visible: true, onClose });

            await waitFor(() => {
                expect(getFormStub()).toBeInTheDocument();
            });
            window.dispatchEvent(new Event('session-expired'));

            await waitFor(() => {
                expect(onClose).toHaveBeenCalledTimes(1);
                expect(getFormStub().dataset.visible).toBe('false');
            });
		});

		it('handles close-all-modals event by closing modal', async () => {
            const onClose = vi.fn();
            renderModal({ visible: true, onClose });

            await waitFor(() => {
                expect(getFormStub()).toBeInTheDocument();
            });
            window.dispatchEvent(new Event('close-all-modals'));

            await waitFor(() => {
                expect(onClose).toHaveBeenCalledTimes(1);
                expect(getFormStub().dataset.visible).toBe('false');
            });
		});

		it('logs informative messages when events fire', async () => {
			const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
			renderModal({ visible: true });

            window.dispatchEvent(new Event('session-expired'));
            window.dispatchEvent(new Event('close-all-modals'));

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('🔒 Sesión expirada - cerrando BlogPostModal');
                expect(consoleSpy).toHaveBeenCalledWith('🔒 Close all modals - cerrando BlogPostModal');
            });
			consoleSpy.mockRestore();
		});
	});

	describe('Listener Management', () => {
		it('removes global listeners on unmount', () => {
			const spy = vi.spyOn(window, 'removeEventListener');
			const { unmount } = renderModal();

			unmount();

			expect(spy).toHaveBeenCalledWith('session-expired', expect.any(Function));
			expect(spy).toHaveBeenCalledWith('close-all-modals', expect.any(Function));
		});

		it('does not respond to events after unmount', async () => {
			const onClose = vi.fn();
			const { unmount } = renderModal({ visible: true, onClose });

			unmount();
            window.dispatchEvent(new Event('session-expired'));

            await waitFor(() => {
                expect(onClose).not.toHaveBeenCalled();
            });
		});
	});

	describe('Props Handling', () => {
		it('handles null post gracefully', () => {
			renderModal({ visible: true, post: null });
			expect(getFormStub().dataset.hasPost).toBe('false');
		});

		it('has a default order number of 1', () => {
			renderModal({ visible: true });
			expect(getFormStub().dataset.nextOrder).toBe('1');
		});
	});

	describe('Additional Scenarios', () => {
		it('can toggle visibility rapidly without crashing', async () => {
			const { rerender } = renderModal({ visible: false });

			await rerender({ visible: true, post: null, nextOrderNumber: 1, formComponent: BlogPostFormStub });
			await waitFor(() => expect(getFormStub().dataset.visible).toBe('true'));

			await rerender({ visible: false, post: null, nextOrderNumber: 1, formComponent: BlogPostFormStub });
			await waitFor(() => expect(getFormStub().dataset.visible).toBe('false'));

			await rerender({ visible: true, post: null, nextOrderNumber: 1, formComponent: BlogPostFormStub });
			await waitFor(() => expect(getFormStub().dataset.visible).toBe('true'));
		});

		it('handles multiple session-expired events consecutively', async () => {
			const onClose = vi.fn();
			renderModal({ visible: true, onClose });

            await waitFor(() => {
                expect(getFormStub()).toBeInTheDocument();
            });

            window.dispatchEvent(new Event('session-expired'));
            window.dispatchEvent(new Event('session-expired'));

            await waitFor(() => {
                expect(onClose).toHaveBeenCalledTimes(2);
            });
		});

		it('handles session-expired and close-all-modals events together', async () => {
			const onClose = vi.fn();
			renderModal({ visible: true, onClose });

            await waitFor(() => {
                expect(getFormStub()).toBeInTheDocument();
            });

            window.dispatchEvent(new Event('session-expired'));
            window.dispatchEvent(new Event('close-all-modals'));

            await waitFor(() => {
                expect(onClose).toHaveBeenCalledTimes(2);
            });
		});

		it('does not throw when the form emits events without listeners', async () => {
			renderModal({ visible: true });

			await expect(fireEvent.click(screen.getByTestId('emit-created'))).resolves.not.toThrow();
			await expect(fireEvent.click(screen.getByTestId('emit-updated'))).resolves.not.toThrow();
			await expect(fireEvent.click(screen.getByTestId('emit-close'))).resolves.not.toThrow();
		});
	});
});
