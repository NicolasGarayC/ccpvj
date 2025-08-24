// Interfaces para tipos de datos centrales de la aplicación

export interface User {
  id: string;
  username: string;
  nombre?: string;
  apellido?: string;
  role: 'educator' | 'student';
  email?: string;
}

export interface BlogPost {
  id: number | string;
  title: string;
  content?: string;
  excerpt: string;
  publishDate: string;
  slug: string;
  featuredMedia?: string; // Cambio: de featuredImage a featuredMedia para soportar videos
  videoPoster?: string; // Nuevo: imagen de preview para videos
  mediaType?: 'image' | 'video' | 'text'; // Nuevo: tipo de contenido
  authorId?: string;
  authorName?: string;
  tags?: string[];
  isPublished?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  modules?: Module[];
  educatorId?: string;
  educatorName?: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  courseId: string;
  materials: Material[];
  order: number;
}

export interface Material {
  id: string;
  title: string;
  type: 'video' | 'document' | 'text' | 'link';
  url: string;
  moduleId: string;
  description?: string;
  order: number;
}

export interface Forum {
  id: string;
  title: string;
  courseId: string;
  posts: ForumPost[];
}

export interface ForumPost {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  forumId: string;
}
