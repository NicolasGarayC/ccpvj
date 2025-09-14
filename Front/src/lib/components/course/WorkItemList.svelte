<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { courseService, type WorkItem } from '$lib/services/courseService';
	import WorkItemCard from './WorkItemCard.svelte';

	export let moduleId: string;
	export let showActions = false;
	export let allowReorder = false;

	const dispatch = createEventDispatcher();

	let workItems: WorkItem[] = [];
	let loading = true;
	let error = '';
	let draggedWorkItem: WorkItem | null = null;

	onMount(() => {
		loadWorkItems();
	});

	async function loadWorkItems() {
		try {
			loading = true;
			error = '';
			workItems = await courseService.getModuleWorkItems(moduleId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error cargando contenidos';
			console.error('Error loading work items:', err);
		} finally {
			loading = false;
		}
	}

	function handleCreateWorkItem() {
		dispatch('createWorkItem', { moduleId });
	}

	function handleEditWorkItem(event: CustomEvent<string>) {
		dispatch('editWorkItem', event.detail);
	}

	function handleDeleteWorkItem(event: CustomEvent<string>) {
		dispatch('deleteWorkItem', event.detail);
	}

	function handleViewWorkItem(event: CustomEvent<string>) {
		dispatch('viewWorkItem', event.detail);
	}

	// Drag and drop functionality for reordering
	function handleDragStart(event: DragEvent, workItem: WorkItem) {
		if (!allowReorder) return;
		
		draggedWorkItem = workItem;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/html', '');
		}
	}

	function handleDragOver(event: DragEvent) {
		if (!allowReorder || !draggedWorkItem) return;
		
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	async function handleDrop(event: DragEvent, targetWorkItem: WorkItem) {
		if (!allowReorder || !draggedWorkItem || draggedWorkItem.id === targetWorkItem.id) {
			draggedWorkItem = null;
			return;
		}

		event.preventDefault();

		try {
			await courseService.reorderWorkItem(draggedWorkItem.id, targetWorkItem.orderNumber);
			await loadWorkItems(); // Reload to get updated order
			dispatch('workItemReordered', {
				workItemId: draggedWorkItem.id,
				newOrder: targetWorkItem.orderNumber
			});
		} catch (err) {
			console.error('Error reordering work item:', err);
			error = err instanceof Error ? err.message : 'Error reordenando contenido';
		} finally {
			draggedWorkItem = null;
		}
	}

	function handleDragEnd() {
		draggedWorkItem = null;
	}
</script>

<div class="work-item-list">
	<div class="header">
		<h4>Contenidos del Módulo</h4>
		{#if showActions}
			<button 
				class="btn btn-primary btn-sm"
				on:click={handleCreateWorkItem}
			>
				Crear Contenido
			</button>
		{/if}
	</div>

	{#if loading}
		<div class="loading">
			<div class="loading-spinner"></div>
			<p>Cargando contenidos...</p>
		</div>
	{:else if error}
		<div class="error">
			<p>{error}</p>
			<button class="btn btn-outline btn-sm" on:click={loadWorkItems}>
				Reintentar
			</button>
		</div>
	{:else if workItems.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
					<polyline points="14,2 14,8 20,8"></polyline>
					<line x1="16" y1="13" x2="8" y2="13"></line>
					<line x1="16" y1="17" x2="8" y2="17"></line>
					<polyline points="10,9 9,9 8,9"></polyline>
				</svg>
			</div>
			<h5>No hay contenidos creados</h5>
			<p>Este módulo aún no tiene contenidos. Los contenidos pueden incluir texto, imágenes y videos.</p>
			{#if showActions}
				<button 
					class="btn btn-primary btn-sm"
					on:click={handleCreateWorkItem}
				>
					Crear el primer contenido
				</button>
			{/if}
		</div>
	{:else}
		<div class="work-items-container">
			{#each workItems.sort((a, b) => a.orderNumber - b.orderNumber) as workItem (workItem.id)}
				<div 
					class="work-item-wrapper"
					class:draggable={allowReorder}
					class:dragging={draggedWorkItem?.id === workItem.id}
					draggable={allowReorder}
					on:dragstart={(e) => handleDragStart(e, workItem)}
					on:dragover={handleDragOver}
					on:drop={(e) => handleDrop(e, workItem)}
					on:dragend={handleDragEnd}
					role="listitem"
				>
					{#if allowReorder}
						<div class="drag-handle" title="Arrastra para reordenar">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<circle cx="9" cy="12" r="1"></circle>
								<circle cx="9" cy="5" r="1"></circle>
								<circle cx="9" cy="19" r="1"></circle>
								<circle cx="15" cy="12" r="1"></circle>
								<circle cx="15" cy="5" r="1"></circle>
								<circle cx="15" cy="19" r="1"></circle>
							</svg>
						</div>
					{/if}

					<WorkItemCard 
						{workItem}
						{showActions}
						on:edit={handleEditWorkItem}
						on:delete={handleDeleteWorkItem}
						on:view={handleViewWorkItem}
					/>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.work-item-list {
		background: white;
		border-radius: 6px;
		border: 1px solid var(--color-border);
		margin-top: 1rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-background-alt);
	}

	.header h4 {
		margin: 0;
		color: var(--color-text-primary);
		font-size: 1rem;
		font-weight: 600;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1.5rem;
		text-align: center;
	}

	.loading-spinner {
		width: 2rem;
		height: 2rem;
		border: 2px solid var(--color-border);
		border-top: 2px solid var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1.5rem;
		text-align: center;
		gap: 1rem;
	}

	.error p {
		color: var(--color-error);
		margin: 0;
		font-size: 0.9rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1.5rem;
		text-align: center;
		color: var(--color-text-muted);
	}

	.empty-icon {
		opacity: 0.6;
		margin-bottom: 1rem;
	}

	.empty-state h5 {
		margin: 0 0 0.75rem 0;
		color: var(--color-text-primary);
		font-size: 1rem;
		font-weight: 600;
	}

	.empty-state p {
		margin: 0 0 1.5rem 0;
		max-width: 300px;
		line-height: 1.5;
		font-size: 0.9rem;
	}

	.work-items-container {
		display: flex;
		flex-direction: column;
	}

	.work-item-wrapper {
		display: flex;
		align-items: stretch;
		border-bottom: 1px solid var(--color-border);
		transition: background-color 0.2s ease;
	}

	.work-item-wrapper:last-child {
		border-bottom: none;
	}

	.work-item-wrapper.draggable {
		cursor: move;
	}

	.work-item-wrapper.dragging {
		opacity: 0.5;
	}

	.work-item-wrapper.draggable:hover {
		background: var(--color-background-alt);
	}

	.drag-handle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		background: var(--color-background-alt);
		color: var(--color-text-muted);
		cursor: grab;
		transition: background-color 0.2s ease;
		border-right: 1px solid var(--color-border);
	}

	.drag-handle:hover {
		background: var(--color-border);
		color: var(--color-text-primary);
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	@media (max-width: 768px) {
		.header {
			padding: 0.75rem 1rem;
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}

		.header h4 {
			text-align: center;
		}

		.empty-state {
			padding: 2rem 1rem;
		}

		.drag-handle {
			width: 2rem;
		}
	}
</style>