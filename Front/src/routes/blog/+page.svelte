<script lang="ts">
  import { onMount } from 'svelte';
  import { blogService } from '$lib/services/blog/blogService';
  import BlogPostCard from '$lib/components/blog/BlogPostCard.svelte';
  import type { BlogPost } from '$lib/data/models/interfaces';
  
  // Simple fallback translation function
  let t = (key: string) => {
    const translations = {
      'newsAndAnnouncements': 'Noticias y Anuncios',
      'centroTitle': 'Centro Cultural',
      'blogDescription': 'Mantente informado con las últimas noticias y anuncios del Centro Cultural Víctor Jara',
      'stayUpdated': 'Mantente informado sobre las últimas actividades, cursos y eventos de nuestra comunidad educativa.',
      'allNews': 'Todas las noticias',
      'loading': 'Cargando...',
      'tryAgain': 'Intentar de nuevo',
      'noNewsInCategory': 'No hay noticias en esta categoría',
      'noBlogPostsYet': 'Aún no hay noticias disponibles',
      'tryDifferentCategory': 'Prueba con una categoría diferente o ve todas las noticias',
      'checkBackSoon': 'Vuelve pronto para ver las últimas novedades de nuestra comunidad',
      'seeAllNews': 'Ver todas las noticias',
      'backToHome': 'Volver al inicio'
    };
    return translations[key] || key;
  };
  
  onMount(() => {
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
  });
  
  let posts: BlogPost[] = [];
  let isLoading = true;
  let error: string | null = null;
  let selectedTag: string | null = null;
  
  // Obtener tags únicos para filtro
  $: uniqueTags = [...new Set(posts.flatMap(post => post.tags || []))].sort();
  
  // Filtrar posts por tag seleccionado
  $: filteredPosts = selectedTag 
    ? posts.filter(post => post.tags?.includes(selectedTag))
    : posts;
  
  onMount(async () => {
    try {
      posts = await blogService.getAllPosts();
    } catch (e) {
      error = 'Error al cargar las noticias';
      console.error(error, e);
    } finally {
      isLoading = false;
    }
  });

  function selectTag(tag: string | null) {
    selectedTag = tag;
  }
</script>

<svelte:head>
  <title>{t('newsAndAnnouncements') || 'Noticias y Anuncios'} | {t('centroTitle') || 'Centro Cultural'}</title>
  <meta name="description" content={t('blogDescription') || 'Mantente informado con las últimas noticias y anuncios del Centro Cultural Víctor Jara'} />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
  <!-- Header -->
  <div class="text-center mb-12">
    <h1 class="text-4xl font-bold mb-4">{t('newsAndAnnouncements') || 'Noticias y Anuncios'}</h1>
    <p class="text-xl text-gray-600 max-w-2xl mx-auto">
      {t('stayUpdated') || 'Mantente informado sobre las últimas actividades, cursos y eventos de nuestra comunidad educativa.'}
    </p>
  </div>

  <!-- Filtros por Tags -->
  {#if uniqueTags.length > 0}
    <div class="mb-8">
      <div class="flex flex-wrap justify-center gap-2">
        <button
          class="px-4 py-2 rounded-full text-sm font-medium transition-colors {selectedTag === null ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
          on:click={() => selectTag(null)}
        >
          {t('allNews') || 'Todas las noticias'}
        </button>
        {#each uniqueTags as tag}
          <button
            class="px-4 py-2 rounded-full text-sm font-medium transition-colors {selectedTag === tag ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
            on:click={() => selectTag(tag)}
          >
            #{tag}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Loading State -->
  {#if isLoading}
    <div class="flex justify-center py-12">
      <div class="flex items-center space-x-2">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span class="text-gray-500">{t('loading') || 'Cargando...'}</span>
      </div>
    </div>

  <!-- Error State -->
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <i class="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i>
      <p class="text-red-700 font-medium">{error}</p>
      <button 
        class="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        on:click={() => window.location.reload()}
      >
        {t('tryAgain') || 'Intentar de nuevo'}
      </button>
    </div>

  <!-- Empty State -->
  {:else if filteredPosts.length === 0}
    <div class="text-center py-16">
      <div class="bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
        <i class="fas fa-newspaper text-gray-400 text-3xl"></i>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">
        {selectedTag 
          ? (t('noNewsInCategory') || 'No hay noticias en esta categoría')
          : (t('noBlogPostsYet') || 'Aún no hay noticias disponibles')
        }
      </h2>
      <p class="text-gray-600 mb-6">
        {selectedTag 
          ? (t('tryDifferentCategory') || 'Prueba con una categoría diferente o ve todas las noticias')
          : (t('checkBackSoon') || 'Vuelve pronto para ver las últimas novedades de nuestra comunidad')
        }
      </p>
      {#if selectedTag}
        <button 
          class="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          on:click={() => selectTag(null)}
        >
          {t('seeAllNews') || 'Ver todas las noticias'}
        </button>
      {/if}
    </div>

  <!-- News Grid -->
  {:else}
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each filteredPosts as post}
        <div class="transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
          <BlogPostCard {post} />
        </div>
      {/each}
    </div>

    <!-- Load More Button (para futuras implementaciones) -->
    {#if filteredPosts.length >= 6}
      <div class="text-center mt-12">
        <p class="text-gray-600 mb-4">
          {t('showingNewsCount', { count: filteredPosts.length }) || `Mostrando ${filteredPosts.length} noticias`}
        </p>
      </div>
    {/if}
  {/if}

  <!-- Back to Home -->
  <div class="text-center mt-12 pt-8 border-t border-gray-200">
    <a 
      href="/" 
      class="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
    >
      <i class="fas fa-arrow-left mr-2"></i>
      {t('backToHome') || 'Volver al inicio'}
    </a>
  </div>
</div>
