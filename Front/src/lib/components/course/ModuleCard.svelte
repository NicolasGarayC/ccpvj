<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Module } from '$lib/services/courseService';

	export let module: Module;
	export let showActions = false;

	const dispatch = createEventDispatcher();

	function handleView() {
		dispatch('view', module.id);
	}

	function handleEdit() {
		dispatch('edit', module.id);
	}

	function handleDelete() {
		if (confirm(`¿Estás seguro de que deseas eliminar el módulo "${module.title}"?`)) {
			dispatch('delete', module.id);
		}
	}
</script>

<div class="module-card">
	<div class="module-content">
		<div class="module-header">
			<div class="module-order">
				<span class="order-number">#{module.orderNumber}</span>
			</div>
			
			<div class="module-info">
				<h4 class="module-title">{module.title}</h4>
				{#if !module.isActive}
					<span class="status-badge inactive">Inactivo</span>
				{:else}
					<span class="status-badge active">Activo</span>
				{/if}
			</div>

			<div class="module-stats">
				<span class="stat" title="Número de contenidos">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
						<polyline points="14,2 14,8 20,8"></polyline>
					</svg>
					{module.workItemCount}
				</span>
			</div>
		</div>

		{#if module.description}
			<div class="module-description">
				<p>{module.description}</p>
			</div>
		{/if}
	</div>

	<div class="module-actions">
		<button 
			class="btn btn-outline btn-sm"
			on:click={handleView}
			title="Ver contenidos del módulo"
		>
			Ver Contenidos
		</button>
		
		{#if showActions}
			<button 
				class="btn btn-outline btn-sm"
				on:click={handleEdit}
				title="Editar módulo"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
					<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
				</svg>
			</button>
			
			<button 
				class="btn btn-outline btn-sm btn-danger"
				on:click={handleDelete}
				title="Eliminar módulo"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="3,6 5,6 21,6"></polyline>
					<path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"></path>
					<line x1="10" y1="11" x2="10" y2="17"></line>
					<line x1="14" y1="11" x2="14" y2="17"></line>
				</svg>
			</button>
		{/if}
	</div>
</div>

<style>
	.module-card {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 1.5rem 2rem;
		transition: background-color 0.2s ease;
		flex: 1;
	}

	.module-card:hover {
		background: rgba(0, 0, 0, 0.02);
	}

	.module-content {
		flex: 1;
		min-width: 0;
	}

	.module-header {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.module-order {
		flex-shrink: 0;
	}

	.order-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		background: var(--color-primary-light);
		color: var(--color-primary-dark);
		border-radius: 50%;
		font-weight: 600;
		font-size: 0.85rem;
	}

	.module-info {
		flex: 1;
		min-width: 0;
	}

	.module-title {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text-primary);
		line-height: 1.4;
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.status-badge.active {
		background: var(--color-success-light);
		color: var(--color-success-dark);
	}

	.status-badge.inactive {
		background: var(--color-warning-light);
		color: var(--color-warning-dark);
	}

	.module-stats {
		flex-shrink: 0;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-text-muted);
		font-size: 0.9rem;
		font-weight: 500;
	}

	.stat svg {
		opacity: 0.7;
	}

	.module-description {
		margin-left: 3rem;
	}

	.module-description p {
		margin: 0;
		color: var(--color-text-muted);
		line-height: 1.5;
		font-size: 0.95rem;
	}

	.module-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.btn-sm {
		padding: 0.5rem 0.75rem;
		font-size: 0.85rem;
	}

	.btn-sm svg {
		width: 14px;
		height: 14px;
	}

	@media (max-width: 768px) {
		.module-card {
			flex-direction: column;
			align-items: stretch;
			padding: 1.25rem 1.5rem;
			gap: 1rem;
		}

		.module-header {
			flex-wrap: wrap;
		}

		.module-info {
			order: -1;
			flex: 100%;
		}

		.module-description {
			margin-left: 0;
		}

		.module-actions {
			justify-content: center;
			flex-wrap: wrap;
		}
	}

	@media (max-width: 480px) {
		.module-actions {
			flex-direction: column;
		}

		.module-actions .btn {
			width: 100%;
			justify-content: center;
		}
	}
</style>