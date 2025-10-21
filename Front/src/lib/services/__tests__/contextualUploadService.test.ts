import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { contextualUploadService } from '../contextualUploadService';
import type { UploadResult } from '../contextualUploadService';

// Mock jwtService
vi.mock('$lib/services/auth/jwtService', () => ({
	jwtService: {
		getToken: vi.fn(() => 'mock-token')
	}
}));

describe('ContextualUploadService', () => {
	let mockFile: File;

	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn();

		// Create a mock file for testing
		mockFile = new File(['test content'], 'test-file.jpg', { type: 'image/jpeg' });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('uploadCourseImage', () => {
		it('should upload course image successfully', async () => {
			const mockResult: UploadResult = {
				success: true,
				filename: 'test-file.jpg',
				relativePath: 'content/material-apoyo/course-123/test-file.jpg',
				url: '/media/content/material-apoyo/course-123/test-file.jpg',
				size: 1024,
				type: 'image/jpeg',
				context: 'material-apoyo',
				contentId: 'course-123'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResult,
				headers: new Headers({ 'content-type': 'application/json' })
			});

			const result = await contextualUploadService.uploadCourseImage({
				courseId: 'course-123',
				file: mockFile
			});

			expect(result).toEqual(mockResult);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/upload/material-apoyo/course-123'),
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						Authorization: 'Bearer mock-token'
					})
				})
			);
		});

		it('should upload course image with old image path', async () => {
			const mockResult: UploadResult = {
				success: true,
				filename: 'new-file.jpg',
				relativePath: 'content/material-apoyo/course-123/new-file.jpg',
				url: '/media/content/material-apoyo/course-123/new-file.jpg',
				size: 2048,
				type: 'image/jpeg',
				context: 'material-apoyo',
				contentId: 'course-123'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResult,
				headers: new Headers({ 'content-type': 'application/json' })
			});

			const result = await contextualUploadService.uploadCourseImage({
				courseId: 'course-123',
				file: mockFile,
				oldImagePath: 'content/material-apoyo/course-123/old-file.jpg'
			});

			expect(result.success).toBe(true);
			expect(global.fetch).toHaveBeenCalled();
		});

		it('should handle non-JSON response', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				text: async () => 'Upload successful',
				headers: new Headers({ 'content-type': 'text/plain' })
			});

			const result = await contextualUploadService.uploadCourseImage({
				courseId: 'course-123',
				file: mockFile
			});

			expect(result.success).toBe(true);
			expect(result.filename).toBe('test-file.jpg');
		});

		it('should throw error on upload failure', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				statusText: 'Bad Request',
				json: async () => ({ error: 'File too large' }),
				headers: new Headers({ 'content-type': 'application/json' })
			});

			await expect(
				contextualUploadService.uploadCourseImage({
					courseId: 'course-123',
					file: mockFile
				})
			).rejects.toThrow('File too large');
		});
	});

	describe('uploadPostMedia', () => {
		it('should upload post media successfully', async () => {
			const mockResult: UploadResult = {
				success: true,
				filename: 'video.mp4',
				relativePath: 'content/material-apoyo/course-1/modules/mod-1/posts/post-1/videos/video.mp4',
				url: '/media/content/material-apoyo/course-1/modules/mod-1/posts/post-1/videos/video.mp4',
				size: 5242880,
				type: 'video/mp4',
				context: 'material-apoyo',
				contentId: 'post-1'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResult,
				headers: new Headers({ 'content-type': 'application/json' })
			});

			const videoFile = new File(['video content'], 'video.mp4', { type: 'video/mp4' });

			const result = await contextualUploadService.uploadPostMedia({
				postId: 'post-1',
				courseId: 'course-1',
				moduleId: 'mod-1',
				file: videoFile,
				mediaType: 'video'
			});

			expect(result).toEqual(mockResult);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/upload/posts/post-1'),
				expect.any(Object)
			);
		});

		it('should upload different media types', async () => {
			const mockResult: UploadResult = {
				success: true,
				filename: 'audio.mp3',
				relativePath: 'content/material-apoyo/course-1/modules/mod-1/posts/post-1/audio/audio.mp3',
				url: '/media/audio.mp3',
				size: 1048576,
				type: 'audio/mp3',
				context: 'material-apoyo',
				contentId: 'post-1'
			};

			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => mockResult,
				headers: new Headers({ 'content-type': 'application/json' })
			});

			const audioFile = new File(['audio'], 'audio.mp3', { type: 'audio/mp3' });

			await contextualUploadService.uploadPostMedia({
				postId: 'post-1',
				courseId: 'course-1',
				moduleId: 'mod-1',
				file: audioFile,
				mediaType: 'audio'
			});

			expect(global.fetch).toHaveBeenCalled();
		});

		it('should throw error on upload failure', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				statusText: 'Unauthorized',
				json: async () => ({ error: 'Not authorized' }),
				headers: new Headers({ 'content-type': 'application/json' })
			});

			await expect(
				contextualUploadService.uploadPostMedia({
					postId: 'post-1',
					courseId: 'course-1',
					moduleId: 'mod-1',
					file: mockFile,
					mediaType: 'image'
				})
			).rejects.toThrow();
		});
	});

	describe('uploadBlogMedia', () => {
		it('should upload blog media successfully', async () => {
			const mockResult: UploadResult = {
				success: true,
				filename: 'blog-image.png',
				relativePath: 'content/blog/posts/blog-123/images/blog-image.png',
				url: '/media/content/blog/posts/blog-123/images/blog-image.png',
				size: 204800,
				type: 'image/png',
				context: 'blog',
				contentId: 'blog-123'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResult,
				headers: new Headers({ 'content-type': 'application/json' })
			});

			const result = await contextualUploadService.uploadBlogMedia({
				blogPostId: 'blog-123',
				file: mockFile,
				mediaType: 'image'
			});

			expect(result).toEqual(mockResult);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/upload/blog/blog-123'),
				expect.any(Object)
			);
		});

		it('should upload blog media with old file path', async () => {
			const mockResult: UploadResult = {
				success: true,
				filename: 'new-image.jpg',
				relativePath: 'content/blog/posts/blog-123/images/new-image.jpg',
				url: '/media/new-image.jpg',
				size: 102400,
				type: 'image/jpeg',
				context: 'blog',
				contentId: 'blog-123'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResult,
				headers: new Headers({ 'content-type': 'application/json' })
			});

			await contextualUploadService.uploadBlogMedia({
				blogPostId: 'blog-123',
				file: mockFile,
				mediaType: 'image',
				oldFilePath: 'content/blog/posts/blog-123/images/old-image.jpg'
			});

			expect(global.fetch).toHaveBeenCalled();
		});
	});

	describe('getMediaUrl', () => {
		it('should return empty string for empty path', () => {
			expect(contextualUploadService.getMediaUrl('')).toBe('');
		});

		it('should return absolute URL as-is', () => {
			const url = 'http://example.com/image.jpg';
			expect(contextualUploadService.getMediaUrl(url)).toBe(url);
		});

		it('should return path starting with /media/ as-is', () => {
			const path = '/media/images/test.jpg';
			expect(contextualUploadService.getMediaUrl(path)).toBe(path);
		});

		it('should prepend /media/ to relative path', () => {
			const relativePath = 'content/blog/image.jpg';
			expect(contextualUploadService.getMediaUrl(relativePath)).toBe('/media/content/blog/image.jpg');
		});
	});

	describe('validateFile', () => {
		it('should validate image file type correctly', () => {
			const imageFile = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
			const result = contextualUploadService.validateFile(imageFile, 'image');

			expect(result.isValid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it('should validate video file type correctly', () => {
			const videoFile = new File(['video'], 'test.mp4', { type: 'video/mp4' });
			const result = contextualUploadService.validateFile(videoFile, 'video');

			expect(result.isValid).toBe(true);
		});

		it('should validate audio file type correctly', () => {
			const audioFile = new File(['audio'], 'test.mp3', { type: 'audio/mp3' });
			const result = contextualUploadService.validateFile(audioFile, 'audio');

			expect(result.isValid).toBe(true);
		});

		it('should validate document file type correctly', () => {
			const pdfFile = new File(['pdf'], 'test.pdf', { type: 'application/pdf' });
			const result = contextualUploadService.validateFile(pdfFile, 'document');

			expect(result.isValid).toBe(true);
		});

		it('should reject invalid file type', () => {
			const invalidFile = new File(['text'], 'test.txt', { type: 'text/plain' });
			const result = contextualUploadService.validateFile(invalidFile, 'image');

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('Tipo de archivo no válido');
		});

		it('should reject file exceeding size limit for images', () => {
			// Create file larger than 20MB
			const largeFile = new File([new ArrayBuffer(21 * 1024 * 1024)], 'large.jpg', {
				type: 'image/jpeg'
			});

			const result = contextualUploadService.validateFile(largeFile, 'image');

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('Archivo demasiado grande');
		});

		it('should accept file within size limit', () => {
			const smallFile = new File([new ArrayBuffer(1024)], 'small.jpg', {
				type: 'image/jpeg'
			});

			const result = contextualUploadService.validateFile(smallFile, 'image');

			expect(result.isValid).toBe(true);
		});

		it('should validate different image formats', () => {
			const formats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

			formats.forEach(format => {
				const file = new File(['img'], `test.${format.split('/')[1]}`, { type: format });
				const result = contextualUploadService.validateFile(file, 'image');
				expect(result.isValid).toBe(true);
			});
		});
	});

	describe('formatFileSize', () => {
		it('should format 0 bytes', () => {
			expect(contextualUploadService.formatFileSize(0)).toBe('0 Bytes');
		});

		it('should format bytes', () => {
			expect(contextualUploadService.formatFileSize(500)).toBe('500 Bytes');
		});

		it('should format kilobytes', () => {
			expect(contextualUploadService.formatFileSize(1024)).toBe('1 KB');
			expect(contextualUploadService.formatFileSize(2048)).toBe('2 KB');
		});

		it('should format megabytes', () => {
			expect(contextualUploadService.formatFileSize(1024 * 1024)).toBe('1 MB');
			expect(contextualUploadService.formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
		});

		it('should format gigabytes', () => {
			expect(contextualUploadService.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
			expect(contextualUploadService.formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
		});

		it('should round to 2 decimal places', () => {
			expect(contextualUploadService.formatFileSize(1536)).toBe('1.5 KB');
			expect(contextualUploadService.formatFileSize(1234567)).toBe('1.18 MB');
		});
	});

	describe('parseContextFromPath', () => {
		it('should parse material-apoyo path', () => {
			const path = 'content/material-apoyo/course-123/banner.jpg';
			const result = contextualUploadService.parseContextFromPath(path);

			expect(result.contentType).toBe('material-apoyo');
			expect(result.courseId).toBe('course-123');
		});

		it('should parse material-apoyo post path with all IDs', () => {
			const path = 'content/material-apoyo/course-123/modules/mod-456/posts/post-789/images/img.jpg';
			const result = contextualUploadService.parseContextFromPath(path);

			expect(result.contentType).toBe('material-apoyo');
			expect(result.courseId).toBe('course-123');
			expect(result.moduleId).toBe('mod-456');
			expect(result.postId).toBe('post-789');
			expect(result.mediaType).toBe('images');
		});

		it('should parse blog post path', () => {
			const path = 'content/blog/posts/blog-post-123/images/header.jpg';
			const result = contextualUploadService.parseContextFromPath(path);

			expect(result.contentType).toBe('blog');
			expect(result.postId).toBe('blog-post-123');
			expect(result.mediaType).toBe('images');
		});

		it('should parse library resource path', () => {
			const path = 'content/library/resources/resource-456/documents/file.pdf';
			const result = contextualUploadService.parseContextFromPath(path);

			expect(result.contentType).toBe('library');
			expect(result.resourceId).toBe('resource-456');
			expect(result.mediaType).toBe('documents');
		});

		it('should parse events path', () => {
			const path = 'content/events/event-789/images/poster.jpg';
			const result = contextualUploadService.parseContextFromPath(path);

			expect(result.contentType).toBe('events');
			expect(result.eventId).toBe('event-789');
			expect(result.mediaType).toBe('images');
		});

		it('should parse user-content path', () => {
			const path = 'user-content/uploads/user-123/profile.jpg';
			const result = contextualUploadService.parseContextFromPath(path);

			expect(result.contentType).toBe('user-content');
			expect(result.userId).toBe('user-123');
		});

		it('should return empty object for invalid path', () => {
			const path = 'invalid/path/structure';
			const result = contextualUploadService.parseContextFromPath(path);

			expect(result).toEqual({});
		});

		it('should handle path without media type', () => {
			const path = 'content/material-apoyo/course-123';
			const result = contextualUploadService.parseContextFromPath(path);

			expect(result.contentType).toBe('material-apoyo');
			expect(result.courseId).toBe('course-123');
			expect(result.mediaType).toBeUndefined();
		});
	});

	describe('cleanupOrphanFiles', () => {
		it('should cleanup orphan files successfully', async () => {
			const mockResponse = {
				success: true,
				deletedCount: 3,
				errors: []
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			const files = ['file1.jpg', 'file2.png', 'file3.pdf'];
			const result = await contextualUploadService.cleanupOrphanFiles(files);

			expect(result.success).toBe(true);
			expect(result.deletedCount).toBe(3);
			expect(global.fetch).toHaveBeenCalledWith(
				'/api/upload/cleanup',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({ files })
				})
			);
		});

		it('should handle empty files array', async () => {
			const result = await contextualUploadService.cleanupOrphanFiles([]);

			expect(result.success).toBe(true);
			expect(result.deletedCount).toBe(0);
			expect(global.fetch).not.toHaveBeenCalled();
		});

		it('should handle cleanup errors', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				statusText: 'Internal Server Error'
			});

			const result = await contextualUploadService.cleanupOrphanFiles(['file.jpg']);

			expect(result.success).toBe(false);
			expect(result.deletedCount).toBe(0);
			expect(result.errors).toBeDefined();
		});

		it('should handle partial cleanup with errors', async () => {
			const mockResponse = {
				deletedCount: 2,
				errors: ['Failed to delete file3.jpg']
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			const result = await contextualUploadService.cleanupOrphanFiles([
				'file1.jpg',
				'file2.jpg',
				'file3.jpg'
			]);

			expect(result.success).toBe(true);
			expect(result.deletedCount).toBe(2);
			expect(result.errors).toHaveLength(1);
		});
	});

	describe('Edge Cases', () => {
		it('should handle network errors', async () => {
			(global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

			await expect(
				contextualUploadService.uploadCourseImage({
					courseId: 'course-123',
					file: mockFile
				})
			).rejects.toThrow('Network error');
		});

		it('should handle very large file names', () => {
			const longName = 'a'.repeat(500) + '.jpg';
			const file = new File(['content'], longName, { type: 'image/jpeg' });

			const result = contextualUploadService.validateFile(file, 'image');
			expect(result.isValid).toBe(true);
		});

		it('should handle special characters in file names', () => {
			const specialFile = new File(['content'], 'файл-名前-🎉.jpg', {
				type: 'image/jpeg'
			});

			const result = contextualUploadService.validateFile(specialFile, 'image');
			expect(result.isValid).toBe(true);
		});
	});
});
