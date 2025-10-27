import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import PostForm from '../PostForm.svelte';
import {
	modulePostService,
	type PostDetail
} from '$lib/application/services/material-apoyo/ModulePostService';
import {
	postElementService,
	type PostElement
} from '$lib/application/services/material-apoyo/PostElementService';
import { contextualUploadService } from '$lib/application/services/upload/ContextualUploadService';

vi.mock('$lib/application/services/material-apoyo/ModulePostService', () => ({
	modulePostService: {
		getPost: vi.fn(),
		createPost: vi.fn(),
		updatePost: vi.fn()
	}
}));

vi.mock('$lib/application/services/material-apoyo/PostElementService', () => ({
	postElementService: {
		getElementsByPostId: vi.fn(),
		createElementsInBatch: vi.fn(),
		updateElement: vi.fn(),
		deleteElement: vi.fn()
	}
}));

vi.mock('$lib/application/services/upload/ContextualUploadService', () => ({
	contextualUploadService: {
		cleanupOrphanFiles: vi.fn(),
		getMediaUrl: vi.fn((path: string) => path),
		validateFile: vi.fn(() => ({ isValid: true })),
		uploadCourseImage: vi.fn(),
		uploadPostMedia: vi.fn(),
		uploadBlogMedia: vi.fn()
	}
}));

vi.mock('../upload/ContextualMediaUploader.svelte', () => ({
	default: class MockUploader {
		$$set = vi.fn();
		$set = vi.fn();
		$on = vi.fn();
		$destroy = vi.fn();

		constructor(options: { target: HTMLElement }) {
			options?.target?.insertAdjacentHTML(
				'beforeend',
				'<div data-testid="contextual-media-uploader"></div>'
			);
		}
	}
}));

const defaultProps = {
	visible: true,
	moduleId: 'module-123',
	materialApoyoId: 'material-123'
};

const mockPostDetail: PostDetail = {
	id: 'post-123',
	title: 'Test Post',
	subtitle: undefined,
	content: undefined,
	imagePath: undefined,
	videoPath: undefined,
	audioPath: undefined,
	orderNumber: 1,
	moduleId: 'module-123',
	authorId: '1',
	authorName: 'Autor de Prueba',
	createdAt: new Date('2024-01-01T00:00:00Z'),
	updatedAt: new Date('2024-01-02T00:00:00Z'),
	isActive: true
};

const mockPostElements: PostElement[] = [
	{
		id: 'elem-1',
		postId: 'post-123',
		elementType: 'title',
		content: 'Título existente',
		filePath: undefined,
		fileName: undefined,
		fileSize: undefined,
		mimeType: undefined,
		orderNumber: 1,
		metadata: undefined,
		createdAt: new Date('2024-01-01T00:00:00Z'),
		updatedAt: undefined
	},
	{
		id: 'elem-2',
		postId: 'post-123',
		elementType: 'text',
		content: 'Contenido existente',
		filePath: undefined,
		fileName: undefined,
		fileSize: undefined,
		mimeType: undefined,
		orderNumber: 2,
		metadata: undefined,
		createdAt: new Date('2024-01-01T00:00:00Z'),
		updatedAt: undefined
	}
];

type ExtraProps = {
	post?: PostDetail | null;
	onCreated?: (detail: unknown) => void;
	onUpdated?: (detail: unknown) => void;
	onClose?: () => void;
};

const renderPostForm = (props: (Partial<typeof defaultProps> & ExtraProps) = {}) =>
	render(PostForm, { props: { ...defaultProps, ...props } });

