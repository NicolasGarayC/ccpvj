import { describe, it, expect, vi, beforeEach } from 'vitest';
import { digitalLibraryService } from '../DigitalLibraryService';
import type {
	LibraryItemDto,
	LibraryItemPagedResultDto,
	CreateLibraryItemDto,
	UpdateLibraryItemDto,
	LibraryCollectionDto,
	LibraryStatsDto
} from '../DigitalLibraryService';
import { jwtService } from '$lib/application/services/auth/JwtService';
import { ApiError } from '$lib/infrastructure/http/BaseHttpClient';

// Mock jwtService
vi.mock('$lib/application/services/auth/JwtService', () => ({
	jwtService: {
		getAuthHeader: vi.fn(() => ({ Authorization: 'Bearer mock-token' })),
		isAuthenticated: vi.fn(() => true),
		getUserRole: vi.fn(() => 'administrador')
	}
}));

describe('DigitalLibraryService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn();
	});

	// ================================================================
	// GET OPERATIONS (PUBLIC)
	// ================================================================

	describe('GET operations (public)', () => {
		it('should fetch all library items without filters', async () => {
			const mockResponse: LibraryItemPagedResultDto = {
				items: [
					{
						id: '1',
						title: 'Canción 1',
						description: 'Descripción de canción 1',
						author: 'Víctor Jara',
						createdAt: '2024-01-01T00:00:00Z',
						uploadedBy: 'user1',
						fileType: 'audio',
						filePath: '/media/library/audio1.mp3',
						fileName: 'audio1.mp3',
						fileSize: 5000000,
						tags: ['música', 'folklore'],
						downloadCount: 10,
						viewCount: 50,
						isActive: true,
						isFeatured: false,
						collections: []
					}
				],
				totalCount: 1,
				page: 1,
				pageSize: 10,
				totalPages: 1,
				hasNextPage: false,
				hasPreviousPage: false
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockResponse
			});

			const result = await digitalLibraryService.getItems();

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/digitallibrary/items'),
				expect.any(Object)
			);
			expect(result.items).toHaveLength(1);
			expect(result.items[0].title).toBe('Canción 1');
		});

		it('should fetch library items with search query', async () => {
			const mockResponse: LibraryItemPagedResultDto = {
				items: [],
				totalCount: 0,
				page: 1,
				pageSize: 10,
				totalPages: 0,
				hasNextPage: false,
				hasPreviousPage: false
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			await digitalLibraryService.getItems({ query: 'víctor jara' });

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('query=v%C3%ADctor+jara'),
				expect.any(Object)
			);
		});

		it('should fetch library items with fileType filter', async () => {
			const mockResponse: LibraryItemPagedResultDto = {
				items: [],
				totalCount: 0,
				page: 1,
				pageSize: 10,
				totalPages: 0,
				hasNextPage: false,
				hasPreviousPage: false
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			await digitalLibraryService.getItems({ fileType: 'audio' });

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('fileType=audio'),
				expect.any(Object)
			);
		});

		it('should fetch library items with pagination', async () => {
			const mockResponse: LibraryItemPagedResultDto = {
				items: [],
				totalCount: 50,
				page: 2,
				pageSize: 10,
				totalPages: 5,
				hasNextPage: true,
				hasPreviousPage: true
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			const result = await digitalLibraryService.getItems({ page: 2, pageSize: 10 });

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('page=2'),
				expect.any(Object)
			);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('pageSize=10'),
				expect.any(Object)
			);
			expect(result.hasNextPage).toBe(true);
		});

		it('should fetch a specific library item by ID', async () => {
			const mockItem: LibraryItemDto = {
				id: '123',
				title: 'Documento importante',
				description: 'Un documento histórico',
				author: 'Autor Test',
				createdAt: '2024-01-01T00:00:00Z',
				uploadedBy: 'user1',
				fileType: 'document',
				filePath: '/media/library/doc.pdf',
				fileName: 'doc.pdf',
				fileSize: 1000000,
				tags: ['historia', 'documento'],
				downloadCount: 5,
				viewCount: 20,
				isActive: true,
				isFeatured: true,
				collections: []
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockItem
			});

			const result = await digitalLibraryService.getItemById('123');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/digitallibrary/items/123'),
				expect.any(Object)
			);
			expect(result.id).toBe('123');
			expect(result.isFeatured).toBe(true);
		});

		it('should fetch library statistics', async () => {
			const mockStats: LibraryStatsDto = {
				totalItems: 150,
				totalDownloads: 1000,
				totalViews: 5000,
				fileTypeDistribution: {
					audio: 50,
					video: 30,
					document: 60,
					image: 10
				},
				itemsByCategory: {
					'victor-jara': 40,
					'nueva-cancion': 30,
					'educacion-popular': 20
				},
				totalCollections: 5
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockStats
			});

			const result = await digitalLibraryService.getStats();

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/digitallibrary/stats'),
				expect.any(Object)
			);
			expect(result.totalItems).toBe(150);
			expect(result.fileTypeDistribution.audio).toBe(50);
		});

		it('should throw error when fetching items fails', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 500
			});

			await expect(digitalLibraryService.getItems()).rejects.toMatchObject({
				status: 500,
				message: 'Error interno del servidor. Intenta nuevamente.'
			});
		});
	});

	// ================================================================
	// CREATE OPERATIONS (PROTECTED)
	// ================================================================

	describe('CREATE operations (protected)', () => {
		it('should create a new library item with authentication', async () => {
			const newItem: CreateLibraryItemDto = {
				title: 'Nueva canción',
				description: 'Una canción nueva',
				author: 'Artista Nuevo',
				fileType: 'audio',
				filePath: '/media/library/new-audio.mp3',
				fileName: 'new-audio.mp3',
				fileSize: 3000000,
				tags: ['música', 'nueva'],
				category: 'nueva-cancion',
				isFeatured: false
			};

		const mockResponse: LibraryItemDto = {
			id: 'new-123',
			...newItem,
			createdAt: '2024-01-01T00:00:00Z',
			uploadedBy: 'user1',
			downloadCount: 0,
			viewCount: 0,
			isActive: true,
			isFeatured: newItem.isFeatured ?? false,
			collections: []
		};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			const result = await digitalLibraryService.createItem(newItem);

			expect(jwtService.getAuthHeader).toHaveBeenCalled();
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/digitallibrary/items'),
				expect.objectContaining({
					method: 'POST',
					body: expect.any(String)
				})
			);
			expect(result.id).toBe('new-123');
		});

		it('should create item with collections', async () => {
			const newItem: CreateLibraryItemDto = {
				title: 'Item con colecciones',
				fileType: 'document',
				filePath: '/media/library/doc.pdf',
				fileName: 'doc.pdf',
				fileSize: 500000,
				tags: ['test'],
				collectionIds: ['coll-1', 'coll-2']
			};

		const mockResponse: LibraryItemDto = {
			id: 'item-456',
			...newItem,
			createdAt: '2024-01-01T00:00:00Z',
			uploadedBy: 'user1',
			downloadCount: 0,
			viewCount: 0,
			isActive: true,
			isFeatured: false,
			collections: [
					{
						id: 'coll-1',
						name: 'Colección 1',
						isActive: true,
						createdAt: '2024-01-01T00:00:00Z',
						itemCount: 1
					},
					{
						id: 'coll-2',
						name: 'Colección 2',
						isActive: true,
						createdAt: '2024-01-01T00:00:00Z',
						itemCount: 1
					}
				]
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			const result = await digitalLibraryService.createItem(newItem);

			expect(result.collections).toHaveLength(2);
		});

		it('should throw error when creating item fails', async () => {
			const newItem: CreateLibraryItemDto = {
				title: 'Test',
				fileType: 'audio',
				filePath: '/test.mp3',
				fileName: 'test.mp3',
				fileSize: 1000,
				tags: []
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 400
			});

			const promise = digitalLibraryService.createItem(newItem);

			await expect(promise).rejects.toBeInstanceOf(ApiError);
			await expect(promise).rejects.toMatchObject({ status: 400 });
		});
	});

	// ================================================================
	// UPDATE OPERATIONS (PROTECTED)
	// ================================================================

	describe('UPDATE operations (protected)', () => {
		it('should update library item with authentication', async () => {
			const updateData: UpdateLibraryItemDto = {
				title: 'Título actualizado',
				description: 'Nueva descripción',
				tags: 'música,folklore,actualizado'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 204,
				headers: {
					get: () => null
				}
			});

			await digitalLibraryService.updateItem('item-123', updateData);

			expect(jwtService.getAuthHeader).toHaveBeenCalled();
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/digitallibrary/items/item-123'),
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify(updateData)
				})
			);
		});

		it('should throw error when updating item fails', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 404
			});

			const promise = digitalLibraryService.updateItem('non-existent', { title: 'Test' });

			await expect(promise).rejects.toBeInstanceOf(ApiError);
			await expect(promise).rejects.toMatchObject({ status: 404 });
		});
	});

	// ================================================================
	// DELETE OPERATIONS (PROTECTED)
	// ================================================================

	describe('DELETE operations (protected)', () => {
		it('should delete library item with authentication', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 204,
				headers: {
					get: () => null
				}
			});

			await digitalLibraryService.deleteItem('item-to-delete');

			expect(jwtService.getAuthHeader).toHaveBeenCalled();
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/digitallibrary/items/item-to-delete'),
				expect.objectContaining({
					method: 'DELETE'
				})
			);
		});

		it('should throw error when deleting item fails', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 403
			});

			const promise = digitalLibraryService.deleteItem('forbidden-item');

			await expect(promise).rejects.toBeInstanceOf(ApiError);
			await expect(promise).rejects.toMatchObject({
				status: 403,
				message: 'No tienes permisos para realizar esta acción'
			});
		});
	});

	// ================================================================
	// COLLECTION OPERATIONS
	// ================================================================

	describe('Collection operations', () => {
		it('should fetch all collections', async () => {
			const mockCollections: LibraryCollectionDto[] = [
				{
					id: 'coll-1',
					name: 'Víctor Jara',
					description: 'Colección de Víctor Jara',
					colorTheme: '#FF5733',
					isActive: true,
					createdAt: '2024-01-01T00:00:00Z',
					itemCount: 25
				},
				{
					id: 'coll-2',
					name: 'Nueva Canción',
					description: 'Movimiento Nueva Canción',
					isActive: true,
					createdAt: '2024-01-01T00:00:00Z',
					itemCount: 40
				}
			];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockCollections
			});

			const result = await digitalLibraryService.getCollections();

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/digitallibrary/collections'),
				expect.any(Object)
			);
			expect(result).toHaveLength(2);
			expect(result[0].itemCount).toBe(25);
		});

		it('should throw error when fetching collections fails', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 500
			});

			await expect(digitalLibraryService.getCollections()).rejects.toMatchObject({
				status: 500,
				message: 'Error interno del servidor. Intenta nuevamente.'
			});
		});
	});

	// ================================================================
	// FILTER OPERATIONS
	// ================================================================

	describe('Filter operations', () => {
		it('should fetch available categories', async () => {
			const mockCategories = ['victor-jara', 'nueva-cancion', 'educacion-popular'];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockCategories
			});

			const result = await digitalLibraryService.getAvailableCategories();

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/digitallibrary/filters/categories'),
				expect.any(Object)
			);
			expect(result).toHaveLength(3);
		});

		it('should fetch available authors', async () => {
			const mockAuthors = ['Víctor Jara', 'Violeta Parra', 'Patricio Manns'];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockAuthors
			});

			const result = await digitalLibraryService.getAvailableAuthors();

			expect(result).toHaveLength(3);
			expect(result).toContain('Víctor Jara');
		});

		it('should fetch available tags', async () => {
			const mockTags = ['música', 'folklore', 'historia', 'educación'];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockTags
			});

			const result = await digitalLibraryService.getAvailableTags();

			expect(result).toHaveLength(4);
		});

		it('should fetch available languages', async () => {
			const mockLanguages = ['es', 'en', 'fr'];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockLanguages
			});

			const result = await digitalLibraryService.getAvailableLanguages();

			expect(result).toHaveLength(3);
		});

		it('should fetch available years', async () => {
			const mockYears = [2024, 2023, 2022, 2021, 2020];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockYears
			});

			const result = await digitalLibraryService.getAvailableYears();

			expect(result).toHaveLength(5);
			expect(result[0]).toBe(2024);
		});
	});

	// ================================================================
	// TRACKING OPERATIONS
	// ================================================================

	describe('Tracking operations', () => {
		it('should increment view count', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 204,
				headers: { get: () => null }
			});

			await digitalLibraryService.incrementViewCount('item-123');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/digitallibrary/items/item-123/view'),
				expect.objectContaining({
					method: 'POST'
				})
			);
		});

		it('should increment download count', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 204,
				headers: { get: () => null }
			});

			await digitalLibraryService.incrementDownloadCount('item-456');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/digitallibrary/items/item-456/download'),
				expect.objectContaining({
					method: 'POST'
				})
			);
		});

		it('should not throw error if increment view count fails (graceful degradation)', async () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 500
			});

			// Should not throw
			await expect(
				digitalLibraryService.incrementViewCount('item-123')
			).resolves.not.toThrow();

			expect(consoleWarnSpy).toHaveBeenCalled();
			consoleWarnSpy.mockRestore();
		});
	});

	// ================================================================
	// FILE VALIDATION
	// ================================================================

	describe('File validation', () => {
		it('should validate valid audio file', () => {
			const file = new File(['content'], 'audio.mp3', { type: 'audio/mp3' });
			Object.defineProperty(file, 'size', { value: 5000000 }); // 5MB

			const result = digitalLibraryService.validateFile(file);

			expect(result.isValid).toBe(true);
			expect(result.fileType).toBe('audio');
		});

		it('should validate valid video file', () => {
			const file = new File(['content'], 'video.mp4', { type: 'video/mp4' });
			Object.defineProperty(file, 'size', { value: 50000000 }); // 50MB

			const result = digitalLibraryService.validateFile(file);

			expect(result.isValid).toBe(true);
			expect(result.fileType).toBe('video');
		});

		it('should validate valid document file', () => {
			const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
			Object.defineProperty(file, 'size', { value: 1000000 }); // 1MB

			const result = digitalLibraryService.validateFile(file);

			expect(result.isValid).toBe(true);
			expect(result.fileType).toBe('document');
		});

		it('should reject file that is too large', () => {
			const file = new File(['content'], 'huge-audio.mp3', { type: 'audio/mp3' });
			Object.defineProperty(file, 'size', { value: 25 * 1024 * 1024 * 1024 }); // 25GB

			const result = digitalLibraryService.validateFile(file);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('demasiado grande');
		});

		it('should reject invalid file type', () => {
			const file = new File(['content'], 'file.exe', { type: 'application/x-msdownload' });
			Object.defineProperty(file, 'size', { value: 1000 });

			const result = digitalLibraryService.validateFile(file);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('no válido');
		});
	});

	// ================================================================
	// HELPER FUNCTIONS
	// ================================================================

	describe('Helper functions', () => {
		it('should format file size correctly', () => {
			expect(digitalLibraryService.formatFileSize(0)).toBe('0 Bytes');
			expect(digitalLibraryService.formatFileSize(1024)).toBe('1 KB');
			expect(digitalLibraryService.formatFileSize(1024 * 1024)).toBe('1 MB');
			expect(digitalLibraryService.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
			expect(digitalLibraryService.formatFileSize(1536)).toBe('1.5 KB');
		});

		it('should get correct file type icon', () => {
			expect(digitalLibraryService.getFileTypeIcon('image')).toBe('🖼️');
			expect(digitalLibraryService.getFileTypeIcon('video')).toBe('🎥');
			expect(digitalLibraryService.getFileTypeIcon('audio')).toBe('🎵');
			expect(digitalLibraryService.getFileTypeIcon('document')).toBe('📄');
			expect(digitalLibraryService.getFileTypeIcon('pdf')).toBe('📄');
			expect(digitalLibraryService.getFileTypeIcon('unknown')).toBe('📁');
		});

		it('should get correct file type color', () => {
			expect(digitalLibraryService.getFileTypeColor('image')).toBe('#10B981');
			expect(digitalLibraryService.getFileTypeColor('video')).toBe('#F59E0B');
			expect(digitalLibraryService.getFileTypeColor('audio')).toBe('#8B5CF6');
			expect(digitalLibraryService.getFileTypeColor('document')).toBe('#EF4444');
			expect(digitalLibraryService.getFileTypeColor('unknown')).toBe('#6B7280');
		});

		it('should get media URL correctly', () => {
			expect(digitalLibraryService.getMediaUrl('')).toBe('');
			expect(digitalLibraryService.getMediaUrl('http://example.com/file.pdf')).toBe(
				'http://example.com/file.pdf'
			);
			expect(digitalLibraryService.getMediaUrl('/media/library/file.pdf')).toBe(
				'/media/library/file.pdf'
			);
			expect(digitalLibraryService.getMediaUrl('library/file.pdf')).toBe(
				'/media/library/file.pdf'
			);
		});

		it('should get available categories with details', () => {
			const categories = digitalLibraryService.getAvailableCategoriesWithDetails();

			expect(categories.length).toBeGreaterThan(0);
			expect(categories[0]).toHaveProperty('id');
			expect(categories[0]).toHaveProperty('name');
			expect(categories[0]).toHaveProperty('description');

			const victorJaraCategory = categories.find((c) => c.id === 'victor-jara');
			expect(victorJaraCategory).toBeDefined();
			expect(victorJaraCategory?.name).toBe('Víctor Jara');
		});
	});

	// ================================================================
	// DOWNLOAD OPERATIONS
	// ================================================================

	describe('Download operations', () => {
		it('should download file and track download', async () => {
			// Mock DOM
			const mockLink = {
				href: '',
				download: '',
				target: '',
				click: vi.fn()
			};
			const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
			const appendChildSpy = vi
				.spyOn(document.body, 'appendChild')
				.mockImplementation(() => mockLink as any);
			const removeChildSpy = vi
				.spyOn(document.body, 'removeChild')
				.mockImplementation(() => mockLink as any);

			// Mock increment download
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 204,
				headers: { get: () => null }
			});

			const mockItem: LibraryItemDto = {
				id: 'item-123',
				title: 'Test Document',
				createdAt: '2024-01-01T00:00:00Z',
				uploadedBy: 'user1',
				fileType: 'document',
				filePath: '/media/library/doc.pdf',
				fileName: 'doc.pdf',
				fileSize: 1000000,
				tags: [],
				downloadCount: 5,
				viewCount: 20,
				isActive: true,
				isFeatured: false,
				collections: []
			};

			await digitalLibraryService.downloadFile(mockItem);

			// Verify download count was incremented
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/digitallibrary/items/item-123/download'),
				expect.objectContaining({ method: 'POST' })
			);

			// Verify link was created and clicked
			expect(mockLink.click).toHaveBeenCalled();
			expect(mockLink.download).toBe('doc.pdf');
			expect(mockLink.target).toBe('_blank');

			createElementSpy.mockRestore();
			appendChildSpy.mockRestore();
			removeChildSpy.mockRestore();
		});
	});
});
