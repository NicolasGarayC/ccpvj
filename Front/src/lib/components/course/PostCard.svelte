<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type { PostDetail } from '$lib/services/modulePostService';
	import { postElementService } from '$lib/services/postElementService';
	import type { PostElement } from '$lib/services/postElementService';

	export let post: PostDetail;
	export let showActions = false;
	export let isDragging = false;
	export let dragHandle: HTMLElement | null = null;

	const dispatch = createEventDispatcher();
	let elements: PostElement[] = [];
	let isLoadingElements = false;

	onMount(async () => {
		loadElements();
	});

	async function loadElements() {
		isLoadingElements = true;
		try {
			elements = await postElementService.getElementsByPostId(post.id);
		} catch (error) {
			console.error('Error loading post elements:', error);
			elements = [];
		} finally {
			isLoadingElements = false;
		}
	}

	function handleView() {
		dispatch('view', post);
	}

	function handleEdit() {
		dispatch('edit', post);
	}

	function handleDelete() {
		console.log('PostCard handleDelete called for post:', post.id);
		console.log('Dispatching delete event directly to parent');
		dispatch('delete', post.id);
	}


	function formatDate(timestamp: number | string | null): string {
		if (!timestamp) return 'Sin fecha';

		let date: Date;
		if (typeof timestamp === 'number') {
			date = new Date(timestamp);
		} else if (typeof timestamp === 'string') {
			date = new Date(timestamp);
		} else {
			return 'Sin fecha';
		}

		if (isNaN(date.getTime())) return 'Sin fecha';

		return date.toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getMediaTypeIcon(type: string) {
		switch (type) {
			case 'image':
				return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
					<circle cx="8.5" cy="8.5" r="1.5"></circle>
					<polyline points="21,15 16,10 5,21"></polyline>
				</svg>`;
			case 'video':
				return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polygon points="23,7 16,12 23,17 23,7"></polygon>
					<rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
				</svg>`;
			case 'audio':
				return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M9 18V5l12-2v13"></path>
					<circle cx="6" cy="18" r="3"></circle>
					<circle cx="18" cy="16" r="3"></circle>
				</svg>`;
			case 'title':
				return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M4 6h16M4 12h8m-8 6h16"></path>
				</svg>`;
			case 'text':
				return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
					<polyline points="14,2 14,8 20,8"></polyline>
					<line x1="16" y1="13" x2="8" y2="13"></line>
					<line x1="16" y1="17" x2="8" y2="17"></line>
				</svg>`;
			default:
				return '';
		}
	}

	$: mediaElements = elements.filter(el => ['image', 'video', 'audio'].includes(el.elementType));
	$: textElements = elements.filter(el => ['title', 'text'].includes(el.elementType));
	$: firstImageElement = elements.find(el => el.elementType === 'image' && el.filePath);
	$: hasContent = elements.length > 0;
</script>

<div
	class="post-card"
	class:dragging={isDragging}
	class:has-media={mediaElements.length > 0}
>
	<!-- Drag Handle -->
	{#if showActions}
		<div class="drag-handle" bind:this={dragHandle} title="Arrastrar para reordenar">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="3" y1="6" x2="21" y2="6"></line>
				<line x1="3" y1="12" x2="21" y2="12"></line>
				<line x1="3" y1="18" x2="21" y2="18"></line>
			</svg>
		</div>
	{/if}

	<div class="post-content">
		<div class="post-header">
			<div class="post-order">
				<span class="order-number">#{post.orderNumber}</span>
			</div>

			<div class="post-info">
				<h4 class="post-title">{post.title}</h4>
				{#if post.subtitle}
					<p class="post-subtitle">{post.subtitle}</p>
				{/if}

				<div class="post-meta">
					<span class="author">Por {post.authorName || 'Autor desconocido'}</span>
					<span class="separator">•</span>
					<span class="date">{formatDate(post.createdAt)}</span>
					{#if !post.isActive}
						<span class="separator">•</span>
						<span class="status-badge inactive">Inactivo</span>
					{/if}
				</div>
			</div>

			<!-- Elements Indicators -->
			{#if hasContent}
				<div class="elements-indicators">
					<div class="elements-count">
						{elements.length} elemento{elements.length !== 1 ? 's' : ''}
					</div>
					<div class="element-types">
						{#each [...new Set(elements.map(el => el.elementType))] as elementType}
							<div class="element-indicator" title={`Contiene ${elementType === 'title' ? 'títulos' : elementType === 'text' ? 'texto' : elementType === 'image' ? 'imágenes' : elementType === 'video' ? 'videos' : 'audios'}`}>
								{@html getMediaTypeIcon(elementType)}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Dynamic Elements Preview -->
		{#if isLoadingElements}
			<div class="loading-elements">
				<div class="loading-spinner"></div>
				<span>Cargando contenido...</span>
			</div>
		{:else if hasContent}
			<div class="elements-preview">
				{#each elements.slice(0, 3) as element}
					<div class="element-preview element-{element.elementType}">
						{#if element.elementType === 'title'}
							<h5 class="preview-title">{element.content || 'Sin título'}</h5>
						{:else if element.elementType === 'text'}
							<p class="preview-text">
								{element.content && element.content.length > 100
									? element.content.substring(0, 100) + '...'
									: element.content || 'Sin contenido'}
							</p>
						{:else if element.elementType === 'image' && element.filePath}
							<div class="preview-media image-preview">
								<img src={postElementService.getFileUrl(element.filePath)} alt={element.fileName || 'Imagen'} loading="lazy" />
							</div>
						{:else if ['video', 'audio'].includes(element.elementType) && element.filePath}
							<div class="preview-media {element.elementType}-preview">
								<div class="media-placeholder">
									{@html getMediaTypeIcon(element.elementType)}
									<span>{element.elementType === 'video' ? 'Video' : 'Audio'}</span>
								</div>
							</div>
						{/if}
					</div>
				{/each}
				{#if elements.length > 3}
					<div class="more-elements">
						<span>+{elements.length - 3} más...</span>
					</div>
				{/if}
			</div>
		{:else}
			<div class="empty-content">
				<p>Este post aún no tiene contenido.</p>
			</div>
		{/if}
	</div>

	<div class="post-actions">
		<button
			class="btn btn-outline btn-sm"
			on:click={handleView}
			title="Ver post completo"
		>
			Ver Detalles
		</button>

		{#if showActions}
			<button
				class="btn btn-outline btn-sm"
				on:click={handleEdit}
				title="Editar post"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
					<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
				</svg>
			</button>

			<button
				class="btn btn-outline btn-sm btn-danger"
				on:click={handleDelete}
				title="Eliminar post"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
	.post-card {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1.5rem;
		border: 1px solid var(--color-border);
		border-radius: 12px;
		background: white;
		transition: all 0.2s ease;
		position: relative;
	}

	.post-card:hover {
		border-color: var(--color-primary-light);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.post-card.dragging {
		opacity: 0.5;
		transform: rotate(5deg);
		z-index: 1000;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
	}

	.post-card.has-media {
		border-left: 4px solid var(--color-primary);
	}

	.drag-handle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		padding: 0.5rem;
		color: var(--color-text-muted);
		cursor: grab;
		border-radius: 6px;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.drag-handle:hover {
		background: var(--color-background-muted);
		color: var(--color-text-primary);
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.post-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.post-header {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}

	.post-order {
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

	.post-info {
		flex: 1;
		min-width: 0;
	}

	.post-title {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text-primary);
		line-height: 1.4;
	}

	.post-subtitle {
		margin: 0 0 0.75rem 0;
		color: var(--color-text-muted);
		font-size: 0.95rem;
		line-height: 1.4;
		font-weight: 500;
	}

	.post-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		color: var(--color-text-muted);
		font-size: 0.8rem;
	}

	.author {
		font-weight: 500;
	}

	.separator {
		opacity: 0.6;
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

	.elements-indicators {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.elements-count {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-weight: 500;
		white-space: nowrap;
	}

	.element-types {
		display: flex;
		gap: 0.25rem;
	}

	.element-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		background: var(--color-background-muted);
		color: var(--color-text-muted);
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.element-indicator:hover {
		background: var(--color-primary-light);
		color: var(--color-primary-dark);
	}

	.loading-elements {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}

	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.elements-preview {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.element-preview {
		padding: 0.75rem;
		border-radius: 8px;
		background: var(--color-background-subtle);
		border-left: 3px solid var(--color-border);
	}

	.element-preview.element-title {
		border-left-color: var(--color-primary);
	}

	.element-preview.element-text {
		border-left-color: var(--color-secondary);
	}

	.element-preview.element-image {
		border-left-color: var(--color-success);
		padding: 0;
	}

	.element-preview.element-video,
	.element-preview.element-audio {
		border-left-color: var(--color-warning);
	}

	.preview-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text-primary);
		line-height: 1.4;
	}

	.preview-text {
		margin: 0;
		color: var(--color-text-muted);
		line-height: 1.5;
		font-size: 0.9rem;
		white-space: pre-wrap;
	}

	.preview-media {
		border-radius: 8px;
		overflow: hidden;
	}

	.preview-media.image-preview img {
		width: 100%;
		height: auto;
		max-height: 150px;
		object-fit: cover;
		display: block;
	}

	.media-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 2rem;
		color: var(--color-text-muted);
		font-size: 0.9rem;
		background: var(--color-background-muted);
	}

	.more-elements {
		text-align: center;
		padding: 0.5rem;
		color: var(--color-text-muted);
		font-size: 0.8rem;
		font-style: italic;
	}

	.empty-content {
		padding: 1.5rem;
		text-align: center;
		color: var(--color-text-muted);
		font-style: italic;
		background: var(--color-background-subtle);
		border-radius: 8px;
		border: 2px dashed var(--color-border-light);
	}

	.empty-content p {
		margin: 0;
		font-size: 0.9rem;
	}

	.post-actions {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		flex-shrink: 0;
		flex-direction: column;
	}

	.btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border: 2px solid transparent;
		border-radius: 6px;
		font-weight: 500;
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;
		justify-content: center;
		white-space: nowrap;
	}

	.btn-sm {
		padding: 0.4rem 0.6rem;
		font-size: 0.75rem;
	}

	.btn-outline {
		background: transparent;
		color: var(--color-text-muted);
		border-color: var(--color-border);
	}

	.btn-outline:hover:not(:disabled) {
		color: var(--color-text-primary);
		border-color: var(--color-text-muted);
	}

	.btn-danger {
		color: var(--color-danger);
		border-color: var(--color-danger-light);
	}

	.btn-danger:hover:not(:disabled) {
		background: var(--color-danger);
		color: white;
		border-color: var(--color-danger);
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn svg {
		width: 14px;
		height: 14px;
	}

	@media (max-width: 768px) {
		.post-card {
			flex-direction: column;
			gap: 1rem;
			padding: 1.25rem;
		}

		.post-header {
			flex-wrap: wrap;
		}

		.elements-indicators {
			order: 1;
			width: 100%;
			justify-content: flex-start;
		}

		.post-info {
			order: 2;
			width: 100%;
		}

		.post-actions {
			flex-direction: row;
			justify-content: center;
			width: 100%;
		}

		.drag-handle {
			display: none;
		}
	}

	@media (max-width: 480px) {
		.post-actions {
			flex-direction: column;
			gap: 0.75rem;
		}

		.post-actions .btn {
			width: 100%;
		}

		.media-preview img {
			max-height: 150px;
		}
	}
</style>