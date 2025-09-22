<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import { getLocale } from '$lib/paraglide/runtime';
  import LanguageSwitcher from '$lib/components/common/LanguageSwitcher.svelte';

  let currentLocale = 'es';
  let isLoaded = false;

  onMount(async () => {
    await loadMessages();
    currentLocale = getLocale();
    isLoaded = true;
  });
</script>

<svelte:head>
  <title>Test de Traducciones - Centro Cultural</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="container mx-auto px-4 max-w-4xl">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-900">🌐 Test de Traducciones</h1>
        <LanguageSwitcher />
      </div>

      {#if isLoaded}
        <div class="space-y-6">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 class="text-lg font-semibold text-blue-800 mb-2">Información</h2>
            <p class="text-blue-700">
              Idioma actual: <strong class="font-mono">{currentLocale}</strong>
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Mensajes de Autenticación -->
            <div class="border rounded-lg p-4">
              <h3 class="font-semibold text-gray-800 mb-3">🔐 Mensajes de Autenticación</h3>
              <div class="space-y-2 text-sm">
                <div class="bg-red-50 border border-red-200 rounded p-2">
                  <strong>auth.no_permissions_create:</strong><br>
                  {t('auth.no_permissions_create')}
                </div>
                <div class="bg-red-50 border border-red-200 rounded p-2">
                  <strong>auth.login_required:</strong><br>
                  {t('auth.login_required')}
                </div>
                <div class="bg-red-50 border border-red-200 rounded p-2">
                  <strong>auth.own_posts_only:</strong><br>
                  {t('auth.own_posts_only')}
                </div>
              </div>
            </div>

            <!-- Acciones -->
            <div class="border rounded-lg p-4">
              <h3 class="font-semibold text-gray-800 mb-3">⚡ Acciones</h3>
              <div class="space-y-2 text-sm">
                <div class="bg-green-50 border border-green-200 rounded p-2">
                  <strong>action.create:</strong> {t('action.create')}
                </div>
                <div class="bg-green-50 border border-green-200 rounded p-2">
                  <strong>action.edit:</strong> {t('action.edit')}
                </div>
                <div class="bg-green-50 border border-green-200 rounded p-2">
                  <strong>action.save:</strong> {t('action.save')}
                </div>
                <div class="bg-green-50 border border-green-200 rounded p-2">
                  <strong>action.cancel:</strong> {t('action.cancel')}
                </div>
              </div>
            </div>

            <!-- Blog -->
            <div class="border rounded-lg p-4">
              <h3 class="font-semibold text-gray-800 mb-3">📝 Blog</h3>
              <div class="space-y-2 text-sm">
                <div class="bg-purple-50 border border-purple-200 rounded p-2">
                  <strong>blog.create_article:</strong><br>
                  {t('blog.create_article')}
                </div>
                <div class="bg-purple-50 border border-purple-200 rounded p-2">
                  <strong>blog.edit_article:</strong><br>
                  {t('blog.edit_article')}
                </div>
              </div>
            </div>

            <!-- Errores -->
            <div class="border rounded-lg p-4">
              <h3 class="font-semibold text-gray-800 mb-3">❌ Errores</h3>
              <div class="space-y-2 text-sm">
                <div class="bg-red-50 border border-red-200 rounded p-2">
                  <strong>error.saving_post:</strong><br>
                  {t('error.saving_post')}
                </div>
                <div class="bg-red-50 border border-red-200 rounded p-2">
                  <strong>error.generic:</strong><br>
                  {t('error.generic')}
                </div>
              </div>
            </div>
          </div>

          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 class="font-semibold text-green-800 mb-2">✅ Instrucciones</h3>
            <p class="text-green-700">
              Usa el selector de idioma arriba para cambiar entre Español e Inglés y ver las traducciones en acción.
            </p>
          </div>
        </div>
      {:else}
        <div class="text-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p class="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      {/if}
    </div>
  </div>
</div>