import { initializeOfflineBlogData, loadBlogPost, blogPosts, latestBlogPosts } from '$lib/data/stores/blogStore';
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
  private isOnline = false;
  private baseURL = 'https://localhost:5251/api';
  private offlinePosts: BlogPost[] = [];

  constructor() {
    this.checkConnection();
  }

  private async checkConnection() {
    try {
      const response = await fetch(`${this.baseURL}/article/featured?count=1`, { 
        method: 'HEAD', 
        signal: AbortSignal.timeout(2000) 
      });
      this.isOnline = response.ok;
    } catch (error) {
      this.isOnline = false;
      console.log('Modo offline activado para blog');
      initializeOfflineBlogData();
    }
  }

  // Using cookie-based authentication - no headers needed
  private getRequestOptions(options: RequestInit = {}): RequestInit {
    return {
      credentials: 'include', // Include cookies for authentication
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
      if (this.isOnline) {
        const response = await fetch(`${this.baseURL}/article/featured?count=6`);
        if (response.ok) {
          const data = await response.json();
          const posts = Array.isArray(data) ? data.map(this.adaptBackendToFrontend) : [];
          latestBlogPosts.set(posts);
          return posts;
        }
      }
      
      let localPosts: BlogPost[] = [];
      latestBlogPosts.subscribe(value => { localPosts = value; })();
      
      if (localPosts.length === 0) {
        initializeOfflineBlogData();
        latestBlogPosts.subscribe(value => { localPosts = value; })();
      }
      
      return localPosts;
    } catch (error) {
      console.error('Error cargando posts recientes:', error);
      initializeOfflineBlogData();
      let localPosts: BlogPost[] = [];
      latestBlogPosts.subscribe(value => { localPosts = value; })();
      return localPosts;
    }
  }

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseURL}/article/slug/${slug}`);
        if (response.ok) {
          const data = await response.json();
          return this.adaptBackendToFrontend(data);
        }
      }
      
      return loadBlogPost(slug);
    } catch (error) {
      console.error(`Error cargando post ${slug}:`, error);
      return loadBlogPost(slug);
    }
  }

  async getAllPosts(): Promise<BlogPost[]> {
    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseURL}/article?isPublished=true&take=50`);
        if (response.ok) {
          const data = await response.json();
          const posts = Array.isArray(data) ? data.map(this.adaptBackendToFrontend) : [];
          blogPosts.set(posts);
          return posts;
        }
      }
      
      let localPosts: BlogPost[] = [];
      blogPosts.subscribe(value => { localPosts = value; })();
      
      if (localPosts.length === 0) {
        initializeOfflineBlogData();
        blogPosts.subscribe(value => { localPosts = value; })();
      }
      
      return localPosts;
    } catch (error) {
      console.error('Error cargando todos los posts:', error);
      initializeOfflineBlogData();
      let localPosts: BlogPost[] = [];
      blogPosts.subscribe(value => { localPosts = value; })();
      return localPosts;
    }
  }

  async createPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogPost> {
    if (!this.isOnline) {
      throw new Error('Función no disponible en modo offline');
    }

    const articleData: CreateArticleData = {
      title: post.title,
      summary: post.excerpt,
      content: post.content || post.excerpt,
      tags: post.tags?.join(',') || '',
      isPublished: post.status === 'published',
      isFeatured: false,
      featuredImagePath: post.featuredMedia || undefined
    };

    try {
      const response = await fetch(`${this.baseURL}/article`, this.getRequestOptions({
        method: 'POST',
        body: JSON.stringify(articleData)
      }));

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
      }

      const createdArticle = await response.json();
      return this.adaptBackendToFrontend(createdArticle);
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  async updatePost(id: number, post: Partial<BlogPost>): Promise<BlogPost> {
    if (!this.isOnline) {
      throw new Error('Función no disponible en modo offline');
    }

    const updateData: Partial<CreateArticleData> = {};
    
    if (post.title) updateData.title = post.title;
    if (post.excerpt) updateData.summary = post.excerpt;
    if (post.content) updateData.content = post.content;
    if (post.tags) updateData.tags = post.tags.join(',');
    if (post.status) updateData.isPublished = post.status === 'published';
    if (post.featuredMedia) updateData.featuredImagePath = post.featuredMedia;

    try {
      const response = await fetch(`${this.baseURL}/article/${id}`, this.getRequestOptions({
        method: 'PUT',
        body: JSON.stringify(updateData)
      }));

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
      }

      const updatedArticle = await response.json();
      return this.adaptBackendToFrontend(updatedArticle);
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  async deletePost(id: number): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Función no disponible en modo offline');
    }

    try {
      const response = await fetch(`${this.baseURL}/article/${id}`, this.getRequestOptions({
        method: 'DELETE'
      }));

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  async publishPost(id: number): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Función no disponible en modo offline');
    }

    try {
      const response = await fetch(`${this.baseURL}/article/${id}/publish`, this.getRequestOptions({
        method: 'POST'
      }));

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      throw error;
    }
  }

  async unpublishPost(id: number): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Función no disponible en modo offline');
    }

    try {
      const response = await fetch(`${this.baseURL}/article/${id}/unpublish`, this.getRequestOptions({
        method: 'POST'
      }));

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error unpublishing post:', error);
      throw error;
    }
  }

  async getMyArticles(): Promise<BlogPost[]> {
    if (!this.isOnline) {
      throw new Error('Función no disponible en modo offline');
    }

    try {
      const response = await fetch(`${this.baseURL}/article/my-articles`, this.getRequestOptions());

      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data.map(this.adaptBackendToFrontend) : [];
      }

      throw new Error(`Error ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error('Error loading my articles:', error);
      throw error;
    }
  }

  async getPopularTags(): Promise<string[]> {
    if (!this.isOnline) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseURL}/article/tags/popular?count=10`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error loading popular tags:', error);
      return [];
    }
  }
}

export const blogService = new BlogService();
