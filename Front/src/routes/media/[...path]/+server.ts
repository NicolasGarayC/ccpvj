import type { RequestHandler } from './$types';
import { existsSync, statSync, createReadStream } from 'fs';
import path from 'path';
import { error } from '@sveltejs/kit';
import { BACKEND_BASE_URL } from '$lib/config/backend';
import { getMediaDir } from '$lib/server/utils/media-paths';
import { Readable } from 'stream';

// API base URL for analytics tracking
const API_BASE_URL = BACKEND_BASE_URL;

// Media directory - configurable via MEDIA_DIR environment variable
const MEDIA_DIR = getMediaDir();

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.avi': 'video/avi',
    '.mov': 'video/quicktime',
    '.mkv': 'video/x-matroska',
    '.flv': 'video/x-flv',
    '.wmv': 'video/x-ms-wmv',
    '.mp3': 'audio/mp3',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/m4a',
    '.flac': 'audio/flac',
    '.aac': 'audio/aac',
    '.wma': 'audio/x-ms-wma',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.zip': 'application/zip'
};

/**
 * Track download analytics
 */
async function trackDownload(
    resourceId: string,
    resourceType: string,
    filePath: string,
    fileName: string,
    fileSize: number,
    ipAddress: string,
    token: string | null
): Promise<void> {
    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        await fetch(`${API_BASE_URL}/api/analytics/track-download`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                resourceId,
                resourceType,
                filePath,
                fileName,
                fileSize
            })
        });
    } catch (error) {
        // Silently fail - don't block file serving if analytics fails
        console.debug('Analytics tracking error:', error);
    }
}

export const GET: RequestHandler = async ({ params, url, request, getClientAddress }) => {
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

        // Get file stats for size
        const fileStats = statSync(normalizedPath);
        const fileName = path.basename(normalizedPath);

        // Check for tracking parameters
        const resourceId = url.searchParams.get('resourceId');
        const resourceType = url.searchParams.get('resourceType');
        const shouldTrack = url.searchParams.get('track') === 'true';

        // Track download if parameters are present
        if (shouldTrack && resourceId && resourceType) {
            const token = request.headers.get('cookie')
                ?.split(';')
                .find(c => c.trim().startsWith('token='))
                ?.split('=')[1] || null;

            const ipAddress = getClientAddress();

            // Track asynchronously without waiting
            trackDownload(
                resourceId,
                resourceType,
                decodedPath,
                fileName,
                fileStats.size,
                ipAddress,
                token
            ).catch(err => console.debug('Download tracking failed:', err));
        }

        // Determine MIME type
        const extension = path.extname(filePath).toLowerCase();
        const mimeType = MIME_TYPES[extension] || 'application/octet-stream';

        const baseHeaders: Record<string, string> = {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=31536000',
            'Accept-Ranges': 'bytes',
            'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`
        };

        const rangeHeader = request.headers.get('range');

        if (rangeHeader && rangeHeader.startsWith('bytes=')) {
            const [rangeStart, rangeEnd] = rangeHeader.replace('bytes=', '').split('-');

            let start = Number(rangeStart);
            let end = rangeEnd ? Number(rangeEnd) : fileStats.size - 1;

            if (Number.isNaN(start)) start = 0;
            if (Number.isNaN(end) || end >= fileStats.size) end = fileStats.size - 1;

            if (start > end) {
                throw error(416, 'Invalid range request');
            }

            const chunkSize = end - start + 1;
            const stream = createReadStream(normalizedPath, { start, end });
            const webStream = Readable.toWeb(stream);

            return new Response(webStream, {
                status: 206,
                headers: {
                    ...baseHeaders,
                    'Content-Length': chunkSize.toString(),
                    'Content-Range': `bytes ${start}-${end}/${fileStats.size}`
                }
            });
        }

        const stream = createReadStream(normalizedPath);
        const webStream = Readable.toWeb(stream);

        return new Response(webStream, {
            headers: {
                ...baseHeaders,
                'Content-Length': fileStats.size.toString()
            }
        });

    } catch (err: any) {
        console.error('Media serving error:', err);
        if (err.status) {
            throw err;
        }
        throw error(500, 'Internal server error');
    }
};
