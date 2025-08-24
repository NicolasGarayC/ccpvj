<script lang="ts">
  import { t as paraglideT, locale, availableLocales } from '$lib/paraglide/runtime';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let t = (key: string) => key;
  let username = '';
  let password = '';
  let error: string | null = null;
  let loading = false;

  onMount(() => {
    t = paraglideT;
  });

  async function handleLogin(e: Event) {
    e.preventDefault();
    error = null;
    loading = true;

    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        goto('/dashboard');
      } else {
        const data = await res.json().catch(() => ({}));
        error = data?.message || t('loginError') || 'Usuario o contraseña incorrectos';
      }
    } catch (err) {
      error = t('loginError') || 'Error de conexión. Verifica tu red local.';
    } finally {
      loading = false;
    }
  }

  function switchLocale() {
    const next = availableLocales.find(l => l !== $locale) || 'es';
    locale.set(next);
  }
</script>

<svelte:head>
  <title>{t('login') || 'Iniciar Sesión'}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4">
  <div class="w-full max-w-md">
    <!-- Logo/Título del Centro Cultural -->
    <div class="text-center mb-8">
      <div class="bg-indigo-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <i class="fas fa-network-wired text-indigo-600 text-2xl"></i>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">
        {t('centroTitle') || 'Centro Cultural Víctor Jara'}
      </h1>
      <p class="text-gray-600">
        {t('loginSubtitle') || 'Red Comunitaria de Aprendizaje'}
      </p>
    </div>

    <!-- Formulario de Login -->
    <form class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100" on:submit|preventDefault={handleLogin}>
      <div class="text-center mb-6">
        <h2 class="text-xl font-semibold text-gray-800">
          {t('login') || 'Iniciar Sesión'}
        </h2>
      </div>

      {#if error}
        <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <div class="flex items-center">
            <i class="fas fa-exclamation-circle text-red-500 mr-2"></i>
            <span class="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      {/if}

      <!-- Campo Usuario -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2" for="username">
          <i class="fas fa-user mr-1"></i>
          {t('username') || 'Usuario'}
        </label>
        <input
          id="username"
          type="text"
          bind:value={username}
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          placeholder={t('usernamePlaceholder') || 'Ingresa tu usuario'}
          required
          disabled={loading}
        />
      </div>

      <!-- Campo Contraseña -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2" for="password">
          <i class="fas fa-lock mr-1"></i>
          {t('password') || 'Contraseña'}
        </label>
        <input
          id="password"
          type="password"
          bind:value={password}
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          placeholder={t('passwordPlaceholder') || 'Ingresa tu contraseña'}
          required
          disabled={loading}
        />
      </div>

      <!-- Botón de Login -->
      <button
        type="submit"
        class="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading}
      >
        {#if loading}
          <i class="fas fa-spinner fa-spin mr-2"></i>
          {t('loggingIn') || 'Iniciando sesión...'}
        {:else}
          <i class="fas fa-sign-in-alt mr-2"></i>
          {t('login') || 'Iniciar Sesión'}
        {/if}
      </button>
    </form>

    <!-- Footer con cambio de idioma -->
    <div class="mt-6 flex justify-between items-center">
      <a href="/" class="text-indigo-600 hover:text-indigo-800 text-sm">
        <i class="fas fa-arrow-left mr-1"></i>
        {t('backToHome') || 'Volver al inicio'}
      </a>
      <button
        type="button"
        class="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
        on:click={switchLocale}
        aria-label="Switch language"
      >
        <i class="fas fa-language mr-1"></i>
        {#if $locale === 'es'}EN{:else}ES{/if}
      </button>
    </div>
  </div>
</div>
