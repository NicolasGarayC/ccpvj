/**
 * Utility functions for media URLs with tracking support
 */

export type ResourceType = 'library_item' | 'blog_media' | 'material_apoyo_media' | 'modulo_media';

/**
 * Generate a media URL with optional download tracking
 * @param mediaPath The relative path to the media file (e.g., "library/documents/file.pdf")
 * @param options Optional tracking parameters
 * @returns The full media URL with tracking parameters if provided
 */
export function getMediaUrl(
    mediaPath: string,
    options?: {
        resourceId?: string;
        resourceType?: ResourceType;
        enableTracking?: boolean;
    }
): string {
    if (!mediaPath) return '';

    // Ensure path doesn't start with slash
    const cleanPath = mediaPath.startsWith('/') ? mediaPath.substring(1) : mediaPath;

    // Base URL
    let url = `/media/${cleanPath}`;

    // Add tracking parameters if provided
    if (options?.enableTracking && options?.resourceId && options?.resourceType) {
        const params = new URLSearchParams({
            track: 'true',
            resourceId: options.resourceId,
            resourceType: options.resourceType
        });
        url += `?${params.toString()}`;
    }

    return url;
}

/**
 * Generate a tracked download URL for library items
 * @param itemId Library item ID
 * @param filePath File path relative to media directory
 * @returns Media URL with tracking enabled
 */
export function getLibraryDownloadUrl(itemId: string, filePath: string): string {
    return getMediaUrl(filePath, {
        resourceId: itemId,
        resourceType: 'library_item',
        enableTracking: true
    });
}

/**
 * Generate a tracked media URL for blog posts
 * @param blogPostId Blog post ID
 * @param filePath File path relative to media directory
 * @returns Media URL with tracking enabled
 */
export function getBlogMediaUrl(blogPostId: string, filePath: string): string {
    return getMediaUrl(filePath, {
        resourceId: blogPostId,
        resourceType: 'blog_media',
        enableTracking: true
    });
}

/**
 * Generate a tracked media URL for material de apoyo
 * @param materialId Material de apoyo ID
 * @param filePath File path relative to media directory
 * @returns Media URL with tracking enabled
 */
export function getMaterialApoyoMediaUrl(materialId: string, filePath: string): string {
    return getMediaUrl(filePath, {
        resourceId: materialId,
        resourceType: 'material_apoyo_media',
        enableTracking: true
    });
}

/**
 * Generate a tracked media URL for modulos
 * @param moduloId Modulo ID
 * @param filePath File path relative to media directory
 * @returns Media URL with tracking enabled
 */
export function getModuloMediaUrl(moduloId: string, filePath: string): string {
    return getMediaUrl(filePath, {
        resourceId: moduloId,
        resourceType: 'modulo_media',
        enableTracking: true
    });
}

/**
 * Generate an untracked media URL (for inline images, thumbnails, etc.)
 * @param filePath File path relative to media directory
 * @returns Simple media URL without tracking
 */
export function getUntrackedMediaUrl(filePath: string): string {
    return getMediaUrl(filePath);
}
