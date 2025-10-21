import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { modulePostService } from '../modulePostService';
import type { PostDetail, CreatePostDto, UpdatePostDto } from '../modulePostService';

// Mock dependencies
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('$lib/services/auth/jwtService', () => ({
	jwtService: {
		getAuthHeader: vi.fn(() => ({ Authorization: 'Bearer mock-token' }))
	}
}));

describe('ModulePostService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getModulePosts', () => {
		it('should fetch posts for a module successfully', async () => {
			const mockPosts: PostDetail[] = [
				{
					id: 'post-1',
					title: 'Post 1',
					subtitle: 'Subtitle 1',
					orderNumber: 1,
					moduleId: 'module-1',
					authorId: 'author-1',
					authorName: 'John Doe',
					createdAt: new Date(),
					isActive: true
				}
			];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockPosts
			});

			const result = await modulePostService.getModulePosts('module-1');

			expect(result).toEqual(mockPosts);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/modules/module-1/posts'),
				expect.any(Object)
			);
		});

		it('should throw error when fetch fails', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				statusText: 'Not Found'
			});

			await expect(modulePostService.getModulePosts('module-1')).rejects.toThrow();
		});
	});

	describe('getPost', () => {
		it('should fetch a single post successfully', async () => {
			const mockPost: PostDetail = {
				id: 'post-1',
				title: 'Test Post',
				orderNumber: 1,
				moduleId: 'module-1',
				authorId: 'author-1',
				authorName: 'Jane Doe',
				createdAt: new Date(),
				isActive: true
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockPost
			});

			const result = await modulePostService.getPost('post-1');

			expect(result).toEqual(mockPost);
		});

		it('should return null when post not found', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				status: 404,
				ok: false
			});

			const result = await modulePostService.getPost('nonexistent');

			expect(result).toBeNull();
		});

		it('should throw error on other failures', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error'
			});

			await expect(modulePostService.getPost('post-1')).rejects.toThrow();
		});
	});

	describe('createPost', () => {
		it('should create post successfully', async () => {
			const newPost: CreatePostDto = {
				title: 'New Post',
				subtitle: 'New Subtitle',
				orderNumber: 1,
				moduleId: 'module-1'
			};

			const mockCreatedPost: PostDetail = {
				...newPost,
				id: 'post-new',
				authorId: 'author-1',
				authorName: 'Author Name',
				createdAt: new Date(),
				isActive: true
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockCreatedPost
			});

			const result = await modulePostService.createPost(newPost);

			expect(result).toEqual(mockCreatedPost);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/posts'),
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(newPost)
				})
			);
		});

		it('should handle 401 unauthorized', async () => {
			const { goto } = await import('$app/navigation');

			(global.fetch as any).mockResolvedValueOnce({
				status: 401,
				ok: false
			});

			await expect(
				modulePostService.createPost({
					title: 'Test',
					orderNumber: 1,
					moduleId: 'module-1'
				})
			).rejects.toThrow('Authentication required');

			expect(goto).toHaveBeenCalledWith('/auth/login');
		});

		it('should handle 403 forbidden', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				status: 403,
				ok: false
			});

			await expect(
				modulePostService.createPost({
					title: 'Test',
					orderNumber: 1,
					moduleId: 'module-1'
				})
			).rejects.toThrow('No tienes permisos para crear posts');
		});
	});

	describe('updatePost', () => {
		it('should update post successfully', async () => {
			const updateData: UpdatePostDto = {
				title: 'Updated Title',
				subtitle: 'Updated Subtitle',
				orderNumber: 2
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true
			});

			await modulePostService.updatePost('post-1', updateData);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/posts/post-1'),
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify(updateData)
				})
			);
		});

		it('should handle 404 not found', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				status: 404,
				ok: false
			});

			await expect(
				modulePostService.updatePost('nonexistent', { title: 'Test', orderNumber: 1 })
			).rejects.toThrow('Post no encontrado');
		});
	});

	describe('deletePost', () => {
		it('should delete post successfully', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true
			});

			await modulePostService.deletePost('post-1');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/posts/post-1'),
				expect.objectContaining({
					method: 'DELETE'
				})
			);
		});

		it('should handle delete errors', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 500,
				text: async () => 'Server error'
			});

			await expect(modulePostService.deletePost('post-1')).rejects.toThrow();
		});
	});

	describe('reorderPost', () => {
		it('should reorder post successfully', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true
			});

			await modulePostService.reorderPost('post-1', 5);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/posts/post-1/reorder'),
				expect.objectContaining({
					method: 'PATCH',
					body: JSON.stringify({ newOrderNumber: 5 })
				})
			);
		});

		it('should handle reorder errors', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				status: 403,
				ok: false
			});

			await expect(modulePostService.reorderPost('post-1', 3)).rejects.toThrow(
				'No tienes permisos para reordenar posts'
			);
		});
	});

	describe('uploadMedia', () => {
		it('should upload image media successfully', async () => {
			const mockFile = new File(['image'], 'test.jpg', { type: 'image/jpeg' });

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ path: '/media/posts/post-1/test.jpg' })
			});

			const result = await modulePostService.uploadMedia('post-1', mockFile, 'image');

			expect(result).toBe('/media/posts/post-1/test.jpg');
			expect(global.fetch).toHaveBeenCalled();
		});

		it('should upload video media successfully', async () => {
			const mockFile = new File(['video'], 'test.mp4', { type: 'video/mp4' });

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ path: '/media/posts/post-1/test.mp4' })
			});

			const result = await modulePostService.uploadMedia('post-1', mockFile, 'video');

			expect(result).toContain('test.mp4');
		});

		it('should handle upload errors', async () => {
			const mockFile = new File(['audio'], 'test.mp3', { type: 'audio/mp3' });

			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 403,
				text: async () => 'Forbidden'
			});

			await expect(
				modulePostService.uploadMedia('post-1', mockFile, 'audio')
			).rejects.toThrow();
		});
	});

	describe('removeMedia', () => {
		it('should remove media successfully', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true
			});

			await modulePostService.removeMedia('post-1', 'image');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/post-1/media'),
				expect.objectContaining({
					method: 'DELETE',
					body: JSON.stringify({ mediaType: 'image' })
				})
			);
		});

		it('should handle remove media errors', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 404,
				text: async () => 'Not found'
			});

			await expect(modulePostService.removeMedia('post-1', 'video')).rejects.toThrow();
		});
	});
});
