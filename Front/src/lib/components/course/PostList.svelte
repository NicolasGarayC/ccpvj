<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { modulePostService, type PostDetail } from '$lib/services/modulePostService';
	import PostCard from './PostCard.svelte';
	import PostForm from './PostForm.svelte';
	import LoadingSpinner from '../common/LoadingSpinner.svelte';

	export let moduleId: string;
	export let materialApoyoId: string;
	export let showActions = false;

	const dispatch = createEventDispatcher();

	let posts: PostDetail[] = [];
	let isLoading = false;
	let isLoadingReorder = false;
	let error: string | null = null;
	let showPostForm = false;
	let editingPost: PostDetail | null = null;

	let draggedPost: PostDetail | null = null;
	let draggedOverIndex: number = -1;

	onMount(() => {
		loadPosts();
	});

	async function loadPosts() {
		if (isLoading) return;

		isLoading = true;
		error = null;

		try {
			posts = await modulePostService.getModulePosts(moduleId);
			posts.sort((a, b) => a.orderNumber - b.orderNumber);
			dispatch('postsLoaded', posts);
		} catch (err) {
			console.error('Error loading posts:', err);
			error = err instanceof Error ? err.message : 'Error cargando posts';
		} finally {
			isLoading = false;
		}
	}

	function handleCreatePost() {
		editingPost = null;
		showPostForm = true;
	}

	function handleEditPost(event: CustomEvent<PostDetail>) {
		dispatch('editPost', event.detail);
	}

	function handleViewPost(event: CustomEvent<PostDetail>) {
		dispatch('viewPost', event.detail);
	}

	async function handleDeletePost(event: CustomEvent<string>) {
		const postId = event.detail;
		dispatch('deletePost', postId);
	}

	function handlePostCreated(event: CustomEvent<PostDetail>) {
		const newPost = event.detail;
		posts = [...posts, newPost].sort((a, b) => a.orderNumber - b.orderNumber);
		dispatch('postCreated', newPost);

		// Close the form modal after successful creation
		handleFormClose();
	}

	function handlePostUpdated(event: CustomEvent<{postId: string}>) {
		// Reload posts to get updated data
		loadPosts();
		dispatch('postUpdated', event.detail);
	}

	// Expose posts array to parent component
	export { posts };

	// Expose loadPosts function to parent component for refresh
	export { loadPosts };

	// Handle deletion confirmation from parent component
	export function removePostFromList(postId: string) {
		posts = posts.filter(p => p.id !== postId);
	}

	function handleFormClose() {
		showPostForm = false;
		editingPost = null;
	}

	// Drag and Drop functionality - simplified
	function handleDragStart(event: DragEvent, post: PostDetail) {
		draggedPost = post;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/html', ''); // Required for Firefox
		}
	}

	function handleDragOver(event: DragEvent, index: number) {
		if (!draggedPost) return;

		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
		draggedOverIndex = index;
	}

	function handleDragLeave(event: DragEvent) {
		// Only reset if leaving the container, not child elements
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const x = event.clientX;
		const y = event.clientY;

		if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
			draggedOverIndex = -1;
		}
	}

	async function handleDrop(event: DragEvent, targetIndex: number) {
		if (!draggedPost) return;

		event.preventDefault();
		draggedOverIndex = -1;

		const draggedIndex = posts.findIndex(p => p.id === draggedPost!.id);
		if (draggedIndex === -1 || draggedIndex === targetIndex) {
			draggedPost = null;
			return;
		}

		try {
			isLoadingReorder = true;

			// Create new order array
			const newPosts = [...posts];
			const [movedPost] = newPosts.splice(draggedIndex, 1);
			newPosts.splice(targetIndex, 0, movedPost);

			// Update order numbers
			for (let i = 0; i < newPosts.length; i++) {
				if (newPosts[i].orderNumber !== i + 1) {
					newPosts[i].orderNumber = i + 1;
					await modulePostService.reorderPost(newPosts[i].id, i + 1);
				}
			}

			posts = newPosts;
			dispatch('postsReordered', { posts: newPosts });
		} catch (err) {
			console.error('Error reordering posts:', err);
			error = err instanceof Error ? err.message : 'Error reordenando posts';
			// Reload to get correct order
			loadPosts();
		} finally {
			isLoadingReorder = false;
			draggedPost = null;
		}
	}

	function handleDragEnd() {
		draggedPost = null;
		draggedOverIndex = -1;
	}

	$: nextOrderNumber = posts.length > 0 ? Math.max(...posts.map(p => p.orderNumber)) + 1 : 1;
</script>

