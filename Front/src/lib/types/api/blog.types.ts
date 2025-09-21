/**
 * Blog DTOs - Based on Backend .NET DTOs
 * Replaces direct blog model imports
 */

export interface ArticleDto {
	id: number;
	title: string;
	slug: string;
	summary: string;
	content: string;
	featuredImagePath?: string;
	tags: string;
	isPublished: boolean;
	isFeatured: boolean;
	authorId: number;
	authorName: string;
	categoryId?: number;
	categoryName?: string;
	createdAt: string;
	updatedAt?: string;
	publishedAt?: string;
	viewCount: number;
}

export interface CreateArticleDto {
	title: string;
	summary: string;
	content: string;
	tags: string;
	isPublished: boolean;
	isFeatured: boolean;
	featuredImagePath?: string;
	categoryId?: number;
	media?: Array<{
		mediaId: number;
		orderIndex: number;
		caption: string;
		altText: string;
	}>;
}

export interface UpdateArticleDto {
	title: string;
	summary: string;
	content: string;
	tags: string;
	isPublished: boolean;
	isFeatured: boolean;
	featuredImagePath?: string;
	categoryId?: number;
}

export interface ArticleSearchDto {
	isPublished?: boolean;
	authorId?: number;
	categoryId?: number;
	searchTerm?: string;
	tags?: string;
	page?: number;
	take?: number;
	skip?: number;
	sortBy?: string;
}

export interface BlogCategoryDto {
	id: number;
	name: string;
	description?: string;
	slug: string;
	isActive: boolean;
	articleCount: number;
	createdAt: string;
	updatedAt?: string;
}

export interface CreateBlogCategoryDto {
	name: string;
	description?: string;
	slug: string;
	isActive: boolean;
}

export interface UpdateBlogCategoryDto {
	name: string;
	description?: string;
	slug: string;
	isActive: boolean;
}

// Frontend-specific interfaces for blog
export interface BlogPost {
	id: number;
	title: string;
	slug: string;
	excerpt: string;
	content: string;
	featuredMedia?: string;
	videoPoster?: string;
	tags: string[];
	status: 'published' | 'draft';
	publishDate: string;
	authorId: number;
	authorName: string;
	categoryId?: number;
	categoryName?: string;
	createdAt: string;
	updatedAt?: string;
	viewCount?: number;
}

export interface BlogTag {
	name: string;
	count: number;
}

export interface BlogSearchParams {
	page?: number;
	pageSize?: number;
	searchTerm?: string;
	category?: string;
	tags?: string[];
	isPublished?: boolean;
	authorId?: number;
}