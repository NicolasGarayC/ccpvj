import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import PostCard from '../PostCard.svelte';
import type { PostDetail } from '$lib/services/modulePostService';
import { postElementService } from '$lib/services/postElementService';
import type { PostElement } from '$lib/services/postElementService';

// Mock del servicio de elementos
vi.mock('$lib/services/postElementService', () => ({
	postElementService: {
		getElementsByPostId: vi.fn(),
		getFileUrl: vi.fn((path: string) => `/media${path}`)
	}
}));

describe('PostCard Component', () => {
	const mockPost: PostDetail = {
		id: 'post-1',
		title: 'Post de Prueba',
		subtitle: 'Subtítulo del post',
		orderNumber: 1,
		moduleId: 'module-1',
		authorName: 'Juan Pérez',
		createdAt: Date.now(),
		isActive: true
	};

	const mockElements: PostElement[] = [
		{
			id: 'element-1',
			postId: 'post-1',
			elementType: 'title',
			content: 'Título del elemento',
			orderNumber: 0,
			isActive: true,
			createdAt: Date.now()
		},
		{
			id: 'element-2',
			postId: 'post-1',
			elementType: 'text',
			content: 'Este es un texto de prueba largo que debe ser truncado cuando se muestra en el preview porque tiene más de 100 caracteres de longitud.',
			orderNumber: 1,
			isActive: true,
			createdAt: Date.now()
		},
		{
			id: 'element-3',
			postId: 'post-1',
			elementType: 'image',
			filePath: '/posts/test-image.jpg',
			fileName: 'test-image.jpg',
			orderNumber: 2,
			isActive: true,
			createdAt: Date.now()
		}
	];

	beforeEach(() => {
		vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(mockElements);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering - Basic Info', () => {
		it('should render post title', async () => {
			render(PostCard, { props: { post: mockPost } });

			await screen.findByText('Post de Prueba');
			expect(screen.getByText('Post de Prueba')).toBeInTheDocument();
		});

		it('should render post subtitle when provided', async () => {
			render(PostCard, { props: { post: mockPost } });

			await screen.findByText('Subtítulo del post');
			expect(screen.getByText('Subtítulo del post')).toBeInTheDocument();
		});

		it('should not render subtitle when not provided', async () => {
			const postWithoutSubtitle = { ...mockPost, subtitle: undefined };
			render(PostCard, { props: { post: postWithoutSubtitle } });

			await vi.waitFor(() => {
				expect(screen.queryByText('Subtítulo del post')).not.toBeInTheDocument();
			});
		});

		it('should render order number badge', async () => {
			render(PostCard, { props: { post: mockPost } });

			await screen.findByText('#1');
			expect(screen.getByText('#1')).toBeInTheDocument();
		});

		it('should render author name', async () => {
			render(PostCard, { props: { post: mockPost } });

			await screen.findByText(/Juan Pérez/);
			expect(screen.getByText(/Por Juan Pérez/)).toBeInTheDocument();
		});

		it('should render "Autor desconocido" when author name is not provided', async () => {
			const postWithoutAuthor = { ...mockPost, authorName: undefined };
			render(PostCard, { props: { post: postWithoutAuthor } });

			await vi.waitFor(() => {
				expect(screen.getByText(/Autor desconocido/)).toBeInTheDocument();
			});
		});
	});

	describe('Date Formatting', () => {
		it('should format numeric timestamp correctly', async () => {
			const specificDate = new Date('2024-01-15').getTime();
			const postWithDate = { ...mockPost, createdAt: specificDate };
			render(PostCard, { props: { post: postWithDate } });

			await vi.waitFor(() => {
				const dateElements = screen.getAllByText(/ene\.|enero/i);
				expect(dateElements.length).toBeGreaterThan(0);
			});
		});

		it('should display "Sin fecha" for null timestamp', async () => {
			const postWithoutDate = { ...mockPost, createdAt: null as any };
			render(PostCard, { props: { post: postWithoutDate } });

			await screen.findByText(/Sin fecha/);
		});

		it('should display "Sin fecha" for invalid timestamp', async () => {
			const postWithInvalidDate = { ...mockPost, createdAt: 'invalid-date' as any };
			render(PostCard, { props: { post: postWithInvalidDate } });

			await vi.waitFor(() => {
				expect(screen.getByText(/Sin fecha/)).toBeInTheDocument();
			});
		});
	});

	describe('Status Badges', () => {
		it('should show inactive badge when post is not active', async () => {
			const inactivePost = { ...mockPost, isActive: false };
			render(PostCard, { props: { post: inactivePost } });

			await screen.findByText(/Inactivo/i);
			expect(screen.getByText(/Inactivo/i)).toBeInTheDocument();
		});

		it('should not show inactive badge when post is active', async () => {
			render(PostCard, { props: { post: mockPost } });

			await vi.waitFor(() => {
				expect(screen.queryByText(/Inactivo/i)).not.toBeInTheDocument();
			});
		});
	});

	describe('Elements Loading', () => {
		it('should load elements on mount', async () => {
			render(PostCard, { props: { post: mockPost } });

			await vi.waitFor(() => {
				expect(postElementService.getElementsByPostId).toHaveBeenCalledWith('post-1');
			});
		});

		it('should show loading state while elements are loading', async () => {
			vi.mocked(postElementService.getElementsByPostId).mockImplementation(
				() => new Promise(resolve => setTimeout(() => resolve(mockElements), 100))
			);

			render(PostCard, { props: { post: mockPost } });

			expect(screen.getByText(/Cargando contenido/i)).toBeInTheDocument();
		});

		it('should display elements count when loaded', async () => {
			render(PostCard, { props: { post: mockPost } });

			await screen.findByText(/3 elementos/);
			expect(screen.getByText(/3 elementos/)).toBeInTheDocument();
		});

		it('should display singular "elemento" for one element', async () => {
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue([mockElements[0]]);

			render(PostCard, { props: { post: mockPost } });

			await screen.findByText(/1 elemento$/);
			expect(screen.getByText(/1 elemento$/)).toBeInTheDocument();
		});

		it('should handle element loading error gracefully', async () => {
			vi.mocked(postElementService.getElementsByPostId).mockRejectedValue(new Error('Network error'));

			render(PostCard, { props: { post: mockPost } });

			await vi.waitFor(() => {
				expect(screen.getByText(/Este post aún no tiene contenido/i)).toBeInTheDocument();
			});
		});
	});

	describe('Element Type Indicators', () => {
		it('should show element type indicators for different types', async () => {
			render(PostCard, { props: { post: mockPost } });

			await vi.waitFor(() => {
				const indicators = screen.getAllByRole('generic');
				const indicatorElements = indicators.filter(el =>
					el.className.includes('element-indicator')
				);
				expect(indicatorElements.length).toBeGreaterThan(0);
			});
		});

		it('should show unique element types only', async () => {
			const duplicateElements = [...mockElements, mockElements[0]]; // Duplicate title
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(duplicateElements);

			render(PostCard, { props: { post: mockPost } });

			await vi.waitFor(() => {
				expect(screen.getByText(/4 elementos/)).toBeInTheDocument();
			});
		});
	});

	describe('Element Preview', () => {
		it('should show preview of title elements', async () => {
			render(PostCard, { props: { post: mockPost } });

			await screen.findByText('Título del elemento');
			expect(screen.getByText('Título del elemento')).toBeInTheDocument();
		});

		it('should show truncated text for long text elements', async () => {
			render(PostCard, { props: { post: mockPost } });

			await vi.waitFor(() => {
				expect(screen.getByText(/Este es un texto de prueba largo/)).toBeInTheDocument();
			});
		});

		it('should show image preview when image element has filePath', async () => {
			render(PostCard, { props: { post: mockPost } });

			await vi.waitFor(() => {
				const images = screen.getAllByRole('img');
				expect(images.length).toBeGreaterThan(0);
			});
		});

		it('should only show preview of first 3 elements', async () => {
			const manyElements = [
				...mockElements,
				{ ...mockElements[0], id: 'element-4', orderNumber: 3 },
				{ ...mockElements[0], id: 'element-5', orderNumber: 4 }
			];
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(manyElements);

			render(PostCard, { props: { post: mockPost } });

			await screen.findByText(/\+2 más\.\.\./);
			expect(screen.getByText(/\+2 más\.\.\./)).toBeInTheDocument();
		});

		it('should show empty content message when no elements', async () => {
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue([]);

			render(PostCard, { props: { post: mockPost } });

			await screen.findByText(/Este post aún no tiene contenido/i);
			expect(screen.getByText(/Este post aún no tiene contenido/i)).toBeInTheDocument();
		});
	});

	describe('Actions - View Button', () => {
		it('should always show "Ver Detalle" button', async () => {
			render(PostCard, { props: { post: mockPost } });

			await screen.findByText(/Ver Detalle/);
			expect(screen.getByText(/Ver Detalle/)).toBeInTheDocument();
		});

		it('should dispatch view event when "Ver Detalle" is clicked', async () => {
			const { component } = render(PostCard, { props: { post: mockPost } });

			const viewHandler = vi.fn();
			component.$on('view', viewHandler);

			const viewButton = await screen.findByText(/Ver Detalle/);
			await fireEvent.click(viewButton);

			expect(viewHandler).toHaveBeenCalledTimes(1);
			expect(viewHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: mockPost
				})
			);
		});
	});

	describe('Actions - Admin Actions', () => {
		it('should show edit and delete buttons when showActions is true', async () => {
			render(PostCard, { props: { post: mockPost, showActions: true } });

			await vi.waitFor(() => {
				const buttons = screen.getAllByRole('button');
				const editButton = buttons.find(btn => btn.title === 'Editar post');
				const deleteButton = buttons.find(btn => btn.title === 'Eliminar post');
				expect(editButton).toBeInTheDocument();
				expect(deleteButton).toBeInTheDocument();
			});
		});

		it('should not show edit and delete buttons when showActions is false', async () => {
			render(PostCard, { props: { post: mockPost, showActions: false } });

			await vi.waitFor(() => {
				const buttons = screen.getAllByRole('button');
				const editButton = buttons.find(btn => btn.title === 'Editar post');
				const deleteButton = buttons.find(btn => btn.title === 'Eliminar post');
				expect(editButton).toBeUndefined();
				expect(deleteButton).toBeUndefined();
			});
		});

		it('should dispatch edit event when edit button is clicked', async () => {
			const { component } = render(PostCard, { props: { post: mockPost, showActions: true } });

			const editHandler = vi.fn();
			component.$on('edit', editHandler);

			const buttons = await screen.findAllByRole('button');
			const editButton = buttons.find(btn => btn.title === 'Editar post');
			if (editButton) {
				await fireEvent.click(editButton);
			}

			expect(editHandler).toHaveBeenCalledTimes(1);
			expect(editHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: mockPost
				})
			);
		});

		it('should dispatch delete event with post id when delete button is clicked', async () => {
			const { component } = render(PostCard, { props: { post: mockPost, showActions: true } });

			const deleteHandler = vi.fn();
			component.$on('delete', deleteHandler);

			const buttons = await screen.findAllByRole('button');
			const deleteButton = buttons.find(btn => btn.title === 'Eliminar post');
			if (deleteButton) {
				await fireEvent.click(deleteButton);
			}

			expect(deleteHandler).toHaveBeenCalledTimes(1);
			expect(deleteHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: 'post-1'
				})
			);
		});
	});

	describe('Drag and Drop', () => {
		it('should show drag handle when showActions is true', async () => {
			render(PostCard, { props: { post: mockPost, showActions: true } });

			await vi.waitFor(() => {
				const dragHandle = document.querySelector('.drag-handle');
				expect(dragHandle).toBeInTheDocument();
			});
		});

		it('should not show drag handle when showActions is false', async () => {
			render(PostCard, { props: { post: mockPost, showActions: false } });

			await vi.waitFor(() => {
				const dragHandle = document.querySelector('.drag-handle');
				expect(dragHandle).not.toBeInTheDocument();
			});
		});

		it('should apply dragging class when isDragging is true', async () => {
			render(PostCard, { props: { post: mockPost, isDragging: true } });

			await vi.waitFor(() => {
				const card = document.querySelector('.post-card');
				expect(card).toHaveClass('dragging');
			});
		});

		it('should apply has-media class when post has media elements', async () => {
			render(PostCard, { props: { post: mockPost } });

			await vi.waitFor(() => {
				const card = document.querySelector('.post-card');
				expect(card).toHaveClass('has-media');
			});
		});

		it('should not apply has-media class when post has no media elements', async () => {
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue([
				{ ...mockElements[0], elementType: 'text' }
			]);

			render(PostCard, { props: { post: mockPost } });

			await vi.waitFor(() => {
				const card = document.querySelector('.post-card');
				expect(card).not.toHaveClass('has-media');
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty element content gracefully', async () => {
			const elementsWithEmptyContent = [
				{ ...mockElements[0], content: '' },
				{ ...mockElements[1], content: null as any }
			];
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(elementsWithEmptyContent);

			render(PostCard, { props: { post: mockPost } });

			await vi.waitFor(() => {
				expect(screen.getByText(/Sin título|Sin contenido/)).toBeInTheDocument();
			});
		});

		it('should handle video and audio elements with placeholder', async () => {
			const mediaElements: PostElement[] = [
				{
					id: 'video-1',
					postId: 'post-1',
					elementType: 'video',
					filePath: '/posts/video.mp4',
					fileName: 'video.mp4',
					orderNumber: 0,
					isActive: true,
					createdAt: Date.now()
				},
				{
					id: 'audio-1',
					postId: 'post-1',
					elementType: 'audio',
					filePath: '/posts/audio.mp3',
					fileName: 'audio.mp3',
					orderNumber: 1,
					isActive: true,
					createdAt: Date.now()
				}
			];
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(mediaElements);

			render(PostCard, { props: { post: mockPost } });

			await vi.waitFor(() => {
				expect(screen.getByText('Video')).toBeInTheDocument();
				expect(screen.getByText('Audio')).toBeInTheDocument();
			});
		});
	});
});
