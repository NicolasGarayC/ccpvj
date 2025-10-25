import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import BlogPostCard from '../BlogPostCard.svelte';
import type { BlogPost } from '$lib/types/api';
import { __setTranslations } from '$lib/i18n';
import { blogPostElementService } from '$lib/application/services/blog/blogPostElementService';

// Mock mediaUtils
vi.mock('$lib/utils/mediaUtils', () => ({
	getBlogMediaUrl: vi.fn((path: string) => `/media/blog/${path}`),
	getUntrackedMediaUrl: vi.fn((path: string) => `/media/${path}`)
}));

// Mock blogPostElementService
vi.mock('$lib/application/services/blog/blogPostElementService', () => ({
	blogPostElementService: {
		getElementsByBlogPostId: vi.fn()
	}
}));

describe('BlogPostCard', () => {
	const mockPost: BlogPost = {
		id: '1',
		title: 'Test Blog Post',
		slug: 'test-blog-post',
		excerpt: 'This is a test excerpt for the blog post',
		content: 'Full content here',
		authorName: 'John Doe',
		authorId: 1,
		publishDate: new Date('2025-01-15').toISOString(),
		status: 'published',
		featuredMedia: undefined,
		tags: ['test', 'vitest'],
		categoryId: undefined,
		createdAt: new Date('2025-01-10').toISOString(),
		updatedAt: new Date('2025-01-15').toISOString()
	};

	beforeEach(() => {
		__setTranslations({
			readMore: 'Leer más',
			videoNotSupported: 'Tu navegador no soporta video.',
			newsPost: 'Artículo'
		});
		vi.clearAllMocks();
		vi.mocked(blogPostElementService.getElementsByBlogPostId).mockResolvedValue([]);
	});

	describe('Rendering', () => {
		it('should render blog post with basic information', () => {
			render(BlogPostCard, { props: { post: mockPost } });

			expect(screen.getByText('Test Blog Post')).toBeInTheDocument();
			expect(screen.getByText('This is a test excerpt for the blog post')).toBeInTheDocument();
			expect(screen.getByText('John Doe')).toBeInTheDocument();
		});

		it('should render without author name', () => {
			const postWithoutAuthor: BlogPost = { ...mockPost, authorName: '' };
			render(BlogPostCard, { props: { post: postWithoutAuthor } });

			expect(screen.getByText('Test Blog Post')).toBeInTheDocument();
			expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
		});

		it('should render published date correctly', () => {
			render(BlogPostCard, { props: { post: mockPost } });

			// Check for date elements (format: day month year)
			const dateElement = screen.getByText((content, element) => {
				return element?.tagName === 'TIME';
			});

			expect(dateElement).toBeInTheDocument();
		});

		it('should render "Leer más" button', () => {
			render(BlogPostCard, { props: { post: mockPost } });

			expect(screen.getByText('Leer más')).toBeInTheDocument();
		});
	});

	describe('Featured Media', () => {
		it('should render image when featuredMedia is an image', () => {
			const postWithImage = {
				...mockPost,
				featuredMedia: 'blog/posts/1/featured.jpg'
			};

			render(BlogPostCard, { props: { post: postWithImage } });

			const image = screen.getByAltText('Test Blog Post');
			expect(image).toBeInTheDocument();
			expect(image).toHaveAttribute('src', '/media/blog/posts/1/featured.jpg');
		});

		it('should render video when featuredMedia is a video', () => {
			const postWithVideo = {
				...mockPost,
				featuredMedia: 'blog/posts/1/video.mp4'
			};

			render(BlogPostCard, { props: { post: postWithVideo } });

			const video = screen.queryByRole('application') ?? document.querySelector('video');
			expect(video).toBeInTheDocument();
		});

		it('should render video with poster if provided', () => {
			const postWithVideoPoster = {
				...mockPost,
				featuredMedia: 'blog/posts/1/video.mp4',
				videoPoster: 'blog/posts/1/poster.jpg'
			} as BlogPost & { videoPoster?: string };

			render(BlogPostCard, { props: { post: postWithVideoPoster } });

			const video = document.querySelector('video');
			expect(video).toHaveAttribute('poster');
		});

		it('should render placeholder when no featuredMedia', () => {
			render(BlogPostCard, { props: { post: mockPost } });

			// Check for placeholder icon
			const placeholder = screen.getByText('Artículo');
			expect(placeholder).toBeInTheDocument();
		});
	});

	describe('Action Buttons', () => {
		it('should show action buttons when showActions is true', () => {
			render(BlogPostCard, {
				props: {
					post: mockPost,
					showActions: true,
					canEdit: true,
					canDelete: true
				}
			});

			const editButton = screen.getByTitle('Editar post');
			const deleteButton = screen.getByTitle('Eliminar post');

			expect(editButton).toBeInTheDocument();
			expect(deleteButton).toBeInTheDocument();
		});

		it('should not show action buttons when showActions is false', () => {
			render(BlogPostCard, {
				props: {
					post: mockPost,
					showActions: false
				}
			});

			expect(screen.queryByTitle('Editar post')).not.toBeInTheDocument();
			expect(screen.queryByTitle('Eliminar post')).not.toBeInTheDocument();
		});

		it('should only show edit button when canEdit is true', () => {
			render(BlogPostCard, {
				props: {
					post: mockPost,
					showActions: true,
					canEdit: true,
					canDelete: false
				}
			});

			expect(screen.getByTitle('Editar post')).toBeInTheDocument();
			expect(screen.queryByTitle('Eliminar post')).not.toBeInTheDocument();
		});

		it('should only show delete button when canDelete is true', () => {
			render(BlogPostCard, {
				props: {
					post: mockPost,
					showActions: true,
					canEdit: false,
					canDelete: true
				}
			});

			expect(screen.queryByTitle('Editar post')).not.toBeInTheDocument();
			expect(screen.getByTitle('Eliminar post')).toBeInTheDocument();
		});
	});

	describe('Events', () => {
		it('should dispatch edit event when edit button is clicked', async () => {
			const editSpy = vi.fn();

			render(BlogPostCard, {
				props: {
					post: mockPost,
					showActions: true,
					canEdit: true,
					onEditCallback: editSpy
				}
			});

			const editButton = screen.getByTitle('Editar post');
			await fireEvent.click(editButton);

			expect(editSpy).toHaveBeenCalledTimes(1);
			const editEvent = editSpy.mock.calls[0]?.[0] as CustomEvent<string>;
			expect(editEvent).toBeDefined();
			expect(editEvent.detail).toBe('1');
		});

		it('should dispatch delete event when delete button is clicked', async () => {
			const deleteSpy = vi.fn();

			render(BlogPostCard, {
				props: {
					post: mockPost,
					showActions: true,
					canDelete: true,
					onDeleteCallback: deleteSpy
				}
			});

			const deleteButton = screen.getByTitle('Eliminar post');
			await fireEvent.click(deleteButton);

			expect(deleteSpy).toHaveBeenCalledTimes(1);
			const deleteEvent = deleteSpy.mock.calls[0]?.[0] as CustomEvent<string>;
			expect(deleteEvent).toBeDefined();
			expect(deleteEvent.detail).toBe('1');
		});

		it('should navigate to post detail when "Leer más" is clicked', async () => {
			// Mock window.location
			delete (window as any).location;
			window.location = { href: '' } as any;

			render(BlogPostCard, { props: { post: mockPost } });

			const readMoreButton = screen.getByText('Leer más');
			await fireEvent.click(readMoreButton);

			expect(window.location.href).toBe('/blog/test-blog-post');
		});
	});

	describe('Media File Type Detection', () => {
		it('should correctly identify video files', () => {
			const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];

			videoExtensions.forEach((ext) => {
				const postWithVideo = {
					...mockPost,
					featuredMedia: `blog/posts/1/video${ext}`
				};

				const { unmount } = render(BlogPostCard, { props: { post: postWithVideo } });

				const video = document.querySelector('video');
				expect(video).toBeInTheDocument();

				unmount();
			});
		});

		it('should correctly identify image files', () => {
			const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

			imageExtensions.forEach((ext) => {
				const postWithImage = {
					...mockPost,
					featuredMedia: `blog/posts/1/image${ext}`
				};

				const { unmount } = render(BlogPostCard, { props: { post: postWithImage } });

				const image = screen.getByAltText('Test Blog Post');
				expect(image).toBeInTheDocument();

				unmount();
			});
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA labels on action buttons', () => {
			render(BlogPostCard, {
				props: {
					post: mockPost,
					showActions: true,
					canEdit: true,
					canDelete: true
				}
			});

			const editButton = screen.getByLabelText('Editar post');
			const deleteButton = screen.getByLabelText('Eliminar post');

			expect(editButton).toBeInTheDocument();
			expect(deleteButton).toBeInTheDocument();
		});

		it('should have datetime attribute on time element', () => {
			render(BlogPostCard, { props: { post: mockPost } });

			const timeElement = screen.getByText((content, element) => {
				return element?.tagName === 'TIME';
			});

			expect(timeElement).toHaveAttribute('datetime', mockPost.publishDate);
		});

		it('should have alt text on images', () => {
			const postWithImage = {
				...mockPost,
				featuredMedia: 'blog/posts/1/featured.jpg'
			};

			render(BlogPostCard, { props: { post: postWithImage } });

			const image = screen.getByAltText('Test Blog Post');
			expect(image).toBeInTheDocument();
		});

		it('should have captions track on videos', () => {
			const postWithVideo = {
				...mockPost,
				featuredMedia: 'blog/posts/1/video.mp4'
			};

			render(BlogPostCard, { props: { post: postWithVideo } });

			const track = document.querySelector('track');
			expect(track).toBeInTheDocument();
			expect(track).toHaveAttribute('kind', 'captions');
		});
	});

	describe('Styling and Visual States', () => {
		it('should apply hover effects class', () => {
			const { container } = render(BlogPostCard, { props: { post: mockPost } });

			const card = container.querySelector('.group');
			expect(card).toBeInTheDocument();
			expect(card).toHaveClass('hover:shadow-2xl');
		});

		it('should have news badge with opacity transition', () => {
			const { container } = render(BlogPostCard, { props: { post: mockPost } });

			const badge = container.querySelector('.opacity-0.group-hover\\:opacity-100');
			expect(badge).toBeInTheDocument();
		});

		it('should have gradient overlay on image hover', () => {
			const postWithImage = {
				...mockPost,
				featuredMedia: 'blog/posts/1/featured.jpg'
			};

			const { container } = render(BlogPostCard, { props: { post: postWithImage } });

			const overlay = container.querySelector('.bg-gradient-to-t');
			expect(overlay).toBeInTheDocument();
		});
	});

	describe('Edge Cases', () => {
		it('should handle missing excerpt', () => {
			const postWithoutExcerpt = { ...mockPost, excerpt: '' };
			render(BlogPostCard, { props: { post: postWithoutExcerpt } });

			expect(screen.getByText('Test Blog Post')).toBeInTheDocument();
		});

		it('should handle null publishDate', () => {
			const postWithoutDate = { ...mockPost, publishDate: null as any };
			render(BlogPostCard, { props: { post: postWithoutDate } });

			expect(screen.getByText('Test Blog Post')).toBeInTheDocument();
		});

		it('should handle very long titles with line-clamp', () => {
			const postWithLongTitle = {
				...mockPost,
				title: 'This is a very long title that should be clamped to two lines maximum to prevent layout issues'
			};

			const { container } = render(BlogPostCard, { props: { post: postWithLongTitle } });

			const titleElement = container.querySelector('.line-clamp-2');
			expect(titleElement).toBeInTheDocument();
		});

		it('should handle very long excerpts with line-clamp', () => {
			const postWithLongExcerpt = {
				...mockPost,
				excerpt: 'This is a very long excerpt that should be clamped to three lines maximum. It contains a lot of text to test the line clamping functionality and ensure it works properly in all cases.'
			};

			const { container } = render(BlogPostCard, { props: { post: postWithLongExcerpt } });

			const excerptElement = container.querySelector('.line-clamp-3');
			expect(excerptElement).toBeInTheDocument();
		});

		it('should handle unrecognized media file types', () => {
			const postWithUnknownMedia = {
				...mockPost,
				featuredMedia: 'blog/posts/1/file.xyz'
			};

			render(BlogPostCard, { props: { post: postWithUnknownMedia } });

			// Should show fallback
			const fallback = screen.getByText('Archivo multimedia');
			expect(fallback).toBeInTheDocument();
		});
	});
});
