import { goto } from '$app/navigation';
import { jwtService } from './auth/jwtService';
import { BACKEND_API_URL } from '$lib/config/backend';

// Local type definitions to replace schema imports
export interface ModulePost {
	id: string;
	title: string;
	subtitle?: string;
	content?: string;
	imagePath?: string;
	videoPath?: string;
	audioPath?: string;
	orderNumber: number;
	moduleId: string;
	authorId: string;
	createdAt: Date;
	updatedAt?: Date;
	isActive: boolean;
}

export interface InsertModulePost {
	title: string;
	subtitle?: string;
	content?: string;
	imagePath?: string;
	videoPath?: string;
	audioPath?: string;
	orderNumber: number;
	moduleId: string;
	authorId: string;
}

export interface PostDetail extends ModulePost {
	authorName: string;
}

export interface CreatePostDto {
	title: string;
	subtitle?: string;
	content?: string;
	imagePath?: string;
	videoPath?: string;
	audioPath?: string;
	orderNumber: number;
	moduleId: string;
}

export interface UpdatePostDto {
	title: string;
	subtitle?: string;
	content?: string;
	imagePath?: string;
	videoPath?: string;
	audioPath?: string;
	orderNumber: number;
}

export interface PostSearchParams {
	moduleId?: string;
	authorId?: string;
	isActive?: boolean;
	sortBy?: 'order' | 'created' | 'title';
}

class ModulePostService {
	private apiUrl = `${BACKEND_API_URL}/materialapoyo`;

	// Get all posts for a specific module
	async getModulePosts(moduleId: string): Promise<PostDetail[]> {
		const response = await fetch(`${this.apiUrl}/modules/${moduleId}/posts`, {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`Error getting module posts: ${response.statusText}`);
		}

		return await response.json();
	}

	// Get a specific post by ID
	async getPost(id: string): Promise<PostDetail | null> {
		const response = await fetch(`${this.apiUrl}/posts/${id}`, {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (response.status === 404) {
			return null;
		}

		if (!response.ok) {
			throw new Error(`Error getting post: ${response.statusText}`);
		}

		return await response.json();
	}

	// Create a new post
	async createPost(postData: CreatePostDto): Promise<PostDetail> {
		const response = await fetch(`${this.apiUrl}/posts`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...jwtService.getAuthHeader()
			},
			body: JSON.stringify(postData)
		});

		if (response.status === 401) {
			goto('/auth/login');
			throw new Error('Authentication required');
		}

		if (response.status === 403) {
			throw new Error('No tienes permisos para crear posts');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error creating post: ${errorText}`);
		}

		return await response.json();
	}

	// Update an existing post
	async updatePost(id: string, postData: UpdatePostDto): Promise<void> {
		const response = await fetch(`${this.apiUrl}/posts/${id}`, {
			method: 'PUT',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...jwtService.getAuthHeader()
			},
			body: JSON.stringify(postData)
		});

		if (response.status === 401) {
			goto('/auth/login');
			throw new Error('Authentication required');
		}

		if (response.status === 403) {
			throw new Error('No tienes permisos para editar este post');
		}

		if (response.status === 404) {
			throw new Error('Post no encontrado');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error updating post: ${errorText}`);
		}
	}

	// Delete a post
	async deletePost(id: string): Promise<void> {
		const response = await fetch(`${this.apiUrl}/posts/${id}`, {
			method: 'DELETE',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (response.status === 401) {
			goto('/auth/login');
			throw new Error('Authentication required');
		}

		if (response.status === 403) {
			throw new Error('No tienes permisos para eliminar este post');
		}

		if (response.status === 404) {
			throw new Error('Post no encontrado');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error deleting post: ${errorText}`);
		}
	}

	// Reorder a post
	async reorderPost(id: string, newOrderNumber: number): Promise<void> {
		const response = await fetch(`${this.apiUrl}/posts/${id}/reorder`, {
			method: 'PATCH',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ newOrderNumber })
		});

		if (response.status === 401) {
			goto('/auth/login');
			throw new Error('Authentication required');
		}

		if (response.status === 403) {
			throw new Error('No tienes permisos para reordenar posts en este módulo');
		}

		if (response.status === 404) {
			throw new Error('Post no encontrado');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error reordering post: ${errorText}`);
		}
	}

	// Upload media for a post
	async uploadMedia(postId: string, file: File, mediaType: 'image' | 'video' | 'audio'): Promise<string> {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('mediaType', mediaType);
		formData.append('postId', postId);

		const response = await fetch(`${this.apiUrl}/${postId}/media`, {
			method: 'POST',
			credentials: 'include',
			body: formData
		});

		if (response.status === 401) {
			goto('/auth/login');
			throw new Error('Authentication required');
		}

		if (response.status === 403) {
			throw new Error('No tienes permisos para subir archivos');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error uploading media: ${errorText}`);
		}

		const result = await response.json();
		return result.path;
	}

	// Remove media from a post
	async removeMedia(postId: string, mediaType: 'image' | 'video' | 'audio'): Promise<void> {
		const response = await fetch(`${this.apiUrl}/${postId}/media`, {
			method: 'DELETE',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ mediaType })
		});

		if (response.status === 401) {
			goto('/auth/login');
			throw new Error('Authentication required');
		}

		if (response.status === 403) {
			throw new Error('No tienes permisos para eliminar archivos');
		}

		if (response.status === 404) {
			throw new Error('Post no encontrado');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error removing media: ${errorText}`);
		}
	}
}

export const modulePostService = new ModulePostService();
