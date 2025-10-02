import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';

const BASE_UPLOAD_DIR = 'Data/media/content/blog';

// File type and size limits by media type
const MEDIA_CONFIG = {
    image: {
        types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'image/bmp', 'image/tiff'],
        maxSize: 20 * 1024 * 1024, // 20MB
        folder: 'images'
    },
    video: {
        types: ['video/mp4', 'video/webm', 'video/avi', 'video/mov'],
        maxSize: 500 * 1024 * 1024, // 500MB
        folder: 'videos'
    },
    audio: {
        types: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
        maxSize: 100 * 1024 * 1024, // 100MB
        folder: 'audio'
    }
};

async function cleanupOldFile(filePath: string): Promise<void> {
    try {
        if (existsSync(filePath)) {
            unlinkSync(filePath);
            console.log(`🗑️ Deleted old file: ${filePath}`);
        }
    } catch (error) {
        console.error(`⚠️ Failed to delete old file ${filePath}:`, error);
    }
}

export const POST: RequestHandler = async ({ request, params }) => {
    try {
        const { blogPostId } = params;

        if (!blogPostId) {
            return json({ error: 'Blog Post ID is required' }, { status: 400 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const mediaType = formData.get('mediaType') as string;
        const oldFilePath = formData.get('oldFilePath') as string;

        if (!file) {
            return json({ error: 'No file provided' }, { status: 400 });
        }

        if (!mediaType || !MEDIA_CONFIG[mediaType as keyof typeof MEDIA_CONFIG]) {
            return json({ error: 'Invalid media type. Must be: image, video, or audio' }, { status: 400 });
        }

        const config = MEDIA_CONFIG[mediaType as keyof typeof MEDIA_CONFIG];

        // Validate file type
        if (!config.types.includes(file.type)) {
            return json({
                error: `Invalid file type for ${mediaType}. Allowed types: ${config.types.join(', ')}`
            }, { status: 400 });
        }

        // Validate file size
        if (file.size > config.maxSize) {
            const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
            return json({
                error: `File too large. Maximum size for ${mediaType} is ${maxSizeMB}MB.`
            }, { status: 400 });
        }

        // Create contextual directory structure: blog/posts/{blogPostId}/{mediaType}/
        const contextDir = path.join(BASE_UPLOAD_DIR, 'posts', blogPostId, config.folder);
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
            const oldFileFullPath = path.join('Data/media', oldFilePath);
            await cleanupOldFile(oldFileFullPath);
        }

        // Save new file
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await writeFile(filepath, buffer);

        // Return contextual path for database storage
        const relativePath = `content/blog/posts/${blogPostId}/${config.folder}/${filename}`;

        console.log(`✅ Blog ${mediaType} uploaded: ${relativePath}`);

        return json({
            success: true,
            filename,
            relativePath,
            url: `/media/${relativePath}`,
            size: file.size,
            type: file.type,
            mediaType,
            context: 'blog',
            contentId: blogPostId
        });

    } catch (error) {
        console.error('Blog media upload error:', error);
        return json({
            error: 'Failed to upload blog media'
        }, { status: 500 });
    }
};
