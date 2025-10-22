import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import PostForm from '../PostForm.svelte';
import { modulePostService } from '$lib/services/modulePostService';
import { postElementService } from '$lib/services/postElementService';
import { contextualUploadService } from '$lib/services/contextualUploadService';
import type { PostDetail } from '$lib/services/modulePostService';

// Mock dependencies
vi.mock('$lib/services/modulePostService', () => ({
	modulePostService: {
		getPost: vi.fn(),
		createPost: vi.fn(),
		updatePost: vi.fn()
	}
}));

vi.mock('$lib/services/postElementService', () => ({
	postElementService: {
		getElementsByPostId: vi.fn(),
		createElement: vi.fn(),
		updateElement: vi.fn(),
		deleteElement: vi.fn(),
		createElementsInBatch: vi.fn()
	}
}));

vi.mock('$lib/services/contextualUploadService', () => ({
	contextualUploadService: {
		cleanupOrphanFiles: vi.fn()
	}
}));

const mockPostDetail: PostDetail = {
	id: 'post-123',
	title: 'Test Post',
	subtitle: null,
	content: null,
	imagePath: null,
	videoPath: null,
	audioPath: null,
	orderNumber: 1,
	isActive: true,
	moduleId: 'module-123',
	authorId: 1,
	createdAt: '2024-01-01T00:00:00Z',
	updatedAt: '2024-01-02T00:00:00Z'
};

const mockPostElements = [
	{
		id: 'elem-1',
		postId: 'post-123',
		elementType: 'title',
		content: 'Title Element',
		filePath: null,
		fileName: null,
		fileSize: null,
		mimeType: null,
		orderNumber: 1,
		metadata: null,
		isActive: true,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: null
	},
	{
		id: 'elem-2',
		postId: 'post-123',
		elementType: 'text',
		content: 'Text content',
		filePath: null,
		fileName: null,
		fileSize: null,
		mimeType: null,
		orderNumber: 2,
		metadata: null,
		isActive: true,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: null
	}
];

