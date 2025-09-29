<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { contextualUploadService } from '$lib/services/contextualUploadService';
	import type { UploadResult } from '$lib/services/contextualUploadService';

	export let context: 'course' | 'post';
	export let mediaType: 'image' | 'video' | 'audio' = 'image';
	export let courseId: string;
	export let moduleId: string = '';
	export let postId: string = '';
	export let currentMedia: string = '';
	export let disabled: boolean = false;
	export let label: string = '';
	export let required: boolean = false;

	const dispatch = createEventDispatcher<{
		uploadSuccess: UploadResult;
		uploadError: string;
		mediaRemoved: void;
	}>();

	let isUploading = false;
	let uploadProgress = 0;
	let error = '';
	let dragActive = false;
	let previewUrl = '';

	// Generate display label if not provided
	$: displayLabel = label || getDefaultLabel(context, mediaType);
	$: hasCurrentMedia = !!currentMedia;
	$: mediaUrl = currentMedia ? contextualUploadService.getMediaUrl(currentMedia) : '';

	function getDefaultLabel(ctx: string, type: string): string {
		if (ctx === 'course') {
			return 'Imagen del curso';
		} else {
			const typeMap = {
				image: 'Imagen',
				video: 'Video',
				audio: 'Audio'
			};
			return typeMap[type] || 'Archivo multimedia';
		}
	}

	function validateContext(): boolean {
		if (context === 'course' && !courseId) {
			error = 'Course ID is required for course uploads';
			return false;
		}

		if (context === 'post' && (!courseId || !moduleId || !postId)) {
			error = 'Course ID, Module ID, and Post ID are required for post uploads';
			return false;
		}

		return true;
	}

	async function handleFileSelect(file: File) {
		if (!validateContext()) return;

		// Validate file
		const validation = contextualUploadService.validateFile(file, mediaType);
		if (!validation.isValid) {
			error = validation.error || 'Invalid file';
			dispatch('uploadError', error);
			return;
		}

		error = '';
		isUploading = true;
		uploadProgress = 0;

		try {
			// Create preview for images
			if (mediaType === 'image') {
				previewUrl = URL.createObjectURL(file);
			}

			let result: UploadResult;

			if (context === 'course') {
				result = await contextualUploadService.uploadCourseImage({
					courseId,
					file,
					oldImagePath: currentMedia
				});
			} else {
				result = await contextualUploadService.uploadPostMedia({
					postId,
					courseId,
					moduleId,
					file,
					mediaType,
					oldFilePath: currentMedia
				});
			}

			uploadProgress = 100;
			dispatch('uploadSuccess', result);

		} catch (err) {
			error = err instanceof Error ? err.message : 'Upload failed';
			dispatch('uploadError', error);

			// Clean up preview URL on error
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
				previewUrl = '';
			}
		} finally {
			isUploading = false;
			uploadProgress = 0;
		}
	}

	function handleFileInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			handleFileSelect(file);
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragActive = false;

		if (disabled || isUploading) return;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			handleFileSelect(files[0]);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (!disabled && !isUploading) {
			dragActive = true;
		}
	}

	function handleDragLeave() {
		dragActive = false;
	}

	function removeMedia() {
		previewUrl = '';
		error = '';
		dispatch('mediaRemoved');
	}

	function formatFileSize(bytes: number): string {
		return contextualUploadService.formatFileSize(bytes);
	}

	function getFileIcon(type: string): string {
		if (type === 'image') return '🖼️';
		if (type === 'video') return '🎥';
		if (type === 'audio') return '🎵';
		return '📁';
	}

	function getMaxSizeInfo(type: string): string {
		const sizes = {
			image: '20MB',
			video: '500MB',
			audio: '100MB'
		};
		return sizes[type] || '20MB';
	}
</script>

