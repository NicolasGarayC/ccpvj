import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = 'Data/media/video';
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

const ALLOWED_TYPES = [
    'video/mp4',
    'video/webm',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/mkv'
];

export const POST: RequestHandler = async ({ request }) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const elementId = request.headers.get('X-Element-ID');

        if (!file) {
            return json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return json({
                error: 'Invalid file type. Only videos are allowed.'
            }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return json({
                error: 'File too large. Maximum size is 500MB.'
            }, { status: 400 });
        }

        // Ensure upload directory exists
        if (!existsSync(UPLOAD_DIR)) {
            await mkdir(UPLOAD_DIR, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const extension = path.extname(file.name);
        const baseName = elementId ? `element_${elementId}_${timestamp}` : `video_${timestamp}`;
        const filename = `${baseName}${extension}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        // Save file
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await writeFile(filepath, buffer);

        // Return relative path for database storage
        const relativePath = `video/${filename}`;

        return json({
            success: true,
            filename,
            relativePath,
            url: `/media/${relativePath}`,
            size: file.size,
            type: file.type
        });

    } catch (error) {
        console.error('Video upload error:', error);
        return json({
            error: 'Failed to upload video'
        }, { status: 500 });
    }
};