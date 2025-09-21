<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import { getLocale, setLocale } from '$lib/paraglide/runtime';

  let currentLocale = 'es';

  onMount(() => {
    currentLocale = getLocale();
  });

  function switchLanguage(locale: 'es' | 'en') {
    setLocale(locale, { reload: false });
    currentLocale = locale;
  }
</script>

<svelte:head>
  <title>Final i18n Test</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="container mx-auto px-4 max-w-4xl">
    <div class="bg-white rounded-lg shadow-lg p-6">

      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-900">🌐 Final Translation Test</h1>
        <div class="space-x-2">
          <button
            class="px-4 py-2 rounded {currentLocale === 'es' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}"
            on:click={() => switchLanguage('es')}
          >
            Español
          </button>
          <button
            class="px-4 py-2 rounded {currentLocale === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}"
            on:click={() => switchLanguage('en')}
          >
            English
          </button>
        </div>
      </div>

      <!-- Current Info -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p class="text-blue-700">
          <strong>Current Locale:</strong> {currentLocale}
        </p>
      </div>

      <!-- Translation Tests -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

        <!-- Auth Messages -->
        <div class="border rounded-lg p-4">
          <h3 class="font-semibold text-gray-800 mb-3">🔐 Authentication</h3>
          <div class="space-y-2 text-sm">
            <div class="bg-red-50 border border-red-200 rounded p-2">
              <strong>No permissions:</strong><br>
              {t('auth.no_permissions_create')}
            </div>
            <div class="bg-red-50 border border-red-200 rounded p-2">
              <strong>Login required:</strong><br>
              {t('auth.login_required')}
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="border rounded-lg p-4">
          <h3 class="font-semibold text-gray-800 mb-3">⚡ Actions</h3>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="bg-green-50 border border-green-200 rounded p-2 text-center">
              {t('action.create')}
            </div>
            <div class="bg-green-50 border border-green-200 rounded p-2 text-center">
              {t('action.edit')}
            </div>
            <div class="bg-green-50 border border-green-200 rounded p-2 text-center">
              {t('action.save')}
            </div>
            <div class="bg-green-50 border border-green-200 rounded p-2 text-center">
              {t('action.cancel')}
            </div>
          </div>
        </div>

        <!-- Blog -->
        <div class="border rounded-lg p-4">
          <h3 class="font-semibold text-gray-800 mb-3">📝 Blog</h3>
          <div class="space-y-2 text-sm">
            <div class="bg-purple-50 border border-purple-200 rounded p-2">
              <strong>Create:</strong> {t('blog.create_article')}
            </div>
            <div class="bg-purple-50 border border-purple-200 rounded p-2">
              <strong>Edit:</strong> {t('blog.edit_article')}
            </div>
          </div>
        </div>

        <!-- Errors -->
        <div class="border rounded-lg p-4">
          <h3 class="font-semibold text-gray-800 mb-3">❌ Errors</h3>
          <div class="space-y-2 text-sm">
            <div class="bg-red-50 border border-red-200 rounded p-2">
              <strong>Save error:</strong> {t('error.saving_post')}
            </div>
            <div class="bg-red-50 border border-red-200 rounded p-2">
              <strong>Generic:</strong> {t('error.generic')}
            </div>
          </div>
        </div>

      </div>

      <!-- Instructions -->
      <div class="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 class="font-semibold text-green-800 mb-2">✅ Instructions</h3>
        <p class="text-green-700">
          Click the language buttons above to switch between Spanish and English.
          All translations should update immediately without page reload.
        </p>
      </div>

    </div>
  </div>
</div>