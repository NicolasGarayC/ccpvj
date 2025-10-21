import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { postElementService } from '../postElementService';
import type { PostElement, CreateElementDto, UpdateElementDto } from '../postElementService';

// Mock dependencies
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

describe('PostElementService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getFileUrl', () => {
		it('should return empty string for empty path', () => {
			expect(postElementService.getFileUrl('')).toBe('');
		});

		it('should return absolute URL as-is', () => {
			const url = 'http://example.com/file.jpg';
			expect(postElementService.getFileUrl(url)).toBe(url);
		});

		it('should return path starting with /media/ as-is', () => {
			const path = '/media/files/file.jpg';
			expect(postElementService.getFileUrl(path)).toBe(path);
		});

		it('should prepend /media/ to relative path', () => {
			expect(postElementService.getFileUrl('content/file.jpg')).toBe('/media/content/file.jpg');
		});
	});

	describe('getMediaUrl', () => {
		it('should return empty string for empty path', () => {
			expect(postElementService.getMediaUrl('')).toBe('');
		});

		it('should clean path with leading slash', () => {
			const result = postElementService.getMediaUrl('/media/content/file.jpg');
			expect(result).toBeTruthy();
		});

		it('should clean media/ prefix', () => {
			const result = postElementService.getMediaUrl('media/content/file.jpg');
			expect(result).toBeTruthy();
		});
	});

	describe('getElementsByPostId', () => {
		it('should fetch elements for a post successfully', async () => {
			const mockElements: PostElement[] = [
				{
					id: 'elem-1',
					postId: 'post-1',
					elementType: 'title',
					content: 'Title',
					orderNumber: 0,
					createdAt: new Date()
				},
				{
					id: 'elem-2',
					postId: 'post-1',
					elementType: 'text',
					content: 'Text content',
					orderNumber: 1,
					createdAt: new Date()
				}
			];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockElements.map(e => ({ ...e, createdAt: e.createdAt.toISOString() }))
			});

			const result = await postElementService.getElementsByPostId('post-1');

			expect(result).toHaveLength(2);
			expect(result[0].elementType).toBe('title');
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/by-post/post-1'),
				expect.any(Object)
			);
		});

		it('should return empty array on error', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				statusText: 'Not Found'
			});

			const result = await postElementService.getElementsByPostId('post-1');

			expect(result).toEqual([]);
		});

		it('should parse dates correctly', async () => {
			const mockElements = [
				{
					id: 'elem-1',
					postId: 'post-1',
					elementType: 'text',
					content: 'Test',
					orderNumber: 0,
					createdAt: '2024-01-01T00:00:00.000Z',
					updatedAt: '2024-01-02T00:00:00.000Z'
				}
			];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockElements
			});

			const result = await postElementService.getElementsByPostId('post-1');

			expect(result[0].createdAt).toBeInstanceOf(Date);
			expect(result[0].updatedAt).toBeInstanceOf(Date);
		});
	});

	describe('createElement', () => {
		it('should create element successfully', async () => {
			const newElement: CreateElementDto = {
				postId: 'post-1',
				elementType: 'text',
				content: 'New content',
				orderNumber: 0
			};

			const mockCreated: PostElement = {
				...newElement,
				id: 'elem-new',
				createdAt: new Date()
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ ...mockCreated, createdAt: mockCreated.createdAt.toISOString() })
			});

			const result = await postElementService.createElement(newElement);

			expect(result.id).toBe('elem-new');
			expect(result.content).toBe('New content');
			expect(global.fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(newElement)
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
				postElementService.createElement({
					postId: 'post-1',
					elementType: 'text',
					content: 'Test',
					orderNumber: 0
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
				postElementService.createElement({
					postId: 'post-1',
					elementType: 'text',
					content: 'Test',
					orderNumber: 0
				})
			).rejects.toThrow('No tienes permisos para crear elementos de post');
		});
	});

	describe('updateElement', () => {
		it('should update element successfully', async () => {
			const updateData: UpdateElementDto = {
				id: 'elem-1',
				content: 'Updated content',
				orderNumber: 1
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await postElementService.updateElement(updateData);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/elem-1'),
				expect.objectContaining({
					method: 'PUT'
				})
			);
		});

		it('should handle 404 not found', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				status: 404,
				ok: false
			});

			await expect(
				postElementService.updateElement({
					id: 'nonexistent',
					content: 'Test'
				})
			).rejects.toThrow('Elemento no encontrado');
		});
	});

	describe('deleteElement', () => {
		it('should delete element successfully', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true
			});

			await postElementService.deleteElement('elem-1');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/elem-1'),
				expect.objectContaining({
					method: 'DELETE'
				})
			);
		});

		it('should handle delete errors', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 403,
				text: async () => 'Forbidden'
			});

			await expect(postElementService.deleteElement('elem-1')).rejects.toThrow();
		});
	});

	describe('reorderElements', () => {
		it('should reorder elements successfully', async () => {
			(global.fetch as any).mockResolvedValue({
				ok: true
			});

			const elementOrders = [
				{ id: 'elem-1', orderNumber: 2 },
				{ id: 'elem-2', orderNumber: 1 },
				{ id: 'elem-3', orderNumber: 0 }
			];

			await postElementService.reorderElements('post-1', elementOrders);

			expect(global.fetch).toHaveBeenCalledTimes(3);
		});

		it('should handle reorder errors', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				status: 403,
				ok: false
			});

			await expect(
				postElementService.reorderElements('post-1', [{ id: 'elem-1', orderNumber: 1 }])
			).rejects.toThrow();
		});
	});

	describe('createElementsInBatch', () => {
		it('should create multiple elements successfully', async () => {
			const elements = [
				{
					element: {
						postId: 'post-1',
						elementType: 'title' as const,
						content: 'Title',
						orderNumber: 0
					}
				},
				{
					element: {
						postId: 'post-1',
						elementType: 'text' as const,
						content: 'Text',
						orderNumber: 1
					}
				}
			];

			const mockCreatedElements = [
				{
					...elements[0].element,
					id: 'elem-1',
					createdAt: new Date().toISOString()
				},
				{
					...elements[1].element,
					id: 'elem-2',
					createdAt: new Date().toISOString()
				}
			];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockCreatedElements
			});

			const result = await postElementService.createElementsInBatch('post-1', elements);

			expect(result).toHaveLength(2);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/batch'),
				expect.objectContaining({
					method: 'POST'
				})
			);
		});

		it('should handle batch creation errors', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 401,
				text: async () => 'Unauthorized'
			});

			await expect(
				postElementService.createElementsInBatch('post-1', [
					{
						element: {
							postId: 'post-1',
							elementType: 'text',
							content: 'Test',
							orderNumber: 0
						}
					}
				])
			).rejects.toThrow();
		});
	});

	describe('deleteElementsByPostId', () => {
		it('should delete all elements for a post', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true
			});

			await postElementService.deleteElementsByPostId('post-1');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/by-post/post-1'),
				expect.objectContaining({
					method: 'DELETE'
				})
			);
		});

		it('should handle deletion errors', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 403,
				text: async () => 'Forbidden'
			});

			await expect(postElementService.deleteElementsByPostId('post-1')).rejects.toThrow();
		});
	});
});
