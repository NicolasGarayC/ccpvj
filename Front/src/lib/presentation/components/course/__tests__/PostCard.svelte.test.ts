import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import PostCard from '../PostCard.svelte';
import type { PostDetail } from '$lib/application/services/material-apoyo/ModulePostService';
import type { PostElement } from '$lib/application/services/material-apoyo/PostElementService';
import { postElementService } from '$lib/application/services/material-apoyo/PostElementService';

vi.mock('$lib/application/services/material-apoyo/PostElementService', () => ({
	postElementService: {
		getElementsByPostId: vi.fn(),
		getFileUrl: vi.fn((path: string) => `/media${path}`)
	}
}));

const basePost: PostDetail = {
	id: 'post-1',
	title: 'Post de Prueba',
	subtitle: 'Subtítulo del post',
	orderNumber: 1,
	moduleId: 'module-1',
	authorId: 'author-1',
	authorName: 'Juan Pérez',
	createdAt: new Date('2024-01-15T10:30:00Z'),
	updatedAt: new Date('2024-01-15T10:30:00Z'),
	isActive: true
};

const baseElements: PostElement[] = [
	{
		id: 'element-1',
		postId: 'post-1',
		elementType: 'title',
		content: 'Título del elemento',
		orderNumber: 0,
		isActive: true,
		createdAt: new Date('2024-01-15T10:30:00Z')
	},
	{
		id: 'element-2',
		postId: 'post-1',
		elementType: 'text',
		content:
			'Este es un texto de prueba largo que debe ser truncado cuando se muestra en el preview porque tiene más de 100 caracteres de longitud.',
		orderNumber: 1,
		isActive: true,
		createdAt: new Date('2024-01-15T10:30:00Z')
	},
	{
		id: 'element-3',
		postId: 'post-1',
		elementType: 'image',
		filePath: '/posts/test-image.jpg',
		fileName: 'test-image.jpg',
		orderNumber: 2,
		isActive: true,
		createdAt: new Date('2024-01-15T10:30:00Z')
	}
];

const renderCard = (
	props: Partial<{
		post: PostDetail;
		showActions: boolean;
		isDragging: boolean;
		onView: (post: PostDetail) => void;
		onEdit: (post: PostDetail) => void;
		onDelete: (id: string) => void;
	}> = {}
) =>
	render(PostCard, {
		props: {
			post: basePost,
			showActions: false,
			isDragging: false,
			...props
		}
	});

