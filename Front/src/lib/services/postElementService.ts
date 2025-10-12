import { goto } from '$app/navigation';
import { getModuloMediaUrl, getUntrackedMediaUrl } from '$lib/utils/mediaUtils';

// Type definitions for PostElement
export interface PostElement {
	id: string;
	postId: string;
	elementType: string;
	content?: string;
	filePath?: string;
	fileName?: string;
	fileSize?: number;
	mimeType?: string;
	orderNumber: number;
	metadata?: string;
	createdAt: Date;
	updatedAt?: Date;
}

export interface InsertPostElement {
	postId: string;
	elementType: string;
	content?: string;
	filePath?: string;
	fileName?: string;
	fileSize?: number;
	mimeType?: string;
	orderNumber: number;
	metadata?: string;
}

export type ElementType = 'title' | 'text' | 'image' | 'video' | 'audio' | 'document';

export interface CreateElementDto {
	postId: string;
	elementType: ElementType;
	content?: string;
	filePath?: string;
	fileName?: string;
	fileSize?: number;
	mimeType?: string;
	orderNumber: number;
	metadata?: string;
}

export interface UpdateElementDto {
	id: string;
	elementType?: ElementType;
	content?: string;
	filePath?: string;
	fileName?: string;
	fileSize?: number;
	mimeType?: string;
	orderNumber?: number;
	metadata?: string;
}

export interface ElementWithFile {
	element: CreateElementDto;
	file?: File;
}

export interface CreateElementsBatchDto {
	postId: string;
	elements: CreateElementDto[];
}

class PostElementService {
	private apiUrl = 'http://localhost:5251/api/postelement';
	private backendUrl = 'http://localhost:5251';

	// Helper to convert relative file paths to absolute backend URLs
	getFileUrl(relativePath: string): string {
		if (!relativePath) return '';
		// If it's already an absolute URL, return as is
		if (relativePath.startsWith('http')) return relativePath;
		// If it's already a frontend media path, return as is
		if (relativePath.startsWith('/media/')) return relativePath;
		// Convert relative path to frontend media URL
		return `/media/${relativePath}`;
	}

	// Get media URL with optional download tracking for modulo content
	getMediaUrl(relativePath: string, moduloId?: string, enableTracking: boolean = false): string {
		if (!relativePath) return '';

		// Clean the path
		const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
		const mediaPath = cleanPath.startsWith('media/') ? cleanPath.substring(6) : cleanPath;

		// If tracking is enabled and we have a moduloId, use tracked URL
		if (enableTracking && moduloId) {
			return getModuloMediaUrl(moduloId, mediaPath);
		}

		// Otherwise use untracked URL
		return getUntrackedMediaUrl(mediaPath);
	}

	async getElementsByPostId(postId: string): Promise<PostElement[]> {
		try {
			const response = await fetch(`${this.apiUrl}/by-post/${postId}`, {
				method: 'GET',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error(`Error getting post elements: ${response.statusText}`);
			}

			const elements = await response.json();
			return elements.map((element: any) => ({
				...element,
				createdAt: new Date(element.createdAt),
				updatedAt: element.updatedAt ? new Date(element.updatedAt) : undefined
			}));
		} catch (error) {
			console.error('Error loading post elements:', error);
			return [];
		}
	}

	async createElement(elementData: CreateElementDto): Promise<PostElement> {
		const response = await fetch(this.apiUrl, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(elementData)
		});

		if (response.status === 401) {
			goto('/auth/login');
			throw new Error('Authentication required');
		}

		if (response.status === 403) {
			throw new Error('No tienes permisos para crear elementos de post');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error creating post element: ${errorText}`);
		}

		const element = await response.json();
		return {
			...element,
			createdAt: new Date(element.createdAt),
			updatedAt: element.updatedAt ? new Date(element.updatedAt) : undefined
		};
	}

	async updateElement(elementData: UpdateElementDto): Promise<PostElement> {
		const { id, ...updatePayload } = elementData;

		const response = await fetch(`${this.apiUrl}/${id}`, {
			method: 'PUT',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(updatePayload)
		});

		if (response.status === 401) {
			goto('/auth/login');
			throw new Error('Authentication required');
		}

		if (response.status === 403) {
			throw new Error('No tienes permisos para editar este elemento');
		}

		if (response.status === 404) {
			throw new Error('Elemento no encontrado');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error updating post element: ${errorText}`);
		}

