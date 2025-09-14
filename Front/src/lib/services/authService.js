class AuthService {
  constructor() {
    this.baseURL = '/api/auth';  // Usar API endpoints locales del frontend
  }

  async login(username, password) {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Almacenar datos del usuario para uso inmediato
        this.storeUser(data.data.user);
        return { success: true, data: data.data.user };
      } else {
        return { success: false, error: data.error || 'Error al iniciar sesión' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  }

  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.storeUser(data.data.user);
        return { success: true, data: data.data.user };
      } else {
        return { success: false, error: data.error || 'Error al registrarse' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  }

  async logout() {
    try {
      const response = await fetch(`${this.baseURL}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        this.clearUser();
        return { success: true };
      } else {
        return { success: false, error: 'Error al cerrar sesión' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    } finally {
      this.clearUser();
    }
  }

  storeUser(userData) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  }

  clearUser() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  }

  async checkSession() {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include'  // Incluir cookies
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.user) {
          this.storeUser(data.data.user);
          return data.data.user;
        }
      }
      
      // Si no hay sesión válida, limpiar datos locales
      this.clearUser();
      return null;
    } catch (error) {
      this.clearUser();
      return null;
    }
  }

  isAuthenticated() {
    if (typeof window === 'undefined') return false;
    const user = localStorage.getItem('user');
    return !!(user && user !== 'undefined' && user !== 'null');
  }

  getUser() {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    if (!user || user === 'undefined' || user === 'null') {
      return null;
    }
    try {
      return JSON.parse(user);
    } catch (error) {
      // Limpiar datos corruptos
      localStorage.removeItem('user');
      return null;
    }
  }
}

export const authService = new AuthService();