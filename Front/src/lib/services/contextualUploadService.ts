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
    mediaType: 'image' | 'video' | 'audio';
    oldFilePath?: string;
}

export interface BlogMediaUploadOptions {
    blogPostId: string;
    file: File;
    mediaType: 'image' | 'video' | 'audio';
    oldFilePath?: string;
}

class ContextualUploadService {

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

            const response = await fetch(`/api/upload/courses/${courseId}`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Upload failed');
            }

            console.log(`✅ Course image uploaded successfully: ${result.relativePath}`);
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

            const response = await fetch(`/api/upload/posts/${postId}`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Upload failed');
            }

            console.log(`✅ Post ${mediaType} uploaded successfully: ${result.relativePath}`);
            return result;

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

            const response = await fetch(`/api/upload/blog/${blogPostId}`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Upload failed');
            }

            console.log(`✅ Blog ${mediaType} uploaded successfully: ${result.relativePath}`);
            return result;

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
    validateFile(file: File, mediaType: 'image' | 'video' | 'audio'): { isValid: boolean; error?: string } {
        const config = {
            image: {
                types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'image/bmp', 'image/tiff'],
                maxSize: 20 * 1024 * 1024 // 20MB
            },
            video: {
                types: ['video/mp4', 'video/webm', 'video/avi', 'video/mov'],
                maxSize: 500 * 1024 * 1024 // 500MB
            },
            audio: {
                types: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
                maxSize: 100 * 1024 * 1024 // 100MB
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
            const maxSizeMB = Math.round(mediaConfig.maxSize / (1024 * 1024));
            return {
                isValid: false,
                error: `Archivo demasiado grande. Tamaño máximo para ${mediaType}: ${maxSizeMB}MB`
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
     * Extract context information from file path
     */
    parseContextFromPath(relativePath: string): { contentType?: string; courseId?: string; moduleId?: string; postId?: string; mediaType?: string } {
        // Expected format: content/{contentType}/{contentId}/...
        // Examples:
        // - content/courses/{courseId}/banner.ext
        // - content/courses/{courseId}/modules/{moduleId}/posts/{postId}/{mediaType}/{filename}
        // - content/blog/posts/{postId}/{mediaType}/{filename}
        // - content/library/resources/{resourceId}/{mediaType}/{filename}
        const parts = relativePath.split('/');

        if (parts[0] === 'content' && parts.length >= 3) {
            const contentType = parts[1];
            const result: any = { contentType };

            if (contentType === 'courses') {
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