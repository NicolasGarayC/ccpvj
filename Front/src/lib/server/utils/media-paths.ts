import path from 'path';
import { env } from '$env/dynamic/private';

/**
 * Get the base media directory
 * Can be configured via MEDIA_DIR environment variable
 *
 * Development default: <project-root>/Back/Data/media
 * Production: Set MEDIA_DIR=/var/www/centro-cultural/Back/Data/media
 */
export function getMediaDir(): string {
    if (env.MEDIA_DIR) {
        return path.resolve(env.MEDIA_DIR);
    }

    // Default: navigate from Front/ directory to Back/Data/media
    return path.resolve(process.cwd(), '../Back/Data/media');
}

/**
 * Get the full path for a media file
 * @param relativePath - Relative path from media root (e.g., "image/file.jpg")
 */
export function getMediaPath(relativePath: string): string {
    const mediaDir = getMediaDir();
    return path.join(mediaDir, relativePath);
}

/**
 * Get the media URL for a file
 * @param relativePath - Relative path from media root (e.g., "image/file.jpg")
 */
export function getMediaUrl(relativePath: string): string {
    return `/media/${relativePath}`;
}
