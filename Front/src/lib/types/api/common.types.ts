/**
 * Common DTOs - Shared across all API types
 * Replaces SQLite schema imports
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

export interface ValidationResult {
	isValid: boolean;
	errorMessage?: string;
}

export interface MediaDto {
	id: number;
	fileName: string;
	relativePath: string;
	thumbnailPath?: string;
	sizeBytes: number;
	mimeType: string;
	createdBy: string;
	createdAt: string;
	contentType: string;
	contentId: string;
	mediaType: string;
}

export interface MediaFilterDto {
	type?: 'image' | 'video' | 'audio' | 'document';
	createdBy?: string;
	contentType?: string;
	contentId?: string;
	page?: number;
	pageSize?: number;
}

export interface UploadStatusDto {
	uploadId: string;
	status: 'pending' | 'processing' | 'completed' | 'error';
	progress: number;
	fileName: string;
	userId: string;
	createdAt: string;
	completedAt?: string;
	errorMessage?: string;
	mediaId?: number;
}

// Search and pagination
export interface SearchParams {
	query?: string;
	page?: number;
	pageSize?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

// Generic CRUD operations
export interface CreateResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

export interface UpdateResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

export interface DeleteResponse {
	success: boolean;
	error?: string;
}