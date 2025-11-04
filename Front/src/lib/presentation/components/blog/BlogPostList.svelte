<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { blogService } from '$lib/application/services/blog/blogService';
  import BlogPostCard from './BlogPostCard.svelte';
  import BlogPostModal from './BlogPostModal.svelte';
  import LoadingSpinner from '../common/LoadingSpinner.svelte';
  import type { BlogPost } from '$lib/types/api';
  import { t } from '$lib/i18n';

export let showActions = false;
// TODO: Revisar uso de callbacks - considerar hacer pattern con eventos solamente
export let onPostsLoadedCallback:
	| ((event: CustomEvent<BlogPost[]>) => void)
	| undefined = undefined;
export let onDeletePostCallback:
	| ((event: CustomEvent<BlogPost>) => void)
	| undefined = undefined;
export let onPostCreatedCallback:
	| ((event: CustomEvent<BlogPost>) => void)
	| undefined = undefined;
export let onPostUpdatedCallback:
	| ((event: CustomEvent<BlogPost>) => void)
	| undefined = undefined;

  const dispatch = createEventDispatcher();

  export let posts: BlogPost[] = [];
  let isLoading = false;
  let error: string | null = null;
  let showPostModal = false;
  let editingPost: BlogPost | null = null;
  let showTitlePrompt = false;
  let newPostTitle = '';
  let titleError = '';
  let isCreatingDraft = false;

  $: nextOrderNumber = posts.length > 0 ? Math.max(...posts.map((p) => p.viewCount || 0)) + 1 : 1;

  let lastLoadedWithShowActions: boolean | undefined = undefined;

  // Reactivo: cargar posts cuando showActions cambie
  $: {
    if (showActions !== lastLoadedWithShowActions) {
      loadPosts(showActions);
      lastLoadedWithShowActions = showActions;
    }
  }

  export async function loadPosts(forceShowActions?: boolean) {
    const currentShowActions = forceShowActions !== undefined ? forceShowActions : showActions;

    // Solo bloquear si ya está cargando CON EL MISMO valor de showActions
    if (isLoading && lastLoadedWithShowActions === currentShowActions) {
      return;
    }

    isLoading = true;
    error = null;

    try {
		posts = await blogService.getAllPosts(currentShowActions);

		if (!currentShowActions) {
			posts = posts.filter((post) => post.status === 'published');
		}

		const event = new CustomEvent('postsLoaded', { detail: posts });
		onPostsLoadedCallback?.(event);
		dispatch('postsLoaded', posts);
    } catch (err) {
      console.error('Error loading posts:', err);
      error = err instanceof Error ? err.message : $t('blog.error_loading_posts');
    } finally {
      isLoading = false;
    }
  }

  function handleCreatePost() {
    newPostTitle = '';
    titleError = '';
    editingPost = null;
    showTitlePrompt = true;
  }

  function handleEditPost(post: BlogPost) {
    editingPost = post;
    showPostModal = true;
  }

function handleDeletePost(post: BlogPost) {
	const event = new CustomEvent('deletePost', { detail: post });
	onDeletePostCallback?.(event);
	dispatch('deletePost', post);
}

function handlePostCreated(event: CustomEvent<BlogPost>) {
	loadPosts();
	onPostCreatedCallback?.(event);
	dispatch('postCreated', event.detail);
	handleModalClose();
}

function handlePostUpdated(event: CustomEvent<BlogPost>) {
	loadPosts();
	onPostUpdatedCallback?.(event);
	dispatch('postUpdated', event.detail);
	handleModalClose();
}

  function handleModalClose() {
    showPostModal = false;
    editingPost = null;
  }

  export function removePostFromList(postId: string) {
    posts = posts.filter((p) => p.id !== postId);
  }

  async function handleCreateDraft() {
    const trimmedTitle = newPostTitle.trim();
    if (!trimmedTitle) {
      titleError = 'El título es obligatorio';
      return;
    }

    isCreatingDraft = true;
    titleError = '';

    try {
      const draftPost = await blogService.createPost({
        title: trimmedTitle,
        excerpt: '',
        content: '',
        slug: '',
        status: 'draft',
        categoryId: null,
        tags: []
      });

      await loadPosts();

      showTitlePrompt = false;
      editingPost = draftPost;
      showPostModal = true;
    } catch (err) {
      console.error('Error creating draft post:', err);
      titleError = err instanceof Error ? err.message : 'No se pudo crear el borrador del artículo';
    } finally {
      isCreatingDraft = false;
    }
  }

  function handleCancelDraftCreation() {
    if (isCreatingDraft) return;
    showTitlePrompt = false;
    newPostTitle = '';
    titleError = '';
  }
</script>

<div class="blog-post-list">
	<!-- Header with Create Button -->
	{#if showActions}
		<div class="list-header">
			<div class="header-info">
				<h2 class="header-title">{$t('blog.article_management')}</h2>
				<p class="header-subtitle">
					{posts.length} {posts.length === 1 ? $t('blog.article_singular') : $t('blog.article_plural')}
				</p>
			</div>
			<button class="btn-create" on:click={handleCreatePost}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="12" y1="5" x2="12" y2="19"></line>
					<line x1="5" y1="12" x2="19" y2="12"></line>
				</svg>
				{$t('blog.create_article')}
			</button>
		</div>
	{/if}

	<!-- Loading State -->
	{#if isLoading}
		<div class="loading-container">
			<LoadingSpinner size="large" />
			<p class="loading-text">{$t('blog.loading_articles')}</p>
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
				<h3>{$t('blog.error_loading_articles_header')}</h3>
				<p>{error}</p>
				<button class="btn-retry" on:click={() => loadPosts()}>
					{$t('blog.retry')}
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
				<h3>{$t('blog.no_articles_yet')}</h3>
				<p>{$t('blog.create_first_article_description')}</p>
				{#if showActions}
					<button class="btn-create-first" on:click={handleCreatePost}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="12" y1="5" x2="12" y2="19"></line>
							<line x1="5" y1="12" x2="19" y2="12"></line>
						</svg>
						{$t('blog.create_first_article')}
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

{#if showTitlePrompt}
	<div class="draft-modal-backdrop" aria-modal="true" role="dialog">
		<div class="draft-modal">
			<h3>Nuevo borrador</h3>
			<p>Ingresa un título para crear el borrador del artículo.</p>
			<input
				type="text"
				bind:value={newPostTitle}
			placeholder="Título del artículo"
			disabled={isCreatingDraft}
			/>
			{#if titleError}
				<p class="draft-error">{titleError}</p>
			{/if}
			<div class="draft-actions">
				<button class="btn btn-outline" on:click={handleCancelDraftCreation} disabled={isCreatingDraft}>Cancelar</button>
				<button class="btn btn-primary" on:click={handleCreateDraft} disabled={isCreatingDraft}>
					{#if isCreatingDraft}
						<span class="loading-spinner"></span>
					{/if}
					Crear borrador
				</button>
			</div>
		</div>
	</div>
{/if}

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

	.draft-modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(17, 24, 39, 0.55);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1050;
		backdrop-filter: blur(4px);
	}

	.draft-modal {
		background: white;
		border-radius: 16px;
		box-shadow: 0 20px 45px rgba(0, 0, 0, 0.18);
		padding: 1.75rem;
		width: min(420px, 90vw);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.draft-modal h3 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #111827;
	}

	.draft-modal input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 10px;
		font-size: 1rem;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.draft-modal input:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
	}

	.draft-error {
		margin: 0;
		color: #dc2626;
		font-size: 0.9rem;
	}

	.draft-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
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
