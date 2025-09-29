<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { courseService, type CreateCourseDto, type UpdateCourseDto, type Course } from '$lib/services/courseService';
	import ContextualMediaUploader from '../upload/ContextualMediaUploader.svelte';
	import type { UploadResult } from '$lib/services/contextualUploadService';

	export let course: Course | null = null; // null for create, Course for edit
	export let loading = false;

	const dispatch = createEventDispatcher();
	const isEditing = !!course;

	let formData = {
		title: course?.title || '',
		description: course?.description || '',
		isFeatured: course?.isFeatured || false,
		imagePath: course?.imagePath || ''
	};

	let formErrors: Record<string, string> = {};
	let submitting = false;


	function validateForm(): boolean {
		formErrors = {};
		let isValid = true;

		if (!formData.title.trim()) {
			formErrors.title = 'El título es requerido';
			isValid = false;
		} else if (formData.title.length < 3) {
			formErrors.title = 'El título debe tener al menos 3 caracteres';
			isValid = false;
		} else if (formData.title.length > 200) {
			formErrors.title = 'El título no puede exceder 200 caracteres';
			isValid = false;
		}

		if (!formData.description.trim()) {
			formErrors.description = 'La descripción es requerida';
			isValid = false;
		} else if (formData.description.length < 10) {
			formErrors.description = 'La descripción debe tener al menos 10 caracteres';
			isValid = false;
		} else if (formData.description.length > 1000) {
			formErrors.description = 'La descripción no puede exceder 1000 caracteres';
			isValid = false;
		}


		return isValid;
	}

	async function handleSubmit() {
		if (!validateForm()) {
			return;
		}

		submitting = true;
		
		try {
			if (isEditing && course) {
				const updateData: UpdateCourseDto = {
					title: formData.title.trim(),
					description: formData.description.trim(),
					isFeatured: formData.isFeatured,
					imagePath: formData.imagePath || undefined
				};
				
				await courseService.updateCourse(course.id, updateData);
				dispatch('success', { type: 'update', id: course.id });
			} else {
				const createData: CreateCourseDto = {
					title: formData.title.trim(),
					description: formData.description.trim(),
					isFeatured: formData.isFeatured,
					imagePath: formData.imagePath || undefined
				};
				
				const newCourse = await courseService.createCourse(createData);
				dispatch('success', { type: 'create', course: newCourse });
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			dispatch('error', errorMessage);
		} finally {
			submitting = false;
		}
	}

	function handleCancel() {
		dispatch('cancel');
	}

	function handleImageUpload(event: CustomEvent<UploadResult>) {
		const result = event.detail;
		formData.imagePath = result.relativePath;

		console.log('✅ Course image uploaded:', result);

		// Auto-save when image is uploaded if editing
		if (isEditing && course) {
			autoSaveImagePath(result.relativePath);
		}
	}

	function handleImageRemove() {
		formData.imagePath = '';

		// Auto-save removal if editing
		if (isEditing && course) {
			autoSaveImagePath('');
		}
	}

	function handleUploadError(event: CustomEvent<string>) {
		const error = event.detail;
		formErrors.imagePath = error;
		console.error('Course image upload error:', error);
	}

	async function autoSaveImagePath(imagePath: string) {
		try {
			const updateData: UpdateCourseDto = {
				title: formData.title.trim(),
				description: formData.description.trim(),
				isFeatured: formData.isFeatured,
				imagePath: imagePath || undefined
			};

			await courseService.updateCourse(course!.id, updateData);
			// Optionally dispatch a silent update event
			dispatch('success', { type: 'update', id: course!.id, silent: true });
		} catch (error) {
			console.error('Error auto-saving image path:', error);
			formErrors.imagePath = 'Error guardando la imagen automáticamente';
		}
	}
</script>

<div class="course-form">
	<form on:submit|preventDefault={handleSubmit}>
		<div class="form-group">
			<label for="title">
				Título del curso <span class="required">*</span>
			</label>
			<input
				id="title"
				type="text"
				bind:value={formData.title}
				class="input"
				class:error={formErrors.title}
				placeholder="Ingresa el título del curso"
				maxlength="200"
				disabled={submitting || loading}
			/>
			{#if formErrors.title}
				<span class="error-message">{formErrors.title}</span>
			{/if}
			<div class="character-count">
				{formData.title.length}/200 caracteres
			</div>
		</div>


		<div class="form-group">
			<label for="description">
				Descripción <span class="required">*</span>
			</label>
			<textarea
				id="description"
				bind:value={formData.description}
				class="textarea"
				class:error={formErrors.description}
				placeholder="Describe el contenido y objetivos del curso"
				rows="6"
				maxlength="1000"
				disabled={submitting || loading}
			></textarea>
			{#if formErrors.description}
				<span class="error-message">{formErrors.description}</span>
			{/if}
			<div class="character-count">
				{formData.description.length}/1000 caracteres
			</div>
		</div>

		<div class="form-group">
			<ContextualMediaUploader
				context="course"
				mediaType="image"
				courseId={course?.id || 'temp'}
				currentMedia={formData.imagePath}
				disabled={submitting || loading || !isEditing}
				label="Imagen del curso"
				on:uploadSuccess={handleImageUpload}
				on:uploadError={handleUploadError}
				on:mediaRemoved={handleImageRemove}
			/>
			{#if formErrors.imagePath}
				<span class="error-message">{formErrors.imagePath}</span>
			{/if}
			{#if !isEditing}
				<p class="help-text">
					💡 Guarda el curso primero para poder subir una imagen.
				</p>
			{/if}
		</div>

		<div class="form-group">
			<label class="checkbox-label">
				<input
					type="checkbox"
					bind:checked={formData.isFeatured}
					class="checkbox"
					disabled={submitting || loading}
				/>
				Marcar como curso destacado
			</label>
			<p class="help-text">
				Los cursos destacados aparecen en la sección principal de cursos.
			</p>
		</div>

		<div class="form-actions">
			<button
				type="button"
				class="btn btn-outline"
				on:click={handleCancel}
				disabled={submitting || loading}
			>
				Cancelar
			</button>
			
			<button
				type="submit"
				class="btn btn-primary"
				disabled={submitting || loading}
			>
				{#if submitting}
					<span class="loading-spinner"></span>
					{isEditing ? 'Actualizando...' : 'Creando...'}
				{:else}
					{isEditing ? 'Actualizar Curso' : 'Crear Curso'}
				{/if}
			</button>
		</div>
	</form>
</div>

<style>
	.course-form {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		max-width: 600px;
		margin: 0 auto;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.required {
		color: var(--color-error);
	}

	.input,
	.textarea,
	.select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		font-size: 1rem;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.input:focus,
	.textarea:focus,
	.select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
	}

	.input.error,
	.textarea.error,
	.select.error {
		border-color: var(--color-error);
	}

	.textarea {
		resize: vertical;
		min-height: 120px;
	}

	.character-count {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		text-align: right;
		margin-top: 0.25rem;
	}

	.checkbox-label {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		cursor: pointer;
		margin-bottom: 0;
	}

	.checkbox {
		width: 1rem;
		height: 1rem;
		margin-top: 0.125rem;
		cursor: pointer;
	}

	.help-text {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin-top: 0.5rem;
		margin-bottom: 0;
		line-height: 1.4;
	}

	.error-message {
		display: block;
		color: var(--color-error);
		font-size: 0.85rem;
		margin-top: 0.25rem;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-border);
	}

	.loading-spinner {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-right: 0.5rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	@media (max-width: 768px) {
		.course-form {
			padding: 1.5rem;
			margin: 1rem;
		}

		.form-actions {
			flex-direction: column-reverse;
		}
	}
</style>