import type {
	ArticleSearchDto,
	BlogPost,
	BlogCategoryDto,
	CreateArticleDto,
	CreateBlogCategoryDto,
	UpdateArticleDto,
	UpdateBlogCategoryDto,
	BlogPostElementDto
} from '$lib/types/api';
import { ApiError, BaseHttpService } from '$lib/infrastructure/http/BaseHttpClient';

type BlogPostCreateInput = {
	title: string;
	excerpt?: string;
	content?: string;
	slug?: string;
	status?: 'draft' | 'published';
	categoryId?: string | null;
	featuredMedia?: string | null | undefined;
	tags?: string[];
	authorId?: number;
	authorName?: string;
	publishDate?: string;
	isPublished?: boolean;
	elements?: BlogPostElementDto[];
};

type BlogPostUpdateInput = BlogPostCreateInput & {
	elements?: BlogPostElementDto[];
};

const DEFAULT_PAGE_SIZE = 50;

class BlogService extends BaseHttpService {
	private readonly basePath = '/blog';
	private readonly categoryPath = '/blogcategory';

	// -------------------------------------------------------------------------
	// Public queries
	// -------------------------------------------------------------------------

	async getArticles(params?: ArticleSearchDto): Promise<any> {
		const query = this.buildArticlesQuery(params);
		const endpoint = query ? `${this.basePath}?${query}` : this.basePath;
		return this.get<any>(endpoint);
	}

	async getFeaturedArticles(count: number = 6): Promise<any[]> {
		return this.get<any[]>(`${this.basePath}/featured`, { count });
	}

	async getRecentArticles(count: number = 10): Promise<any[]> {
		return this.get<any[]>(`${this.basePath}/recent`, { count });
	}

	async getPopularArticles(count: number = 10): Promise<any[]> {
		return this.get<any[]>(`${this.basePath}/popular`, { count });
	}

	async getArticleById(id: string): Promise<BlogPost | null> {
		try {
			const article = await this.get<any>(`${this.basePath}/${id}`);
			return article ? this.adaptBackendToFrontend(article) : null;
		} catch (error) {
			if (error instanceof ApiError && error.status === 404) {
				return null;
			}
			throw error;
		}
	}

	async getArticleBySlug(slug: string): Promise<BlogPost | null> {
		try {
			const article = await this.get<any>(`${this.basePath}/slug/${slug}`);
			return article ? this.adaptBackendToFrontend(article) : null;
		} catch (error) {
			if (error instanceof ApiError && error.status === 404) {
				return null;
			}
			throw error;
		}
	}

	async getLatestPosts(): Promise<BlogPost[]> {
		const result = await this.getFeaturedArticles(6);
		return this.normalizeBackendCollection(result).map(post => this.adaptBackendToFrontend(post));
	}

	async getAllPosts(includeDrafts: boolean = false): Promise<BlogPost[]> {
		const params: ArticleSearchDto = {
			pageSize: DEFAULT_PAGE_SIZE
		};

		if (!includeDrafts) {
			params.isPublished = true;
		}

		const result = await this.getArticles(params);
		const posts = this.extractPostsFromResponse(result);
		return posts.map(post => this.adaptBackendToFrontend(post));
	}

	async getAllBlogPosts(includeDrafts: boolean = false): Promise<BlogPost[]> {
		return this.getAllPosts(includeDrafts);
	}

	async getPostBySlug(slug: string): Promise<BlogPost | null> {
		return this.getArticleBySlug(slug);
	}

