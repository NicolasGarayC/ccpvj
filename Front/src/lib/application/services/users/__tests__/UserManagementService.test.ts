import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { userManagementService } from '../UserManagementService';
import type {
	CreateUserData,
	UpdateUserData,
	User,
	UserPagedResult,
	UserStats
} from '../UserManagementService';

vi.mock('$lib/application/services/auth/JwtService', () => ({
	jwtService: {
		getAuthHeader: vi.fn(() => ({ Authorization: 'Bearer mock-token' })),
		isAuthenticated: vi.fn(() => true),
		getUserRole: vi.fn(() => 'Administrador'),
		removeToken: vi.fn()
	}
}));

const createMockResponse = <T>(data: T, status = 200): Response & {
	json: () => Promise<T>;
	headers: { get: (key: string) => string | null };
} =>
	({
		ok: status >= 200 && status < 300,
		status,
		headers: {
			get: () => null
		},
		json: async () => data
	} as any);

describe('UserManagementService', () => {
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		global.fetch = vi.fn();
		vi.clearAllMocks();
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
	});

	describe('getUser', () => {
		it('returns an adapted user when found', async () => {
			const backendUser = {
				id: 1,
				username: 'jdoe',
				nombre: 'John',
				apellido: 'Doe',
				telefono: '123456789',
				role: 'Colaborador',
				createdAt: '2024-01-01T00:00:00.000Z',
				updatedAt: '2024-01-02T00:00:00.000Z',
				isActive: true
			};

			(global.fetch as any).mockResolvedValueOnce(createMockResponse(backendUser));

			const user = await userManagementService.getUser(1);

			expect(user).toEqual({
				...backendUser,
				createdAt: new Date(backendUser.createdAt),
				updatedAt: new Date(backendUser.updatedAt)
			});
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/usermanagement/1'),
				expect.any(Object)
			);
		});

		it('returns null when backend responds 404', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 404,
				headers: { get: () => null },
				json: async () => ({ message: 'Not Found' })
			});

			const user = await userManagementService.getUser(99);

			expect(user).toBeNull();
		});
	});

	describe('getUsers', () => {
		it('returns paginated users with adapted items', async () => {
			const backendResponse = {
				users: [
					{
						id: 1,
						username: 'jdoe',
						nombre: 'John',
						apellido: 'Doe',
						role: 'Administrador',
						createdAt: '2024-01-01T00:00:00.000Z',
						updatedAt: null,
						isActive: true
					}
				],
				totalCount: 1,
				page: 1,
				pageSize: 10,
				totalPages: 1,
				hasNextPage: false,
				hasPreviousPage: false
			};

			(global.fetch as any).mockResolvedValueOnce(createMockResponse(backendResponse));

			const result = await userManagementService.getUsers({ page: 1, pageSize: 10 });

			expect(result.users[0]).toMatchObject({
				username: 'jdoe',
				isActive: true
			});
			expect(result.totalCount).toBe(1);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/usermanagement?page=1&pageSize=10'),
				expect.any(Object)
			);
		});

		it('throws when the backend request fails', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 500,
				headers: { get: () => null },
				json: async () => ({ message: 'error' })
			});

			await expect(userManagementService.getUsers()).rejects.toBeDefined();
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe('createUser', () => {
		it('creates a user and adapts the response', async () => {
			const payload: CreateUserData = {
				username: 'new-user',
				password: 'Secure123!',
				nombre: 'New',
				apellido: 'User',
				role: 'Colaborador'
			};

			const backendUser = {
				id: 10,
				username: payload.username,
				nombre: payload.nombre,
				apellido: payload.apellido,
				role: payload.role,
				createdAt: '2024-05-01T00:00:00.000Z',
				isActive: true
			};

			(global.fetch as any).mockResolvedValueOnce(createMockResponse(backendUser, 201));

			const result = await userManagementService.createUser(payload);

			expect(result.id).toBe(10);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/usermanagement'),
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(payload)
				})
			);
		});

		it('rethrows when backend fails', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 400,
				headers: { get: () => null },
				json: async () => ({ message: 'Bad Request' })
			});

			await expect(
				userManagementService.createUser({
					username: 'bad-user',
					password: 'weak',
					nombre: 'Bad',
					apellido: 'User',
					role: 'Colaborador'
				})
			).rejects.toBeDefined();
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe('updateUser', () => {
		it('updates and returns the adapted user', async () => {
			const payload: UpdateUserData = {
				username: 'updated',
				nombre: 'Updated',
				apellido: 'User',
				role: 'Administrador',
				isActive: true
			};

			const backendUser = {
				...payload,
				id: 5,
				createdAt: '2024-01-01T00:00:00.000Z',
				updatedAt: '2024-05-01T00:00:00.000Z'
			};

			(global.fetch as any).mockResolvedValueOnce(createMockResponse(backendUser));

			const result = await userManagementService.updateUser(5, payload);

			expect(result.username).toBe('updated');
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/usermanagement/5'),
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify(payload)
				})
			);
		});
	});

	describe('deleteUser', () => {
		it('returns true when deletion succeeds', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 204,
				headers: { get: () => null },
				json: async () => ({})
			});

			const result = await userManagementService.deleteUser(3);

			expect(result).toBe(true);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/usermanagement/3'),
				expect.objectContaining({ method: 'DELETE' })
			);
		});
	});

	describe('toggleUserStatus', () => {
		it('sends the new status in the request body', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 204,
				headers: { get: () => null },
				json: async () => ({})
			});

		const result = await userManagementService.toggleUserStatus(4, false);

		expect(result).toBe(true);
		expect(global.fetch).toHaveBeenCalledWith(
			expect.stringContaining('/api/usermanagement/4/status'),
			expect.objectContaining({
				method: 'PATCH',
				body: JSON.stringify({ isActive: false })
			})
		);
	});
	});

	describe('getAvailableRoles', () => {
		it('returns role collection from backend', async () => {
			const roles = [
				{ name: 'Administrador', displayName: 'Administrador', description: '', permissions: [] }
			];

			(global.fetch as any).mockResolvedValueOnce(createMockResponse(roles));

			const result = await userManagementService.getAvailableRoles();

			expect(result).toEqual(roles);
		});
	});

	describe('changeUserRole', () => {
		it('sends PATCH request and returns true', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 204,
				headers: { get: () => null },
				json: async () => ({})
			});

			const result = await userManagementService.changeUserRole(7, 'Colaborador');

			expect(result).toBe(true);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/usermanagement/7/role'),
				expect.objectContaining({
					method: 'PATCH',
					body: JSON.stringify('Colaborador')
				})
			);
		});
	});

	describe('checkUsernameAvailability', () => {
		it('returns true when backend reports availability', async () => {
			(global.fetch as any).mockResolvedValueOnce(
				createMockResponse({ isAvailable: true })
			);

			const result = await userManagementService.checkUsernameAvailability('unique_user');

			expect(result).toBe(true);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/usermanagement/check-username/unique_user'),
				expect.any(Object)
			);
		});

		it('includes excludeUserId when provided', async () => {
			(global.fetch as any).mockResolvedValueOnce(
				createMockResponse({ isAvailable: false })
			);

			await userManagementService.checkUsernameAvailability('existing', 12);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/usermanagement/check-username/existing?excludeUserId=12'),
				expect.any(Object)
			);
		});
	});

	describe('getUserStatistics', () => {
		it('converts lastUserCreated into Date', async () => {
			const stats: UserStats = {
				totalUsers: 100,
				activeUsers: 80,
				inactiveUsers: 20,
				usersByRole: { Administrador: 5 },
				lastUserCreated: new Date('2024-05-01T10:00:00.000Z')
			};

			(global.fetch as any).mockResolvedValueOnce(
				createMockResponse({
					...stats,
					lastUserCreated: stats.lastUserCreated.toISOString()
				})
			);

			const result = await userManagementService.getUserStatistics();

			expect(result.lastUserCreated).toBeInstanceOf(Date);
			expect(result.totalUsers).toBe(100);
		});
	});

	describe('resetUserPassword', () => {
		it('returns true when password reset succeeds', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 204,
				headers: { get: () => null },
				json: async () => ({})
			});

			const result = await userManagementService.resetUserPassword(9, 'NewPass123!');

			expect(result).toBe(true);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/usermanagement/9/reset-password'),
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify('NewPass123!')
				})
			);
		});
	});

	describe('getCurrentUser', () => {
		it('returns null when API responds 404', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 404,
				headers: { get: () => null },
				json: async () => ({ message: 'Not Found' })
			});

			const result = await userManagementService.getCurrentUser();

			expect(result).toBeNull();
		});
	});

	describe('canManageUsers', () => {
		it('returns false when request fails', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 500,
				headers: { get: () => null },
				json: async () => ({ message: 'Error' })
			});

			const result = await userManagementService.canManageUsers();

			expect(result).toBe(false);
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});
});
