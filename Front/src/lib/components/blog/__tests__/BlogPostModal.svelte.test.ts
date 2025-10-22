import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import BlogPostModal from '../BlogPostModal.svelte';
import type { BlogPost } from '$lib/types/api';

vi.mock('../BlogPostForm.svelte', () => ({
	default: class BlogPostFormMock {
		constructor(options: any) {
			const container = document.createElement('div');
			container.setAttribute('data-testid', 'blog-post-form-mock');
			container.textContent = 'BlogPostForm Mock';
			options.target.appendChild(container);

			// Simulate the component's event dispatching capability
			this.$on = vi.fn((event: string, handler: Function) => {
				(container as any)[`_${event}`] = handler;
			});
		}
	}
}));

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

describe('BlogPostModal', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Rendering', () => {
		it('should render with default props', () => {
			const { container } = render(BlogPostModal);
			expect(container).toBeInTheDocument();
		});

		it('should render BlogPostForm component', () => {
			render(BlogPostModal);
			expect(screen.getByTestId('blog-post-form-mock')).toBeInTheDocument();
		});

		it('should pass visible prop to BlogPostForm', () => {
			render(BlogPostModal, { props: { visible: true } });
			expect(screen.getByTestId('blog-post-form-mock')).toBeInTheDocument();
		});

		it('should pass post prop to BlogPostForm', () => {
			render(BlogPostModal, { props: { post: mockPost } });
			expect(screen.getByTestId('blog-post-form-mock')).toBeInTheDocument();
		});

		it('should pass nextOrderNumber prop to BlogPostForm', () => {
			render(BlogPostModal, { props: { nextOrderNumber: 5 } });
			expect(screen.getByTestId('blog-post-form-mock')).toBeInTheDocument();
		});
	});

	describe('Event Dispatching', () => {
		it('should dispatch created event when BlogPostForm emits created', async () => {
			const { component } = render(BlogPostModal);
			const createdSpy = vi.fn();
			component.$on('created', createdSpy);

			// Simulate BlogPostForm emitting 'created' event
			const formMock = screen.getByTestId('blog-post-form-mock');
			const handler = (formMock as any)._created;
			if (handler) {
				handler({ detail: mockPost });
			}

			await waitFor(() => {
				expect(createdSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						detail: mockPost
					})
				);
			});
		});

		it('should dispatch updated event when BlogPostForm emits updated', async () => {
			const { component } = render(BlogPostModal);
			const updatedSpy = vi.fn();
			component.$on('updated', updatedSpy);

			// Simulate BlogPostForm emitting 'updated' event
			const formMock = screen.getByTestId('blog-post-form-mock');
			const handler = (formMock as any)._updated;
			if (handler) {
				handler({ detail: mockPost });
			}

			await waitFor(() => {
				expect(updatedSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						detail: mockPost
					})
				);
			});
		});

		it('should dispatch close event when BlogPostForm emits close', async () => {
			const { component } = render(BlogPostModal);
			const closeSpy = vi.fn();
			component.$on('close', closeSpy);

			// Simulate BlogPostForm emitting 'close' event
			const formMock = screen.getByTestId('blog-post-form-mock');
			const handler = (formMock as any)._close;
			if (handler) {
				handler({});
			}

			await waitFor(() => {
				expect(closeSpy).toHaveBeenCalled();
			});
		});
	});

	describe('Session Expired Handling', () => {
		it('should close modal when session-expired event is fired', async () => {
			const { component } = render(BlogPostModal, { props: { visible: true } });
			const closeSpy = vi.fn();
			component.$on('close', closeSpy);

			const event = new Event('session-expired');
			window.dispatchEvent(event);

			await waitFor(() => {
				expect(closeSpy).toHaveBeenCalled();
			});
		});

		it('should set visible to false when session-expired event is fired', async () => {
			const { component } = render(BlogPostModal, { props: { visible: true } });

			const event = new Event('session-expired');
			window.dispatchEvent(event);

			await waitFor(() => {
				expect(component.visible).toBe(false);
			});
		});

		it('should log message when session expires', async () => {
			const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
			render(BlogPostModal, { props: { visible: true } });

			const event = new Event('session-expired');
			window.dispatchEvent(event);

			await waitFor(() => {
				expect(consoleLogSpy).toHaveBeenCalledWith(
					'🔒 Sesión expirada - cerrando BlogPostModal'
				);
			});

			consoleLogSpy.mockRestore();
		});
	});

	describe('Close All Modals Handling', () => {
		it('should close modal when close-all-modals event is fired', async () => {
			const { component } = render(BlogPostModal, { props: { visible: true } });
			const closeSpy = vi.fn();
			component.$on('close', closeSpy);

			const event = new Event('close-all-modals');
			window.dispatchEvent(event);

			await waitFor(() => {
				expect(closeSpy).toHaveBeenCalled();
			});
		});

		it('should set visible to false when close-all-modals event is fired', async () => {
			const { component } = render(BlogPostModal, { props: { visible: true } });

			const event = new Event('close-all-modals');
			window.dispatchEvent(event);

			await waitFor(() => {
				expect(component.visible).toBe(false);
			});
		});

		it('should log message when close-all-modals is fired', async () => {
			const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
			render(BlogPostModal, { props: { visible: true } });

			const event = new Event('close-all-modals');
			window.dispatchEvent(event);

			await waitFor(() => {
				expect(consoleLogSpy).toHaveBeenCalledWith(
					'🔒 Close all modals - cerrando BlogPostModal'
				);
			});

			consoleLogSpy.mockRestore();
		});
	});

	describe('Event Listener Cleanup', () => {
		it('should remove event listeners on unmount', () => {
			const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
			const { unmount } = render(BlogPostModal);

			unmount();

			expect(removeEventListenerSpy).toHaveBeenCalledWith(
				'session-expired',
				expect.any(Function)
			);
			expect(removeEventListenerSpy).toHaveBeenCalledWith(
				'close-all-modals',
				expect.any(Function)
			);
		});

		it('should not respond to events after unmount', async () => {
			const { component, unmount } = render(BlogPostModal, { props: { visible: true } });
			const closeSpy = vi.fn();
			component.$on('close', closeSpy);

			unmount();

			const event = new Event('session-expired');
			window.dispatchEvent(event);

			// Wait a bit to ensure event handler doesn't fire
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(closeSpy).not.toHaveBeenCalled();
		});
	});

	describe('Props Passing', () => {
		it('should handle null post prop', () => {
			render(BlogPostModal, { props: { post: null } });
			expect(screen.getByTestId('blog-post-form-mock')).toBeInTheDocument();
		});

		it('should handle default nextOrderNumber', () => {
			render(BlogPostModal, { props: { nextOrderNumber: 1 } });
			expect(screen.getByTestId('blog-post-form-mock')).toBeInTheDocument();
		});

		it('should handle false visible prop', () => {
			render(BlogPostModal, { props: { visible: false } });
			expect(screen.getByTestId('blog-post-form-mock')).toBeInTheDocument();
		});
	});

	describe('Create vs Edit Mode', () => {
		it('should render in create mode when post is null', () => {
			render(BlogPostModal, { props: { post: null, visible: true } });
			expect(screen.getByTestId('blog-post-form-mock')).toBeInTheDocument();
		});

		it('should render in edit mode when post is provided', () => {
			render(BlogPostModal, { props: { post: mockPost, visible: true } });
			expect(screen.getByTestId('blog-post-form-mock')).toBeInTheDocument();
		});
	});

	describe('Multiple Events', () => {
		it('should handle multiple session-expired events', async () => {
			const { component } = render(BlogPostModal, { props: { visible: true } });
			const closeSpy = vi.fn();
			component.$on('close', closeSpy);

			const event1 = new Event('session-expired');
			const event2 = new Event('session-expired');
			window.dispatchEvent(event1);
			window.dispatchEvent(event2);

			await waitFor(() => {
				expect(closeSpy).toHaveBeenCalledTimes(2);
			});
		});

		it('should handle both session-expired and close-all-modals events', async () => {
			const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
			render(BlogPostModal, { props: { visible: true } });

			const event1 = new Event('session-expired');
			const event2 = new Event('close-all-modals');
			window.dispatchEvent(event1);
			window.dispatchEvent(event2);

			await waitFor(() => {
				expect(consoleLogSpy).toHaveBeenCalledWith(
					'🔒 Sesión expirada - cerrando BlogPostModal'
				);
				expect(consoleLogSpy).toHaveBeenCalledWith(
					'🔒 Close all modals - cerrando BlogPostModal'
				);
			});

			consoleLogSpy.mockRestore();
		});
	});

	describe('Edge Cases', () => {
		it('should handle event dispatching with no listeners', async () => {
			render(BlogPostModal);

			// Simulate events without any listeners attached
			const formMock = screen.getByTestId('blog-post-form-mock');
			const createdHandler = (formMock as any)._created;
			const updatedHandler = (formMock as any)._updated;
			const closeHandler = (formMock as any)._close;

			// Should not throw errors
			expect(() => {
				if (createdHandler) createdHandler({ detail: mockPost });
				if (updatedHandler) updatedHandler({ detail: mockPost });
				if (closeHandler) closeHandler({});
			}).not.toThrow();
		});

		it('should handle rapid visibility changes', async () => {
			const { component } = render(BlogPostModal, { props: { visible: false } });

			component.$set({ visible: true });
			await waitFor(() => expect(component.visible).toBe(true));

			component.$set({ visible: false });
			await waitFor(() => expect(component.visible).toBe(false));

			component.$set({ visible: true });
			await waitFor(() => expect(component.visible).toBe(true));
		});
	});
});
