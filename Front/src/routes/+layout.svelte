<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { t as paraglideT, locale, availableLocales } from '$lib/paraglide/runtime';

  let t = (key: string) => key;

  // Selección automática de idioma base según navegador
  onMount(() => {
    t = paraglideT;
    // Si el usuario no ha seleccionado idioma, usar el del navegador
    if (!availableLocales.includes($locale)) {
      const browserLang = navigator.language?.split('-')[0] || 'es';
      if (availableLocales.includes(browserLang)) {
        locale.set(browserLang);
      } else {
        locale.set('es');
      }
    }
  });

  $: isLoggedIn = $page.data.user !== null && $page.data.user !== undefined;
  $: userName = isLoggedIn ? $page.data.user?.nombre : '';

  function switchLocale() {
    // Cambia entre los idiomas disponibles
    const next = availableLocales.find(l => l !== $locale) || 'es';
    locale.set(next);
  }
</script>

<div class="min-h-screen flex flex-col">
  <header class="bg-indigo-600 text-white shadow-md">
    <div class="container mx-auto px-4 py-3 flex justify-between items-center">
      <a href="/" class="text-xl font-bold">Tesis</a>
      <nav class="flex items-center gap-4">
        <a href="/" class="hover:underline">{t('home')}</a>
        {#if isLoggedIn}
          <a href="/dashboard" class="hover:underline">{t('dashboard')}</a>
          <div class="flex items-center gap-2">
            <span class="hidden md:inline">{userName}</span>
            <form action="/auth/logout" method="POST">
              <button type="submit" class="bg-white text-indigo-600 px-3 py-1 rounded-md text-sm font-medium">
                {t('logout')}
              </button>
            </form>
          </div>
        {:else}
          <a href="/auth/login" class="bg-white text-indigo-600 px-3 py-1 rounded-md text-sm font-medium">
            {t('login')}
          </a>
          <a href="/auth/register" class="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-md text-sm font-medium">
            {t('register')}
          </a>
        {/if}
        <!-- Botón de cambio de idioma -->
        <button
          class="ml-2 px-3 py-1 rounded-md bg-indigo-900 hover:bg-indigo-800 text-white text-sm font-medium border border-indigo-400 transition"
          on:click={switchLocale}
          aria-label="Switch language"
        >
          <i class="fas fa-language mr-1"></i>
          {#if $locale === 'es'}EN{:else}ES{/if}
        </button>
      </nav>
    </div>
  </header>

  <main class="flex-grow container mx-auto px-4 py-6">
    <slot />
  </main>

  <footer class="bg-gray-100 py-6">
    <div class="container mx-auto px-4 text-center text-gray-600">
      <p>&copy; {new Date().getFullYear()} Tesis - {t('footerText')}</p>
    </div>
  </footer>
</div>
