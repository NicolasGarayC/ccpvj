<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { courseService, type ModuleDetail } from '$lib/services/courseService';
	import { modulePostService, type PostDetail } from '$lib/services/modulePostService';
	import PostList from '$lib/components/course/PostList.svelte';
	import PostViewer from '$lib/components/course/PostViewer.svelte';
	import PostForm from '$lib/components/course/PostForm.svelte';
	import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
	import ConfirmationModal from '$lib/components/common/ConfirmationModal.svelte';
	import SuccessToast from '$lib/components/common/SuccessToast.svelte';

	const moduleId = $page.params.id;

	let module: ModuleDetail | null = null;
	let isLoading = false;
	let error: string | null = null;
	let postCount = 0;

	// Check if user has admin/collaborator permissions
	let userRole: string | null = null;
	let canManagePosts = false;

	// Post viewer and editor state
	let showPostViewer = false;
	let viewingPost: PostDetail | null = null;
	let showPostEditor = false;
	let editingPost: PostDetail | null = null;
	let showDeleteModal = false;
	let deletingPost: PostDetail | null = null;
	let postListComponent: any;

	// Success notification state
	let showSuccessToast = false;
	let successMessage = '';

	onMount(() => {
		loadModule();
		loadUserRole();
	});

	async function loadModule() {
		if (isLoading) return;

		isLoading = true;
		error = null;

		try {
			module = await courseService.getModule(moduleId);

			if (!module) {
				error = 'Módulo no encontrado';
				return;
			}
		} catch (err) {
			console.error('Error loading module:', err);
			error = err instanceof Error ? err.message : 'Error cargando el módulo';

			// If unauthorized, redirect to login
			if (error.includes('Authentication required')) {
				goto('/auth/login');
				return;
			}
		} finally {
			isLoading = false;
		}
	}

	async function loadUserRole() {
		try {
			// Get current user info - this should come from your auth store/context
			const response = await fetch('/api/auth/me', {
				credentials: 'include'
			});

			if (response.ok) {
				const result = await response.json();
				if (result.success && result.data?.user) {
					const user = result.data.user;
					userRole = user.role;
					canManagePosts = user.role === 'administrador' || user.role === 'colaborador';
				} else {
					console.log('No authenticated user found');
					canManagePosts = false;
				}
			}
		} catch (err) {
			console.error('Error loading user role:', err);
		}
	}

	function handleViewPost(event: CustomEvent) {
		const post = event.detail;
		viewingPost = post;
		showPostViewer = true;
	}

	function handleEditPost(event: CustomEvent) {
		const post = event.detail;
		editingPost = post;
		showPostEditor = true;
	}

	function handleDeletePost(event: CustomEvent) {
		const postId = event.detail;
		console.log('handleDeletePost called with postId:', postId);

		// Get the full post data from the PostList component
		const postData = postListComponent?.posts?.find((p: any) => p.id === postId);

		deletingPost = postData || {
			id: postId,
			title: 'Post',
			subtitle: null,
			content: '',
			authorName: '',
			authorId: '',
			moduleId,
			orderNumber: 0,
			isActive: true,
			createdAt: null,
			updatedAt: null
		};

		console.log('Setting showDeleteModal to true for post:', deletingPost.title);
		showDeleteModal = true;
	}

	async function confirmDeletePost() {
		console.log('confirmDeletePost called, deletingPost:', deletingPost);
		if (!deletingPost) {
			console.log('No deletingPost found, returning');
			return;
		}

		try {
			console.log('Calling modulePostService.deletePost with ID:', deletingPost.id);
			await modulePostService.deletePost(deletingPost.id);
			console.log('Post deleted successfully');

			showDeleteModal = false;

			// Remove post from the list
			if (postListComponent) {
				console.log('Removing post from list:', deletingPost.id);
				postListComponent.removePostFromList(deletingPost.id);
			} else {
				console.log('postListComponent not found');
			}

			// Update post count
			postCount--;
			deletingPost = null;
			console.log('Delete process completed, new postCount:', postCount);
		} catch (error) {
			console.error('Error deleting post:', error);
			// You might want to show an error message to the user
		}
	}

	function cancelDeletePost() {
		showDeleteModal = false;
		deletingPost = null;
	}

	function handleViewerClose() {
		showPostViewer = false;
		viewingPost = null;
	}

	function handleEditorClose() {
		showPostEditor = false;
		editingPost = null;
	}

	function handlePostCreated(event: CustomEvent) {
		// Show success message
		if (event.detail.message) {
			showSuccessMessage(event.detail.message);
		}

		// Reload the post list to show the new post
		if (postListComponent) {
			postListComponent.loadPosts();
		}

		postCount++;

		// Close the editor modal
		handleEditorClose();
	}

	function handlePostUpdated(event: CustomEvent) {
		// Show success message
		if (event.detail.message) {
			showSuccessMessage(event.detail.message);
		}

		// Reload the post list to show changes
		if (postListComponent) {
			postListComponent.loadPosts();
		}

		// Close the editor modal
		handleEditorClose();
	}

	function showSuccessMessage(message: string) {
		successMessage = message;
		showSuccessToast = true;
	}

	function handleToastClose() {
		showSuccessToast = false;
		successMessage = '';
	}

	function handlePostDeleted(event: CustomEvent) {
		console.log('Post deleted:', event.detail);
		// The PostList component will handle updating its own posts array
		// We just need to update the post count here
		postCount--;
	}

	function handlePostsLoaded(event: CustomEvent) {
		const posts = event.detail;
		postCount = posts.length;
	}

	function handlePostsReordered(event: CustomEvent) {
		console.log('Posts reordered:', event.detail);
		// Optionally show success message
	}

	function handleBackToCourse() {
		if (module?.courseId) {
			goto(`/courses/${module.courseId}`);
		} else {
			goto('/courses');
		}
	}
