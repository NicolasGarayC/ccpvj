import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { authModalStore } from '$lib/stores/authStore';

export interface JwtUser {
    id: number;
    username: string;
    role: string;
    nombre?: string;
    apellido?: string;
    telefono?: string;
    email?: string;
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
    private isUnloadListenerAdded = false;

    // Store token in localStorage
    setToken(token: string): void {
        if (browser) {
            localStorage.setItem(this.TOKEN_KEY, token);
            this.setupUnloadListeners(); // Setup cleanup on browser close
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

    // Parse JWT token to get payload
    private parseJwtPayload(token: string): any {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error parsing JWT token:', error);
            return null;
        }
    }

    // Check if token is expired
    private isTokenExpired(token: string): boolean {
        try {
            const payload = this.parseJwtPayload(token);
            if (!payload || !payload.exp) {
                return true; // If we can't read expiration, consider it expired
            }

            const expirationTime = payload.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();

            return currentTime >= expirationTime;
        } catch (error) {
            console.error('Error checking token expiration:', error);
            return true; // If there's an error, consider it expired
        }
    }

    // Check if user is authenticated and token is not expired
    isAuthenticated(): boolean {
        if (!this.hasValidTokenData()) {
            return false;
        }

        const token = this.getToken();
        if (!token) {
            return false;
        }

        if (this.isTokenExpired(token)) {
            this.removeToken(); // Auto-logout if token is expired
            authModalStore.showSessionExpired(); // Show modal
            return false;
        }

        return true;
    }

    // Get authorization header
    getAuthHeader(): Record<string, string> {
        const token = this.getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    // Login with username and password
    async login(username: string, password: string): Promise<LoginResponse> {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success && data.token) {
                this.setToken(data.token);
                if (data.user) {
                    this.setUser(data.user);
                }
            }

            return data;
        } catch (error) {
            console.error('Login error:', error);
            const message = error instanceof Error ? error.message : 'desconocido';
            return {
                success: false,
                message: 'Error de conexión: ' + message
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

    // Get token expiration time
    getTokenExpiration(): Date | null {
        const token = this.getToken();
        if (!token) return null;

        const payload = this.parseJwtPayload(token);
        if (!payload || !payload.exp) return null;

        return new Date(payload.exp * 1000);
    }

    // Get time remaining until token expires (in minutes)
    getTimeUntilExpiration(): number | null {
        const expiration = this.getTokenExpiration();
        if (!expiration) return null;

        const now = new Date();
        const diffMs = expiration.getTime() - now.getTime();
        return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
    }

    // Check if token will expire soon (within 5 minutes)
    isTokenExpiringSoon(): boolean {
        const timeRemaining = this.getTimeUntilExpiration();
        return timeRemaining !== null && timeRemaining <= 5;
    }

    // Setup listeners to clean token only on browser close (not tab close)
    private setupUnloadListeners(): void {
        if (!browser || this.isUnloadListenerAdded) return;

        const handleBrowserClose = () => {
            // Only clean token if all tabs are being closed (browser closing)
            // We detect this by checking if sessionStorage persists across tabs
            if (!sessionStorage.getItem('app_session_active')) {
                this.removeToken();
            }
        };

        // Set a session marker to detect if browser is still open
        sessionStorage.setItem('app_session_active', 'true');

        // Listen for beforeunload to detect browser close (not tab close)
        window.addEventListener('beforeunload', (event) => {
            // Check if this is the last tab by testing sessionStorage availability
            // in a short timeout (sessionStorage is shared across tabs)
            setTimeout(() => {
                try {
                    // If sessionStorage is still accessible and we can't set items,
                    // it means the browser is closing
                    sessionStorage.setItem('test_browser_close', 'true');
                    sessionStorage.removeItem('test_browser_close');
                } catch (e) {
                    // Browser is closing, sessionStorage is being destroyed
                    this.removeToken();
                }
            }, 10);
        });

        this.isUnloadListenerAdded = true;
    }

    // Remove unload listeners (useful for testing or cleanup)
    private removeUnloadListeners(): void {
        if (!browser || !this.isUnloadListenerAdded) return;

        // Remove session marker
        sessionStorage.removeItem('app_session_active');

        // Note: beforeunload listeners are automatically removed when page unloads
        // We don't need to manually remove them in this case

        this.isUnloadListenerAdded = false;
    }

    // Public method to manually clean token and remove listeners
    public cleanup(): void {
        this.removeToken();
        this.removeUnloadListeners();
    }
}

// Export singleton instance
export const jwtService = new JwtService();
