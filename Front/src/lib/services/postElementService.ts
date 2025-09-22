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

// Stub implementation to replace deleted post-elements functionality
// This allows the frontend to work while we transition to the simplified WorkItem structure
class PostElementService {
	// Stub implementation - returns empty array
	async getElementsByPostId(postId: string): Promise<PostElement[]> {
		return [];
	}

	// Stub implementation - returns a fake element
	async createElement(elementData: CreateElementDto): Promise<PostElement> {
		return {
			id: `stub-${Date.now()}`,
			postId: elementData.postId,
			elementType: elementData.elementType,
			content: elementData.content || '',
			filePath: null,
			fileName: null,
			fileSize: 0,
			mimeType: 'text/plain',
			orderNumber: elementData.orderNumber,
			metadata: elementData.metadata || null,
			createdAt: new Date(),
			updatedAt: null
		};
	}

	// Stub implementation - returns the same element data
	async updateElement(elementData: UpdateElementDto): Promise<PostElement> {
		return {
			id: elementData.id,
			postId: 'unknown',
			elementType: 'text',
			content: elementData.content || '',
			filePath: elementData.filePath || null,
			fileName: elementData.fileName || null,
			fileSize: elementData.fileSize || 0,
			mimeType: elementData.mimeType || 'text/plain',
			orderNumber: elementData.orderNumber || 0,
			metadata: elementData.metadata || null,
			createdAt: new Date(),
			updatedAt: new Date()
		};
	}

	// Stub implementation - does nothing
	async deleteElement(elementId: string): Promise<void> {
		// Do nothing in stub
	}

	// Stub implementation - does nothing
	async reorderElements(postId: string, elementOrders: Array<{ id: string; orderNumber: number }>): Promise<void> {
		// Do nothing in stub
	}

	// Stub implementation - returns fake file path
	async uploadElementFile(elementId: string, file: File, elementType: 'image' | 'video' | 'audio'): Promise<string> {
		return `/uploads/stub-${elementType}s/${file.name}`;
	}

	// Stub implementation - returns fake elements
	async createElementsInBatch(postId: string, elements: ElementWithFile[]): Promise<PostElement[]> {
		return elements.map((elem, index) => ({
			id: `stub-${Date.now()}-${index}`,
			postId: postId,
			elementType: elem.element.elementType,
			content: elem.element.content || '',
			filePath: elem.file ? `/uploads/stub-${elem.element.elementType}s/${elem.file.name}` : null,
			fileName: elem.file?.name || null,
			fileSize: elem.file?.size || 0,
			mimeType: elem.file?.type || 'text/plain',
			orderNumber: elem.element.orderNumber,
			metadata: elem.element.metadata || null,
			createdAt: new Date(),
			updatedAt: null
		}));
	}
}

export const postElementService = new PostElementService();