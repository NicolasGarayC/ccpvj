<script lang="ts">
  import { onMount } from 'svelte';
  import { translate as paraglideT } from '$lib/paraglide/runtime';
  import { canCreateContent, canEditContent, requiresAuthentication, type UserRole } from '$lib/utils/roleUtils';
  import MediaUploader from './MediaUploader.svelte';

  export let post: any | null = null;
  export let onSave: ((post: any) => void) | null = null;
  export let onCancel: (() => void) | null = null;
  export let currentUser: { role?: UserRole; id?: string } | null = null;

  let t = (key: string) => key;
  let isLoading = false;
  let error: string | null = null;
  let success = false;

  // Formulario fields
  let title = '';
  let summary = '';
  let content = '';
  let slug = '';
  let isPublished = false;
  let isFeatured = false;
  let categoryId: string | null = null;
  let featuredImagePath: string | null = null;
  let pdfPath: string | null = null;
  let videoPath: string | null = null;

  // Categories
  let categories: any[] = [];

  // Role validation
  $: isEditing = !!post;
  $: canUserEdit = isEditing ? canEditContent(currentUser?.role) : canCreateContent(currentUser?.role);
  $: needsAuth = requiresAuthentication(currentUser?.role);

  // Check permissions on component load
  $: {
    if (!canUserEdit) {
      error = `No tienes permisos para ${isEditing ? 'editar' : 'crear'} posts del blog. Necesitas ser Colaborador o Administrador.`;
    } else if (needsAuth && !currentUser?.id) {
      error = 'Debes iniciar sesión para realizar esta acción.';
    } else if (isEditing && post && currentUser?.role !== 'Administrador' && post.authorId !== currentUser?.id) {
      error = 'Solo puedes editar tus propios posts o ser Administrador.';
    } else {
      error = null;
    }
  }

  onMount(async () => {
    t = paraglideT;
    
    // Load categories
    try {
      const response = await fetch('/api/blogcategory');
      if (response.ok) {
        categories = await response.json();
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }

    // Load existing post data
    if (post) {
      title = post.title || '';
      summary = post.summary || '';
      content = post.content || '';
      slug = post.slug || '';
      isPublished = post.isPublished || false;
      isFeatured = post.isFeatured || false;
      categoryId = post.categoryId || null;
      featuredImagePath = post.featuredImagePath || null;
      pdfPath = post.pdfPath || null;
      videoPath = post.videoPath || null;
    }
  });

  // Auto-generate slug from title
  $: if (title && (!post || post.title !== title)) {
    slug = generateSlug(title);
  }

  function generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) {
      error = 'El título y contenido son obligatorios';
      return;
    }

    isLoading = true;
    error = null;

    try {
      const postData = {
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim() || null,
        slug: slug.trim(),
        isPublished,
        isFeatured,
        categoryId: categoryId || null,
        featuredImagePath,
        pdfPath,
        videoPath
      };

      const url = post ? `/api/blog/${post.id}` : '/api/blog';
      const method = post ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Error al guardar el post');
      }

      const result = await response.json();
      
      success = true;
      setTimeout(() => success = false, 3000);
      
      if (onSave) {
        onSave(result);
      }
      
      if (!post) {
        resetForm();
      }
    } catch (err: any) {
      error = err.message || 'Error al guardar el post';
      console.error('Error saving post:', err);
    } finally {
      isLoading = false;
    }
  }

  function resetForm() {
    title = '';
    summary = '';
    content = '';
    slug = '';
    isPublished = false;
    isFeatured = false;
    categoryId = null;
    featuredImagePath = null;
    pdfPath = null;
    videoPath = null;
  }

  function handleCancel() {
    if (onCancel) {
      onCancel();
    } else {
      resetForm();
    }
  }

  // Handle contextual media uploads
  function handleImageUploaded(url: string) {
    featuredImagePath = url;
  }

  function handleVideoUploaded(url: string) {
    videoPath = url;
  }

  function handlePdfUploaded(url: string) {
    pdfPath = url;
  }
</script>

