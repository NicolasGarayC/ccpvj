import { BaseHttpService } from '../base/baseHttpService';
import type {
	ArticleDto,
	CreateArticleDto,
	UpdateArticleDto,
	ArticleSearchDto,
	BlogCategoryDto,
	CreateBlogCategoryDto,
	UpdateBlogCategoryDto,
	BlogPost,
	BlogTag,
	BlogSearchParams,
	BlogPostElementDto
} from '$lib/types/api';

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
};

type BlogPostUpdateInput = BlogPostCreateInput & {
	elements?: any[];
};

class BlogHttpService extends BaseHttpService {
	// Blog methods (updated to use /blog endpoints)
	async getArticles(params?: ArticleSearchDto): Promise<any> {
		const urlParams = new URLSearchParams();
		if (params?.isPublished !== undefined) urlParams.set('isPublished', params.isPublished.toString());
		if (params?.authorId) urlParams.set('authorId', params.authorId.toString());
		if (params?.categoryId) urlParams.set('categoryId', params.categoryId.toString());
		if (params?.searchTerm) urlParams.set('searchTerm', params.searchTerm);
		if (params?.tags) urlParams.set('tags', params.tags);
		if (params?.page) urlParams.set('page', params.page.toString());
		if (params?.pageSize) urlParams.set('pageSize', params.pageSize.toString());
		if (params?.sortBy) urlParams.set('sortBy', params.sortBy);

		return this.get<any>(`/blog?${urlParams.toString()}`);
	}

	async getFeaturedArticles(count: number = 6): Promise<any[]> {
		return this.get<any[]>(`/blog/featured?count=${count}`);
	}

	async getArticleById(id: string): Promise<any | null> {
		try {
			return await this.get<any>(`/blog/${id}`);
		} catch (error) {
			if (error instanceof Error && error.message.includes('404')) {
				return null;
			}
			throw error;
		}
	}

	async getArticleBySlug(slug: string): Promise<any | null> {
		try {
			return await this.get<any>(`/blog/slug/${slug}`);
		} catch (error) {
			if (error instanceof Error && error.message.includes('404')) {
				return null;
			}
			throw error;
		}
	}

	async createArticle(articleData: any): Promise<any> {
		return this.post<any>('/blog', articleData);
	}

	async updateArticle(id: string, articleData: any): Promise<any> {
		return this.put<any>(`/blog/${id}`, articleData);
	}

	async deleteArticle(id: string): Promise<void> {
		return this.delete(`/blog/${id}`);
	}

	async publishArticle(id: string): Promise<void> {
		return this.put(`/blog/${id}/publish`);
	}

	async unpublishArticle(id: string): Promise<void> {
		return this.put(`/blog/${id}/unpublish`);
	}

	async getRecentArticles(count: number = 10): Promise<any[]> {
		return this.get<any[]>(`/blog/recent?count=${count}`);
	}

	async getPopularArticles(count: number = 10): Promise<any[]> {
		return this.get<any[]>(`/blog/popular?count=${count}`);
	}

	// Blog Category methods
	async getCategories(): Promise<BlogCategoryDto[]> {
		return this.get<BlogCategoryDto[]>('/blogcategory');
	}

	async getCategoryById(id: number): Promise<BlogCategoryDto | null> {
		try {
			return await this.get<BlogCategoryDto>(`/blogcategory/${id}`);
		} catch (error) {
			if (error instanceof Error && error.message.includes('404')) {
				return null;
			}
			throw error;
		}
	}

	async createCategory(categoryData: CreateBlogCategoryDto): Promise<BlogCategoryDto> {
		return this.post<BlogCategoryDto>('/blogcategory', categoryData);
	}

	async updateCategory(id: number, categoryData: UpdateBlogCategoryDto): Promise<BlogCategoryDto> {
		return this.put<BlogCategoryDto>(`/blogcategory/${id}`, categoryData);
	}

	async deleteCategory(id: number): Promise<void> {
		return this.delete(`/blogcategory/${id}`);
	}

