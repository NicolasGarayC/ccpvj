<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { BlogPost } from '$lib/types/api';

	export let visible = false;
	export let post: BlogPost | null = null;
	export let nextOrderNumber = 1;

	const dispatch = createEventDispatcher();

	function emitCreated() {
		dispatch('created', { id: post?.id ?? 'new-post', title: post?.title ?? 'Nuevo Artículo' });
	}

	function emitUpdated() {
		dispatch('updated', { id: post?.id ?? 'updated-post', title: post?.title ?? 'Artículo Actualizado' });
	}

	function emitClose() {
		dispatch('close');
	}
</script>

<div
	class="blog-post-form-stub"
	data-testid="blog-post-form-mock"
	data-visible={visible ? 'true' : 'false'}
	data-has-post={post ? 'true' : 'false'}
	data-next-order={nextOrderNumber}
>
	<button data-testid="emit-created" type="button" on:click={emitCreated}>
		Emitir created
	</button>
	<button data-testid="emit-updated" type="button" on:click={emitUpdated}>
		Emitir updated
	</button>
	<button data-testid="emit-close" type="button" on:click={emitClose}>
		Cerrar
	</button>
</div>
