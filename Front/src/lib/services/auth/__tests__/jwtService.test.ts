import { describe, it, expect, beforeEach, vi } from 'vitest';
import { jwtService } from '../jwtService';

/**
 * Tests Unitarios para JwtService
 *
 * Cubre:
 * - Almacenamiento y recuperación de tokens
 * - Verificación de autenticación
 * - Validación de expiración
 * - Manejo de roles
 */

describe('JwtService', () => {
	beforeEach(() => {
		// Limpiar localStorage antes de cada test
		localStorage.clear();
		vi.clearAllMocks();
	});

	describe('Token Management', () => {
		it('should store and retrieve token', () => {
			const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';

			jwtService.setToken(testToken);
			const retrieved = jwtService.getToken();

			expect(retrieved).toBe(testToken);
		});

		it('should remove token correctly', () => {
			const testToken = 'test-token';

			jwtService.setToken(testToken);
			jwtService.removeToken();

			expect(jwtService.getToken()).toBeNull();
		});

		it('should return null when no token exists', () => {
			expect(jwtService.getToken()).toBeNull();
		});
	});

	describe('User Management', () => {
		it('should store and retrieve user info', () => {
			const testUser = {
				id: 1,
				username: 'testuser',
				role: 'administrador',
				nombre: 'Test',
				apellido: 'User'
			};

			jwtService.setUser(testUser);
			const retrieved = jwtService.getUser();

			expect(retrieved).toEqual(testUser);
		});

		it('should parse user from stored JSON', () => {
			const testUser = { id: 1, username: 'test', role: 'colaborador' };
			localStorage.setItem('jwt_user', JSON.stringify(testUser));

			const retrieved = jwtService.getUser();

			expect(retrieved).toEqual(testUser);
		});
	});

	describe('Authentication Validation', () => {
		it('should return false when no token exists', () => {
			expect(jwtService.isAuthenticated()).toBe(false);
		});

		it('should return false when token exists but no user', () => {
			jwtService.setToken('test-token');

			expect(jwtService.isAuthenticated()).toBe(false);
		});

		it('should validate authentication with valid token and user', () => {
			// Token válido que expira en el futuro (año 2030)
			const validToken = createMockToken({ exp: Math.floor(Date.now() / 1000) + 157680000 });
			const testUser = { id: 1, username: 'test', role: 'administrador' };

			jwtService.setToken(validToken);
			jwtService.setUser(testUser);

			expect(jwtService.isAuthenticated()).toBe(true);
		});
	});

	describe('Role Validation', () => {
		beforeEach(() => {
			const token = createMockToken({ exp: Math.floor(Date.now() / 1000) + 157680000 });
			jwtService.setToken(token);
		});

		it('should correctly identify admin role', () => {
			jwtService.setUser({ id: 1, username: 'admin', role: 'administrador' });

			expect(jwtService.isAdmin()).toBe(true);
			expect(jwtService.hasRole('administrador')).toBe(true);
		});

		it('should correctly identify collaborator role', () => {
			jwtService.setUser({ id: 2, username: 'colab', role: 'colaborador' });

			expect(jwtService.isCollaborator()).toBe(true);
			expect(jwtService.canManageContent()).toBe(true);
		});

		it('should reject wrong role', () => {
			jwtService.setUser({ id: 3, username: 'user', role: 'asistente' });

			expect(jwtService.isAdmin()).toBe(false);
			expect(jwtService.canManageContent()).toBe(false);
		});
	});

	describe('Token Expiration', () => {
		it('should detect expired token', () => {
			// Token que expiró en el pasado
			const expiredToken = createMockToken({ exp: Math.floor(Date.now() / 1000) - 3600 });
			const testUser = { id: 1, username: 'test', role: 'administrador' };

			jwtService.setToken(expiredToken);
			jwtService.setUser(testUser);

			expect(jwtService.isAuthenticated()).toBe(false);
			// Verificar que limpia el token expirado
			expect(jwtService.getToken()).toBeNull();
		});

		it('should get token expiration date', () => {
			const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hora en el futuro
			const token = createMockToken({ exp: futureExp });

			jwtService.setToken(token);
			const expiration = jwtService.getTokenExpiration();

			expect(expiration).toBeInstanceOf(Date);
			expect(expiration?.getTime()).toBeCloseTo(futureExp * 1000, -3);
		});

		it('should calculate time until expiration', () => {
			const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hora
			const token = createMockToken({ exp: futureExp });

			jwtService.setToken(token);
			const minutesRemaining = jwtService.getTimeUntilExpiration();

			expect(minutesRemaining).toBeGreaterThan(59);
			expect(minutesRemaining).toBeLessThanOrEqual(60);
		});

		it('should detect token expiring soon', () => {
			const soonExp = Math.floor(Date.now() / 1000) + 240; // 4 minutos
			const token = createMockToken({ exp: soonExp });

			jwtService.setToken(token);

			expect(jwtService.isTokenExpiringSoon()).toBe(true);
		});
	});

	describe('Authorization Header', () => {
		it('should generate correct auth header', () => {
			const testToken = 'test-bearer-token';
			jwtService.setToken(testToken);

			const header = jwtService.getAuthHeader();

			expect(header).toEqual({ Authorization: `Bearer ${testToken}` });
		});

		it('should return empty object when no token', () => {
			const header = jwtService.getAuthHeader();

			expect(header).toEqual({});
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
