<script lang="ts">
  import { setLocale, getLocale } from '$lib/paraglide/runtime';

  let currentLocale = 'es';

  function switchLanguage(locale: string) {
    setLocale(locale, { reload: false });
    currentLocale = locale;
    // Force a page reload to reload messages
    window.location.reload();
  }

  // Get current locale on mount
  if (typeof window !== 'undefined') {
    currentLocale = getLocale();
  }
</script>

<div class="language-switcher flex gap-2 items-center">
  <span class="text-sm text-gray-600">Idioma:</span>

  <button
    class="px-3 py-1 text-sm rounded border {currentLocale === 'es' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
    on:click={() => switchLanguage('es')}
  >
    Español
  </button>

  <button
    class="px-3 py-1 text-sm rounded border {currentLocale === 'en' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
    on:click={() => switchLanguage('en')}
  >
    English
  </button>
</div>

<style>
  .language-switcher {
    user-select: none;
  }

  button {
    transition: all 0.2s ease;
  }

  button:hover {
    transform: translateY(-1px);
  }
</style>