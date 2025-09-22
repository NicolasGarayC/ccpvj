import { browser } from '$app/environment';

export interface JwtUser {
    id: number;
    username: string;
    role: string;
    nombre?: string;
    apellido?: string;
}

export interface LoginResponse {
    success: boolean;
    token?: string;
    user?: JwtUser;
    expiresAt?: string;
    message?: string;
}

class JwtService {
    private readonly TOKEN_KEY = 'jwt_token';
    private readonly USER_KEY = 'jwt_user';

    // Store token in localStorage
    setToken(token: string): void {
        if (browser) {
            localStorage.setItem(this.TOKEN_KEY, token);
        }
    }

    // Get token from localStorage
    getToken(): string | null {
        if (browser) {
            return localStorage.getItem(this.TOKEN_KEY);
        }
        return null;
    }

    // Remove token from localStorage
    removeToken(): void {
        if (browser) {
            localStorage.removeItem(this.TOKEN_KEY);
            localStorage.removeItem(this.USER_KEY);
        }
    }

    // Store user info in localStorage
    setUser(user: JwtUser): void {
        if (browser) {
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }
    }

    // Get user info from localStorage
    getUser(): JwtUser | null {
        if (browser) {
            const userStr = localStorage.getItem(this.USER_KEY);
            return userStr ? JSON.parse(userStr) : null;
        }
        return null;
    }

    // Check if token exists and user data is stored
    private hasValidTokenData(): boolean {
        const token = this.getToken();
        const user = this.getUser();
        return !!(token && user);
    }

    // Check if user is authenticated
    isAuthenticated(): boolean {
        return this.hasValidTokenData();
    }

    // Get authorization header
    getAuthHeader(): Record<string, string> {
        const token = this.getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    // Login with username and password
    async login(username: string, password: string): Promise<LoginResponse> {
        try {
            console.log('[DEBUG] JwtService.login called', { username, hasPassword: !!password });

            const requestBody = JSON.stringify({ username, password });
            console.log('[DEBUG] JwtService request body:', requestBody);

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: requestBody
            });

            console.log('[DEBUG] JwtService response status:', response.status);
            console.log('[DEBUG] JwtService response ok:', response.ok);
            console.log('[DEBUG] JwtService response headers:', Object.fromEntries(response.headers.entries()));

            const data = await response.json();
            console.log('[DEBUG] JwtService response data:', data);

            if (data.success && data.token) {
                console.log('[DEBUG] Login successful, setting token');
                this.setToken(data.token);
                if (data.user) {
                    this.setUser(data.user);
                }
            } else {
                console.log('[DEBUG] Login failed:', data.message);
            }

            return data;
        } catch (error) {
            console.error('[DEBUG] JwtService login error:', error);
            console.error('[DEBUG] Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            return {
                success: false,
                message: 'Error de conexión: ' + error.message
            };
        }
    }

    // Logout
    async logout(): Promise<void> {
        try {
            // Call backend logout endpoint
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: this.getAuthHeader()
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always remove local tokens
            this.removeToken();
        }
    }

    // Validate token with backend
    async validateToken(): Promise<JwtUser | null> {
        try {
            const response = await fetch('/api/auth/validate', {
                headers: this.getAuthHeader()
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user) {
                    this.setUser(data.user);
                    return data.user;
                }
            }

            // If validation fails, remove token
            this.removeToken();
            return null;
        } catch (error) {
            console.error('Token validation error:', error);
            this.removeToken();
            return null;
        }
    }

    // Check user role
    hasRole(role: string): boolean {
        const user = this.getUser();
        return user?.role === role;
    }

    // Check if user is admin
    isAdmin(): boolean {
        return this.hasRole('administrador');
    }

    // Check if user is collaborator
    isCollaborator(): boolean {
        return this.hasRole('colaborador');
    }

    // Check if user can manage content (admin or collaborator)
    canManageContent(): boolean {
        return this.isAdmin() || this.isCollaborator();
    }
}

// Export singleton instance
export const jwtService = new JwtService();