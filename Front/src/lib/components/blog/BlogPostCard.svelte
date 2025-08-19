<script lang="ts">
  export let post;
</script>

<div class="bg-white p-6 rounded-lg shadow-md">
  {#if post.featuredImage}
    <div class="mb-4 rounded-md overflow-hidden">
      <img 
        src={post.featuredImage} 
        alt={post.title} 
        class="w-full h-48 object-cover"
      />
    </div>
  {/if}
  
  <h3 class="text-xl font-semibold mb-2">{post.title}</h3>
  <p class="text-sm text-gray-500 mb-3">{new Date(post.publishDate).toLocaleDateString()}</p>
  <p class="text-gray-600 mb-4">{post.excerpt}</p>
  
  <a href={`/blog/${post.slug}`} class="text-indigo-600 font-medium hover:text-indigo-800">
    Leer más →
  </a>
</div>
