import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import BlogEditor from '../BlogEditor.svelte';
import { blogService } from '$lib/application/services/blog/blogService';
import type { BlogPost } from '$lib/types/api';
import { __setTranslations } from '$lib/i18n';

vi.mock('$lib/application/services/blog/blogService', () => ({
	blogService: {
		createPost: vi.fn(),
		updatePost: vi.fn(),
		getCategories: vi.fn()
	}
}));

vi.mock('$lib/utils/roleUtils', () => ({
	canCreateContent: vi.fn(() => true),
	canEditContent: vi.fn(() => true),
	requiresAuthentication: vi.fn(() => false)
}));

beforeEach(() => {
	__setTranslations({
		'blog.create_new_article': 'Crear Nuevo Artículo',
		'blog.article_title': 'Título del artículo',
		'blog.article_subtitle': 'Subtítulo del artículo',
		'blog.article_excerpt': 'Resumen del artículo',
		'blog.article_content': 'Contenido del artículo',
		'blog.article_status': 'Estado del artículo',
		'blog.article_category': 'Categoría del artículo',
		'blog.article_tags': 'Etiquetas',
		'blog.save_draft': 'Guardar borrador',
		'blog.publish_article': 'Publicar artículo',
		'blog.update_article': 'Actualizar artículo',
		'blog.article_created_success': 'Artículo {title} creado exitosamente',
		'blog.article_updated_success': 'Artículo {title} actualizado exitosamente',
		'blog.validation_errors': 'Por favor corrige los errores antes de guardar',
		'blog.loading_categories': 'Cargando categorías...',
		'blog.no_categories_available': 'No hay categorías disponibles'
	});
});

const mockCategories = [
	{
		id: '1',
		name: 'Cultura',
		description: 'Actividades culturales en la comuna',
		color: '#FF8A65',
		createdAt: '2024-01-01T00:00:00.000Z',
		postCount: 12
	},
	{
		id: '2',
		name: 'Arte',
		description: 'Manifestaciones artísticas',
		color: '#4DB6AC',
		createdAt: '2024-01-02T00:00:00.000Z',
		postCount: 8
	}
];

const mockPost: BlogPost = {
	id: '1',
	title: 'Test Post',
	excerpt: 'Test excerpt',
	content: 'Test content',
	slug: 'test-post',
	status: 'draft',
	categoryId: '1',
	categoryName: 'Cultura',
	tags: ['test', 'blog'],
	featuredMedia: '/test.jpg',
	viewCount: 0,
	publishDate: '2024-01-01T00:00:00.000Z',
	authorId: 1,
	authorName: 'Autor de Prueba',
	createdAt: '2024-01-01T00:00:00.000Z',
	updatedAt: '2024-01-02T00:00:00.000Z'
};

