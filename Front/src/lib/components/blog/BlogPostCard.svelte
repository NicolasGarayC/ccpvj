<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { BlogPost } from '$lib/data/models/interfaces';
  import { calendarService, type EventSummary } from '$lib/services/calendar/calendarService';

  export let post: BlogPost;
  export let showActions = false;
  export let canEdit = false;
  export let canDelete = false;
  export let showRelatedEvents = true;

  const dispatch = createEventDispatcher();
  
  // Estado para eventos relacionados
  let relatedEvents: EventSummary[] = [];
  let loadingEvents = false;
  
  // Simple fallback translation function
  let t = (key: string) => {
    const translations = {
      'videoNotSupported': 'Tu navegador no soporta video.',
      'newsPost': 'Noticia',
      'readMore': 'Leer más'
    };
    return translations[key] || key;
  };

  onMount(async () => {
    // Try to load paraglide if available
    try {
      import('$lib/paraglide/runtime').then(module => {
        if (module.translate) {
          t = module.translate;
        }
      }).catch(err => {
        console.log('Paraglide not available, using fallback translations');
      });
    } catch (err) {
      console.log('Paraglide module not found, using fallback translations');
    }

    // Cargar eventos relacionados si está habilitado
    if (showRelatedEvents && post.id) {
      await loadRelatedEvents();
    }
  });

  async function loadRelatedEvents() {
    try {
      loadingEvents = true;
      relatedEvents = await calendarService.getEventsByBlogPost(post.id);
    } catch (error) {
      console.error('Error al cargar eventos relacionados:', error);
      relatedEvents = [];
    } finally {
      loadingEvents = false;
    }
  }

  // Función para obtener la URL completa del recurso desde nginx
  function getMediaUrl(path: string) {
    const NGINX_MEDIA_BASE = 'http://localhost:5251/media'; // Ajustar según tu configuración de nginx
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

  function handleEdit() {
    dispatch('edit', post.id);
  }

  function handleDelete() {
    dispatch('delete', post.id);
  }

  function handleView() {
    // Navigate to full post view
    window.location.href = `/blog/${post.slug}`;
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
    
    <!-- Actions -->
    <div class="mt-auto">
      <div class="flex justify-between items-center">
        <button 
          on:click={handleView}
          class="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-colors group"
        >
          {t('readMore') || 'Leer más'}
          <i class="fas fa-arrow-right ml-2 transform group-hover:translate-x-1 transition-transform"></i>
        </button>

        {#if showActions}
          <div class="flex gap-2">
            {#if canEdit}
              <button 
                on:click={handleEdit}
                class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                title="Editar post"
              >
                <i class="fas fa-edit"></i>
              </button>
            {/if}
            
            {#if canDelete}
              <button 
                on:click={handleDelete}
                class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                title="Eliminar post"
              >
                <i class="fas fa-trash"></i>
              </button>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Eventos relacionados -->
      {#if showRelatedEvents && (relatedEvents.length > 0 || loadingEvents)}
        <div class="mt-4 pt-4 border-t border-gray-200">
          <h4 class="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg class="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8V9a2 2 0 012-2h4a2 2 0 012 2v8m-6 4v-2"/>
            </svg>
            Eventos relacionados
          </h4>
          
          {#if loadingEvents}
            <div class="flex items-center text-sm text-gray-500">
              <div class="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
              Cargando eventos...
            </div>
          {:else if relatedEvents.length > 0}
            <div class="space-y-2">
              {#each relatedEvents.slice(0, 3) as event}
                <div 
                  class="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded text-sm cursor-pointer hover:bg-blue-100 transition-colors"
                  on:click={() => window.open(`/calendar/event/${event.id}`, '_blank')}
                  role="button"
                  tabindex="0"
                  on:keydown={(e) => e.key === 'Enter' && window.open(`/calendar/event/${event.id}`, '_blank')}
                >
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-blue-900 truncate">{event.title}</p>
                    <div class="flex items-center space-x-2 text-xs text-blue-700">
                      <span>{event.eventType}</span>
                      <span>•</span>
                      <span>
                        {new Intl.DateTimeFormat('es-ES', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(new Date(event.startDateTime))}
                      </span>
                    </div>
                  </div>
                  <svg class="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                </div>
              {/each}
              
              {#if relatedEvents.length > 3}
                <div class="text-center">
                  <a
                    href={`/calendar?relatedBlogPost=${post.id}`}
                    class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Ver todos ({relatedEvents.length})
                  </a>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
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
