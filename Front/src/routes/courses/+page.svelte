<script lang="ts">
  import { onMount } from 'svelte';
  import { t as paraglideT } from '$lib/paraglide/runtime';
  import { courseService } from '$lib/services/courses/courseService';
  import type { Course } from '$lib/data/models/interfaces';
  
  // Implementación temporal de t hasta que Paraglide cargue completamente
  let t = (key: string) => key;
  
  onMount(() => {
    // Una vez montado, podemos usar la función real de Paraglide
    t = paraglideT;
  });
  
  // Estado para los cursos
  let courses: Course[] = [];
  let isLoading = true;
  let error: string | null = null;
  
  // Cargar todos los cursos
  onMount(async () => {
    try {
      courses = await courseService.getAllCourses();
    } catch (e) {
      error = 'Error al cargar los cursos';
      console.error(error, e);
    } finally {
      isLoading = false;
    }
  });
</script>

<svelte:head>
  <title>{t('coursesTitle')} | {t('centroTitle')}</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8">{t('allCoursesAndMaterials')}</h1>
  
  {#if isLoading}
    <div class="flex justify-center py-12">
      <div class="animate-pulse text-gray-500">{t('loading')}</div>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 p-4 rounded-md text-red-700">
      {error}
    </div>
  {:else if courses.length === 0}
    <div class="text-center py-12 text-gray-500">
      <p>{t('noCoursesAvailable')}</p>
    </div>
  {:else}
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each courses as course}
        <div class="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
          {#if course.imageUrl}
            <img src={course.imageUrl} alt={course.title} class="w-full h-48 object-cover" />
          {:else}
            <div class="w-full h-48 bg-indigo-100 flex items-center justify-center">
              <span class="text-indigo-500 text-lg">{course.title.substring(0, 2).toUpperCase()}</span>
            </div>
          {/if}
          
          <div class="p-6">
            <h2 class="text-xl font-bold mb-2">{course.title}</h2>
            <p class="text-gray-600 mb-4">{course.description}</p>
            
            {#if course.modules && course.modules.length > 0}
              <p class="text-sm text-gray-500 mb-4">
                {t('moduleCount', { count: course.modules.length })}
              </p>
            {/if}
            
            <a 
              href={`/courses/${course.id}`} 
              class="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              {t('exploreCourse')}
            </a>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
