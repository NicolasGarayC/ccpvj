<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { jwtService, type JwtUser } from '$lib/application/services/auth/JwtService.js';
  import { t } from '$lib/i18n';

  let user: JwtUser | null = null;
  let loading = false;

  async function handleLogout() {
    loading = true;
    try {
      await jwtService.logout();
      goto('/');
    } catch (error) {
      console.error('Error durante logout:', error);
      // Redirigir de todos modos si hay error
      goto('/');
    } finally {
      loading = false;
    }
  }

  // Cargar datos del usuario y verificar autenticación
  onMount(async () => {
    const isAuthenticated = await jwtService.isAuthenticated();
    if (!isAuthenticated) {
      goto('/auth/login');
      return;
    }

    // Obtener datos del usuario desde el JWT
    user = jwtService.getUser();
    if (!user) {
      goto('/auth/login');
    }
  });
</script>

<svelte:head>
  <title>Dashboard - {$t('centroTitle')}</title>
</svelte:head>

{#if user}
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-3">
            <div class="bg-indigo-100 rounded-full w-10 h-10 flex items-center justify-center">
              <i class="fas fa-network-wired text-indigo-600 text-lg"></i>
            </div>
            <div>
              <h1 class="text-xl font-semibold text-gray-900">{$t('centroTitle')}</h1>
              <p class="text-sm text-gray-500">{$t('centroDescription')}</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900">
                {user.nombre} {user.apellido}
              </p>
              <p class="text-xs text-gray-500">{user.role}</p>
            </div>
            <button
              on:click={handleLogout}
              disabled={loading}
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if loading}
                <i class="fas fa-spinner fa-spin mr-2"></i>
              {:else}
                <i class="fas fa-sign-out-alt mr-2"></i>
              {/if}
              {$t('dashboard.closeSession')}
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          {$t('dashboard.welcome')}{user.nombre ? ', ' + user.nombre : ''}!
        </h2>
        <p class="text-gray-600">
          {$t('dashboard.accessMessage')}
        </p>
      </div>

      <!-- Quick Actions Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <a href="/material-apoyo" class="group bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
          <div class="flex items-center">
            <div class="bg-blue-100 rounded-lg p-3">
              <i class="fas fa-graduation-cap text-blue-600 text-xl"></i>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900 group-hover:text-blue-600">{$t('dashboard.projects')}</h3>
              <p class="text-gray-500 text-sm">{$t('dashboard.projectsDescription')}</p>
            </div>
          </div>
        </a>

        <a href="/blog" class="group bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
          <div class="flex items-center">
            <div class="bg-green-100 rounded-lg p-3">
              <i class="fas fa-newspaper text-green-600 text-xl"></i>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900 group-hover:text-green-600">{$t('dashboard.blogTitle')}</h3>
              <p class="text-gray-500 text-sm">{$t('dashboard.blogDescription')}</p>
            </div>
          </div>
        </a>

        <a href="/calendar" class="group bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
          <div class="flex items-center">
            <div class="bg-purple-100 rounded-lg p-3">
              <i class="fas fa-calendar text-purple-600 text-xl"></i>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900 group-hover:text-purple-600">{$t('calendar')}</h3>
              <p class="text-gray-500 text-sm">{$t('dashboard.eventsDescription')}</p>
            </div>
          </div>
        </a>

        <a href="/library" class="group bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
          <div class="flex items-center">
            <div class="bg-orange-100 rounded-lg p-3">
              <i class="fas fa-book text-orange-600 text-xl"></i>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900 group-hover:text-orange-600">{$t('dashboard.libraryTitle')}</h3>
              <p class="text-gray-500 text-sm">{$t('dashboard.libraryDescription')}</p>
            </div>
          </div>
        </a>
      </div>

      <!-- Admin Panel - Solo para administradores -->
      {#if user.role === 'administrador' || jwtService.isAdmin()}
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <i class="fas fa-cog text-red-600 mr-2"></i>
            {$t('dashboard.adminPanel')}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <a href="/dashboard/users" class="group bg-red-50 border border-red-200 rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div class="flex items-center">
                <div class="bg-red-100 rounded-lg p-3">
                  <i class="fas fa-users text-red-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <h4 class="text-lg font-medium text-gray-900 group-hover:text-red-600">{$t('dashboard.userManagement')}</h4>
                  <p class="text-gray-500 text-sm">{$t('dashboard.userManagementDescription')}</p>
                </div>
              </div>
            </a>


            <a href="/admin/analytics" class="group bg-red-50 border border-red-200 rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div class="flex items-center">
                <div class="bg-red-100 rounded-lg p-3">
                  <i class="fas fa-chart-bar text-red-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <h4 class="text-lg font-medium text-gray-900 group-hover:text-red-600">{$t('dashboard.analytics')}</h4>
                  <p class="text-gray-500 text-sm">{$t('dashboard.analyticsDescription')}</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      {/if}

      <!-- User Info Card -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">{$t('dashboard.yourProfile')}</h3>
        <dl class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <dt class="text-sm font-medium text-gray-500">{$t('dashboard.username')}</dt>
            <dd class="text-sm text-gray-900">@{user.username}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">{$t('dashboard.fullName')}</dt>
            <dd class="text-sm text-gray-900">{user.nombre} {user.apellido}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">{$t('dashboard.role')}</dt>
            <dd class="text-sm text-gray-900">{user.role}</dd>
          </div>
          {#if user.telefono}
            <div>
              <dt class="text-sm font-medium text-gray-500">{$t('dashboard.phone')}</dt>
              <dd class="text-sm text-gray-900">{user.telefono}</dd>
            </div>
          {/if}
        </dl>
      </div>
    </main>
  </div>
{:else}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
      <p class="text-gray-600">{$t('common.loading')}</p>
    </div>
  </div>
{/if}
