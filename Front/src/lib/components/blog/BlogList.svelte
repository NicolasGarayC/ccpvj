<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { canCreateContent, canEditContent, canDeleteContent, type UserRole } from '$lib/utils/roleUtils';
	import BlogPostCard from './BlogPostCard.svelte';
	
	export let posts: any[] = [];
	export let loading = false;
	export let error = '';
	export let currentUser: { role?: UserRole; id?: string } | null = null;
	
	// Check if user can create blog posts
	$: canCreate = canCreateContent(currentUser?.role);
	$: canManage = canEditContent(currentUser?.role) || canDeleteContent(currentUser?.role);

	function handleCreatePost() {
		if (!canCreate) {
			alert('No tienes permisos para crear posts. Necesitas ser Colaborador o Administrador.');
			return;
		}
		// Navigate to create post page
		const event = new CustomEvent('createPost');
		dispatchEvent(event);
	}

	function handleEditPost(event: CustomEvent<string>) {
		if (!canEditContent(currentUser?.role)) {
			alert('No tienes permisos para editar posts.');
			return;
		}
		
		const postId = event.detail;
		const event2 = new CustomEvent('editPost', { detail: postId });
		dispatchEvent(event2);
	}

	function handleDeletePost(event: CustomEvent<string>) {
		if (!canDeleteContent(currentUser?.role)) {
			alert('No tienes permisos para eliminar posts.');
			return;
		}
		
		const postId = event.detail;
		if (confirm('¿Estás seguro de que deseas eliminar este post?')) {
			const event2 = new CustomEvent('deletePost', { detail: postId });
			dispatchEvent(event2);
		}
	}

	// Check if current user can edit a specific post
	function canEditPost(post: any): boolean {
		if (!currentUser) return false;
		
		// Admins can edit any post
		if (currentUser.role === 'Administrador') return true;
		
		// Colaboradores can edit their own posts
		if (currentUser.role === 'Colaborador' && post.authorId === currentUser.id) return true;
		
		return false;
	}

	// Check if current user can delete a specific post
	function canDeletePost(post: any): boolean {
		if (!currentUser) return false;
		
		// Admins can delete any post
		if (currentUser.role === 'Administrador') return true;
		
		// Colaboradores can delete their own posts
		if (currentUser.role === 'Colaborador' && post.authorId === currentUser.id) return true;
		
		return false;
	}
</script>

<div class="blog-list">
	<div class="blog-header">
		<h2>Blog</h2>
		{#if canCreate}
			<button class="btn btn-primary" on:click={handleCreatePost}>
				Crear Post
			</button>
		{/if}
	</div>

	{#if loading}
		<div class="loading">
			<div class="loading-spinner"></div>
			<p>Cargando posts...</p>
		</div>
	{:else if error}
		<div class="error">
			<p>{error}</p>
		</div>
	{:else if posts.length === 0}
		<div class="empty-state">
			<h3>No hay posts publicados</h3>
			<p>Aún no hay contenido en el blog.</p>
			{#if canCreate}
				<button class="btn btn-primary" on:click={handleCreatePost}>
					Crear el primer post
				</button>
			{/if}
		</div>
	{:else}
		<div class="posts-grid">
			{#each posts as post (post.id)}
				<BlogPostCard 
					{post} 
					showActions={canManage}
					canEdit={canEditPost(post)}
					canDelete={canDeletePost(post)}
					on:edit={handleEditPost}
					on:delete={handleDeletePost}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.blog-list {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.blog-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--color-border);
	}

	.blog-header h2 {
		margin: 0;
		color: var(--color-text-primary);
		font-size: 2rem;
		font-weight: 700;
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
		justify-content: center;
		padding: 2rem;
		color: var(--color-error);
		background: var(--color-error-light);
		border-radius: 8px;
		margin-bottom: 2rem;
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

	.empty-state h3 {
		margin: 0 0 1rem 0;
		color: var(--color-text-primary);
		font-size: 1.5rem;
	}

	.empty-state p {
		margin: 0 0 2rem 0;
		font-size: 1.1rem;
		line-height: 1.5;
	}

	.posts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 2rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	@media (max-width: 768px) {
		.blog-list {
			padding: 1rem;
		}

		.blog-header {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.blog-header h2 {
			text-align: center;
			font-size: 1.5rem;
		}

		.posts-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
	}
</style>