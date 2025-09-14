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

<div class="group bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-transparent hover:border-blue-200 h-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative">
  <!-- Badge decorativo -->
  <div class="absolute top-3 right-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
    📰 NOTICIA
  </div>

  <!-- Media Content (Image or Video) con mejores estilos -->
  {#if post.featuredMedia}
    <div class="aspect-video bg-gradient-to-br from-slate-100 to-gray-100 flex items-center justify-center overflow-hidden relative">
      {#if isVideo(post.featuredMedia)}
        <div class="w-full h-full relative">
          <video
            class="w-full h-full object-cover rounded-t-2xl"
            controls
            preload="metadata"
            poster={post.videoPoster ? getMediaUrl(post.videoPoster) : ''}
          >
            <source src={getMediaUrl(post.featuredMedia)} type="video/mp4">
            <p class="absolute inset-0 flex items-center justify-center text-gray-600 bg-gray-100">
              {t('videoNotSupported') || 'Tu navegador no soporta video.'}
            </p>
          </video>
          <!-- Play icon overlay -->
          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
            <div class="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              <i class="fas fa-play text-blue-600 text-xl ml-1"></i>
            </div>
          </div>
        </div>
      {:else if isImage(post.featuredMedia)}
        <div class="w-full h-full relative overflow-hidden">
          <img
            src={getMediaUrl(post.featuredMedia)}
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
        <p class="text-gray-600 text-sm font-medium">{t('newsPost') || 'Artículo'}</p>
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
            {new Date(post.publishDate).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
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
          {t('readMore') || 'Leer más'}
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
              >
                <i class="fas fa-edit text-sm"></i>
              </button>
            {/if}

            {#if canDelete}
              <button
                on:click={handleDelete}
                class="p-2 text-red-600 bg-red-50 rounded-full hover:bg-red-100 hover:text-red-700 transition-colors duration-200 shadow-sm hover:shadow-md"
                title="Eliminar post"
              >
                <i class="fas fa-trash text-sm"></i>
              </button>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Eventos relacionados con mejor legibilidad -->
      {#if showRelatedEvents && (relatedEvents.length > 0 || loadingEvents)}
        <div class="mt-6 pt-4 border-t border-gray-100">
          <h4 class="text-sm font-bold text-gray-800 mb-3 flex items-center">
            <div class="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-2">
              <i class="fas fa-calendar-alt text-blue-600 text-xs"></i>
            </div>
            📅 Eventos relacionados
          </h4>

          {#if loadingEvents}
            <div class="flex items-center justify-center text-sm text-gray-600 py-4">
              <div class="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-3"></div>
              <span class="font-medium">Cargando eventos...</span>
            </div>
          {:else if relatedEvents.length > 0}
            <div class="space-y-3">
              {#each relatedEvents.slice(0, 3) as event}
                <div
                  class="group/event flex items-start justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 hover:shadow-sm"
                  on:click={() => window.open(`/calendar/event/${event.id}`, '_blank')}
                  role="button"
                  tabindex="0"
                  on:keydown={(e) => e.key === 'Enter' && window.open(`/calendar/event/${event.id}`, '_blank')}
                >
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-gray-900 truncate mb-1 group-hover/event:text-blue-800">
                      {event.title}
                    </p>
                    <div class="flex items-center space-x-2 text-xs text-gray-600">
                      <span class="bg-white px-2 py-1 rounded-full font-medium">
                        {event.eventType}
                      </span>
                      <span class="text-gray-400">•</span>
                      <span class="font-medium">
                        {new Intl.DateTimeFormat('es-ES', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(new Date(event.startDateTime))}
                      </span>
                    </div>
                  </div>
                  <div class="ml-3 text-gray-400 group-hover/event:text-blue-500 transition-colors">
                    <i class="fas fa-external-link-alt text-xs"></i>
                  </div>
                </div>
              {/each}

              {#if relatedEvents.length > 3}
                <div class="text-center pt-2">
                  <a
                    href={`/calendar?relatedBlogPost=${post.id}`}
                    class="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-semibold hover:bg-blue-50 px-3 py-2 rounded-full transition-all duration-200"
                  >
                    <span>Ver todos ({relatedEvents.length})</span>
                    <i class="fas fa-arrow-right ml-1.5 text-xs"></i>
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
