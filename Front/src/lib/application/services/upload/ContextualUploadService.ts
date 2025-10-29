import { jwtService } from '$lib/application/services/auth/JwtService.js';
import { BaseHttpService } from '$lib/infrastructure/http/BaseHttpClient';

/**
 * Contextual Upload Service for Centro Cultural Víctor Jara
 * Handles file uploads with proper contextual organization following the documentation structure
 */

export interface UploadResult {
    success: boolean;
    filename: string;
    relativePath: string;
    url: string;
    size: number;
    type: string;
    context: string;
    contentId: string;
    error?: string;
}

export interface CourseImageUploadOptions {
    courseId: string;
    file: File;
    oldImagePath?: string;
}

export interface PostMediaUploadOptions {
    postId: string;
    courseId: string;
    moduleId: string;
    file: File;
    mediaType: 'image' | 'video' | 'audio' | 'document';
    oldFilePath?: string;
}

export interface BlogMediaUploadOptions {
    blogPostId: string;
    file: File;
    mediaType: 'image' | 'video' | 'audio' | 'document';
    oldFilePath?: string;
}

class ContextualUploadService extends BaseHttpService {

    private buildAuthHeaders(): Record<string, string> {
        return { ...jwtService.getAuthHeader() };
    }

    private async parseResponse(response: Response) {
        const contentType = response.headers.get('content-type') ?? '';
        const isJson = contentType.includes('application/json');
        const payload = isJson ? await response.json() : await response.text();
        return { isJson, payload };
    }

    /**
     * Upload course banner image
     */
    async uploadCourseImage({ courseId, file, oldImagePath }: CourseImageUploadOptions): Promise<UploadResult> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (oldImagePath) {
                formData.append('oldImagePath', oldImagePath);
            }

            const response = await fetch(`${this.baseURL}/upload/material-apoyo/${courseId}`, {
                method: 'POST',
                headers: this.buildAuthHeaders(),
                body: formData,
                credentials: 'include'
            });

            const { isJson, payload } = await this.parseResponse(response);
            const result: UploadResult = isJson
                ? payload
                : {
                    success: response.ok,
                    filename: file.name,
                    relativePath: '',
                    url: '',
                    size: file.size,
                    type: file.type,
                    context: 'material-apoyo',
                    contentId: courseId
                };

            if (!response.ok) {
                const message =
                    (typeof result === 'object' && 'error' in result && (result as any).error) ||
                    (typeof payload === 'string' && payload) ||
                    'Upload failed';
                throw new Error(message);
            }

