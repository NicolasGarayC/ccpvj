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
	// Article methods
	async getArticles(params?: ArticleSearchDto): Promise<ArticleDto[]> {
		const urlParams = new URLSearchParams();
		if (params?.isPublished !== undefined) urlParams.set('isPublished', params.isPublished.toString());
		if (params?.authorId) urlParams.set('authorId', params.authorId.toString());
		if (params?.categoryId) urlParams.set('categoryId', params.categoryId.toString());
		if (params?.searchTerm) urlParams.set('searchTerm', params.searchTerm);
		if (params?.tags) urlParams.set('tags', params.tags);
		if (params?.page) urlParams.set('page', params.page.toString());
		if (params?.take) urlParams.set('take', params.take.toString());
		if (params?.skip) urlParams.set('skip', params.skip.toString());
		if (params?.sortBy) urlParams.set('sortBy', params.sortBy);

		return this.get<ArticleDto[]>(`/article?${urlParams.toString()}`);
	}

	async getFeaturedArticles(count: number = 6): Promise<ArticleDto[]> {
		return this.get<ArticleDto[]>(`/article/featured?count=${count}`);
	}

	async getArticleById(id: number): Promise<ArticleDto | null> {
		try {
			return await this.get<ArticleDto>(`/article/${id}`);
		} catch (error) {
			if (error instanceof Error && error.message.includes('404')) {
				return null;
			}
			throw error;
		}
	}

	async getArticleBySlug(slug: string): Promise<ArticleDto | null> {
		try {
			return await this.get<ArticleDto>(`/article/slug/${slug}`);
		} catch (error) {
			if (error instanceof Error && error.message.includes('404')) {
				return null;
			}
			throw error;
		}
	}

	async createArticle(articleData: CreateArticleDto): Promise<ArticleDto> {
		return this.post<ArticleDto>('/article', articleData);
	}

	async updateArticle(id: number, articleData: UpdateArticleDto): Promise<ArticleDto> {
		return this.put<ArticleDto>(`/article/${id}`, articleData);
	}

	async deleteArticle(id: number): Promise<void> {
		return this.delete(`/article/${id}`);
	}

	async publishArticle(id: number): Promise<void> {
		return this.post(`/article/${id}/publish`);
	}

	async unpublishArticle(id: number): Promise<void> {
		return this.post(`/article/${id}/unpublish`);
	}

	async getMyArticles(): Promise<ArticleDto[]> {
		return this.get<ArticleDto[]>('/article/my-articles');
	}

	async getPopularTags(count: number = 10): Promise<string[]> {
		return this.get<string[]>(`/article/tags/popular?count=${count}`);
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

	// Frontend adapter methods for backwards compatibility
	adaptArticleToBlogPost(article: ArticleDto): BlogPost {
		return {
			id: article.id,
			title: article.title,
			slug: article.slug,
			excerpt: article.summary,
			content: article.content,
			featuredMedia: article.featuredImagePath,
			videoPoster: undefined,
			tags: article.tags ? article.tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : [],
			status: article.isPublished ? 'published' : 'draft',
			publishDate: article.publishedAt || article.createdAt,
			authorId: article.authorId,
			authorName: article.authorName,
			categoryId: article.categoryId,
			categoryName: article.categoryName,
			createdAt: article.createdAt,
			updatedAt: article.updatedAt,
			viewCount: article.viewCount
		};
	}

	adaptBlogPostToCreateArticle(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): CreateArticleDto {
		return {
			title: post.title,
			summary: post.excerpt,
			content: post.content || post.excerpt,
			tags: post.tags?.join(', ') || '',
			isPublished: post.status === 'published',
			isFeatured: false,
			featuredImagePath: post.featuredMedia,
			categoryId: post.categoryId
		};
	}

	adaptBlogPostToUpdateArticle(post: Partial<BlogPost>): UpdateArticleDto {
		return {
			title: post.title || '',
			summary: post.excerpt || '',
			content: post.content || post.excerpt || '',
			tags: post.tags?.join(', ') || '',
			isPublished: post.status === 'published',
			isFeatured: false,
			featuredImagePath: post.featuredMedia,
			categoryId: post.categoryId
		};
	}

	// High-level methods that return BlogPost interface for compatibility
	async getLatestPosts(): Promise<BlogPost[]> {
		const articles = await this.getFeaturedArticles(6);
		return articles.map(article => this.adaptArticleToBlogPost(article));
	}

	async getAllPosts(): Promise<BlogPost[]> {
		const articles = await this.getArticles({ isPublished: true, take: 50 });
		return articles.map(article => this.adaptArticleToBlogPost(article));
	}

	async getPostBySlug(slug: string): Promise<BlogPost | null> {
		const article = await this.getArticleBySlug(slug);
		return article ? this.adaptArticleToBlogPost(article) : null;
	}

	async createPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogPost> {
		const articleData = this.adaptBlogPostToCreateArticle(post);
		const createdArticle = await this.createArticle(articleData);
		return this.adaptArticleToBlogPost(createdArticle);
	}

	async updatePost(id: number, post: Partial<BlogPost>): Promise<BlogPost> {
		const updateData = this.adaptBlogPostToUpdateArticle(post);
		const updatedArticle = await this.updateArticle(id, updateData);
		return this.adaptArticleToBlogPost(updatedArticle);
	}

	async deletePost(id: number): Promise<void> {
		return this.deleteArticle(id);
	}

	async publishPost(id: number): Promise<void> {
		return this.publishArticle(id);
	}

	async unpublishPost(id: number): Promise<void> {
		return this.unpublishArticle(id);
	}

	async getMyPosts(): Promise<BlogPost[]> {
		const articles = await this.getMyArticles();
		return articles.map(article => this.adaptArticleToBlogPost(article));
	}
}

export const blogHttpService = new BlogHttpService();