import type { BlogPost } from '$lib/types/api';
import { jwtService } from '$lib/services/auth/jwtService.js';
import { BACKEND_API_URL } from '$lib/config/backend';

interface CreateArticleData {
  title: string;
  subtitle?: string;
  slug: string;
  isPublished: boolean;
  status?: 'draft' | 'published';
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
  private baseURL = BACKEND_API_URL;

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
      id: backendArticle.id?.toString?.() ?? backendArticle.id,
      title: backendArticle.title,
      slug: backendArticle.slug,
      excerpt: backendArticle.subtitle || '',
      content: this.extractContentFromElements(backendArticle.elements || []),
      featuredMedia: this.extractFeaturedMediaFromElements(backendArticle.elements || []),
      videoPoster: undefined,
      tags: Array.isArray(backendArticle.tags)
        ? backendArticle.tags
        : (backendArticle.tags
            ? backendArticle.tags
                .split(',')
                .map((t: string) => t.trim())
                .filter((t: string) => t.length > 0)
            : []),
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

      if (typeof author.nombreUsuario === 'string' && author.nombreUsuario.trim().length > 0) {
        return author.nombreUsuario.trim();
      }

      if (typeof author.username === 'string' && author.username.trim().length > 0) {
        return author.username.trim();
      }

      if (typeof author.userName === 'string' && author.userName.trim().length > 0) {
        return author.userName.trim();
      }
    }

    const candidate =
      backendArticle.authorUsername ??
      backendArticle.author_user_name ??
      backendArticle.createdBy ??
      backendArticle.createdByName ??
      null;

    if (typeof candidate === 'string' && candidate.trim().length > 0 && !this.isPlaceholderAuthor(candidate)) {
      return candidate.trim();
    }

    return 'Autor';
  }

  private isPlaceholderAuthor(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return normalized === 'author' || normalized === 'autor';
  }

  async getLatestPosts(): Promise<BlogPost[]> {
    try {
      const response = await fetch(`${this.baseURL}/blog`, this.getRequestOptions());
      if (response.ok) {
        const data = await response.json();
        if (data && data.posts && Array.isArray(data.posts)) {
          return data.posts
            .map((post: any) => this.adaptBackendToFrontend(post))
            .filter(post => post.status === 'published');
        }
        return [];
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error('Error cargando posts recientes:', error);
      throw error;
    }
  }

  async getAllPosts(includeDrafts: boolean = false): Promise<BlogPost[]> {
    try {
      const params = new URLSearchParams();
      params.set('pageSize', '100');
      if (!includeDrafts) {
        params.set('isPublished', 'true');
      }

      const response = await fetch(`${this.baseURL}/blog?${params.toString()}`, this.getRequestOptions());
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
