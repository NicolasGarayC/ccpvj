<script lang="ts">
  import { onMount } from 'svelte';
  import { t, translate } from '$lib/i18n';
  import { canCreateContent, canEditContent, requiresAuthentication, type UserRole } from '$lib/utils/roleUtils';
  import { jwtService } from '$lib/services/auth/jwtService.js';
  import { blogHttpService } from '$lib/services/blog/blogHttpService';
  import type { BlogPost } from '$lib/types/api';
  import MediaUploader from './MediaUploader.svelte';

  export let post: BlogPost | null = null;
  export let onSave: ((post: BlogPost) => void) | null = null;
  export let onCancel: (() => void) | null = null;
  export let currentUser: { role?: UserRole; id?: string } | null = null;

  // Translation function is available immediately
  let isLoading = false;
  let error: string | null = null;
  let success = false;

  // Formulario fields
  let title = '';
  let excerpt = '';
  let content = '';
  let slug = '';
  let status: 'draft' | 'published' = 'draft';
  let categoryId: string | null = null;
  let featuredMedia: string | null = null;
  let tags: string[] = [];

  // Categories
  let categories: any[] = [];

  // Role validation
  $: isEditing = !!post;
  $: canUserEdit = isEditing ? canEditContent(currentUser?.role) : canCreateContent(currentUser?.role);
  $: needsAuth = requiresAuthentication(currentUser?.role);

  // Check permissions on component load
  $: {
    if (!canUserEdit) {
      error = isEditing ? translate('auth.no_permissions_edit') : translate('auth.no_permissions_create');
    } else if (needsAuth && !currentUser?.id) {
      error = translate('auth.login_required');
    //} else if (isEditing && post && currentUser?.role !== 'Administrador' && post.authorId !== currentUser?.id) {
    //  error = t('auth.own_posts_only');
    } else {
      error = null;
    }
  }

  onMount(async () => {
    // Load categories
    try {
      categories = await blogHttpService.getCategories();
    } catch (err) {
      console.error('Error loading categories:', err);
    }

    // Load existing post data
    if (post) {
      title = post.title || '';
      excerpt = post.excerpt || '';
      content = post.content || '';
      slug = post.slug || '';
      status = post.status || 'draft';
      categoryId = post.categoryId || null;
      featuredMedia = post.featuredMedia || null;
      tags = post.tags || [];
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
      const basePost = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        slug: slug.trim(),
        status,
        categoryId: categoryId ?? null,
        featuredMedia: featuredMedia ?? undefined,
        tags
      };

      let result: BlogPost;
      if (post) {
        result = await blogHttpService.updatePost(String(post.id), basePost);
      } else {
        const createPayload = {
          ...basePost,
          publishDate: new Date().toISOString()
        };

        result = await blogHttpService.createPost(createPayload);
      }

      success = true;
      setTimeout(() => success = false, 3000);

      if (onSave) {
        onSave(result);
      }

      if (!post) {
        resetForm();
      }
    } catch (err: any) {
      error = err.message || 'Error al guardar el artículo';
      console.error('Error saving post:', err);
    } finally {
      isLoading = false;
    }
  }

  function resetForm() {
    title = '';
    excerpt = '';
    content = '';
    slug = '';
    status = 'draft';
    categoryId = null;
    featuredMedia = null;
    tags = [];
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
    featuredMedia = url;
  }
</script>

