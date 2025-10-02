<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import BlogPostForm from './BlogPostForm.svelte';
	import type { BlogPost } from '$lib/types/api';

	export let visible = false;
	export let post: BlogPost | null = null;
	export let nextOrderNumber = 1;

	const dispatch = createEventDispatcher();

	function handleCreated(event: CustomEvent) {
		dispatch('created', event.detail);
	}

	function handleUpdated(event: CustomEvent) {
		dispatch('updated', event.detail);
	}

	function handleClose() {
		dispatch('close');
	}
</script>

<BlogPostForm
	{visible}
	{post}
	{nextOrderNumber}
	on:created={handleCreated}
	on:updated={handleUpdated}
	on:close={handleClose}
/>
