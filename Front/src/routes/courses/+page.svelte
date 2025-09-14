<script lang="ts">
  import { onMount } from 'svelte';
  import { authService } from '$lib/services/authService';
  import { courseService } from '$lib/services/courseService';
  import type { CourseDetail, CourseSearchParams } from '$lib/services/courseService';
  import CourseCard from '$lib/components/course/CourseCard.svelte';
  
  // Estado de la aplicación
  let courses: CourseDetail[] = [];
  let filteredCourses: CourseDetail[] = [];
  let subjects: string[] = [];
  let isLoading = true;
  let error: string | null = null;
  
  // Permisos de usuario
  let isAuthenticated = false;
  let canManage = false;
  
  // Filtros y búsqueda
  let searchTerm = '';
  let selectedSubject = '';
  let showFeaturedOnly = false;
  let sortBy = 'createdAt';
  let sortOrder: 'asc' | 'desc' = 'desc';
  
  // Variables para paginación
  let currentPage = 1;
  let itemsPerPage = 12;
  let totalCourses = 0;
  
  // Calcular cursos filtrados y paginados
  $: {
    filteredCourses = filterCourses(courses, searchTerm, selectedSubject, showFeaturedOnly);
    filteredCourses = sortCourses(filteredCourses, sortBy, sortOrder);
    totalCourses = filteredCourses.length;
  }
  
  $: paginatedCourses = paginateCourses(filteredCourses, currentPage, itemsPerPage);
  $: totalPages = Math.ceil(totalCourses / itemsPerPage);
  
  onMount(async () => {
    // Verificar permisos de usuario
    isAuthenticated = authService.isAuthenticated();
    if (isAuthenticated) {
      const user = authService.getUser();
      canManage = user?.role === 'colaborador' || user?.role === 'administrador';
    }
    
    // Cargar datos
    await loadCourses();
    await loadSubjects();
  });
  
  async function loadCourses() {
    try {
      isLoading = true;
      error = null;
      courses = await courseService.getAllCourses();
    } catch (e) {
      error = 'Error al cargar los cursos';
      console.error(error, e);
    } finally {
      isLoading = false;
    }
  }
  
  async function loadSubjects() {
    try {
      subjects = await courseService.getAvailableSubjects();
    } catch (e) {
      console.error('Error loading subjects:', e);
    }
  }
  
  function filterCourses(courses: CourseDetail[], search: string, subject: string, featuredOnly: boolean): CourseDetail[] {
    return courses.filter(course => {
      if (!course.isActive) return false;

      // Filtro por búsqueda de texto
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesTitle = course.title.toLowerCase().includes(searchLower);
        const matchesDescription = course.description.toLowerCase().includes(searchLower);
        const matchesEducator = course.educatorName?.toLowerCase().includes(searchLower) || false;

        if (!matchesTitle && !matchesDescription && !matchesEducator) {
          return false;
        }
      }

      // Filtro por subject (materia)
      if (subject && course.subject !== subject) return false;

      // Filtro por destacados
      if (featuredOnly && !course.isFeatured) return false;

      return true;
    });
  }
  
  function sortCourses(courses: CourseDetail[], sortBy: string, order: 'asc' | 'desc'): CourseDetail[] {
    return [...courses].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'educatorName':
          comparison = (a.educatorName || '').localeCompare(b.educatorName || '');
          break;
        case 'moduleCount':
          comparison = (a.moduleCount || 0) - (b.moduleCount || 0);
          break;
        case 'subject':
          comparison = a.subject.localeCompare(b.subject);
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });
  }
  
  function paginateCourses(courses: CourseDetail[], page: number, perPage: number): CourseDetail[] {
    const start = (page - 1) * perPage;
    return courses.slice(start, start + perPage);
  }
  
  function handleSearch() {
    currentPage = 1; // Reset a primera página cuando se busca
  }
  
  function clearFilters() {
    searchTerm = '';
    selectedSubject = '';
    showFeaturedOnly = false;
    currentPage = 1;
  }

  function handleCourseDeleted(event: CustomEvent<string>) {
    const deletedCourseId = event.detail;
    courses = courses.filter(course => course.id !== deletedCourseId);
  }
</script>

