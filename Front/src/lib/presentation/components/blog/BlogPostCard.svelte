<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { BlogPost } from '$lib/types/api';
  import { t } from '$lib/i18n';
  import { blogPostElementService } from '$lib/application/services/blog/blogPostElementService';
  import { getBlogMediaUrl, getUntrackedMediaUrl } from '$lib/utils/mediaUtils';

  export let post: BlogPost;
  export let showActions = false;
  export let canEdit = false;
  export let canDelete = false;
  export let onEditCallback: ((event: CustomEvent<string>) => void) | undefined;
  export let onDeleteCallback: ((event: CustomEvent<string>) => void) | undefined;

  const dispatch = createEventDispatcher();

  let firstImagePath: string | null = null;
  let publishedAt: Date | null = null;

  onMount(async () => {
    // If there's no featured media, try to load the first image from elements
    if (!post.featuredMedia) {
      try {
        const elements = await blogPostElementService.getElementsByBlogPostId(String(post.id));
        const firstImage = elements.find(el => el.elementType === 'image' && el.filePath);
        if (firstImage?.filePath) {
          firstImagePath = firstImage.filePath;
        }
      } catch (error) {
        console.error('Error loading post elements for preview:', error);
      }
    }
  });

  $: publishedAt = post?.publishDate ? new Date(post.publishDate) : null;

  // Función para obtener la URL completa del recurso
  // Para visualización inline (como en el card), no necesitamos tracking
  // Solo para descargas explícitas
  function getMediaUrl(path: string) {
    // Remove leading slash and /media/ prefix if present
    const cleanPath = path.startsWith('/media/')
      ? path.substring(7)
      : path.startsWith('/')
        ? path.slice(1)
        : path;
    // Use untracked URL for inline display (images/videos in cards)
    return getUntrackedMediaUrl(cleanPath);
  }

  // Función para determinar si es un video
  function isVideo(mediaPath: string) {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoExtensions.some(ext => mediaPath.toLowerCase().endsWith(ext));
  }

  // Función para determinar si es una imagen
  function isImage(mediaPath: string) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => mediaPath.toLowerCase().endsWith(ext));
  }

  function handleEdit() {
    const event = new CustomEvent('edit', { detail: String(post.id) });
    onEditCallback?.(event);
    dispatch('edit', String(post.id));
  }

  function handleDelete() {
    const event = new CustomEvent('delete', { detail: String(post.id) });
    onDeleteCallback?.(event);
    dispatch('delete', String(post.id));
  }

  function handleView() {
    // Navigate to full post view
    window.location.href = `/blog/${post.slug}`;
  }
</script>

