import { goto } from '$app/navigation';
import { jwtService } from '../auth/jwtService';

// Type definitions for BlogPostElement
export interface BlogPostElement {
	id: string;
	blogPostId: string;
	elementType: string;
	content?: string;
	filePath?: string;
	fileName?: string;
	fileSize?: number;
	mimeType?: string;
	orderNumber: number;
	metadata?: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt?: Date;
}

export interface InsertBlogPostElement {
	blogPostId: string;
	elementType: string;
	content?: string;
	filePath?: string;
	fileName?: string;
	fileSize?: number;
	mimeType?: string;
	orderNumber: number;
	metadata?: string;
	isActive?: boolean;
}

export type ElementType = 'title' | 'text' | 'image' | 'video' | 'audio' | 'document';

export interface CreateElementDto {
	blogPostId: string;
	elementType: ElementType;
	content?: string;
	filePath?: string;
	fileName?: string;
	fileSize?: number;
	mimeType?: string;
	orderNumber: number;
	metadata?: string;
	isActive?: boolean;
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
	isActive?: boolean;
}

export interface ElementWithFile {
	element: CreateElementDto;
	file?: File;
}

export interface CreateElementsBatchDto {
	blogPostId: string;
	elements: CreateElementDto[];
}

class BlogPostElementService {
	private apiUrl = 'http://localhost:5251/api/blogpostelement';
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

	async getElementsByBlogPostId(blogPostId: string): Promise<BlogPostElement[]> {
		try {
			const response = await fetch(`${this.apiUrl}/by-blog-post/${blogPostId}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					...jwtService.getAuthHeader()
				}
			});

			if (!response.ok) {
				throw new Error(`Error getting blog post elements: ${response.statusText}`);
			}

			const elements = await response.json();
			return elements.map((element: any) => ({
				...element,
				blogPostId: element.blogPostId,
				isActive: element.isActive ?? true,
				createdAt: new Date(element.createdAt * 1000), // Convert from unix timestamp
				updatedAt: element.updatedAt ? new Date(element.updatedAt * 1000) : undefined
			}));
		} catch (error) {
			console.error('Error loading blog post elements:', error);
			return [];
		}
	}

	async createElement(elementData: CreateElementDto): Promise<BlogPostElement> {
		const response = await fetch(this.apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...jwtService.getAuthHeader()
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
			throw new Error(`Error creating blog post element: ${errorText}`);
		}

		const element = await response.json();
		return {
			...element,
			blogPostId: element.blogPostId,
			isActive: element.isActive ?? true,
			createdAt: new Date(element.createdAt * 1000),
			updatedAt: element.updatedAt ? new Date(element.updatedAt * 1000) : undefined
		};
	}

	async updateElement(elementData: UpdateElementDto): Promise<BlogPostElement> {
		const { id, ...updatePayload } = elementData;

		const response = await fetch(`${this.apiUrl}/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				...jwtService.getAuthHeader()
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
			throw new Error(`Error updating blog post element: ${errorText}`);
		}

		const element = await response.json();
		return {
			...element,
			blogPostId: element.blogPostId,
			isActive: element.isActive ?? true,
			createdAt: new Date(element.createdAt * 1000),
			updatedAt: element.updatedAt ? new Date(element.updatedAt * 1000) : undefined
		};
	}

	async deleteElement(elementId: string): Promise<void> {
		const response = await fetch(`${this.apiUrl}/${elementId}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				...jwtService.getAuthHeader()
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
			throw new Error(`Error deleting blog post element: ${errorText}`);
		}
	}

	async reorderElements(blogPostId: string, elementOrders: Array<{ id: string; orderNumber: number }>): Promise<void> {
		// Reorder elements one by one
		for (const elementOrder of elementOrders) {
			const response = await fetch(`${this.apiUrl}/${elementOrder.id}/reorder`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					...jwtService.getAuthHeader()
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
				throw new Error(`Error reordering blog post elements: ${errorText}`);
			}
		}
	}

	async createElementsInBatch(blogPostId: string, elements: ElementWithFile[]): Promise<BlogPostElement[]> {
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
			blogPostId: blogPostId,
			elements: elementsData
		};

		const response = await fetch(`${this.apiUrl}/batch`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...jwtService.getAuthHeader()
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
			throw new Error(`Error creating blog post elements in batch: ${errorText}`);
		}

		const responseElements = await response.json();
		return responseElements.map((element: any) => ({
			...element,
			blogPostId: element.blogPostId,
			isActive: element.isActive ?? true,
			createdAt: new Date(element.createdAt * 1000),
			updatedAt: element.updatedAt ? new Date(element.updatedAt * 1000) : undefined
		}));
	}

	async deleteElementsByBlogPostId(blogPostId: string): Promise<void> {
		const response = await fetch(`${this.apiUrl}/by-blog-post/${blogPostId}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				...jwtService.getAuthHeader()
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
			throw new Error(`Error deleting elements by blog post ID: ${errorText}`);
		}
	}
}

export const blogPostElementService = new BlogPostElementService();