<div class="contextual-uploader">
	<label class="uploader-label">
		{displayLabel}
		{#if required}<span class="required">*</span>{/if}
	</label>

	<div class="upload-area"
		class:drag-active={dragActive}
		class:has-media={hasCurrentMedia || previewUrl}
		class:uploading={isUploading}
		class:disabled={disabled}
		on:drop={handleDrop}
		on:dragover={handleDragOver}
		on:dragleave={handleDragLeave}>

		{#if isUploading}
			<!-- Upload Progress -->
			<div class="upload-progress">
				<div class="progress-icon">
					{getFileIcon(mediaType)}
				</div>
				<div class="progress-info">
					<p>Subiendo {displayLabel.toLowerCase()}...</p>
					<div class="progress-bar">
						<div class="progress-fill" style="width: {uploadProgress}%"></div>
					</div>
				</div>
			</div>

		{:else if hasCurrentMedia || previewUrl}
			<!-- Media Preview -->
			<div class="media-preview">
				{#if mediaType === 'image'}
					<img src={previewUrl || mediaUrl} alt="Preview" class="preview-image" />
				{:else if mediaType === 'video'}
					<video src={previewUrl || mediaUrl} controls class="preview-video"></video>
				{:else if mediaType === 'audio'}
					<audio src={previewUrl || mediaUrl} controls class="preview-audio"></audio>
				{/if}

				<div class="media-overlay">
					<button type="button" class="btn-remove" on:click={removeMedia} title="Remover archivo">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				</div>

				<div class="media-info">
					<span class="media-type">{getFileIcon(mediaType)} {displayLabel}</span>
					{#if previewUrl}
						<span class="media-status">Nuevo archivo</span>
					{:else}
						<span class="media-status">Archivo actual</span>
					{/if}
				</div>
			</div>

		{:else}
			<!-- Upload Prompt -->
			<input
				type="file"
				accept="{mediaType}/*"
				on:change={handleFileInput}
				disabled={disabled || isUploading}
				class="file-input"
			/>

			<div class="upload-prompt">
				<div class="upload-icon">
					{getFileIcon(mediaType)}
				</div>
				<div class="upload-text">
					{#if disabled}
						<p>Guarda el post primero para habilitar la carga de archivos</p>
					{:else}
						<p>
							<span class="click-text">Haz clic para seleccionar</span>
							o arrastra un archivo aquí
						</p>
						<p class="upload-info">
							Máximo {getMaxSizeInfo(mediaType)} • Formatos soportados para {mediaType}
						</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	{#if error}
		<div class="error-message">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10"></circle>
				<line x1="15" y1="9" x2="9" y2="15"></line>
				<line x1="9" y1="9" x2="15" y2="15"></line>
			</svg>
			{error}
		</div>
	{/if}
</div>

<style>
	.contextual-uploader {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}

	.uploader-label {
		font-weight: 500;
		color: var(--color-text-primary);
		font-size: 0.9rem;
	}

	.required {
		color: var(--color-danger);
		margin-left: 0.25rem;
	}

	.upload-area {
		position: relative;
		border: 2px dashed var(--color-border);
		border-radius: 12px;
		background: var(--color-background-subtle);
		min-height: 120px;
		transition: all 0.2s ease;
		cursor: pointer;
		overflow: hidden;
	}

	.upload-area:hover:not(.disabled):not(.uploading) {
		border-color: var(--color-primary);
		background: var(--color-primary-light);
	}

	.upload-area.drag-active {
		border-color: var(--color-primary);
		background: var(--color-primary-light);
		transform: scale(1.02);
	}

	.upload-area.has-media {
		border-style: solid;
		border-color: var(--color-border);
		background: white;
		min-height: auto;
	}

	.upload-area.uploading {
		border-color: var(--color-primary);
		background: var(--color-primary-light);
		cursor: wait;
	}

	.upload-area.disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: var(--color-background-muted);
	}

	.file-input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
	}

	.file-input:disabled {
		cursor: not-allowed;
	}

	.upload-prompt {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
		height: 100%;
		gap: 1rem;
	}

	.upload-icon {
		font-size: 3rem;
		opacity: 0.6;
	}

	.upload-text p {
		margin: 0.25rem 0;
		color: var(--color-text-muted);
	}

	.click-text {
		color: var(--color-primary);
		font-weight: 500;
	}

	.upload-info {
		font-size: 0.8rem;
		opacity: 0.8;
	}

	.upload-progress {
		display: flex;
		align-items: center;
		padding: 1.5rem;
		gap: 1rem;
	}

	.progress-icon {
		font-size: 2rem;
		opacity: 0.8;
	}

	.progress-info {
		flex: 1;
	}

	.progress-info p {
		margin: 0 0 0.5rem 0;
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.progress-bar {
		width: 100%;
		height: 6px;
		background: var(--color-background-muted);
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-primary);
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	.media-preview {
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.preview-image {
		width: 100%;
		height: auto;
		max-height: 200px;
		object-fit: cover;
		border-radius: 8px;
	}

	.preview-video {
		width: 100%;
		height: auto;
		max-height: 200px;
		border-radius: 8px;
	}

	.preview-audio {
		width: 100%;
		padding: 1rem;
	}

	.media-overlay {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		z-index: 10;
	}

	.btn-remove {
		background: rgba(0, 0, 0, 0.7);
		color: white;
		border: none;
		border-radius: 50%;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.btn-remove:hover {
		background: rgba(0, 0, 0, 0.9);
	}

	.media-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--color-background-muted);
		border-top: 1px solid var(--color-border);
		font-size: 0.85rem;
	}

	.media-type {
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.media-status {
		color: var(--color-text-muted);
		font-style: italic;
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-danger);
		font-size: 0.85rem;
		font-weight: 500;
		padding: 0.5rem 0.75rem;
		background: var(--color-danger-light);
		border: 1px solid var(--color-danger);
		border-radius: 6px;
	}

	@media (max-width: 768px) {
		.upload-prompt {
			padding: 1.5rem 1rem;
		}

		.upload-icon {
			font-size: 2.5rem;
		}

		.preview-image,
		.preview-video {
			max-height: 150px;
		}
	}
</style>