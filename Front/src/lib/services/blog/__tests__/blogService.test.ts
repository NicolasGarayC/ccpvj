import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { blogService } from '../blogService';
import type { BlogPost } from '$lib/types/api';

describe('BlogService', () => {
	beforeEach(() => {
		// Reset mocks before each test
		vi.clearAllMocks();
		localStorage.clear();

		// Mock fetch for each test
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('GET Operations (Public)', () => {
		it('should get all blog posts without authentication', async () => {
			const mockPosts = [
				{
					id: '1',
					title: 'Post 1',
					slug: 'post-1',
					subtitle: 'Subtitle 1',
					isPublished: true,
					createdAt: 1735689600,
					elements: [
						{
							elementType: 'text',
							content: 'Content 1',
							orderNumber: 1,
							isActive: true
						}
					],
					tags: 'tag1,tag2',
					authorName: 'Author 1'
				}
			];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => mockPosts
			});

			const result = await blogService.getAllBlogPosts();

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/blog'),
				expect.objectContaining({ method: 'GET' })
			);
			expect(result).toHaveLength(1);
			expect(result[0].title).toBe('Post 1');
		});

		it('should get blog post by slug without authentication', async () => {
			const mockPost = {
				id: '1',
				title: 'Test Post',
				slug: 'test-post',
				subtitle: 'Test Subtitle',
				isPublished: true,
				createdAt: 1735689600,
				elements: [
					{
						elementType: 'text',
						content: 'Test content',
						orderNumber: 1,
						isActive: true
					}
				],
				tags: 'test',
				authorName: 'Test Author'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => mockPost
			});

			const result = await blogService.getBlogPostBySlug('test-post');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/blog/slug/test-post'),
				expect.objectContaining({ method: 'GET' })
			);
			expect(result).toBeDefined();
			expect(result?.slug).toBe('test-post');
		});

		it('should get featured blog posts', async () => {
			const mockPosts = [
				{
					id: '1',
					title: 'Featured Post',
					slug: 'featured-post',
					isPublished: true,
					isFeatured: true,
					createdAt: 1735689600,
					elements: [],
					authorName: 'Author'
				}
			];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => mockPosts
			});

			const result = await blogService.getFeaturedBlogPosts();

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/blog/featured'),
				expect.objectContaining({ method: 'GET' })
			);
			expect(result).toHaveLength(1);
		});

		it('should return null when blog post not found', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 404,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => ({ error: 'Not found' })
			});

			const result = await blogService.getBlogPostBySlug('non-existent');

			expect(result).toBeNull();
		});
	});

	describe('CREATE Operations (Protected)', () => {
		beforeEach(() => {
			// Mock valid JWT token
			(global.localStorage.getItem as any) = vi.fn((key: string) => {
				if (key === 'jwt_token') return 'valid-jwt-token';
				if (key === 'jwt_user')
					return JSON.stringify({ id: 1, username: 'admin', role: 'administrador' });
				return null;
			});
		});

		it('should create blog post with JWT token', async () => {
			const newPost = {
				title: 'New Post',
				slug: 'new-post',
				subtitle: 'New Subtitle',
				isPublished: false,
				isFeatured: false,
				tags: ['tag1', 'tag2'],
				elements: [
					{
						elementType: 'text',
						content: 'New content',
						orderNumber: 1,
						isActive: true
					}
				]
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 201,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => ({ id: 'new-id', ...newPost })
			});

			const result = await blogService.createBlogPost(newPost as any);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/blog'),
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						Authorization: 'Bearer valid-jwt-token'
					})
				})
			);
			expect(result).toBeDefined();
		});

		it('should reject create without valid JWT', async () => {
			localStorage.clear();

			await expect(
				blogService.createBlogPost({
					title: 'Test',
					slug: 'test',
					isPublished: false,
					isFeatured: false,
					tags: [],
					elements: []
				} as any)
			).rejects.toThrow();
		});
	});

	describe('UPDATE Operations (Protected)', () => {
		beforeEach(() => {
			(global.localStorage.getItem as any) = vi.fn((key: string) => {
				if (key === 'jwt_token') return 'valid-jwt-token';
				if (key === 'jwt_user')
					return JSON.stringify({ id: 1, username: 'admin', role: 'administrador' });
				return null;
			});
		});

		it('should update blog post with JWT', async () => {
			const updateData = {
				title: 'Updated Post',
				slug: 'updated-post',
				isPublished: true,
				isFeatured: false,
				tags: ['updated'],
				elements: []
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => ({ id: '1', ...updateData })
			});

			const result = await blogService.updateBlogPost('1', updateData as any);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/blog/1'),
				expect.objectContaining({
					method: 'PUT',
					headers: expect.objectContaining({
						Authorization: 'Bearer valid-jwt-token'
					})
				})
			);
			expect(result).toBeDefined();
		});
	});

	describe('DELETE Operations (Protected)', () => {
		beforeEach(() => {
			(global.localStorage.getItem as any) = vi.fn((key: string) => {
				if (key === 'jwt_token') return 'valid-jwt-token';
				if (key === 'jwt_user')
					return JSON.stringify({ id: 1, username: 'admin', role: 'administrador' });
				return null;
			});
		});

		it('should delete blog post with JWT', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 204,
				headers: {
					get: (name: string) => (name === 'content-length' ? '0' : null)
				}
			});

			await blogService.deleteBlogPost('1');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/blog/1'),
				expect.objectContaining({
					method: 'DELETE',
					headers: expect.objectContaining({
						Authorization: 'Bearer valid-jwt-token'
					})
				})
			);
		});
	});

	describe('Data Transformation', () => {
		it('should extract text content from elements', async () => {
			const mockPost = {
				id: '1',
				title: 'Test',
				slug: 'test',
				createdAt: 1735689600,
				elements: [
					{
						elementType: 'text',
						content: 'First paragraph',
						orderNumber: 1,
						isActive: true
					},
					{
						elementType: 'image',
						filePath: '/image.jpg',
						orderNumber: 2,
						isActive: true
					},
					{
						elementType: 'text',
						content: 'Second paragraph',
						orderNumber: 3,
						isActive: true
					}
				],
				authorName: 'Test Author'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => mockPost
			});

			const result = await blogService.getBlogPostBySlug('test');

			expect(result?.content).toContain('First paragraph');
			expect(result?.content).toContain('Second paragraph');
		});

		it('should extract featured media from elements', async () => {
			const mockPost = {
				id: '1',
				title: 'Test',
				slug: 'test',
				createdAt: 1735689600,
				elements: [
					{
						elementType: 'image',
						filePath: '/featured.jpg',
						orderNumber: 1,
						isActive: true
					},
					{
						elementType: 'text',
						content: 'Content',
						orderNumber: 2,
						isActive: true
					}
				],
				authorName: 'Test Author'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => mockPost
			});

			const result = await blogService.getBlogPostBySlug('test');

			expect(result?.featuredMedia).toBe('/featured.jpg');
		});

		it('should parse tags from string', async () => {
			const mockPost = {
				id: '1',
				title: 'Test',
				slug: 'test',
				createdAt: 1735689600,
				elements: [],
				tags: 'tag1, tag2, tag3',
				authorName: 'Test Author'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => mockPost
			});

			const result = await blogService.getBlogPostBySlug('test');

			expect(result?.tags).toEqual(['tag1', 'tag2', 'tag3']);
		});

		it('should handle array tags', async () => {
			const mockPost = {
				id: '1',
				title: 'Test',
				slug: 'test',
				createdAt: 1735689600,
				elements: [],
				tags: ['array-tag1', 'array-tag2'],
				authorName: 'Test Author'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => mockPost
			});

			const result = await blogService.getBlogPostBySlug('test');

			expect(result?.tags).toEqual(['array-tag1', 'array-tag2']);
		});

		it('should convert Unix timestamps to ISO dates', async () => {
			const mockPost = {
				id: '1',
				title: 'Test',
				slug: 'test',
				createdAt: 1735689600, // Unix timestamp
				publishedAt: 1735776000,
				elements: [],
				authorName: 'Test Author'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => mockPost
			});

			const result = await blogService.getBlogPostBySlug('test');

			expect(result?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
			expect(result?.publishDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		});
	});

	describe('Error Handling', () => {
		it('should handle network errors', async () => {
			(global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

			await expect(blogService.getAllBlogPosts()).rejects.toThrow('Network error');
		});

		it('should handle 500 server errors', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 500,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => ({ error: 'Internal server error' })
			});

			await expect(blogService.getAllBlogPosts()).rejects.toThrow();
		});

		it('should handle unauthorized access', async () => {
			localStorage.clear();

			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 401,
				headers: {
					get: (name: string) => (name === 'content-type' ? 'application/json' : null)
				},
				json: async () => ({ error: 'Unauthorized' })
			});

			await expect(
				blogService.createBlogPost({
					title: 'Test',
					slug: 'test',
					isPublished: false,
					isFeatured: false,
					tags: [],
					elements: []
				} as any)
			).rejects.toThrow();
		});
	});
});