		// Return updated element - in a real scenario you might want to fetch it
		// For now, return a constructed object
		return {
			id: id,
			postId: 'unknown', // This should be fetched or provided
			elementType: 'text', // This should be fetched or provided
			content: updatePayload.content,
			filePath: updatePayload.filePath,
			fileName: updatePayload.fileName,
			fileSize: updatePayload.fileSize,
			mimeType: updatePayload.mimeType,
			orderNumber: updatePayload.orderNumber || 0,
			metadata: updatePayload.metadata,
			createdAt: new Date(), // This should be fetched
			updatedAt: new Date()
		};
	}

	async deleteElement(elementId: string): Promise<void> {
		const response = await fetch(`${this.apiUrl}/${elementId}`, {
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
			throw new Error('No tienes permisos para eliminar este elemento');
		}

		if (response.status === 404) {
			throw new Error('Elemento no encontrado');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error deleting post element: ${errorText}`);
		}
	}

	async reorderElements(postId: string, elementOrders: Array<{ id: string; orderNumber: number }>): Promise<void> {
		// Reorder elements one by one
		for (const elementOrder of elementOrders) {
			const response = await fetch(`${this.apiUrl}/${elementOrder.id}/reorder`, {
				method: 'PATCH',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					newOrderNumber: elementOrder.orderNumber
				})
			});

			if (response.status === 401) {
				goto('/auth/login');
				throw new Error('Authentication required');
			}

			if (response.status === 403) {
				throw new Error('No tienes permisos para reordenar elementos en este post');
			}

			if (response.status === 404) {
				throw new Error('Elemento no encontrado');
			}

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Error reordering post elements: ${errorText}`);
			}
		}
	}

	// Note: File upload is now handled by ContextualMediaUploader
	// This function is deprecated - use ContextualMediaUploader instead

	async createElementsInBatch(postId: string, elements: ElementWithFile[]): Promise<PostElement[]> {
		// Prepare the elements for batch creation
		// Note: Files should already be uploaded via ContextualMediaUploader before this point
		const elementsData: CreateElementDto[] = elements.map(elementWithFile => {
			const elementData = { ...elementWithFile.element };

			// Validate that media elements have the required file information
			if (['image', 'video', 'audio', 'document'].includes(elementData.elementType)) {
				if (!elementData.filePath) {
					console.warn(`Media element ${elementData.elementType} missing filePath. Files should be uploaded via ContextualMediaUploader first.`);
				}
			}

			return elementData;
		});

		const batchData: CreateElementsBatchDto = {
			postId: postId,
			elements: elementsData
		};

		const response = await fetch(`${this.apiUrl}/batch`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(batchData)
		});

		if (response.status === 401) {
			goto('/auth/login');
			throw new Error('Authentication required');
		}

		if (response.status === 403) {
			throw new Error('No tienes permisos para crear elementos de post');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error creating post elements in batch: ${errorText}`);
		}

		const responseElements = await response.json();
		return responseElements.map((element: any) => ({
			...element,
			createdAt: new Date(element.createdAt),
			updatedAt: element.updatedAt ? new Date(element.updatedAt) : undefined
		}));
	}

	async deleteElementsByPostId(postId: string): Promise<void> {
		const response = await fetch(`${this.apiUrl}/by-post/${postId}`, {
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
			throw new Error('No tienes permisos para eliminar elementos de este post');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error deleting elements by post ID: ${errorText}`);
		}
	}
}

export const postElementService = new PostElementService();