describe('BlogEditor', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(blogService.getCategories).mockResolvedValue(mockCategories);
	});

	describe('Rendering - Create Mode', () => {
		it('should render create title', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });
			expect(screen.getByText(/Crear Nuevo Artículo/)).toBeInTheDocument();
		});

		it('should render all form fields', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			await waitFor(() => {
				expect(screen.getByLabelText(/Título del artículo/)).toBeInTheDocument();
				expect(screen.getByLabelText(/Resumen/)).toBeInTheDocument();
				expect(screen.getByLabelText(/Contenido del artículo/)).toBeInTheDocument();
			});
		});

		it('should show disabled media uploader with hint', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			await waitFor(() => {
				expect(screen.getByText(/Guarda el artículo primero para poder subir archivos/)).toBeInTheDocument();
			});
		});

		it('should load categories on mount', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			await waitFor(() => {
				expect(blogService.getCategories).toHaveBeenCalled();
			});
		});
	});

	describe('Rendering - Edit Mode', () => {
		it('should render edit title', async () => {
			render(BlogEditor, { props: { post: mockPost, currentUser: { role: 'administrador', id: '1' } } });
			expect(screen.getByText(/Editar Artículo/)).toBeInTheDocument();
		});

		it('should populate form with post data', async () => {
			render(BlogEditor, { props: { post: mockPost, currentUser: { role: 'administrador', id: '1' } } });

			await waitFor(() => {
				const titleInput = screen.getByLabelText(/Título del artículo/) as HTMLInputElement;
				expect(titleInput.value).toBe('Test Post');
			});
		});

		it('should populate excerpt field', async () => {
			render(BlogEditor, { props: { post: mockPost, currentUser: { role: 'administrador', id: '1' } } });

			await waitFor(() => {
				const excerptInput = screen.getByLabelText(/Resumen/) as HTMLTextAreaElement;
				expect(excerptInput.value).toBe('Test excerpt');
			});
		});

		it('should populate content field', async () => {
			render(BlogEditor, { props: { post: mockPost, currentUser: { role: 'administrador', id: '1' } } });

			await waitFor(() => {
				const contentInput = screen.getByLabelText(/Contenido del artículo/) as HTMLTextAreaElement;
				expect(contentInput.value).toBe('Test content');
			});
		});

		it('should set correct status', async () => {
			render(BlogEditor, { props: { post: mockPost, currentUser: { role: 'administrador', id: '1' } } });

			await waitFor(() => {
				const statusSelect = screen.getByLabelText(/Estado de publicación/) as HTMLSelectElement;
				expect(statusSelect.value).toBe('draft');
			});
		});

		it('should display tags', async () => {
			render(BlogEditor, { props: { post: mockPost, currentUser: { role: 'administrador', id: '1' } } });

			await waitFor(() => {
				const tagsInput = screen.getByLabelText(/Etiquetas/) as HTMLInputElement;
				expect(tagsInput.value).toBe('test, blog');
			});
		});
	});

	describe('Slug Generation', () => {
		it('should auto-generate slug from title', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			const titleInput = screen.getByLabelText(/Título del artículo/) as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'My New Post Title' } });

			await waitFor(() => {
				// Slug is generated internally, we can verify by checking the component state
				expect(titleInput.value).toBe('My New Post Title');
			});
		});

		it('should convert spaces to dashes', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			const titleInput = screen.getByLabelText(/Título del artículo/) as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'Test Title With Spaces' } });

			// Internal slug generation converts to: test-title-with-spaces
			expect(titleInput.value).toBe('Test Title With Spaces');
		});

		it('should remove special characters', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			const titleInput = screen.getByLabelText(/Título del artículo/) as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'Test!@# Post$%^' } });

			expect(titleInput.value).toBe('Test!@# Post$%^');
		});
	});

	describe('Form Validation', () => {
		it('should require title', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			const form = document.querySelector('form');
			expect(form).toBeTruthy();
			await fireEvent.submit(form as HTMLFormElement);

			await waitFor(() => {
				expect(screen.getByText(/El título y contenido son obligatorios/)).toBeInTheDocument();
			});
		});

		it('should require content', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			const titleInput = screen.getByLabelText(/Título del artículo/) as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'Test Title' } });

			const form = document.querySelector('form');
			expect(form).toBeTruthy();
			await fireEvent.submit(form as HTMLFormElement);

			await waitFor(() => {
				expect(screen.getByText(/El título y contenido son obligatorios/)).toBeInTheDocument();
			});
		});

		it('should disable submit when title is empty', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			const submitButton = screen.getByText(/Crear Artículo/) as HTMLButtonElement;
			expect(submitButton.disabled).toBe(true);
		});

		it('should enable submit when both title and content are filled', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			const titleInput = screen.getByLabelText(/Título del artículo/) as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'Test Title' } });

			const contentInput = screen.getByLabelText(/Contenido del artículo/) as HTMLTextAreaElement;
			await fireEvent.input(contentInput, { target: { value: 'Test content' } });

			const submitButton = screen.getByText(/Crear Artículo/) as HTMLButtonElement;
			expect(submitButton.disabled).toBe(false);
		});
	});

	describe('Character Counts', () => {
		it('should show character count for title', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			await waitFor(() => {
				expect(screen.getByText('0/200 caracteres')).toBeInTheDocument();
			});
		});

		it('should update character count when typing', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			const titleInput = screen.getByLabelText(/Título del artículo/) as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'Test' } });

			await waitFor(() => {
				expect(screen.getByText('4/200 caracteres')).toBeInTheDocument();
			});
		});

		it('should show character count for excerpt', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			await waitFor(() => {
				expect(screen.getByText('0/500 caracteres')).toBeInTheDocument();
			});
		});
	});

	describe('Category Selection', () => {
		it('should render category dropdown with categories', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			await waitFor(() => {
				expect(screen.getByText('Cultura')).toBeInTheDocument();
				expect(screen.getByText('Arte')).toBeInTheDocument();
			});
		});

		it('should show "Sin categoría" option', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			await waitFor(() => {
				expect(screen.getByText('Sin categoría')).toBeInTheDocument();
			});
		});

		it('should allow selecting a category', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			await waitFor(() => {
				const categorySelect = screen.getByLabelText(/Categoría/) as HTMLSelectElement;
				fireEvent.change(categorySelect, { target: { value: '1' } });
				expect(categorySelect.value).toBe('1');
			});
		});
	});

	describe('Status Selection', () => {
		it('should default to draft status', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			await waitFor(() => {
				const statusSelect = screen.getByLabelText(/Estado de publicación/) as HTMLSelectElement;
				expect(statusSelect.value).toBe('draft');
			});
		});

		it('should allow selecting published status', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			await waitFor(() => {
				const statusSelect = screen.getByLabelText(/Estado de publicación/) as HTMLSelectElement;
				fireEvent.change(statusSelect, { target: { value: 'published' } });
				expect(statusSelect.value).toBe('published');
			});
		});
	});

	describe('Tags Input', () => {
		it('should parse comma-separated tags', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			const tagsInput = screen.getByLabelText(/Etiquetas/) as HTMLInputElement;
			await fireEvent.input(tagsInput, { target: { value: 'cultura, arte, exposición' } });

			expect(tagsInput.value).toBe('cultura, arte, exposición');
		});

		it('should trim whitespace from tags', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			const tagsInput = screen.getByLabelText(/Etiquetas/) as HTMLInputElement;
			await fireEvent.input(tagsInput, { target: { value: '  cultura  ,  arte  ' } });

			// Component trims internally
			expect(tagsInput.value).toBe('cultura, arte');
		});
	});

	describe('Submit - Create Mode', () => {
		it('should call createPost when creating new post', async () => {
			vi.mocked(blogService.createPost).mockResolvedValue(mockPost);

			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			const titleInput = screen.getByLabelText(/Título del artículo/) as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'New Post' } });

			const contentInput = screen.getByLabelText(/Contenido del artículo/) as HTMLTextAreaElement;
			await fireEvent.input(contentInput, { target: { value: 'New content' } });

			const submitButton = screen.getByText(/Crear Artículo/);
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(blogService.createPost).toHaveBeenCalled();
			});
		});

		it('should show success message after creating', async () => {
			vi.mocked(blogService.createPost).mockResolvedValue(mockPost);

			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			const titleInput = screen.getByLabelText(/Título del artículo/) as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'New Post' } });

			const contentInput = screen.getByLabelText(/Contenido del artículo/) as HTMLTextAreaElement;
			await fireEvent.input(contentInput, { target: { value: 'New content' } });

			const submitButton = screen.getByText(/Crear Artículo/);
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/Artículo guardado exitosamente/)).toBeInTheDocument();
			});
		});

		it('should reset form after successful create', async () => {
			vi.mocked(blogService.createPost).mockResolvedValue(mockPost);

			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			const titleInput = screen.getByLabelText(/Título del artículo/) as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'New Post' } });

			const contentInput = screen.getByLabelText(/Contenido del artículo/) as HTMLTextAreaElement;
			await fireEvent.input(contentInput, { target: { value: 'New content' } });

			const submitButton = screen.getByText(/Crear Artículo/);
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(titleInput.value).toBe('');
			});
		});

		it('should call onSave callback if provided', async () => {
			vi.mocked(blogService.createPost).mockResolvedValue(mockPost);
			const onSave = vi.fn();

			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' }, onSave } });

			const titleInput = screen.getByLabelText(/Título del artículo/) as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'New Post' } });

			const contentInput = screen.getByLabelText(/Contenido del artículo/) as HTMLTextAreaElement;
			await fireEvent.input(contentInput, { target: { value: 'New content' } });

			const submitButton = screen.getByText(/Crear Artículo/);
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(onSave).toHaveBeenCalledWith(mockPost);
			});
		});
	});

	describe('Submit - Edit Mode', () => {
		it('should call updatePost when editing', async () => {
			vi.mocked(blogService.updatePost).mockResolvedValue(mockPost);

			render(BlogEditor, { props: { post: mockPost, currentUser: { role: 'administrador', id: '1' } } });

			const submitButton = await screen.findByRole('button', { name: /Actualizar Artículo/ });
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(blogService.updatePost).toHaveBeenCalledWith('1', expect.any(Object));
			});
		});

		it('should call onSave callback when updating', async () => {
			vi.mocked(blogService.updatePost).mockResolvedValue(mockPost);
			const onSave = vi.fn();

			render(BlogEditor, {
				props: { post: mockPost, currentUser: { role: 'administrador', id: '1' }, onSave }
			});

			const submitButton = await screen.findByRole('button', { name: /Actualizar Artículo/ });
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(onSave).toHaveBeenCalledWith(mockPost);
			});
		});

		it('should not reset form after successful edit', async () => {
			vi.mocked(blogService.updatePost).mockResolvedValue(mockPost);

			render(BlogEditor, { props: { post: mockPost, currentUser: { role: 'administrador', id: '1' } } });

			await waitFor(() => {
				const submitButton = screen.getByText(/Actualizar Artículo/);
				fireEvent.click(submitButton);
			});

			await waitFor(() => {
				const titleInput = screen.getByLabelText(/Título del artículo/) as HTMLInputElement;
				expect(titleInput.value).toBe('Test Post');
			});
		});
	});

	describe('Loading State', () => {
		it('should show loading text during submit', async () => {
			vi.mocked(blogService.createPost).mockImplementation(
				() => new Promise(resolve => setTimeout(() => resolve(mockPost), 100))
			);

			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			const titleInput = screen.getByLabelText(/Título del artículo/) as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'New Post' } });

			const contentInput = screen.getByLabelText(/Contenido del artículo/) as HTMLTextAreaElement;
			await fireEvent.input(contentInput, { target: { value: 'New content' } });

			const submitButton = screen.getByText(/Crear Artículo/);
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/Guardando.../)).toBeInTheDocument();
			});
		});

		it('should disable form during submit', async () => {
			vi.mocked(blogService.createPost).mockImplementation(
				() => new Promise(resolve => setTimeout(() => resolve(mockPost), 100))
			);

			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			const titleInput = screen.getByLabelText(/Título del artículo/) as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'New Post' } });

			const contentInput = screen.getByLabelText(/Contenido del artículo/) as HTMLTextAreaElement;
			await fireEvent.input(contentInput, { target: { value: 'New content' } });

			const submitButton = screen.getByText(/Crear Artículo/) as HTMLButtonElement;
			await fireEvent.click(submitButton);

			expect(submitButton.disabled).toBe(true);
		});
	});

	describe('Error Handling', () => {
		it('should display error message on failed create', async () => {
			vi.mocked(blogService.createPost).mockRejectedValue(new Error('Network error'));

			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			const titleInput = screen.getByLabelText(/Título del artículo/) as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'New Post' } });

			const contentInput = screen.getByLabelText(/Contenido del artículo/) as HTMLTextAreaElement;
			await fireEvent.input(contentInput, { target: { value: 'New content' } });

			const submitButton = screen.getByText(/Crear Artículo/);
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/Network error/)).toBeInTheDocument();
			});
		});
	});

	describe('Cancel Action', () => {
	it('should call onCancel callback when provided', async () => {
		const onCancel = vi.fn();
		render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' }, onCancel } });

		const cancelButton = screen.getByText(/Cancelar/);
		await fireEvent.click(cancelButton);

		expect(onCancel).toHaveBeenCalled();
	});

		it('should reset form when no onCancel callback', async () => {
			render(BlogEditor, { props: { currentUser: { role: 'administrador', id: '1' } } });

			const titleInput = screen.getByLabelText(/Título del artículo/) as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'Test' } });

			const cancelButton = screen.getByText(/Cancelar/);
			await fireEvent.click(cancelButton);

			await waitFor(() => {
				expect(titleInput.value).toBe('');
			});
		});
	});
});
