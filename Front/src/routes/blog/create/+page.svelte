<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    // Redirigir al listado de blog (ahora usamos modal)
    goto('/blog');
  });
</script>

<svelte:head>
  <title>Redirigiendo... | Centro Cultural</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="text-center">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
    <p class="text-gray-600">Redirigiendo...</p>
  </div>
</div>
