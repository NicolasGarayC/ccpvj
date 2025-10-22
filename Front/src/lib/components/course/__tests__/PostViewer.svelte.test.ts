import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import PostViewer from '../PostViewer.svelte';
import type { PostDetail } from '$lib/services/modulePostService';
import type { PostElement } from '$lib/services/postElementService';
import { postElementService } from '$lib/services/postElementService';

vi.mock('$lib/services/postElementService', () => ({
	postElementService: {
		getElementsByPostId: vi.fn(),
		getMediaUrl: vi.fn((path: string) => `/media/${path}`)
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

const mockPost: PostDetail = {
	id: 'post-1',
	title: 'Post de Prueba',
	subtitle: 'Subtítulo del post',
	content: 'Contenido del post',
	orderNumber: 1,
	status: 'published',
	authorName: 'Juan Pérez',
	createdAt: '2024-01-15T10:30:00Z',
	updatedAt: '2024-01-15T10:30:00Z',
	moduleId: 'mod-1',
	materialApoyoId: 'course-1',
	isActive: true,
	elementCount: 3
};

const mockElements: PostElement[] = [
	{
		id: 'elem-1',
		postId: 'post-1',
		elementType: 'title',
		content: 'Título del Contenido',
		orderNumber: 1,
		filePath: null,
		fileName: null,
		mimeType: null,
		createdAt: '2024-01-15T10:30:00Z'
	},
	{
		id: 'elem-2',
		postId: 'post-1',
		elementType: 'text',
		content: 'Este es el texto del contenido del post.\nCon múltiples líneas.',
		orderNumber: 2,
		filePath: null,
		fileName: null,
		mimeType: null,
		createdAt: '2024-01-15T10:30:00Z'
	},
	{
		id: 'elem-3',
		postId: 'post-1',
		elementType: 'image',
		content: null,
		orderNumber: 3,
		filePath: '/uploads/image.jpg',
		fileName: 'image.jpg',
		mimeType: 'image/jpeg',
		createdAt: '2024-01-15T10:30:00Z'
	}
];

describe('PostViewer', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(mockElements);
	});

	describe('Visibility', () => {
		it('should not render when visible is false', () => {
			render(PostViewer, { props: { visible: false, post: mockPost, moduleId: 'mod-1' } });
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		it('should render when visible is true', () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });
			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});
	});

	describe('Post Header', () => {
		it('should display post title', async () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });
			await waitFor(() => {
				expect(screen.getByText('Post de Prueba')).toBeInTheDocument();
			});
		});

		it('should display post subtitle when available', async () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });
			await waitFor(() => {
				expect(screen.getByText('Subtítulo del post')).toBeInTheDocument();
			});
		});

		it('should not display subtitle when not available', async () => {
			const postWithoutSubtitle = { ...mockPost, subtitle: undefined };
			render(PostViewer, { props: { visible: true, post: postWithoutSubtitle, moduleId: 'mod-1' } });
			await waitFor(() => {
				expect(screen.queryByText('Subtítulo del post')).not.toBeInTheDocument();
			});
		});

		it('should display order number', async () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });
			await waitFor(() => {
				expect(screen.getByText('#1')).toBeInTheDocument();
			});
		});

		it('should display author name', async () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });
			await waitFor(() => {
				expect(screen.getByText(/Por Juan Pérez/)).toBeInTheDocument();
			});
		});

		it('should display default author when not provided', async () => {
			const postWithoutAuthor = { ...mockPost, authorName: undefined };
			render(PostViewer, { props: { visible: true, post: postWithoutAuthor, moduleId: 'mod-1' } });
			await waitFor(() => {
				expect(screen.getByText(/Por Autor desconocido/)).toBeInTheDocument();
			});
		});

		it('should display formatted date', async () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });
			await waitFor(() => {
				expect(screen.getByText(/lunes, 15 de enero de 2024/i)).toBeInTheDocument();
			});
		});

		it('should display inactive badge when post is inactive', async () => {
			const inactivePost = { ...mockPost, isActive: false };
			render(PostViewer, { props: { visible: true, post: inactivePost, moduleId: 'mod-1' } });
			await waitFor(() => {
				expect(screen.getByText('Inactivo')).toBeInTheDocument();
			});
		});

		it('should not display inactive badge when post is active', async () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });
			await waitFor(() => {
				expect(screen.queryByText('Inactivo')).not.toBeInTheDocument();
			});
		});
	});

	describe('Close Button', () => {
		it('should display close button', async () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });
			await waitFor(() => {
				expect(screen.getByLabelText('Cerrar visor de post')).toBeInTheDocument();
			});
		});

		it('should dispatch close event when close button is clicked', async () => {
			const { component } = render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			const closeHandler = vi.fn();
			component.$on('close', closeHandler);

			await waitFor(() => {
				const closeButton = screen.getByLabelText('Cerrar visor de post');
				fireEvent.click(closeButton);
			});

			expect(closeHandler).toHaveBeenCalled();
		});

		it('should close when backdrop is clicked', async () => {
			const { component } = render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			const closeHandler = vi.fn();
			component.$on('close', closeHandler);

			await waitFor(() => {
				const backdrop = screen.getByRole('dialog');
				fireEvent.click(backdrop);
			});

			expect(closeHandler).toHaveBeenCalled();
		});

		it('should not close when clicking inside modal content', async () => {
			const { component } = render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			const closeHandler = vi.fn();
			component.$on('close', closeHandler);

			await waitFor(() => {
				const title = screen.getByText('Post de Prueba');
				fireEvent.click(title);
			});

			expect(closeHandler).not.toHaveBeenCalled();
		});

		it('should close on Escape key press', async () => {
			const { component } = render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			const closeHandler = vi.fn();
			component.$on('close', closeHandler);

			await waitFor(() => {
				const dialog = screen.getByRole('dialog');
				fireEvent.keyDown(dialog, { key: 'Escape' });
			});

			expect(closeHandler).toHaveBeenCalled();
		});
	});

	describe('Loading Elements', () => {
		it('should fetch elements when modal opens', async () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });
			await waitFor(() => {
				expect(postElementService.getElementsByPostId).toHaveBeenCalledWith('post-1');
			});
		});

		it('should show loading spinner while fetching', () => {
			vi.mocked(postElementService.getElementsByPostId).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockElements), 100))
			);

			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });
			expect(screen.getByText('Cargando contenido del post...')).toBeInTheDocument();
		});

		it('should not fetch elements when post is null', () => {
			render(PostViewer, { props: { visible: true, post: null, moduleId: 'mod-1' } });
			expect(postElementService.getElementsByPostId).not.toHaveBeenCalled();
		});

		it('should refetch elements when modal reopens with same post', async () => {
			const { component } = render(PostViewer, { props: { visible: false, post: mockPost, moduleId: 'mod-1' } });

			component.$set({ visible: true });
			await waitFor(() => {
				expect(postElementService.getElementsByPostId).toHaveBeenCalledTimes(1);
			});

			component.$set({ visible: false });
			vi.clearAllMocks();

			component.$set({ visible: true });
			await waitFor(() => {
				expect(postElementService.getElementsByPostId).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('Error Handling', () => {
		it('should show error message when loading fails', async () => {
			vi.mocked(postElementService.getElementsByPostId).mockRejectedValue(
				new Error('Error de red')
			);

			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.getByText('Error cargando contenido')).toBeInTheDocument();
				expect(screen.getByText('Error de red')).toBeInTheDocument();
			});
		});

		it('should show retry button on error', async () => {
			vi.mocked(postElementService.getElementsByPostId).mockRejectedValue(new Error('Error'));

			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.getByText('Reintentar')).toBeInTheDocument();
			});
		});

		it('should retry loading when retry button is clicked', async () => {
			vi.mocked(postElementService.getElementsByPostId)
				.mockRejectedValueOnce(new Error('Error'))
				.mockResolvedValueOnce(mockElements);

			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.getByText('Reintentar')).toBeInTheDocument();
			});

			const retryButton = screen.getByText('Reintentar');
			await fireEvent.click(retryButton);

			await waitFor(() => {
				expect(postElementService.getElementsByPostId).toHaveBeenCalledTimes(2);
				expect(screen.getByText('Título del Contenido')).toBeInTheDocument();
			});
		});

		it('should handle non-Error exceptions', async () => {
			vi.mocked(postElementService.getElementsByPostId).mockRejectedValue('String error');

			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.getByText('Error cargando contenido')).toBeInTheDocument();
			});
		});
	});

	describe('Empty State', () => {
		it('should show empty state when no elements', async () => {
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue([]);

			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.getByText('Post sin contenido')).toBeInTheDocument();
			});
		});

		it('should show descriptive message in empty state', async () => {
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue([]);

			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(
					screen.getByText(/Este post aún no tiene elementos de contenido/)
				).toBeInTheDocument();
			});
		});
	});

	describe('Element Rendering - Title', () => {
		it('should render title elements', async () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.getByText('Título del Contenido')).toBeInTheDocument();
			});
		});

		it('should show title badge', async () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.getByText('Título')).toBeInTheDocument();
			});
		});

		it('should render default text for title without content', async () => {
			const elementsWithEmptyTitle = [{ ...mockElements[0], content: null }];
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(elementsWithEmptyTitle);

			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.getByText('Sin título')).toBeInTheDocument();
			});
		});
	});

	describe('Element Rendering - Text', () => {
		it('should render text elements', async () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.getByText(/Este es el texto del contenido/)).toBeInTheDocument();
			});
		});

		it('should show text badge', async () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.getByText('Texto')).toBeInTheDocument();
			});
		});

		it('should render default text for text without content', async () => {
			const elementsWithEmptyText = [
				mockElements[0],
				{ ...mockElements[1], content: null }
			];
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(elementsWithEmptyText);

			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.getByText('Sin contenido')).toBeInTheDocument();
			});
		});
	});

	describe('Element Rendering - Image', () => {
		it('should render image elements', async () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				const img = screen.getByAltText('image.jpg');
				expect(img).toBeInTheDocument();
			});
		});

		it('should show image badge', async () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.getByText('Imagen')).toBeInTheDocument();
			});
		});

		it('should display image filename caption', async () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				const captions = screen.getAllByText('image.jpg');
				expect(captions.length).toBeGreaterThan(0);
			});
		});

		it('should call getMediaUrl for image src', async () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(postElementService.getMediaUrl).toHaveBeenCalledWith(
					'/uploads/image.jpg',
					'mod-1',
					false
				);
			});
		});

		it('should not render image without filePath', async () => {
			const elementsWithoutFile = [
				mockElements[0],
				{ ...mockElements[2], filePath: null }
			];
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(elementsWithoutFile);

			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.queryByAltText('image.jpg')).not.toBeInTheDocument();
			});
		});
	});

	describe('Element Rendering - Video', () => {
		it('should render video elements', async () => {
			const elementsWithVideo = [
				...mockElements,
				{
					id: 'elem-4',
					postId: 'post-1',
					elementType: 'video' as const,
					content: null,
					orderNumber: 4,
					filePath: '/uploads/video.mp4',
					fileName: 'video.mp4',
					mimeType: 'video/mp4',
					createdAt: '2024-01-15T10:30:00Z'
				}
			];
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(elementsWithVideo);

			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				const video = document.querySelector('video');
				expect(video).toBeInTheDocument();
			});
		});

		it('should show video badge', async () => {
			const elementsWithVideo = [
				{
					id: 'elem-4',
					postId: 'post-1',
					elementType: 'video' as const,
					content: null,
					orderNumber: 1,
					filePath: '/uploads/video.mp4',
					fileName: 'video.mp4',
					mimeType: 'video/mp4',
					createdAt: '2024-01-15T10:30:00Z'
				}
			];
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(elementsWithVideo);

			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.getByText('Video')).toBeInTheDocument();
			});
		});

		it('should call getMediaUrl for video src', async () => {
			const elementsWithVideo = [
				{
					id: 'elem-4',
					postId: 'post-1',
					elementType: 'video' as const,
					content: null,
					orderNumber: 1,
					filePath: '/uploads/video.mp4',
					fileName: 'video.mp4',
					mimeType: 'video/mp4',
					createdAt: '2024-01-15T10:30:00Z'
				}
			];
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(elementsWithVideo);

			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(postElementService.getMediaUrl).toHaveBeenCalledWith(
					'/uploads/video.mp4',
					'mod-1',
					true
				);
			});
		});
	});

	describe('Element Rendering - Audio', () => {
		it('should render audio elements', async () => {
			const elementsWithAudio = [
				{
					id: 'elem-5',
					postId: 'post-1',
					elementType: 'audio' as const,
					content: null,
					orderNumber: 1,
					filePath: '/uploads/audio.mp3',
					fileName: 'audio.mp3',
					mimeType: 'audio/mpeg',
					createdAt: '2024-01-15T10:30:00Z'
				}
			];
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(elementsWithAudio);

			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				const audio = document.querySelector('audio');
				expect(audio).toBeInTheDocument();
			});
		});

		it('should show audio badge', async () => {
			const elementsWithAudio = [
				{
					id: 'elem-5',
					postId: 'post-1',
					elementType: 'audio' as const,
					content: null,
					orderNumber: 1,
					filePath: '/uploads/audio.mp3',
					fileName: 'audio.mp3',
					mimeType: 'audio/mpeg',
					createdAt: '2024-01-15T10:30:00Z'
				}
			];
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(elementsWithAudio);

			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.getByText('Audio')).toBeInTheDocument();
			});
		});
	});

	describe('Element Ordering', () => {
		it('should sort elements by orderNumber', async () => {
			const unorderedElements = [mockElements[2], mockElements[0], mockElements[1]];
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(unorderedElements);

			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				const orderBadges = screen.getAllByText(/#\d+/);
				// Should have post order and 3 element orders
				expect(orderBadges.length).toBeGreaterThanOrEqual(3);
			});
		});

		it('should display element order numbers', async () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				const elementOrders = document.querySelectorAll('.element-order');
				expect(elementOrders.length).toBe(3);
			});
		});
	});

	describe('Date Formatting', () => {
		it('should format date from timestamp number', async () => {
			const postWithTimestamp = { ...mockPost, createdAt: 1705316400000 };
			render(PostViewer, { props: { visible: true, post: postWithTimestamp, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.getByText(/2024/)).toBeInTheDocument();
			});
		});

		it('should format date from Date object', async () => {
			const postWithDate = { ...mockPost, createdAt: new Date('2024-01-15T10:30:00Z') as any };
			render(PostViewer, { props: { visible: true, post: postWithDate, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.getByText(/2024/)).toBeInTheDocument();
			});
		});

		it('should show "Sin fecha" for null date', async () => {
			const postWithoutDate = { ...mockPost, createdAt: null as any };
			render(PostViewer, { props: { visible: true, post: postWithoutDate, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.getByText(/Sin fecha/)).toBeInTheDocument();
			});
		});

		it('should show "Sin fecha" for invalid date', async () => {
			const postWithInvalidDate = { ...mockPost, createdAt: 'invalid-date' };
			render(PostViewer, { props: { visible: true, post: postWithInvalidDate, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.getByText(/Sin fecha/)).toBeInTheDocument();
			});
		});
	});

	describe('Accessibility', () => {
		it('should have role="dialog"', () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });
			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});

		it('should have aria-modal="true"', () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });
			const dialog = screen.getByRole('dialog');
			expect(dialog.getAttribute('aria-modal')).toBe('true');
		});

		it('should have aria-labelledby pointing to title', () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });
			const dialog = screen.getByRole('dialog');
			expect(dialog.getAttribute('aria-labelledby')).toBe('post-viewer-title');
		});

		it('should have tabindex="-1" on backdrop', () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });
			const dialog = screen.getByRole('dialog');
			expect(dialog.getAttribute('tabindex')).toBe('-1');
		});

		it('should have aria-label on close button', () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });
			expect(screen.getByLabelText('Cerrar visor de post')).toBeInTheDocument();
		});

		it('should set loading="lazy" on images', async () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				const img = screen.getByAltText('image.jpg') as HTMLImageElement;
				expect(img.loading).toBe('lazy');
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle post without title', async () => {
			const postWithoutTitle = { ...mockPost, title: '' };
			render(PostViewer, { props: { visible: true, post: postWithoutTitle, moduleId: 'mod-1' } });

			await waitFor(() => {
				expect(screen.getByText('Sin título')).toBeInTheDocument();
			});
		});

		it('should handle null moduleId', async () => {
			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: null } });

			await waitFor(() => {
				expect(postElementService.getMediaUrl).toHaveBeenCalledWith(
					'/uploads/image.jpg',
					undefined,
					false
				);
			});
		});

		it('should handle elements without fileName', async () => {
			const elementsWithoutFileName = [
				{ ...mockElements[2], fileName: null }
			];
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(elementsWithoutFileName);

			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				const img = screen.getByAltText('Imagen');
				expect(img).toBeInTheDocument();
			});
		});

		it('should handle elements with unknown type', async () => {
			const elementsWithUnknownType = [
				{
					...mockElements[0],
					elementType: 'unknown' as any
				}
			];
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(elementsWithUnknownType);

			render(PostViewer, { props: { visible: true, post: mockPost, moduleId: 'mod-1' } });

			await waitFor(() => {
				// Should not render unknown element types
				const elementsContainer = document.querySelector('.elements-container');
				expect(elementsContainer?.children.length).toBe(0);
			});
		});
	});
});
