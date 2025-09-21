/**
 * Course DTOs - Based on Backend .NET DTOs
 * Replaces SQLite schema imports
 */

export interface CourseDto {
	id: string; // Guid as string
	title: string;
	description: string;
	subject: string;
	isActive: boolean;
	isFeatured: boolean;
	createdAt: string; // ISO date string
	updatedAt?: string; // ISO date string
	educatorId: number;
	educatorName: string;
	imagePath?: string;
	moduleCount: number;
	workItemCount: number;
}

export interface CourseDetailDto extends CourseDto {
	stringId: string; // Original course ID as string (e.g., "curso-002")
	modules: ModuleSummaryDto[];
}

export interface CreateCourseDto {
	title: string;
	description: string;
	subject: string;
	isFeatured?: boolean;
	imagePath?: string;
}

export interface UpdateCourseDto {
	title: string;
	description: string;
	subject: string;
	isFeatured: boolean;
	imagePath?: string;
}

export interface CourseSummaryDto {
	id: string;
	title: string;
	description: string;
	subject: string;
	educatorName: string;
	moduleCount: number;
	isFeatured: boolean;
	isActive: boolean;
	createdAt: number;
	imagePath?: string;
}

export interface ModuleDto {
	id: string;
	stringId: string;
	title: string;
	description: string;
	orderNumber: number;
	isActive: boolean;
	courseId: string;
	createdAt: string;
	updatedAt?: string;
	workItemCount: number;
}

export interface ModuleSummaryDto {
	id: string;
	stringId: string;
	title: string;
	description: string;
	orderNumber: number;
	workItemCount: number;
}

export interface ModuleDetailDto extends ModuleDto {
	workItems: WorkItemDto[];
}

export interface CreateModuleDto {
	title: string;
	description: string;
	orderNumber: number;
	courseId: string;
}

export interface UpdateModuleDto {
	title: string;
	description: string;
	orderNumber: number;
}

export interface WorkItemDto {
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
}

export interface CreateWorkItemDto {
	title: string;
	description: string;
	longText?: string;
	orderNumber: number;
	moduleId: string;
	imagePath?: string;
	videoPath?: string;
}

export interface UpdateWorkItemDto {
	title: string;
	description: string;
	longText?: string;
	orderNumber: number;
	imagePath?: string;
	videoPath?: string;
}

// Search and filter DTOs
export interface CourseSearchDto {
	title?: string;
	subject?: string;
	educatorId?: number;
	isActive?: boolean;
	isFeatured?: boolean;
	page?: number;
	pageSize?: number;
}

export interface CoursePagedResultDto {
	items: CourseDto[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

// Reorder DTOs
export interface ReorderDto {
	newOrderNumber: number;
}