describe('PostForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(postElementService.getElementsByPostId).mockResolvedValue(mockPostElements);
		vi.mocked(modulePostService.getPost).mockResolvedValue(mockPostDetail);
		vi.mocked(modulePostService.createPost).mockResolvedValue(mockPostDetail);
		vi.mocked(modulePostService.updatePost).mockResolvedValue({});
		vi.mocked(postElementService.createElementsInBatch).mockResolvedValue([]);
		vi.mocked(postElementService.updateElement).mockResolvedValue(mockPostElements[0]);
		vi.mocked(postElementService.deleteElement).mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering - Modal Visibility', () => {
		it('should not render modal when visible is false', () => {
			render(PostForm, {
				props: {
					visible: false,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const modal = document.querySelector('.modal-overlay');
			expect(modal).not.toBeInTheDocument();
		});

		it('should render modal when visible is true', () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const modal = document.querySelector('.modal-overlay');
			expect(modal).toBeInTheDocument();
		});

		it('should render create title when post is null', () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123',
					post: null
				}
			});

			expect(screen.getByText('Crear Nuevo Post')).toBeInTheDocument();
		});

		it('should render edit title when post is provided', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123',
					post: mockPostDetail
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Editar Post')).toBeInTheDocument();
			});
		});
	});

	describe('Form Fields - Basic Information', () => {
		it('should render title input field', () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const titleInput = screen.getByLabelText('Título del Post *');
			expect(titleInput).toBeInTheDocument();
		});

		it('should render order number input field', () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const orderInput = screen.getByLabelText('Orden *');
			expect(orderInput).toBeInTheDocument();
		});

		it('should populate title field in edit mode', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123',
					post: mockPostDetail
				}
			});

			await waitFor(() => {
				const titleInput = screen.getByLabelText('Título del Post *') as HTMLInputElement;
				expect(titleInput.value).toBe('Test Post');
			});
		});

		it('should populate order number in edit mode', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123',
					post: mockPostDetail
				}
			});

			await waitFor(() => {
				const orderInput = screen.getByLabelText('Orden *') as HTMLInputElement;
				expect(orderInput.value).toBe('1');
			});
		});

		it('should use nextOrderNumber for new posts', () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123',
					nextOrderNumber: 5
				}
			});

			const orderInput = screen.getByLabelText('Orden *') as HTMLInputElement;
			expect(orderInput.value).toBe('5');
		});
	});

	describe('Element Management - Adding Elements', () => {
		it('should render all element type buttons', () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			expect(screen.getByText('Título')).toBeInTheDocument();
			expect(screen.getByText('Texto')).toBeInTheDocument();
			expect(screen.getByText('Imagen')).toBeInTheDocument();
			expect(screen.getByText('Video')).toBeInTheDocument();
			expect(screen.getByText('Audio')).toBeInTheDocument();
		});

		it('should show empty state when no elements added', () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			expect(screen.getByText('Agrega elementos para crear el contenido de tu post')).toBeInTheDocument();
		});

		it('should add title element when title button clicked', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const titleButton = screen.getAllByText('Título')[1]; // Second one is the button
			await fireEvent.click(titleButton);

			await waitFor(() => {
				const elementBadge = document.querySelector('.element-type-badge');
				expect(elementBadge?.textContent).toBe('Título');
			});
		});

		it('should add text element when text button clicked', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const textButton = screen.getByText('Texto');
			await fireEvent.click(textButton);

			await waitFor(() => {
				const elementBadge = document.querySelector('.element-type-badge');
				expect(elementBadge?.textContent).toBe('Texto');
			});
		});

		it('should add image element when image button clicked', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const imageButton = screen.getByText('Imagen');
			await fireEvent.click(imageButton);

			await waitFor(() => {
				const elementBadge = document.querySelector('.element-type-badge');
				expect(elementBadge?.textContent).toBe('Imagen');
			});
		});

		it('should add video element when video button clicked', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const videoButton = screen.getByText('Video');
			await fireEvent.click(videoButton);

			await waitFor(() => {
				const elementBadge = document.querySelector('.element-type-badge');
				expect(elementBadge?.textContent).toBe('Video');
			});
		});

		it('should add audio element when audio button clicked', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const audioButton = screen.getByText('Audio');
			await fireEvent.click(audioButton);

			await waitFor(() => {
				const elementBadge = document.querySelector('.element-type-badge');
				expect(elementBadge?.textContent).toBe('Audio');
			});
		});

		it('should add multiple elements in order', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			// Add title
			const titleButton = screen.getAllByText('Título')[1];
			await fireEvent.click(titleButton);

			// Add text
			const textButton = screen.getByText('Texto');
			await fireEvent.click(textButton);

			await waitFor(() => {
				const elementBlocks = document.querySelectorAll('.element-block');
				expect(elementBlocks.length).toBe(2);
			});
		});
	});

	describe('Element Management - Editing Elements', () => {
		it('should toggle edit mode when edit button clicked', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			// Add an element
			const titleButton = screen.getAllByText('Título')[1];
			await fireEvent.click(titleButton);

			await waitFor(() => {
				const elementBlock = document.querySelector('.element-block');
				expect(elementBlock).toHaveClass('is-editing');
			});
		});

		it('should update element content when typing', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			// Add title element
			const titleButton = screen.getAllByText('Título')[1];
			await fireEvent.click(titleButton);

			await waitFor(() => {
				const input = document.querySelector('.element-input') as HTMLInputElement;
				expect(input).toBeInTheDocument();
			});

			const input = document.querySelector('.element-input') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: 'Updated Title' } });

			expect(input.value).toBe('Updated Title');
		});

		it('should render textarea for text elements', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const textButton = screen.getByText('Texto');
			await fireEvent.click(textButton);

			await waitFor(() => {
				const textarea = document.querySelector('textarea.element-input');
				expect(textarea).toBeInTheDocument();
			});
		});

		it('should render input for title elements', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const titleButton = screen.getAllByText('Título')[1];
			await fireEvent.click(titleButton);

			await waitFor(() => {
				const input = document.querySelector('input.element-input');
				expect(input).toBeInTheDocument();
			});
		});
	});

	describe('Element Management - Removing Elements', () => {
		it('should remove element when delete button clicked', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			// Add element
			const titleButton = screen.getAllByText('Título')[1];
			await fireEvent.click(titleButton);

			await waitFor(() => {
				const deleteButton = document.querySelector('.btn-danger') as HTMLElement;
				expect(deleteButton).toBeInTheDocument();
			});

			const deleteButton = document.querySelector('.btn-danger') as HTMLElement;
			await fireEvent.click(deleteButton);

			await waitFor(() => {
				const elementBlocks = document.querySelectorAll('.element-block');
				expect(elementBlocks.length).toBe(0);
			});
		});

		it('should call deleteElement API when removing existing element', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123',
					post: mockPostDetail
				}
			});

			await waitFor(() => {
				const deleteButton = document.querySelector('.btn-danger') as HTMLElement;
				expect(deleteButton).toBeInTheDocument();
			});

			const deleteButton = document.querySelector('.btn-danger') as HTMLElement;
			await fireEvent.click(deleteButton);

			await waitFor(() => {
				expect(postElementService.deleteElement).toHaveBeenCalled();
			});
		});

		it('should reorder remaining elements after deletion', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			// Add 3 elements
			const titleButton = screen.getAllByText('Título')[1];
			await fireEvent.click(titleButton);
			await fireEvent.click(titleButton);
			await fireEvent.click(titleButton);

			await waitFor(() => {
				const elements = document.querySelectorAll('.element-block');
				expect(elements.length).toBe(3);
			});

			// Delete first element
			const deleteButtons = document.querySelectorAll('.btn-danger');
			await fireEvent.click(deleteButtons[0] as HTMLElement);

			await waitFor(() => {
				const elements = document.querySelectorAll('.element-block');
				expect(elements.length).toBe(2);
			});
		});
	});

	describe('Validation', () => {
		it('should show error when title is empty on submit', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const submitButton = screen.getByText('Crear Post');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('⚠️ El título es requerido')).toBeInTheDocument();
			});
		});

		it('should show error when no elements added', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			// Set title
			const titleInput = screen.getByLabelText('Título del Post *') as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'Test Title' } });

			const submitButton = screen.getByText('Crear Post');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('⚠️ Debe agregar al menos un elemento al post')).toBeInTheDocument();
			});
		});

		it('should show error when text element is empty', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			// Set title
			const titleInput = screen.getByLabelText('Título del Post *') as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'Test Title' } });

			// Add empty text element
			const textButton = screen.getByText('Texto');
			await fireEvent.click(textButton);

			await waitFor(() => {
				const textarea = document.querySelector('textarea.element-input') as HTMLTextAreaElement;
				fireEvent.input(textarea, { target: { value: '' } });
			});

			const submitButton = screen.getByText('Crear Post');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('⚠️ Los elementos de texto no pueden estar vacíos')).toBeInTheDocument();
			});
		});

		it('should show error when order number is less than 1', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const orderInput = screen.getByLabelText('Orden *') as HTMLInputElement;
			await fireEvent.input(orderInput, { target: { value: '0' } });

			const submitButton = screen.getByText('Crear Post');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('⚠️ El orden debe ser mayor a 0')).toBeInTheDocument();
			});
		});

		it('should clear errors when user starts typing in title', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			// Trigger validation
			const submitButton = screen.getByText('Crear Post');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('⚠️ El título es requerido')).toBeInTheDocument();
			});

			// Type in title
			const titleInput = screen.getByLabelText('Título del Post *') as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'Test' } });

			await waitFor(() => {
				expect(screen.queryByText('⚠️ El título es requerido')).not.toBeInTheDocument();
			});
		});
	});

	describe('Submit - Create Mode', () => {
		it('should call createPost when submitting new post', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			// Fill form
			const titleInput = screen.getByLabelText('Título del Post *') as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'New Post' } });

			// Add element
			const titleButton = screen.getAllByText('Título')[1];
			await fireEvent.click(titleButton);

			const submitButton = screen.getByText('Crear Post');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(modulePostService.createPost).toHaveBeenCalledWith({
					title: 'New Post',
					orderNumber: 1,
					moduleId: 'module-123'
				});
			});
		});

		it('should create elements after post creation', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			// Fill form
			const titleInput = screen.getByLabelText('Título del Post *') as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'New Post' } });

			// Add element
			const titleButton = screen.getAllByText('Título')[1];
			await fireEvent.click(titleButton);

			const submitButton = screen.getByText('Crear Post');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(postElementService.createElementsInBatch).toHaveBeenCalled();
			});
		});

		it('should dispatch created event on successful creation', async () => {
			const { component } = render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const createdSpy = vi.fn();
			component.$on('created', createdSpy);

			// Fill form
			const titleInput = screen.getByLabelText('Título del Post *') as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'New Post' } });

			// Add element
			const titleButton = screen.getAllByText('Título')[1];
			await fireEvent.click(titleButton);

			const submitButton = screen.getByText('Crear Post');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(createdSpy).toHaveBeenCalled();
			});
		});
	});

	describe('Submit - Edit Mode', () => {
		it('should call updatePost when submitting existing post', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123',
					post: mockPostDetail
				}
			});

			await waitFor(() => {
				const submitButton = screen.getByText('Actualizar Post');
				expect(submitButton).toBeInTheDocument();
			});

			const submitButton = screen.getByText('Actualizar Post');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(modulePostService.updatePost).toHaveBeenCalledWith(
					'post-123',
					expect.objectContaining({
						title: 'Test Post',
						orderNumber: 1
					})
				);
			});
		});

		it('should dispatch updated event on successful update', async () => {
			const { component } = render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123',
					post: mockPostDetail
				}
			});

			const updatedSpy = vi.fn();
			component.$on('updated', updatedSpy);

			await waitFor(() => {
				const submitButton = screen.getByText('Actualizar Post');
				expect(submitButton).toBeInTheDocument();
			});

			const submitButton = screen.getByText('Actualizar Post');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(updatedSpy).toHaveBeenCalled();
			}, { timeout: 3000 });
		});
	});

	describe('Loading States', () => {
		it('should disable submit button while saving', async () => {
			vi.mocked(modulePostService.createPost).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockPostDetail), 100))
			);

			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			// Fill form
			const titleInput = screen.getByLabelText('Título del Post *') as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'New Post' } });

			// Add element
			const titleButton = screen.getAllByText('Título')[1];
			await fireEvent.click(titleButton);

			const submitButton = screen.getByText('Crear Post') as HTMLButtonElement;
			await fireEvent.click(submitButton);

			expect(submitButton.disabled).toBe(true);
		});

		it('should show loading text while creating', async () => {
			vi.mocked(modulePostService.createPost).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockPostDetail), 100))
			);

			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			// Fill form
			const titleInput = screen.getByLabelText('Título del Post *') as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'New Post' } });

			// Add element
			const titleButton = screen.getAllByText('Título')[1];
			await fireEvent.click(titleButton);

			const submitButton = screen.getByText('Crear Post');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('Creando...')).toBeInTheDocument();
			});
		});

		it('should show loading text while updating', async () => {
			vi.mocked(modulePostService.updatePost).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve({}), 100))
			);

			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123',
					post: mockPostDetail
				}
			});

			await waitFor(() => {
				const submitButton = screen.getByText('Actualizar Post');
				expect(submitButton).toBeInTheDocument();
			});

			const submitButton = screen.getByText('Actualizar Post');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('Actualizando...')).toBeInTheDocument();
			});
		});

		it('should disable close button while saving', async () => {
			vi.mocked(modulePostService.createPost).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockPostDetail), 100))
			);

			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			// Fill form
			const titleInput = screen.getByLabelText('Título del Post *') as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'New Post' } });

			// Add element
			const titleButton = screen.getAllByText('Título')[1];
			await fireEvent.click(titleButton);

			const submitButton = screen.getByText('Crear Post');
			await fireEvent.click(submitButton);

			const closeButton = document.querySelector('.btn-close') as HTMLButtonElement;
			expect(closeButton.disabled).toBe(true);
		});
	});

	describe('Close Behavior', () => {
		it('should dispatch close event when cancel button clicked', async () => {
			const { component } = render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const closeSpy = vi.fn();
			component.$on('close', closeSpy);

			const cancelButton = screen.getByText('Cancelar');
			await fireEvent.click(cancelButton);

			expect(closeSpy).toHaveBeenCalled();
		});

		it('should dispatch close event when X button clicked', async () => {
			const { component } = render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const closeSpy = vi.fn();
			component.$on('close', closeSpy);

			const closeButton = document.querySelector('.btn-close') as HTMLElement;
			await fireEvent.click(closeButton);

			expect(closeSpy).toHaveBeenCalled();
		});

		it('should reset form when closed', async () => {
			const { component } = render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			// Fill form
			const titleInput = screen.getByLabelText('Título del Post *') as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'Test' } });

			const cancelButton = screen.getByText('Cancelar');
			await fireEvent.click(cancelButton);

			// Re-render
			component.$set({ visible: true });

			await waitFor(() => {
				const titleInputAfter = screen.getByLabelText('Título del Post *') as HTMLInputElement;
				expect(titleInputAfter.value).toBe('');
			});
		});
	});

	describe('File Limit Information', () => {
		it('should show 5GB limit for video elements', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const videoButton = screen.getByText('Video');
			await fireEvent.click(videoButton);

			await waitFor(() => {
				expect(screen.getByText('Películas completas permitidas (hasta 5GB)')).toBeInTheDocument();
			});
		});

		it('should show 500MB limit for audio elements', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const audioButton = screen.getByText('Audio');
			await fireEvent.click(audioButton);

			await waitFor(() => {
				expect(screen.getByText('Audios largos permitidos (hasta 500MB)')).toBeInTheDocument();
			});
		});

		it('should show 200MB limit for image elements', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const imageButton = screen.getByText('Imagen');
			await fireEvent.click(imageButton);

			await waitFor(() => {
				expect(screen.getByText('Imágenes de alta resolución (hasta 200MB)')).toBeInTheDocument();
			});
		});
	});

	describe('Drag and Drop', () => {
		it('should allow dragging elements', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			// Add 2 elements
			const titleButton = screen.getAllByText('Título')[1];
			await fireEvent.click(titleButton);
			await fireEvent.click(titleButton);

			await waitFor(() => {
				const elements = document.querySelectorAll('.element-block');
				expect(elements.length).toBe(2);
			});

			const firstElement = document.querySelectorAll('.element-block')[0] as HTMLElement;
			expect(firstElement).toHaveAttribute('draggable', 'true');
		});

		it('should render drag handle for each element', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const titleButton = screen.getAllByText('Título')[1];
			await fireEvent.click(titleButton);

			await waitFor(() => {
				const dragHandle = document.querySelector('.drag-handle');
				expect(dragHandle).toBeInTheDocument();
			});
		});
	});

	describe('Error Handling', () => {
		it('should show error message when creation fails', async () => {
			vi.mocked(modulePostService.createPost).mockRejectedValue(new Error('Network error'));

			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			// Fill form
			const titleInput = screen.getByLabelText('Título del Post *') as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'New Post' } });

			// Add element
			const titleButton = screen.getAllByText('Título')[1];
			await fireEvent.click(titleButton);

			const submitButton = screen.getByText('Crear Post');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/Error al crear el post/)).toBeInTheDocument();
			});
		});

		it('should show authentication error message', async () => {
			vi.mocked(modulePostService.createPost).mockRejectedValue(
				new Error('Authentication required')
			);

			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			// Fill form
			const titleInput = screen.getByLabelText('Título del Post *') as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'New Post' } });

			// Add element
			const titleButton = screen.getAllByText('Título')[1];
			await fireEvent.click(titleButton);

			const submitButton = screen.getByText('Crear Post');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.')).toBeInTheDocument();
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle post with all null multimedia paths', async () => {
			const postWithNulls = { ...mockPostDetail, imagePath: null, videoPath: null, audioPath: null };

			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123',
					post: postWithNulls
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Editar Post')).toBeInTheDocument();
			});
		});

		it('should handle very long title', async () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const longTitle = 'This is a very long title that should be handled properly'.repeat(5);
			const titleInput = screen.getByLabelText('Título del Post *') as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: longTitle } });

			expect(titleInput.value).toBe(longTitle);
		});

		it('should load elements when post changes', async () => {
			const { component } = render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123',
					post: null
				}
			});

			// Change post
			component.$set({ post: mockPostDetail });

			await waitFor(() => {
				expect(postElementService.getElementsByPostId).toHaveBeenCalledWith('post-123');
			});
		});

		it('should handle empty elements array from API', async () => {
			vi.mocked(postElementService.getElementsByPostId).mockResolvedValue([]);

			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123',
					post: mockPostDetail
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Agrega elementos para crear el contenido de tu post')).toBeInTheDocument();
			});
		});
	});

	describe('Accessibility', () => {
		it('should have proper label associations', () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			const titleInput = screen.getByLabelText('Título del Post *');
			expect(titleInput).toHaveAttribute('id', 'title');

			const orderInput = screen.getByLabelText('Orden *');
			expect(orderInput).toHaveAttribute('id', 'orderNumber');
		});

		it('should mark required fields with asterisk', () => {
			render(PostForm, {
				props: {
					visible: true,
					moduleId: 'module-123',
					materialApoyoId: 'material-123'
				}
			});

			expect(screen.getByText('Título del Post *')).toBeInTheDocument();
			expect(screen.getByText('Orden *')).toBeInTheDocument();
		});
	});
});
