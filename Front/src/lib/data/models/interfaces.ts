// Interfaces para tipos de datos centrales de la aplicación

export interface User {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  role: string;
  createdAt: Date;
  updatedAt?: Date;
  isActive: boolean;
  email?: string;
}

export interface BlogPost {
  id: number | string;
  title: string;
  content?: string;
  excerpt: string;
  publishDate: string;
  slug: string;
  status?: 'draft' | 'published' | 'archived'; // Estado del post
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
