import type { BlogPost } from '$lib/data/models/interfaces';

interface CreateArticleData {
  title: string;
  summary: string;
  content: string;
  tags: string;
  isPublished: boolean;
  isFeatured: boolean;
  featuredImagePath?: string;
  media?: Array<{
    mediaId: number;
    orderIndex: number;
    caption: string;
    altText: string;
  }>;
}

class BlogService {
  private baseURL = 'http://localhost:5251/api';

  // TODO: Add JWT Bearer token when implemented
  private getRequestOptions(options: RequestInit = {}): RequestInit {
    return {
      // TODO: Add JWT Bearer token when implemented
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    };
  }

  private adaptBackendToFrontend(backendArticle: any): BlogPost {
    return {
      id: backendArticle.id,
      title: backendArticle.title,
      slug: backendArticle.slug,
      excerpt: backendArticle.summary,
      content: backendArticle.content,
      featuredMedia: backendArticle.featuredImagePath,
      videoPoster: null,
      tags: backendArticle.tags ? backendArticle.tags.split(',').map((t: string) => t.trim()) : [],
      status: backendArticle.isPublished ? 'published' : 'draft',
      publishDate: backendArticle.publishedAt || backendArticle.createdAt,
      authorId: backendArticle.authorId,
      authorName: backendArticle.authorName || 'Autor',
      createdAt: backendArticle.createdAt,
      updatedAt: backendArticle.updatedAt
    };
  }

  async getLatestPosts(): Promise<BlogPost[]> {
    try {
      const response = await fetch(`${this.baseURL}/blog`, this.getRequestOptions());
      if (response.ok) {
        const data = await response.json();
        if (data && data.posts && Array.isArray(data.posts)) {
          return data.posts.map(this.adaptBackendToFrontend);
        }
        return [];
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error('Error cargando posts recientes:', error);
      throw error;
    }
  }

  async getAllPosts(): Promise<BlogPost[]> {
    try {
      const response = await fetch(`${this.baseURL}/blog?pageSize=100`, this.getRequestOptions());
      if (response.ok) {
        const data = await response.json();
        if (data && data.posts && Array.isArray(data.posts)) {
          return data.posts.map(this.adaptBackendToFrontend);
        }
        return [];
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error('Error cargando todos los posts:', error);
      throw error;
    }
  }

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      const response = await fetch(`${this.baseURL}/blog/${slug}`, this.getRequestOptions());
      if (response.ok) {
        const backendArticle = await response.json();
        return this.adaptBackendToFrontend(backendArticle);
      }
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error('Error cargando post por slug:', error);
      throw error;
    }
  }

  async createArticle(data: CreateArticleData): Promise<BlogPost> {
    try {
      const response = await fetch(`${this.baseURL}/blog`, this.getRequestOptions({
        method: 'POST',
        body: JSON.stringify(data)
      }));

      if (response.ok) {
        const backendArticle = await response.json();
        return this.adaptBackendToFrontend(backendArticle);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error('Error creando artículo:', error);
      throw error;
    }
  }

  async updateArticle(id: number, data: Partial<CreateArticleData>): Promise<BlogPost> {
    try {
      const response = await fetch(`${this.baseURL}/blog/${id}`, this.getRequestOptions({
        method: 'PUT',
        body: JSON.stringify(data)
      }));

      if (response.ok) {
        const backendArticle = await response.json();
        return this.adaptBackendToFrontend(backendArticle);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error('Error actualizando artículo:', error);
      throw error;
    }
  }

  async deleteArticle(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/blog/${id}`, this.getRequestOptions({
        method: 'DELETE'
      }));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error eliminando artículo:', error);
      throw error;
    }
  }
}

export const blogService = new BlogService();