<div class="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-bold">
      {post ? 'Editar Artículo' : 'Crear Nuevo Artículo'}
    </h2>
    <div class="flex gap-2">
      <button
        type="button"
        on:click={handleCancel}
        class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        disabled={isLoading}
      >
        Cancelar
      </button>
      <button
        type="button"
        on:click={handleSubmit}
        class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
        disabled={isLoading || !title.trim() || !content.trim()}
      >
        {#if isLoading}
          <i class="fas fa-spinner fa-spin mr-2"></i>
        {/if}
        {post ? 'Actualizar' : 'Crear Artículo'}
      </button>
    </div>
  </div>

  <!-- Mensajes -->
  {#if error}
    <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
      <div class="flex items-center">
        <i class="fas fa-exclamation-circle text-red-500 mr-2"></i>
        <span class="text-red-700 text-sm">{error}</span>
      </div>
    </div>
  {/if}

  {#if success}
    <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
      <div class="flex items-center">
        <i class="fas fa-check-circle text-green-500 mr-2"></i>
        <span class="text-green-700 text-sm">Artículo guardado exitosamente</span>
      </div>
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="space-y-6">
    <!-- Título -->
    <div>
      <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
        Título *
      </label>
      <input
        id="title"
        type="text"
        bind:value={title}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="Ingresa el título del artículo"
        disabled={isLoading}
        required
      />
    </div>

    <!-- Slug -->
    <div>
      <label for="slug" class="block text-sm font-medium text-gray-700 mb-2">
        Slug (URL)
      </label>
      <input
        id="slug"
        type="text"
        bind:value={slug}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="url-del-articulo"
        disabled={isLoading}
      />
      {#if slug}
        <p class="mt-1 text-xs text-gray-500">URL: /blog/{slug}</p>
      {/if}
    </div>

    <!-- Resumen -->
    <div>
      <label for="summary" class="block text-sm font-medium text-gray-700 mb-2">
        Resumen
      </label>
      <textarea
        id="summary"
        bind:value={summary}
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="Resumen breve del artículo"
        disabled={isLoading}
      ></textarea>
    </div>

    <!-- Categoría -->
    {#if categories.length > 0}
      <div>
        <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
          Categoría
        </label>
        <select
          id="category"
          bind:value={categoryId}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          disabled={isLoading}
        >
          <option value={null}>Sin categoría</option>
          {#each categories as category}
            <option value={category.id}>{category.name}</option>
          {/each}
        </select>
      </div>
    {/if}

    <!-- Imagen Destacada -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Imagen Destacada
      </label>
      {#if post?.id}
        <MediaUploader
          contentType="blog"
          contentId={post.id}
          mediaType="image"
          onUploadComplete={handleImageUploaded}
          currentMedia={featuredImagePath}
          disabled={isLoading}
        />
      {:else}
        <p class="text-sm text-gray-500 p-3 border border-gray-200 rounded-md">
          Guarda el artículo primero para poder subir archivos
        </p>
      {/if}
    </div>

    <!-- Video -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Video
      </label>
      {#if post?.id}
        <MediaUploader
          contentType="blog"
          contentId={post.id}
          mediaType="video"
          onUploadComplete={handleVideoUploaded}
          currentMedia={videoPath}
          disabled={isLoading}
        />
      {:else}
        <p class="text-sm text-gray-500 p-3 border border-gray-200 rounded-md">
          Guarda el artículo primero para poder subir archivos
        </p>
      {/if}
    </div>

    <!-- PDF -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Documento PDF
      </label>
      {#if post?.id}
        <MediaUploader
          contentType="blog"
          contentId={post.id}
          mediaType="pdf"
          onUploadComplete={handlePdfUploaded}
          currentMedia={pdfPath}
          disabled={isLoading}
        />
      {:else}
        <p class="text-sm text-gray-500 p-3 border border-gray-200 rounded-md">
          Guarda el artículo primero para poder subir archivos
        </p>
      {/if}
    </div>

    <!-- Contenido -->
    <div>
      <label for="content" class="block text-sm font-medium text-gray-700 mb-2">
        Contenido *
      </label>
      <textarea
        id="content"
        bind:value={content}
        rows="12"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="Escribe el contenido completo del artículo..."
        disabled={isLoading}
        required
      ></textarea>
    </div>

    <!-- Opciones de publicación -->
    <div class="flex items-center gap-6">
      <div class="flex items-center">
        <input
          id="published"
          type="checkbox"
          bind:checked={isPublished}
          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          disabled={isLoading}
        />
        <label for="published" class="ml-2 block text-sm text-gray-700">
          Publicar inmediatamente
        </label>
      </div>
      
      <div class="flex items-center">
        <input
          id="featured"
          type="checkbox"
          bind:checked={isFeatured}
          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          disabled={isLoading}
        />
        <label for="featured" class="ml-2 block text-sm text-gray-700">
          Artículo destacado
        </label>
      </div>
    </div>
  </form>
</div>