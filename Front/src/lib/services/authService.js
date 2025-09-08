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
        this.storeUser(data.user);
        return { success: true, data: data.user };
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
        this.storeUser(data.user);
        return { success: true, data: data.user };
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
      // También almacenar en cookies para compatibilidad con SSR
      document.cookie = `demo-user=${JSON.stringify(userData)}; path=/; max-age=${60 * 60 * 24 * 30}`;
    }
  }

  clearUser() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      // Limpiar cookie de demo
      document.cookie = 'demo-user=; path=/; max-age=0';
    }
  }

  isAuthenticated() {
    if (typeof window === 'undefined') return false;
    const user = localStorage.getItem('user');
    return !!user;
  }

  getUser() {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}

export const authService = new AuthService();