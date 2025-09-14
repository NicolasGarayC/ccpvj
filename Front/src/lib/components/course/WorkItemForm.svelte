<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { courseService, type CreateWorkItemDto, type UpdateWorkItemDto, type WorkItem } from '$lib/services/courseService';
	import MediaUploader from '../blog/MediaUploader.svelte';

	export let workItem: WorkItem | null = null; // null for create, WorkItem for edit
	export let moduleId: string;
	export let loading = false;

	const dispatch = createEventDispatcher();
	const isEditing = !!workItem;

	let formData = {
		title: workItem?.title || '',
		description: workItem?.description || '',
		longText: workItem?.longText || '',
		orderNumber: workItem?.orderNumber || 1,
		imagePath: workItem?.imagePath || '',
		videoPath: workItem?.videoPath || ''
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

		if (formData.description && formData.description.length > 500) {
			formErrors.description = 'La descripción no puede exceder 500 caracteres';
			isValid = false;
		}

		if (formData.longText && formData.longText.length > 10000) {
			formErrors.longText = 'El texto no puede exceder 10,000 caracteres';
			isValid = false;
		}

		if (formData.orderNumber < 1) {
			formErrors.orderNumber = 'El número de orden debe ser mayor a 0';
			isValid = false;
		} else if (formData.orderNumber > 999) {
			formErrors.orderNumber = 'El número de orden no puede ser mayor a 999';
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
			if (isEditing && workItem) {
				const updateData: UpdateWorkItemDto = {
					title: formData.title.trim(),
					description: formData.description.trim() || undefined,
					longText: formData.longText.trim() || undefined,
					orderNumber: formData.orderNumber,
					imagePath: formData.imagePath || undefined,
					videoPath: formData.videoPath || undefined
				};
				
				await courseService.updateWorkItem(workItem.id, updateData);
				dispatch('success', { type: 'update', id: workItem.id });
			} else {
				const createData: CreateWorkItemDto = {
					title: formData.title.trim(),
					description: formData.description.trim() || undefined,
					longText: formData.longText.trim() || undefined,
					orderNumber: formData.orderNumber,
					moduleId: moduleId,
					imagePath: formData.imagePath || undefined,
					videoPath: formData.videoPath || undefined
				};
				
				const newWorkItem = await courseService.createWorkItem(createData);
				dispatch('success', { type: 'create', workItem: newWorkItem });
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

	function handleImageUpload(event: CustomEvent<string>) {
		formData.imagePath = event.detail;
	}

	function handleImageRemove() {
		formData.imagePath = '';
	}

	function handleVideoUpload(event: CustomEvent<string>) {
		formData.videoPath = event.detail;
	}

	function handleVideoRemove() {
		formData.videoPath = '';
	}
</script>

<div class="work-item-form">
	<div class="form-header">
		<h3>{isEditing ? 'Editar Contenido' : 'Crear Nuevo Contenido'}</h3>
	</div>

	<form on:submit|preventDefault={handleSubmit}>
		<div class="form-row">
			<div class="form-group flex-2">
				<label for="title">
					Título del contenido <span class="required">*</span>
				</label>
				<input
					id="title"
					type="text"
					bind:value={formData.title}
					class="input"
					class:error={formErrors.title}
					placeholder="Ingresa el título del contenido"
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

			<div class="form-group flex-1">
				<label for="orderNumber">
					Orden <span class="required">*</span>
				</label>
				<input
					id="orderNumber"
					type="number"
					bind:value={formData.orderNumber}
					class="input"
					class:error={formErrors.orderNumber}
					min="1"
					max="999"
					disabled={submitting || loading}
				/>
				{#if formErrors.orderNumber}
					<span class="error-message">{formErrors.orderNumber}</span>
				{/if}
			</div>
		</div>

		<div class="form-group">
			<label for="description">
				Descripción breve
			</label>
			<textarea
				id="description"
				bind:value={formData.description}
				class="textarea short"
				class:error={formErrors.description}
				placeholder="Descripción opcional del contenido"
				rows="3"
				maxlength="500"
				disabled={submitting || loading}
			></textarea>
			{#if formErrors.description}
				<span class="error-message">{formErrors.description}</span>
			{/if}
			<div class="character-count">
				{formData.description.length}/500 caracteres
			</div>
		</div>

		<div class="form-group">
			<label for="longText">
				Contenido del texto
			</label>
			<textarea
				id="longText"
				bind:value={formData.longText}
				class="textarea long"
				class:error={formErrors.longText}
				placeholder="Contenido principal del trabajo (texto largo, instrucciones, etc.)"
				rows="8"
				maxlength="10000"
				disabled={submitting || loading}
			></textarea>
			{#if formErrors.longText}
				<span class="error-message">{formErrors.longText}</span>
			{/if}
			<div class="character-count">
				{formData.longText.length}/10,000 caracteres
			</div>
		</div>

		<div class="media-section">
			<h4>Archivos Multimedia</h4>
			
			<div class="media-row">
				<div class="media-group">
					<label>Imagen</label>
					<MediaUploader
						contentType="workitem"
						contentId={workItem?.id}
						mediaType="images"
						currentPath={formData.imagePath}
						on:upload={handleImageUpload}
						on:remove={handleImageRemove}
						disabled={submitting || loading}
					/>
				</div>

				<div class="media-group">
					<label>Video</label>
					<MediaUploader
						contentType="workitem"
						contentId={workItem?.id}
						mediaType="videos"
						currentPath={formData.videoPath}
						on:upload={handleVideoUpload}
						on:remove={handleVideoRemove}
						disabled={submitting || loading}
					/>
				</div>
			</div>
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
					{isEditing ? 'Actualizar Contenido' : 'Crear Contenido'}
				{/if}
			</button>
		</div>
	</form>
</div>

<style>
	.work-item-form {
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		max-width: 800px;
		margin: 0 auto;
	}

	.form-header {
		padding: 1.5rem 2rem 0;
		border-bottom: 1px solid var(--color-border);
		margin-bottom: 1.5rem;
	}

	.form-header h3 {
		margin: 0 0 1.5rem 0;
		color: var(--color-text-primary);
		font-size: 1.25rem;
		font-weight: 600;
	}

	form {
		padding: 0 2rem 2rem;
	}

	.form-row {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.flex-1 {
		flex: 1;
	}

	.flex-2 {
		flex: 2;
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
	.textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		font-size: 1rem;
		font-family: inherit;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.input:focus,
	.textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
	}

	.input.error,
	.textarea.error {
		border-color: var(--color-error);
	}

	.textarea {
		resize: vertical;
	}

	.textarea.short {
		min-height: 80px;
	}

	.textarea.long {
		min-height: 200px;
	}

	.character-count {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		text-align: right;
		margin-top: 0.25rem;
	}

	.error-message {
		display: block;
		color: var(--color-error);
		font-size: 0.85rem;
		margin-top: 0.25rem;
	}

	.media-section {
		background: var(--color-background-alt);
		padding: 1.5rem;
		border-radius: 6px;
		margin-bottom: 2rem;
	}

	.media-section h4 {
		margin: 0 0 1.5rem 0;
		color: var(--color-text-primary);
		font-size: 1rem;
		font-weight: 600;
	}

	.media-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	.media-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.media-group label {
		margin-bottom: 0;
		font-size: 0.9rem;
		font-weight: 500;
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
		.work-item-form {
			margin: 1rem;
		}

		.form-header {
			padding: 1.25rem 1.5rem 0;
		}

		form {
			padding: 0 1.5rem 1.5rem;
		}

		.form-row {
			flex-direction: column;
		}

		.media-row {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.form-actions {
			flex-direction: column-reverse;
		}
	}
</style>