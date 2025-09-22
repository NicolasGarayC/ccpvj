<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { courseService } from '$lib/services/courseService';
	import type { ModuleSummaryDto } from '$lib/types/api/course.types';
	import ModuleCard from './ModuleCard.svelte';

	export let courseId: string;
	export let allowReorder = false;
	export let showActions = false;

	const dispatch = createEventDispatcher();

	let modules: ModuleSummaryDto[] = [];
	let loading = true;
	let error = '';
	let draggedModule: ModuleSummaryDto | null = null;

	onMount(() => {
		loadModules();
	});

	async function loadModules() {
		try {
			loading = true;
			error = '';
			modules = await courseService.getCourseModules(courseId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error cargando módulos';
			console.error('Error loading modules:', err);
		} finally {
			loading = false;
		}
	}

	function handleCreateModule() {
		dispatch('createModule', { courseId });
	}

	function handleEditModule(event: CustomEvent<string>) {
		dispatch('editModule', event.detail);
	}

	function handleDeleteModule(event: CustomEvent<string>) {
		dispatch('deleteModule', event.detail);
	}

	function handleViewModule(event: CustomEvent<string>) {
		dispatch('viewModule', event.detail);
	}

	// Drag and drop functionality for reordering
	function handleDragStart(event: DragEvent, module: ModuleSummaryDto) {
		if (!allowReorder) return;

		draggedModule = module;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/html', '');
		}
	}

	function handleDragOver(event: DragEvent) {
		if (!allowReorder || !draggedModule) return;
		
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	async function handleDrop(event: DragEvent, targetModule: ModuleSummaryDto) {
		if (!allowReorder || !draggedModule || draggedModule.id === targetModule.id) {
			draggedModule = null;
			return;
		}

		event.preventDefault();

		try {
			await courseService.reorderModule(draggedModule.id, targetModule.orderNumber);
			await loadModules(); // Reload to get updated order
			dispatch('moduleReordered', {
				moduleId: draggedModule.id,
				newOrder: targetModule.orderNumber
			});
		} catch (err) {
			console.error('Error reordering module:', err);
			error = err instanceof Error ? err.message : 'Error reordenando módulo';
		} finally {
			draggedModule = null;
		}
	}

	function handleDragEnd() {
		draggedModule = null;
	}
</script>

<div class="module-list">
	<div class="header">
		<h3>Módulos del Curso</h3>
		{#if showActions}
			<button
				class="btn btn-primary"
				on:click={handleCreateModule}
			>
				Crear Módulo
			</button>
		{/if}
	</div>

	{#if loading}
		<div class="loading">
			<div class="loading-spinner"></div>
			<p>Cargando módulos...</p>
		</div>
	{:else if error}
		<div class="error">
			<p>{error}</p>
			<button class="btn btn-outline" on:click={loadModules}>
				Reintentar
			</button>
		</div>
	{:else if modules.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
					<line x1="8" y1="21" x2="16" y2="21"></line>
					<line x1="12" y1="17" x2="12" y2="21"></line>
				</svg>
			</div>
			<h4>No hay módulos creados</h4>
			<p>Este curso aún no tiene módulos. Los módulos te permiten organizar el contenido de manera estructurada.</p>
			{#if showActions}
				<button
					class="btn btn-primary"
					on:click={handleCreateModule}
				>
					Crear el primer módulo
				</button>
			{/if}
		</div>
	{:else}
		<div class="modules-container">
			{#each modules.sort((a, b) => a.orderNumber - b.orderNumber) as module (module.id)}
				<div 
					class="module-item"
					class:draggable={allowReorder}
					class:dragging={draggedModule?.id === module.id}
					draggable={allowReorder}
					on:dragstart={(e) => handleDragStart(e, module)}
					on:dragover={handleDragOver}
					on:drop={(e) => handleDrop(e, module)}
					on:dragend={handleDragEnd}
					role="listitem"
				>
					{#if allowReorder}
						<div class="drag-handle" title="Arrastra para reordenar">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<circle cx="9" cy="12" r="1"></circle>
								<circle cx="9" cy="5" r="1"></circle>
								<circle cx="9" cy="19" r="1"></circle>
								<circle cx="15" cy="12" r="1"></circle>
								<circle cx="15" cy="5" r="1"></circle>
								<circle cx="15" cy="19" r="1"></circle>
							</svg>
						</div>
					{/if}

					<ModuleCard
						{module}
						showActions={true}
						on:edit={handleEditModule}
						on:delete={handleDeleteModule}
						on:view={handleViewModule}
					/>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.module-list {
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 2rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-background-alt);
	}

	.header h3 {
		margin: 0;
		color: var(--color-text-primary);
		font-size: 1.25rem;
		font-weight: 600;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.loading-spinner {
		width: 3rem;
		height: 3rem;
		border: 3px solid var(--color-border);
		border-top: 3px solid var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		gap: 1rem;
	}

	.error p {
		color: var(--color-error);
		margin: 0;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		color: var(--color-text-muted);
	}

	.empty-icon {
		opacity: 0.6;
		margin-bottom: 1.5rem;
	}

	.empty-state h4 {
		margin: 0 0 1rem 0;
		color: var(--color-text-primary);
		font-size: 1.25rem;
		font-weight: 600;
	}

	.empty-state p {
		margin: 0 0 2rem 0;
		max-width: 400px;
		line-height: 1.5;
	}

	.modules-container {
		display: flex;
		flex-direction: column;
	}

	.module-item {
		display: flex;
		align-items: stretch;
		border-bottom: 1px solid var(--color-border);
		transition: background-color 0.2s ease;
	}

	.module-item:last-child {
		border-bottom: none;
	}

	.module-item.draggable {
		cursor: move;
	}

	.module-item.dragging {
		opacity: 0.5;
	}

	.module-item.draggable:hover {
		background: var(--color-background-alt);
	}

	.drag-handle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		background: var(--color-background-alt);
		color: var(--color-text-muted);
		cursor: grab;
		transition: background-color 0.2s ease;
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
			padding: 1rem 1.5rem;
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.header h3 {
			text-align: center;
		}

		.empty-state {
			padding: 3rem 1.5rem;
		}

		.drag-handle {
			width: 2.5rem;
		}
	}
</style>