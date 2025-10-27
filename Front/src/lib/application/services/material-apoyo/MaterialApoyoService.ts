import { ApiError, BaseHttpService } from '$lib/infrastructure/http/BaseHttpClient';
import type {
	MaterialApoyoDto,
	MaterialApoyoDetailDto,
	MaterialApoyoSummaryDto,
	CreateMaterialApoyoDto,
	UpdateMaterialApoyoDto,
	ModuleDto,
	ModuleSummaryDto,
	CreateModuleDto,
	UpdateModuleDto,
	PostDto,
	CreatePostDto,
	UpdatePostDto,
	MaterialApoyoPagedResultDto,
	MaterialApoyoSearchDto,
	ReorderDto
} from '$lib/types/api';

export interface MaterialApoyoSearchParams {
	page?: number;
	pageSize?: number;
	searchTerm?: string;
	subject?: string;
	isFeatured?: boolean;
	isActive?: boolean;
	sortBy?: string;
}

type MaterialApoyoPagedResponse = MaterialApoyoPagedResultDto & { data?: MaterialApoyoDetailDto[] };

class MaterialApoyoService extends BaseHttpService {
	// Material Apoyo methods
	async getMaterialApoyo(params?: MaterialApoyoSearchParams): Promise<MaterialApoyoPagedResponse> {
		const urlParams = new URLSearchParams();
		if (params?.page) urlParams.set('page', params.page.toString());
		if (params?.pageSize) urlParams.set('pageSize', params.pageSize.toString());
		if (params?.searchTerm) urlParams.set('searchTerm', params.searchTerm);
		if (params?.subject) urlParams.set('subject', params.subject);
		if (params?.isFeatured !== undefined) urlParams.set('isFeatured', params.isFeatured.toString());
		if (params?.isActive !== undefined) urlParams.set('isActive', params.isActive.toString());
		if (params?.sortBy) urlParams.set('sortBy', params.sortBy);

		const response = await this.get<MaterialApoyoPagedResponse>(`/materialapoyo?${urlParams.toString()}`);
		if (!response.data && Array.isArray((response as any).items)) {
			return { ...response, data: (response as any).items };
		}
		return response;
	}

	async getAllMaterialApoyo(): Promise<MaterialApoyoSummaryDto[]> {
		return this.get<MaterialApoyoSummaryDto[]>('/materialapoyo/all');
	}

	async getFeaturedMaterialApoyo(count: number = 6): Promise<MaterialApoyoDetailDto[]> {
		return this.get<MaterialApoyoDetailDto[]>(`/materialapoyo/featured?count=${count}`);
	}

	async getMaterialApoyoById(id: string): Promise<MaterialApoyoDetailDto | null> {
		try {
			return await this.get<MaterialApoyoDetailDto>(`/materialapoyo/${id}`);
		} catch (error) {
			if (error instanceof ApiError && error.status === 404) {
				return null;
			}
			throw error;
		}
	}

	// Alias for consistency
	async getMaterialApoyoDetails(id: string): Promise<MaterialApoyoDetailDto | null> {
		return this.getMaterialApoyoById(id);
	}

	async createMaterialApoyo(materialApoyoData: CreateMaterialApoyoDto): Promise<MaterialApoyoDto> {
		return this.post<MaterialApoyoDto>('/materialapoyo', materialApoyoData);
	}

	async createMaterialApoyoWithId(id: string, materialApoyoData: CreateMaterialApoyoDto): Promise<MaterialApoyoDto> {
		// Send the ID as part of the request body
		return this.post<MaterialApoyoDto>('/materialapoyo', { ...materialApoyoData, id });
	}

	async updateMaterialApoyo(id: string, materialApoyoData: UpdateMaterialApoyoDto): Promise<void> {
		return this.put(`/materialapoyo/${id}`, materialApoyoData);
	}

	async deleteMaterialApoyo(id: string): Promise<void> {
		return this.delete(`/materialapoyo/${id}`);
	}

	async getMyMaterialApoyo(): Promise<MaterialApoyoDetailDto[]> {
		return this.get<MaterialApoyoDetailDto[]>('/materialapoyo/my-material-apoyo');
	}


	// Module methods
	async getModule(id: string): Promise<ModuleDto | null> {
		try {
			return await this.get<ModuleDto>(`/materialapoyo/modules/${id}`);
		} catch (error) {
			if (error instanceof ApiError && error.status === 404) {
				return null;
			}
			throw error;
		}
	}

	async getMaterialApoyoModules(materialApoyoId: string): Promise<ModuleSummaryDto[]> {
		return this.get<ModuleSummaryDto[]>(`/materialapoyo/${materialApoyoId}/modules`);
	}

	async createModule(moduleData: CreateModuleDto): Promise<ModuleDto> {
		return this.post<ModuleDto>('/materialapoyo/modules', moduleData);
	}

	async updateModule(id: string, moduleData: UpdateModuleDto): Promise<void> {
		return this.put(`/materialapoyo/modules/${id}`, moduleData);
	}

	async deleteModule(id: string): Promise<void> {
		return this.delete(`/materialapoyo/modules/${id}`);
	}

	async reorderModule(id: string, newOrderNumber: number): Promise<void> {
		const reorderData: ReorderDto = { newOrderNumber };
		return this.patch(`/materialapoyo/modules/${id}/reorder`, reorderData);
	}

	// Post methods
	async getPost(id: string): Promise<PostDto | null> {
		try {
			return await this.get<PostDto>(`/materialapoyo/posts/${id}`);
		} catch (error) {
			if (error instanceof ApiError && error.status === 404) {
				return null;
			}
			throw error;
		}
	}

	async getModulePosts(moduleId: string): Promise<PostDto[]> {
		return this.get<PostDto[]>(`/materialapoyo/modules/${moduleId}/posts`);
	}

	async createPost(postData: CreatePostDto): Promise<PostDto> {
		return this.post<PostDto>('/materialapoyo/posts', postData);
	}

	async updatePost(id: string, postData: UpdatePostDto): Promise<void> {
		return this.put(`/materialapoyo/posts/${id}`, postData);
	}

	async deletePost(id: string): Promise<void> {
		return this.delete(`/materialapoyo/posts/${id}`);
	}

	async reorderPost(id: string, newOrderNumber: number): Promise<void> {
		const reorderData: ReorderDto = { newOrderNumber };
		return this.post(`/materialapoyo/posts/${id}/reorder`, reorderData);
	}


	/**
	 * Check authentication status - will be implemented with JWT
	 */
	async checkAuthStatus(): Promise<{ canManage: boolean; user: any | null }> {
		// Import jwtService locally to avoid circular dependencies
		const { jwtService } = await import('$lib/application/services/auth/JwtService');

		const isAuthenticated = jwtService.isAuthenticated();
		const user = jwtService.getUser();
		const canManage = isAuthenticated && jwtService.canManageContent();

		return { canManage, user };
	}
}

export const materialApoyoService = new MaterialApoyoService();

// Re-export types for convenience
export type {
	MaterialApoyoDto as MaterialApoyo,
	MaterialApoyoDetailDto as MaterialApoyoDetail,
	ModuleDto as Module,
	ModuleSummaryDto as ModuleSummary,
	PostDto as Post,
	CreatePostDto as CreatePost,
	UpdatePostDto as UpdatePost,
	MaterialApoyoPagedResultDto as MaterialApoyoPagedResult
} from '$lib/types/api/materialApoyo.types';
