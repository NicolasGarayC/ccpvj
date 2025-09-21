// Local type definitions to replace schema imports
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

export type ElementType = 'title' | 'text' | 'image' | 'video' | 'audio';

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

class PostElementService {
	private baseUrl = '/api/post-elements';

	async getElementsByPostId(postId: string): Promise<PostElement[]> {
		const response = await fetch(`${this.baseUrl}?postId=${postId}`, {
			credentials: 'include'
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || 'Error loading post elements');
		}

		const result = await response.json();
		if (result.success) {
			return result.data.elements || [];
		}

		throw new Error(result.message || 'Error loading post elements');
	}

	async createElement(elementData: CreateElementDto): Promise<PostElement> {
		const response = await fetch(this.baseUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify(elementData)
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || 'Error creating element');
		}

		const result = await response.json();
		if (result.success) {
			return result.data.element;
		}

		throw new Error(result.message || 'Error creating element');
	}

	async updateElement(elementData: UpdateElementDto): Promise<PostElement> {
		const response = await fetch(`${this.baseUrl}/${elementData.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify(elementData)
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || 'Error updating element');
		}

		const result = await response.json();
		if (result.success) {
			return result.data.element;
		}

		throw new Error(result.message || 'Error updating element');
	}

	async deleteElement(elementId: string): Promise<void> {
		const response = await fetch(`${this.baseUrl}/${elementId}`, {
			method: 'DELETE',
			credentials: 'include'
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || 'Error deleting element');
		}

		const result = await response.json();
		if (!result.success) {
			throw new Error(result.message || 'Error deleting element');
		}
	}

	async reorderElements(postId: string, elementOrders: Array<{ id: string; orderNumber: number }>): Promise<void> {
		const response = await fetch(`${this.baseUrl}/reorder`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify({ postId, elementOrders })
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || 'Error reordering elements');
		}

		const result = await response.json();
		if (!result.success) {
			throw new Error(result.message || 'Error reordering elements');
		}
	}

	async uploadElementFile(elementId: string, file: File, elementType: 'image' | 'video' | 'audio'): Promise<string> {
		// Use nginx-optimized upload endpoints
		const uploadEndpoints = {
			image: '/api/upload/images',
			video: '/api/upload/videos',
			audio: '/api/upload/audio'
		};

		const formData = new FormData();
		formData.append('file', file);

		const response = await fetch(uploadEndpoints[elementType], {
			method: 'POST',
			credentials: 'include',
			headers: {
				'X-Element-ID': elementId  // Pass element ID via header
			},
			body: formData
		});

		if (!response.ok) {
			const error = await response.json();
			// Provide more specific error messages based on the error content
			const errorMessage = error.error || error.message || 'Error uploading file';
			throw new Error(errorMessage);
		}

		const result = await response.json();
		if (result.success) {
			return result.data.filePath;
		}

		throw new Error(result.message || 'Error uploading file');
	}

	// Legacy method for backward compatibility
	async uploadElementFileLegacy(elementId: string, file: File): Promise<string> {
		const formData = new FormData();
		formData.append('file', file);

		const response = await fetch(`${this.baseUrl}/${elementId}/upload`, {
			method: 'POST',
			credentials: 'include',
			body: formData
		});

		if (!response.ok) {
			const error = await response.json();
			const errorMessage = error.error || error.message || 'Error uploading file';
			throw new Error(errorMessage);
		}

		const result = await response.json();
		if (result.success) {
			return result.data.filePath;
		}

		throw new Error(result.message || 'Error uploading file');
	}

	async createElementsInBatch(postId: string, elements: ElementWithFile[]): Promise<PostElement[]> {
		const createdElements: PostElement[] = [];

		for (const { element, file } of elements) {
			try {
				// Create the element first
				const createdElement = await this.createElement({
					...element,
					postId
				});

				// Upload file if present
				if (file && ['image', 'video', 'audio'].includes(element.elementType)) {
					const filePath = await this.uploadElementFile(createdElement.id, file, element.elementType as 'image' | 'video' | 'audio');

					// Update element with file path
					const updatedElement = await this.updateElement({
						id: createdElement.id,
						filePath,
						fileName: file.name,
						fileSize: file.size,
						mimeType: file.type
					});

					createdElements.push(updatedElement);
				} else {
					createdElements.push(createdElement);
				}
			} catch (error) {
				console.error('Error creating element:', error);
				throw error;
			}
		}

		return createdElements;
	}
}

export const postElementService = new PostElementService();