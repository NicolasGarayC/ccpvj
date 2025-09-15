<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type { PostDetail } from '$lib/services/modulePostService';
	import { postElementService } from '$lib/services/postElementService';
	import type { PostElement } from '$lib/server/db/schema';
	import LoadingSpinner from '../common/LoadingSpinner.svelte';

	export let visible = false;
	export let post: PostDetail | null = null;

	const dispatch = createEventDispatcher();

	let elements: PostElement[] = [];
	let isLoadingElements = false;
	let error: string | null = null;
	let modalElement: HTMLElement;

	$: if (visible && post) {
		loadElements();
		// Focus modal for accessibility
		setTimeout(() => {
			modalElement?.focus();
		}, 100);
	}

	async function loadElements() {
		if (!post) return;

		isLoadingElements = true;
		error = null;

		try {
			elements = await postElementService.getElementsByPostId(post.id);
			elements.sort((a, b) => a.orderNumber - b.orderNumber);
		} catch (err) {
			console.error('Error loading post elements:', err);
			error = err instanceof Error ? err.message : 'Error cargando contenido';
			elements = [];
		} finally {
			isLoadingElements = false;
		}
	}

	function handleClose() {
		dispatch('close');
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		}
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
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function renderElement(element: PostElement) {
		switch (element.elementType) {
			case 'title':
				return element.content || 'Sin título';
			case 'text':
				return element.content || 'Sin contenido';
			case 'image':
				return element.filePath ? { type: 'image', src: element.filePath, alt: element.fileName || 'Imagen' } : null;
			case 'video':
				return element.filePath ? { type: 'video', src: element.filePath } : null;
			case 'audio':
				return element.filePath ? { type: 'audio', src: element.filePath } : null;
			default:
				return null;
		}
	}
</script>

