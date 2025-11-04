import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mkdir } from 'fs/promises';
import { existsSync, unlinkSync, createWriteStream } from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

// Use absolute path to Back/Data/media/content/material-apoyo
const BASE_UPLOAD_DIR = path.resolve(process.cwd(), '../Back/Data/media/content/material-apoyo');

// File type and size limits by media type
const MEDIA_CONFIG = {
    image: {
        types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'image/bmp', 'image/tiff'],
        maxSize: 1024 * 1024 * 1024, // 1GB
        folder: 'images'
    },
    video: {
        types: ['video/mp4', 'video/webm', 'video/avi', 'video/mov'],
        maxSize: 20 * 1024 * 1024 * 1024, // 20GB for movies
        folder: 'videos'
    },
    audio: {
        types: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
        maxSize: 20 * 1024 * 1024 * 1024, // 20GB
        folder: 'audio'
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
        maxSize: 1024 * 1024 * 1024, // 1GB
        folder: 'documents'
    }
};

async function cleanupOldFile(filePath: string): Promise<void> {
    try {
        if (existsSync(filePath)) {
            unlinkSync(filePath);
        }
    } catch (error) {
        console.error(`Failed to delete old file ${filePath}:`, error);
    }
}

export const POST: RequestHandler = async ({ request, params }) => {
    const startTime = Date.now();
    console.log(`\n[UPLOAD] 🚀 Upload request started at ${new Date().toISOString()}`);

    try {
        const { postId } = params;
        console.log(`[UPLOAD] 📝 Post ID: ${postId}`);

        if (!postId) {
            console.log('[UPLOAD] ❌ No Post ID provided');
            return json({ error: 'Post ID is required' }, { status: 400 });
        }

        console.log('[UPLOAD] 📦 Reading formData...');
        const formData = await request.formData();
        console.log('[UPLOAD] ✅ FormData received');

        const file = formData.get('file') as File;
        const mediaType = formData.get('mediaType') as string;
        const courseId = formData.get('courseId') as string;
        const moduleId = formData.get('moduleId') as string;
        const oldFilePath = formData.get('oldFilePath') as string;

        console.log(`[UPLOAD] 📂 File details:`, {
            name: file?.name,
            size: file?.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'unknown',
            type: file?.type,
            mediaType,
            courseId,
            moduleId
        });

        if (!file) {
            console.log('[UPLOAD] ❌ No file provided');
            return json({ error: 'No file provided' }, { status: 400 });
        }

        if (!mediaType || !MEDIA_CONFIG[mediaType as keyof typeof MEDIA_CONFIG]) {
            console.log(`[UPLOAD] ❌ Invalid media type: ${mediaType}`);
            return json({ error: 'Invalid media type. Must be: image, video, audio, or document' }, { status: 400 });
        }

        if (!courseId || !moduleId) {
            console.log('[UPLOAD] ❌ Missing courseId or moduleId');
            return json({ error: 'Course ID and Module ID are required' }, { status: 400 });
        }

        const config = MEDIA_CONFIG[mediaType as keyof typeof MEDIA_CONFIG];

        // Validate file type
        if (!config.types.includes(file.type)) {
            console.log(`[UPLOAD] ❌ Invalid file type: ${file.type} for ${mediaType}`);
            return json({
                error: `Invalid file type for ${mediaType}. Allowed types: ${config.types.join(', ')}`
            }, { status: 400 });
        }

        // Validate file size
        if (file.size > config.maxSize) {
            const maxSizeGB = config.maxSize / (1024 * 1024 * 1024);
            const maxSizeMB = config.maxSize / (1024 * 1024);
            const sizeLabel = maxSizeGB >= 1
                ? `${Math.round(maxSizeGB)}GB`
                : `${Math.round(maxSizeMB)}MB`;
            console.log(`[UPLOAD] ❌ File too large: ${file.size} bytes, max: ${config.maxSize}`);
            return json({
                error: `File too large. Maximum size for ${mediaType} is ${sizeLabel}.`
            }, { status: 400 });
        }

        console.log('[UPLOAD] ✅ Validations passed');

        // Create contextual directory structure: material-apoyo/{materialApoyoId}/modules/{moduleId}/posts/{postId}/{mediaType}/
        const contextDir = path.join(BASE_UPLOAD_DIR, courseId, 'modules', moduleId, 'posts', postId, config.folder);
        console.log(`[UPLOAD] 📁 Target directory: ${contextDir}`);

        if (!existsSync(contextDir)) {
            console.log('[UPLOAD] 🔨 Creating directory...');
            await mkdir(contextDir, { recursive: true });
            console.log('[UPLOAD] ✅ Directory created');
        } else {
            console.log('[UPLOAD] ✅ Directory already exists');
        }

        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const extension = path.extname(file.name);
        const sanitizedName = file.name.replace(extension, '').replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${sanitizedName}_${timestamp}${extension}`;
        const filepath = path.join(contextDir, filename);
        console.log(`[UPLOAD] 📄 Target file: ${filename}`);

        // Clean up old file if exists
        if (oldFilePath) {
            const oldFileFullPath = path.resolve(process.cwd(), '../Back/Data/media', oldFilePath);
            console.log(`[UPLOAD] 🗑️ Cleaning up old file: ${oldFileFullPath}`);
            await cleanupOldFile(oldFileFullPath);
        }

        // Save new file
        console.log('[UPLOAD] 💾 Starting file write with streaming...');
        const streamStartTime = Date.now();
        const readable = Readable.fromWeb(file.stream());
        const writable = createWriteStream(filepath, { flags: 'w' });

        // Track progress
        let bytesWritten = 0;
        let lastLoggedMB = 0;
        readable.on('data', (chunk) => {
            bytesWritten += chunk.length;
            const currentMB = Math.floor(bytesWritten / (1024 * 1024));
            // Log every 100MB
            if (currentMB - lastLoggedMB >= 100) {
                const progress = ((bytesWritten / file.size) * 100).toFixed(2);
                console.log(`[UPLOAD] 📊 Progress: ${progress}% (${currentMB} MB / ${(file.size / 1024 / 1024).toFixed(2)} MB)`);
                lastLoggedMB = currentMB;
            }
        });

        console.log('[UPLOAD] ⏳ Pipeline starting...');
        await pipeline(readable, writable);

        const streamEndTime = Date.now();
        const streamDuration = ((streamEndTime - streamStartTime) / 1000).toFixed(2);
        console.log(`[UPLOAD] ✅ File written successfully in ${streamDuration}s`);
        console.log(`[UPLOAD] 📊 Final size: ${(bytesWritten / 1024 / 1024).toFixed(2)} MB`);

        // Return contextual path for database storage
        const relativePath = `content/material-apoyo/${courseId}/modules/${moduleId}/posts/${postId}/${config.folder}/${filename}`;

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[UPLOAD] 🎉 Upload completed successfully in ${totalTime}s`);
        console.log(`[UPLOAD] 📍 Relative path: ${relativePath}`);

        const response = {
            success: true,
            filename,
            relativePath,
            url: `/media/${relativePath}`,
            size: file.size,
            type: file.type,
            mediaType,
            context: 'post',
            contentId: postId,
            courseId,
            moduleId
        };

        console.log(`[UPLOAD] 📤 Sending response...\n`);
        return json(response);

    } catch (error) {
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`\n[UPLOAD] ❌ Error after ${totalTime}s:`, error);
        console.error('[UPLOAD] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('[UPLOAD] Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            name: error instanceof Error ? error.name : 'Unknown',
            code: (error as any)?.code,
        });
        return json({
            error: 'Failed to upload post media',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
};
