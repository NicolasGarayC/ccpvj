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
	createdAt: string;
	updatedAt?: string;
	publishedAt?: string;
	viewCount: number;
}

export interface BlogPostElementDto {
	id?: string;
	blogPostId?: string;
	elementType: string;
	content?: string;
	filePath?: string;
	fileName?: string;
	fileSize?: number;
	mimeType?: string;
	orderNumber: number;
	metadata?: string;
	isActive?: boolean;
}

export interface CreateArticleDto {
	title: string;
	subtitle?: string;
	slug: string;
	isPublished: boolean;
	isFeatured: boolean;
	orderNumber?: number;
	isActive?: boolean;
	categoryId?: string | null;
	tags?: string[];
	featuredImagePath?: string;
	elements?: BlogPostElementDto[];
}

export interface UpdateArticleDto {
	title: string;
	subtitle?: string;
	slug: string;
	isPublished: boolean;
	isFeatured: boolean;
	orderNumber?: number;
	isActive?: boolean;
	categoryId?: string | null;
	tags?: string[];
	featuredImagePath?: string;
	elements?: BlogPostElementDto[];
}

export interface ArticleSearchDto {
	isPublished?: boolean;
	authorId?: number;
	categoryId?: string;
	searchTerm?: string;
	tags?: string;
	page?: number;
	pageSize?: number;
	take?: number;
	skip?: number;
	sortBy?: string;
}


// Frontend-specific interfaces for blog
export interface BlogPost {
	id: number | string;
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
	categoryId?: string;
	categoryName?: string;
	createdAt: string;
	updatedAt?: string;
	viewCount?: number;
}

export interface BlogTag {
	name: string;
	count: number;
}

export interface BlogCategoryDto {
	id: string;
	name: string;
	description?: string;
	color: string;
	createdAt: string;
	postCount: number;
}

export interface CreateBlogCategoryDto {
	name: string;
	description?: string;
	color?: string;
}

export interface UpdateBlogCategoryDto {
	name: string;
	description?: string;
	color?: string;
}

export interface BlogSearchParams {
	page?: number;
	pageSize?: number;
	searchTerm?: string;
	tags?: string[];
	isPublished?: boolean;
	authorId?: number;
}
