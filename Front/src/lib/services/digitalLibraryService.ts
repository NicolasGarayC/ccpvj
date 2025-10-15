/**
 * Digital Library Service for Centro Cultural Víctor Jara
 * Handles communication with the digital library API endpoints
 */

import { jwtService } from './auth/jwtService.js';
import { BACKEND_BASE_URL } from '$lib/config/backend';
import { getLibraryDownloadUrl } from '$lib/utils/mediaUtils.js';

export interface LibraryItemDto {
    id: string;
    title: string;
    description?: string;
    author?: string;
    createdAt: string;
    updatedAt?: string;
    uploadedBy: string;
    fileType: string;
    filePath: string;
    fileName: string;
    fileSize: number;
    mimeType?: string;
    tags: string[] | string | null;
    language?: string;
    year?: number;
    category?: string;
    subcategory?: string;
    downloadCount: number;
    viewCount: number;
    isActive: boolean;
    isFeatured: boolean;
    collections: LibraryCollectionDto[];
}

export interface LibraryCollectionDto {
    id: string;
    name: string;
    description?: string;
    colorTheme?: string;
    isActive: boolean;
    createdAt: string;
    itemCount: number;
}

export interface LibrarySearchDto {
    query?: string;
    fileType?: string;
    category?: string;
    author?: string;
    tags?: string[];
    language?: string;
    publishYear?: number;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    pageSize?: number;
}

