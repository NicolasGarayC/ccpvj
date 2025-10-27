import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import PostViewer from '../PostViewer.svelte';
import type { PostDetail } from '$lib/application/services/material-apoyo/ModulePostService';
import type { PostElement } from '$lib/application/services/material-apoyo/PostElementService';
import { postElementService } from '$lib/application/services/material-apoyo/PostElementService';

vi.mock('$lib/application/services/material-apoyo/PostElementService', () => ({
	postElementService: {
		getElementsByPostId: vi.fn(),
		getMediaUrl: vi.fn((path: string) => `/media${path.startsWith('/') ? '' : '/'}` + path)
	}
}));

const basePost: PostDetail = {
	id: 'post-1',
	title: 'Post de Prueba',
	subtitle: 'Subtítulo del post',
	content: 'Contenido',
	orderNumber: 1,
	moduleId: 'mod-1',
	authorId: 'author-1',
	authorName: 'Juan Pérez',
	createdAt: '2024-01-15T10:30:00Z',
	updatedAt: '2024-01-15T10:30:00Z',
	isActive: true
};

const baseElements: PostElement[] = [
	{
		id: 'elem-1',
		postId: 'post-1',
		elementType: 'title',
		content: 'Título del Contenido',
		orderNumber: 1,
		createdAt: new Date('2024-01-15T10:30:00Z')
	},
	{
		id: 'elem-2',
		postId: 'post-1',
		elementType: 'text',
		content: 'Este es el texto del contenido del post.\nCon múltiples líneas.',
		orderNumber: 2,
		createdAt: new Date('2024-01-15T10:30:00Z')
	},
	{
		id: 'elem-3',
		postId: 'post-1',
		elementType: 'image',
		filePath: '/uploads/image.jpg',
		fileName: 'image.jpg',
		orderNumber: 3,
		mimeType: 'image/jpeg',
		createdAt: new Date('2024-01-15T10:30:00Z')
	}
];

const defaultProps = {
	visible: true,
	post: basePost,
	moduleId: 'mod-1'
};

const renderViewer = (props: Partial<typeof defaultProps> & { post?: PostDetail | null; onClose?: () => void } = {}) =>
	render(PostViewer, { props: { ...defaultProps, ...props } });