	// Frontend adapter methods for new blog structure with elements
	adaptBlogPostToBlogPost(blogPost: any): BlogPost {
		return {
			id: blogPost.id?.toString?.() ?? blogPost.id,
			title: blogPost.title,
			slug: blogPost.slug,
			excerpt: blogPost.subtitle || '',
			content: this.extractContentFromElements(blogPost.elements || []),
			featuredMedia: this.extractFeaturedMediaFromElements(blogPost.elements || []),
			videoPoster: undefined,
			tags: Array.isArray(blogPost.tags) ? blogPost.tags : (blogPost.tags ? blogPost.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0) : []),
			status: blogPost.status ?? (blogPost.isPublished ? 'published' : 'draft'),
			publishDate: blogPost.publishedAt
				? new Date(blogPost.publishedAt * 1000).toISOString()
				: blogPost.createdAt
					? new Date(blogPost.createdAt * 1000).toISOString()
					: new Date().toISOString(),
			authorId: Number(
				blogPost.authorId ??
				blogPost.authorID ??
				blogPost.author?.id ??
				blogPost.author?.authorId ??
				0
			),
			authorName: this.resolveAuthorName(blogPost),
			categoryId: blogPost.categoryId != null ? String(blogPost.categoryId) : undefined,
			categoryName: blogPost.categoryName,
			createdAt: blogPost.createdAt
				? new Date(blogPost.createdAt * 1000).toISOString()
				: new Date().toISOString(),
			updatedAt: blogPost.updatedAt
				? new Date(blogPost.updatedAt * 1000).toISOString()
				: undefined,
			viewCount: blogPost.views || 0
		};
	}

	adaptBlogPostToCreateBlog(post: BlogPostCreateInput): CreateArticleDto {
		const elements = this.createElementsFromContent(post.content ?? '', post.featuredMedia ?? undefined) as BlogPostElementDto[];
		return {
			title: post.title,
			subtitle: post.excerpt ?? '',
			slug: post.slug && post.slug.length > 0 ? post.slug : this.generateSlugFromTitle(post.title),
			isPublished: post.status === 'published',
			isFeatured: false,
			orderNumber: 0,
			isActive: true,
			categoryId: post.categoryId ?? undefined,
			tags: Array.isArray(post.tags) ? post.tags : [],
			featuredImagePath: post.featuredMedia ?? undefined,
			elements,
			status: post.status ?? 'draft'
		};
	}

	adaptBlogPostToUpdateBlog(post: BlogPostUpdateInput, includeElements: boolean): UpdateArticleDto {
		const updatePayload: UpdateArticleDto = {
			title: post.title ?? '',
			subtitle: post.excerpt ?? '',
			slug: post.slug ?? '',
			isPublished: post.status === 'published',
			isFeatured: false,
			orderNumber: 0,
			isActive: true,
			categoryId: post.categoryId ?? null,
			tags: Array.isArray(post.tags) ? post.tags : [],
			featuredImagePath: post.featuredMedia ?? undefined,
			status: post.status ?? 'draft'
		};

		if (includeElements) {
			updatePayload.elements = post.elements ?? (this.createElementsFromContent(post.content ?? '', post.featuredMedia ?? undefined) as BlogPostElementDto[]);
		}

		return updatePayload;
	}

	// Helper methods for element handling
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

	private createElementsFromContent(content: string, featuredMedia?: string): any[] {
		const elements: any[] = [];
		let orderNumber = 0;

		// Add featured image first if exists
		if (featuredMedia) {
			elements.push({
				elementType: 'image',
				filePath: featuredMedia,
				orderNumber: orderNumber++,
				isActive: true
			});
		}

		// Add content as text element
		if (content) {
			elements.push({
				elementType: 'text',
				content: content,
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
				.trim();
	}

	private resolveAuthorName(blogPost: any): string {
		const rawName = typeof blogPost.authorName === 'string' ? blogPost.authorName.trim() : '';
		if (rawName && !this.isPlaceholderAuthor(rawName)) {
			return rawName;
		}

		const author = blogPost.author ?? blogPost.authorInfo ?? null;
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

			const usernameCandidates = [
				author.nombreUsuario,
				author.username,
				author.userName
			];

			for (const candidate of usernameCandidates) {
				if (typeof candidate === 'string' && candidate.trim().length > 0 && !this.isPlaceholderAuthor(candidate)) {
					return candidate.trim();
				}
			}
		}

		const fallback =
			blogPost.authorUsername ??
			blogPost.author_user_name ??
			blogPost.createdBy ??
			blogPost.createdByName ??
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

	// High-level methods that return BlogPost interface for compatibility
	async getLatestPosts(): Promise<BlogPost[]> {
		const articles = await this.getFeaturedArticles(6);
		return articles.map(article => this.adaptBlogPostToBlogPost(article));
	}

	async getAllPosts(includeDrafts: boolean = false): Promise<BlogPost[]> {
		const searchParams: ArticleSearchDto = { pageSize: 50 };
		if (!includeDrafts) {
			searchParams.isPublished = true;
		}

		const result = await this.getArticles(searchParams);
		const articles = result.posts || result; // Handle both paginated and array responses
		return Array.isArray(articles) ? articles.map(article => this.adaptBlogPostToBlogPost(article)) : [];
	}

	async getPostBySlug(slug: string): Promise<BlogPost | null> {
		const article = await this.getArticleBySlug(slug);
		return article ? this.adaptBlogPostToBlogPost(article) : null;
	}

	async createPost(post: BlogPostCreateInput): Promise<BlogPost> {
		const blogData = this.adaptBlogPostToCreateBlog(post);
		const createdBlog = await this.createArticle(blogData);
		return this.adaptBlogPostToBlogPost(createdBlog);
	}

	async updatePost(id: string, post: BlogPostUpdateInput): Promise<BlogPost> {
		const needsExistingData =
			post.title === undefined ||
			post.excerpt === undefined ||
			post.slug === undefined ||
			post.status === undefined ||
			post.categoryId === undefined ||
			post.tags === undefined ||
			post.content === undefined ||
			post.featuredMedia === undefined;

		let mergedPost: BlogPostUpdateInput = { ...post };

		if (needsExistingData) {
			const existingArticle = await this.getArticleById(id);
			if (existingArticle) {
				const existing = this.adaptBlogPostToBlogPost(existingArticle);
				if (mergedPost.title === undefined) mergedPost.title = existing.title;
				if (mergedPost.excerpt === undefined) mergedPost.excerpt = existing.excerpt;
				if (mergedPost.slug === undefined) mergedPost.slug = existing.slug;
				if (mergedPost.status === undefined) mergedPost.status = existing.status;
				if (mergedPost.categoryId === undefined) mergedPost.categoryId = existing.categoryId ?? null;
				if (mergedPost.tags === undefined) mergedPost.tags = existing.tags;
				if (mergedPost.content === undefined) mergedPost.content = existing.content;
				if (mergedPost.featuredMedia === undefined) mergedPost.featuredMedia = existing.featuredMedia ?? undefined;
			}
		}

		const includeElements = post.elements !== undefined || mergedPost.elements !== undefined;
		const updateData = this.adaptBlogPostToUpdateBlog(mergedPost, includeElements);
		const updatedBlog = await this.updateArticle(id, updateData);
		return this.adaptBlogPostToBlogPost(updatedBlog);
	}

	async deletePost(id: string): Promise<void> {
		return this.deleteArticle(id);
	}

	async publishPost(id: string): Promise<void> {
		return this.publishArticle(id);
	}

	async unpublishPost(id: string): Promise<void> {
		return this.unpublishArticle(id);
	}

	async getRecentPosts(): Promise<BlogPost[]> {
		const articles = await this.getRecentArticles(10);
		return articles.map(article => this.adaptBlogPostToBlogPost(article));
	}

	async getPopularPosts(): Promise<BlogPost[]> {
		const articles = await this.getPopularArticles(10);
		return articles.map(article => this.adaptBlogPostToBlogPost(article));
	}
}

export const blogHttpService = new BlogHttpService();
