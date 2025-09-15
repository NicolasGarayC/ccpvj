// Servicio de autenticación basado en cookies/sesiones
interface LoginRequest {
  username: string;
  password: string;
}

interface AuthUser {
  id: string;
  username: string;
  nombre: string;
  apellido: string;
  role: string;
}

interface LoginResponse {
  success: boolean;
  error?: string;
  user?: AuthUser;
}

class AuthService {
  private baseURL = '/api/auth';
  private user: AuthUser | null = null;

  constructor() {
    this.checkAuthStatus();
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        credentials: 'include', // Important for cookie-based auth
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return { success: false, error: result.error || 'Error al iniciar sesión' };
      }

      this.user = result.user;
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseURL}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.user = null;
    }
  }

  async checkAuthStatus(): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/me`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.user) {
          this.user = result.data.user;
        } else {
          this.user = null;
        }
      } else {
        this.user = null;
      }
    } catch (error) {
      console.error('Auth status check error:', error);
      this.user = null;
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

  // Método para hacer peticiones autenticadas con cookies
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const defaultOptions: RequestInit = {
      credentials: 'include', // Always include cookies
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    // If we get 401, user is no longer authenticated
    if (response.status === 401) {
      this.user = null;
    }

    return response;
  }

  // Helper method to get authentication headers (returns empty object since we use cookies)
  getAuthHeaders(): Record<string, string> {
    return {}; // No headers needed for cookie-based auth
  }
}

// Instancia singleton
export const authService = new AuthService();

// Tipos exportados para uso en componentes
export type { AuthUser, LoginResponse };