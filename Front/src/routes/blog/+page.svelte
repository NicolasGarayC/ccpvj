<script lang="ts">
  import { onMount } from 'svelte';
  import BlogPostList from '$lib/components/blog/BlogPostList.svelte';
  import ConfirmationModal from '$lib/components/common/ConfirmationModal.svelte';
  import SuccessToast from '$lib/components/common/SuccessToast.svelte';
  import type { BlogPost } from '$lib/types/api';
  import { jwtService } from '$lib/services/auth/jwtService.js';
  import { blogHttpService } from '$lib/services/blog/blogHttpService';
  import { t } from '$lib/i18n';

  // Variables para permisos de usuario
  let isAuthenticated = false;
  let canManageArticles = false;

  // Referencias al componente de lista
  let blogPostListComponent: any;

  // Delete confirmation
  let showDeleteModal = false;
  let deletingPost: BlogPost | null = null;

  // Success notification
  let showSuccessToast = false;
  let successMessage = '';

  onMount(async () => {
    // Verificar autenticación y permisos
    isAuthenticated = jwtService.isAuthenticated();
    if (isAuthenticated) {
      const user = jwtService.getUser();
      canManageArticles = user?.role === 'colaborador' || user?.role === 'administrador';
    }
  });

  function handleDeletePost(event: CustomEvent) {
    const post = event.detail;
    deletingPost = post;
    showDeleteModal = true;
  }

  async function confirmDeletePost() {
    if (!deletingPost) return;

	try {
		await blogHttpService.deletePost(String(deletingPost.id));

      showDeleteModal = false;

      // Remove from list
      if (blogPostListComponent) {
        blogPostListComponent.removePostFromList(deletingPost.id);
      }

      deletingPost = null;
      showSuccessMessage('Artículo eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting post:', error);
      showSuccessMessage('Error al eliminar el artículo');
    }
  }

  function cancelDeletePost() {
    showDeleteModal = false;
    deletingPost = null;
  }

  function handlePostCreated(event: CustomEvent) {
    if (event.detail.message) {
      showSuccessMessage(event.detail.message);
    }
  }

  function handlePostUpdated(event: CustomEvent) {
    if (event.detail.message) {
      showSuccessMessage(event.detail.message);
    }
  }

  function showSuccessMessage(message: string) {
    successMessage = message;
    showSuccessToast = true;
  }

  function handleToastClose() {
    showSuccessToast = false;
    successMessage = '';
  }
</script>

<svelte:head>
  <title>{$t('newsAndAnnouncements') || 'Noticias y Anuncios'} | {$t('centroTitle') || 'Centro Cultural'}</title>
  <meta name="description" content={$t('blogDescription') || 'Mantente informado con las últimas noticias y anuncios del Centro Cultural Popular Víctor Jara'} />
</svelte:head>

<div class="blog-page">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <h1 class="page-title">
        <span class="icon">📰</span>
        <span class="gradient-text">{$t('newsAndAnnouncements') || 'Noticias y Anuncios'}</span>
      </h1>
      <p class="page-description">
        {$t('stayUpdated') || 'Mantente informado sobre las últimas actividades, proyectos y eventos de nuestra comunidad educativa.'}
      </p>
    </div>
  </div>

  <!-- Content -->
  <div class="page-content">
    <BlogPostList
      bind:this={blogPostListComponent}
      showActions={canManageArticles}
      on:deletePost={handleDeletePost}
      on:postCreated={handlePostCreated}
      on:postUpdated={handlePostUpdated}
    />
  </div>
</div>

<!-- Delete Confirmation Modal -->
<ConfirmationModal
  isOpen={showDeleteModal}
  title="Eliminar Artículo"
  message="¿Estás seguro de que deseas eliminar el artículo '{deletingPost?.title || 'Sin título'}'? Esta acción no se puede deshacer."
  confirmText="Eliminar"
  type="danger"
  on:confirm={confirmDeletePost}
  on:cancel={cancelDeletePost}
/>

<!-- Success Toast -->
<SuccessToast
  visible={showSuccessToast}
  message={successMessage}
  on:close={handleToastClose}
/>

<style>
  .blog-page {
    min-height: 100vh;
    background: var(--color-background-subtle, #f9fafb);
  }

  .page-header {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 2rem 0;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .page-title {
    margin: 0 0 0.5rem 0;
    font-size: 2.5rem;
    font-weight: 700;
    color: #111827;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .icon {
    font-size: 2.5rem;
  }

  .gradient-text {
    background: linear-gradient(to right, #1e40af, #111827);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .page-description {
    margin: 0;
    font-size: 1.125rem;
    color: #6b7280;
    line-height: 1.6;
  }

  .page-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  @media (max-width: 768px) {
    .page-header {
      padding: 1.5rem 0;
    }

    .header-content {
      padding: 0 1rem;
    }

    .page-title {
      font-size: 2rem;
    }

    .page-description {
      font-size: 1rem;
    }

    .page-content {
      padding: 1.5rem 1rem;
    }
  }
</style>
