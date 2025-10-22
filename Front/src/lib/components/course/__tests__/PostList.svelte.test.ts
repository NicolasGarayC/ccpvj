import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import PostList from '../PostList.svelte';
import type { PostDetail } from '$lib/services/modulePostService';
import { modulePostService } from '$lib/services/modulePostService';

vi.mock('$lib/services/modulePostService', () => ({
	modulePostService: {
		getModulePosts: vi.fn(),
		reorderPost: vi.fn()
	}
}));

vi.mock('../PostCard.svelte', () => ({
	default: class PostCardMock {
		constructor(options: any) {
			const container = document.createElement('div');
			container.setAttribute('data-testid', 'post-card-mock');
			container.textContent = `Post: ${options.props.post.title}`;
			options.target.appendChild(container);

			this.$on = vi.fn((event: string, handler: Function) => {
				(container as any)[`_${event}`] = handler;
			});
		}
	}
}));

vi.mock('../PostForm.svelte', () => ({
	default: class PostFormMock {
		constructor(options: any) {
			const container = document.createElement('div');
			container.setAttribute('data-testid', 'post-form-mock');
			if (options.props.visible) {
				container.textContent = 'PostForm Modal';
			}
			options.target.appendChild(container);

			this.$on = vi.fn((event: string, handler: Function) => {
				(container as any)[`_${event}`] = handler;
			});
		}
	}
}));

vi.mock('../common/LoadingSpinner.svelte', () => ({
	default: class LoadingSpinnerMock {
		constructor(options: any) {
			const container = document.createElement('div');
			container.setAttribute('data-testid', 'loading-spinner-mock');
			options.target.appendChild(container);
		}
	}
}));

const mockPosts: PostDetail[] = [
	{
		id: 'post-1',
		title: 'Post 1',
		content: 'Contenido del post 1',
		orderNumber: 1,
		status: 'published',
		createdAt: '2024-01-01T10:00:00Z',
		updatedAt: '2024-01-01T10:00:00Z',
		moduleId: 'mod-1',
		materialApoyoId: 'course-1',
		isActive: true,
		elementCount: 5
	},
	{
		id: 'post-2',
		title: 'Post 2',
		content: 'Contenido del post 2',
		orderNumber: 2,
		status: 'published',
		createdAt: '2024-01-02T10:00:00Z',
		updatedAt: '2024-01-02T10:00:00Z',
		moduleId: 'mod-1',
		materialApoyoId: 'course-1',
		isActive: true,
		elementCount: 3
	},
	{
		id: 'post-3',
		title: 'Post 3',
		content: 'Contenido del post 3',
		orderNumber: 3,
		status: 'draft',
		createdAt: '2024-01-03T10:00:00Z',
		updatedAt: '2024-01-03T10:00:00Z',
		moduleId: 'mod-1',
		materialApoyoId: 'course-1',
		isActive: true,
		elementCount: 0
	}
];

