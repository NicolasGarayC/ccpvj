<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { translate as paraglideT } from '$lib/paraglide/runtime';
  import { jwtService } from '$lib/services/auth/jwtService.js';
  import BlogEditor from '$lib/components/blog/BlogEditor.svelte';
  import type { BlogPost } from '$lib/data/models/interfaces';

  let t = (key: string) => key;
  let canCreatePosts = false;

  onMount(() => {
    t = paraglideT;
    
    // Verificar permisos
    const user = jwtService.getUser();
    if (!user || !jwtService.isAuthenticated()) {
      goto('/auth/login');
      return;
    }
    
    // Solo educadores y administradores pueden crear posts
    canCreatePosts = user.nombreRol === 'Educador' || user.nombreRol === 'Administrador';
    if (!canCreatePosts) {
      goto('/blog');
      return;
    }
  });

  function handlePostSaved(post: BlogPost) {
    // Redirigir al post creado o al listado
    goto(`/blog/${post.slug}`);
  }

  function handleCancel() {
    goto('/blog');
  }
</script>

<svelte:head>
  <title>{t('createNewArticle') || 'Crear Nuevo Artículo'} | {t('centroTitle') || 'Centro Cultural'}</title>
</svelte:head>

{#if canCreatePosts}
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-6xl mx-auto px-4">
      <!-- Breadcrumb -->
      <nav class="mb-6">
        <div class="flex items-center space-x-2 text-sm text-gray-600">
          <a href="/" class="hover:text-indigo-600">{t('home') || 'Inicio'}</a>
          <i class="fas fa-chevron-right text-xs"></i>
          <a href="/blog" class="hover:text-indigo-600">{t('blog') || 'Blog'}</a>
          <i class="fas fa-chevron-right text-xs"></i>
          <span class="text-gray-900">{t('createArticle') || 'Crear Artículo'}</span>
        </div>
      </nav>

      <!-- Editor -->
      <BlogEditor 
        onSave={handlePostSaved}
        onCancel={handleCancel}
      />
    </div>
  </div>
{:else}
  <div class="flex justify-center items-center min-h-screen">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
{/if}
