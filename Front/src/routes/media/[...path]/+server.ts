import type { RequestHandler } from './$types';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { error } from '@sveltejs/kit';
// Use process.cwd() to get current working directory, then navigate to Back/Data/media
const MEDIA_DIR = path.resolve(process.cwd(), '../Back/Data/media');

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.avif': 'image/avif',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.avi': 'video/avi',
    '.mov': 'video/mov',
    '.mp3': 'audio/mp3',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/m4a',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain'
};

export const GET: RequestHandler = async ({ params }) => {
    try {
        const { path: mediaPath } = params;

        if (!mediaPath) {
            throw error(400, 'No file path provided');
        }

        // Security: prevent directory traversal
        if (mediaPath.includes('..') || mediaPath.includes('\\..')) {
            throw error(403, 'Access denied');
        }

        // Decode URI to handle special characters properly
        const decodedPath = decodeURIComponent(mediaPath);
        const filePath = path.join(MEDIA_DIR, decodedPath);
        const normalizedPath = path.resolve(filePath);

        // Check if file exists
        if (!existsSync(normalizedPath)) {
            throw error(404, 'File not found');
        }

        // Read file
        const fileBuffer = await readFile(normalizedPath);

        // Determine MIME type
        const extension = path.extname(filePath).toLowerCase();
        const mimeType = MIME_TYPES[extension] || 'application/octet-stream';

        // Set appropriate headers
        const headers: Record<string, string> = {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=31536000', // 1 year cache
        };

        // For images, add additional headers
        if (mimeType.startsWith('image/')) {
            headers['Accept-Ranges'] = 'bytes';
        }

        return new Response(fileBuffer, {
            headers
        });

    } catch (err: any) {
        console.error('Media serving error:', err);
        if (err.status) {
            throw err;
        }
        throw error(500, 'Internal server error');
    }
};