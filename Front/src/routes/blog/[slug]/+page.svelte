<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { blogService } from '$lib/services/blog/blogService';
  import { blogPostElementService } from '$lib/services/blog/blogPostElementService';
  import { calendarService, type EventSummary } from '$lib/services/calendar/calendarService';
  import type { BlogPost } from '$lib/types/api';
  import type { BlogPostElement } from '$lib/services/blog/blogPostElementService';
  import { getBlogMediaUrl, getUntrackedMediaUrl } from '$lib/utils/mediaUtils';

  import { t } from '$lib/i18n';

  let post: BlogPost | null = null;
  let elements: BlogPostElement[] = [];
  let relatedEvents: EventSummary[] = [];
  let isLoading = true;
  let error: string | null = null;


  $: slug = $page.params.slug;

  onMount(async () => {
    if (slug) {
      try {
        post = await blogService.getPostBySlug(slug);
        if (!post) {
          error = 'Noticia no encontrada';
        } else {
			// Load blog post elements
			elements = await blogPostElementService.getElementsByBlogPostId(String(post.id));
          elements = elements.sort((a, b) => a.orderNumber - b.orderNumber);

          // Load related events
          try {
				relatedEvents = await calendarService.getEventsByBlogPost(String(post.id));
          } catch (e) {
            console.error('Error al cargar eventos relacionados:', e);
            relatedEvents = [];
          }
        }
      } catch (e) {
        error = 'Error al cargar la noticia';
        console.error(error, e);
      } finally {
        isLoading = false;
      }
    }
  });

  function getMediaUrl(path: string, enableTracking: boolean = false) {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // For downloadable media (audio, video, documents), use tracking
	if (enableTracking && post) {
		return getBlogMediaUrl(String(post.id), cleanPath);
    }

    // For inline images (thumbnails, etc), use untracked URL
    return getUntrackedMediaUrl(cleanPath);
  }

  function stripProtocol(path: string): string {
    return path.replace(/^https?:\/\/[^/]+/i, '');
  }

  function normalizeMediaPath(path: string | null | undefined): string | null {
    if (!path) return null;
    const withoutQuery = path.split('?')[0].split('#')[0];
    const noProtocol = stripProtocol(withoutQuery);
    return noProtocol
      .replace(/^\/+/, '')
      .replace(/^media\//i, '')
      .replace(/^back\/data\/media\//i, '')
      .trim() || null;
  }

  function extractMediaInfo(path: string | null | undefined) {
    const normalized = normalizeMediaPath(path);
    if (!normalized) return null;
    const segments = normalized.split('/');
    const fileName = segments[segments.length - 1] || null;
    return {
      normalized,
      fileName
    };
  }

  $: featuredMediaInfo = extractMediaInfo(post?.featuredMedia);

  function isSameAsFeatured(filePath: string | null | undefined): boolean {
    if (!filePath || !featuredMediaInfo) return false;
    const candidate = extractMediaInfo(filePath);
    if (!candidate) return false;

    if (candidate.normalized === featuredMediaInfo.normalized) return true;
    if (
      candidate.normalized &&
      featuredMediaInfo.normalized &&
      (candidate.normalized.endsWith(featuredMediaInfo.normalized) ||
        featuredMediaInfo.normalized.endsWith(candidate.normalized))
    ) {
      return true;
    }
    return candidate.fileName !== null && candidate.fileName === featuredMediaInfo.fileName;
  }

  $: featuredInline =
    Boolean(featuredMediaInfo) &&
    elements.some((el) => el.elementType === 'image' && isSameAsFeatured(el.filePath));

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
    <title>{post.title} | {$t('centroTitle') || 'Centro Cultural'}</title>
    <meta name="description" content={post.excerpt} />
  {:else}
    <title>{$t('newsArticle') || 'Artículo'} | {$t('centroTitle') || 'Centro Cultural'}</title>
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
		{error || ($t('articleNotFound') || 'Artículo no encontrado')}
      </h1>
      <a
        href="/blog"
        class="inline-flex items-center bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <i class="fas fa-arrow-left mr-2"></i>
        {$t('backToNews') || 'Volver a noticias'}
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
          {$t('backToNews') || 'Volver a noticias'}
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
      {#if post.featuredMedia && !featuredInline}
        <div class="mb-8 rounded-lg overflow-hidden shadow-lg">
          {#if isVideo(post.featuredMedia)}
            <video
              class="w-full"
              controls
              poster={post.videoPoster ? getMediaUrl(post.videoPoster, false) : ''}
            >
              <source src={getMediaUrl(post.featuredMedia, true)} type="video/mp4">
              <track kind="captions" src="" label="Captions" default>
              <p class="text-gray-500 p-4">{$t('videoNotSupported') || 'Tu navegador no soporta video.'}</p>
            </video>
          {:else if isImage(post.featuredMedia)}
            <img
              src={getMediaUrl(post.featuredMedia, false)}
              alt={post.title}
              class="w-full h-auto"
            />
          {/if}
        </div>
      {/if}

      <!-- Article Content - Display Elements -->
      <div class="space-y-6">
        {#if elements && elements.length > 0}
          {#each elements as element}
            {#if element.elementType === 'title'}
              <h2 class="text-3xl font-bold text-gray-900 mt-8 mb-4">{element.content}</h2>

            {:else if element.elementType === 'text'}
              <div class="prose prose-lg prose-indigo max-w-none">
                <p class="text-gray-700 leading-relaxed">{element.content}</p>
              </div>

            {:else if element.elementType === 'image' && element.filePath}
              <div class="my-6 rounded-lg overflow-hidden shadow-lg">
                <img
                  src={getMediaUrl(element.filePath, false)}
                  alt={element.fileName || 'Imagen del artículo'}
                  class="w-full h-auto"
                />
              </div>

            {:else if element.elementType === 'video' && element.filePath}
              <div class="my-6 rounded-lg overflow-hidden shadow-lg">
                <video
                  class="w-full"
                  controls
                >
                  <source src={getMediaUrl(element.filePath, true)} type={element.mimeType || 'video/mp4'}>
                  <track kind="captions" src="" label="Captions" default>
                  <p class="text-gray-500 p-4">{$t('videoNotSupported') || 'Tu navegador no soporta video.'}</p>
                </video>
              </div>

            {:else if element.elementType === 'audio' && element.filePath}
              <div class="my-6 p-4 bg-gray-100 rounded-lg">
                <audio
                  class="w-full"
                  controls
                >
                  <source src={getMediaUrl(element.filePath, true)} type={element.mimeType || 'audio/mp3'}>
                  <p class="text-gray-500">{$t('audioNotSupported') || 'Tu navegador no soporta audio.'}</p>
                </audio>
              </div>
            {/if}
          {/each}
        {:else if post.content}
          <div class="prose prose-lg prose-indigo max-w-none">
            {@html post.content}
          </div>
        {:else}
          <div class="prose prose-lg prose-indigo max-w-none">
            <p class="text-xl text-gray-700 leading-relaxed">{post.excerpt}</p>
          </div>
        {/if}
      </div>

      <!-- Related Events -->
      {#if relatedEvents && relatedEvents.length > 0}
        <section class="mt-12 pt-8 border-t border-gray-200">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <svg class="w-6 h-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8V9a2 2 0 012-2h4a2 2 0 012 2v8m-6 4v-2"/>
            </svg>
            Eventos Relacionados
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {#each relatedEvents as event}
              <div
                class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                on:click={() => goto(`/calendar/event/${event.id}`)}
                on:keydown={(e) => e.key === 'Enter' && goto(`/calendar/event/${event.id}`)}
                role="button"
                tabindex="0"
              >
                {#if event.imagePath}
                  <div class="h-48 bg-gray-200">
                    <img
                      src={event.imagePath}
                      alt={event.title}
                      class="w-full h-full object-cover"
                    />
                  </div>
                {:else}
                  <div class="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <svg class="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8V9a2 2 0 012-2h4a2 2 0 012 2v8m-6 4v-2"/>
                    </svg>
                  </div>
                {/if}

                <div class="p-4">
                  <div class="flex items-center space-x-2 mb-2">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {event.eventType}
                    </span>
                    {#if event.isFeatured}
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        Destacado
                      </span>
                    {/if}
                  </div>

                  <h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>

                  <div class="flex items-center text-sm text-gray-600 space-x-4">
                    <div class="flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8V9a2 2 0 012-2h4a2 2 0 012 2v8m-6 4v-2"/>
                      </svg>
                      {new Date(event.startDateTime).toLocaleDateString('es-ES', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    {#if !event.isAllDay}
                      <div class="flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {new Date(event.startDateTime).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    {/if}
                  </div>

                  {#if event.location}
                    <div class="flex items-center text-sm text-gray-600 mt-2">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      <span class="truncate">{event.location}</span>
                    </div>
                  {/if}

                  {#if event.description}
                    <p class="text-sm text-gray-600 mt-3 line-clamp-2">{event.description}</p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <!-- Article Footer -->
      <footer class="mt-12 pt-8 border-t border-gray-200">
        <div class="text-center">
          <a
            href="/blog"
            class="inline-flex items-center bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {$t('readMoreNews') || 'Leer más noticias'}
            <i class="fas fa-arrow-right ml-2"></i>
          </a>
        </div>
      </footer>
    </article>
  {/if}
</div>
