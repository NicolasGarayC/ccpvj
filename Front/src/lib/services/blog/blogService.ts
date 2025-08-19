import { initializeOfflineBlogData, loadBlogPost, blogPosts, latestBlogPosts } from '$lib/data/stores/blogStore';
import type { BlogPost } from '$lib/data/models/interfaces';

class BlogService {
  private isOnline = false;

  constructor() {
    // Intenta detectar si hay conexión al backend
    this.checkConnection();
  }

  private async checkConnection() {
    try {
      const response = await fetch('/api/health-check', { method: 'HEAD', timeout: 1000 });
      this.isOnline = response.ok;
    } catch (error) {
      this.isOnline = false;
      console.log('Modo offline activado para blog');
      // Si no hay conexión, inicializa con datos locales
      initializeOfflineBlogData();
    }
  }

  async getLatestPosts(): Promise<BlogPost[]> {
    try {
      if (this.isOnline) {
        const response = await fetch('/api/blog/latest');
        if (response.ok) {
          const data = await response.json();
          latestBlogPosts.set(data);
          return data;
        }
      }
      
      // Si estamos offline o la petición falló, usa datos locales
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
        const response = await fetch(`/api/blog/${slug}`);
        if (response.ok) {
          return await response.json();
        }
      }
      
      // Modo offline
      return loadBlogPost(slug);
    } catch (error) {
      console.error(`Error cargando post ${slug}:`, error);
      return loadBlogPost(slug);
    }
  }

  async getAllPosts(): Promise<BlogPost[]> {
    try {
      if (this.isOnline) {
        const response = await fetch('/api/blog');
        if (response.ok) {
          const data = await response.json();
          blogPosts.set(data);
          return data;
        }
      }
      
      // Si estamos offline o la petición falló, usa datos locales
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
}

// Exportar una instancia única
export const blogService = new BlogService();
