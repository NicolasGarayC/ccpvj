import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';
// Use process.cwd() to get current working directory, then navigate to Back/Data/media
const BASE_UPLOAD_DIR = path.resolve(process.cwd(), '../Back/Data/media');

// File type and size limits by media type
const MEDIA_CONFIG = {
    image: {
        types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'image/bmp', 'image/tiff'],
        maxSize: 20 * 1024 * 1024, // 20MB
        folder: 'images'
    },
    video: {
        types: ['video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/mkv'],
        maxSize: 500 * 1024 * 1024, // 500MB
        folder: 'videos'
    },
    audio: {
        types: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/flac'],
        maxSize: 100 * 1024 * 1024, // 100MB
        folder: 'audio'
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
            'text/csv'
        ],
        maxSize: 50 * 1024 * 1024, // 50MB
        folder: 'documents'
    }
};

async function cleanupOldFile(filePath: string): Promise<void> {
    try {
        if (existsSync(filePath)) {
            unlinkSync(filePath);
            console.log(`🗑️ Deleted old library file: ${filePath}`);
        }
    } catch (error) {
        console.error(`⚠️ Failed to delete old library file ${filePath}:`, error);
    }
}

function getFileTypeFromMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
}

export const POST: RequestHandler = async ({ request, params }) => {
    try {
        const { itemId } = params;

        if (!itemId) {
            return json({ error: 'Item ID is required' }, { status: 400 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const category = formData.get('category') as string || 'general';
        const oldFilePath = formData.get('oldFilePath') as string;

        if (!file) {
            return json({ error: 'No file provided' }, { status: 400 });
        }

        // Determine file type from MIME type
        const fileType = getFileTypeFromMimeType(file.type);
        const config = MEDIA_CONFIG[fileType as keyof typeof MEDIA_CONFIG];

        if (!config) {
            return json({
                error: 'Unsupported file type'
            }, { status: 400 });
        }

        // Validate file type
        if (!config.types.includes(file.type)) {
            return json({
                error: `Invalid file type for ${fileType}. Allowed types: ${config.types.join(', ')}`
            }, { status: 400 });
        }

        // Validate file size
        if (file.size > config.maxSize) {
            const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
            return json({
                error: `File too large. Maximum size for ${fileType} is ${maxSizeMB}MB.`
            }, { status: 400 });
        }

        // Create directory structure: {category}/{fileType}/
        const contextDir = path.join(BASE_UPLOAD_DIR, category, config.folder);
        if (!existsSync(contextDir)) {
            await mkdir(contextDir, { recursive: true });
        }

        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const extension = path.extname(file.name);
        const sanitizedName = file.name.replace(extension, '').replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${sanitizedName}_${timestamp}${extension}`;
        const filepath = path.join(contextDir, filename);

        // Clean up old file if exists
        if (oldFilePath) {
            const oldFileFullPath = path.join(BASE_UPLOAD_DIR, oldFilePath);
            await cleanupOldFile(oldFileFullPath);
        }

        // Save new file
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await writeFile(filepath, buffer);

        // Return simplified path for database storage (compatible with old format)
        const relativePath = `${category}/${config.folder}/${filename}`;

        console.log(`✅ Library ${fileType} uploaded: ${relativePath}`);

        return json({
            success: true,
            filename,
            relativePath,
            url: `/media/${relativePath}`,
            size: file.size,
            type: file.type,
            fileType,
            category,
            context: 'library',
            contentId: itemId
        });

    } catch (error) {
        console.error('Library media upload error:', error);
        return json({
            error: 'Failed to upload library media'
        }, { status: 500 });
    }
};