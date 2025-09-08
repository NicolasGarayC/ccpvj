<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { courseService, type CreateModuleDto, type UpdateModuleDto, type Module } from '$lib/services/course/courseService';

	export let module: Module | null = null; // null for create, Module for edit
	export let courseId: string;
	export let loading = false;

	const dispatch = createEventDispatcher();
	const isEditing = !!module;

	let formData = {
		title: module?.title || '',
		description: module?.description || '',
		orderNumber: module?.orderNumber || 1
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
		} else if (formData.description.length > 500) {
			formErrors.description = 'La descripción no puede exceder 500 caracteres';
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
			if (isEditing && module) {
				const updateData: UpdateModuleDto = {
					title: formData.title.trim(),
					description: formData.description.trim(),
					orderNumber: formData.orderNumber
				};
				
				await courseService.updateModule(module.id, updateData);
				dispatch('success', { type: 'update', id: module.id });
			} else {
				const createData: CreateModuleDto = {
					title: formData.title.trim(),
					description: formData.description.trim(),
					orderNumber: formData.orderNumber,
					courseId: courseId
				};
				
				const newModule = await courseService.createModule(createData);
				dispatch('success', { type: 'create', module: newModule });
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
</script>

<div class="module-form">
	<div class="form-header">
		<h3>{isEditing ? 'Editar Módulo' : 'Crear Nuevo Módulo'}</h3>
	</div>

	<form on:submit|preventDefault={handleSubmit}>
		<div class="form-group">
			<label for="title">
				Título del módulo <span class="required">*</span>
			</label>
			<input
				id="title"
				type="text"
				bind:value={formData.title}
				class="input"
				class:error={formErrors.title}
				placeholder="Ingresa el título del módulo"
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
				placeholder="Describe el contenido y objetivos del módulo"
				rows="4"
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
			<label for="orderNumber">
				Número de orden <span class="required">*</span>
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
			<p class="help-text">
				Define el orden en que aparecerá este módulo en el curso. Los módulos se ordenan de menor a mayor.
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
					{isEditing ? 'Actualizar Módulo' : 'Crear Módulo'}
				{/if}
			</button>
		</div>
	</form>
</div>

<style>
	.module-form {
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		max-width: 500px;
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
	.textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		font-size: 1rem;
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
		min-height: 100px;
	}

	.character-count {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		text-align: right;
		margin-top: 0.25rem;
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
		.module-form {
			margin: 1rem;
		}

		.form-header {
			padding: 1.25rem 1.5rem 0;
		}

		form {
			padding: 0 1.5rem 1.5rem;
		}

		.form-actions {
			flex-direction: column-reverse;
		}
	}
</style>