<div class="group bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-transparent hover:border-blue-200 h-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative">
  <!-- Badge decorativo -->
  <div class="absolute top-3 right-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
    📰 NOTICIA
  </div>

  <!-- Media Content (Image or Video) con mejores estilos -->
  {#if post.featuredMedia || firstImagePath}
    <div class="aspect-video bg-gradient-to-br from-slate-100 to-gray-100 flex items-center justify-center overflow-hidden relative">
      {#if post.featuredMedia && isVideo(post.featuredMedia)}
        <div class="w-full h-full relative">
          <video
            class="w-full h-full object-cover rounded-t-2xl"
            controls
            preload="metadata"
            poster={post.videoPoster ? getMediaUrl(post.videoPoster) : ''}
          >
            <source src={getMediaUrl(post.featuredMedia)} type="video/mp4">
            <track kind="captions" srclang="es" label="Subtítulos" />
            <p class="absolute inset-0 flex items-center justify-center text-gray-600 bg-gray-100">
              {$t('videoNotSupported') || 'Tu navegador no soporta video.'}
            </p>
          </video>
          <!-- Play icon overlay -->
          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
            <div class="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              <i class="fas fa-play text-blue-600 text-xl ml-1"></i>
            </div>
          </div>
        </div>
      {:else if (post.featuredMedia && isImage(post.featuredMedia)) || firstImagePath}
        <div class="w-full h-full relative overflow-hidden">
          <img
            src={getMediaUrl(post.featuredMedia || firstImagePath || '')}
            alt={post.title}
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <!-- Overlay sutil en hover -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      {:else}
        <!-- Fallback para tipos de media no reconocidos -->
        <div class="flex items-center justify-center w-full h-full bg-gradient-to-br from-slate-100 to-gray-100">
          <div class="text-center">
            <i class="fas fa-file text-gray-400 text-4xl mb-2"></i>
            <p class="text-gray-500 text-sm">Archivo multimedia</p>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Placeholder cuando no hay media - más neutro y legible -->
    <div class="aspect-video bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center relative">
      <!-- Elementos decorativos sutiles -->
      <div class="absolute top-4 left-4 w-3 h-3 bg-blue-200 rounded-full opacity-60"></div>
      <div class="absolute top-6 right-6 w-2 h-2 bg-purple-200 rounded-full opacity-40"></div>
      <div class="absolute bottom-4 left-6 w-4 h-4 bg-green-200 rounded-full opacity-30"></div>

      <div class="text-center relative z-10">
        <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-3 mx-auto">
          <i class="fas fa-newspaper text-gray-400 text-2xl"></i>
        </div>
        <p class="text-gray-600 text-sm font-medium">{$t('newsPost') || 'Artículo'}</p>
      </div>
    </div>
  {/if}
  
  <!-- Content con mejor legibilidad -->
  <div class="p-6 flex-1 flex flex-col">
    <!-- Metadata mejorada -->
    <div class="flex items-center justify-between text-sm mb-4">
      <div class="flex items-center space-x-3">
        <div class="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
          <i class="fas fa-calendar-alt mr-1.5 text-xs"></i>
          <time datetime={post.publishDate} class="font-medium">
            {publishedAt
              ? publishedAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
              : ''}
          </time>
        </div>
        {#if post.authorName}
          <div class="flex items-center text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
            <i class="fas fa-user mr-1.5 text-xs"></i>
            <span class="font-medium">{post.authorName}</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- Title con mejor tipografía -->
    <h3 class="text-xl font-bold mb-4 line-clamp-2 text-gray-900 leading-tight group-hover:text-blue-800 transition-colors duration-300">
      {post.title}
    </h3>

    <!-- Excerpt con mejor contraste -->
    <p class="text-gray-700 mb-6 flex-1 line-clamp-3 leading-relaxed text-sm">
      {post.excerpt}
    </p>
    
    <!-- Actions mejoradas -->
    <div class="mt-auto">
      <div class="flex justify-between items-center">
        <!-- Botón principal más atractivo pero legible -->
        <button
          on:click={handleView}
          class="inline-flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold px-4 py-2 rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:shadow-lg hover:scale-105 group"
        >
          <span class="mr-2">📖</span>
          {$t('readMore') || 'Leer más'}
          <i class="fas fa-arrow-right ml-2 transform group-hover:translate-x-1 transition-transform text-sm"></i>
        </button>

        <!-- Botones de acción con mejor contraste -->
        {#if showActions}
          <div class="flex gap-2">
            {#if canEdit}
              <button
                on:click={handleEdit}
                class="p-2 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
                title="Editar post"
                aria-label="Editar post"
              >
                <i class="fas fa-edit text-sm"></i>
              </button>
            {/if}

            {#if canDelete}
              <button
                on:click={handleDelete}
                class="p-2 text-red-600 bg-red-50 rounded-full hover:bg-red-100 hover:text-red-700 transition-colors duration-200 shadow-sm hover:shadow-md"
                title="Eliminar post"
                aria-label="Eliminar post"
              >
                <i class="fas fa-trash text-sm"></i>
              </button>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    overflow: hidden;
  }
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    line-clamp: 3;
    overflow: hidden;
  }
</style>
