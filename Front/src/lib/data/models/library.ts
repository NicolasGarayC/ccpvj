// Tipos de archivos multimedia soportados
export type MediaType = 'pdf' | 'video' | 'image' | 'audio' | 'document';

// Categorías de recursos
export type ResourceCategory = 'educacion' | 'cultura' | 'historia' | 'arte' | 'literatura' | 'ciencias' | 'otros';

// Interfaz principal para recursos de biblioteca
export interface LibraryResource {
  id: string;
  name: string;
  description?: string;
  authors: string[];
  publishYear?: number;
  category: ResourceCategory;
  mediaType: MediaType;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  thumbnailPath?: string;
  downloadable: boolean;
  downloadCount: number;
  tags?: string[];
  isbn?: string; // Para libros
  duration?: number; // Para videos/audio en segundos
  language: string;
  uploadedBy: string;
  uploadedAt: Date;
  updatedAt?: Date;
  isActive: boolean;
  isFeatured: boolean;
}

// DTO para crear/actualizar recursos
export interface CreateLibraryResourceDto {
  name: string;
  description?: string;
  authors: string[];
  publishYear?: number;
  category: ResourceCategory;
  mediaType: MediaType;
  downloadable: boolean;
  tags?: string[];
  isbn?: string;
  duration?: number;
  language: string;
  isFeatured?: boolean;
}

// DTO para respuestas de API
export interface LibraryResourceResponseDto {
  success: boolean;
  data?: LibraryResource | LibraryResource[];
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
}

// Filtros para búsqueda
export interface LibrarySearchFilters {
  search?: string;
  category?: ResourceCategory;
  mediaType?: MediaType;
  authors?: string;
  publishYear?: number;
  language?: string;
  tags?: string[];
  downloadable?: boolean;
  isFeatured?: boolean;
}

// Estadísticas de biblioteca
export interface LibraryStats {
  totalResources: number;
  totalDownloads: number;
  resourcesByType: Record<MediaType, number>;
  resourcesByCategory: Record<ResourceCategory, number>;
  popularResources: LibraryResource[];
  recentUploads: LibraryResource[];
}

// Constantes
export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  pdf: 'PDF',
  video: 'Video',
  image: 'Imagen',
  audio: 'Audio',
  document: 'Documento'
};

export const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  educacion: 'Educación',
  cultura: 'Cultura',
  historia: 'Historia',
  arte: 'Arte',
  literatura: 'Literatura',
  ciencias: 'Ciencias',
  otros: 'Otros'
};

export const SUPPORTED_MEDIA_TYPES = {
  pdf: ['application/pdf'],
  video: ['video/mp4', 'video/webm', 'video/mov', 'video/avi'],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
  document: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
};

export const MAX_FILE_SIZES = {
  pdf: 50 * 1024 * 1024, // 50MB
  video: 500 * 1024 * 1024, // 500MB
  image: 20 * 1024 * 1024, // 20MB
  audio: 100 * 1024 * 1024, // 100MB
  document: 25 * 1024 * 1024 // 25MB
};