// Servicio de autenticación integrado con backend .NET
interface LoginRequest {
  NombreUsuario: string;
  Contrasena: string;
}

interface AuthUser {
  idUsuario: number;
  nombreUsuario: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  nombreRol: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  usuario: AuthUser;
}

interface LoginResponse {
  success: boolean;
  error?: string;
  data?: AuthResponse;
}

interface RefreshTokenRequest {
  RefreshToken: string;
}

class AuthService {
  private baseURL = '/api/auth'; // Usar APIs proxy del frontend
  private user: AuthUser | null = null;

  constructor() {
    this.checkAuthStatus();
  }

  private getAuthHeaders() {
    const token = this.getAccessToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private storeTokens(authResponse: AuthResponse) {
    localStorage.setItem('accessToken', authResponse.accessToken);
    localStorage.setItem('refreshToken', authResponse.refreshToken);
    localStorage.setItem('tokenExpiresAt', authResponse.expiresAt);
    this.storeUser(authResponse.usuario);
  }

  private storeUser(user: AuthUser) {
    this.user = user;
    localStorage.setItem('userData', JSON.stringify(user));
  }

  private clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('userData');
    this.user = null;
  }

  private isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('tokenExpiresAt');
    if (!expiresAt) return true;
    
    return new Date() >= new Date(expiresAt);
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return { success: false, error: result.error || 'Error al iniciar sesión' };
      }

      const authResponse: AuthResponse = result.data;
      this.storeTokens(authResponse);
      
      return { success: true, data: authResponse };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ RefreshToken: refreshToken })
      });

      const result = await response.json();

      if (!response.ok || !result.success) return false;

      const authResponse: AuthResponse = result.data;
      this.storeTokens(authResponse);
      
      return true;
    } catch (error) {
      console.error('Refresh token error:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseURL}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  async logoutAllDevices(): Promise<void> {
    try {
      await fetch(`${this.baseURL}/logout-all`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Logout all devices error:', error);
    } finally {
      this.clearTokens();
    }
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    
    if (this.isTokenExpired()) {
      // Intentar renovar token automáticamente
      this.refreshToken().catch(() => this.clearTokens());
      return false;
    }
    
    return true;
  }

  getUser(): AuthUser | null {
    if (!this.user) {
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          this.user = JSON.parse(userData);
        } catch {
          this.clearTokens();
          return null;
        }
      }
    }
    return this.user;
  }

  getUserRole(): string | null {
    const user = this.getUser();
    return user?.nombreRol || null;
  }

  hasRole(role: string): boolean {
    return this.getUserRole() === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }

  canManageUsers(): boolean {
    return this.hasAnyRole(['Administrador', 'Colaborador']);
  }

  canManageContent(): boolean {
    return this.hasAnyRole(['Administrador', 'Educador', 'Colaborador']);
  }

  private checkAuthStatus() {
    // Verificar si hay tokens válidos al inicializar
    if (this.getAccessToken() && !this.isTokenExpired()) {
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          this.user = JSON.parse(userData);
        } catch {
          this.clearTokens();
        }
      }
    } else {
      this.clearTokens();
    }
  }

  // Método para hacer peticiones autenticadas
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...(options.headers || {})
    };

    let response = await fetch(url, { ...options, headers });

    // Si el token expiró, intentar renovarlo
    if (response.status === 401 && this.getRefreshToken()) {
      const refreshSuccess = await this.refreshToken();
      if (refreshSuccess) {
        // Reintentar la petición original con el nuevo token
        const newHeaders = {
          ...headers,
          ...this.getAuthHeaders()
        };
        response = await fetch(url, { ...options, headers: newHeaders });
      } else {
        this.clearTokens();
      }
    }

    return response;
  }
}

// Instancia singleton
export const authService = new AuthService();

// Tipos exportados para uso en componentes
export type { AuthUser, AuthResponse, LoginResponse };