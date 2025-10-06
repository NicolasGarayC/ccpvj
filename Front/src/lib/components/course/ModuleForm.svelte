<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { materialApoyoService } from '$lib/services/materialApoyoService';
	import type { CreateModuleDto, UpdateModuleDto, ModuleSummaryDto } from '$lib/types/api/materialApoyo.types';

	export let module: ModuleSummaryDto | null = null; // null for create, Module for edit
	export let materialApoyoId: string;
	export let loading = false;
	export let visible = false;

	const dispatch = createEventDispatcher();
	const isEditing = !!module;

	let formData = {
		title: module?.title || '',
		description: module?.description || '',
		orderNumber: module?.orderNumber || 1
	};

	let formErrors: Record<string, string> = {};
	let submitting = false;
	let existingModules: ModuleSummaryDto[] = [];

	onMount(async () => {
		if (visible) {
			await loadExistingModules();
		}
	});

	$: if (visible && !isEditing) {
		// For new modules, set next order number
		formData.orderNumber = existingModules.length + 1;
	}

	async function loadExistingModules() {
		try {
			existingModules = await materialApoyoService.getMaterialApoyoModules(materialApoyoId);
		} catch (err) {
			console.error('Error loading existing modules:', err);
		}
	}

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

		if (formData.orderNumber < 1) {
			formErrors.orderNumber = 'El orden debe ser mayor a 0';
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
					description: formData.description.trim() || undefined,
					orderNumber: formData.orderNumber
				};

				await materialApoyoService.updateModule(module.id, updateData);
				dispatch('success', { type: 'update', id: module.id, data: updateData });
			} else {
				const createData: CreateModuleDto = {
					title: formData.title.trim(),
					description: formData.description.trim() || undefined,
					orderNumber: formData.orderNumber,
					materialApoyoId: materialApoyoId
				};

				const newModule = await materialApoyoService.createModule(createData);
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
		// Reset form
		formData = {
			title: module?.title || '',
			description: module?.description || '',
			orderNumber: module?.orderNumber || existingModules.length + 1
		};
		formErrors = {};
		dispatch('cancel');
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleCancel();
		}
	}
</script>

{#if visible}
	<!-- Modal Backdrop -->
	<div
		class="modal-backdrop"
		on:click={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="module-form-title"
	>
		<div class="modal-content" on:click|stopPropagation>
			<!-- Modal Header -->
			<div class="modal-header">
				<h2 id="module-form-title" class="modal-title">
					{#if isEditing}
						<span class="icon">✏️</span>
						Editar Módulo
					{:else}
						<span class="icon">➕</span>
						Crear Nuevo Módulo
					{/if}
				</h2>
				<button
					class="close-button"
					on:click={handleCancel}
					disabled={submitting}
					aria-label="Cerrar"
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<!-- Modal Body -->
			<div class="modal-body">
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
							placeholder="Ej: Introducción a los conceptos básicos"
							maxlength="200"
							disabled={submitting || loading}
							required
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
							Descripción <span class="optional">(opcional)</span>
						</label>
						<textarea
							id="description"
							bind:value={formData.description}
							class="textarea"
							class:error={formErrors.description}
							placeholder="Describe brevemente el contenido y objetivos de este módulo"
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
							Posición en el material de apoyo <span class="required">*</span>
						</label>
						<div class="order-input-container">
							<input
								id="orderNumber"
								type="number"
								bind:value={formData.orderNumber}
								class="input order-input"
								class:error={formErrors.orderNumber}
								min="1"
								max="{existingModules.length + 1}"
								disabled={submitting || loading}
								required
							/>
							<div class="order-info">
								<span class="info-text">
									{#if isEditing}
										Posición actual: {module?.orderNumber}
									{:else}
										Siguiente posición disponible: {existingModules.length + 1}
									{/if}
								</span>
							</div>
						</div>
						{#if formErrors.orderNumber}
							<span class="error-message">{formErrors.orderNumber}</span>
						{/if}
						<div class="help-text">
							Los módulos se muestran en orden numérico. Puedes cambiar el orden más tarde.
						</div>
					</div>

					<!-- Form Actions -->
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
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 16px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem 2rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-background-alt);
	}

	.modal-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text-primary);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.icon {
		font-size: 1.75rem;
	}

	.close-button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 8px;
		color: var(--color-text-muted);
		transition: all 0.2s ease;
	}

	.close-button:hover {
		background: var(--color-background);
		color: var(--color-text-primary);
	}

	.close-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: var(--color-text-primary);
		font-size: 0.95rem;
	}

	.required {
		color: var(--color-error);
	}

	.optional {
		color: var(--color-text-muted);
		font-weight: 400;
	}

	.input,
	.textarea {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid var(--color-border);
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
		background: white;
	}

	.input:focus,
	.textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
	}

	.input.error,
	.textarea.error {
		border-color: var(--color-error);
	}

	.textarea {
		resize: vertical;
		min-height: 100px;
		font-family: inherit;
	}

	.order-input-container {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.order-input {
		max-width: 100px;
		flex-shrink: 0;
	}

	.order-info {
		flex: 1;
	}

	.info-text {
		color: var(--color-text-muted);
		font-size: 0.9rem;
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
		.modal-backdrop {
			padding: 0.5rem;
		}

		.modal-content {
			max-height: 95vh;
		}

		.modal-header {
			padding: 1rem 1.5rem;
		}

		.modal-title {
			font-size: 1.25rem;
		}

		.modal-body {
			padding: 1.5rem;
		}

		.form-actions {
			flex-direction: column-reverse;
		}

		.order-input-container {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}

		.order-input {
			max-width: none;
		}
	}
</style>