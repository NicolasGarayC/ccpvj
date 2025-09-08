import { goto } from '$app/navigation';
import type { WorkItem, CreateWorkItemDto, UpdateWorkItemDto } from './courseService';

export interface WorkItemWithModule {
	id: string;
	title: string;
	description?: string;
	longText?: string;
	imagePath?: string;
	videoPath?: string;
	orderNumber: number;
	isActive: boolean;
	createdAt: string;
	moduleId: string;
	moduleName: string;
	courseId: string;
	courseName: string;
}

export interface MediaFile {
	id: string;
	fileName: string;
	filePath: string;
	mimeType: string;
	size: number;
	uploadedAt: string;
}

class WorkItemService {
	private apiUrl = '/api/workitem';

	async getWorkItemsByModule(moduleId: string): Promise<WorkItem[]> {
		const response = await fetch(`${this.apiUrl}/module/${moduleId}`, {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`Error getting work items: ${response.statusText}`);
		}

		return await response.json();
	}

	async getWorkItemById(id: string): Promise<WorkItem | null> {
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
			throw new Error(`Error getting work item: ${response.statusText}`);
		}

		return await response.json();
	}

	async getWorkItemMedia(id: string): Promise<MediaFile[]> {
		const response = await fetch(`${this.apiUrl}/${id}/media`, {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`Error getting work item media: ${response.statusText}`);
		}

		return await response.json();
	}

	async createWorkItem(workItemData: CreateWorkItemDto): Promise<WorkItem> {
		const response = await fetch(this.apiUrl, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(workItemData)
		});

		if (response.status === 401) {
			goto('/auth/login');
			throw new Error('Authentication required');
		}

		if (response.status === 403) {
			throw new Error('No tienes permisos para crear WorkItems en este módulo');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error creating work item: ${errorText}`);
		}

		return await response.json();
	}

	async updateWorkItem(id: string, workItemData: UpdateWorkItemDto): Promise<void> {
		const response = await fetch(`${this.apiUrl}/${id}`, {
			method: 'PUT',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(workItemData)
		});

		if (response.status === 401) {
			goto('/auth/login');
			throw new Error('Authentication required');
		}

		if (response.status === 403) {
			throw new Error('No tienes permisos para editar este WorkItem');
		}

		if (response.status === 404) {
			throw new Error('WorkItem no encontrado o no tienes permisos para editarlo');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error updating work item: ${errorText}`);
		}
	}

	async deleteWorkItem(id: string): Promise<void> {
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
			throw new Error('No tienes permisos para eliminar este WorkItem');
		}

		if (response.status === 404) {
			throw new Error('WorkItem no encontrado o no tienes permisos para eliminarlo');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error deleting work item: ${errorText}`);
		}
	}

	async reorderWorkItem(id: string, newOrderNumber: number): Promise<void> {
		const response = await fetch(`${this.apiUrl}/${id}/reorder`, {
			method: 'POST',
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
			throw new Error('No tienes permisos para reordenar WorkItems en este módulo');
		}

		if (response.status === 404) {
			throw new Error('WorkItem no encontrado o no tienes permisos para reordenarlo');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Error reordering work item: ${errorText}`);
		}
	}

	async getWorkItemsByCourse(courseId: string): Promise<WorkItemWithModule[]> {
		const response = await fetch(`${this.apiUrl}/course/${courseId}/all`, {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`Error getting course work items: ${response.statusText}`);
		}

		return await response.json();
	}
}

export const workItemService = new WorkItemService();