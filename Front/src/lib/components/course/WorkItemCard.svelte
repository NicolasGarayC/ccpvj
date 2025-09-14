<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { WorkItem } from '$lib/services/courseService';

	export let workItem: WorkItem;
	export let showActions = false;

	const dispatch = createEventDispatcher();

	function handleView() {
		dispatch('view', workItem.id);
	}

	function handleEdit() {
		dispatch('edit', workItem.id);
	}

	function handleDelete() {
		if (confirm(`¿Estás seguro de que deseas eliminar el contenido "${workItem.title}"?`)) {
			dispatch('delete', workItem.id);
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="work-item-card" class:inactive={!workItem.isActive}>
	<div class="work-item-content">
		<div class="work-item-header">
			<div class="order-number">
				<span>#{workItem.orderNumber}</span>
			</div>
			
			<div class="work-item-info">
				<h5 class="work-item-title">{workItem.title}</h5>
				{#if workItem.description}
					<p class="work-item-description">{workItem.description}</p>
				{/if}
			</div>

			<div class="work-item-meta">
				<div class="media-indicators">
					{#if workItem.imagePath}
						<span class="media-indicator" title="Contiene imagen">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
								<circle cx="8.5" cy="8.5" r="1.5"></circle>
								<polyline points="21,15 16,10 5,21"></polyline>
							</svg>
						</span>
					{/if}
					
					{#if workItem.videoPath}
						<span class="media-indicator" title="Contiene video">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<polygon points="23,7 16,12 23,17 23,7"></polygon>
								<rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
							</svg>
						</span>
					{/if}
					
					{#if workItem.longText}
						<span class="media-indicator" title="Contiene texto largo">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
								<polyline points="14,2 14,8 20,8"></polyline>
								<line x1="16" y1="13" x2="8" y2="13"></line>
								<line x1="16" y1="17" x2="8" y2="17"></line>
								<polyline points="10,9 9,9 8,9"></polyline>
							</svg>
						</span>
					{/if}
				</div>

				<div class="created-date">
					<span>{formatDate(workItem.createdAt)}</span>
				</div>
			</div>
		</div>

		{#if !workItem.isActive}
			<div class="status-notice">
				<span class="status-badge inactive">Inactivo</span>
			</div>
		{/if}
	</div>

	<div class="work-item-actions">
		<button 
			class="btn btn-outline btn-sm"
			on:click={handleView}
			title="Ver contenido completo"
		>
			Ver
		</button>
		
		{#if showActions}
			<button 
				class="btn btn-outline btn-sm"
				on:click={handleEdit}
				title="Editar contenido"
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
					<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
				</svg>
			</button>
			
			<button 
				class="btn btn-outline btn-sm btn-danger"
				on:click={handleDelete}
				title="Eliminar contenido"
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
	.work-item-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		transition: all 0.2s ease;
		flex: 1;
	}

	.work-item-card.inactive {
		opacity: 0.6;
		background: rgba(0, 0, 0, 0.02);
	}

	.work-item-card:hover {
		background: rgba(0, 0, 0, 0.02);
	}

	.work-item-content {
		flex: 1;
		min-width: 0;
	}

	.work-item-header {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}

	.order-number {
		flex-shrink: 0;
	}

	.order-number span {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		background: var(--color-secondary-light);
		color: var(--color-secondary-dark);
		border-radius: 4px;
		font-weight: 600;
		font-size: 0.8rem;
	}

	.work-item-info {
		flex: 1;
		min-width: 0;
	}

	.work-item-title {
		margin: 0 0 0.25rem 0;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-text-primary);
		line-height: 1.4;
	}

	.work-item-description {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.work-item-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.media-indicators {
		display: flex;
		gap: 0.5rem;
	}

	.media-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		background: var(--color-background-alt);
		color: var(--color-text-muted);
		border-radius: 3px;
		transition: all 0.2s ease;
	}

	.media-indicator:hover {
		background: var(--color-primary-light);
		color: var(--color-primary-dark);
	}

	.created-date {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.status-notice {
		margin-top: 0.5rem;
	}

	.status-badge {
		display: inline-block;
		padding: 0.2rem 0.6rem;
		border-radius: 12px;
		font-size: 0.7rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.status-badge.inactive {
		background: var(--color-warning-light);
		color: var(--color-warning-dark);
	}

	.work-item-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.btn-sm {
		padding: 0.4rem 0.6rem;
		font-size: 0.8rem;
		min-width: auto;
	}

	.btn-sm svg {
		width: 12px;
		height: 12px;
	}

	@media (max-width: 768px) {
		.work-item-card {
			flex-direction: column;
			align-items: stretch;
			padding: 1rem;
			gap: 0.75rem;
		}

		.work-item-header {
			flex-wrap: wrap;
		}

		.work-item-meta {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}

		.work-item-actions {
			justify-content: center;
		}
	}

	@media (max-width: 480px) {
		.work-item-header {
			flex-direction: column;
			gap: 0.5rem;
		}

		.work-item-meta {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.work-item-actions {
			flex-direction: column;
		}

		.work-item-actions .btn {
			width: 100%;
			justify-content: center;
		}
	}
</style>