<svelte:head>
  <title>Cursos - Centro Cultural Víctor Jara</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    <!-- Header Súper Juvenil -->
    <div class="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl p-12 mb-12 border-2 border-emerald-100 overflow-hidden">
      <!-- Elementos decorativos animados -->
      <div class="absolute top-6 right-8 text-7xl opacity-20 animate-pulse">🎓</div>
      <div class="absolute -top-6 -left-6 w-24 h-24 bg-emerald-200/30 rounded-full animate-bounce" style="animation-duration: 3s;"></div>
      <div class="absolute bottom-8 right-16 w-16 h-16 bg-teal-200/30 rounded-full animate-pulse" style="animation-delay: 1s;"></div>
      <div class="absolute top-16 left-1/3 w-8 h-8 bg-cyan-200/30 rounded-full animate-pulse" style="animation-delay: 2s;"></div>

      <div class="relative z-10 text-center">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
          <span class="text-4xl mr-3">🚀</span>
          <span class="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 bg-clip-text text-transparent">
            Cursos Increíbles
          </span>
        </h1>
        <p class="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed font-medium mb-8">
          🌟 ¡Descubre un mundo de aprendizaje súper genial! Encuentra cursos increíbles que te ayudarán a aprender, crear y brillar como nunca antes
        </p>

        {#if canManage}
          <div class="mt-8">
            <a
              href="/courses/create"
              class="group inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-10 py-5 rounded-2xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 text-lg font-bold border-2 border-orange-400"
            >
              <span class="text-2xl group-hover:rotate-90 transition-transform duration-500">✨</span>
              Crear Curso Genial
              <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform duration-300"></i>
            </a>
          </div>
        {/if}
      </div>
    </div>

    <!-- Estadísticas Súper Geniales -->
    <div class="text-center mb-8">
      <h2 class="text-2xl md:text-3xl font-black text-gray-800 mb-4 flex items-center justify-center gap-3">
        <span class="text-3xl">📈</span>
        ¡Estadísticas Increíbles!
      </h2>
      <p class="text-gray-600 font-medium">Mira todo lo genial que puedes aprender en nuestros cursos</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div class="group relative bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl shadow-lg border-2 border-emerald-200 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 overflow-hidden">
        <div class="absolute -top-4 -right-4 w-16 h-16 bg-emerald-300/20 rounded-full animate-pulse"></div>

        <div class="relative z-10 text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
            <span class="text-2xl">🎓</span>
          </div>
          <p class="text-sm font-bold text-emerald-700 mb-2 uppercase tracking-wide">Total Cursos</p>
          <p class="text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">{courses.length}</p>
          <p class="text-xs text-emerald-600 font-semibold">¡Cursos geniales! 🚀</p>
        </div>
      </div>

      <div class="group relative bg-gradient-to-br from-yellow-50 to-orange-100 rounded-3xl shadow-lg border-2 border-yellow-200 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 overflow-hidden">
        <div class="absolute -top-4 -right-4 w-16 h-16 bg-yellow-300/20 rounded-full animate-pulse" style="animation-delay: 0.5s;"></div>

        <div class="relative z-10 text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl shadow-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
            <span class="text-2xl">⭐</span>
          </div>
          <p class="text-sm font-bold text-orange-700 mb-2 uppercase tracking-wide">Destacados</p>
          <p class="text-4xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2">{courses.filter(c => c.isFeatured).length}</p>
          <p class="text-xs text-orange-600 font-semibold">¡Súper populares! 🏆</p>
        </div>
      </div>

      <div class="group relative bg-gradient-to-br from-cyan-50 to-blue-100 rounded-3xl shadow-lg border-2 border-cyan-200 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 overflow-hidden">
        <div class="absolute -top-4 -right-4 w-16 h-16 bg-cyan-300/20 rounded-full animate-pulse" style="animation-delay: 1s;"></div>

        <div class="relative z-10 text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl shadow-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
            <span class="text-2xl">📚</span>
          </div>
          <p class="text-sm font-bold text-blue-700 mb-2 uppercase tracking-wide">Módulos</p>
          <p class="text-4xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">{subjects.length}</p>
          <p class="text-xs text-blue-600 font-semibold">¡Módulos increíbles! 🌈</p>
        </div>
      </div>
    </div>

    <!-- Barra de búsqueda súper juvenil -->
    <div class="relative bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-emerald-100 p-8 mb-8 overflow-hidden">
      <!-- Elementos decorativos -->
      <div class="absolute -top-4 -right-4 w-20 h-20 bg-emerald-200/20 rounded-full animate-bounce" style="animation-duration: 4s;"></div>
      <div class="absolute bottom-4 left-8 w-12 h-12 bg-teal-200/20 rounded-full animate-pulse" style="animation-delay: 2s;"></div>

      <div class="relative z-10">
        <!-- Título de búsqueda -->
        <div class="text-center mb-8">
          <h2 class="text-2xl font-black text-gray-800 mb-2 flex items-center justify-center gap-3">
            <span class="text-2xl">🎯</span>
            ¡Encuentra Tu Curso Perfecto!
          </h2>
          <p class="text-gray-600 font-medium">Explora entre todos nuestros cursos súper geniales</p>
        </div>

        <div class="flex flex-col lg:flex-row gap-6 items-center justify-between">
          <!-- Búsqueda principal mejorada -->
          <div class="flex-1 max-w-2xl">
            <div class="relative group">
              <input
                type="text"
                placeholder="🎓 Busca cursos increíbles, educadores geniales..."
                bind:value={searchTerm}
                on:input={handleSearch}
                class="w-full pl-16 pr-8 py-5 text-lg border-3 border-emerald-200 rounded-2xl focus:ring-6 focus:ring-emerald-300/30 focus:border-emerald-400 transition-all duration-300 bg-white/80 focus:bg-white shadow-lg font-medium placeholder:text-gray-400"
              >
              <div class="absolute left-5 top-1/2 transform -translate-y-1/2 text-emerald-400 group-focus-within:text-emerald-600 transition-colors duration-300">
                <span class="text-2xl">🔍</span>
              </div>
              {#if searchTerm}
                <button
                  on:click={() => { searchTerm = ''; handleSearch(); }}
                  class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <i class="fas fa-times text-lg"></i>
                </button>
              {/if}
            </div>
          </div>

          <!-- Controles juveniles -->
          <div class="flex items-center gap-4 flex-wrap">
            <!-- Filtro por Módulo -->
            <div class="relative">
              <select bind:value={selectedSubject} class="appearance-none px-6 py-3 pr-10 border-2 border-emerald-200 rounded-2xl focus:ring-4 focus:ring-emerald-300/20 focus:border-emerald-400 transition-all duration-300 bg-white/80 font-bold text-gray-700 shadow-lg">
                <option value="">📚 Todos los módulos</option>
                {#each subjects as subject}
                  <option value={subject}>📖 {subject}</option>
                {/each}
              </select>
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-400 pointer-events-none">
                <i class="fas fa-chevron-down"></i>
              </div>
            </div>

            <!-- Destacados con estilo juvenil -->
            <label class="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl cursor-pointer hover:from-yellow-100 hover:to-orange-100 hover:border-yellow-300 transition-all duration-300 shadow-lg">
              <input
                type="checkbox"
                bind:checked={showFeaturedOnly}
                class="rounded-lg border-yellow-300 text-yellow-600 focus:ring-yellow-500 w-5 h-5"
              >
              <span class="text-sm font-bold text-yellow-700 flex items-center gap-2">
                <span class="text-lg group-hover:scale-125 transition-transform duration-300">⭐</span>
                Solo destacados
              </span>
            </label>

            <!-- Ordenamiento mejorado -->
            <div class="relative">
              <select bind:value={sortBy} class="appearance-none px-6 py-3 pr-10 border-2 border-emerald-200 rounded-2xl focus:ring-4 focus:ring-emerald-300/20 focus:border-emerald-400 transition-all duration-300 bg-white/80 font-bold text-gray-700 shadow-lg">
                <option value="createdAt">🆕 Más recientes</option>
                <option value="title">🔤 Nombre A-Z</option>
                <option value="subject">📚 Por materia</option>
                <option value="educatorName">👨‍🏫 Por educador</option>
                <option value="moduleCount">📊 Por módulos</option>
              </select>
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-400 pointer-events-none">
                <i class="fas fa-chevron-down"></i>
              </div>
            </div>

            <button
              on:click={() => sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'}
              class="group p-3 border-2 border-emerald-200 bg-white/80 rounded-2xl hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              title={sortOrder === 'asc' ? '⬆️ Orden ascendente' : '⬇️ Orden descendente'}
            >
              <span class="text-xl group-hover:rotate-180 transition-transform duration-500">
                {sortOrder === 'asc' ? '⬆️' : '⬇️'}
              </span>
            </button>

            <!-- Limpiar filtros con estilo -->
            {#if searchTerm || selectedSubject || showFeaturedOnly}
              <button
                on:click={clearFilters}
                class="group px-4 py-3 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-600 rounded-2xl hover:from-red-100 hover:to-pink-100 hover:border-red-300 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                title="🧹 Limpiar filtros"
              >
                <span class="flex items-center gap-2 font-bold">
                  <span class="text-lg group-hover:rotate-180 transition-transform duration-500">🧹</span>
                  <span class="hidden sm:inline">Limpiar</span>
                </span>
              </button>
            {/if}
          </div>
        </div>

        <!-- Resultados info juvenil -->
        <div class="mt-8 pt-6 border-t-2 border-emerald-100">
          <div class="text-center">
            {#if filteredCourses.length === 0}
              <p class="text-lg font-bold text-gray-600 flex items-center justify-center gap-2">
                <span class="text-2xl">😔</span>
                No encontramos cursos súper geniales
              </p>
            {:else}
              <div class="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl px-6 py-3">
                <span class="text-xl">🎯</span>
                <p class="font-bold text-gray-700">
                  Mostrando <span class="text-emerald-600 font-black">{((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredCourses.length)}</span>
                  de <span class="text-teal-600 font-black">{filteredCourses.length}</span> cursos increíbles
                  {#if searchTerm || selectedSubject || showFeaturedOnly}
                    <span class="text-gray-500">(de {courses.length} totales)</span>
                  {/if}
                </p>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Mostrar error si existe -->
    {#if error}
      <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
        <div class="flex items-center">
          <i class="fas fa-exclamation-circle text-red-500 mr-3 text-xl"></i>
          <span class="text-red-700 font-medium">{error}</span>
        </div>
      </div>
    {/if}

    <!-- Loading state súper juvenil -->
    {#if isLoading}
      <div class="relative bg-gradient-to-br from-white/90 to-emerald-50/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-emerald-200 p-16 overflow-hidden">
        <!-- Elementos decorativos animados -->
        <div class="absolute top-8 right-8 text-6xl opacity-20 animate-bounce">🎓</div>
        <div class="absolute -top-4 -left-4 w-16 h-16 bg-emerald-300/20 rounded-full animate-pulse"></div>
        <div class="absolute bottom-4 right-4 w-12 h-12 bg-teal-300/20 rounded-full animate-pulse" style="animation-delay: 1s;"></div>

        <div class="relative z-10 text-center">
          <div class="relative inline-block mb-8">
            <!-- Spinner principal -->
            <div class="w-20 h-20 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
            <!-- Spinner secundario -->
            <div class="absolute inset-0 w-20 h-20 border-4 border-transparent border-l-teal-500 rounded-full animate-spin" style="animation-direction: reverse; animation-duration: 1.5s;"></div>
            <!-- Emoji central -->
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-2xl animate-pulse">🚀</span>
            </div>
          </div>
          <h3 class="text-2xl md:text-3xl font-black text-gray-800 mb-4 flex items-center justify-center gap-3">
            <span class="text-3xl">📚</span>
            ¡Cargando Cursos Increíbles!
          </h3>
          <p class="text-lg text-gray-600 mb-4 font-medium">Preparando la mejor experiencia de aprendizaje para ti</p>
          <div class="flex items-center justify-center gap-2 text-emerald-600 font-bold">
            <span class="animate-pulse">✨</span>
            <span>Buscando cursos súper geniales</span>
            <span class="animate-pulse">✨</span>
          </div>
        </div>
      </div>
    {:else if paginatedCourses.length === 0}
      <!-- Estado vacío súper juvenil -->
      <div class="relative bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-gray-200 p-16 overflow-hidden">
        <!-- Elementos decorativos -->
        <div class="absolute top-6 right-6 text-6xl opacity-20">🎓</div>
        <div class="absolute -top-4 -left-4 w-16 h-16 bg-gray-300/20 rounded-full animate-pulse"></div>
        <div class="absolute bottom-6 right-12 w-12 h-12 bg-emerald-300/20 rounded-full animate-pulse" style="animation-delay: 1s;"></div>

        <div class="relative z-10 text-center">
          <div class="mb-8">
            <div class="relative inline-block">
              <div class="w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-200 rounded-full flex items-center justify-center mx-auto shadow-lg mb-4">
                <span class="text-6xl">
                  {#if filteredCourses.length === 0 && courses.length > 0}
                    🤔
                  {:else}
                    🎓
                  {/if}
                </span>
              </div>
              <!-- Elementos decorativos alrededor -->
              <div class="absolute -top-2 -right-2 w-8 h-8 bg-emerald-200 rounded-full animate-pulse"></div>
              <div class="absolute -bottom-2 -left-2 w-6 h-6 bg-teal-200 rounded-full animate-pulse" style="animation-delay: 1s;"></div>
              <div class="absolute top-4 -left-4 w-4 h-4 bg-cyan-200 rounded-full animate-pulse" style="animation-delay: 2s;"></div>
            </div>
          </div>

          <h3 class="text-2xl md:text-3xl font-black text-gray-800 mb-6">
            {#if filteredCourses.length === 0 && courses.length > 0}
              🤷‍♂️ ¡Oops! No encontramos cursos súper geniales
            {:else}
              📖 Esperando cursos increíbles
            {/if}
          </h3>

          <p class="text-lg text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed font-medium">
            {#if filteredCourses.length === 0 && courses.length > 0}
              🔍 Intenta con otros términos de búsqueda o ajusta los filtros para encontrar cursos súper geniales.
            {:else if canManage}
              🌟 ¡Sé el primero en crear conocimiento increíble! Agrega el primer curso y dale vida a esta plataforma.
            {:else}
              ⏰ Pronto tendremos cursos súper geniales para que aprendas cosas increíbles y te conviertas en un experto.
            {/if}
          </p>

          {#if filteredCourses.length === 0 && courses.length > 0}
            <button
              on:click={clearFilters}
              class="group inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 text-lg font-bold"
            >
              <span class="text-xl group-hover:rotate-180 transition-transform duration-500">🔄</span>
              Limpiar filtros y empezar de nuevo
              <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform duration-300"></i>
            </button>
          {:else if canManage}
            <a
              href="/courses/create"
              class="group inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-2xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 text-lg font-bold"
            >
              <span class="text-xl group-hover:rotate-90 transition-transform duration-500">✨</span>
              Crear el primer curso genial
              <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform duration-300"></i>
            </a>
          {/if}
        </div>
      </div>
    {:else}
      <!-- Grid de cursos súper juvenil -->
      <div class="mb-8">
        <div class="text-center mb-10">
          <h2 class="text-2xl md:text-3xl font-black text-gray-800 mb-4 flex items-center justify-center gap-3">
            <span class="text-3xl">🎯</span>
            ¡Cursos Increíbles Esperándote!
          </h2>
          <p class="text-gray-600 font-medium">Elige tu próxima aventura de aprendizaje</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {#each paginatedCourses as course (course.id)}
            <div class="course-card-wrapper">
              <CourseCard
                {course}
                showActions={canManage}
                on:deleted={handleCourseDeleted}
              />
            </div>
          {/each}
        </div>
      </div>

      <!-- Paginación mejorada -->
      {#if totalPages > 1}
        <div class="flex items-center justify-center space-x-3 mt-12">
          <button 
            on:click={() => currentPage = 1}
            disabled={currentPage === 1}
            class="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-emerald-300 transition-all duration-300 group"
          >
            <i class="fas fa-angle-double-left text-lg group-hover:text-emerald-600 transition-colors"></i>
          </button>
          
          <button 
            on:click={() => currentPage = Math.max(1, currentPage - 1)}
            disabled={currentPage === 1}
            class="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-emerald-300 transition-all duration-300 group"
          >
            <i class="fas fa-angle-left text-lg group-hover:text-emerald-600 transition-colors"></i>
          </button>

          {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
            const start = Math.max(1, currentPage - 2);
            const end = Math.min(totalPages, start + 4);
            return start + i;
          }).filter(page => page <= totalPages) as page}
            <button 
              on:click={() => currentPage = page}
              class="px-4 py-3 border-2 rounded-xl transition-all duration-300 font-semibold text-lg min-w-[3rem] {
                currentPage === page 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-lg' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-emerald-300 text-gray-700 hover:text-emerald-600'
              }"
            >
              {page}
            </button>
          {/each}

          <button 
            on:click={() => currentPage = Math.min(totalPages, currentPage + 1)}
            disabled={currentPage === totalPages}
            class="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-emerald-300 transition-all duration-300 group"
          >
            <i class="fas fa-angle-right text-lg group-hover:text-emerald-600 transition-colors"></i>
          </button>
          
          <button 
            on:click={() => currentPage = totalPages}
            disabled={currentPage === totalPages}
            class="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-emerald-300 transition-all duration-300 group"
          >
            <i class="fas fa-angle-double-right text-lg group-hover:text-emerald-600 transition-colors"></i>
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .course-card-wrapper {
    height: 100%;
    transition: transform 0.2s ease-in-out;
  }

  .course-card-wrapper:hover {
    transform: translateY(-4px);
  }

  /* Add some spacing and enhance the grid layout */
  .grid {
    gap: 2rem;
  }

  @media (max-width: 768px) {
    .grid {
      gap: 1.5rem;
    }
  }
</style>
