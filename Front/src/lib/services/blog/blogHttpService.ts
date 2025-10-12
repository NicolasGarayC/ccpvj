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
	BlogSearchParams
} from '$lib/types/api';

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
			id: blogPost.id,
			title: blogPost.title,
			slug: blogPost.slug,
			excerpt: blogPost.subtitle || '',
			content: this.extractContentFromElements(blogPost.elements || []),
			featuredMedia: this.extractFeaturedMediaFromElements(blogPost.elements || []),
			videoPoster: undefined,
			tags: Array.isArray(blogPost.tags) ? blogPost.tags : (blogPost.tags ? blogPost.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0) : []),
			status: blogPost.isPublished ? 'published' : 'draft',
			publishDate: blogPost.publishedAt || blogPost.createdAt,
			authorId: blogPost.authorId,
			authorName: blogPost.authorName || 'Author',
			categoryId: blogPost.categoryId,
			categoryName: blogPost.categoryName,
			createdAt: blogPost.createdAt,
			updatedAt: blogPost.updatedAt,
			viewCount: blogPost.views || 0
		};
	}

	adaptBlogPostToCreateBlog(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): any {
		return {
			title: post.title,
			subtitle: post.excerpt,
			slug: post.slug || this.generateSlugFromTitle(post.title),
			isPublished: post.status === 'published',
			isFeatured: false,
			orderNumber: 0,
			isActive: true,
			tags: Array.isArray(post.tags) ? post.tags : [],
			elements: this.createElementsFromContent(post.content || '', post.featuredMedia),
			categoryId: post.categoryId
		};
	}

	adaptBlogPostToUpdateBlog(post: Partial<BlogPost>): any {
		const elements = this.createElementsFromContent(post.content || '', post.featuredMedia);
		return {
			title: post.title || '',
			subtitle: post.excerpt || '',
			slug: post.slug || '',
			isPublished: post.status === 'published',
			isFeatured: false,
			orderNumber: 0,
			isActive: true,
			tags: Array.isArray(post.tags) ? post.tags : [],
			elements: elements,
			categoryId: post.categoryId
		};
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

	// High-level methods that return BlogPost interface for compatibility
	async getLatestPosts(): Promise<BlogPost[]> {
		const articles = await this.getFeaturedArticles(6);
		return articles.map(article => this.adaptBlogPostToBlogPost(article));
	}

	async getAllPosts(): Promise<BlogPost[]> {
		const result = await this.getArticles({ isPublished: true, pageSize: 50 });
		const articles = result.posts || result; // Handle both paginated and array responses
		return Array.isArray(articles) ? articles.map(article => this.adaptBlogPostToBlogPost(article)) : [];
	}

	async getPostBySlug(slug: string): Promise<BlogPost | null> {
		const article = await this.getArticleBySlug(slug);
		return article ? this.adaptBlogPostToBlogPost(article) : null;
	}

	async createPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogPost> {
		const blogData = this.adaptBlogPostToCreateBlog(post);
		const createdBlog = await this.createArticle(blogData);
		return this.adaptBlogPostToBlogPost(createdBlog);
	}

	async updatePost(id: string, post: Partial<BlogPost>): Promise<BlogPost> {
		const updateData = this.adaptBlogPostToUpdateBlog(post);
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