export interface LibraryItemPagedResultDto {
    items: LibraryItemDto[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface LibraryStatsDto {
    totalItems: number;
    totalDownloads: number;
    totalViews: number;
    fileTypeDistribution: { [key: string]: number };
    itemsByCategory: { [key: string]: number };
    totalCollections: number;
}

export interface CreateLibraryItemDto {
    title: string;
    description?: string;
    author?: string;
    fileType: string;
    filePath: string;
    fileName: string;
    fileSize: number;
    mimeType?: string;
    tags: string[];
    language?: string;
    year?: number;
    category?: string;
    subcategory?: string;
    isFeatured?: boolean;
    collectionIds?: string[];
}

export interface UpdateLibraryItemDto {
    title?: string;
    description?: string;
    author?: string;
    category?: string;
    tags?: string;
    language?: string;
    year?: number;
}

export interface CreateLibraryCollectionDto {
    name: string;
    description?: string;
    colorTheme?: string;
}

export interface UpdateLibraryCollectionDto {
    name?: string;
    description?: string;
    colorTheme?: string;
}

export interface LibraryUploadResult {
    success: boolean;
    filename: string;
    relativePath: string;
    url: string;
    size: number;
    type: string;
    fileType: 'image' | 'video' | 'audio' | 'document';
    category: string;
    context: string;
    contentId: string;
    error?: string;
}

export interface LibraryUploadOptions {
    itemId: string;
    file: File;
    category?: string;
    oldFilePath?: string;
}

class DigitalLibraryService {
    private apiUrl = BACKEND_BASE_URL;

    private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
        const headers = {
            'Content-Type': 'application/json',
            ...jwtService.getAuthHeader(),
            ...options.headers
        };

        const fullUrl = url.startsWith('http') ? url : `${this.apiUrl}${url}`;
        return fetch(fullUrl, {
            ...options,
            headers,
            credentials: 'include'
        });
    }

    private buildQueryString(params: Record<string, any>): string {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, String(value));
            }
        });
        return searchParams.toString();
    }

    /**
     * Get library items with filtering and pagination
     */
    async getItems(searchDto: LibrarySearchDto = {}): Promise<LibraryItemPagedResultDto> {
        const params: Record<string, any> = {};

        if (searchDto.query) params.query = searchDto.query;
        if (searchDto.fileType) params.fileType = searchDto.fileType;
        if (searchDto.category) params.category = searchDto.category;
        if (searchDto.author) params.author = searchDto.author;
        if (searchDto.language) params.language = searchDto.language;
        if (searchDto.publishYear) params.publishYear = searchDto.publishYear;
        if (searchDto.sortBy) params.sortBy = searchDto.sortBy;
        if (searchDto.sortOrder) params.sortOrder = searchDto.sortOrder;
        if (searchDto.page) params.page = searchDto.page;
        if (searchDto.pageSize) params.pageSize = searchDto.pageSize;

        if (searchDto.tags && searchDto.tags.length > 0) {
            params.tags = searchDto.tags;
        }

        const queryString = this.buildQueryString(params);
        const url = `/api/digitallibrary/items${queryString ? `?${queryString}` : ''}`;

        const response = await this.fetchWithAuth(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch items: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get a specific library item by ID
     */
    async getItemById(id: string): Promise<LibraryItemDto> {
        const response = await this.fetchWithAuth(`/api/digitallibrary/items/${id}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch item: ${response.status}`);
        }
        return response.json();
    }

    /**
     * Create a new library item
     */
    async createItem(item: CreateLibraryItemDto): Promise<LibraryItemDto> {
        const response = await this.fetchWithAuth('/api/digitallibrary/items', {
            method: 'POST',
            body: JSON.stringify(item)
        });
        if (!response.ok) {
            throw new Error(`Failed to create item: ${response.status}`);
        }
        return response.json();
    }

    /**
     * Update a library item
     */
    async updateItem(id: string, item: UpdateLibraryItemDto): Promise<void> {
        const response = await this.fetchWithAuth(`/api/digitallibrary/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify(item)
        });
        if (!response.ok) {
            throw new Error(`Failed to update item: ${response.status}`);
        }
    }

    /**
     * Delete a library item
     */
    async deleteItem(id: string): Promise<void> {
        const response = await this.fetchWithAuth(`/api/digitallibrary/items/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(`Failed to delete item: ${response.status}`);
        }
    }

    /**
     * Get all collections
     */
    async getCollections(): Promise<LibraryCollectionDto[]> {
        const response = await this.fetchWithAuth('/api/digitallibrary/collections');
        if (!response.ok) {
            throw new Error(`Failed to fetch collections: ${response.status}`);
        }
        return response.json();
    }

    /**
     * Get library statistics
     */
    async getStats(): Promise<LibraryStatsDto> {
        const response = await this.fetchWithAuth('/api/digitallibrary/stats');
        if (!response.ok) {
            throw new Error(`Failed to fetch stats: ${response.status}`);
        }
        return response.json();
    }

    /**
     * Increment view count for an item
     */
    async incrementViewCount(id: string): Promise<void> {
        try {
            const response = await this.fetchWithAuth(`/api/digitallibrary/items/${id}/view`, {
                method: 'POST'
            });
            if (!response.ok) {
                console.warn('Failed to increment view count', response.status);
            }
        } catch (error) {
            console.warn('Failed to increment view count', error);
        }
    }

    /**
     * Increment download count for an item
     */
    async incrementDownloadCount(id: string): Promise<void> {
        try {
            const response = await this.fetchWithAuth(`/api/digitallibrary/items/${id}/download`, {
                method: 'POST'
            });
            if (!response.ok) {
                console.warn('Failed to increment download count', response.status);
            }
        } catch (error) {
            console.warn('Failed to increment download count', error);
        }
    }

    /**
     * Get available filter options
     */
    async getAvailableCategories(): Promise<string[]> {
        const response = await this.fetchWithAuth('/api/digitallibrary/filters/categories');
        if (!response.ok) {
            throw new Error(`Failed to fetch categories: ${response.status}`);
        }
        return response.json();
    }

    async getAvailableAuthors(): Promise<string[]> {
        const response = await this.fetchWithAuth('/api/digitallibrary/filters/authors');
        if (!response.ok) {
            throw new Error(`Failed to fetch authors: ${response.status}`);
        }
        return response.json();
    }

    async getAvailableTags(): Promise<string[]> {
        const response = await this.fetchWithAuth('/api/digitallibrary/filters/tags');
        if (!response.ok) {
            throw new Error(`Failed to fetch tags: ${response.status}`);
        }
        return response.json();
    }

    async getAvailableLanguages(): Promise<string[]> {
        const response = await this.fetchWithAuth('/api/digitallibrary/filters/languages');
        if (!response.ok) {
            throw new Error(`Failed to fetch languages: ${response.status}`);
        }
        return response.json();
    }

    async getAvailableYears(): Promise<number[]> {
        const response = await this.fetchWithAuth('/api/digitallibrary/filters/years');
        if (!response.ok) {
            throw new Error(`Failed to fetch years: ${response.status}`);
        }
        return response.json();
    }

    /**
     * Download a file from the library
     */
    async downloadFile(item: LibraryItemDto): Promise<void> {
        try {
            // Increment download count
            await this.incrementDownloadCount(item.id);

            // Extract clean file path (remove /media/ prefix if present)
            const cleanPath = item.filePath.startsWith('/media/')
                ? item.filePath.substring(7)
                : item.filePath;

            // Create download link with tracking
            const link = document.createElement('a');
            link.href = getLibraryDownloadUrl(item.id, cleanPath);
            link.download = item.fileName || (item.title + this.getFileExtension(item.fileType));
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed:', error);
            throw error;
        }
    }

    /**
     * Get file extension from file type
     */
    private getFileExtension(fileType: string): string {
        const extensions: { [key: string]: string } = {
            'image': '.jpg',
            'video': '.mp4',
            'audio': '.mp3',
            'document': '.pdf',
            'application/pdf': '.pdf',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
        };
        return extensions[fileType] || '';
    }

    /**
     * Get file type icon
     */
    getFileTypeIcon(fileType: string): string {
        const icons: { [key: string]: string } = {
            'image': '🖼️',
            'video': '🎥',
            'audio': '🎵',
            'document': '📄',
            'pdf': '📄',
            'word': '📝',
            'excel': '📊',
            'powerpoint': '📽️'
        };
        return icons[fileType] || '📁';
    }

    /**
     * Format file size in human readable format
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Upload file to library with contextual structure
     */
    async uploadLibraryFile({ itemId, file, category = 'general', oldFilePath }: LibraryUploadOptions): Promise<LibraryUploadResult> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', category);
            if (oldFilePath) {
                formData.append('oldFilePath', oldFilePath);
            }

            const response = await fetch(`/api/upload/library/${itemId}`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Upload failed');
            }

            return result;

        } catch (error) {
            console.error('Library file upload error:', error);
            throw error;
        }
    }

    /**
     * Get media URL from relative path
     */
    getMediaUrl(relativePath: string): string {
        if (!relativePath) return '';
        if (relativePath.startsWith('http')) return relativePath;
        if (relativePath.startsWith('/media/')) return relativePath;
        return `/media/${relativePath}`;
    }

    /**
     * Validate file for library upload
     */
    validateFile(file: File): { isValid: boolean; error?: string; fileType?: string } {
        const config = {
            image: {
                types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'image/bmp', 'image/tiff'],
                maxSize: 100 * 1024 * 1024, // 100MB para imágenes de alta calidad
                displayName: 'imagen'
            },
            video: {
                types: ['video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/mkv', 'video/flv', 'video/wmv'],
                maxSize: 5 * 1024 * 1024 * 1024, // 5GB para películas completas
                displayName: 'video'
            },
            audio: {
                types: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/flac', 'audio/aac', 'audio/wma'],
                maxSize: 500 * 1024 * 1024, // 500MB para audio de alta calidad
                displayName: 'audio'
            },
            document: {
                types: [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-powerpoint',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'text/plain',
                    'text/csv',
                    'application/zip',
                    'application/x-rar-compressed'
                ],
                maxSize: 1024 * 1024 * 1024, // 1GB para documentos y archivos
                displayName: 'documento'
            }
        };

        // Determine file type
        let fileType: string = 'document';
        let mediaConfig = config.document;

        if (file.type.startsWith('image/')) {
            fileType = 'image';
            mediaConfig = config.image;
        } else if (file.type.startsWith('video/')) {
            fileType = 'video';
            mediaConfig = config.video;
        } else if (file.type.startsWith('audio/')) {
            fileType = 'audio';
            mediaConfig = config.audio;
        }

        if (!mediaConfig.types.includes(file.type)) {
            return {
                isValid: false,
                error: `Tipo de archivo no válido para ${mediaConfig.displayName}. Tipos permitidos: ${this.getFileExtensions(mediaConfig.types).join(', ')}`
            };
        }

        if (file.size > mediaConfig.maxSize) {
            const maxSizeMB = Math.round(mediaConfig.maxSize / (1024 * 1024));
            return {
                isValid: false,
                error: `Archivo demasiado grande. Tamaño máximo para ${mediaConfig.displayName}: ${maxSizeMB}MB`
            };
        }

        return { isValid: true, fileType };
    }

    /**
     * Extract file extensions from MIME types for display
     */
    private getFileExtensions(mimeTypes: string[]): string[] {
        const extensionMap: { [key: string]: string } = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'image/svg+xml': '.svg',
            'image/avif': '.avif',
            'image/bmp': '.bmp',
            'image/tiff': '.tiff',
            'video/mp4': '.mp4',
            'video/webm': '.webm',
            'video/avi': '.avi',
            'video/mov': '.mov',
            'video/mkv': '.mkv',
            'audio/mp3': '.mp3',
            'audio/wav': '.wav',
            'audio/ogg': '.ogg',
            'audio/m4a': '.m4a',
            'audio/flac': '.flac',
            'application/pdf': '.pdf',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'application/vnd.ms-excel': '.xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
            'application/vnd.ms-powerpoint': '.ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
            'text/plain': '.txt',
            'text/csv': '.csv'
        };

        return mimeTypes.map(type => extensionMap[type] || type).filter(Boolean);
    }

    /**
     * Get file type color
     */
    getFileTypeColor(fileType: string): string {
        const colors = {
            image: '#10B981', // green
            video: '#F59E0B', // amber
            audio: '#8B5CF6', // violet
            document: '#EF4444'  // red
        };
        return colors[fileType as keyof typeof colors] || '#6B7280';
    }

    /**
     * Get available categories with full details
     */
    getAvailableCategoriesWithDetails(): Array<{id: string, name: string, description: string}> {
        return [
            { id: 'victor-jara', name: 'Víctor Jara', description: 'Música, documentos y fotografías de Víctor Jara' },
            { id: 'nueva-cancion', name: 'Nueva Canción Chilena', description: 'Música y documentos del movimiento' },
            { id: 'educacion-popular', name: 'Educación Popular', description: 'Materiales educativos y pedagógicos' },
            { id: 'memoria-historica', name: 'Memoria Histórica', description: 'Documentos históricos y testimonios' },
            { id: 'talleres-eventos', name: 'Talleres y Eventos', description: 'Material de talleres y eventos del centro' },
            { id: 'archivo-prensa', name: 'Archivo de Prensa', description: 'Recortes de prensa y artículos' },
            { id: 'audiovisual', name: 'Audiovisual', description: 'Películas, documentales y contenido audiovisual' },
            { id: 'literatura', name: 'Literatura', description: 'Libros, poemas y textos literarios' },
            { id: 'general', name: 'General', description: 'Otros recursos de la biblioteca' }
        ];
    }
}

export const digitalLibraryService = new DigitalLibraryService();
