<script lang="ts">
  import { t as paraglideT } from '$lib/paraglide/runtime';
  import { onMount } from 'svelte';
  import type { BlogPost } from '$lib/data/models/interfaces';

  export let post: BlogPost;
  
  let t = (key: string) => key;

  onMount(() => {
    t = paraglideT;
  });

  // Función para obtener la URL completa del recurso desde nginx
  function getMediaUrl(path: string) {
    const NGINX_MEDIA_BASE = 'http://localhost/media'; // Ajustar según tu configuración de nginx
    return `${NGINX_MEDIA_BASE}/${path}`;
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
</script>

<div class="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 h-full flex flex-col">
  <!-- Media Content (Image or Video) -->
  {#if post.featuredMedia}
    <div class="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
      {#if isVideo(post.featuredMedia)}
        <video 
          class="w-full h-full object-cover" 
          controls
          preload="metadata"
          poster={post.videoPoster ? getMediaUrl(post.videoPoster) : ''}
        >
          <source src={getMediaUrl(post.featuredMedia)} type="video/mp4">
          <p class="text-gray-500">{t('videoNotSupported') || 'Tu navegador no soporta video.'}</p>
        </video>
      {:else if isImage(post.featuredMedia)}
        <img 
          src={getMediaUrl(post.featuredMedia)} 
          alt={post.title}
          class="w-full h-full object-cover"
          loading="lazy"
        />
      {:else}
        <!-- Fallback para tipos de media no reconocidos -->
        <div class="flex items-center justify-center w-full h-full bg-indigo-100">
          <i class="fas fa-file text-indigo-500 text-3xl"></i>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Placeholder cuando no hay media -->
    <div class="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
      <div class="text-center">
        <i class="fas fa-newspaper text-indigo-400 text-4xl mb-2"></i>
        <p class="text-indigo-600 text-sm font-medium">{t('newsPost') || 'Noticia'}</p>
      </div>
    </div>
  {/if}
  
  <!-- Content -->
  <div class="p-6 flex-1 flex flex-col">
    <!-- Metadata -->
    <div class="flex items-center justify-between text-sm text-gray-500 mb-3">
      <time datetime={post.publishDate}>
        {new Date(post.publishDate).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </time>
      {#if post.authorName}
        <span class="flex items-center">
          <i class="fas fa-user mr-1"></i>
          {post.authorName}
        </span>
      {/if}
    </div>

    <!-- Title -->
    <h3 class="text-xl font-bold mb-3 line-clamp-2">{post.title}</h3>
    
    <!-- Excerpt -->
    <p class="text-gray-600 mb-4 flex-1 line-clamp-3">{post.excerpt}</p>
    
    <!-- Read more link -->
    <div class="mt-auto">
      <a 
        href={`/blog/${post.slug}`} 
        class="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-colors group"
      >
        {t('readMore') || 'Leer más'}
        <i class="fas fa-arrow-right ml-2 transform group-hover:translate-x-1 transition-transform"></i>
      </a>
    </div>
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
