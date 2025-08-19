<script lang="ts">
  import { onMount } from 'svelte';
  import { t as paraglideT } from '$lib/paraglide/runtime';
  import { blogService } from '$lib/services/blog/blogService';
  import BlogPostCard from '$lib/components/blog/BlogPostCard.svelte';
  import type { BlogPost } from '$lib/data/models/interfaces';
  
  // Implementación temporal de t hasta que Paraglide cargue completamente
  let t = (key: string) => key;
  
  onMount(() => {
    // Una vez montado, podemos usar la función real de Paraglide
    t = paraglideT;
  });
  
  // Estado para los posts del blog
  let posts: BlogPost[] = [];
  let isLoading = true;
  let error: string | null = null;
  
  // Cargar todos los posts
  onMount(async () => {
    try {
      posts = await blogService.getAllPosts();
    } catch (e) {
      error = 'Error al cargar las noticias';
      console.error(error, e);
    } finally {
      isLoading = false;
    }
  });
</script>

<svelte:head>
  <title>{t('blogTitle')} | {t('centroTitle')}</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8">{t('newsAndAnnouncements')}</h1>
  
  {#if isLoading}
    <div class="flex justify-center py-12">
      <div class="animate-pulse text-gray-500">{t('loading')}</div>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 p-4 rounded-md text-red-700">
      {error}
    </div>
  {:else if posts.length === 0}
    <div class="text-center py-12 text-gray-500">
      <p>{t('noBlogPostsYet')}</p>
    </div>
  {:else}
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each posts as post}
        <BlogPostCard {post} />
      {/each}
    </div>
  {/if}
</div>
