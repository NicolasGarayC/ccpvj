import { ApiError, BaseHttpService } from '$lib/infrastructure/http/BaseHttpClient';

// Tipos TypeScript para gestión de usuarios
export interface User {
	id: number;
	username: string;
	nombre: string;
	apellido: string;
	telefono?: string;
	role: string;
	createdAt: Date;
	updatedAt?: Date;
	isActive: boolean;
}

export interface CreateUserData {
	username: string;
	password: string;
	nombre: string;
	apellido: string;
	telefono?: string;
	role: string;
}

export interface UpdateUserData {
	username: string;
	nombre: string;
	apellido: string;
	telefono?: string;
	role: string;
	isActive: boolean;
	newPassword?: string;
}

export interface UserSearchParams {
	page?: number;
	pageSize?: number;
	searchTerm?: string;
	role?: string;
	isActive?: boolean;
	sortBy?: string;
}

export interface UserPagedResult {
	users: User[];
	totalCount: number;
	page: number;
	pageSize: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

export interface Role {
	name: string;
	displayName: string;
	description: string;
	permissions: string[];
}

export interface UserStats {
	totalUsers: number;
	activeUsers: number;
	inactiveUsers: number;
	usersByRole: Record<string, number>;
	lastUserCreated: Date;
}

class UserManagementService extends BaseHttpService {
	private readonly basePath = '/usermanagement';

	private adaptBackendToFrontend(backendUser: any): User {
		return {
			id: backendUser.id,
			username: backendUser.username,
			nombre: backendUser.nombre,
			apellido: backendUser.apellido,
			telefono: backendUser.telefono,
			role: backendUser.role,
			createdAt: new Date(backendUser.createdAt),
			updatedAt: backendUser.updatedAt ? new Date(backendUser.updatedAt) : undefined,
			isActive: backendUser.isActive
		};
	}

	// Obtener usuario por ID
	async getUser(id: number): Promise<User | null> {
		try {
			const data = await this.get<any>(`${this.basePath}/${id}`);
			return this.adaptBackendToFrontend(data);
		} catch (error) {
			if (error instanceof ApiError && error.status === 404) {
				return null;
			}
			console.error('Error al obtener usuario:', error);
			return null;
		}
	}

	// Obtener usuarios con filtros y paginación
	async getUsers(params: UserSearchParams = {}): Promise<UserPagedResult> {
		try {
			const data = await this.get<any>(this.basePath, params);
			return {
				users: (data.users ?? []).map((user: any) => this.adaptBackendToFrontend(user)),
				totalCount: data.totalCount,
				page: data.page,
				pageSize: data.pageSize,
				totalPages: data.totalPages,
				hasNextPage: data.hasNextPage,
				hasPreviousPage: data.hasPreviousPage
			};
		} catch (error) {
			console.error('Error al obtener usuarios:', error);
			throw error;
		}
	}

	// Crear nuevo usuario
	async createUser(userData: CreateUserData): Promise<User> {
		try {
			const data = await this.post<any>(this.basePath, userData);
			return this.adaptBackendToFrontend(data);
		} catch (error) {
			console.error('Error al crear usuario:', error);
			throw error;
		}
	}

	// Actualizar usuario
	async updateUser(id: number, userData: UpdateUserData): Promise<User> {
		try {
			const data = await this.put<any>(`${this.basePath}/${id}`, userData);
			return this.adaptBackendToFrontend(data);
		} catch (error) {
			console.error('Error al actualizar usuario:', error);
			throw error;
		}
	}

	// Eliminar (desactivar) usuario
	async deleteUser(id: number): Promise<boolean> {
		try {
			await this.delete<void>(`${this.basePath}/${id}`);
			return true;
		} catch (error) {
			console.error('Error al eliminar usuario:', error);
			throw error;
		}
	}

	// Cambiar estado de usuario (activar/desactivar)
	async toggleUserStatus(id: number, isActive: boolean): Promise<boolean> {
		try {
			await this.patch<void>(`${this.basePath}/${id}/status`, { isActive });
			return true;
		} catch (error) {
			console.error('Error al cambiar estado del usuario:', error);
			throw error;
		}
	}

	// Obtener roles disponibles
	async getAvailableRoles(): Promise<Role[]> {
		try {
			return await this.get<Role[]>(`${this.basePath}/roles`);
		} catch (error) {
			console.error('Error al obtener roles:', error);
			throw error;
		}
	}

	// Cambiar rol de usuario
	async changeUserRole(id: number, newRole: string): Promise<boolean> {
		try {
			await this.patch<void>(`${this.basePath}/${id}/role`, newRole);
			return true;
		} catch (error) {
			console.error('Error al cambiar rol del usuario:', error);
			throw error;
		}
	}

	// Verificar disponibilidad de nombre de usuario
	async checkUsernameAvailability(username: string, excludeUserId?: number): Promise<boolean> {
		try {
			const endpoint = excludeUserId
				? `${this.basePath}/check-username/${username}?excludeUserId=${excludeUserId}`
				: `${this.basePath}/check-username/${username}`;

			const data = await this.get<{ isAvailable: boolean }>(endpoint);
			return Boolean(data.isAvailable);
		} catch (error) {
			console.error('Error al verificar disponibilidad del username:', error);
			throw error;
		}
	}

	// Obtener estadísticas de usuarios (solo admin)
	async getUserStatistics(): Promise<UserStats> {
		try {
			const data = await this.get<UserStats>(`${this.basePath}/statistics`);
			return {
				...data,
				lastUserCreated: new Date(data.lastUserCreated)
			};
		} catch (error) {
			console.error('Error al obtener estadísticas:', error);
			throw error;
		}
	}

	// Restablecer contraseña
	async resetUserPassword(id: number, newPassword: string): Promise<boolean> {
		try {
			await this.post<void>(`${this.basePath}/${id}/reset-password`, newPassword);
			return true;
		} catch (error) {
			console.error('Error al restablecer contraseña:', error);
			throw error;
		}
	}

	// Obtener usuario actual
	async getCurrentUser(): Promise<User | null> {
		try {
			const data = await this.get<any>(`${this.basePath}/me`);
			return this.adaptBackendToFrontend(data);
		} catch (error) {
			if (error instanceof ApiError && error.status === 404) {
				return null;
			}
			console.error('Error al obtener usuario actual:', error);
			return null;
		}
	}

	// Verificar si puede gestionar usuarios
	async canManageUsers(): Promise<boolean> {
		try {
			const data = await this.get<{ canManage: boolean }>(`${this.basePath}/can-manage`);
			return Boolean(data.canManage);
		} catch (error) {
			console.error('Error al verificar permisos:', error);

			return false;
		}
	}

	// Utilidades para roles
	getRoleColor(role: string): string {
		const colors: Record<string, string> = {
			Asistente: 'bg-gray-100 text-gray-800',
			Colaborador: 'bg-blue-100 text-blue-800',
			Administrador: 'bg-red-100 text-red-800'
		};
		return colors[role] || 'bg-gray-100 text-gray-800';
	}

	getRoleIcon(role: string): string {
		const icons: Record<string, string> = {
			Asistente: 'eye',
			Colaborador: 'edit',
			Administrador: 'crown'
		};
		return icons[role] || 'user';
	}

	canAssignRole(currentUserRole: string, targetRole: string): boolean {
		if (targetRole === 'Administrador') {
			return currentUserRole === 'Administrador';
		}
		return currentUserRole === 'Administrador' || currentUserRole === 'Colaborador';
	}
}

export const userManagementService = new UserManagementService();
