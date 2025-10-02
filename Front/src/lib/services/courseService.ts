import { BaseHttpService } from './base/baseHttpService';
import type {
	CourseDto,
	CourseDetailDto,
	CourseSummaryDto,
	CreateCourseDto,
	UpdateCourseDto,
	ModuleDto,
	ModuleSummaryDto,
	CreateModuleDto,
	UpdateModuleDto,
	PostDto,
	CreatePostDto,
	UpdatePostDto,
	CoursePagedResultDto,
	CourseSearchDto,
	ReorderDto
} from '$lib/types/api';

export interface CourseSearchParams {
	page?: number;
	pageSize?: number;
	searchTerm?: string;
	subject?: string;
	isFeatured?: boolean;
	isActive?: boolean;
	sortBy?: string;
}

class CourseService extends BaseHttpService {
	// Course methods
	async getCourses(params?: CourseSearchParams): Promise<CoursePagedResultDto> {
		const urlParams = new URLSearchParams();
		if (params?.page) urlParams.set('page', params.page.toString());
		if (params?.pageSize) urlParams.set('pageSize', params.pageSize.toString());
		if (params?.searchTerm) urlParams.set('searchTerm', params.searchTerm);
		if (params?.subject) urlParams.set('subject', params.subject);
		if (params?.isFeatured !== undefined) urlParams.set('isFeatured', params.isFeatured.toString());
		if (params?.isActive !== undefined) urlParams.set('isActive', params.isActive.toString());
		if (params?.sortBy) urlParams.set('sortBy', params.sortBy);

		return this.get<CoursePagedResultDto>(`/course?${urlParams.toString()}`);
	}

	async getAllCourses(): Promise<CourseSummaryDto[]> {
		return this.get<CourseSummaryDto[]>('/course/all');
	}

	async getFeaturedCourses(count: number = 6): Promise<CourseDetailDto[]> {
		return this.get<CourseDetailDto[]>(`/course/featured?count=${count}`);
	}

	async getCourseById(id: string): Promise<CourseDetailDto | null> {
		try {
			return await this.get<CourseDetailDto>(`/course/${id}`);
		} catch (error) {
			if (error instanceof Error && error.message.includes('404')) {
				return null;
			}
			throw error;
		}
	}

	// Alias for consistency
	async getCourse(id: string): Promise<CourseDetailDto | null> {
		return this.getCourseById(id);
	}

	async createCourse(courseData: CreateCourseDto): Promise<CourseDto> {
		return this.post<CourseDto>('/course', courseData);
	}

	async updateCourse(id: string, courseData: UpdateCourseDto): Promise<void> {
		return this.put(`/course/${id}`, courseData);
	}

	async deleteCourse(id: string): Promise<void> {
		return this.delete(`/course/${id}`);
	}

	async getMyCourses(): Promise<CourseDetailDto[]> {
		return this.get<CourseDetailDto[]>('/course/my-courses');
	}


	// Module methods
	async getModule(id: string): Promise<ModuleDto | null> {
		try {
			return await this.get<ModuleDto>(`/course/modules/${id}`);
		} catch (error) {
			if (error instanceof Error && error.message.includes('404')) {
				return null;
			}
			throw error;
		}
	}

	async getCourseModules(courseId: string): Promise<ModuleSummaryDto[]> {
		return this.get<ModuleSummaryDto[]>(`/course/${courseId}/modules`);
	}

	async createModule(moduleData: CreateModuleDto): Promise<ModuleDto> {
		return this.post<ModuleDto>('/course/modules', moduleData);
	}

	async updateModule(id: string, moduleData: UpdateModuleDto): Promise<void> {
		return this.put(`/course/modules/${id}`, moduleData);
	}

	async deleteModule(id: string): Promise<void> {
		return this.delete(`/course/modules/${id}`);
	}

	async reorderModule(id: string, newOrderNumber: number): Promise<void> {
		const reorderData: ReorderDto = { newOrderNumber };
		return this.patch(`/course/modules/${id}/reorder`, reorderData);
	}

	// Post methods
	async getPost(id: string): Promise<PostDto | null> {
		try {
			return await this.get<PostDto>(`/course/posts/${id}`);
		} catch (error) {
			if (error instanceof Error && error.message.includes('404')) {
				return null;
			}
			throw error;
		}
	}

	async getModulePosts(moduleId: string): Promise<PostDto[]> {
		return this.get<PostDto[]>(`/course/modules/${moduleId}/posts`);
	}

	async createPost(postData: CreatePostDto): Promise<PostDto> {
		return this.post<PostDto>('/course/posts', postData);
	}

	async updatePost(id: string, postData: UpdatePostDto): Promise<void> {
		return this.put(`/course/posts/${id}`, postData);
	}

	async deletePost(id: string): Promise<void> {
		return this.delete(`/course/posts/${id}`);
	}

	async reorderPost(id: string, newOrderNumber: number): Promise<void> {
		const reorderData: ReorderDto = { newOrderNumber };
		return this.post(`/course/posts/${id}/reorder`, reorderData);
	}


	/**
	 * Check authentication status - will be implemented with JWT
	 */
	async checkAuthStatus(): Promise<{ canManage: boolean; user: any | null }> {
		// TODO: Implement with JWT token validation
		return { canManage: true, user: { id: 1, username: 'admin', role: 'administrador' } };
	}
}

export const courseService = new CourseService();

// Re-export types for convenience
export type {
	CourseDto as Course,
	CourseDetailDto as CourseDetail,
	ModuleDto as Module,
	ModuleSummaryDto as ModuleSummary,
	PostDto as Post,
	CreatePostDto as CreatePost,
	UpdatePostDto as UpdatePost,
	CoursePagedResultDto as CoursePagedResult
} from '$lib/types/api/course.types';