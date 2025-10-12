<script lang="ts">
	import { goto } from '$app/navigation';
	import type { MaterialApoyoDto } from '$lib/types/api/materialApoyo.types';
	import { materialApoyoService } from '$lib/services/materialApoyoService';
	import { createEventDispatcher } from 'svelte';
	import ConfirmationModal from '../common/ConfirmationModal.svelte';

	export let materialApoyo: MaterialApoyoDto;
	export let showActions = false;

	const dispatch = createEventDispatcher();

	// Modal state
	let showDeleteModal = false;
	let isDeleting = false;
	let deleteError = '';

	function handleViewMaterialApoyo() {
		goto(`/material-apoyo/${materialApoyo.id}`);
	}

	function handleEditMaterialApoyo() {
		goto(`/material-apoyo/${materialApoyo.id}/edit`);
	}

	function handleDeleteMaterialApoyo() {
		showDeleteModal = true;
		deleteError = '';
	}

	async function confirmDeleteMaterialApoyo() {
		isDeleting = true;
		deleteError = '';

		try {
			await materialApoyoService.deleteMaterialApoyo(materialApoyo.id);
			showDeleteModal = false;
			dispatch('deleted', materialApoyo.id);
		} catch (error) {
			deleteError = error instanceof Error ? error.message : 'Error eliminando el material de apoyo';
		} finally {
			isDeleting = false;
		}
	}

	function cancelDelete() {
		showDeleteModal = false;
		deleteError = '';
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Build proper image URL
	function getImageUrl(imagePath: string | undefined): string {
		if (!imagePath) return '';
		if (imagePath.startsWith('http') || imagePath.startsWith('/media/')) {
			return imagePath;
		}
		return `/media/${imagePath}`;
	}
</script>

<div class="course-card">
	{#if materialApoyo.imagePath}
		<div class="course-image">
			<img src={getImageUrl(materialApoyo.imagePath)} alt={materialApoyo.title} />
			{#if materialApoyo.isFeatured}
				<div class="featured-badge">Destacado</div>
			{/if}
		</div>
	{:else}
		<div class="course-image placeholder">
			<div class="placeholder-content">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
					<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
				</svg>
			</div>
			{#if materialApoyo.isFeatured}
				<div class="featured-badge">Destacado</div>
			{/if}
		</div>
	{/if}

	<div class="course-content">
		<div class="course-header">
			<h3 class="course-title">{materialApoyo.title}</h3>
		</div>

		<p class="course-description" title={materialApoyo.description}>
			{materialApoyo.description.length > 150
				? materialApoyo.description.substring(0, 150).trim() + '...'
				: materialApoyo.description
			}
		</p>

		<div class="course-meta">
			<div class="educator">
				<span class="label">Encargado:</span>
				<span class="value">{materialApoyo.educatorName}</span>
			</div>

			<div class="stats">
				<span class="stat">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
						<line x1="8" y1="21" x2="16" y2="21"></line>
						<line x1="12" y1="17" x2="12" y2="21"></line>
					</svg>
					{materialApoyo.moduleCount} módulos
				</span>
				<span class="stat">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
						<polyline points="14,2 14,8 20,8"></polyline>
					</svg>
					{materialApoyo.postCount} contenidos
				</span>
			</div>
		</div>

		<div class="course-date">
			<span>Creado: {formatDate(materialApoyo.createdAt)}</span>
		</div>
	</div>

	<div class="course-actions">
		<button class="btn btn-primary" on:click={handleViewMaterialApoyo}>
			Ver Material
		</button>

		{#if showActions}
			<div class="admin-actions">
				<button
					class="btn btn-outline btn-sm"
					on:click={handleEditMaterialApoyo}
				>
					Editar
				</button>
				<button
					class="btn btn-outline btn-sm btn-danger"
					on:click={handleDeleteMaterialApoyo}
				>
					Eliminar
				</button>
			</div>
		{/if}
	</div>

	{#if !materialApoyo.isActive}
		<div class="inactive-overlay">
			<span>Material Inactivo</span>
		</div>
	{/if}
</div>

<!-- Delete Confirmation Modal -->
<ConfirmationModal
	bind:isOpen={showDeleteModal}
	title="🗑️ Eliminar Material de Apoyo"
	message="¿Estás seguro de que deseas eliminar el material de apoyo '{materialApoyo.title}'? Esta acción no se puede deshacer y se eliminarán todos los módulos y contenidos asociados."
	confirmText="Sí, eliminar material"
	cancelText="Cancelar"
	type="danger"
	loading={isDeleting}
	on:confirm={confirmDeleteMaterialApoyo}
	on:cancel={cancelDelete}
/>

{#if deleteError}
	<div class="error-notification">
		<div class="error-content">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="10"></circle>
				<line x1="15" y1="9" x2="9" y2="15"></line>
				<line x1="9" y1="9" x2="15" y2="15"></line>
			</svg>
			<span>{deleteError}</span>
			<button class="error-close" on:click={() => deleteError = ''}>
				×
			</button>
		</div>
	</div>
{/if}

<style>
	.course-card {
		position: relative;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.course-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
	}

	.course-image {
		position: relative;
		width: 100%;
		height: 200px;
		overflow: hidden;
	}

	.course-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.course-image.placeholder {
		background: linear-gradient(135deg, var(--color-primary-light), var(--color-secondary-light));
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
	}

	.placeholder-content {
		opacity: 0.8;
	}

	.featured-badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: var(--color-accent);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.course-content {
		padding: 1.5rem;
		overflow: hidden;
		word-wrap: break-word;
	}

	.course-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.course-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
		flex: 1;
		line-height: 1.4;
		word-wrap: break-word;
		overflow-wrap: break-word;
		hyphens: auto;
		max-width: 100%;
	}


	.course-description {
		color: var(--color-text-muted);
		line-height: 1.5;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		word-wrap: break-word;
		overflow-wrap: break-word;
		hyphens: auto;
		max-width: 100%;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
	}

	.course-meta {
		margin-bottom: 1rem;
	}

	.educator {
		margin-bottom: 0.75rem;
		font-size: 0.9rem;
	}

	.educator .label {
		color: var(--color-text-muted);
		margin-right: 0.5rem;
	}

	.educator .value {
		color: var(--color-text-primary);
		font-weight: 500;
	}

	.stats {
		display: flex;
		gap: 1rem;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}

	.stat svg {
		opacity: 0.7;
	}

	.course-date {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		margin-bottom: 1rem;
	}

	.course-actions {
		padding: 0 1.5rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.admin-actions {
		display: flex;
		gap: 0.5rem;
	}

	.inactive-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1.1rem;
	}

	.error-notification {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 1001;
		max-width: 400px;
		animation: slideInRight 0.3s ease-out;
	}

	.error-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: var(--color-error);
		color: white;
		padding: 1rem 1.25rem;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.error-close {
		margin-left: auto;
		background: none;
		border: none;
		color: white;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		width: 1.5rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: background-color 0.2s ease;
	}

	.error-close:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.admin-actions {
		display: flex;
		gap: 0.5rem;
	}

	.admin-actions .btn {
		transition: all 0.2s ease;
	}

	.admin-actions .btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.btn-danger {
		background: var(--color-error);
		color: white;
		border-color: var(--color-error);
	}

	.btn-danger:hover {
		background: #dc2626;
		border-color: #dc2626;
	}

	@keyframes slideInRight {
		from {
			opacity: 0;
			transform: translateX(100%);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@media (max-width: 768px) {
		.course-header {
			flex-direction: column;
			align-items: stretch;
		}


		.stats {
			flex-direction: column;
			gap: 0.5rem;
		}

		.course-actions {
			flex-direction: column;
		}

		.admin-actions {
			justify-content: center;
			width: 100%;
		}

		.error-notification {
			left: 1rem;
			right: 1rem;
			top: 1rem;
			max-width: none;
		}
	}
</style>