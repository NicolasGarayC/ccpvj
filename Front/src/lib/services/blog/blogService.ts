import type { BlogPost } from '$lib/data/models/interfaces';
import { jwtService } from '$lib/services/auth/jwtService.js';

interface CreateArticleData {
  title: string;
  subtitle?: string;
  slug: string;
  isPublished: boolean;
  isFeatured: boolean;
  orderNumber?: number;
  isActive?: boolean;
  categoryId?: string;
  tags: string[];
  elements: Array<{
    elementType: string;
    content?: string;
    filePath?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    orderNumber: number;
    metadata?: string;
    isActive: boolean;
  }>;
}

class BlogService {
  private baseURL = 'http://localhost:5251/api';

  private getRequestOptions(options: RequestInit = {}): RequestInit {
    return {
      headers: {
        'Content-Type': 'application/json',
        ...jwtService.getAuthHeader(),
        ...(options.headers || {})
      },
      ...options
    };
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

  private adaptBackendToFrontend(backendArticle: any): BlogPost {
    return {
      id: backendArticle.id,
      title: backendArticle.title,
      slug: backendArticle.slug,
      excerpt: backendArticle.subtitle || '',
      content: this.extractContentFromElements(backendArticle.elements || []),
      featuredMedia: this.extractFeaturedMediaFromElements(backendArticle.elements || []),
      videoPoster: undefined,
      tags: Array.isArray(backendArticle.tags) ? backendArticle.tags : (backendArticle.tags ? backendArticle.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0) : []),
      status: backendArticle.isPublished ? 'published' : 'draft',
      publishDate: backendArticle.publishedAt || backendArticle.createdAt,
      authorId: backendArticle.authorId,
      authorName: backendArticle.authorName || 'Autor',
      categoryId: backendArticle.categoryId,
      categoryName: backendArticle.categoryName,
      createdAt: backendArticle.createdAt,
      updatedAt: backendArticle.updatedAt,
      viewCount: backendArticle.views || 0
    };
  }

  async getLatestPosts(): Promise<BlogPost[]> {
    try {
      const response = await fetch(`${this.baseURL}/blog`, this.getRequestOptions());
      if (response.ok) {
        const data = await response.json();
        if (data && data.posts && Array.isArray(data.posts)) {
          return data.posts.map((post: any) => this.adaptBackendToFrontend(post));
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
          return data.posts.map((post: any) => this.adaptBackendToFrontend(post));
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
      const response = await fetch(`${this.baseURL}/blog/slug/${slug}`, this.getRequestOptions());
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

  async updateArticle(id: string, data: Partial<CreateArticleData>): Promise<BlogPost> {
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

  async deleteArticle(id: string): Promise<void> {
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

  async publishArticle(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/blog/${id}/publish`, this.getRequestOptions({
        method: 'PUT'
      }));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error publicando artículo:', error);
      throw error;
    }
  }

  async unpublishArticle(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/blog/${id}/unpublish`, this.getRequestOptions({
        method: 'PUT'
      }));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error despublicando artículo:', error);
      throw error;
    }
  }
}

export const blogService = new BlogService();