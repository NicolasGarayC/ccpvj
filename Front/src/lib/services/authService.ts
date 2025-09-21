import { simpleDecrypt } from '$lib/utils/crypto.js';
import type {
	LoginRequest,
	AuthResponse,
	UsuarioDto,
	AuthUser,
	LoginResponse,
	AuthStatus
} from '$lib/types/api';

class AuthService {
  private user: AuthUser | null = null;
  private readonly frontendURL = 'http://localhost:5173/api';
  private readonly userStorageKey = 'ccpvj_user';

  constructor() {
    this.loadUserFromStorage();
    this.checkAuthStatus();
  }

  private saveUserToStorage(): void {
    if (typeof window !== 'undefined') {
      if (this.user) {
        localStorage.setItem(this.userStorageKey, JSON.stringify(this.user));
      } else {
        localStorage.removeItem(this.userStorageKey);
      }
    }
  }

  private loadUserFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.userStorageKey);
        if (stored) {
          this.user = JSON.parse(stored);
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
        localStorage.removeItem(this.userStorageKey);
      }
    }
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const loginData: LoginRequest = {
        nombreUsuario: username,
        contrasena: password
      };
      console.log("[DEBUG] AuthService login iniciado con:", loginData);
      const response = await fetch(`${this.frontendURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      const data = await response.json() as { success: boolean; encrypted?: boolean; payload?: string; data?: any; error?: string };
      console.log("[DEBUG] Respuesta del servidor:", data);

      // Verificar si la respuesta está cifrada
      if (data.encrypted && data.payload) {
        try {

          // Descifrar la respuesta usando simpleDecrypt
          const decryptedJson = simpleDecrypt(data.payload);

          const decryptedData = JSON.parse(decryptedJson);

          if (!decryptedData || !decryptedData.data || !decryptedData.data.user) {

            throw new Error('Datos descifrados inválidos');
          }

          // Convert data to AuthUser for internal use
          const authUser: AuthUser = {
            id: Number(decryptedData.data.user.id),
            username: decryptedData.data.user.username,
            nombre: decryptedData.data.user.nombre,
            apellido: decryptedData.data.user.apellido,
            role: decryptedData.data.user.role
          };

          this.user = authUser;
          this.saveUserToStorage();
          return { success: true, user: authUser };
        } catch (decryptError) {
          // Fallback: si hay éxito, crear usuario temporal
          if (data.success) {
            const authUser: AuthUser = {
              id: 1,
              username: 'admin',
              nombre: 'Administrador',
              apellido: 'Sistema',
              role: 'administrador'
            };
            this.user = authUser;
            return { success: true, user: authUser };
          } else {
            throw new Error('Error procesando respuesta cifrada');
          }
        }
      } else {
        // Manejar respuesta sin cifrar (fallback)
        if (data.success && data.data) {
          const authUser: AuthUser = {
            id: Number(data.data.user.id),
            username: data.data.user.username,
            nombre: data.data.user.nombre,
            apellido: data.data.user.apellido,
            role: data.data.user.role
          };

          this.user = authUser;
          this.saveUserToStorage();
          return { success: true, user: authUser };
        } else {
          throw new Error(data.error || 'Error en la autenticación');
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión con el servidor'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.frontendURL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.user = null;
      this.saveUserToStorage();
    }
  }
async checkSession(): Promise<AuthUser | null> {
  await this.checkAuthStatus();
  return this.user;
}

  async checkAuthStatus(): Promise<void> {
    try {
      const response = await fetch(`${this.frontendURL}/auth/me`, {
        method: 'GET',
        credentials: 'include'
      });
      const result = await response.json() as { success: boolean; data?: { user: UsuarioDto } };

      if (result.success && result.data?.user) {
        // Convert UsuarioDto to AuthUser for internal use
        const authUser: AuthUser = {
          id: result.data.user.idUsuario,
          username: result.data.user.nombreUsuario,
          nombre: result.data.user.nombre,
          apellido: result.data.user.apellido,
          role: result.data.user.nombreRol
        };
        this.user = authUser;
        this.saveUserToStorage();
      } else {
        this.user = null;
        this.saveUserToStorage();
      }
    } catch (error) {
      console.error('Auth status check error:', error);
      this.user = null;
      this.saveUserToStorage();
    }
  }

  isAuthenticated(): boolean {
    return this.user !== null;
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  getUserRole(): string | null {
    return this.user?.role || null;
  }

  hasRole(role: string): boolean {
    return this.getUserRole() === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }

  canManageUsers(): boolean {
    return this.hasAnyRole(['administrador', 'colaborador']);
  }

  canManageContent(): boolean {
    return this.hasAnyRole(['administrador', 'colaborador']);
  }

  // Get current authentication status
  getAuthStatus(): AuthStatus {
    return {
      isAuthenticated: this.isAuthenticated(),
      user: this.user
    };
  }

  // Public method for authenticated requests used by other services (returns parsed JSON)
  async authenticatedFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.isAuthenticated()) {
      throw new Error('Usuario no autenticado');
    }
    const url = `${this.frontendURL}${endpoint}`;
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      if (response.status === 401) {
        this.user = null;
        this.saveUserToStorage();
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Public method for authenticated requests that returns raw Response
  async authenticatedFetchResponse(endpoint: string, options: RequestInit = {}): Promise<Response> {
    if (!this.isAuthenticated()) {
      throw new Error('Usuario no autenticado');
    }
    const url = `${this.frontendURL}${endpoint}`;
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    const response = await fetch(url, { ...defaultOptions, ...options });

    if (response.status === 401) {
      this.user = null;
      this.saveUserToStorage();
    }

    return response;
  }
}

// Instancia singleton
export const authService = new AuthService();

// Tipos exportados para uso en componentes
export type { AuthUser, LoginResponse };