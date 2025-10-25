import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import ContextualMediaUploader from '../ContextualMediaUploader.svelte';
import { contextualUploadService } from '$lib/application/services/upload/ContextualUploadService';
import type { UploadResult } from '$lib/application/services/upload/ContextualUploadService';

vi.mock('$lib/application/services/upload/ContextualUploadService', () => ({
	contextualUploadService: {
		validateFile: vi.fn(),
		uploadCourseImage: vi.fn(),
		uploadPostMedia: vi.fn(),
		uploadBlogMedia: vi.fn(),
		getMediaUrl: vi.fn((path: string) => `/media/${path}`),
		formatFileSize: vi.fn((bytes: number) => `${(bytes / 1024).toFixed(1)} KB`)
	}
}));

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

const mockUploadResult: UploadResult = {
	success: true,
	filename: 'test.jpg',
	relativePath: '/uploads/test.jpg',
	url: '/media/test.jpg',
	size: 102400,
	type: 'image/jpeg',
	context: 'course',
	contentId: 'course-1'
};

describe('ContextualMediaUploader', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	vi.mocked(contextualUploadService.validateFile).mockReturnValue({
		isValid: true
	});
	});

	describe('Rendering', () => {
		it('should render with default props', () => {
			render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1' }
			});
			expect(screen.getByText(/Imagen del Material de Apoyo/)).toBeInTheDocument();
		});

		it('should show custom label when provided', () => {
			render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', label: 'Custom Label' }
			});
			expect(screen.getByText('Custom Label')).toBeInTheDocument();
		});

		it('should show required asterisk when required is true', () => {
			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', required: true }
			});
			expect(container.querySelector('.required')).toBeInTheDocument();
		});

		it('should not show required asterisk when required is false', () => {
			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', required: false }
			});
			expect(container.querySelector('.required')).not.toBeInTheDocument();
		});
	});

	describe('Default Labels', () => {
		it('should show default label for course image', () => {
			render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', mediaType: 'image' }
			});
			expect(screen.getByText('Imagen del Material de Apoyo')).toBeInTheDocument();
		});

		it('should show default label for blog image', () => {
			render(ContextualMediaUploader, {
				props: { context: 'blog', blogPostId: 'blog-1', mediaType: 'image' }
			});
			expect(screen.getByText('Imagen del artículo')).toBeInTheDocument();
		});

		it('should show default label for blog video', () => {
			render(ContextualMediaUploader, {
				props: { context: 'blog', blogPostId: 'blog-1', mediaType: 'video' }
			});
			expect(screen.getByText('Video del artículo')).toBeInTheDocument();
		});

		it('should show default label for blog audio', () => {
			render(ContextualMediaUploader, {
				props: { context: 'blog', blogPostId: 'blog-1', mediaType: 'audio' }
			});
			expect(screen.getByText('Audio del artículo')).toBeInTheDocument();
		});

		it('should show default label for blog document', () => {
			render(ContextualMediaUploader, {
				props: { context: 'blog', blogPostId: 'blog-1', mediaType: 'document' }
			});
			expect(screen.getByText('Documento del artículo')).toBeInTheDocument();
		});

		it('should show default label for post context', () => {
			render(ContextualMediaUploader, {
				props: { context: 'post', contentId: 'course-1', moduleId: 'mod-1', mediaType: 'image' }
			});
			expect(screen.getByText('Imagen')).toBeInTheDocument();
		});
	});

	describe('Legacy Props Support', () => {
		it('should support materialApoyoId legacy prop', () => {
			render(ContextualMediaUploader, {
				props: { context: 'course', materialApoyoId: 'course-1' }
			});
			expect(screen.getByText(/Material de Apoyo/)).toBeInTheDocument();
		});

		it('should support courseId legacy prop', () => {
			render(ContextualMediaUploader, {
				props: { context: 'course', courseId: 'course-1' }
			});
			expect(screen.getByText(/Material de Apoyo/)).toBeInTheDocument();
		});

		it('should prioritize contentId over legacy props', () => {
			render(ContextualMediaUploader, {
				props: {
					context: 'course',
					contentId: 'new-id',
					materialApoyoId: 'old-id',
					courseId: 'older-id'
				}
			});
			expect(screen.getByText(/Material de Apoyo/)).toBeInTheDocument();
		});
	});

	describe('Upload Prompt', () => {
		it('should show upload prompt when no media', () => {
			render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1' }
			});
			expect(screen.getByText(/Haz clic para seleccionar/)).toBeInTheDocument();
		});

		it('should show max size info for images', () => {
			render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', mediaType: 'image' }
			});
			expect(screen.getByText(/Máximo 20MB/)).toBeInTheDocument();
		});

		it('should show max size info for videos', () => {
			render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', mediaType: 'video' }
			});
			expect(screen.getByText(/Máximo 20GB/)).toBeInTheDocument();
		});

		it('should show max size info for audio', () => {
			render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', mediaType: 'audio' }
			});
			expect(screen.getByText(/Máximo 100MB/)).toBeInTheDocument();
		});

		it('should show max size info for documents', () => {
			render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', mediaType: 'document' }
			});
			expect(screen.getByText(/Máximo 1GB/)).toBeInTheDocument();
		});

		it('should show disabled message when disabled', () => {
			render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', disabled: true }
			});
			expect(
				screen.getByText('Guarda el post primero para habilitar la carga de archivos')
			).toBeInTheDocument();
		});
	});

	describe('File Input', () => {
		it('should have correct accept attribute for images', () => {
			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', mediaType: 'image' }
			});
			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			expect(fileInput.accept).toBe('image/*');
		});

		it('should have correct accept attribute for videos', () => {
			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', mediaType: 'video' }
			});
			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			expect(fileInput.accept).toBe('video/*');
		});

		it('should disable file input when disabled prop is true', () => {
			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', disabled: true }
			});
			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			expect(fileInput.disabled).toBe(true);
		});
	});

	describe('Context Validation', () => {
		it('should show error when course context missing contentId', async () => {
			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: '' }
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(screen.getByText(/Material Apoyo ID is required/)).toBeInTheDocument();
			});
		});

		it('should show error when post context missing moduleId', async () => {
			const { container } = render(ContextualMediaUploader, {
				props: { context: 'post', contentId: 'course-1', moduleId: '' }
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(
					screen.getByText(/Material Apoyo ID and Module ID are required/)
				).toBeInTheDocument();
			});
		});

		it('should show error when blog context missing blogPostId', async () => {
			const { container } = render(ContextualMediaUploader, {
				props: { context: 'blog', blogPostId: '' }
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(screen.getByText(/Blog Post ID is required/)).toBeInTheDocument();
			});
		});
	});

	describe('File Validation', () => {
		it('should show error when file validation fails', async () => {
			vi.mocked(contextualUploadService.validateFile).mockReturnValue({
				isValid: false,
				error: 'File too large'
			});

			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1' }
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(screen.getByText('File too large')).toBeInTheDocument();
			});
		});

		it('should trigger onUploadError when validation fails', async () => {
			vi.mocked(contextualUploadService.validateFile).mockReturnValue({
				isValid: false,
				error: 'Invalid file'
			});

			const errorHandler = vi.fn();
			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', onUploadError: errorHandler }
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(errorHandler).toHaveBeenCalledWith('Invalid file');
			});
		});
	});

	describe('Course Image Upload', () => {
		it('should upload course image successfully', async () => {
			vi.mocked(contextualUploadService.uploadCourseImage).mockResolvedValue(mockUploadResult);

			const successHandler = vi.fn();
			const { container } = render(ContextualMediaUploader, {
				props: {
					context: 'course',
					contentId: 'course-1',
					mediaType: 'image',
					onUploadSuccess: successHandler
				}
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(contextualUploadService.uploadCourseImage).toHaveBeenCalledWith({
					courseId: 'course-1',
					file,
					oldImagePath: ''
				});
			});

			await waitFor(() => {
				expect(successHandler).toHaveBeenCalledWith(mockUploadResult);
			});
		});

		it('should trigger onUploadStart callback', async () => {
			vi.mocked(contextualUploadService.uploadCourseImage).mockResolvedValue(mockUploadResult);

			const startHandler = vi.fn();
			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', onUploadStart: startHandler }
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(startHandler).toHaveBeenCalled();
			});
		});

		it('should emit progress updates through onUploadProgress', async () => {
			vi.mocked(contextualUploadService.uploadCourseImage).mockResolvedValue(mockUploadResult);

			const progressHandler = vi.fn();
			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', onUploadProgress: progressHandler }
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(progressHandler).toHaveBeenCalledWith(
					expect.objectContaining({
						progress: expect.any(Number),
						fileName: 'test.jpg',
						mediaType: 'image',
						size: expect.any(Number)
					})
				);
			});
		});

		it('should show uploading state', async () => {
			vi.mocked(contextualUploadService.uploadCourseImage).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockUploadResult), 100))
			);

			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1' }
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(screen.getByText(/Subiendo.../)).toBeInTheDocument();
			});
		});
	});

	describe('Post Media Upload', () => {
		it('should upload post media successfully', async () => {
			vi.mocked(contextualUploadService.uploadPostMedia).mockResolvedValue(mockUploadResult);

			const successHandler = vi.fn();
			const { container } = render(ContextualMediaUploader, {
				props: {
					context: 'post',
					contentId: 'course-1',
					moduleId: 'mod-1',
					postId: 'post-1',
					mediaType: 'image',
					onUploadSuccess: successHandler
				}
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(contextualUploadService.uploadPostMedia).toHaveBeenCalledWith({
					postId: 'post-1',
					courseId: 'course-1',
					moduleId: 'mod-1',
					file,
					mediaType: 'image',
					oldFilePath: ''
				});
				expect(successHandler).toHaveBeenCalledWith(mockUploadResult);
			});
		});
	});

	describe('Blog Media Upload', () => {
		it('should upload blog media successfully', async () => {
			vi.mocked(contextualUploadService.uploadBlogMedia).mockResolvedValue(mockUploadResult);

			const successHandler = vi.fn();
			const { container } = render(ContextualMediaUploader, {
				props: {
					context: 'blog',
					blogPostId: 'blog-1',
					mediaType: 'image',
					onUploadSuccess: successHandler
				}
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(contextualUploadService.uploadBlogMedia).toHaveBeenCalledWith({
					blogPostId: 'blog-1',
					file,
					mediaType: 'image',
					oldFilePath: ''
				});
				expect(successHandler).toHaveBeenCalledWith(mockUploadResult);
			});
		});
	});

	describe('Upload Error Handling', () => {
		it('should show error message when upload fails', async () => {
			vi.mocked(contextualUploadService.uploadCourseImage).mockRejectedValue(
				new Error('Network error')
			);

			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1' }
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(screen.getByText('Network error')).toBeInTheDocument();
			});
		});

		it('should invoke onUploadError callback on failure', async () => {
			vi.mocked(contextualUploadService.uploadCourseImage).mockRejectedValue(
				new Error('Upload failed')
			);

			const errorHandler = vi.fn();
			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', onUploadError: errorHandler }
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(errorHandler).toHaveBeenCalledWith('Upload failed');
			});
		});

		it('should handle non-Error exceptions', async () => {
			vi.mocked(contextualUploadService.uploadCourseImage).mockRejectedValue('String error');

			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1' }
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(screen.getByText('Upload failed')).toBeInTheDocument();
			});
		});

		it('should revoke preview URL on error', async () => {
			vi.mocked(contextualUploadService.uploadCourseImage).mockRejectedValue(
				new Error('Upload failed')
			);

			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', mediaType: 'image' }
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(URL.revokeObjectURL).toHaveBeenCalled();
			});
		});
	});

	describe('Current Media Display', () => {
		it('should display current image', () => {
			const { container } = render(ContextualMediaUploader, {
				props: {
					context: 'course',
					contentId: 'course-1',
					currentMedia: '/uploads/current.jpg',
					mediaType: 'image'
				}
			});

			const img = container.querySelector('.preview-image') as HTMLImageElement;
			expect(img).toBeInTheDocument();
		});

		it('should display current video', () => {
			const { container } = render(ContextualMediaUploader, {
				props: {
					context: 'course',
					contentId: 'course-1',
					currentMedia: '/uploads/current.mp4',
					mediaType: 'video'
				}
			});

			const video = container.querySelector('.preview-video');
			expect(video).toBeInTheDocument();
		});

		it('should display current audio', () => {
			const { container } = render(ContextualMediaUploader, {
				props: {
					context: 'course',
					contentId: 'course-1',
					currentMedia: '/uploads/current.mp3',
					mediaType: 'audio'
				}
			});

			const audio = container.querySelector('.preview-audio');
			expect(audio).toBeInTheDocument();
		});

		it('should show remove button with current media', () => {
			render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', currentMedia: '/uploads/current.jpg' }
			});

			const removeButton = screen.getByTitle('Remover archivo');
			expect(removeButton).toBeInTheDocument();
		});

		it('should invoke onMediaRemoved when remove is clicked', async () => {
			const removeHandler = vi.fn();
			render(ContextualMediaUploader, {
				props: {
					context: 'course',
					contentId: 'course-1',
					currentMedia: '/uploads/current.jpg',
					onMediaRemoved: removeHandler
				}
			});

			const removeButton = screen.getByTitle('Remover archivo');
			await fireEvent.click(removeButton);

			expect(removeHandler).toHaveBeenCalled();
		});

		it('should show "Archivo actual" status for current media', () => {
			render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', currentMedia: '/uploads/current.jpg' }
			});

			expect(screen.getByText('Archivo actual')).toBeInTheDocument();
		});
	});

	describe('Drag and Drop', () => {
		it('should handle drag over', async () => {
			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1' }
			});

			const uploadArea = container.querySelector('.upload-area') as HTMLElement;

			await fireEvent.dragOver(uploadArea);

			expect(uploadArea.classList.contains('drag-active')).toBe(true);
		});

		it('should handle drag leave', async () => {
			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1' }
			});

			const uploadArea = container.querySelector('.upload-area') as HTMLElement;

			await fireEvent.dragOver(uploadArea);
			await fireEvent.dragLeave(uploadArea);

			expect(uploadArea.classList.contains('drag-active')).toBe(false);
		});

		it('should handle file drop', async () => {
			vi.mocked(contextualUploadService.uploadCourseImage).mockResolvedValue(mockUploadResult);

			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1' }
			});

			const uploadArea = container.querySelector('.upload-area') as HTMLElement;
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

			await fireEvent.drop(uploadArea, {
				dataTransfer: {
					files: [file]
				}
			});

			await waitFor(() => {
				expect(contextualUploadService.uploadCourseImage).toHaveBeenCalled();
			});
		});

		it('should not allow drop when disabled', async () => {
			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', disabled: true }
			});

			const uploadArea = container.querySelector('.upload-area') as HTMLElement;
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

			await fireEvent.drop(uploadArea, {
				dataTransfer: {
					files: [file]
				}
			});

			expect(contextualUploadService.uploadCourseImage).not.toHaveBeenCalled();
		});

		it('should not allow drop when uploading', async () => {
			vi.mocked(contextualUploadService.uploadCourseImage).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockUploadResult), 1000))
			);

			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1' }
			});

			const uploadArea = container.querySelector('.upload-area') as HTMLElement;
			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file1 = new File(['content'], 'test1.jpg', { type: 'image/jpeg' });

			Object.defineProperty(fileInput, 'files', {
				value: [file1],
				writable: false
			});

			await fireEvent.change(fileInput);

			// Try to drop another file while uploading
			const file2 = new File(['content'], 'test2.jpg', { type: 'image/jpeg' });
			await fireEvent.drop(uploadArea, {
				dataTransfer: {
					files: [file2]
				}
			});

			// Should only call once (from the file input change)
			expect(contextualUploadService.uploadCourseImage).toHaveBeenCalledTimes(1);
		});
	});

	describe('Edge Cases', () => {
		it('should handle file input with no file selected', async () => {
			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1' }
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			await fireEvent.change(fileInput);

			expect(contextualUploadService.uploadCourseImage).not.toHaveBeenCalled();
		});

		it('should create object URL for image preview', async () => {
			vi.mocked(contextualUploadService.uploadCourseImage).mockResolvedValue(mockUploadResult);

			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', mediaType: 'image' }
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			expect(URL.createObjectURL).toHaveBeenCalledWith(file);
		});

		it('should create object URL for video preview', async () => {
			vi.mocked(contextualUploadService.uploadCourseImage).mockResolvedValue(mockUploadResult);

			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', mediaType: 'video' }
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.mp4', { type: 'video/mp4' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			expect(URL.createObjectURL).toHaveBeenCalledWith(file);
		});

		it('should not create object URL for audio files', async () => {
			vi.mocked(contextualUploadService.uploadCourseImage).mockResolvedValue(mockUploadResult);

			const { container } = render(ContextualMediaUploader, {
				props: { context: 'course', contentId: 'course-1', mediaType: 'audio' }
			});

			vi.clearAllMocks();

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.mp3', { type: 'audio/mpeg' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			expect(URL.createObjectURL).not.toHaveBeenCalled();
		});

		it('should pass oldImagePath when replacing current media', async () => {
			vi.mocked(contextualUploadService.uploadCourseImage).mockResolvedValue(mockUploadResult);

			const { container } = render(ContextualMediaUploader, {
				props: {
					context: 'course',
					contentId: 'course-1',
					currentMedia: '/uploads/old.jpg'
				}
			});

			const uploadArea = container.querySelector('.upload-area') as HTMLElement;
			const file = new File(['content'], 'new.jpg', { type: 'image/jpeg' });

			await fireEvent.drop(uploadArea, {
				dataTransfer: {
					files: [file]
				}
			});

			await waitFor(() => {
				expect(contextualUploadService.uploadCourseImage).toHaveBeenCalledWith({
					courseId: 'course-1',
					file,
					oldImagePath: '/uploads/old.jpg'
				});
			});
		});
	});
});
