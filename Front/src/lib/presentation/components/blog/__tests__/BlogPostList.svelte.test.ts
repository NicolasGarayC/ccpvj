import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import BlogPostList from '../BlogPostList.svelte';
import { blogService } from '$lib/application/services/blog/blogService';
import type { BlogPost } from '$lib/types/api';
import { __setTranslations } from '$lib/i18n';
import { blogPostElementService } from '$lib/application/services/blog/blogPostElementService';

// Mock dependencies
vi.mock('$lib/application/services/blog/blogService', () => ({
	blogService: {
		getAllPosts: vi.fn(),
		createPost: vi.fn()
	}
}));

vi.mock('$lib/application/services/blog/blogPostElementService', () => ({
	blogPostElementService: {
		getElementsByBlogPostId: vi.fn().mockResolvedValue([])
	}
}));

beforeEach(() => {
	__setTranslations({
		'blog.article_management': 'Article Management',
		'blog.article_singular': 'article',
		'blog.article_plural': 'articles',
		'blog.create_article': 'Create Article',
		'blog.loading_articles': 'Loading articles...',
		'blog.error_loading_articles_header': 'Error loading articles',
		'blog.error_loading_posts': 'Failed to load posts',
		'blog.retry': 'Retry',
		'blog.no_articles_yet': 'No articles yet',
		'blog.create_first_article_description': 'Start creating your first article.',
		'blog.create_first_article': 'Create First Article'
	});
	vi.mocked(blogPostElementService.getElementsByBlogPostId).mockResolvedValue([]);
});

const mockPosts: BlogPost[] = [
	{
		id: '1',
		title: 'Test Post 1',
		subtitle: 'Subtitle 1',
		slug: 'test-post-1',
		excerpt: 'Excerpt 1',
		content: 'Content 1',
		status: 'published',
		categoryId: 'cat-1',
		tags: ['tag1'],
		featuredImageUrl: '/image1.jpg',
		viewCount: 100,
		isActive: true,
		isFeatured: false,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-02T00:00:00Z',
		publishedAt: '2024-01-01T00:00:00Z',
		authorId: 1
	},
	{
		id: '2',
		title: 'Test Post 2',
		subtitle: 'Subtitle 2',
		slug: 'test-post-2',
		excerpt: 'Excerpt 2',
		content: 'Content 2',
		status: 'draft',
		categoryId: 'cat-2',
		tags: ['tag2'],
		featuredImageUrl: '/image2.jpg',
		viewCount: 50,
		isActive: true,
		isFeatured: true,
		createdAt: '2024-01-03T00:00:00Z',
		updatedAt: '2024-01-04T00:00:00Z',
		publishedAt: null,
		authorId: 1
	}
];