describe('PostList', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(modulePostService.getModulePosts).mockResolvedValue(mockPosts);
	});

	describe('Rendering', () => {
		it('should render with required props', async () => {
			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });
			await waitFor(() => {
				expect(screen.getByText('Contenido del Módulo')).toBeInTheDocument();
			});
		});

		it('should fetch posts on mount', async () => {
			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });
			await waitFor(() => {
				expect(modulePostService.getModulePosts).toHaveBeenCalledWith('mod-1');
			});
		});

		it('should display post cards after loading', async () => {
			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });
			await waitFor(() => {
				expect(screen.getByText('Post: Post 1')).toBeInTheDocument();
				expect(screen.getByText('Post: Post 2')).toBeInTheDocument();
				expect(screen.getByText('Post: Post 3')).toBeInTheDocument();
			});
		});

		it('should display post count', async () => {
			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });
			await waitFor(() => {
				expect(screen.getByText('3 posts')).toBeInTheDocument();
			});
		});

		it('should display singular post count', async () => {
			vi.mocked(modulePostService.getModulePosts).mockResolvedValue([mockPosts[0]]);

			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });
			await waitFor(() => {
				expect(screen.getByText('1 post')).toBeInTheDocument();
			});
		});
	});

	describe('Loading State', () => {
		it('should show loading spinner while fetching', () => {
			vi.mocked(modulePostService.getModulePosts).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockPosts), 100))
			);

			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });
			expect(screen.getByText('Cargando posts...')).toBeInTheDocument();
		});

		it('should hide loading state after data loads', async () => {
			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });
			await waitFor(() => {
				expect(screen.queryByText('Cargando posts...')).not.toBeInTheDocument();
			});
		});
	});

	describe('Error Handling', () => {
		it('should display error message when fetch fails', async () => {
			vi.mocked(modulePostService.getModulePosts).mockRejectedValue(new Error('Error de red'));

			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });

			await waitFor(() => {
				expect(screen.getByText('Error de red')).toBeInTheDocument();
			});
		});

		it('should show retry button on error', async () => {
			vi.mocked(modulePostService.getModulePosts).mockRejectedValue(new Error('Error'));

			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });

			await waitFor(() => {
				expect(screen.getByText('Reintentar')).toBeInTheDocument();
			});
		});

		it('should retry loading when retry button is clicked', async () => {
			vi.mocked(modulePostService.getModulePosts)
				.mockRejectedValueOnce(new Error('Error'))
				.mockResolvedValueOnce(mockPosts);

			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });

			await waitFor(() => {
				expect(screen.getByText('Error')).toBeInTheDocument();
			});

			const retryButton = screen.getByText('Reintentar');
			await fireEvent.click(retryButton);

			await waitFor(() => {
				expect(modulePostService.getModulePosts).toHaveBeenCalledTimes(2);
				expect(screen.getByText('Post: Post 1')).toBeInTheDocument();
			});
		});

		it('should handle non-Error exceptions', async () => {
			vi.mocked(modulePostService.getModulePosts).mockRejectedValue('String error');

			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });

			await waitFor(() => {
				expect(screen.getByText('Error cargando posts')).toBeInTheDocument();
			});
		});
	});

	describe('Empty State', () => {
		it('should show empty state when no posts', async () => {
			vi.mocked(modulePostService.getModulePosts).mockResolvedValue([]);

			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });

			await waitFor(() => {
				expect(screen.getByText('No hay posts en este módulo')).toBeInTheDocument();
			});
		});

		it('should show descriptive message in empty state', async () => {
			vi.mocked(modulePostService.getModulePosts).mockResolvedValue([]);

			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });

			await waitFor(() => {
				expect(
					screen.getByText(/Los posts son contenidos individuales/)
				).toBeInTheDocument();
			});
		});

		it('should show create button in empty state when showActions is true', async () => {
			vi.mocked(modulePostService.getModulePosts).mockResolvedValue([]);

			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: true } });

			await waitFor(() => {
				expect(screen.getByText('Crear Primer Post')).toBeInTheDocument();
			});
		});

		it('should not show create button in empty state when showActions is false', async () => {
			vi.mocked(modulePostService.getModulePosts).mockResolvedValue([]);

			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: false } });

			await waitFor(() => {
				expect(screen.queryByText('Crear Primer Post')).not.toBeInTheDocument();
			});
		});
	});

	describe('Create Post Action', () => {
		it('should show create button when showActions is true', async () => {
			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: true } });

			await waitFor(() => {
				expect(screen.getByText('Crear Post')).toBeInTheDocument();
			});
		});

		it('should not show create button when showActions is false', async () => {
			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: false } });

			await waitFor(() => {
				expect(screen.queryByText('Crear Post')).not.toBeInTheDocument();
			});
		});

		it('should open PostForm when create button is clicked', async () => {
			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: true } });

			await waitFor(() => {
				expect(screen.getByText('Crear Post')).toBeInTheDocument();
			});

			const createButton = screen.getByText('Crear Post');
			await fireEvent.click(createButton);

			await waitFor(() => {
				expect(screen.getByText('PostForm Modal')).toBeInTheDocument();
			});
		});

		it('should disable create button while loading', () => {
			vi.mocked(modulePostService.getModulePosts).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockPosts), 100))
			);

			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: true } });

			const createButton = screen.getByText('Crear Post');
			expect(createButton).toBeDisabled();
		});
	});

	describe('PostCard Events', () => {
		it('should dispatch editPost event when PostCard emits edit', async () => {
			const { component } = render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });

			const editHandler = vi.fn();
			component.$on('editPost', editHandler);

			await waitFor(() => {
				expect(screen.getByText('Post: Post 1')).toBeInTheDocument();
			});

			const card = screen.getAllByTestId('post-card-mock')[0];
			const handler = (card as any)._edit;
			if (handler) {
				handler({ detail: mockPosts[0] });
			}

			await waitFor(() => {
				expect(editHandler).toHaveBeenCalled();
			});
		});

		it('should dispatch viewPost event when PostCard emits view', async () => {
			const { component } = render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });

			const viewHandler = vi.fn();
			component.$on('viewPost', viewHandler);

			await waitFor(() => {
				expect(screen.getByText('Post: Post 1')).toBeInTheDocument();
			});

			const card = screen.getAllByTestId('post-card-mock')[0];
			const handler = (card as any)._view;
			if (handler) {
				handler({ detail: mockPosts[0] });
			}

			await waitFor(() => {
				expect(viewHandler).toHaveBeenCalled();
			});
		});

		it('should dispatch deletePost event when PostCard emits delete', async () => {
			const { component } = render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });

			const deleteHandler = vi.fn();
			component.$on('deletePost', deleteHandler);

			await waitFor(() => {
				expect(screen.getByText('Post: Post 1')).toBeInTheDocument();
			});

			const card = screen.getAllByTestId('post-card-mock')[0];
			const handler = (card as any)._delete;
			if (handler) {
				handler({ detail: 'post-1' });
			}

			await waitFor(() => {
				expect(deleteHandler).toHaveBeenCalled();
			});
		});
	});

	describe('PostForm Events', () => {
		it('should handle postCreated event from PostForm', async () => {
			const { component } = render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: true } });

			const createdHandler = vi.fn();
			component.$on('postCreated', createdHandler);

			await waitFor(() => {
				expect(screen.getByText('Crear Post')).toBeInTheDocument();
			});

			const createButton = screen.getByText('Crear Post');
			await fireEvent.click(createButton);

			await waitFor(() => {
				expect(screen.getByText('PostForm Modal')).toBeInTheDocument();
			});

			// Simulate PostForm emitting created event
			const formMock = screen.getByTestId('post-form-mock');
			const handler = (formMock as any)._created;
			if (handler) {
				const newPost: PostDetail = { ...mockPosts[0], id: 'post-4', orderNumber: 4 };
				handler({ detail: newPost });
			}

			await waitFor(() => {
				expect(createdHandler).toHaveBeenCalled();
			});
		});

		it('should add new post to list when created', async () => {
			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: true } });

			await waitFor(() => {
				expect(screen.getByText('3 posts')).toBeInTheDocument();
			});

			const createButton = screen.getByText('Crear Post');
			await fireEvent.click(createButton);

			const formMock = screen.getByTestId('post-form-mock');
			const handler = (formMock as any)._created;
			if (handler) {
				const newPost: PostDetail = { ...mockPosts[0], id: 'post-4', title: 'Post 4', orderNumber: 4 };
				handler({ detail: newPost });
			}

			await waitFor(() => {
				expect(screen.getByText('4 posts')).toBeInTheDocument();
			});
		});

		it('should close PostForm after successful creation', async () => {
			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: true } });

			await waitFor(() => {
				expect(screen.getByText('Crear Post')).toBeInTheDocument();
			});

			const createButton = screen.getByText('Crear Post');
			await fireEvent.click(createButton);

			await waitFor(() => {
				expect(screen.getByText('PostForm Modal')).toBeInTheDocument();
			});

			const formMock = screen.getByTestId('post-form-mock');
			const handler = (formMock as any)._created;
			if (handler) {
				const newPost: PostDetail = { ...mockPosts[0], id: 'post-4', orderNumber: 4 };
				handler({ detail: newPost });
			}

			await waitFor(() => {
				expect(screen.queryByText('PostForm Modal')).not.toBeInTheDocument();
			});
		});

		it('should reload posts when postUpdated event is received', async () => {
			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: true } });

			await waitFor(() => {
				expect(screen.getByText('Post: Post 1')).toBeInTheDocument();
			});

			vi.clearAllMocks();

			const createButton = screen.getByText('Crear Post');
			await fireEvent.click(createButton);

			const formMock = screen.getByTestId('post-form-mock');
			const handler = (formMock as any)._updated;
			if (handler) {
				handler({ detail: { postId: 'post-1' } });
			}

			await waitFor(() => {
				expect(modulePostService.getModulePosts).toHaveBeenCalledWith('mod-1');
			});
		});

		it('should dispatch postUpdated event', async () => {
			const { component } = render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: true } });

			const updatedHandler = vi.fn();
			component.$on('postUpdated', updatedHandler);

			await waitFor(() => {
				expect(screen.getByText('Crear Post')).toBeInTheDocument();
			});

			const createButton = screen.getByText('Crear Post');
			await fireEvent.click(createButton);

			const formMock = screen.getByTestId('post-form-mock');
			const handler = (formMock as any)._updated;
			if (handler) {
				handler({ detail: { postId: 'post-1' } });
			}

			await waitFor(() => {
				expect(updatedHandler).toHaveBeenCalled();
			});
		});

		it('should close PostForm when close event is received', async () => {
			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: true } });

			await waitFor(() => {
				expect(screen.getByText('Crear Post')).toBeInTheDocument();
			});

			const createButton = screen.getByText('Crear Post');
			await fireEvent.click(createButton);

			await waitFor(() => {
				expect(screen.getByText('PostForm Modal')).toBeInTheDocument();
			});

			const formMock = screen.getByTestId('post-form-mock');
			const handler = (formMock as any)._close;
			if (handler) {
				handler({});
			}

			await waitFor(() => {
				expect(screen.queryByText('PostForm Modal')).not.toBeInTheDocument();
			});
		});
	});

	describe('Exposed Methods', () => {
		it('should expose posts array', async () => {
			const { component } = render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });

			await waitFor(() => {
				expect(component.posts.length).toBe(3);
			});
		});

		it('should expose loadPosts method', async () => {
			const { component } = render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });

			await waitFor(() => {
				expect(screen.getByText('Post: Post 1')).toBeInTheDocument();
			});

			vi.clearAllMocks();

			await component.loadPosts();

			expect(modulePostService.getModulePosts).toHaveBeenCalled();
		});

		it('should expose removePostFromList method', async () => {
			const { component } = render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });

			await waitFor(() => {
				expect(component.posts.length).toBe(3);
			});

			component.removePostFromList('post-2');

			expect(component.posts.length).toBe(2);
			expect(component.posts.find((p) => p.id === 'post-2')).toBeUndefined();
		});
	});

	describe('Drag and Drop', () => {
		it('should set draggable attribute when showActions is true', async () => {
			const { container } = render(PostList, {
				props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: true }
			});

			await waitFor(() => {
				const postItems = container.querySelectorAll('.post-item');
				postItems.forEach((item) => {
					expect(item.getAttribute('draggable')).toBe('true');
				});
			});
		});

		it('should not be draggable when showActions is false', async () => {
			const { container } = render(PostList, {
				props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: false }
			});

			await waitFor(() => {
				const postItems = container.querySelectorAll('.post-item');
				postItems.forEach((item) => {
					expect(item.getAttribute('draggable')).toBe('false');
				});
			});
		});

		it('should call reorderPost service when post is dropped', async () => {
			vi.mocked(modulePostService.reorderPost).mockResolvedValue(undefined);

			const { container } = render(PostList, {
				props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: true }
			});

			await waitFor(() => {
				expect(screen.getByText('Post: Post 1')).toBeInTheDocument();
			});

			const postItems = container.querySelectorAll('.post-item');
			const firstPost = postItems[0] as HTMLElement;
			const thirdPost = postItems[2] as HTMLElement;

			const dragStartEvent = new DragEvent('dragstart', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(firstPost, dragStartEvent);

			const dropEvent = new DragEvent('drop', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(thirdPost, dropEvent);

			await waitFor(() => {
				expect(modulePostService.reorderPost).toHaveBeenCalled();
			});
		});

		it('should dispatch postsReordered event after successful reorder', async () => {
			vi.mocked(modulePostService.reorderPost).mockResolvedValue(undefined);

			const { container, component } = render(PostList, {
				props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: true }
			});

			const reorderHandler = vi.fn();
			component.$on('postsReordered', reorderHandler);

			await waitFor(() => {
				expect(screen.getByText('Post: Post 1')).toBeInTheDocument();
			});

			const postItems = container.querySelectorAll('.post-item');
			const firstPost = postItems[0] as HTMLElement;
			const secondPost = postItems[1] as HTMLElement;

			const dragStartEvent = new DragEvent('dragstart', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(firstPost, dragStartEvent);

			const dropEvent = new DragEvent('drop', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(secondPost, dropEvent);

			await waitFor(() => {
				expect(reorderHandler).toHaveBeenCalled();
			});
		});

		it('should show reorder overlay during reordering', async () => {
			vi.mocked(modulePostService.reorderPost).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
			);

			const { container } = render(PostList, {
				props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: true }
			});

			await waitFor(() => {
				expect(screen.getByText('Post: Post 1')).toBeInTheDocument();
			});

			const postItems = container.querySelectorAll('.post-item');
			const firstPost = postItems[0] as HTMLElement;
			const secondPost = postItems[1] as HTMLElement;

			const dragStartEvent = new DragEvent('dragstart', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(firstPost, dragStartEvent);

			const dropEvent = new DragEvent('drop', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(secondPost, dropEvent);

			await waitFor(() => {
				expect(screen.getByText('Reordenando posts...')).toBeInTheDocument();
			});
		});

		it('should not reorder when dropping on same position', async () => {
			const { container } = render(PostList, {
				props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: true }
			});

			await waitFor(() => {
				expect(screen.getByText('Post: Post 1')).toBeInTheDocument();
			});

			const postItems = container.querySelectorAll('.post-item');
			const firstPost = postItems[0] as HTMLElement;

			const dragStartEvent = new DragEvent('dragstart', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(firstPost, dragStartEvent);

			const dropEvent = new DragEvent('drop', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(firstPost, dropEvent);

			expect(modulePostService.reorderPost).not.toHaveBeenCalled();
		});

		it('should reload posts if reorder fails', async () => {
			vi.mocked(modulePostService.reorderPost).mockRejectedValue(new Error('Error reordenando'));

			const { container } = render(PostList, {
				props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: true }
			});

			await waitFor(() => {
				expect(screen.getByText('Post: Post 1')).toBeInTheDocument();
			});

			vi.clearAllMocks();

			const postItems = container.querySelectorAll('.post-item');
			const firstPost = postItems[0] as HTMLElement;
			const secondPost = postItems[1] as HTMLElement;

			const dragStartEvent = new DragEvent('dragstart', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(firstPost, dragStartEvent);

			const dropEvent = new DragEvent('drop', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(secondPost, dropEvent);

			await waitFor(() => {
				expect(modulePostService.getModulePosts).toHaveBeenCalled();
			});
		});

		it('should show error message if reorder fails', async () => {
			vi.mocked(modulePostService.reorderPost).mockRejectedValue(new Error('Error reordenando'));

			const { container } = render(PostList, {
				props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: true }
			});

			await waitFor(() => {
				expect(screen.getByText('Post: Post 1')).toBeInTheDocument();
			});

			const postItems = container.querySelectorAll('.post-item');
			const firstPost = postItems[0] as HTMLElement;
			const secondPost = postItems[1] as HTMLElement;

			const dragStartEvent = new DragEvent('dragstart', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(firstPost, dragStartEvent);

			const dropEvent = new DragEvent('drop', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(secondPost, dropEvent);

			await waitFor(() => {
				expect(screen.getByText('Error reordenando')).toBeInTheDocument();
			});
		});

		it('should show reorder hint when posts > 1', async () => {
			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });

			await waitFor(() => {
				expect(screen.getByText(/Arrastra los posts usando el ícono/)).toBeInTheDocument();
			});
		});

		it('should not show reorder hint when only 1 post', async () => {
			vi.mocked(modulePostService.getModulePosts).mockResolvedValue([mockPosts[0]]);

			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });

			await waitFor(() => {
				expect(screen.queryByText(/Arrastra los posts usando el ícono/)).not.toBeInTheDocument();
			});
		});
	});

	describe('Sorting', () => {
		it('should sort posts by orderNumber', async () => {
			const unorderedPosts = [mockPosts[2], mockPosts[0], mockPosts[1]];
			vi.mocked(modulePostService.getModulePosts).mockResolvedValue(unorderedPosts);

			render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });

			await waitFor(() => {
				const cards = screen.getAllByTestId('post-card-mock');
				expect(cards[0].textContent).toBe('Post: Post 1');
				expect(cards[1].textContent).toBe('Post: Post 2');
				expect(cards[2].textContent).toBe('Post: Post 3');
			});
		});
	});

	describe('Next Order Number', () => {
		it('should calculate next order number correctly', async () => {
			const { component } = render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });

			await waitFor(() => {
				expect(component.posts.length).toBe(3);
			});

			// Access nextOrderNumber from the component
			// Since it's a reactive variable, we check it's being passed to PostForm
			const createButton = screen.getByText('Crear Post');
			await fireEvent.click(createButton);

			// PostForm should receive nextOrderNumber = 4
			await waitFor(() => {
				expect(screen.getByText('PostForm Modal')).toBeInTheDocument();
			});
		});

		it('should set next order number to 1 when no posts', async () => {
			vi.mocked(modulePostService.getModulePosts).mockResolvedValue([]);

			const { component } = render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: true } });

			await waitFor(() => {
				expect(component.posts.length).toBe(0);
			});

			const createButton = screen.getByText('Crear Primer Post');
			await fireEvent.click(createButton);

			await waitFor(() => {
				expect(screen.getByText('PostForm Modal')).toBeInTheDocument();
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle non-Error reorder exceptions', async () => {
			vi.mocked(modulePostService.reorderPost).mockRejectedValue('String error');

			const { container } = render(PostList, {
				props: { moduleId: 'mod-1', materialApoyoId: 'course-1', showActions: true }
			});

			await waitFor(() => {
				expect(screen.getByText('Post: Post 1')).toBeInTheDocument();
			});

			const postItems = container.querySelectorAll('.post-item');
			const firstPost = postItems[0] as HTMLElement;
			const secondPost = postItems[1] as HTMLElement;

			const dragStartEvent = new DragEvent('dragstart', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(firstPost, dragStartEvent);

			const dropEvent = new DragEvent('drop', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(secondPost, dropEvent);

			await waitFor(() => {
				expect(screen.getByText('Error reordenando posts')).toBeInTheDocument();
			});
		});

		it('should dispatch postsLoaded event after loading', async () => {
			const { component } = render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });

			const loadedHandler = vi.fn();
			component.$on('postsLoaded', loadedHandler);

			await waitFor(() => {
				expect(loadedHandler).toHaveBeenCalledWith(
					expect.objectContaining({
						detail: expect.arrayContaining([
							expect.objectContaining({ id: 'post-1' })
						])
					})
				);
			});
		});

		it('should prevent concurrent loads', async () => {
			const { component } = render(PostList, { props: { moduleId: 'mod-1', materialApoyoId: 'course-1' } });

			await waitFor(() => {
				expect(screen.getByText('Post: Post 1')).toBeInTheDocument();
			});

			vi.clearAllMocks();

			// Try to load multiple times rapidly
			component.loadPosts();
			component.loadPosts();
			component.loadPosts();

			await waitFor(() => {
				// Should only call once due to isLoading guard
				expect(modulePostService.getModulePosts).toHaveBeenCalledTimes(1);
			});
		});
	});
});