            return result;

        } catch (error) {
            console.error('Course image upload error:', error);
            throw error;
        }
    }

    /**
     * Upload post media (image, video, audio) with contextual structure
     */
    async uploadPostMedia({ postId, courseId, moduleId, file, mediaType, oldFilePath }: PostMediaUploadOptions): Promise<UploadResult> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('mediaType', mediaType);
            formData.append('courseId', courseId);
            formData.append('moduleId', moduleId);
            if (oldFilePath) {
                formData.append('oldFilePath', oldFilePath);
            }

            const response = await fetch(`${this.baseURL}/upload/posts/${postId}`, {
                method: 'POST',
                headers: this.buildAuthHeaders(),
                body: formData,
                credentials: 'include'
            });

            const { isJson, payload } = await this.parseResponse(response);
            const result = isJson ? payload : { success: response.ok };

            if (!response.ok) {
                const message =
                    (typeof result === 'object' && result?.error) ||
                    (typeof payload === 'string' && payload) ||
                    'Upload failed';
                throw new Error(message);
            }

            return result as UploadResult;

        } catch (error) {
            console.error(`Post ${mediaType} upload error:`, error);
            throw error;
        }
    }

    /**
     * Upload blog media (image, video, audio) with contextual structure
     */
    async uploadBlogMedia({ blogPostId, file, mediaType, oldFilePath }: BlogMediaUploadOptions): Promise<UploadResult> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('mediaType', mediaType);
            if (oldFilePath) {
                formData.append('oldFilePath', oldFilePath);
            }

            const response = await fetch(`${this.baseURL}/upload/blog/${blogPostId}`, {
                method: 'POST',
                headers: this.buildAuthHeaders(),
                body: formData,
                credentials: 'include'
            });

            const { isJson, payload } = await this.parseResponse(response);
            const result = isJson ? payload : { success: response.ok };

            if (!response.ok) {
                const message =
                    (typeof result === 'object' && result?.error) ||
                    (typeof payload === 'string' && payload) ||
                    'Upload failed';
                throw new Error(message);
            }

            return result as UploadResult;

        } catch (error) {
            console.error(`Blog ${mediaType} upload error:`, error);
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
     * Validate file for upload
     */
    validateFile(file: File, mediaType: 'image' | 'video' | 'audio' | 'document'): { isValid: boolean; error?: string } {
        const config = {
            image: {
                types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'image/bmp', 'image/tiff'],
                maxSize: 200 * 1024 * 1024 // 200MB
            },
            video: {
                types: ['video/mp4', 'video/webm', 'video/avi', 'video/mov'],
                maxSize: 20 * 1024 * 1024 * 1024 // 20GB for movies
            },
            audio: {
                types: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
                maxSize: 100 * 1024 * 1024 // 100MB
            },
            document: {
                types: [
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
                    'application/msword', // .doc
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                    'application/vnd.ms-excel', // .xls
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
                    'application/vnd.ms-powerpoint', // .ppt
                    'text/plain', // .txt
                    'application/rtf', // .rtf
                    'application/vnd.oasis.opendocument.text', // .odt
                    'application/vnd.oasis.opendocument.spreadsheet', // .ods
                    'application/vnd.oasis.opendocument.presentation' // .odp
                ],
                maxSize: 1024 * 1024 * 1024 // 1GB
            }
        };

        const mediaConfig = config[mediaType];

        if (!mediaConfig.types.includes(file.type)) {
            return {
                isValid: false,
                error: `Tipo de archivo no válido para ${mediaType}. Tipos permitidos: ${mediaConfig.types.join(', ')}`
            };
        }

        if (file.size > mediaConfig.maxSize) {
            const maxSizeGB = mediaConfig.maxSize / (1024 * 1024 * 1024);
            const maxSizeMB = mediaConfig.maxSize / (1024 * 1024);
            const sizeLabel = maxSizeGB >= 1
                ? `${Math.round(maxSizeGB)}GB`
                : `${Math.round(maxSizeMB)}MB`;
            return {
                isValid: false,
                error: `Archivo demasiado grande. Tamaño máximo para ${mediaType}: ${sizeLabel}`
            };
        }

        return { isValid: true };
    }

    /**
     * Get file size in human readable format
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Cleanup orphan files that were uploaded but not saved
     */
    async cleanupOrphanFiles(files: string[]): Promise<{ success: boolean; deletedCount: number; errors?: string[] }> {
        try {
            if (!files || files.length === 0) {
                return { success: true, deletedCount: 0 };
            }

            const response = await fetch('/api/upload/cleanup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ files })
            });

            if (!response.ok) {
                throw new Error(`Cleanup failed: ${response.statusText}`);
            }

            const result = await response.json();

            return {
                success: true,
                deletedCount: result.deletedCount || 0,
                errors: result.errors
            };
        } catch (error) {
            console.error('❌ Error cleaning up orphan files:', error);
            return {
                success: false,
                deletedCount: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }

    /**
     * Extract context information from file path
     */
    parseContextFromPath(relativePath: string): {
        contentType?: string;
        courseId?: string;
        moduleId?: string;
        postId?: string;
        mediaType?: string;
        resourceId?: string;
        eventId?: string;
        userId?: string;
    } {
        // Expected format: content/{contentType}/{contentId}/...
        // Examples:
        // - content/material-apoyo/{materialApoyoId}/banner.ext
        // - content/material-apoyo/{materialApoyoId}/modules/{moduleId}/posts/{postId}/{mediaType}/{filename}
        // - content/blog/posts/{postId}/{mediaType}/{filename}
        // - content/library/resources/{resourceId}/{mediaType}/{filename}
        const parts = relativePath.split('/');

        if (parts[0] === 'content' && parts.length >= 3) {
            const contentType = parts[1];
            const result: {
                contentType: string;
                courseId?: string;
                moduleId?: string;
                postId?: string;
                mediaType?: string;
                resourceId?: string;
                eventId?: string;
            } = { contentType };

            if (contentType === 'material-apoyo' || contentType === 'courses') {
                result.courseId = parts[2];

                if (parts[3] === 'modules' && parts.length >= 5) {
                    result.moduleId = parts[4];

                    if (parts[5] === 'posts' && parts.length >= 7) {
                        result.postId = parts[6];

                        if (parts.length >= 8) {
                            result.mediaType = parts[7]; // images, videos, audio
                        }
                    }
                }
            } else if (contentType === 'blog') {
                if (parts[2] === 'posts' && parts.length >= 4) {
                    result.postId = parts[3];
                    if (parts.length >= 5) {
                        result.mediaType = parts[4];
                    }
                }
            } else if (contentType === 'library') {
                if (parts[2] === 'resources' && parts.length >= 4) {
                    result.resourceId = parts[3];
                    if (parts.length >= 5) {
                        result.mediaType = parts[4];
                    }
                }
            } else if (contentType === 'events') {
                result.eventId = parts[2];
                if (parts.length >= 4) {
                    result.mediaType = parts[3];
                }
            }

            return result;
        }

        // Handle user-content paths
        if (parts[0] === 'user-content' && parts.length >= 4) {
            return {
                contentType: 'user-content',
                userId: parts[2]
            };
        }

        return {};
    }
}

export const contextualUploadService = new ContextualUploadService();