describe('PostCard', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(baseElements);
	});

	it('renders main metadata (title, subtitle, author, date)', async () => {
		renderCard();

	await waitFor(() => {
		expect(screen.getByText('Post de Prueba')).toBeInTheDocument();
		expect(screen.getByText('Subtítulo del post')).toBeInTheDocument();
		expect(screen.getByText('#1')).toBeInTheDocument();
		expect(screen.getByText(/Por Juan Pérez/)).toBeInTheDocument();
		expect(screen.getByText(/15 ene 2024/i)).toBeInTheDocument();
	});
	});

	it('shows fallback subtitle and author when data missing', async () => {
		const customPost: PostDetail = {
			...basePost,
			subtitle: undefined,
			authorName: ''
		};

		renderCard({ post: customPost });

		await waitFor(() => {
			expect(screen.queryByText('Subtítulo del post')).not.toBeInTheDocument();
			expect(screen.getByText(/Autor desconocido/)).toBeInTheDocument();
		});
	});

	it('formats invalid or missing dates as "Sin fecha"', async () => {
		const invalidPost: PostDetail = {
			...basePost,
			createdAt: 'invalid-date' as unknown as Date
		};

		renderCard({ post: invalidPost });

		await waitFor(() => {
			expect(screen.getByText(/Sin fecha/)).toBeInTheDocument();
		});
	});

	it('shows inactive badge when post is not active', async () => {
		renderCard({ post: { ...basePost, isActive: false } });

		await waitFor(() => {
			expect(screen.getByText('Inactivo')).toBeInTheDocument();
		});
	});

	it('loads elements on mount and shows loading state', async () => {
		let resolveElements: ((value: PostElement[]) => void) | undefined;
		vi.mocked(postElementService.getElementsByPostId).mockImplementation(
			() =>
				new Promise<PostElement[]>((resolve) => {
					resolveElements = resolve;
				})
		);

		renderCard();
		expect(screen.getByText('Cargando contenido...')).toBeInTheDocument();

		resolveElements?.(baseElements);
		await waitFor(() => {
			expect(postElementService.getElementsByPostId).toHaveBeenCalledWith('post-1');
			expect(screen.queryByText('Cargando contenido...')).not.toBeInTheDocument();
		});
	});

	it('displays element summary and preview when elements are available', async () => {
		renderCard();

		await waitFor(() => {
			expect(screen.getByText('3 elementos')).toBeInTheDocument();
			expect(screen.getByText('Título del elemento')).toBeInTheDocument();
			expect(screen.getByText(/Este es un texto de prueba largo/)).toBeInTheDocument();
		});

		expect(await screen.findByAltText('test-image.jpg')).toBeInTheDocument();
		expect(postElementService.getFileUrl).toHaveBeenCalledWith('/posts/test-image.jpg');
	});

	it('shows singular label when there is only one element', async () => {
		vi.mocked(postElementService.getElementsByPostId).mockResolvedValue([baseElements[0]]);

		renderCard();
		expect(await screen.findByText('1 elemento')).toBeInTheDocument();
	});

	it('renders "+N más..." indicator when more than three elements exist', async () => {
		const manyElements = [
			...baseElements,
			{ ...baseElements[0], id: 'element-4', orderNumber: 3 },
			{ ...baseElements[0], id: 'element-5', orderNumber: 4 }
		];
		vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(manyElements);

		renderCard();
		expect(await screen.findByText('+2 más...')).toBeInTheDocument();
	});

	it('shows empty state when elements cannot be loaded', async () => {
		vi.mocked(postElementService.getElementsByPostId).mockRejectedValue(new Error('network'));

		renderCard();

	expect(await screen.findByText(/Este post aún no tiene contenido\.?/)).toBeInTheDocument();
	});

	it('adds media class when media elements exist', async () => {
		renderCard();

		await waitFor(() => {
			const card = document.querySelector('.post-card');
			expect(card).toHaveClass('has-media');
		});
	});

	it('omits media class when there are only text elements', async () => {
		vi.mocked(postElementService.getElementsByPostId).mockResolvedValue([
			{ ...baseElements[0], elementType: 'text', content: 'Texto' }
		]);

		renderCard();

		await waitFor(() => {
			const card = document.querySelector('.post-card');
			expect(card).not.toHaveClass('has-media');
		});
	});

	it('invokes provided callbacks and dispatches actions', async () => {
		const onView = vi.fn();
		const onEdit = vi.fn();
		const onDelete = vi.fn();

		renderCard({ showActions: true, onView, onEdit, onDelete });

		await fireEvent.click(await screen.findByRole('button', { name: /Ver Detalle/i }));
		expect(onView).toHaveBeenCalledWith(basePost);

		const editButton = await screen.findByTitle('Editar post');
		await fireEvent.click(editButton);
		expect(onEdit).toHaveBeenCalledWith(basePost);

		const deleteButton = await screen.findByTitle('Eliminar post');
		await fireEvent.click(deleteButton);
		expect(onDelete).toHaveBeenCalledWith('post-1');
	});

	it('shows admin controls only when showActions is true', async () => {
		const { rerender } = renderCard({ showActions: false });
		await waitFor(() => {
			expect(screen.queryByTitle('Editar post')).toBeNull();
		});

		await rerender({ post: basePost, showActions: true });
		expect(await screen.findByTitle('Editar post')).toBeInTheDocument();
	});

	it('applies dragging class when isDragging is true', async () => {
		renderCard({ isDragging: true });

		await waitFor(() => {
			const card = document.querySelector('.post-card');
			expect(card).toHaveClass('dragging');
		});
	});

	it('renders placeholders for video and audio elements', async () => {
		const mediaElements: PostElement[] = [
			{
				id: 'video-1',
				postId: 'post-1',
				elementType: 'video',
				filePath: '/posts/video.mp4',
				orderNumber: 0,
				isActive: true,
				createdAt: new Date('2024-01-15T10:30:00Z')
			},
			{
				id: 'audio-1',
				postId: 'post-1',
				elementType: 'audio',
				filePath: '/posts/audio.mp3',
				orderNumber: 1,
				isActive: true,
				createdAt: new Date('2024-01-15T10:30:00Z')
			}
		];
		vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(mediaElements);

		renderCard();

		await waitFor(() => {
			expect(screen.getByText('Video')).toBeInTheDocument();
			expect(screen.getByText('Audio')).toBeInTheDocument();
		});
	});
});