{#if visible}
	<div
		class="modal-backdrop"
		on:click={handleBackdropClick}
		on:keydown={handleKeyDown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="post-viewer-title"
		tabindex="-1"
		bind:this={modalElement}
	>
		<div class="modal-content" role="document">
			<!-- Header -->
			<div class="modal-header">
				<div class="header-info">
					<h2 id="post-viewer-title" class="post-title">{post?.title || 'Sin título'}</h2>
					{#if post?.subtitle}
						<p class="post-subtitle">{post.subtitle}</p>
					{/if}
					<div class="post-meta">
						<span class="post-order">#{post?.orderNumber || 0}</span>
						<span class="separator">•</span>
						<span class="author">Por {post?.authorName || 'Autor desconocido'}</span>
						<span class="separator">•</span>
						<span class="date">{formatDate(post?.createdAt)}</span>
						{#if post && !post.isActive}
							<span class="separator">•</span>
							<span class="status-badge inactive">Inactivo</span>
						{/if}
					</div>
				</div>
				<button
					class="close-button"
					on:click={handleClose}
					title="Cerrar"
					aria-label="Cerrar visor de post"
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="modal-body">
				{#if isLoadingElements}
					<div class="loading-container">
						<LoadingSpinner />
						<p>Cargando contenido del post...</p>
					</div>
				{:else if error}
					<div class="error-container">
						<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="15" y1="9" x2="9" y2="15"></line>
							<line x1="9" y1="9" x2="15" y2="15"></line>
						</svg>
						<h3>Error cargando contenido</h3>
						<p>{error}</p>
						<button class="btn btn-primary" on:click={loadElements}>
							Reintentar
						</button>
					</div>
				{:else if elements.length === 0}
					<div class="empty-container">
						<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
							<polyline points="14,2 14,8 20,8"></polyline>
							<line x1="16" y1="13" x2="8" y2="13"></line>
							<line x1="16" y1="17" x2="8" y2="17"></line>
							<polyline points="10,9 9,9 8,9"></polyline>
						</svg>
						<h3>Post sin contenido</h3>
						<p>Este post aún no tiene elementos de contenido añadidos.</p>
					</div>
				{:else}
					<div class="elements-container">
						{#each elements as element (element.id)}
							{@const renderedElement = renderElement(element)}
							{#if renderedElement}
								<div class="element element-{element.elementType}">
									{#if element.elementType === 'title'}
										<h3 class="element-title">{renderedElement}</h3>
									{:else if element.elementType === 'text'}
										<div class="element-text">{@html renderedElement.replace(/\n/g, '<br>')}</div>
									{:else if renderedElement.type === 'image'}
										<div class="element-image">
											<img
												src={renderedElement.src}
												alt={renderedElement.alt}
												loading="lazy"
											/>
											{#if element.fileName}
												<div class="media-caption">{element.fileName}</div>
											{/if}
										</div>
									{:else if renderedElement.type === 'video'}
										<div class="element-video">
											<video controls preload="metadata">
												<source src={renderedElement.src} type={element.mimeType || 'video/mp4'} />
												<track kind="captions" />
												Tu navegador no soporta la reproducción de video.
											</video>
											{#if element.fileName}
												<div class="media-caption">{element.fileName}</div>
											{/if}
										</div>
									{:else if renderedElement.type === 'audio'}
										<div class="element-audio">
											<audio controls preload="metadata">
												<source src={renderedElement.src} type={element.mimeType || 'audio/mpeg'} />
												Tu navegador no soporta la reproducción de audio.
											</audio>
											{#if element.fileName}
												<div class="media-caption">{element.fileName}</div>
											{/if}
										</div>
									{/if}
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="modal-footer">
				<div class="element-count">
					{elements.length} elemento{elements.length !== 1 ? 's' : ''} de contenido
				</div>
				<button class="btn btn-outline" on:click={handleClose}>
					Cerrar
				</button>
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
		background: rgba(0, 0, 0, 0.75);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		overflow-y: auto;
	}

	.modal-content {
		background: white;
		border-radius: 16px;
		width: 100%;
		max-width: 900px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	}

	.modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		padding: 2rem 2rem 1rem 2rem;
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.header-info {
		flex: 1;
		min-width: 0;
	}

	.post-title {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text-primary);
		line-height: 1.3;
	}

	.post-subtitle {
		margin: 0 0 1rem 0;
		color: var(--color-text-muted);
		font-size: 1.1rem;
		line-height: 1.4;
		font-weight: 500;
	}

	.post-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.post-order {
		background: var(--color-primary-light);
		color: var(--color-primary-dark);
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-weight: 600;
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

	.close-button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 8px;
		color: var(--color-text-muted);
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.close-button:hover {
		background: var(--color-background-muted);
		color: var(--color-text-primary);
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem 2rem;
		min-height: 200px;
	}

	.loading-container,
	.error-container,
	.empty-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		text-align: center;
		gap: 1rem;
	}

	.error-container svg,
	.empty-container svg {
		color: var(--color-text-muted);
		opacity: 0.7;
	}

	.error-container h3,
	.empty-container h3 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.error-container p,
	.empty-container p {
		margin: 0;
		color: var(--color-text-muted);
		line-height: 1.5;
	}

	.elements-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.element {
		padding: 0;
	}

	.element-title {
		margin: 0;
		font-size: 1.4rem;
		font-weight: 700;
		color: var(--color-text-primary);
		line-height: 1.3;
		border-left: 4px solid var(--color-primary);
		padding-left: 1rem;
	}

	.element-text {
		color: var(--color-text-primary);
		line-height: 1.7;
		font-size: 1rem;
		white-space: pre-wrap;
		border-left: 4px solid var(--color-secondary);
		padding-left: 1rem;
	}

	.element-image,
	.element-video,
	.element-audio {
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid var(--color-border);
		background: var(--color-background-subtle);
	}

	.element-image img {
		width: 100%;
		height: auto;
		display: block;
		object-fit: cover;
	}

	.element-video video,
	.element-audio audio {
		width: 100%;
		display: block;
	}

	.element-video video {
		max-height: 70vh;
		object-fit: contain;
	}

	.media-caption {
		padding: 1rem;
		background: var(--color-background-muted);
		color: var(--color-text-muted);
		font-size: 0.9rem;
		font-weight: 500;
		border-top: 1px solid var(--color-border);
	}

	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 2rem 2rem 2rem;
		border-top: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.element-count {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		font-weight: 500;
	}

	.btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border: 2px solid transparent;
		border-radius: 8px;
		font-weight: 500;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;
		justify-content: center;
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

	.btn-primary {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--color-primary-dark);
		border-color: var(--color-primary-dark);
	}

	@media (max-width: 768px) {
		.modal-content {
			margin: 0;
			height: 100vh;
			max-height: 100vh;
			border-radius: 0;
		}

		.modal-header {
			padding: 1.5rem 1.5rem 1rem 1.5rem;
		}

		.modal-body {
			padding: 1rem 1.5rem;
		}

		.modal-footer {
			padding: 1rem 1.5rem 1.5rem 1.5rem;
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.element-count {
			text-align: center;
		}
	}

	@media (max-width: 480px) {
		.post-title {
			font-size: 1.3rem;
		}

		.post-meta {
			gap: 0.5rem;
			font-size: 0.85rem;
		}

		.element-title {
			font-size: 1.2rem;
		}

		.loading-container,
		.error-container,
		.empty-container {
			padding: 2rem 1rem;
		}
	}
</style>