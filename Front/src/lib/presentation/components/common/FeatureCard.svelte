<script lang="ts">
  export let title = '';
  export let description = '';
  export let icon = '';
</script>

<div class="bg-white p-6 rounded-lg shadow-md">
  {#if icon}
    <div class="text-indigo-600 mb-4">
      <i class={icon}></i>
    </div>
  {/if}
  <h3 class="text-xl font-semibold mb-3">{title}</h3>
  <p class="text-gray-600">{description}</p>
  <slot></slot>
</div>
