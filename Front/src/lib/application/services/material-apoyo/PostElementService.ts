import { goto } from '$app/navigation';
import { ApiError, BaseHttpService } from '$lib/infrastructure/http/BaseHttpClient';
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

class PostElementService extends BaseHttpService {
	private readonly basePath = '/postelement';

	// Helper to convert relative file paths to absolute backend URLs
	getFileUrl(relativePath: string): string {
		if (!relativePath) return '';
		if (relativePath.startsWith('http')) return relativePath;
		if (relativePath.startsWith('/media/')) return relativePath;
		return `/media/${relativePath}`;
	}

	// Get media URL with optional download tracking for modulo content
	getMediaUrl(relativePath: string, moduloId?: string, enableTracking: boolean = false): string {
		if (!relativePath) return '';

		const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
		const mediaPath = cleanPath.startsWith('media/') ? cleanPath.substring(6) : cleanPath;

		if (enableTracking && moduloId) {
			return getModuloMediaUrl(moduloId, mediaPath);
		}

		return getUntrackedMediaUrl(mediaPath);
	}

	async getElementsByPostId(postId: string): Promise<PostElement[]> {
		try {
			const elements = await this.get<any[]>(`${this.basePath}/by-post/${postId}`);

			return (elements ?? []).map((element: any) => ({
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
		try {
			const element = await this.post<any>(this.basePath, elementData);
			return this.mapElement(element);
		} catch (error) {
			this.redirectIfUnauthorized(error);
			throw this.wrapError(error, 'No tienes permisos para crear elementos de post');
		}
	}

	async updateElement(elementData: UpdateElementDto): Promise<PostElement> {
		try {
			const { id, ...updatePayload } = elementData;
			const element = await this.put<any>(`${this.basePath}/${id}`, updatePayload);
			return this.mapElement(element);
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

	async reorderElements(postId: string, elementOrders: Array<{ id: string; orderNumber: number }>): Promise<void> {
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

	async createElementsInBatch(postId: string, elements: ElementWithFile[]): Promise<PostElement[]> {
		const elementsData: CreateElementDto[] = elements.map(elementWithFile => {
			const elementData = { ...elementWithFile.element };

			if (['image', 'video', 'audio', 'document'].includes(elementData.elementType)) {
				if (!elementData.filePath) {
					console.warn(
						`Media element ${elementData.elementType} missing filePath. Files should be uploaded via ContextualMediaUploader first.`
					);
				}
			}
			return elementData;
		});

		const batchData: CreateElementsBatchDto = {
			postId,
			elements: elementsData
		};

		try {
			const responseElements = await this.post<any[]>(`${this.basePath}/batch`, batchData);
			return (responseElements ?? []).map(this.mapElement);
		} catch (error) {
			this.redirectIfUnauthorized(error);
			throw this.wrapError(error, 'No tienes permisos para crear elementos de post');
		}
	}

	async deleteElementsByPostId(postId: string): Promise<void> {
		try {
			await this.delete<void>(`${this.basePath}/by-post/${postId}`);
		} catch (error) {
			this.redirectIfUnauthorized(error);
			throw this.wrapError(error, 'No tienes permisos para eliminar elementos de este post');
		}
	}

	private mapElement = (element: any): PostElement => ({
		...element,
		createdAt: new Date(element.createdAt),
		updatedAt: element.updatedAt ? new Date(element.updatedAt) : undefined
	});

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

export const postElementService = new PostElementService();
