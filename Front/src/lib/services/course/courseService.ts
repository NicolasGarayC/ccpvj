import { goto } from '$app/navigation';

export interface Course {
	id: string;
	title: string;
	description: string;
	subject: string;
	isActive: boolean;
	isFeatured: boolean;
	createdAt: string;
	updatedAt?: string;
	educatorId: number;
	educatorName: string;
	imagePath?: string;
	moduleCount: number;
	workItemCount: number;
}

export interface CourseDetail extends Course {
	modules: Module[];
}

export interface Module {
	id: string;
	title: string;
	description: string;
	orderNumber: number;
	isActive: boolean;
	workItemCount: number;
}

export interface ModuleDetail extends Module {
	workItems: WorkItem[];
}

export interface WorkItem {
	id: string;
	title: string;
	description?: string;
	longText?: string;
	imagePath?: string;
	videoPath?: string;
	orderNumber: number;
	isActive: boolean;
	createdAt: string;
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

export interface CreateWorkItemDto {
	title: string;
	description?: string;
	longText?: string;
	orderNumber: number;
	moduleId: string;
	imagePath?: string;
	videoPath?: string;
}

export interface UpdateWorkItemDto {
	title: string;
	description?: string;
	longText?: string;
	orderNumber: number;
	imagePath?: string;
	videoPath?: string;
}

export interface CourseSearchParams {
	page?: number;
	pageSize?: number;
	searchTerm?: string;
	subject?: string;
	isFeatured?: boolean;
	isActive?: boolean;
	sortBy?: string;
}

export interface CoursePagedResult {
	courses: Course[];
	totalCount: number;
	page: number;
	pageSize: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

class CourseService {
	private apiUrl = '/api/course';

	async getCourses(params?: CourseSearchParams): Promise<CoursePagedResult> {
		const urlParams = new URLSearchParams();
		if (params?.page) urlParams.set('page', params.page.toString());
		if (params?.pageSize) urlParams.set('pageSize', params.pageSize.toString());
		if (params?.searchTerm) urlParams.set('searchTerm', params.searchTerm);
		if (params?.subject) urlParams.set('subject', params.subject);
		if (params?.isFeatured !== undefined) urlParams.set('isFeatured', params.isFeatured.toString());
		if (params?.isActive !== undefined) urlParams.set('isActive', params.isActive.toString());
		if (params?.sortBy) urlParams.set('sortBy', params.sortBy);

		const response = await fetch(`${this.apiUrl}?${urlParams.toString()}`, {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`Error getting courses: ${response.statusText}`);
		}

		return await response.json();
	}

	async getAllCourses(): Promise<Course[]> {
		const response = await fetch(`${this.apiUrl}/all`, {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`Error getting all courses: ${response.statusText}`);
		}

		return await response.json();
	}

	async getFeaturedCourses(count: number = 6): Promise<Course[]> {
		const response = await fetch(`${this.apiUrl}/featured?count=${count}`, {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`Error getting featured courses: ${response.statusText}`);
		}

		return await response.json();
	}

	async getCourseById(id: string): Promise<CourseDetail | null> {
		const response = await fetch(`${this.apiUrl}/${id}`, {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (response.status === 404) {
			return null;
		}

		if (!response.ok) {
			throw new Error(`Error getting course: ${response.statusText}`);
		}

		return await response.json();
	}

	async getCourseModules(courseId: string): Promise<Module[]> {
		const response = await fetch(`${this.apiUrl}/${courseId}/modules`, {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`Error getting course modules: ${response.statusText}`);
		}

		return await response.json();
	}

	async createCourse(courseData: CreateCourseDto): Promise<Course> {
		const response = await fetch(this.apiUrl, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(courseData)
		});

		if (response.status === 401) {
			goto('/auth/login');
			throw new Error('Authentication required');
		}

		if (response.status === 403) {
			throw new Error('No tienes permisos para crear cursos');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error creating course: ${errorText}`);
		}

		return await response.json();
	}

	async updateCourse(id: string, courseData: UpdateCourseDto): Promise<void> {
		const response = await fetch(`${this.apiUrl}/${id}`, {
			method: 'PUT',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(courseData)
		});

		if (response.status === 401) {
			goto('/auth/login');
			throw new Error('Authentication required');
		}

		if (response.status === 403) {
			throw new Error('No tienes permisos para editar este curso');
		}

		if (response.status === 404) {
			throw new Error('Curso no encontrado');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error updating course: ${errorText}`);
		}
	}

	async deleteCourse(id: string): Promise<void> {
		const response = await fetch(`${this.apiUrl}/${id}`, {
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
			throw new Error('No tienes permisos para eliminar este curso');
		}

		if (response.status === 404) {
			throw new Error('Curso no encontrado');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error deleting course: ${errorText}`);
		}
	}

	async getMyCourses(): Promise<Course[]> {
		const response = await fetch(`${this.apiUrl}/my-courses`, {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (response.status === 401) {
			goto('/auth/login');
			throw new Error('Authentication required');
		}

		if (!response.ok) {
			throw new Error(`Error getting my courses: ${response.statusText}`);
		}

		return await response.json();
	}

	async getAvailableSubjects(): Promise<string[]> {
		const response = await fetch(`${this.apiUrl}/subjects`, {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`Error getting subjects: ${response.statusText}`);
		}

		return await response.json();
	}

	// Module management
	async getModule(id: string): Promise<ModuleDetail | null> {
		const response = await fetch(`${this.apiUrl}/modules/${id}`, {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (response.status === 404) {
			return null;
		}

		if (!response.ok) {
			throw new Error(`Error getting module: ${response.statusText}`);
		}

		return await response.json();
	}

	async createModule(moduleData: CreateModuleDto): Promise<Module> {
		const response = await fetch(`${this.apiUrl}/modules`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(moduleData)
		});

		if (response.status === 401) {
			goto('/auth/login');
			throw new Error('Authentication required');
		}

		if (response.status === 403) {
			throw new Error('No tienes permisos para crear módulos en este curso');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error creating module: ${errorText}`);
		}

		return await response.json();
	}

	async updateModule(id: string, moduleData: UpdateModuleDto): Promise<void> {
		const response = await fetch(`${this.apiUrl}/modules/${id}`, {
			method: 'PUT',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(moduleData)
		});

		if (response.status === 401) {
			goto('/auth/login');
			throw new Error('Authentication required');
		}

		if (response.status === 403) {
			throw new Error('No tienes permisos para editar este módulo');
		}

		if (response.status === 404) {
			throw new Error('Módulo no encontrado');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error updating module: ${errorText}`);
		}
	}

	async deleteModule(id: string): Promise<void> {
		const response = await fetch(`${this.apiUrl}/modules/${id}`, {
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
			throw new Error('No tienes permisos para eliminar este módulo');
		}

		if (response.status === 404) {
			throw new Error('Módulo no encontrado');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error deleting module: ${errorText}`);
		}
	}

	async reorderModule(id: string, newOrderNumber: number): Promise<void> {
		const response = await fetch(`${this.apiUrl}/modules/${id}/reorder`, {
			method: 'PATCH',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ newOrderNumber })
		});

		if (response.status === 401) {
			goto('/auth/login');
			throw new Error('Authentication required');
		}

		if (response.status === 403) {
			throw new Error('No tienes permisos para reordenar módulos en este curso');
		}

		if (response.status === 404) {
			throw new Error('Módulo no encontrado');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error reordering module: ${errorText}`);
		}
	}
}

export const courseService = new CourseService();