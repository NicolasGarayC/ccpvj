<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import { getLocale, setLocale } from '$lib/paraglide/runtime';

  let currentLocale = 'es';
  let testMessage = '';
  let isLoaded = false;

  onMount(() => {
    currentLocale = getLocale();
    testMessage = t('auth.no_permissions_create');
    isLoaded = true;
    console.log('Current locale:', currentLocale);
    console.log('Test message:', testMessage);
  });

  function switchToSpanish() {
    setLocale('es', { reload: false });
    currentLocale = 'es';
    testMessage = t('auth.no_permissions_create');
  }

  function switchToEnglish() {
    setLocale('en', { reload: false });
    currentLocale = 'en';
    testMessage = t('auth.no_permissions_create');
  }
</script>

<svelte:head>
  <title>Simple i18n Test</title>
</svelte:head>

<div class="p-8">
  <h1 class="text-2xl font-bold mb-4">Simple i18n Test</h1>

  {#if isLoaded}
    <div class="mb-4">
      <p><strong>Current Locale:</strong> {currentLocale}</p>
      <p><strong>Test Message:</strong> {testMessage}</p>
    </div>

    <div class="space-x-4 mb-4">
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded"
        on:click={switchToSpanish}
      >
        Español
      </button>
      <button
        class="px-4 py-2 bg-green-500 text-white rounded"
        on:click={switchToEnglish}
      >
        English
      </button>
    </div>

    <div class="mt-4 p-4 bg-gray-100 rounded">
      <h3 class="font-semibold">Live Translations:</h3>
      <ul class="mt-2 space-y-1">
        <li><strong>Create:</strong> {t('action.create')}</li>
        <li><strong>Edit:</strong> {t('action.edit')}</li>
        <li><strong>Save:</strong> {t('action.save')}</li>
        <li><strong>Error:</strong> {t('error.generic')}</li>
      </ul>
    </div>
  {:else}
    <p>Loading...</p>
  {/if}
</div>