describe('PostForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		vi.mocked(modulePostService.createPost).mockResolvedValue(mockPostDetail);
		vi.mocked(modulePostService.updatePost).mockResolvedValue(undefined);
		vi.mocked(modulePostService.getPost).mockResolvedValue(mockPostDetail);

		vi.mocked(postElementService.getElementsByPostId).mockResolvedValue([]);
		vi.mocked(postElementService.createElementsInBatch).mockResolvedValue([]);
		vi.mocked(postElementService.updateElement).mockResolvedValue(mockPostElements[0]);
		vi.mocked(postElementService.deleteElement).mockResolvedValue(undefined);

		vi.mocked(contextualUploadService.cleanupOrphanFiles).mockResolvedValue(undefined);
	});

	it('does not render the modal when visible is false', () => {
		const { container } = renderPostForm({ visible: false });
		expect(container.querySelector('.modal-overlay')).not.toBeInTheDocument();
	});

	it('renders form content when visible is true', async () => {
		renderPostForm();
		await waitFor(() => {
			expect(screen.getByText('Información del Post')).toBeInTheDocument();
		});
	});

	it('prefills information when editing an existing post', async () => {
		vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(mockPostElements);

		const { container } = renderPostForm({ post: mockPostDetail });

		await waitFor(() => {
			expect(screen.getByDisplayValue('Test Post')).toBeInTheDocument();
			expect(postElementService.getElementsByPostId).toHaveBeenCalledWith('post-123');
		});

		expect(container.querySelectorAll('.element-block')).toHaveLength(2);
	});

	it('adds a title element when the user clicks the corresponding button', async () => {
		renderPostForm();

		await fireEvent.click(screen.getByRole('button', { name: 'Título' }));

		await waitFor(() => {
			expect(screen.getByDisplayValue('Nuevo título')).toBeInTheDocument();
		});
	});

	it('shows a validation error if the user tries to submit without elements', async () => {
		renderPostForm();

		const titleInput = screen.getByLabelText('Título del Post *') as HTMLInputElement;
		await fireEvent.input(titleInput, { target: { value: 'Nuevo Post' } });

		await fireEvent.click(screen.getByRole('button', { name: 'Crear Post' }));

		await waitFor(() => {
			expect(screen.getByText(/Debe agregar al menos un elemento/)).toBeInTheDocument();
		});

		expect(modulePostService.createPost).not.toHaveBeenCalled();
	});

	it('creates a post and dispatches the created event', async () => {
		const createdElements: PostElement[] = [
			{
				...mockPostElements[0],
				id: 'elem-created',
				createdAt: new Date('2024-02-01T00:00:00Z')
			}
		];

		vi.mocked(postElementService.createElementsInBatch).mockResolvedValue(createdElements);

		const createdHandler = vi.fn();
		renderPostForm({ onCreated: createdHandler });

		const titleInput = screen.getByLabelText('Título del Post *') as HTMLInputElement;
		await fireEvent.input(titleInput, { target: { value: 'Nuevo Post' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Título' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Crear Post' }));

		await waitFor(() => {
			expect(modulePostService.createPost).toHaveBeenCalledWith({
				title: 'Nuevo Post',
				orderNumber: 1,
				moduleId: 'module-123'
			});
			expect(postElementService.createElementsInBatch).toHaveBeenCalledWith(
				'post-123',
				expect.arrayContaining([
					expect.objectContaining({
						element: expect.objectContaining({
							elementType: 'title',
							orderNumber: 1,
							content: 'Nuevo título'
						})
					})
				])
			);
			expect(createdHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining('creado exitosamente')
				})
			);
		});
	});

	it('updates an existing post and dispatches the updated event', async () => {
		vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(mockPostElements);
		vi.mocked(postElementService.updateElement).mockResolvedValue(mockPostElements[0]);

		const updatedHandler = vi.fn();
		renderPostForm({ post: mockPostDetail, onUpdated: updatedHandler });

		await waitFor(() => {
			expect(screen.getByDisplayValue('Test Post')).toBeInTheDocument();
		});

		const titleInput = screen.getByLabelText('Título del Post *') as HTMLInputElement;
		await fireEvent.input(titleInput, { target: { value: 'Post Editado' } });

		await fireEvent.click(screen.getByRole('button', { name: 'Actualizar Post' }));

		await waitFor(() => {
			expect(modulePostService.updatePost).toHaveBeenCalledWith('post-123', {
				title: 'Post Editado',
				orderNumber: 1
			});
			expect(postElementService.updateElement).toHaveBeenCalled();
			expect(updatedHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining('actualizado exitosamente')
				})
			);
		});
	});

	it('removes existing elements through the API when deleting', async () => {
		vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(mockPostElements);

		renderPostForm({ post: mockPostDetail });

		await waitFor(() => {
			expect(screen.getAllByRole('button', { name: 'Eliminar elemento' })).toHaveLength(2);
		});

		await fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar elemento' })[0]);

		await waitFor(() => {
			expect(postElementService.deleteElement).toHaveBeenCalledWith('elem-1');
		});
	});

	it('emits close when the user cancels', async () => {
		const closeHandler = vi.fn();
		renderPostForm({ onClose: closeHandler });

		await fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

		await waitFor(() => {
			expect(closeHandler).toHaveBeenCalled();
		});

		expect(contextualUploadService.cleanupOrphanFiles).not.toHaveBeenCalled();
	});
});
