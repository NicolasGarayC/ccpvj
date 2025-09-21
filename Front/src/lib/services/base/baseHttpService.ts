/**
 * BaseHttpService - Infraestructura común para todos los servicios HTTP
 * Reemplaza el acceso directo SQLite por HTTP calls al backend .NET
 */

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export interface PagedResult<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
		public response?: Response
	) {
		super(message);
		this.name = 'ApiError';
	}
}

export class BaseHttpService {
	protected readonly baseURL = 'http://localhost:5251/api';

	/**
	 * Realizar petición HTTP con manejo de errores y autenticación
	 */
	protected async fetch<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		const url = `${this.baseURL}${endpoint}`;

		const defaultOptions: RequestInit = {
			credentials: 'include', // CRUCIAL para cookies authentication
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			}
		};

		const response = await fetch(url, { ...defaultOptions, ...options });

		if (!response.ok) {
			await this.handleError(response);
		}

		// Handle empty responses (204 No Content, etc.)
		if (response.status === 204 || response.headers.get('content-length') === '0') {
			return {} as T;
		}

		const data = await response.json();
		return data;
	}

	/**
	 * GET request
	 */
	protected async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
		const url = params ? `${endpoint}?${this.buildQueryString(params)}` : endpoint;
		return this.fetch<T>(url, { method: 'GET' });
	}

	/**
	 * POST request
	 */
	protected async post<T>(endpoint: string, data?: any): Promise<T> {
		return this.fetch<T>(endpoint, {
			method: 'POST',
			body: data ? JSON.stringify(data) : undefined
		});
	}

	/**
	 * PUT request
	 */
	protected async put<T>(endpoint: string, data?: any): Promise<T> {
		return this.fetch<T>(endpoint, {
			method: 'PUT',
			body: data ? JSON.stringify(data) : undefined
		});
	}

	/**
	 * DELETE request
	 */
	protected async delete<T>(endpoint: string): Promise<T> {
		return this.fetch<T>(endpoint, { method: 'DELETE' });
	}

	/**
	 * PATCH request
	 */
	protected async patch<T>(endpoint: string, data?: any): Promise<T> {
		return this.fetch<T>(endpoint, {
			method: 'PATCH',
			body: data ? JSON.stringify(data) : undefined
		});
	}

	/**
	 * Upload files (FormData)
	 */
	protected async upload<T>(endpoint: string, formData: FormData): Promise<T> {
		return this.fetch<T>(endpoint, {
			method: 'POST',
			body: formData,
			headers: {} // No Content-Type header for FormData
		});
	}

	/**
	 * Download file as Blob
	 */
	protected async downloadBlob(endpoint: string): Promise<Blob> {
		const url = `${this.baseURL}${endpoint}`;

		const response = await fetch(url, {
			credentials: 'include',
			method: 'GET'
		});

		if (!response.ok) {
			await this.handleError(response);
		}

		return response.blob();
	}

	/**
	 * Build query string from params object
	 */
	private buildQueryString(params: Record<string, any>): string {
		const searchParams = new URLSearchParams();

		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== '') {
				searchParams.append(key, String(value));
			}
		});

		return searchParams.toString();
	}

	/**
	 * Handle HTTP errors with proper error messages
	 */
	private async handleError(response: Response): Promise<never> {
		let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

		try {
			const errorData = await response.json();
			if (errorData.error) {
				errorMessage = errorData.error;
			} else if (errorData.message) {
				errorMessage = errorData.message;
			} else if (errorData.title) {
				errorMessage = errorData.title;
			}
		} catch {
			// If response is not JSON, use status text
		}

		// Handle specific HTTP status codes
		switch (response.status) {
			case 401:
				// Redirect to login on unauthorized, but NOT if we're already on login page
				if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
					window.location.href = '/auth/login';
				}
				throw new ApiError(401, 'No autorizado. Redirigiendo al login...');

			case 403:
				throw new ApiError(403, 'No tienes permisos para realizar esta acción');

			case 404:
				throw new ApiError(404, 'Recurso no encontrado');

			case 422:
				throw new ApiError(422, errorMessage || 'Datos de entrada inválidos');

			case 500:
				throw new ApiError(500, 'Error interno del servidor. Intenta nuevamente.');

			default:
				throw new ApiError(response.status, errorMessage, response);
		}
	}

	/**
	 * Check if user is authenticated by making a test request
	 */
	protected async checkAuth(): Promise<boolean> {
		try {
			await this.get('/simple-auth/me');
			return true;
		} catch (error) {
			if (error instanceof ApiError && error.status === 401) {
				return false;
			}
			throw error;
		}
	}

	/**
	 * Wait for a specified amount of time (for retry logic)
	 */
	protected async wait(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Retry a request with exponential backoff
	 */
	protected async retry<T>(
		operation: () => Promise<T>,
		maxRetries: number = 3,
		baseDelay: number = 1000
	): Promise<T> {
		let lastError: Error;

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				return await operation();
			} catch (error) {
				lastError = error as Error;

				// Don't retry on authentication errors
				if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
					throw error;
				}

				// Don't retry on last attempt
				if (attempt === maxRetries) {
					break;
				}

				// Exponential backoff
				const delay = baseDelay * Math.pow(2, attempt);
				await this.wait(delay);
			}
		}

		throw lastError!;
	}
}