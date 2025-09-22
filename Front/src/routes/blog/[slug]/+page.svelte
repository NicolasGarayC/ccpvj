<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { blogService } from '$lib/services/blog/blogService';
  import type { BlogPost } from '$lib/data/models/interfaces';

  import { t } from '$lib/i18n';

  let post: BlogPost | null = null;
  let isLoading = true;
  let error: string | null = null;


  $: slug = $page.params.slug;

  onMount(async () => {
    if (slug) {
      try {
        post = await blogService.getPostBySlug(slug);
        if (!post) {
          error = 'Noticia no encontrada';
        }
      } catch (e) {
        error = 'Error al cargar la noticia';
        console.error(error, e);
      } finally {
        isLoading = false;
      }
    }
  });

  function getMediaUrl(path: string) {
    const NGINX_MEDIA_BASE = 'http://localhost:5251/media';
    return `${NGINX_MEDIA_BASE}/${path}`;
  }

  function isVideo(mediaPath: string) {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoExtensions.some(ext => mediaPath.toLowerCase().endsWith(ext));
  }

  function isImage(mediaPath: string) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => mediaPath.toLowerCase().endsWith(ext));
  }
</script>

<svelte:head>
  {#if post}
    <title>{post.title} | {t('centroTitle') || 'Centro Cultural'}</title>
    <meta name="description" content={post.excerpt} />
  {:else}
    <title>{t('newsArticle') || 'Artículo'} | {t('centroTitle') || 'Centro Cultural'}</title>
  {/if}
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
  {#if isLoading}
    <div class="flex justify-center py-16">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  
  {:else if error || !post}
    <div class="text-center py-16">
      <div class="bg-red-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
        <i class="fas fa-exclamation-triangle text-red-500 text-3xl"></i>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-4">
        {error || (t('articleNotFound') || 'Artículo no encontrado')}
      </h1>
      <a 
        href="/blog" 
        class="inline-flex items-center bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <i class="fas fa-arrow-left mr-2"></i>
        {t('backToNews') || 'Volver a noticias'}
      </a>
    </div>

  {:else}
    <!-- Article Content -->
    <article>
      <!-- Back Navigation -->
      <div class="mb-8">
        <a 
          href="/blog" 
          class="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          <i class="fas fa-arrow-left mr-2"></i>
          {t('backToNews') || 'Volver a noticias'}
        </a>
      </div>

      <!-- Article Header -->
      <header class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
        
        <div class="flex items-center text-gray-600 text-sm space-x-4 mb-6">
          <time datetime={post.publishDate}>
            <i class="fas fa-calendar mr-1"></i>
            {new Date(post.publishDate).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </time>
          
          {#if post.authorName}
            <span>
              <i class="fas fa-user mr-1"></i>
              {post.authorName}
            </span>
          {/if}
        </div>

        <!-- Tags -->
        {#if post.tags && post.tags.length > 0}
          <div class="flex flex-wrap gap-2 mb-6">
            {#each post.tags as tag}
              <span class="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                #{tag}
              </span>
            {/each}
          </div>
        {/if}
      </header>

      <!-- Featured Media -->
      {#if post.featuredMedia}
        <div class="mb-8 rounded-lg overflow-hidden shadow-lg">
          {#if isVideo(post.featuredMedia)}
            <video
              class="w-full"
              controls
              poster={post.videoPoster ? getMediaUrl(post.videoPoster) : ''}
            >
              <source src={getMediaUrl(post.featuredMedia)} type="video/mp4">
              <track kind="captions" src="" label="Captions" default>
              <p class="text-gray-500 p-4">{t('videoNotSupported') || 'Tu navegador no soporta video.'}</p>
            </video>
          {:else if isImage(post.featuredMedia)}
            <img 
              src={getMediaUrl(post.featuredMedia)} 
              alt={post.title}
              class="w-full h-auto"
            />
          {/if}
        </div>
      {/if}

      <!-- Article Content -->
      <div class="prose prose-lg prose-indigo max-w-none">
        {#if post.content}
          {@html post.content}
        {:else}
          <p class="text-xl text-gray-700 leading-relaxed">{post.excerpt}</p>
        {/if}
      </div>

      <!-- Article Footer -->
      <footer class="mt-12 pt-8 border-t border-gray-200">
        <div class="text-center">
          <a 
            href="/blog" 
            class="inline-flex items-center bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {t('readMoreNews') || 'Leer más noticias'}
            <i class="fas fa-arrow-right ml-2"></i>
          </a>
        </div>
      </footer>
    </article>
  {/if}
</div>
