import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { blogPostElementService } from '../blogPostElementService';
import { goto } from '$app/navigation';

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

const createJsonResponse = (payload: unknown, overrides: Partial<Response> = {}) => ({
	ok: true,
	status: 200,
	headers: {
		get: (name: string) => (name === 'content-type' ? 'application/json' : null)
	},
	json: async () => payload,
	...overrides
});

describe('blogPostElementService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should adapt elements returned by the backend', async () => {
		const backendElement = {
			id: 'elem-1',
			blogPostId: 'post-42',
			elementType: 'text',
			content: 'Contenido de prueba',
			filePath: null,
			orderNumber: 1,
			isActive: true,
			createdAt: 1735689600,
			updatedAt: 1735693200
		};

		(global.fetch as any).mockResolvedValueOnce(
			createJsonResponse([backendElement])
		);

		const result = await blogPostElementService.getElementsByBlogPostId('post-42');

		expect(global.fetch).toHaveBeenCalledWith(
			expect.stringContaining('/blogpostelement/by-blog-post/post-42'),
			expect.objectContaining({ method: 'GET' })
		);

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual(
			expect.objectContaining({
				id: 'elem-1',
				elementType: 'text',
				content: 'Contenido de prueba',
				isActive: true
			})
		);
		expect(result[0].createdAt).toBeInstanceOf(Date);
	expect(result[0].createdAt.toISOString()).toBe('2025-01-01T00:00:00.000Z');
	expect(result[0].updatedAt?.toISOString()).toBe('2025-01-01T01:00:00.000Z');
	});

	it('should return empty array when backend responds with non-array', async () => {
		(global.fetch as any).mockResolvedValueOnce(
			createJsonResponse({ items: null })
		);

		const result = await blogPostElementService.getElementsByBlogPostId('post-42');
		expect(result).toEqual([]);
	});

	it('should post new elements and adapt the response', async () => {
		const backendElement = {
			id: 'elem-2',
			blogPostId: 'post-42',
			elementType: 'image',
			filePath: '/media/image.png',
			orderNumber: 2,
			isActive: true,
			createdAt: 1735689600
		};

		(global.fetch as any).mockResolvedValueOnce(
			createJsonResponse(backendElement)
		);

		const result = await blogPostElementService.createElement({
			blogPostId: 'post-42',
			elementType: 'image',
			orderNumber: 2,
			isActive: true,
			filePath: '/media/image.png'
		});

		expect(global.fetch).toHaveBeenCalledWith(
			expect.stringContaining('/blogpostelement'),
			expect.objectContaining({
				method: 'POST',
				body: expect.stringContaining('"elementType":"image"')
			})
		);

		expect(result.filePath).toBe('/media/image.png');
		expect(result.createdAt).toBeInstanceOf(Date);
	});

	it('should update existing elements', async () => {
		const backendElement = {
			id: 'elem-2',
			blogPostId: 'post-42',
			elementType: 'text',
			content: 'Elemento actualizado',
			orderNumber: 3,
			isActive: true,
			createdAt: 1735689600,
			updatedAt: 1735696800
		};

		(global.fetch as any).mockResolvedValueOnce(
			createJsonResponse(backendElement)
		);

		const result = await blogPostElementService.updateElement({
			id: 'elem-2',
			content: 'Elemento actualizado'
		});

		expect(global.fetch).toHaveBeenCalledWith(
			expect.stringContaining('/blogpostelement/elem-2'),
			expect.objectContaining({
				method: 'PUT',
				body: expect.stringContaining('"content":"Elemento actualizado"')
			})
		);

	expect(result.updatedAt?.toISOString()).toBe('2025-01-01T02:00:00.000Z');
	});

	it('should delete elements without returning payload', async () => {
		(global.fetch as any).mockResolvedValueOnce(
			createJsonResponse({}, { status: 204, headers: { get: () => '0' } as any })
		);

		await blogPostElementService.deleteElement('elem-3');

		expect(global.fetch).toHaveBeenCalledWith(
			expect.stringContaining('/blogpostelement/elem-3'),
			expect.objectContaining({ method: 'DELETE' })
		);
	});

	it('should handle unauthorized responses by redirecting to login', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 401,
			headers: {
				get: () => 'application/json'
			},
			json: async () => ({ message: 'Unauthorized' })
		});

		await expect(
			blogPostElementService.createElement({
				blogPostId: 'post-42',
				elementType: 'text',
				orderNumber: 1
			})
	).rejects.toThrow('Sesión expirada - Por favor inicia sesión nuevamente');

		expect(goto).toHaveBeenCalledWith('/auth/login');
	});

	it('should create elements in batch', async () => {
		const backendResponse = [
			{
				id: 'elem-1',
				blogPostId: 'post-42',
				elementType: 'text',
				content: 'Contenido',
				orderNumber: 1,
				isActive: true,
				createdAt: 1735689600
			}
		];

		(global.fetch as any).mockResolvedValueOnce(
			createJsonResponse(backendResponse)
		);

		const result = await blogPostElementService.createElementsInBatch('post-42', [
			{
				element: {
					blogPostId: 'post-42',
					elementType: 'text',
					content: 'Contenido',
					orderNumber: 1
				}
			}
		]);

		expect(global.fetch).toHaveBeenCalledWith(
			expect.stringContaining('/blogpostelement/batch'),
			expect.objectContaining({ method: 'POST' })
		);

		expect(result).toHaveLength(1);
		expect(result[0].createdAt).toBeInstanceOf(Date);
	});

	it('should delete all elements by blog post id', async () => {
		(global.fetch as any).mockResolvedValueOnce(
			createJsonResponse({}, { status: 204, headers: { get: () => '0' } as any })
		);

		await blogPostElementService.deleteElementsByBlogPostId('post-42');

		expect(global.fetch).toHaveBeenCalledWith(
			expect.stringContaining('/blogpostelement/by-blog-post/post-42'),
			expect.objectContaining({ method: 'DELETE' })
		);
	});
});