<div class="post-list-container">
	<!-- Header -->
	<div class="list-header">
		<div class="header-info">
			<h3>Contenido del Módulo</h3>
			<span class="post-count">{posts.length} post{posts.length !== 1 ? 's' : ''}</span>
		</div>

		{#if showActions}
			<button
				class="btn btn-primary"
				on:click={handleCreatePost}
				disabled={isLoading}
				title="Crear nuevo post"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="12" y1="5" x2="12" y2="19"></line>
					<line x1="5" y1="12" x2="19" y2="12"></line>
				</svg>
				Crear Post
			</button>
		{/if}
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="error-message">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10"></circle>
				<line x1="15" y1="9" x2="9" y2="15"></line>
				<line x1="9" y1="9" x2="15" y2="15"></line>
			</svg>
			{error}
			<button class="btn btn-outline btn-sm" on:click={loadPosts}>
				Reintentar
			</button>
		</div>
	{/if}

	<!-- Loading State -->
	{#if isLoading}
		<div class="loading-container">
			<LoadingSpinner size="large" />
			<p>Cargando posts...</p>
		</div>
	{:else if posts.length === 0}
		<!-- Empty State -->
		<div class="empty-state">
			<div class="empty-icon">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
					<polyline points="14,2 14,8 20,8"></polyline>
					<line x1="16" y1="13" x2="8" y2="13"></line>
					<line x1="16" y1="17" x2="8" y2="17"></line>
					<polyline points="10,9 9,9 8,9"></polyline>
				</svg>
			</div>
			<h4>No hay posts en este módulo</h4>
			<p>Los posts son contenidos individuales que pueden incluir texto, imágenes, videos y audios.</p>
			{#if showActions}
				<button class="btn btn-primary" on:click={handleCreatePost}>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="12" y1="5" x2="12" y2="19"></line>
						<line x1="5" y1="12" x2="19" y2="12"></line>
					</svg>
					Crear Primer Post
				</button>
			{/if}
		</div>
	{:else}
		<!-- Post List -->
		<div class="post-list" class:reordering={isLoadingReorder}>
			{#if isLoadingReorder}
				<div class="reorder-overlay">
					<LoadingSpinner />
					<span>Reordenando posts...</span>
				</div>
			{/if}

			{#each posts as post, index (post.id)}
				<div
					class="post-item"
					class:drag-over={draggedOverIndex === index && draggedPost?.id !== post.id}
					draggable={showActions}
					on:dragstart={(e) => handleDragStart(e, post)}
					on:dragover={(e) => handleDragOver(e, index)}
					on:dragleave={handleDragLeave}
					on:drop={(e) => handleDrop(e, index)}
					on:dragend={handleDragEnd}
				>
					<PostCard
						{post}
						{showActions}
						isDragging={draggedPost?.id === post.id}
						on:view={handleViewPost}
						on:edit={handleEditPost}
						on:delete={handleDeletePost}
					/>
				</div>
			{/each}
		</div>

		<!-- Drag and Drop Hint -->
		{#if posts.length > 1}
			<div class="reorder-hint">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M7 13l3 3 7-7"></path>
					<path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9s4.03-9 9-9c2.39 0 4.58.94 6.24 2.46"></path>
				</svg>
				Arrastra los posts usando el ícono de líneas para reordenarlos
			</div>
		{/if}
	{/if}
</div>

<!-- Post Form Modal -->
<PostForm
	visible={showPostForm}
	{moduleId}
	{materialApoyoId}
	post={editingPost}
	{nextOrderNumber}
	on:created={handlePostCreated}
	on:updated={handlePostUpdated}
	on:close={handleFormClose}
/>

<style>
	.post-list-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.list-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.header-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.header-info h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.post-count {
		background: var(--color-background-muted);
		color: var(--color-text-muted);
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: var(--color-danger-light);
		color: var(--color-danger-dark);
		border-radius: 8px;
		border-left: 4px solid var(--color-danger);
		flex-wrap: wrap;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		gap: 1rem;
	}

	.loading-container p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 2rem;
		text-align: center;
		background: var(--color-background-subtle);
		border-radius: 12px;
		border: 2px dashed var(--color-border);
	}

	.empty-icon {
		margin-bottom: 1.5rem;
		color: var(--color-text-muted);
		opacity: 0.7;
	}

	.empty-state h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.empty-state p {
		margin: 0 0 2rem 0;
		color: var(--color-text-muted);
		line-height: 1.5;
		max-width: 400px;
	}

	.post-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		position: relative;
	}

	.post-list.reordering {
		pointer-events: none;
	}

	.reorder-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.8);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		z-index: 100;
		border-radius: 8px;
	}

	.reorder-overlay span {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		font-weight: 500;
	}

	.post-item {
		transition: all 0.2s ease;
	}

	.post-item.drag-over {
		transform: translateY(-8px);
		box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
	}

	.post-item.drag-over::before {
		content: '';
		position: absolute;
		top: -8px;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--color-primary);
		border-radius: 2px;
		z-index: 10;
	}

	.reorder-hint {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		background: var(--color-primary-light);
		color: var(--color-primary-dark);
		border-radius: 8px;
		font-size: 0.85rem;
		margin-top: 0.5rem;
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
		white-space: nowrap;
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

	.btn-outline {
		background: transparent;
		color: var(--color-text-muted);
		border-color: var(--color-border);
	}

	.btn-outline:hover:not(:disabled) {
		color: var(--color-text-primary);
		border-color: var(--color-text-muted);
	}

	.btn-sm {
		padding: 0.5rem 0.75rem;
		font-size: 0.8rem;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.list-header {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.header-info {
			justify-content: center;
		}

		.reorder-hint {
			display: none;
		}

		.post-list {
			gap: 0.75rem;
		}
	}

	@media (max-width: 480px) {
		.post-list-container {
			gap: 1rem;
		}

		.empty-state {
			padding: 2rem 1rem;
		}

		.empty-state p {
			font-size: 0.85rem;
		}

		.error-message {
			padding: 0.75rem 1rem;
			font-size: 0.85rem;
		}
	}
</style>