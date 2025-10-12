<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { blogService } from '$lib/services/blog/blogService';
	import BlogPostCard from './BlogPostCard.svelte';
	import BlogPostModal from './BlogPostModal.svelte';
	import LoadingSpinner from '../common/LoadingSpinner.svelte';
	import type { BlogPost } from '$lib/data/models/interfaces';

	export let showActions = false;

	const dispatch = createEventDispatcher();

	export let posts: BlogPost[] = [];
	let isLoading = false;
	let error: string | null = null;
	let showPostModal = false;
	let editingPost: BlogPost | null = null;

	$: nextOrderNumber = posts.length > 0 ? Math.max(...posts.map(p => p.viewCount || 0)) + 1 : 1;

	onMount(() => {
		loadPosts();
	});

	export async function loadPosts() {
		if (isLoading) return;

		isLoading = true;
		error = null;

		try {
			posts = await blogService.getAllPosts();
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
		showPostModal = true;
	}

	function handleEditPost(post: BlogPost) {
		editingPost = post;
		showPostModal = true;
	}

	function handleDeletePost(post: BlogPost) {
		dispatch('deletePost', post);
	}

	function handlePostCreated(event: CustomEvent) {
		loadPosts();
		dispatch('postCreated', event.detail);
		handleModalClose();
	}

	function handlePostUpdated(event: CustomEvent) {
		loadPosts();
		dispatch('postUpdated', event.detail);
		handleModalClose();
	}

	function handleModalClose() {
		showPostModal = false;
		editingPost = null;
	}

	export function removePostFromList(postId: string) {
		posts = posts.filter(p => p.id !== postId);
	}
</script>

<div class="blog-post-list">
	<!-- Header with Create Button -->
	{#if showActions}
		<div class="list-header">
			<div class="header-info">
				<h2 class="header-title">Gestión de Artículos</h2>
				<p class="header-subtitle">
					{posts.length} {posts.length === 1 ? 'artículo' : 'artículos'}
				</p>
			</div>
			<button class="btn-create" on:click={handleCreatePost}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="12" y1="5" x2="12" y2="19"></line>
					<line x1="5" y1="12" x2="19" y2="12"></line>
				</svg>
				Crear Artículo
			</button>
		</div>
	{/if}

	<!-- Loading State -->
	{#if isLoading}
		<div class="loading-container">
			<LoadingSpinner size="large" />
			<p class="loading-text">Cargando artículos...</p>
		</div>

	<!-- Error State -->
	{:else if error}
		<div class="error-container">
			<div class="error-content">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="15" y1="9" x2="9" y2="15"></line>
					<line x1="9" y1="9" x2="15" y2="15"></line>
				</svg>
				<h3>Error al cargar artículos</h3>
				<p>{error}</p>
				<button class="btn-retry" on:click={loadPosts}>
					Intentar de nuevo
				</button>
			</div>
		</div>

	<!-- Empty State -->
	{:else if posts.length === 0}
		<div class="empty-container">
			<div class="empty-content">
				<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
					<polyline points="14 2 14 8 20 8"></polyline>
					<line x1="12" y1="18" x2="12" y2="12"></line>
					<line x1="9" y1="15" x2="15" y2="15"></line>
				</svg>
				<h3>No hay artículos todavía</h3>
				<p>Comienza creando tu primer artículo del blog</p>
				{#if showActions}
					<button class="btn-create-first" on:click={handleCreatePost}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="12" y1="5" x2="12" y2="19"></line>
							<line x1="5" y1="12" x2="19" y2="12"></line>
						</svg>
						Crear Primer Artículo
					</button>
				{/if}
			</div>
		</div>

	<!-- Posts Grid -->
	{:else}
		<div class="posts-grid">
			{#each posts as post (post.id)}
				<BlogPostCard
					{post}
					{showActions}
					canEdit={showActions}
					canDelete={showActions}
					on:edit={() => handleEditPost(post)}
					on:delete={() => handleDeletePost(post)}
				/>
			{/each}
		</div>
	{/if}
</div>

<!-- Post Editor Modal -->
<BlogPostModal
	bind:visible={showPostModal}
	post={editingPost}
	nextOrderNumber={nextOrderNumber}
	on:created={handlePostCreated}
	on:updated={handlePostUpdated}
	on:close={handleModalClose}
/>

<style>
	.blog-post-list {
		width: 100%;
	}

	.list-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	.header-info {
		flex: 1;
	}

	.header-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #111827;
	}

	.header-subtitle {
		margin: 0.25rem 0 0 0;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.btn-create {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-create:hover {
		background: #2563eb;
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.btn-create:active {
		transform: translateY(0);
	}

	.loading-container,
	.error-container,
	.empty-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.loading-text {
		margin-top: 1rem;
		color: #6b7280;
		font-size: 0.9rem;
	}

	.error-content,
	.empty-content {
		max-width: 400px;
	}

	.error-content svg,
	.empty-content svg {
		margin: 0 auto 1.5rem;
		color: #ef4444;
		opacity: 0.7;
	}

	.empty-content svg {
		color: #9ca3af;
	}

	.error-content h3,
	.empty-content h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
	}

	.error-content p,
	.empty-content p {
		margin: 0 0 1.5rem 0;
		color: #6b7280;
		line-height: 1.5;
	}

	.btn-retry,
	.btn-create-first {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-retry:hover,
	.btn-create-first:hover {
		background: #2563eb;
		transform: translateY(-1px);
	}

	.posts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	@media (max-width: 768px) {
		.list-header {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.btn-create {
			width: 100%;
			justify-content: center;
		}

		.posts-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