describe('PostViewer', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(baseElements);
	});

	it('does not render when not visible', () => {
		renderViewer({ visible: false });
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('loads elements when opened', async () => {
		renderViewer();
		await waitFor(() => {
			expect(postElementService.getElementsByPostId).toHaveBeenCalledWith('post-1');
		});
	});

	it('renders post header information', async () => {
		renderViewer();
		await waitFor(() => {
			expect(screen.getByText('Post de Prueba')).toBeInTheDocument();
			expect(screen.getByText('Subtítulo del post')).toBeInTheDocument();
			expect(screen.getByText('#1')).toBeInTheDocument();
			expect(screen.getByText(/Por Juan Pérez/)).toBeInTheDocument();
			expect(
				screen.getByText((content) => content.includes('15 de enero de 2024'))
			).toBeInTheDocument();
		});
	});

	it('renders base elements including media', async () => {
		renderViewer();

		await waitFor(() => {
			expect(screen.getByText('Título del Contenido')).toBeInTheDocument();
			expect(screen.getByText(/Este es el texto del contenido/)).toBeInTheDocument();
		});

		const image = await screen.findByAltText('image.jpg');
		expect(image).toBeInTheDocument();
		expect(image.getAttribute('loading')).toBe('lazy');

		expect(postElementService.getMediaUrl).toHaveBeenCalledWith('/uploads/image.jpg', 'mod-1', false);
	});

	it('shows spinner while fetching', async () => {
		let resolveElements: ((value: PostElement[]) => void) | undefined;
		vi.mocked(postElementService.getElementsByPostId).mockImplementation(
			() =>
				new Promise<PostElement[]>((resolve) => {
					resolveElements = resolve;
				})
		);

		renderViewer();
		expect(await screen.findByText('Cargando contenido del post...')).toBeInTheDocument();
		expect(await screen.findByLabelText('Cargando...')).toBeInTheDocument();

		resolveElements?.(baseElements);

		await waitFor(() => {
			expect(screen.queryByLabelText('Cargando...')).not.toBeInTheDocument();
		});
	});

	it('shows empty state when no elements exist', async () => {
		vi.mocked(postElementService.getElementsByPostId).mockResolvedValue([]);

		renderViewer();
		await waitFor(() => {
			expect(screen.getByText('Post sin contenido')).toBeInTheDocument();
		});
	});

	it('shows error state and retries loading', async () => {
		vi.mocked(postElementService.getElementsByPostId)
			.mockRejectedValueOnce(new Error('Error de red'))
			.mockResolvedValueOnce(baseElements);

		renderViewer();

		await waitFor(() => {
			expect(screen.getByText('Error cargando contenido')).toBeInTheDocument();
			expect(screen.getByText('Error de red')).toBeInTheDocument();
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

		await waitFor(() => {
			expect(postElementService.getElementsByPostId).toHaveBeenCalledTimes(2);
		});

		expect(await screen.findByText('Título del Contenido')).toBeInTheDocument();
	});

	it('calls onClose when pressing the close button', async () => {
		const onClose = vi.fn();
		renderViewer({ onClose });

		await waitFor(() => {
			expect(screen.getByLabelText('Cerrar visor de post')).toBeInTheDocument();
		});

		await fireEvent.click(screen.getByLabelText('Cerrar visor de post'));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('calls onClose when clicking the backdrop', async () => {
		const onClose = vi.fn();
		renderViewer({ onClose });

		const dialog = await screen.findByRole('dialog');
		await fireEvent.click(dialog);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('does not close when clicking inside the content', async () => {
		const onClose = vi.fn();
		renderViewer({ onClose });

		await waitFor(() => {
			expect(screen.getByText('Post de Prueba')).toBeInTheDocument();
		});

		await fireEvent.click(screen.getByText('Post de Prueba'));
		expect(onClose).not.toHaveBeenCalled();
	});

	it('closes on Escape key press', async () => {
		const onClose = vi.fn();
		renderViewer({ onClose });

		const dialog = await screen.findByRole('dialog');
		await fireEvent.keyDown(dialog, { key: 'Escape' });
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('avoids fetching elements when post is null', () => {
		renderViewer({ post: null });
		expect(postElementService.getElementsByPostId).not.toHaveBeenCalled();
	});

	it('refetches elements when modal reopens', async () => {
	const { rerender } = renderViewer({ visible: false });

	rerender({ ...defaultProps, visible: true });
	await waitFor(() => {
		expect(postElementService.getElementsByPostId).toHaveBeenCalled();
	});

	vi.mocked(postElementService.getElementsByPostId).mockClear();

	rerender({ ...defaultProps, visible: false });
	await waitFor(() => {
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	rerender({ ...defaultProps, visible: true });

	await waitFor(() => {
		expect(postElementService.getElementsByPostId).toHaveBeenCalledTimes(1);
	});
	});

	it('handles posts without title or date gracefully', async () => {
		const postWithoutTitle: PostDetail = {
			...basePost,
			title: '',
			createdAt: null as unknown as string
		};

		renderViewer({ post: postWithoutTitle });

		await waitFor(() => {
			expect(screen.getByText('Sin título')).toBeInTheDocument();
			expect(screen.getByText('Sin fecha')).toBeInTheDocument();
		});
	});

	it('passes undefined moduleId to media helper when not provided', async () => {
		renderViewer({ moduleId: null });

		await waitFor(() => {
			expect(postElementService.getMediaUrl).toHaveBeenCalledWith('/uploads/image.jpg', undefined, false);
		});
	});
});
