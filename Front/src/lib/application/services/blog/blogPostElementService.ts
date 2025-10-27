import { goto } from '$app/navigation';
import { ApiError, BaseHttpService } from '$lib/infrastructure/http/BaseHttpClient';

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

class BlogPostElementService extends BaseHttpService {
	private readonly basePath = '/blogpostelement';

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
			const elements = await this.get<any[]>(`${this.basePath}/by-blog-post/${blogPostId}`);
			if (!Array.isArray(elements)) {
				return [];
			}

			return elements.map((element: any) => ({
				...element,
				blogPostId: element.blogPostId,
				isActive: element.isActive ?? true,
				createdAt: new Date(element.createdAt * 1000), // Convert from unix timestamp
				updatedAt: element.updatedAt ? new Date(element.updatedAt * 1000) : undefined
			}));
		} catch (error) {
			this.redirectIfUnauthorized(error);
			console.error('Error loading blog post elements:', error);
			return [];
		}
	}

	async createElement(elementData: CreateElementDto): Promise<BlogPostElement> {
		try {
			const element = await this.post<any>(this.basePath, elementData);
			return {
				...element,
				blogPostId: element.blogPostId,
				isActive: element.isActive ?? true,
				createdAt: new Date(element.createdAt * 1000),
				updatedAt: element.updatedAt ? new Date(element.updatedAt * 1000) : undefined
			};
		} catch (error) {
			this.redirectIfUnauthorized(error);
			throw this.wrapError(error, 'No tienes permisos para crear elementos de post');
		}
	}

	async updateElement(elementData: UpdateElementDto): Promise<BlogPostElement> {
		try {
			const { id, ...updatePayload } = elementData;
			const element = await this.put<any>(`${this.basePath}/${id}`, updatePayload);
			return {
				...element,
				blogPostId: element.blogPostId,
				isActive: element.isActive ?? true,
				createdAt: new Date(element.createdAt * 1000),
				updatedAt: element.updatedAt ? new Date(element.updatedAt * 1000) : undefined
			};
		} catch (error) {
			this.redirectIfUnauthorized(error);
			throw this.wrapError(error, 'No tienes permisos para editar este elemento');
		}
	}

	async deleteElement(elementId: string): Promise<void> {
		try {
			await this.delete<void>(`${this.basePath}/${elementId}`);
		} catch (error) {
			this.redirectIfUnauthorized(error);
			throw this.wrapError(error, 'No tienes permisos para eliminar este elemento');
		}
	}

	async reorderElements(blogPostId: string, elementOrders: Array<{ id: string; orderNumber: number }>): Promise<void> {
		try {
			for (const elementOrder of elementOrders) {
				await this.patch<void>(`${this.basePath}/${elementOrder.id}/reorder`, {
					newOrderNumber: elementOrder.orderNumber
				});
			}
		} catch (error) {
			this.redirectIfUnauthorized(error);
			throw this.wrapError(error, 'No tienes permisos para reordenar elementos en este post');
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

		try {
			const responseElements = await this.post<any[]>(`${this.basePath}/batch`, batchData);
			return (responseElements ?? []).map((element: any) => ({
				...element,
				blogPostId: element.blogPostId,
				isActive: element.isActive ?? true,
				createdAt: new Date(element.createdAt * 1000),
				updatedAt: element.updatedAt ? new Date(element.updatedAt * 1000) : undefined
			}));
		} catch (error) {
			this.redirectIfUnauthorized(error);
			throw this.wrapError(error, 'No tienes permisos para crear elementos de post');
		}
	}

	async deleteElementsByBlogPostId(blogPostId: string): Promise<void> {
		try {
			await this.delete<void>(`${this.basePath}/by-blog-post/${blogPostId}`);
		} catch (error) {
			this.redirectIfUnauthorized(error);
			throw this.wrapError(error, 'No tienes permisos para eliminar elementos de este post');
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
				return new Error('Elemento no encontrado');
			}
			return error;
		}

		if (error instanceof Error) {
			return error;
		}

		return new Error(fallbackMessage);
	}
}

export const blogPostElementService = new BlogPostElementService();
