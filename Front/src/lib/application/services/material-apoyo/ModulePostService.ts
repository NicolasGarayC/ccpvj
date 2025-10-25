import { goto } from '$app/navigation';
import { ApiError, BaseHttpService } from '$lib/infrastructure/http/BaseHttpClient';
import { jwtService } from '$lib/application/services/auth/JwtService';

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
	title?: string;
	subtitle?: string;
	content?: string;
	imagePath?: string;
	videoPath?: string;
	audioPath?: string;
	orderNumber?: number;
}

export interface PostSearchParams {
	moduleId?: string;
	authorId?: string;
	isActive?: boolean;
	sortBy?: 'order' | 'created' | 'title';
}

class ModulePostService extends BaseHttpService {
	private readonly basePath = '/materialapoyo';

	// Get all posts for a specific module
	async getModulePosts(moduleId: string): Promise<PostDetail[]> {
		try {
			return await this.get<PostDetail[]>(`${this.basePath}/modules/${moduleId}/posts`);
		} catch (error) {
			console.error('Error getting module posts:', error);
			throw error;
		}
	}

	// Get a specific post by ID
	async getPost(id: string): Promise<PostDetail | null> {
		try {
			return await this.get<PostDetail>(`${this.basePath}/posts/${id}`);
		} catch (error) {
			if (error instanceof ApiError && error.status === 404) {
				return null;
			}
			console.error('Error getting post:', error);
			throw error;
		}
	}

	// Create a new post
	async createPost(postData: CreatePostDto): Promise<PostDetail> {
		try {
			return await this.post<PostDetail>(`${this.basePath}/posts`, postData);
		} catch (error) {
			this.redirectIfUnauthorized(error);
			throw this.wrapError(error, 'No tienes permisos para crear posts');
		}
	}

	// Update an existing post
	async updatePost(id: string, postData: UpdatePostDto): Promise<void> {
		try {
			await this.put<void>(`${this.basePath}/posts/${id}`, postData);
		} catch (error) {
			this.redirectIfUnauthorized(error);
			throw this.wrapError(error, 'No tienes permisos para editar este post');
		}
	}

	// Delete a post
	async deletePost(id: string): Promise<void> {
		try {
			await this.delete<void>(`${this.basePath}/posts/${id}`);
		} catch (error) {
			this.redirectIfUnauthorized(error);
			throw this.wrapError(error, 'No tienes permisos para eliminar este post');
		}
	}

	// Reorder a post
	async reorderPost(id: string, newOrderNumber: number): Promise<void> {
		try {
			await this.patch<void>(`${this.basePath}/posts/${id}/reorder`, { newOrderNumber });
		} catch (error) {
			this.redirectIfUnauthorized(error);
			throw this.wrapError(error, 'No tienes permisos para reordenar posts en este módulo');
		}
	}

	// Upload media for a post
	async uploadMedia(postId: string, file: File, mediaType: 'image' | 'video' | 'audio'): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('mediaType', mediaType);
        formData.append('postId', postId);

        const response = await fetch(`${this.baseURL}${this.basePath}/${postId}/media`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                ...jwtService.getAuthHeader()
            },
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
		try {
			await this.fetch<void>(`${this.basePath}/${postId}/media`, {
				method: 'DELETE',
				body: JSON.stringify({ mediaType })
			});
		} catch (error) {
			this.redirectIfUnauthorized(error);
			throw this.wrapError(error, 'No tienes permisos para eliminar archivos');
		}
	}

	private redirectIfUnauthorized(error: unknown): void {
		if (error instanceof ApiError && error.status === 401) {
			goto('/auth/login');
		}
	}

	private wrapError(error: unknown, fallbackMessage: string): Error {
		if (error instanceof ApiError) {
			if (error.status === 404) {
				return new Error('Post no encontrado');
			}
			return error;
		}

		if (error instanceof Error) {
			return error;
		}

		return new Error(fallbackMessage);
	}
}

export const modulePostService = new ModulePostService();
