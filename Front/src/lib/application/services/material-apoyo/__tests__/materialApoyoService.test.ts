import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { materialApoyoService } from '../MaterialApoyoService';
import type {
	MaterialApoyoDto,
	MaterialApoyoDetailDto,
	ModuleDto,
	ModuleSummaryDto,
	PostDto,
	CreateMaterialApoyoDto,
	CreateModuleDto,
	CreatePostDto,
	UpdateMaterialApoyoDto
} from '$lib/types/api';

/**
 * Tests Unitarios para MaterialApoyoService
 *
 * Cubre la jerarquía completa:
 * - Material de Apoyo (Proyectos)
 * - Módulos
 * - Posts
 *
 * Verifica:
 * - GETs públicos (sin autenticación)
 * - CRUDs protegidos (con JWT)
 * - Manejo de errores
 */

const createMockStorage = () =>
	({
		getItem: vi.fn(),
		setItem: vi.fn(),
		removeItem: vi.fn(),
		clear: vi.fn(),
		length: 0,
		key: vi.fn()
	} satisfies Storage);

describe('MaterialApoyoService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn();
		Object.defineProperty(globalThis, 'localStorage', {
			value: createMockStorage(),
			configurable: true,
			writable: true
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		delete (globalThis as any).localStorage;
	});

	// ==========================================
	// MATERIAL DE APOYO (Proyectos) - Tests
	// ==========================================

	describe('Material de Apoyo - GET (Público)', () => {
		it('should get all material de apoyo without auth', async () => {
			const mockData: MaterialApoyoDetailDto[] = [
				{
					id: '1',
					title: 'Matemáticas Básicas',
					description: 'Curso de matemáticas',
					isActive: true,
					isFeatured: false,
					createdAt: '2024-01-01T00:00:00.000Z',
					updatedAt: '2024-01-02T00:00:00.000Z',
					educatorId: 1,
					educatorName: 'Prof. Test',
					imagePath: undefined,
					moduleCount: 0,
					postCount: 0,
					modules: []
				}
			];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ data: mockData, totalItems: 1, totalPages: 1 })
			});

			const result = await materialApoyoService.getMaterialApoyo();

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/materialapoyo'),
				expect.objectContaining({
					method: 'GET'
				})
			);
			expect(result.data).toEqual(mockData);
		});

		it('should get material by ID without auth', async () => {
			const mockMaterial: MaterialApoyoDetailDto = {
				id: 'test-id',
				title: 'Test Material',
				description: 'Test Description',
				isActive: true,
				isFeatured: false,
				createdAt: '2024-01-01T00:00:00.000Z',
				updatedAt: '2024-01-02T00:00:00.000Z',
				educatorId: 1,
				educatorName: 'Prof. Test',
				imagePath: undefined,
				moduleCount: 0,
				postCount: 0,
				modules: []
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockMaterial
			});

			const result = await materialApoyoService.getMaterialApoyoById('test-id');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/materialapoyo/test-id'),
				expect.any(Object)
			);
			expect(result).toEqual(mockMaterial);
		});

		it('should return null when material not found', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 404,
				json: async () => ({ message: 'Not found' })
			});

			const result = await materialApoyoService.getMaterialApoyoById('non-existent');

			expect(result).toBeNull();
		});

		it('should get featured materials', async () => {
			const mockFeatured: MaterialApoyoDetailDto[] = [
				{
					id: '1',
					title: 'Featured Material',
					description: 'Featured',
					isActive: true,
					isFeatured: true,
					createdAt: '2024-01-03T00:00:00.000Z',
					updatedAt: '2024-01-04T00:00:00.000Z',
					educatorId: 1,
					educatorName: 'Prof. Test',
					imagePath: undefined,
					moduleCount: 0,
					postCount: 0,
					modules: []
				}
			];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockFeatured
			});

			const result = await materialApoyoService.getFeaturedMaterialApoyo(6);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/materialapoyo/featured?count=6'),
				expect.any(Object)
			);
			expect(result).toEqual(mockFeatured);
		});
	});

	describe('Material de Apoyo - CRUD (Protegido)', () => {
		beforeEach(() => {
			// Mock de token JWT válido
			(global.localStorage.getItem as any).mockImplementation((key: string) => {
				if (key === 'jwt_token') return 'valid-jwt-token';
				if (key === 'jwt_user')
					return JSON.stringify({ id: 1, username: 'admin', role: 'administrador' });
				return null;
			});
		});

		it('should create material de apoyo with JWT token', async () => {
			const newMaterial: CreateMaterialApoyoDto = {
				title: 'Nuevo Material',
				description: 'Descripción del material',
				isFeatured: false,
				educatorName: 'Prof. Test'
			};

			const mockResponse: MaterialApoyoDto = {
				id: 'new-id',
				title: newMaterial.title,
				description: newMaterial.description,
				isActive: true,
				isFeatured: false,
				createdAt: '2024-02-01T00:00:00.000Z',
				updatedAt: '2024-02-01T01:00:00.000Z',
				educatorId: 1,
				educatorName: newMaterial.educatorName ?? 'Prof. Test',
				imagePath: undefined,
				moduleCount: 0,
				postCount: 0
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

		const result = await materialApoyoService.createMaterialApoyo(newMaterial);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/materialapoyo'),
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						Authorization: 'Bearer valid-jwt-token'
					}),
					body: JSON.stringify(newMaterial)
				})
			);
			expect(result.id).toBe('new-id');
		});

		it('should update material de apoyo with JWT', async () => {
			const updateData = {
				title: 'Título Actualizado',
				description: 'Descripción actualizada'
			} as unknown as UpdateMaterialApoyoDto;

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await materialApoyoService.updateMaterialApoyo('test-id', updateData);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/materialapoyo/test-id'),
				expect.objectContaining({
					method: 'PUT',
					headers: expect.objectContaining({
						Authorization: 'Bearer valid-jwt-token'
					})
				})
			);
		});

		it('should delete material de apoyo with JWT', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await materialApoyoService.deleteMaterialApoyo('test-id');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/materialapoyo/test-id'),
				expect.objectContaining({
					method: 'DELETE',
					headers: expect.objectContaining({
						Authorization: 'Bearer valid-jwt-token'
					})
				})
			);
		});

		it('should reject create without valid JWT', async () => {
			// Sin token
			(global.localStorage.getItem as any).mockReturnValue(null);

			const newMaterial: CreateMaterialApoyoDto = {
				title: 'Material sin auth',
				description: 'No debería crearse',
				isFeatured: false,
				educatorName: 'Prof. Invitado'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 401,
				json: async () => ({ message: 'Unauthorized' })
			});

			await expect(materialApoyoService.createMaterialApoyo(newMaterial)).rejects.toThrow();
		});
	});

	// ==========================================
	// MÓDULOS - Tests
	// ==========================================

	describe('Módulos - GET (Público)', () => {
		it('should get module by ID without auth', async () => {
			const mockModule: ModuleDto = {
				id: 'module-1',
				title: 'Módulo 1',
				description: 'Descripción del módulo',
				orderNumber: 1,
				materialApoyoId: 'material-1',
				isActive: true,
				postCount: 0,
				createdAt: '2024-01-05T00:00:00.000Z',
				updatedAt: '2024-01-06T00:00:00.000Z'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockModule
			});

			const result = await materialApoyoService.getModule('module-1');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/materialapoyo/modules/module-1'),
				expect.any(Object)
			);
			expect(result).toEqual(mockModule);
		});

		it('should get modules for a material', async () => {
			const mockModules: ModuleSummaryDto[] = [
				{
					id: 'module-1',
					title: 'Módulo 1',
					description: 'Resumen módulo 1',
					orderNumber: 1,
					isActive: true,
					postCount: 0
				},
				{
					id: 'module-2',
					title: 'Módulo 2',
					description: 'Resumen módulo 2',
					orderNumber: 2,
					isActive: true,
					postCount: 0
				}
			];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockModules
			});

			const result = await materialApoyoService.getMaterialApoyoModules('material-1');

			expect(result).toHaveLength(2);
			expect(result[0].title).toBe('Módulo 1');
		});
	});

	describe('Módulos - CRUD (Protegido)', () => {
		beforeEach(() => {
			// Mock de token JWT válido
			(global.localStorage.getItem as any).mockImplementation((key: string) => {
				if (key === 'jwt_token') return 'valid-jwt-token';
				if (key === 'jwt_user')
					return JSON.stringify({ id: 1, username: 'admin', role: 'administrador' });
				return null;
			});
		});

		it('should create module with JWT', async () => {
			const newModule: CreateModuleDto = {
				title: 'Nuevo Módulo',
				description: 'Descripción del módulo',
				orderNumber: 1,
				materialApoyoId: 'material-1'
			};

			const mockResponse: ModuleDto = {
				id: 'new-module-id',
				title: newModule.title,
				description: newModule.description,
				orderNumber: newModule.orderNumber,
				isActive: true,
				materialApoyoId: newModule.materialApoyoId,
				postCount: 0,
				createdAt: '2024-01-07T00:00:00.000Z',
				updatedAt: '2024-01-08T00:00:00.000Z'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			const result = await materialApoyoService.createModule(newModule);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/materialapoyo/modules'),
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						Authorization: 'Bearer valid-jwt-token'
					})
				})
			);
			expect(result.id).toBe('new-module-id');
		});

		it('should update module with JWT', async () => {
			const updateData = {
				title: 'Módulo Actualizado',
				description: 'Nueva descripción',
				orderNumber: 2
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await materialApoyoService.updateModule('module-1', updateData);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/materialapoyo/modules/module-1'),
				expect.objectContaining({
					method: 'PUT',
					headers: expect.objectContaining({
						Authorization: 'Bearer valid-jwt-token'
					})
				})
			);
		});

		it('should delete module with JWT', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await materialApoyoService.deleteModule('module-1');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/materialapoyo/modules/module-1'),
				expect.objectContaining({
					method: 'DELETE',
					headers: expect.objectContaining({
						Authorization: 'Bearer valid-jwt-token'
					})
				})
			);
		});

		it('should reorder module with JWT', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await materialApoyoService.reorderModule('module-1', 3);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/materialapoyo/modules/module-1/reorder'),
				expect.objectContaining({
					method: 'PATCH',
					headers: expect.objectContaining({
						Authorization: 'Bearer valid-jwt-token'
					}),
					body: JSON.stringify({ newOrderNumber: 3 })
				})
			);
		});
	});

	// ==========================================
	// POSTS - Tests
	// ==========================================

	describe('Posts - GET (Público)', () => {
		it('should get post by ID without auth', async () => {
			const mockPost: PostDto = {
				id: 'post-1',
				title: 'Post 1',
				description: 'Descripción del post',
				longText: 'Contenido del post',
				orderNumber: 1,
				isActive: true,
				moduleId: 'module-1',
				createdAt: '2024-01-09T00:00:00.000Z',
				updatedAt: '2024-01-09T01:00:00.000Z',
				subtitle: 'Subtítulo',
				content: 'Contenido del post'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockPost
			});

			const result = await materialApoyoService.getPost('post-1');

			expect(result).toEqual(mockPost);
		});

		it('should get posts for a module', async () => {
			const mockPosts: PostDto[] = [
				{
					id: 'post-1',
					title: 'Post 1',
					description: 'Descripción post 1',
					longText: 'Contenido largo post 1',
					orderNumber: 1,
					moduleId: 'module-1',
					isActive: true,
					createdAt: '2024-01-10T00:00:00.000Z',
					updatedAt: '2024-01-10T01:00:00.000Z'
				},
				{
					id: 'post-2',
					title: 'Post 2',
					description: 'Descripción post 2',
					longText: 'Contenido largo post 2',
					orderNumber: 2,
					moduleId: 'module-1',
					isActive: true,
					createdAt: '2024-01-11T00:00:00.000Z',
					updatedAt: '2024-01-11T01:00:00.000Z'
				}
			];

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockPosts
			});

			const result = await materialApoyoService.getModulePosts('module-1');

			expect(result).toHaveLength(2);
			expect(result[0].title).toBe('Post 1');
		});
	});

	describe('Posts - CRUD (Protegido)', () => {
		beforeEach(() => {
			// Mock de token JWT válido
			(global.localStorage.getItem as any).mockImplementation((key: string) => {
				if (key === 'jwt_token') return 'valid-jwt-token';
				if (key === 'jwt_user')
					return JSON.stringify({ id: 1, username: 'admin', role: 'administrador' });
				return null;
			});
		});

		it('should create post with JWT', async () => {
			const newPost: CreatePostDto = {
				title: 'Nuevo Post',
				description: 'Descripción del post',
				longText: 'Contenido largo del post',
				subtitle: 'Subtítulo del post',
				content: 'Contenido del post',
				orderNumber: 1,
				moduleId: 'module-1'
			};

			const mockResponse: PostDto = {
				id: 'new-post-id',
				title: newPost.title,
				description: newPost.description ?? '',
				longText: newPost.longText,
				orderNumber: newPost.orderNumber,
				moduleId: newPost.moduleId,
				isActive: true,
				createdAt: '2024-01-12T00:00:00.000Z',
				updatedAt: '2024-01-12T01:00:00.000Z',
				imagePath: undefined,
				videoPath: undefined,
				audioPath: undefined,
				subtitle: newPost.subtitle,
				content: newPost.content
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			const result = await materialApoyoService.createPost(newPost);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/materialapoyo/posts'),
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						Authorization: 'Bearer valid-jwt-token'
					})
				})
			);
			expect(result.id).toBe('new-post-id');
		});

		it('should update post with JWT', async () => {
			const updateData = {
				title: 'Post Actualizado',
				content: 'Contenido actualizado',
				orderNumber: 1
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await materialApoyoService.updatePost('post-1', updateData);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/materialapoyo/posts/post-1'),
				expect.objectContaining({
					method: 'PUT',
					headers: expect.objectContaining({
						Authorization: 'Bearer valid-jwt-token'
					})
				})
			);
		});

		it('should delete post with JWT', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await materialApoyoService.deletePost('post-1');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/materialapoyo/posts/post-1'),
				expect.objectContaining({
					method: 'DELETE',
					headers: expect.objectContaining({
						Authorization: 'Bearer valid-jwt-token'
					})
				})
			);
		});
	});

	// ==========================================
	// AUTORIZACIÓN - Tests
	// ==========================================

	describe('Authorization Checks', () => {
		it('should check auth status with valid token', async () => {
			(global.localStorage.getItem as any).mockImplementation((key: string) => {
				if (key === 'jwt_token') {
					// Token que expira en el futuro
					const futureExp = Math.floor(Date.now() / 1000) + 3600;
					return createMockToken({ exp: futureExp });
				}
				if (key === 'jwt_user')
					return JSON.stringify({ id: 1, username: 'admin', role: 'administrador' });
				return null;
			});

			const { canManage, user } = await materialApoyoService.checkAuthStatus();

			expect(canManage).toBe(true);
			expect(user).not.toBeNull();
			expect(user.role).toBe('administrador');
		});

		it('should check auth status without token', async () => {
			(global.localStorage.getItem as any).mockReturnValue(null);

			const { canManage, user } = await materialApoyoService.checkAuthStatus();

			expect(canManage).toBe(false);
			expect(user).toBeNull();
		});

		it('should check auth status for collaborator', async () => {
			(global.localStorage.getItem as any).mockImplementation((key: string) => {
				if (key === 'jwt_token') {
					const futureExp = Math.floor(Date.now() / 1000) + 3600;
					return createMockToken({ exp: futureExp });
				}
				if (key === 'jwt_user')
					return JSON.stringify({ id: 2, username: 'colab', role: 'colaborador' });
				return null;
			});

			const { canManage, user } = await materialApoyoService.checkAuthStatus();

			expect(canManage).toBe(true); // Colaborador puede gestionar contenido
			expect(user.role).toBe('colaborador');
		});

		it('should check auth status for assistant (read-only)', async () => {
			(global.localStorage.getItem as any).mockImplementation((key: string) => {
				if (key === 'jwt_token') {
					const futureExp = Math.floor(Date.now() / 1000) + 3600;
					return createMockToken({ exp: futureExp });
				}
				if (key === 'jwt_user')
					return JSON.stringify({ id: 3, username: 'asistente', role: 'asistente' });
				return null;
			});

			const { canManage, user } = await materialApoyoService.checkAuthStatus();

			expect(canManage).toBe(false); // Asistente no puede gestionar
			expect(user.role).toBe('asistente');
		});
	});
});

// Utilidad para crear tokens JWT mock
function createMockToken(payload: Record<string, any>): string {
	const header = { alg: 'HS256', typ: 'JWT' };
	const encodedHeader = btoa(JSON.stringify(header));
	const encodedPayload = btoa(JSON.stringify(payload));
	const signature = 'mock-signature';

	return `${encodedHeader}.${encodedPayload}.${signature}`;
}
