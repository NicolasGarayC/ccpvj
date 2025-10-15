/**
 * Material Apoyo DTOs - Based on Backend .NET DTOs
 * Replaces Course DTOs with Material de Apoyo terminology
 */

export interface MaterialApoyoDto {
	id: string; // Guid as string
	title: string;
	description: string;
	isActive: boolean;
	isFeatured: boolean;
	createdAt: string; // ISO date string
	updatedAt?: string; // ISO date string
	educatorId: number;
	educatorName: string;
	imagePath?: string;
	moduleCount: number;
	postCount: number;
}

export interface MaterialApoyoDetailDto extends MaterialApoyoDto {
	modules: ModuleSummaryDto[];
}

export interface CreateMaterialApoyoDto {
	title: string;
	description: string;
	isFeatured?: boolean;
	imagePath?: string;
	educatorName?: string;
}

export interface UpdateMaterialApoyoDto {
	title: string;
	description: string;
	isFeatured: boolean;
	imagePath?: string;
	educatorName?: string;
}

export interface MaterialApoyoSummaryDto {
	id: string;
	title: string;
	description: string;
	educatorName: string;
	moduleCount: number;
	isFeatured: boolean;
	isActive: boolean;
	createdAt: number;
	imagePath?: string;
}

export interface ModuleDto {
	id: string;
	title: string;
	description: string;
	orderNumber: number;
	isActive: boolean;
	materialApoyoId: string;
	createdAt: string;
	updatedAt?: string;
	postCount: number;
}

export interface ModuleSummaryDto {
	id: string;
	title: string;
	description: string;
	orderNumber: number;
	isActive: boolean;
	postCount: number;
}

export interface ModuleDetailDto extends ModuleDto {
	posts: PostDto[];
}

export interface CreateModuleDto {
	title: string;
	description: string;
	orderNumber: number;
	materialApoyoId: string;
}

export interface UpdateModuleDto {
	title: string;
	description: string;
	orderNumber: number;
}

export interface PostDto {
	id: string;
	title: string;
	description: string;
	longText?: string;
	orderNumber: number;
	isActive: boolean;
	moduleId: string;
	createdAt: string;
	updatedAt?: string;
	imagePath?: string;
	videoPath?: string;
	audioPath?: string;
	subtitle?: string;
	content?: string;
}

export interface CreatePostDto {
	title: string;
	description?: string;
	longText?: string;
	orderNumber: number;
	moduleId: string;
	imagePath?: string;
	videoPath?: string;
	audioPath?: string;
	subtitle?: string;
	content?: string;
}

export interface UpdatePostDto {
	title: string;
	description?: string;
	longText?: string;
	orderNumber: number;
	imagePath?: string;
	videoPath?: string;
	audioPath?: string;
	subtitle?: string;
	content?: string;
}

// Search and filter DTOs
export interface MaterialApoyoSearchDto {
	title?: string;
	educatorId?: number;
	isActive?: boolean;
	isFeatured?: boolean;
	page?: number;
	pageSize?: number;
}

export interface MaterialApoyoPagedResultDto {
	items: MaterialApoyoDto[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

// Reorder DTOs
export interface ReorderDto {
	newOrderNumber: number;
}