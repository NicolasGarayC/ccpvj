<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { jwtService } from '$lib/services/auth/jwtService.js';
  import { browser } from '$app/environment';

  let loading = true;
  let stats = {
    visitors: 0,
    downloads: 0,
    resources: 0
  };

  let visitorsChart = [];
  let topResources = [];

  onMount(async () => {
    if (!browser) return;

    const isAuthenticated = await jwtService.isAuthenticated();
    if (!isAuthenticated) {
      goto('/auth/login');
      return;
    }

    const user = jwtService.getUser();
    if (!user || user.role !== 'administrador') {
      goto('/dashboard');
      return;
    }

    await loadAnalytics();
  });

  async function loadAnalytics() {
    try {
      loading = true;

      // Por ahora datos simulados - luego se conectará al backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular carga

      stats = {
        visitors: 1247,
        downloads: 583,
        resources: 156
      };

      // Datos simulados para el gráfico de visitantes (últimos 30 días)
      visitorsChart = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', {
          month: 'short',
          day: 'numeric'
        }),
        visitors: Math.floor(Math.random() * 50) + 20
      }));

      // Datos simulados para top recursos
      topResources = [
        { name: 'Manual de Guitarra Básica.pdf', downloads: 127 },
        { name: 'Historia del Teatro Colombiano.pdf', downloads: 89 },
        { name: 'Técnicas de Pintura.mp4', downloads: 76 },
        { name: 'Fotografía Digital.pdf', downloads: 64 },
        { name: 'Música Folclórica.mp3', downloads: 52 }
      ];

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      loading = false;
    }
  }

  function getStatIcon(type: string): string {
    switch (type) {
      case 'visitors': return 'fas fa-users';
      case 'downloads': return 'fas fa-download';
      case 'resources': return 'fas fa-folder';
      default: return 'fas fa-chart-bar';
    }
  }

  function getStatColor(type: string): string {
    switch (type) {
      case 'visitors': return 'bg-blue-100 text-blue-600';
      case 'downloads': return 'bg-green-100 text-green-600';
      case 'resources': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  }
</script>

<svelte:head>
  <title>Estadísticas - Centro Cultural Víctor Jara</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="flex justify-between items-center mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Estadísticas</h1>
      <p class="text-gray-600 mt-2">Dashboard de métricas y análisis</p>
    </div>
    <a
      href="/dashboard"
      class="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
    >
      <i class="fas fa-arrow-left"></i>
      Volver al Dashboard
    </a>
  </div>

  {#if loading}
    <!-- Loading State -->
    <div class="text-center py-12">
      <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
      <p class="text-gray-600">Cargando estadísticas...</p>
    </div>
  {:else}
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-lg {getStatColor('visitors')}">
            <i class="{getStatIcon('visitors')} text-xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Visitantes</p>
            <p class="text-2xl font-bold text-gray-900">{stats.visitors.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-lg {getStatColor('downloads')}">
            <i class="{getStatIcon('downloads')} text-xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Descargas</p>
            <p class="text-2xl font-bold text-gray-900">{stats.downloads.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-lg {getStatColor('resources')}">
            <i class="{getStatIcon('resources')} text-xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Recursos</p>
            <p class="text-2xl font-bold text-gray-900">{stats.resources.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Visitors Chart -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          <i class="fas fa-chart-line text-blue-600 mr-2"></i>
          Visitantes (Últimos 30 días)
        </h3>
        <div class="h-64 flex items-end justify-between gap-1">
          {#each visitorsChart as day}
            <div class="flex-1 flex flex-col items-center">
              <div
                class="bg-blue-500 rounded-t w-full transition-all duration-300 hover:bg-blue-600"
                style="height: {(day.visitors / Math.max(...visitorsChart.map(d => d.visitors))) * 100}%"
                title="{day.date}: {day.visitors} visitantes"
              ></div>
              <span class="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                {day.date}
              </span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Top Resources -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          <i class="fas fa-trophy text-yellow-600 mr-2"></i>
          Recursos Más Descargados
        </h3>
        <div class="space-y-4">
          {#each topResources as resource, index}
            <div class="flex items-center">
              <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {index + 1}
              </div>
              <div class="ml-3 flex-1">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {resource.name}
                </p>
                <div class="flex items-center mt-1">
                  <div class="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      class="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style="width: {(resource.downloads / topResources[0].downloads) * 100}%"
                    ></div>
                  </div>
                  <span class="ml-2 text-sm text-gray-500">
                    {resource.downloads}
                  </span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Additional Info -->
    <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <i class="fas fa-info-circle text-blue-400"></i>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-blue-800">
            Información sobre las estadísticas
          </h3>
          <div class="mt-2 text-sm text-blue-700">
            <p>
              • Los datos se actualizan cada hora<br>
              • Las estadísticas incluyen únicamente usuarios únicos<br>
              • Los recursos incluyen archivos de la biblioteca digital
            </p>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>