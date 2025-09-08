import { authService } from '../authService';

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

class UserManagementService {
  private baseURL = 'https://localhost:5251/api';

  // Método obsoleto - ahora usamos authService.authenticatedFetch
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

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
      const response = await authService.authenticatedFetch(`${this.baseURL}/usermanagement/${id}`);

      if (!response.ok) return null;

      const data = await response.json();
      return this.adaptBackendToFrontend(data);
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      return null;
    }
  }

  // Obtener usuarios con filtros y paginación
  async getUsers(params: UserSearchParams = {}): Promise<UserPagedResult> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await authService.authenticatedFetch(`${this.baseURL}/usermanagement?${queryParams}`);

      if (!response.ok) throw new Error('Error al obtener usuarios');

      const data = await response.json();
      return {
        users: data.users.map((user: any) => this.adaptBackendToFrontend(user)),
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
      const response = await authService.authenticatedFetch(`${this.baseURL}/usermanagement`, {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Error al crear usuario');
      }

      const data = await response.json();
      return this.adaptBackendToFrontend(data);
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  }

  // Actualizar usuario
  async updateUser(id: number, userData: UpdateUserData): Promise<User> {
    try {
      const response = await authService.authenticatedFetch(`${this.baseURL}/usermanagement/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Error al actualizar usuario');
      }

      const data = await response.json();
      return this.adaptBackendToFrontend(data);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  }

  // Eliminar (desactivar) usuario
  async deleteUser(id: number): Promise<boolean> {
    try {
      const response = await authService.authenticatedFetch(`${this.baseURL}/usermanagement/${id}`, {
        method: 'DELETE'
      });

      return response.ok;
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  }

  // Cambiar estado de usuario (activar/desactivar)
  async toggleUserStatus(id: number, isActive: boolean): Promise<boolean> {
    try {
      const response = await authService.authenticatedFetch(`${this.baseURL}/usermanagement/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(isActive)
      });

      return response.ok;
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      throw error;
    }
  }

  // Obtener roles disponibles
  async getAvailableRoles(): Promise<Role[]> {
    try {
      const response = await authService.authenticatedFetch(`${this.baseURL}/usermanagement/roles`);

      if (!response.ok) throw new Error('Error al obtener roles');

      return await response.json();
    } catch (error) {
      console.error('Error al obtener roles:', error);
      throw error;
    }
  }

  // Cambiar rol de usuario
  async changeUserRole(id: number, newRole: string): Promise<boolean> {
    try {
      const response = await authService.authenticatedFetch(`${this.baseURL}/usermanagement/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify(newRole)
      });

      return response.ok;
    } catch (error) {
      console.error('Error al cambiar rol del usuario:', error);
      throw error;
    }
  }

  // Verificar disponibilidad de nombre de usuario
  async checkUsernameAvailability(username: string, excludeUserId?: number): Promise<boolean> {
    try {
      const url = excludeUserId 
        ? `${this.baseURL}/usermanagement/check-username/${username}?excludeUserId=${excludeUserId}`
        : `${this.baseURL}/usermanagement/check-username/${username}`;

      const response = await authService.authenticatedFetch(url);

      if (!response.ok) throw new Error('Error al verificar username');

      const data = await response.json();
      return data.isAvailable;
    } catch (error) {
      console.error('Error al verificar disponibilidad del username:', error);
      throw error;
    }
  }

  // Obtener estadísticas de usuarios (solo admin)
  async getUserStatistics(): Promise<UserStats> {
    try {
      const response = await authService.authenticatedFetch(`${this.baseURL}/usermanagement/statistics`);

      if (!response.ok) throw new Error('Error al obtener estadísticas');

      const data = await response.json();
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
      const response = await authService.authenticatedFetch(`${this.baseURL}/usermanagement/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify(newPassword)
      });

      return response.ok;
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      throw error;
    }
  }

  // Obtener usuario actual
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await authService.authenticatedFetch(`${this.baseURL}/usermanagement/me`);

      if (!response.ok) return null;

      const data = await response.json();
      return this.adaptBackendToFrontend(data);
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      return null;
    }
  }

  // Verificar si puede gestionar usuarios
  async canManageUsers(): Promise<boolean> {
    try {
      const response = await authService.authenticatedFetch(`${this.baseURL}/usermanagement/can-manage`);

      if (!response.ok) return false;

      const data = await response.json();
      return data.canManage;
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      return false;
    }
  }

  // Utilidades para roles
  getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      'Asistente': 'bg-gray-100 text-gray-800',
      'Colaborador': 'bg-blue-100 text-blue-800',
      'Administrador': 'bg-red-100 text-red-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  }

  getRoleIcon(role: string): string {
    const icons: Record<string, string> = {
      'Asistente': 'eye',
      'Colaborador': 'edit',
      'Administrador': 'crown'
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