<div class="blog-form">
  <div class="form-header">
    <h2 class="form-title">
      📝 {post ? 'Editar Artículo' : 'Crear Nuevo Artículo'}
    </h2>
    <p class="form-subtitle">
      {post ? 'Modifica el contenido de tu artículo' : 'Comparte tus ideas con la comunidad'}
    </p>
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

  <form on:submit|preventDefault={handleSubmit} class="form-content">
    <!-- Información básica -->
    <div class="form-section">
      <h3 class="section-title">📝 Información Básica</h3>

      <div class="form-group full-width">
        <label for="title" class="label">
          Título del artículo <span class="required">*</span>
        </label>
        <input
          id="title"
          type="text"
          bind:value={title}
          class="input"
          placeholder="Ej: Nueva exposición en el Centro Cultural"
          maxlength="200"
          disabled={isLoading}
          required
        />
        <div class="character-count">
          {title.length}/200 caracteres
        </div>
      </div>

      <!-- Slug se genera automáticamente del título -->
    </div>

    <div class="form-section">
      <div class="form-group full-width">
        <label for="excerpt" class="label">
          📄 Resumen
        </label>
        <textarea
          id="excerpt"
          bind:value={excerpt}
          class="textarea"
          placeholder="Escribe un resumen breve que capture la esencia del artículo..."
          rows="4"
          maxlength="500"
          disabled={isLoading}
        ></textarea>
        <div class="character-count">
          {excerpt.length}/500 caracteres
        </div>
      </div>
    </div>

    <!-- Categoría y opciones -->
    <div class="form-section">
      <h3 class="section-title">🏷️ Categorización</h3>

      {#if categories.length > 0}
        <div class="form-group full-width">
          <label for="category" class="label">
            🗂️ Categoría
          </label>
          <select
            id="category"
            bind:value={categoryId}
            class="input"
            disabled={isLoading}
          >
            <option value={null}>Sin categoría</option>
            {#each categories as category}
              <option value={category.id}>{category.name}</option>
            {/each}
          </select>
          <p class="help-text">💡 Ayuda a organizar el contenido para los lectores</p>
        </div>
      {/if}

      <div class="form-row">
        <div class="form-group">
          <label for="status" class="label">
            📢 Estado de publicación
          </label>
          <select
            id="status"
            bind:value={status}
            class="input"
            disabled={isLoading}
          >
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
          </select>
          <p class="help-text">✨ Los artículos publicados serán visibles para todos los usuarios</p>
        </div>

        <div class="form-group">
          <label for="tags" class="label">
            🏷️ Etiquetas
          </label>
          <input
            id="tags"
            type="text"
            value={tags.join(', ')}
            on:input={(e) => {
              const value = e.currentTarget.value;
              tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            }}
            class="input"
            placeholder="Ej: cultura, arte, exposición"
            disabled={isLoading}
          />
          <p class="help-text">💡 Separa las etiquetas con comas</p>
        </div>
      </div>
    </div>

    <!-- Multimedia -->
    <div class="form-section">
      <h3 class="section-title">🎨 Imagen Destacada</h3>

	<div class="form-group">
		<p class="label">
			🖼️ Imagen Destacada
		</p>
        {#if post?.id}
          <MediaUploader
            contentType="blog"
            contentId={String(post.id)}
            mediaType="image"
            onUploadComplete={handleImageUploaded}
            disabled={isLoading}
          />
        {:else}
          <div class="help-text">
            💡 Guarda el artículo primero para poder subir archivos. Los demás elementos multimedia se pueden agregar al contenido usando el editor.
          </div>
        {/if}
        {#if featuredMedia}
          <div class="mt-2">
            <p class="text-sm text-gray-600">Imagen actual: {featuredMedia}</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="form-section">
      <h3 class="section-title">✍️ Contenido Principal</h3>

      <div class="form-group full-width">
        <label for="content" class="label">
          Contenido del artículo <span class="required">*</span>
        </label>
        <textarea
          id="content"
          bind:value={content}
          class="textarea"
          placeholder="Escribe el contenido completo del artículo. Puedes usar markdown para formatear el texto..."
          rows="15"
          disabled={isLoading}
          required
        ></textarea>
        <div class="character-count">
          {content.length} caracteres
        </div>
      </div>
    </div>

    <!-- Botones -->
    <div class="form-actions">
      <button
        type="button"
        on:click={handleCancel}
        class="btn btn-secondary"
        disabled={isLoading}
      >
        ❌ Cancelar
      </button>

      <button
        type="submit"
        disabled={isLoading || !title.trim() || !content.trim()}
        class="btn btn-primary"
      >
        {#if isLoading}
          <div class="loading-spinner"></div>
          ⏳ Guardando...
        {:else}
          ✨ {post ? 'Actualizar' : 'Crear'} Artículo
        {/if}
      </button>
    </div>
  </form>
</div>

<style>
  .blog-form {
    background: linear-gradient(to bottom right, #ffffff, #dbeafe, #ede9fe);
    border-radius: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    max-width: 56rem;
    margin-left: auto;
    margin-right: auto;
    border: 2px solid rgba(59, 130, 246, 0.1);
  }

  .form-header {
    background: linear-gradient(to right, #2563eb, #9333ea);
    color: white;
    padding: 1.5rem 2rem;
  }

  .form-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .form-subtitle {
    color: #dbeafe;
    font-weight: 500;
  }

  .form-content {
    padding: 2rem;
  }

  .form-content > * + * {
    margin-top: 2rem;
  }

  .form-section {
    background-color: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #f3f4f6;
  }

  .section-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 768px) {
    .form-row {
      grid-template-columns: 1fr 1fr;
    }
  }

  .form-group > * + * {
    margin-top: 0.5rem;
  }

  .form-group.full-width {
    grid-column: 1 / -1;
  }

  .label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .input {
    width: 100%;
    padding: 0.75rem 1rem;
    color: #111827;
    background-color: white;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease-in-out;
  }

  .input::placeholder {
    color: #9ca3af;
  }

  .input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .input:disabled {
    background-color: #f3f4f6;
    color: #6b7280;
    cursor: not-allowed;
  }

  .textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    color: #111827;
    background-color: white;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    resize: none;
    transition: all 0.2s ease-in-out;
  }

  .textarea::placeholder {
    color: #9ca3af;
  }

  .textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .textarea:disabled {
    background-color: #f3f4f6;
    color: #6b7280;
    cursor: not-allowed;
  }

  .required {
    color: #ef4444;
    font-weight: 700;
  }

  .character-count {
    font-size: 0.75rem;
    color: #6b7280;
    text-align: right;
  }

  .help-text {
    font-size: 0.875rem;
    color: #4b5563;
    background-color: #eff6ff;
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid #dbeafe;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    transition: all 0.2s ease-in-out;
  }

  .btn:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: linear-gradient(to right, #2563eb, #9333ea);
    color: white;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    transform: scale(1);
    transition: all 0.2s ease-in-out;
  }

  .btn-primary:hover {
    background: linear-gradient(to right, #1d4ed8, #7c3aed);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    transform: scale(1.05);
  }

  .btn-primary:active {
    transform: scale(0.95);
  }

  .btn-primary:focus {
    outline: 2px solid transparent;
    outline-offset: 2px;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.5);
  }

  .btn-secondary {
    background-color: white;
    color: #374151;
    border: 2px solid #d1d5db;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease-in-out;
  }

  .btn-secondary:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }

  .btn-secondary:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(156, 163, 175, 0.5);
  }

  .loading-spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid white;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