</script>

<svelte:head>
	<title>{module?.title || 'Módulo'} - Centro Cultural PVJ</title>
	<meta name="description" content={module?.description || 'Contenido del módulo'} />
</svelte:head>

<div class="module-detail-page">
	<!-- Header -->
	<div class="page-header">
		<div class="breadcrumb">
			<button class="breadcrumb-link" on:click={handleBackToCourse}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="15,18 9,12 15,6"></polyline>
				</svg>
				Volver al Curso
			</button>
		</div>

		{#if isLoading}
			<div class="loading-header">
				<LoadingSpinner />
				<span>Cargando módulo...</span>
			</div>
		{:else if error}
			<div class="error-header">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="15" y1="9" x2="9" y2="15"></line>
					<line x1="9" y1="9" x2="15" y2="15"></line>
				</svg>
				<div>
					<h1>Error</h1>
					<p>{error}</p>
				</div>
			</div>
		{:else if module}
			<div class="module-header">
				<div class="module-info">
					<div class="module-meta">
						<span class="module-order">Módulo #{module.orderNumber}</span>
						{#if !module.isActive}
							<span class="status-badge inactive">Inactivo</span>
						{/if}
					</div>
					<h1 class="module-title">{module.title}</h1>
					{#if module.description}
						<p class="module-description">{module.description}</p>
					{/if}
				</div>

				<div class="module-stats">
					<div class="stat-card">
						<div class="stat-number">{postCount}</div>
						<div class="stat-label">Posts</div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Content -->
	<div class="page-content">
		{#if isLoading}
			<div class="loading-container">
				<LoadingSpinner size="large" />
				<p>Cargando contenido del módulo...</p>
			</div>
		{:else if error}
			<div class="error-container">
				<div class="error-content">
					<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="15" y1="9" x2="9" y2="15"></line>
						<line x1="9" y1="9" x2="15" y2="15"></line>
					</svg>
					<h3>Ha ocurrido un error</h3>
					<p>{error}</p>
					<button class="btn btn-primary" on:click={loadModule}>
						Intentar de nuevo
					</button>
				</div>
			</div>
		{:else if module}
			<!-- Post List -->
			<PostList
				bind:this={postListComponent}
				moduleId={module.id}
				showActions={canManagePosts}
				on:viewPost={handleViewPost}
				on:editPost={handleEditPost}
				on:deletePost={handleDeletePost}
				on:postCreated={handlePostCreated}
				on:postUpdated={handlePostUpdated}
				on:postDeleted={handlePostDeleted}
				on:postsReordered={handlePostsReordered}
				on:postsLoaded={handlePostsLoaded}
			/>
		{/if}
	</div>
</div>

<!-- Post Viewer Modal -->
<PostViewer
	visible={showPostViewer}
	post={viewingPost}
	on:close={handleViewerClose}
/>

<!-- Post Editor Modal -->
{#if showPostEditor && editingPost && module}
	<PostForm
		visible={showPostEditor}
		moduleId={module.id}
		post={editingPost}
		nextOrderNumber={postCount + 1}
		on:created={handlePostCreated}
		on:updated={handlePostUpdated}
		on:close={handleEditorClose}
	/>
{/if}

<!-- Delete Confirmation Modal -->
<ConfirmationModal
	isOpen={showDeleteModal}
	title="Eliminar Post"
	message="¿Estás seguro de que deseas eliminar el post '{deletingPost?.title || 'Sin título'}'? Esta acción no se puede deshacer y se eliminará todo el contenido multimedia asociado."
	confirmText="Eliminar"
	type="danger"
	on:confirm={confirmDeletePost}
	on:cancel={cancelDeleteModal}
/>

<!-- Success Toast -->
<SuccessToast
	visible={showSuccessToast}
	message={successMessage}
	on:close={handleToastClose}
/>

<style>
	.module-detail-page {
		min-height: 100vh;
		background: var(--color-background-subtle);
	}

	.page-header {
		background: white;
		border-bottom: 1px solid var(--color-border);
		padding: 1.5rem 0;
	}

	.breadcrumb {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem 1rem 2rem;
		border-bottom: 1px solid var(--color-border-light);
		margin-bottom: 1.5rem;
	}

	.breadcrumb-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem 0;
		transition: color 0.2s ease;
	}

	.breadcrumb-link:hover {
		color: var(--color-primary);
	}

	.loading-header,
	.error-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.error-header {
		color: var(--color-danger);
	}

	.error-header h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.error-header p {
		margin: 0.25rem 0 0 0;
		color: var(--color-text-muted);
	}

	.module-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 2rem;
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.module-info {
		flex: 1;
		min-width: 0;
	}

	.module-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.module-order {
		color: var(--color-primary);
		font-weight: 600;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
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

	.status-badge.inactive {
		background: var(--color-warning-light);
		color: var(--color-warning-dark);
	}

	.module-title {
		margin: 0 0 1rem 0;
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-text-primary);
		line-height: 1.2;
	}

	.module-description {
		margin: 0;
		color: var(--color-text-muted);
		line-height: 1.6;
		font-size: 1.1rem;
		max-width: 600px;
	}

	.module-stats {
		flex-shrink: 0;
	}

	.stat-card {
		background: var(--color-primary-light);
		border: 2px solid var(--color-primary);
		border-radius: 12px;
		padding: 1.5rem;
		text-align: center;
		min-width: 100px;
	}

	.stat-number {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-primary-dark);
		line-height: 1;
	}

	.stat-label {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-primary-dark);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-top: 0.5rem;
	}

	.page-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		gap: 1rem;
	}

	.loading-container p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.error-container {
		display: flex;
		justify-content: center;
		padding: 4rem 2rem;
	}

	.error-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: 400px;
		gap: 1rem;
	}

	.error-content svg {
		color: var(--color-danger);
		opacity: 0.7;
	}

	.error-content h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.error-content p {
		margin: 0;
		color: var(--color-text-muted);
		line-height: 1.5;
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
		.page-header {
			padding: 1rem 0;
		}

		.breadcrumb {
			padding: 0 1rem 0.75rem 1rem;
			margin-bottom: 1rem;
		}

		.module-header {
			flex-direction: column;
			align-items: stretch;
			gap: 1.5rem;
			padding: 0 1rem;
		}

		.module-title {
			font-size: 1.75rem;
		}

		.module-description {
			font-size: 1rem;
		}

		.module-stats {
			align-self: flex-start;
		}

		.stat-card {
			padding: 1rem 1.5rem;
			display: inline-block;
		}

		.page-content {
			padding: 1.5rem 1rem;
		}

		.loading-container,
		.error-container {
			padding: 3rem 1rem;
		}
	}

	@media (max-width: 480px) {
		.module-title {
			font-size: 1.5rem;
		}

		.module-description {
			font-size: 0.95rem;
		}

		.page-content {
			padding: 1rem;
		}
	}
</style>