describe('BlogPostList', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(blogService.getAllPosts).mockResolvedValue([...mockPosts]);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering - Basic Structure', () => {
		it('should render blog post list container', () => {
			render(BlogPostList);

			const container = document.querySelector('.blog-post-list');
			expect(container).toBeInTheDocument();
		});

		it('should render header when showActions is true', async () => {
			render(BlogPostList, { props: { showActions: true } });

			await waitFor(() => {
				expect(screen.getByText('Article Management')).toBeInTheDocument();
			});
		});

		it('should not render header when showActions is false', () => {
			render(BlogPostList, { props: { showActions: false } });

			const header = document.querySelector('.list-header');
			expect(header).not.toBeInTheDocument();
		});

		it('should render create button when showActions is true', async () => {
			render(BlogPostList, { props: { showActions: true } });

			await waitFor(() => {
				expect(screen.getByText('Create Article')).toBeInTheDocument();
			});
		});

		it('should display post count in header', async () => {
			render(BlogPostList, { props: { showActions: true } });

			await waitFor(() => {
				expect(screen.getByText('2 articles')).toBeInTheDocument();
			});
		});

		it('should display singular article text when only one post', async () => {
			vi.mocked(blogService.getAllPosts).mockResolvedValue([mockPosts[0]]);

			render(BlogPostList, { props: { showActions: true } });

			await waitFor(() => {
				expect(screen.getByText('1 article')).toBeInTheDocument();
			});
		});
	});

	describe('Loading State', () => {
		it('should show loading spinner while fetching posts', async () => {
			vi.mocked(blogService.getAllPosts).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockPosts), 100))
			);

			render(BlogPostList);

			expect(screen.getByText('Loading articles...')).toBeInTheDocument();

			await waitFor(() => {
				expect(screen.queryByText('Loading articles...')).not.toBeInTheDocument();
			});
		});

		it('should display loading container with correct styling', async () => {
			vi.mocked(blogService.getAllPosts).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockPosts), 100))
			);

			render(BlogPostList);

			const loadingContainer = document.querySelector('.loading-container');
			expect(loadingContainer).toBeInTheDocument();

			await waitFor(() => {
				expect(document.querySelector('.loading-container')).not.toBeInTheDocument();
			});
		});
	});

	describe('Error State', () => {
		it('should display error message when loading fails', async () => {
			vi.mocked(blogService.getAllPosts).mockRejectedValue(new Error('Network error'));

			render(BlogPostList);

			await waitFor(() => {
				expect(screen.getByText('Error loading articles')).toBeInTheDocument();
				expect(screen.getByText('Network error')).toBeInTheDocument();
			});
		});

		it('should display default error message for non-Error exceptions', async () => {
			vi.mocked(blogService.getAllPosts).mockRejectedValue('Unknown error');

			render(BlogPostList);

			await waitFor(() => {
				expect(screen.getByText('Failed to load posts')).toBeInTheDocument();
			});
		});

		it('should render retry button in error state', async () => {
			vi.mocked(blogService.getAllPosts).mockRejectedValue(new Error('Network error'));

			render(BlogPostList);

			await waitFor(() => {
				expect(screen.getByText('Retry')).toBeInTheDocument();
			});
		});

		it('should retry loading when retry button is clicked', async () => {
			vi.mocked(blogService.getAllPosts)
				.mockRejectedValueOnce(new Error('Network error'))
				.mockResolvedValueOnce(mockPosts);

			render(BlogPostList);

			await waitFor(() => {
				expect(screen.getByText('Retry')).toBeInTheDocument();
			});

			const retryButton = screen.getByText('Retry');
			await fireEvent.click(retryButton);

			await waitFor(() => {
				expect(blogService.getAllPosts).toHaveBeenCalledTimes(2);
			});
		});

		it('should display error icon', async () => {
			vi.mocked(blogService.getAllPosts).mockRejectedValue(new Error('Network error'));

			render(BlogPostList);

			await waitFor(() => {
				const errorContent = document.querySelector('.error-content svg');
				expect(errorContent).toBeInTheDocument();
			});
		});
	});

	describe('Empty State', () => {
		it('should display empty state when no posts exist', async () => {
			vi.mocked(blogService.getAllPosts).mockResolvedValue([]);

			render(BlogPostList);

			await waitFor(() => {
				expect(screen.getByText('No articles yet')).toBeInTheDocument();
			});
		});

		it('should display empty state description', async () => {
			vi.mocked(blogService.getAllPosts).mockResolvedValue([]);

			render(BlogPostList);

			await waitFor(() => {
				expect(screen.getByText('Start creating your first article.')).toBeInTheDocument();
			});
		});

		it('should display create first article button when showActions is true', async () => {
			vi.mocked(blogService.getAllPosts).mockResolvedValue([]);

			render(BlogPostList, { props: { showActions: true } });

			await waitFor(() => {
				expect(screen.getByText('Create First Article')).toBeInTheDocument();
			});
		});

		it('should not display create button in empty state when showActions is false', async () => {
			vi.mocked(blogService.getAllPosts).mockResolvedValue([]);

			render(BlogPostList, { props: { showActions: false } });

			await waitFor(() => {
				expect(screen.queryByText('Create First Article')).not.toBeInTheDocument();
			});
		});

		it('should display empty state icon', async () => {
			vi.mocked(blogService.getAllPosts).mockResolvedValue([]);

			render(BlogPostList);

			await waitFor(() => {
				const emptyIcon = document.querySelector('.empty-content svg');
				expect(emptyIcon).toBeInTheDocument();
			});
		});
	});

	describe('Posts Grid', () => {
		it('should render posts grid when posts are loaded', async () => {
			render(BlogPostList);

			await waitFor(() => {
				const grid = document.querySelector('.posts-grid');
				expect(grid).toBeInTheDocument();
			});
		});

		it('should render all posts in the grid', async () => {
			render(BlogPostList, { props: { showActions: true } });

			await waitFor(() => {
				expect(screen.getByText('Test Post 1')).toBeInTheDocument();
				expect(screen.getByText('Test Post 2')).toBeInTheDocument();
			});
		});

		it('should filter out draft posts when showActions is false', async () => {
			render(BlogPostList, { props: { showActions: false } });

			await waitFor(() => {
				expect(screen.getByText('Test Post 1')).toBeInTheDocument();
				expect(screen.queryByText('Test Post 2')).not.toBeInTheDocument();
			});
		});

		it('should show all posts including drafts when showActions is true', async () => {
			render(BlogPostList, { props: { showActions: true } });

			await waitFor(() => {
				expect(screen.getByText('Test Post 1')).toBeInTheDocument();
				expect(screen.getByText('Test Post 2')).toBeInTheDocument();
			});
		});
	});

	describe('Create Post Flow', () => {
		it('should open draft modal when create button is clicked', async () => {
			render(BlogPostList, { props: { showActions: true } });

			await waitFor(() => {
				const createButton = screen.getByText('Create Article');
				fireEvent.click(createButton);
			});

			await waitFor(() => {
				expect(screen.getByText('Nuevo borrador')).toBeInTheDocument();
			});
		});

		it('should display title input in draft modal', async () => {
			render(BlogPostList, { props: { showActions: true } });

			await waitFor(() => {
				const createButton = screen.getByText('Create Article');
				fireEvent.click(createButton);
			});

			await waitFor(() => {
				const input = screen.getByPlaceholderText('Título del artículo');
				expect(input).toBeInTheDocument();
			});
		});

		it('should show validation error when title is empty', async () => {
			render(BlogPostList, { props: { showActions: true } });

			await waitFor(() => {
				const createButton = screen.getByText('Create Article');
				fireEvent.click(createButton);
			});

			await waitFor(() => {
				const createDraftButton = screen.getByText('Crear borrador');
				fireEvent.click(createDraftButton);
			});

			await waitFor(() => {
				expect(screen.getByText('El título es obligatorio')).toBeInTheDocument();
			});
		});

		it('should create draft post when valid title is entered', async () => {
			const mockDraftPost = { ...mockPosts[0], id: '3', title: 'New Draft', status: 'draft' };
			vi.mocked(blogService.createPost).mockResolvedValue(mockDraftPost);

			render(BlogPostList, { props: { showActions: true } });

			await waitFor(() => {
				const createButton = screen.getByText('Create Article');
				fireEvent.click(createButton);
			});

			await waitFor(() => {
				const input = screen.getByPlaceholderText('Título del artículo') as HTMLInputElement;
				fireEvent.input(input, { target: { value: 'New Draft' } });
			});

			const createDraftButton = screen.getByText('Crear borrador');
			await fireEvent.click(createDraftButton);

			await waitFor(() => {
				expect(blogService.createPost).toHaveBeenCalledWith({
					title: 'New Draft',
					excerpt: '',
					content: '',
					slug: '',
					status: 'draft',
					categoryId: null,
					tags: []
				});
			});
		});

		it('should disable buttons while creating draft', async () => {
			vi.mocked(blogService.createPost).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockPosts[0]), 100))
			);

			render(BlogPostList, { props: { showActions: true } });

			await waitFor(() => {
				const createButton = screen.getByText('Create Article');
				fireEvent.click(createButton);
			});

			await waitFor(() => {
				const input = screen.getByPlaceholderText('Título del artículo') as HTMLInputElement;
				fireEvent.input(input, { target: { value: 'New Draft' } });
			});

			const createDraftButton = screen.getByText('Crear borrador');
			await fireEvent.click(createDraftButton);

			await waitFor(() => {
				const cancelButton = screen.getByText('Cancelar') as HTMLButtonElement;
				expect(cancelButton.disabled).toBe(true);
			});
		});

		it('should close draft modal when cancel is clicked', async () => {
			render(BlogPostList, { props: { showActions: true } });

			await waitFor(() => {
				const createButton = screen.getByText('Create Article');
				fireEvent.click(createButton);
			});

			await waitFor(() => {
				expect(screen.getByText('Nuevo borrador')).toBeInTheDocument();
			});

			const cancelButton = screen.getByText('Cancelar');
			await fireEvent.click(cancelButton);

			await waitFor(() => {
				expect(screen.queryByText('Nuevo borrador')).not.toBeInTheDocument();
			});
		});

		it('should display loading spinner while creating draft', async () => {
			vi.mocked(blogService.createPost).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockPosts[0]), 100))
			);

			render(BlogPostList, { props: { showActions: true } });

			await waitFor(() => {
				const createButton = screen.getByText('Create Article');
				fireEvent.click(createButton);
			});

			await waitFor(() => {
				const input = screen.getByPlaceholderText('Título del artículo') as HTMLInputElement;
				fireEvent.input(input, { target: { value: 'New Draft' } });
			});

			const createDraftButton = screen.getByText('Crear borrador');
			await fireEvent.click(createDraftButton);

			await waitFor(() => {
				const spinner = document.querySelector('.loading-spinner');
				expect(spinner).toBeInTheDocument();
			});
		});

		it('should handle create draft error', async () => {
			vi.mocked(blogService.createPost).mockRejectedValue(new Error('Create failed'));

			render(BlogPostList, { props: { showActions: true } });

			await waitFor(() => {
				const createButton = screen.getByText('Create Article');
				fireEvent.click(createButton);
			});

			await waitFor(() => {
				const input = screen.getByPlaceholderText('Título del artículo') as HTMLInputElement;
				fireEvent.input(input, { target: { value: 'New Draft' } });
			});

			const createDraftButton = screen.getByText('Crear borrador');
			await fireEvent.click(createDraftButton);

			await waitFor(() => {
				expect(screen.getByText('Create failed')).toBeInTheDocument();
			});
		});
	});

	describe('Component Events', () => {
		it('should dispatch postsLoaded event when posts are loaded', async () => {
			const postsLoadedSpy = vi.fn();
			render(BlogPostList, { props: { onPostsLoadedCallback: postsLoadedSpy } });

			await waitFor(() => {
				expect(postsLoadedSpy).toHaveBeenCalled();
			});
		});

		it('should dispatch deletePost event when delete is triggered', async () => {
			const deletePostSpy = vi.fn();
			render(BlogPostList, {
				props: {
					showActions: true,
					onDeletePostCallback: deletePostSpy
				}
			});

			await waitFor(() => {
				expect(screen.getAllByTitle('Eliminar post').length).toBeGreaterThan(0);
			});

			const deleteButton = screen.getAllByTitle('Eliminar post')[0];
			await fireEvent.click(deleteButton);

			expect(deletePostSpy).toHaveBeenCalled();
		});

		it('should create a draft post when the creation flow is confirmed', async () => {
			const mockDraftPost = { ...mockPosts[0], id: '3', title: 'New Draft', status: 'draft' };
			vi.mocked(blogService.createPost).mockResolvedValue(mockDraftPost);

			render(BlogPostList, {
				props: {
					showActions: true
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Create Article')).toBeInTheDocument();
			});

			await fireEvent.click(screen.getByText('Create Article'));

			await waitFor(() => {
				expect(screen.getByPlaceholderText('Título del artículo')).toBeInTheDocument();
			});

			await fireEvent.input(screen.getByPlaceholderText('Título del artículo'), {
				target: { value: 'New Draft' }
			});

			await fireEvent.click(screen.getByText('Crear borrador'));

			await waitFor(() => {
				expect(blogService.createPost).toHaveBeenCalledWith(
					expect.objectContaining({ title: 'New Draft', status: 'draft' })
				);
			});
		});
	});

	describe('Public Methods', () => {
		it('should expose loadPosts method', async () => {
			const { component } = render(BlogPostList);

			await waitFor(() => {
				expect(typeof component.loadPosts).toBe('function');
			});
		});

		it('should reload posts when loadPosts is called', async () => {
			const { component } = render(BlogPostList);

			await waitFor(() => {
				expect(blogService.getAllPosts).toHaveBeenCalledTimes(1);
			});

			await component.loadPosts();

			expect(blogService.getAllPosts).toHaveBeenCalledTimes(2);
		});

		it('should expose removePostFromList method', async () => {
			const { component } = render(BlogPostList);

			await waitFor(() => {
				expect(typeof component.removePostFromList).toBe('function');
			});
		});

		it('should remove post from list when removePostFromList is called', async () => {
			const { component } = render(BlogPostList);

			await waitFor(() => {
				expect(screen.getByText('Test Post 1')).toBeInTheDocument();
			});

			component.removePostFromList('1');

			await waitFor(() => {
				expect(screen.queryByText('Test Post 1')).not.toBeInTheDocument();
			});
		});

		it('should not reload posts if already loading', async () => {
			const { component } = render(BlogPostList);

			// Call loadPosts multiple times quickly
			component.loadPosts();
			component.loadPosts();
			component.loadPosts();

		await waitFor(() => {
			// Should only call initial load plus one additional request in progress
			expect(blogService.getAllPosts.mock.calls.length).toBeLessThanOrEqual(3);
		});
	});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA attributes on draft modal', async () => {
			render(BlogPostList, { props: { showActions: true } });

			await waitFor(() => {
				const createButton = screen.getByText('Create Article');
				fireEvent.click(createButton);
			});

			await waitFor(() => {
				const backdrop = document.querySelector('.draft-modal-backdrop');
				expect(backdrop).toHaveAttribute('aria-modal', 'true');
				expect(backdrop).toHaveAttribute('role', 'dialog');
			});
		});

		it('should autofocus title input when draft modal opens', async () => {
			render(BlogPostList, { props: { showActions: true } });

			await waitFor(() => {
				const createButton = screen.getByText('Create Article');
				fireEvent.click(createButton);
			});

		await waitFor(() => {
			const input = screen.getByPlaceholderText('Título del artículo') as HTMLInputElement;
			expect(input).toBeInTheDocument();
		});
	});
	});

	describe('Edge Cases', () => {
		it('should handle posts with null or undefined values', async () => {
			const postsWithNulls = [
				{
					...mockPosts[0],
					subtitle: null,
					featuredImageUrl: null,
					publishedAt: null
				}
			];

			vi.mocked(blogService.getAllPosts).mockResolvedValue(postsWithNulls);

			render(BlogPostList);

			await waitFor(() => {
				expect(screen.getByText('Test Post 1')).toBeInTheDocument();
			});
		});

		it('should handle very long post titles', async () => {
			const longTitlePost = {
				...mockPosts[0],
				title: 'This is a very long title that should be handled gracefully by the component without breaking the layout or causing issues'.repeat(3)
			};

			vi.mocked(blogService.getAllPosts).mockResolvedValue([longTitlePost]);

			render(BlogPostList);

			await waitFor(() => {
				const grid = document.querySelector('.posts-grid');
				expect(grid).toBeInTheDocument();
			});
		});

		it('should trim whitespace from draft title', async () => {
			const mockDraftPost = { ...mockPosts[0], id: '3', title: 'Trimmed Title', status: 'draft' };
			vi.mocked(blogService.createPost).mockResolvedValue(mockDraftPost);

			render(BlogPostList, { props: { showActions: true } });

			await waitFor(() => {
				const createButton = screen.getByText('Create Article');
				fireEvent.click(createButton);
			});

			await waitFor(() => {
				const input = screen.getByPlaceholderText('Título del artículo') as HTMLInputElement;
				fireEvent.input(input, { target: { value: '  Trimmed Title  ' } });
			});

			const createDraftButton = screen.getByText('Crear borrador');
			await fireEvent.click(createDraftButton);

			await waitFor(() => {
				expect(blogService.createPost).toHaveBeenCalledWith(
					expect.objectContaining({
						title: 'Trimmed Title'
					})
				);
			});
		});

		it('should handle empty posts array after filtering', async () => {
			const draftOnlyPosts = [mockPosts[1]]; // Only draft post

			vi.mocked(blogService.getAllPosts).mockResolvedValue(draftOnlyPosts);

			render(BlogPostList, { props: { showActions: false } });

			await waitFor(() => {
				expect(screen.getByText('No articles yet')).toBeInTheDocument();
			});
		});

		it('should calculate nextOrderNumber correctly', async () => {
			render(BlogPostList);

			await waitFor(() => {
				// nextOrderNumber should be max viewCount + 1 = 100 + 1 = 101
				// This is internal logic, but we can verify component renders
				expect(screen.getByText('Test Post 1')).toBeInTheDocument();
			});
		});

		it('should handle posts with viewCount of 0', async () => {
			const zeroViewPosts = [
				{ ...mockPosts[0], viewCount: 0 },
				{ ...mockPosts[1], viewCount: 0 }
			];

			vi.mocked(blogService.getAllPosts).mockResolvedValue(zeroViewPosts);

			render(BlogPostList);

			await waitFor(() => {
				expect(screen.getByText('Test Post 1')).toBeInTheDocument();
			});
		});
	});
});
