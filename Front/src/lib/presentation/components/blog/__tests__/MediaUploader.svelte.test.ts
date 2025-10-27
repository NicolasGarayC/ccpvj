import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import MediaUploader from '../MediaUploader.svelte';

global.fetch = vi.fn();

describe('MediaUploader', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Rendering', () => {
		it('should render with required props', () => {
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image'
				}
			});
			expect(screen.getByText(/Selecciona un archivo de image/i)).toBeInTheDocument();
		});

		it('should show file selection button when no preview', () => {
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image'
				}
			});
			expect(screen.getByText('Seleccionar image')).toBeInTheDocument();
		});

		it('should show format info for images', () => {
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image'
				}
			});
			expect(
				screen.getByText(/Formatos: JPG, PNG, GIF, WebP, SVG, AVIF, BMP, TIFF \(máx\. 20MB\)/i)
			).toBeInTheDocument();
		});

		it('should show format info for videos', () => {
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'video'
				}
			});
			expect(
				screen.getByText(/Formatos: MP4, WebM, MOV, AVI, MKV \(máx\. 500MB\)/i)
			).toBeInTheDocument();
		});

		it('should show format info for audio', () => {
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'audio'
				}
			});
			expect(
				screen.getByText(/Formatos: MP3, WAV, OGG, FLAC, AAC \(máx\. 100MB\)/i)
			).toBeInTheDocument();
		});

		it('should show format info for PDF', () => {
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'pdf'
				}
			});
			expect(screen.getByText(/Formato: PDF \(máx\. 50MB\)/i)).toBeInTheDocument();
		});

		it('should show format info for documents', () => {
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'document'
				}
			});
			expect(
				screen.getByText(
					/Formatos: PDF, Word \(DOC\/DOCX\), Excel \(XLS\/XLSX\), PowerPoint \(PPT\/PPTX\) \(máx\. 1GB\)/i
				)
			).toBeInTheDocument();
		});

		it('should disable inputs when disabled prop is true', () => {
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image',
					disabled: true
				}
			});
			const button = screen.getByText('Seleccionar image');
			expect(button).toBeDisabled();
		});
	});

	describe('File Input', () => {
		it('should have correct accept attribute for images', () => {
			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image'
				}
			});
			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			expect(fileInput.accept).toBe('image/*');
		});

		it('should have correct accept attribute for videos', () => {
			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'video'
				}
			});
			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			expect(fileInput.accept).toBe('video/*');
		});

		it('should have correct accept attribute for audio', () => {
			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'audio'
				}
			});
			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			expect(fileInput.accept).toBe('audio/*');
		});

		it('should have correct accept attribute for PDF', () => {
			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'pdf'
				}
			});
			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			expect(fileInput.accept).toBe('application/pdf');
		});

		it('should have correct accept attribute for documents', () => {
			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'document'
				}
			});
			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			expect(fileInput.accept).toBe('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx');
		});

		it('should trigger file input click when button is clicked', async () => {
			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image'
				}
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const clickSpy = vi.spyOn(fileInput, 'click');

			const button = screen.getByText('Seleccionar image');
			await fireEvent.click(button);

			expect(clickSpy).toHaveBeenCalled();
		});
	});

	describe('File Validation', () => {
		it('should show error for invalid image type', async () => {
			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image'
				}
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.txt', { type: 'text/plain' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(screen.getByText(/Tipo de archivo no válido para image/i)).toBeInTheDocument();
			});
		});

		it('should show error for oversized image file', async () => {
			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image'
				}
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const largeFile = new File([new ArrayBuffer(25 * 1024 * 1024)], 'large.jpg', {
				type: 'image/jpeg'
			});

			Object.defineProperty(fileInput, 'files', {
				value: [largeFile],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(screen.getByText(/Archivo muy grande \(máx\. 20MB para image\)/i)).toBeInTheDocument();
			});
		});

		it('should accept valid image file', async () => {
			vi.mocked(global.fetch).mockResolvedValue({
				ok: true,
				json: async () => ({ url: '/uploads/test.jpg' })
			} as Response);

			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image'
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
				expect(global.fetch).toHaveBeenCalled();
			});
		});

		it('should validate video file types', async () => {
			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'video'
				}
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.txt', { type: 'text/plain' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(screen.getByText(/Tipo de archivo no válido para video/i)).toBeInTheDocument();
			});
		});

		it('should validate PDF file types', async () => {
			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'pdf'
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
				expect(screen.getByText(/Tipo de archivo no válido para pdf/i)).toBeInTheDocument();
			});
		});
	});

	describe('File Upload', () => {
		it('should upload file and call onUploadComplete', async () => {
			const onUploadComplete = vi.fn();
			vi.mocked(global.fetch).mockResolvedValue({
				ok: true,
				json: async () => ({ url: '/uploads/test.jpg' })
			} as Response);

			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image',
					onUploadComplete
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
				expect(onUploadComplete).toHaveBeenCalledWith('/uploads/test.jpg');
			});
		});

		it('should use correct endpoint for course images', async () => {
			vi.mocked(global.fetch).mockResolvedValue({
				ok: true,
				json: async () => ({ url: '/uploads/course.jpg' })
			} as Response);

			const { container } = render(MediaUploader, {
				props: {
					contentType: 'course',
					contentId: 'course-123',
					mediaType: 'image'
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
				expect(global.fetch).toHaveBeenCalledWith(
					'/api/upload/course-images',
					expect.objectContaining({
						method: 'POST',
						headers: { 'X-Course-ID': 'course-123' }
					})
				);
			});
		});

		it('should use correct endpoint for documents', async () => {
			vi.mocked(global.fetch).mockResolvedValue({
				ok: true,
				json: async () => ({ url: '/uploads/doc.pdf' })
			} as Response);

			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: 'blog-123',
					mediaType: 'document'
				}
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalledWith(
					'/api/upload/documents',
					expect.objectContaining({
						method: 'POST',
						headers: { 'X-Element-ID': 'blog-123' }
					})
				);
			});
		});

		it('should use default endpoint for other media types', async () => {
			vi.mocked(global.fetch).mockResolvedValue({
				ok: true,
				json: async () => ({ url: '/uploads/video.mp4' })
			} as Response);

			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: 'blog-123',
					mediaType: 'video'
				}
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.mp4', { type: 'video/mp4' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalledWith(
					'/api/upload/videos',
					expect.objectContaining({
						method: 'POST'
					})
				);
			});
		});

		it('should show loading state during upload', async () => {
			vi.mocked(global.fetch).mockImplementation(
				() =>
					new Promise((resolve) =>
						setTimeout(() => resolve({ ok: true, json: async () => ({ url: '/uploads/test.jpg' }) } as Response), 100)
					)
			);

			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image'
				}
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

			Object.defineProperty(fileInput, 'files', {
				value: [file],
				writable: false
			});

			await fireEvent.change(fileInput);

			expect(screen.getByText(/Subiendo image\.\.\./i)).toBeInTheDocument();
		});

		it('should show error message on upload failure', async () => {
			vi.mocked(global.fetch).mockResolvedValue({
				ok: false,
				statusText: 'Internal Server Error',
				text: async () => 'Upload failed'
			} as Response);

			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image'
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
				expect(screen.getByText('Upload failed')).toBeInTheDocument();
			});
		});

		it('should handle upload exceptions', async () => {
			vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image'
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
				expect(screen.getByText('Network error')).toBeInTheDocument();
			});
		});

		it('should use relativePath if url is not present in response', async () => {
			const onUploadComplete = vi.fn();
			vi.mocked(global.fetch).mockResolvedValue({
				ok: true,
				json: async () => ({ relativePath: '/relative/test.jpg' })
			} as Response);

			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image',
					onUploadComplete
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
				expect(onUploadComplete).toHaveBeenCalledWith('/relative/test.jpg');
			});
		});
	});

	describe('Preview Display', () => {
		it('should show image preview when currentMedia is provided', () => {
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image',
					currentMedia: '/uploads/test.jpg'
				}
			});

			const img = screen.getByAltText('Preview') as HTMLImageElement;
			expect(img).toBeInTheDocument();
			expect(img.src).toContain('/uploads/test.jpg');
		});

		it('should show video preview for video files', () => {
			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'video',
					currentMedia: '/uploads/test.mp4'
				}
			});

			const video = container.querySelector('video');
			expect(video).toBeInTheDocument();
		});

		it('should show audio player for audio files', () => {
			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'audio',
					currentMedia: '/uploads/test.mp3'
				}
			});

			const audio = container.querySelector('audio');
			expect(audio).toBeInTheDocument();
		});

		it('should show PDF preview for PDF files', () => {
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'pdf',
					currentMedia: '/uploads/test.pdf'
				}
			});

			expect(screen.getByText('Documento PDF')).toBeInTheDocument();
			expect(screen.getByText('Ver documento')).toBeInTheDocument();
		});

		it('should show document preview for Word files', () => {
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'document',
					currentMedia: '/uploads/test.docx'
				}
			});

			expect(screen.getByText('Documento Word')).toBeInTheDocument();
		});

		it('should show document preview for Excel files', () => {
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'document',
					currentMedia: '/uploads/test.xlsx'
				}
			});

			expect(screen.getByText('Hoja de Excel')).toBeInTheDocument();
		});

		it('should show document preview for PowerPoint files', () => {
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'document',
					currentMedia: '/uploads/test.pptx'
				}
			});

			expect(screen.getByText('Presentación PowerPoint')).toBeInTheDocument();
		});

		it('should show change button when preview exists', () => {
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image',
					currentMedia: '/uploads/test.jpg'
				}
			});

			expect(screen.getByText(/Cambiar image/i)).toBeInTheDocument();
		});

		it('should show remove button when preview exists', () => {
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image',
					currentMedia: '/uploads/test.jpg'
				}
			});

			expect(screen.getByText('Eliminar')).toBeInTheDocument();
		});
	});

	describe('File Removal', () => {
		it('should clear preview when remove button is clicked', async () => {
			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image',
					currentMedia: '/uploads/test.jpg'
				}
			});

			const removeButton = screen.getByText('Eliminar');
			await fireEvent.click(removeButton);

			await waitFor(() => {
				expect(container.querySelector('img[alt="Preview"]')).not.toBeInTheDocument();
			});
		});

		it('should call onUploadComplete with empty string on remove', async () => {
			const onUploadComplete = vi.fn();
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image',
					currentMedia: '/uploads/test.jpg',
					onUploadComplete
				}
			});

			const removeButton = screen.getByText('Eliminar');
			await fireEvent.click(removeButton);

			await waitFor(() => {
				expect(onUploadComplete).toHaveBeenCalledWith('');
			});
		});

		it('should call onRemoveComplete callback', async () => {
			const onRemoveComplete = vi.fn();
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image',
					currentMedia: '/uploads/test.jpg',
					onRemoveComplete
				}
			});

			const removeButton = screen.getByText('Eliminar');
			await fireEvent.click(removeButton);

			await waitFor(() => {
				expect(onRemoveComplete).toHaveBeenCalled();
			});
		});

		it('should call API to remove course images', async () => {
			vi.mocked(global.fetch).mockResolvedValue({
				ok: true,
				json: async () => ({ message: 'Image removed' })
			} as Response);

			render(MediaUploader, {
				props: {
					contentType: 'course',
					contentId: 'course-123',
					mediaType: 'image',
					currentMedia: '/uploads/test.jpg'
				}
			});

			const removeButton = screen.getByText('Eliminar');
			await fireEvent.click(removeButton);

			await waitFor(() => {
				expect(global.fetch).toHaveBeenCalledWith(
					'/api/material-apoyo/course-123/remove-image',
					expect.objectContaining({
						method: 'DELETE'
					})
				);
			});
		});

		it('should show error when course image removal fails', async () => {
			vi.mocked(global.fetch).mockResolvedValue({
				ok: false,
				json: async () => ({ error: 'Failed to remove image' })
			} as Response);

			render(MediaUploader, {
				props: {
					contentType: 'course',
					contentId: 'course-123',
					mediaType: 'image',
					currentMedia: '/uploads/test.jpg'
				}
			});

			const removeButton = screen.getByText('Eliminar');
			await fireEvent.click(removeButton);

			await waitFor(() => {
				expect(screen.getByText('Failed to remove image')).toBeInTheDocument();
			});
		});

		it('should not clear UI when course image removal fails', async () => {
			vi.mocked(global.fetch).mockResolvedValue({
				ok: false,
				json: async () => ({ error: 'Failed to remove image' })
			} as Response);

			const { container } = render(MediaUploader, {
				props: {
					contentType: 'course',
					contentId: 'course-123',
					mediaType: 'image',
					currentMedia: '/uploads/test.jpg'
				}
			});

			const removeButton = screen.getByText('Eliminar');
			await fireEvent.click(removeButton);

			await waitFor(() => {
				expect(container.querySelector('img[alt="Preview"]')).toBeInTheDocument();
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle file input change with no file selected', async () => {
			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image'
				}
			});

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
			await fireEvent.change(fileInput);

			// Should not throw errors or call fetch
			expect(global.fetch).not.toHaveBeenCalled();
		});

		it('should handle missing onUploadComplete callback', async () => {
			vi.mocked(global.fetch).mockResolvedValue({
				ok: true,
				json: async () => ({ url: '/uploads/test.jpg' })
			} as Response);

			const { container } = render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image',
					onUploadComplete: null
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
				expect(global.fetch).toHaveBeenCalled();
			});
		});

		it('should handle missing onRemoveComplete callback', async () => {
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image',
					currentMedia: '/uploads/test.jpg',
					onRemoveComplete: null
				}
			});

			const removeButton = screen.getByText('Eliminar');
			await fireEvent.click(removeButton);

			// Should not throw errors
			await waitFor(() => {
				expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
			});
		});

		it('should detect file type from URL extension for images', () => {
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'video',
					currentMedia: '/uploads/actually-an-image.jpg'
				}
			});

			expect(screen.getByAltText('Preview')).toBeInTheDocument();
		});

		it('should show generic file preview for unknown types', () => {
			render(MediaUploader, {
				props: {
					contentType: 'blog',
					contentId: '123',
					mediaType: 'image',
					currentMedia: '/uploads/unknown.xyz'
				}
			});

			expect(screen.getByText('Archivo subido')).toBeInTheDocument();
		});
	});
});
