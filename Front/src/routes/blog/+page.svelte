<script lang="ts">
  import { onMount } from 'svelte';
  import { blogService } from '$lib/services/blog/blogService';
  import BlogPostCard from '$lib/components/blog/BlogPostCard.svelte';
  import type { BlogPost } from '$lib/data/models/interfaces';
  import { jwtService } from '$lib/services/auth/jwtService.js';
  
  import { t } from '$lib/i18n';
  
  
  let posts: BlogPost[] = [];
  let isLoading = true;
  let error: string | null = null;
  let selectedTag: string | null = null;
  
  // Variables para permisos de usuario
  let isAuthenticated = false;
  let canCreateArticles = false;
  
  // Obtener tags únicos para filtro
  $: uniqueTags = [...new Set(posts.flatMap(post => post.tags || []))].sort();
  
  // Filtrar posts por tag seleccionado
  $: filteredPosts = selectedTag 
    ? posts.filter(post => post.tags?.includes(selectedTag))
    : posts;
  
  onMount(async () => {
    try {
      // Verificar autenticación y permisos
      isAuthenticated = jwtService.isAuthenticated();
      if (isAuthenticated) {
        const user = jwtService.getUser();
        canCreateArticles = (user?.role === 'administrador' || user?.role === 'colaborador') || user?.role === 'administrador' || user?.role === 'colaborador';
      }
      
      // Cargar posts
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

<!-- Hero Section Juvenil pero Legible -->
<div class="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-16 mb-12">
  <!-- Elementos decorativos sutiles -->
  <div class="absolute inset-0 overflow-hidden">
    <div class="absolute top-10 left-10 w-20 h-20 bg-blue-200/20 rounded-full animate-pulse"></div>
    <div class="absolute top-20 right-16 w-16 h-16 bg-purple-200/20 rounded-full animate-pulse" style="animation-delay: 1s;"></div>
    <div class="absolute bottom-16 left-1/4 w-12 h-12 bg-green-200/20 rounded-full animate-pulse" style="animation-delay: 2s;"></div>
    <div class="absolute bottom-10 right-10 w-24 h-24 bg-pink-200/20 rounded-full animate-pulse" style="animation-delay: 1.5s;"></div>
  </div>

  <div class="max-w-7xl mx-auto px-4 relative">
    <div class="text-center">
      <!-- Título con gradiente pero legible -->
      <h1 class="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
        <span class="text-4xl mr-3">📰</span>
        <span class="bg-gradient-to-r from-slate-700 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
          {t('newsAndAnnouncements') || 'Noticias y Anuncios'}
        </span>
      </h1>

      <!-- Descripción con contraste excelente -->
      <p class="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed font-medium">
        {t('stayUpdated') || 'Mantente informado sobre las últimas actividades, cursos y eventos de nuestra comunidad educativa.'}
      </p>

      <!-- Botón crear artículo mejorado -->
      {#if canCreateArticles}
        <div class="mt-8">
          <a
            href="/blog/create"
            class="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg"
          >
            <span class="text-xl group-hover:rotate-90 transition-transform duration-300">✨</span>
            {t('createArticle') || 'Crear Artículo'}
            <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform duration-300"></i>
          </a>
        </div>
      {/if}
    </div>
  </div>
</div>

<div class="max-w-7xl mx-auto px-4">

  <!-- Filtros por Tags Mejorados -->
  {#if uniqueTags.length > 0}
    <div class="mb-12">
      <div class="text-center mb-6">
        <h2 class="text-lg font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
          <span class="text-2xl">🏷️</span>
          Filtrar por Categorías
        </h2>
        <p class="text-sm text-gray-600">Encuentra las noticias que más te interesan</p>
      </div>

      <div class="flex flex-wrap justify-center gap-3">
        <button
          class="group relative inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 hover:scale-105 {selectedTag === null ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 shadow-sm'}"
          on:click={() => selectTag(null)}
        >
          <span class="text-lg group-hover:scale-110 transition-transform duration-300">📰</span>
          {t('allNews') || 'Todas las noticias'}
          {#if selectedTag === null}
            <div class="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
          {/if}
        </button>

        {#each uniqueTags as tag, index}
          <button
            class="group relative inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-300 hover:scale-105 {selectedTag === tag ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 shadow-sm'}"
            on:click={() => selectTag(tag)}
            style="animation-delay: {index * 0.1}s;"
          >
            <span class="text-base group-hover:rotate-12 transition-transform duration-300">🔖</span>
            #{tag}
            {#if selectedTag === tag}
              <div class="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Loading State Mejorado -->
  {#if isLoading}
    <div class="flex flex-col items-center justify-center py-20">
      <div class="relative">
        <!-- Spinner más atractivo -->
        <div class="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div class="absolute inset-0 w-16 h-16 border-4 border-transparent border-l-purple-600 rounded-full animate-spin" style="animation-direction: reverse; animation-duration: 1.5s;"></div>
      </div>
      <div class="mt-6 text-center">
        <p class="text-lg font-semibold text-gray-700 mb-2">📡 {t('loading') || 'Cargando...'}</p>
        <p class="text-sm text-gray-500">Buscando las mejores noticias para ti</p>
      </div>
    </div>

  <!-- Error State Mejorado -->
  {:else if error}
    <div class="max-w-md mx-auto">
      <div class="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-3xl p-8 text-center shadow-lg">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl">😕</span>
        </div>
        <h3 class="text-xl font-bold text-red-800 mb-2">¡Oops! Algo salió mal</h3>
        <p class="text-red-700 font-medium mb-6">{error}</p>
        <button
          class="group inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold px-6 py-3 rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 hover:scale-105 shadow-lg"
          on:click={() => window.location.reload()}
        >
          <span class="text-lg group-hover:rotate-180 transition-transform duration-500">🔄</span>
          {t('tryAgain') || 'Intentar de nuevo'}
        </button>
      </div>
    </div>

  <!-- Empty State Mejorado -->
  {:else if filteredPosts.length === 0}
    <div class="text-center py-20">
      <div class="max-w-lg mx-auto">
        <!-- Ilustración más atractiva -->
        <div class="relative mb-8">
          <div class="w-32 h-32 bg-gradient-to-br from-slate-100 to-gray-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <span class="text-6xl">📰</span>
          </div>
          <!-- Elementos decorativos -->
          <div class="absolute -top-2 -right-2 w-8 h-8 bg-blue-200 rounded-full animate-pulse"></div>
          <div class="absolute -bottom-2 -left-2 w-6 h-6 bg-purple-200 rounded-full animate-pulse" style="animation-delay: 1s;"></div>
          <div class="absolute top-4 -left-4 w-4 h-4 bg-green-200 rounded-full animate-pulse" style="animation-delay: 2s;"></div>
        </div>

        <h2 class="text-2xl md:text-3xl font-black text-gray-900 mb-4">
          {selectedTag
            ? `🔍 ${t('noNewsInCategory') || 'No hay noticias en esta categoría'}`
            : `📰 ${t('noBlogPostsYet') || 'Aún no hay noticias disponibles'}`
          }
        </h2>

        <p class="text-gray-600 text-lg mb-8 leading-relaxed">
          {selectedTag
            ? (t('tryDifferentCategory') || 'Prueba con una categoría diferente o ve todas las noticias')
            : (t('checkBackSoon') || 'Vuelve pronto para ver las últimas novedades de nuestra comunidad')
          }
        </p>

        {#if selectedTag}
          <button
            class="group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold px-8 py-4 rounded-2xl hover:from-indigo-600 hover:to-blue-600 transition-all duration-300 hover:scale-105 shadow-lg"
            on:click={() => selectTag(null)}
          >
            <span class="text-xl group-hover:scale-125 transition-transform duration-300">🌟</span>
            {t('seeAllNews') || 'Ver todas las noticias'}
            <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform duration-300"></i>
          </button>
        {/if}
      </div>
    </div>

  <!-- News Grid Mejorado -->
  {:else}
    <!-- Encabezado de resultados -->
    <div class="text-center mb-10">
      <div class="inline-flex items-center gap-2 bg-white border-2 border-gray-200 rounded-full px-6 py-3 shadow-sm">
        <span class="text-xl">📊</span>
        <span class="font-bold text-gray-700">
          {filteredPosts.length} {filteredPosts.length === 1 ? 'noticia' : 'noticias'}
          {selectedTag ? `en #${selectedTag}` : 'encontradas'}
        </span>
      </div>
    </div>

    <!-- Grid con efectos stagger -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each filteredPosts as post, index}
        <div
          class="transform transition-all duration-500 hover:-translate-y-3 hover:scale-102"
          style="animation-delay: {index * 0.1}s;"
        >
          <BlogPostCard {post} />
        </div>
      {/each}
    </div>

    <!-- Información adicional -->
    {#if filteredPosts.length >= 6}
      <div class="text-center mt-16">
        <div class="inline-block bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl px-8 py-4">
          <p class="text-gray-700 font-semibold mb-2">
            📈 {t('showingNewsCount', { count: filteredPosts.length }) || `Mostrando ${filteredPosts.length} noticias`}
          </p>
          <p class="text-sm text-gray-600">¡Sigue explorando para descubrir más contenido!</p>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Back to Home Mejorado -->
<div class="bg-gradient-to-r from-slate-50 to-gray-50 mt-16 py-12">
  <div class="max-w-4xl mx-auto px-4 text-center">
    <div class="mb-6">
      <div class="inline-block w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4">
        <span class="text-2xl">🏠</span>
      </div>
      <h3 class="text-xl font-bold text-gray-800 mb-2">¿Listo para explorar más?</h3>
      <p class="text-gray-600 mb-6">Descubre todo lo que nuestro Centro Cultural tiene para ofrecerte</p>
    </div>

    <a
      href="/"
      class="group inline-flex items-center gap-3 bg-gradient-to-r from-slate-600 to-gray-600 text-white font-bold px-8 py-4 rounded-2xl hover:from-slate-700 hover:to-gray-700 transition-all duration-300 hover:scale-105 shadow-lg"
    >
      <i class="fas fa-arrow-left text-lg group-hover:-translate-x-1 transition-transform duration-300"></i>
      {t('backToHome') || 'Volver al inicio'}
      <span class="text-xl group-hover:scale-125 transition-transform duration-300">🏠</span>
    </a>
  </div>
</div>