	async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
		return this.getPostBySlug(slug);
	}

	async getPostById(id: string): Promise<BlogPost | null> {
		return this.getArticleById(id);
	}

	async createArticle(data: CreateArticleDto): Promise<BlogPost> {
		const article = await this.post<any>(this.basePath, data);
		return this.adaptBackendToFrontend(article);
	}

	async createPost(post: BlogPostCreateInput): Promise<BlogPost> {
		const articleData = this.adaptBlogPostToCreateArticle(post);
		const backendArticle = await this.createArticle(articleData);
		return backendArticle;
	}

	async createBlogPost(post: BlogPostCreateInput): Promise<BlogPost> {
		return this.createPost(post);
	}

	async updateArticle(id: string, data: UpdateArticleDto): Promise<BlogPost> {
		const article = await this.put<any>(`${this.basePath}/${id}`, data);
		return this.adaptBackendToFrontend(article);
	}

	async updatePost(id: string, post: BlogPostUpdateInput): Promise<BlogPost> {
		const payload = await this.prepareUpdatePayload(id, post);
		return this.updateArticle(id, payload);
	}

	async updateBlogPost(id: string, post: BlogPostUpdateInput): Promise<BlogPost> {
		return this.updatePost(id, post);
	}

	async deleteArticle(id: string): Promise<void> {
		await this.delete(`${this.basePath}/${id}`);
	}

	async deletePost(id: string): Promise<void> {
		return this.deleteArticle(id);
	}

	async deleteBlogPost(id: string): Promise<void> {
		return this.deleteArticle(id);
	}

	async publishArticle(id: string): Promise<void> {
		await this.put(`${this.basePath}/${id}/publish`);
	}

	async publishPost(id: string): Promise<void> {
		return this.publishArticle(id);
	}

	async unpublishArticle(id: string): Promise<void> {
		await this.put(`${this.basePath}/${id}/unpublish`);
	}

	async unpublishPost(id: string): Promise<void> {
		return this.unpublishArticle(id);
	}

	async getFeaturedBlogPosts(): Promise<BlogPost[]> {
		const result = await this.getFeaturedArticles();
		return this.normalizeBackendCollection(result).map(post => this.adaptBackendToFrontend(post));
	}

	// -------------------------------------------------------------------------
	// Categories
	// -------------------------------------------------------------------------

	async getCategories(): Promise<BlogCategoryDto[]> {
		return this.get<BlogCategoryDto[]>(this.categoryPath);
	}

	async getCategoryById(id: number): Promise<BlogCategoryDto | null> {
		try {
			return await this.get<BlogCategoryDto>(`${this.categoryPath}/${id}`);
		} catch (error) {
			if (error instanceof ApiError && error.status === 404) {
				return null;
			}
			throw error;
		}
	}

	async createCategory(categoryData: CreateBlogCategoryDto): Promise<BlogCategoryDto> {
		return this.post<BlogCategoryDto>(this.categoryPath, categoryData);
	}

	async updateCategory(id: number, categoryData: UpdateBlogCategoryDto): Promise<BlogCategoryDto> {
		return this.put<BlogCategoryDto>(`${this.categoryPath}/${id}`, categoryData);
	}

	async deleteCategory(id: number): Promise<void> {
		await this.delete(`${this.categoryPath}/${id}`);
	}

	// -------------------------------------------------------------------------
	// Helpers
	// -------------------------------------------------------------------------

	private buildArticlesQuery(params?: ArticleSearchDto): string {
		if (!params) {
			return '';
		}

		const searchParams = new URLSearchParams();

		if (params.isPublished !== undefined) searchParams.set('isPublished', String(params.isPublished));
		if (params.authorId !== undefined) searchParams.set('authorId', String(params.authorId));
		if (params.categoryId) searchParams.set('categoryId', String(params.categoryId));
		if (params.searchTerm) searchParams.set('searchTerm', params.searchTerm);
		if (params.tags) searchParams.set('tags', Array.isArray(params.tags) ? params.tags.join(',') : params.tags);
		if (params.page !== undefined) searchParams.set('page', String(params.page));
		if (params.pageSize !== undefined) searchParams.set('pageSize', String(params.pageSize));
		if (params.sortBy) searchParams.set('sortBy', params.sortBy);
		if (params.take !== undefined) searchParams.set('take', String(params.take));
		if (params.skip !== undefined) searchParams.set('skip', String(params.skip));

		return searchParams.toString();
	}

	private async prepareUpdatePayload(id: string, post: BlogPostUpdateInput): Promise<UpdateArticleDto> {
		const needsExistingData =
			post.title === undefined ||
			post.excerpt === undefined ||
			post.slug === undefined ||
			post.status === undefined ||
			post.categoryId === undefined ||
			post.tags === undefined ||
			post.content === undefined ||
			(post.elements === undefined && post.featuredMedia === undefined);

		let mergedPost: BlogPostUpdateInput = { ...post };

		if (needsExistingData) {
			const existingArticle = await this.getArticleById(id);
			if (existingArticle) {
				if (mergedPost.title === undefined) mergedPost.title = existingArticle.title;
				if (mergedPost.excerpt === undefined) mergedPost.excerpt = existingArticle.excerpt;
				if (mergedPost.slug === undefined) mergedPost.slug = existingArticle.slug;
				if (mergedPost.status === undefined) mergedPost.status = existingArticle.status;
				if (mergedPost.categoryId === undefined) mergedPost.categoryId = existingArticle.categoryId ?? null;
				if (mergedPost.tags === undefined) mergedPost.tags = existingArticle.tags;
				if (mergedPost.content === undefined) mergedPost.content = existingArticle.content;
				if (mergedPost.featuredMedia === undefined) {
					mergedPost.featuredMedia = existingArticle.featuredMedia ?? undefined;
				}
			}
		}

		const includeElements = post.elements !== undefined || mergedPost.elements !== undefined;

		return this.adaptBlogPostToUpdateArticle(mergedPost, includeElements);
	}

	private normalizeBackendCollection(data: any): any[] {
		if (Array.isArray(data)) {
			return data;
		}

		if (Array.isArray(data?.items)) {
			return data.items;
		}

		if (Array.isArray(data?.posts)) {
			return data.posts;
		}

		return [];
	}

	private extractPostsFromResponse(response: any): any[] {
		return this.normalizeBackendCollection(response);
	}

	private adaptBackendToFrontend(backendArticle: any): BlogPost {
		return {
			id: backendArticle.id?.toString?.() ?? backendArticle.id,
			title: backendArticle.title,
			slug: backendArticle.slug,
			excerpt: backendArticle.subtitle || '',
			content: this.extractContentFromElements(backendArticle.elements || []),
			featuredMedia: this.extractFeaturedMediaFromElements(backendArticle.elements || []),
			videoPoster: undefined,
			tags: Array.isArray(backendArticle.tags)
				? backendArticle.tags
				: backendArticle.tags
					? backendArticle.tags
							.split(',')
							.map((t: string) => t.trim())
							.filter((t: string) => t.length > 0)
					: [],
			status: backendArticle.status ?? (backendArticle.isPublished ? 'published' : 'draft'),
			publishDate: backendArticle.publishedAt
				? new Date(backendArticle.publishedAt * 1000).toISOString()
				: backendArticle.createdAt
					? new Date(backendArticle.createdAt * 1000).toISOString()
					: new Date().toISOString(),
			authorId: Number(
				backendArticle.authorId ??
					backendArticle.authorID ??
					backendArticle.author?.id ??
					backendArticle.author?.authorId ??
					0
			),
			authorName: this.resolveAuthorName(backendArticle),
			categoryId: backendArticle.categoryId != null ? String(backendArticle.categoryId) : undefined,
			categoryName: backendArticle.categoryName,
			createdAt: backendArticle.createdAt
				? new Date(backendArticle.createdAt * 1000).toISOString()
				: new Date().toISOString(),
			updatedAt: backendArticle.updatedAt
				? new Date(backendArticle.updatedAt * 1000).toISOString()
				: undefined,
			viewCount: backendArticle.views || backendArticle.viewCount || 0
		};
	}

	private adaptBlogPostToCreateArticle(post: BlogPostCreateInput): CreateArticleDto {
		const elements =
			post.elements ??
			this.createElementsFromContent(post.content ?? '', post.featuredMedia ?? undefined);

		return {
			title: post.title,
			subtitle: post.excerpt ?? '',
			slug: post.slug && post.slug.length > 0 ? post.slug : this.generateSlugFromTitle(post.title),
			isPublished: post.status === 'published' || post.isPublished === true,
			isFeatured: false,
			orderNumber: 0,
			isActive: true,
			categoryId: post.categoryId ?? undefined,
			tags: Array.isArray(post.tags) ? post.tags : [],
			featuredImagePath: post.featuredMedia ?? undefined,
			elements,
			status: post.status ?? (post.isPublished ? 'published' : 'draft')
		};
	}

	private adaptBlogPostToUpdateArticle(post: BlogPostUpdateInput, includeElements: boolean): UpdateArticleDto {
		const updatePayload: UpdateArticleDto = {
			title: post.title ?? '',
			subtitle: post.excerpt ?? '',
			slug: post.slug ?? '',
			isPublished: post.status === 'published' || post.isPublished === true,
			isFeatured: false,
			orderNumber: 0,
			isActive: true,
			categoryId: post.categoryId ?? null,
			tags: Array.isArray(post.tags) ? post.tags : [],
			featuredImagePath: post.featuredMedia ?? undefined,
			status: post.status ?? (post.isPublished ? 'published' : 'draft')
		};

		if (includeElements) {
			updatePayload.elements =
				post.elements ??
				this.createElementsFromContent(post.content ?? '', post.featuredMedia ?? undefined);
		}

		return updatePayload;
	}

	private extractContentFromElements(elements: any[]): string {
		return elements
			.filter(el => el.elementType === 'text' && el.isActive)
			.sort((a, b) => a.orderNumber - b.orderNumber)
			.map(el => el.content)
			.join('\n\n');
	}

	private extractFeaturedMediaFromElements(elements: any[]): string | undefined {
		const imageElement = elements.find(el => el.elementType === 'image' && el.isActive);
		return imageElement?.filePath;
	}

	private createElementsFromContent(content: string, featuredMedia?: string | null): BlogPostElementDto[] {
		const elements: BlogPostElementDto[] = [];
		let orderNumber = 0;

		if (featuredMedia) {
			elements.push({
				elementType: 'image',
				filePath: featuredMedia,
				orderNumber: orderNumber++,
				isActive: true
			});
		}

		if (content) {
			elements.push({
				elementType: 'text',
				content,
				orderNumber: orderNumber++,
				isActive: true
			});
		}

		return elements;
	}

	private generateSlugFromTitle(title: string): string {
		return title
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.trim();
	}

	private resolveAuthorName(backendArticle: any): string {
		const rawName = typeof backendArticle.authorName === 'string' ? backendArticle.authorName.trim() : '';
		if (rawName && !this.isPlaceholderAuthor(rawName)) {
			return rawName;
		}

		const author = backendArticle.author ?? backendArticle.authorInfo ?? null;
		if (author) {
			const nameParts = [
				author.nombre ?? author.firstName ?? author.name ?? author.first_name ?? null,
				author.apellido ?? author.lastName ?? author.last_name ?? null
			]
				.filter((part: string | null | undefined) => typeof part === 'string' && part.trim().length > 0)
				.map((part: string | null) => part!.trim());

			if (nameParts.length > 0) {
				return nameParts.join(' ');
			}

			const usernameCandidates = [author.nombreUsuario, author.username, author.userName];

			for (const candidate of usernameCandidates) {
				if (typeof candidate === 'string' && candidate.trim().length > 0 && !this.isPlaceholderAuthor(candidate)) {
					return candidate.trim();
				}
			}
		}

		const fallback =
			backendArticle.authorUsername ??
			backendArticle.author_user_name ??
			backendArticle.createdBy ??
			backendArticle.createdByName ??
			null;

		if (typeof fallback === 'string' && fallback.trim().length > 0 && !this.isPlaceholderAuthor(fallback)) {
			return fallback.trim();
		}

		return 'Autor';
	}

	private isPlaceholderAuthor(value: string): boolean {
		const normalized = value.trim().toLowerCase();
		return normalized === 'author' || normalized === 'autor';
	}
}

export const blogService = new BlogService();
