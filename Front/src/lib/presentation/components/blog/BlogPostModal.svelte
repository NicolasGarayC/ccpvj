<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import BlogPostForm from './BlogPostForm.svelte';
	import type { BlogPost } from '$lib/types/api';

	export let visible = false;
	export let post: BlogPost | null = null;
	export let nextOrderNumber = 1;
	export let formComponent: typeof BlogPostForm = BlogPostForm;
	// TODO: Revisar uso de callbacks - considerar hacer pattern con eventos solamente
	export let onCreated: ((detail: unknown) => void) | undefined = undefined;
	export let onUpdated: ((detail: unknown) => void) | undefined = undefined;
	export let onClose: (() => void) | undefined = undefined;

	const dispatch = createEventDispatcher();

	function handleCreated(event: CustomEvent) {
		dispatch('created', event.detail);
		onCreated?.(event.detail);
	}

	function handleUpdated(event: CustomEvent) {
		dispatch('updated', event.detail);
		onUpdated?.(event.detail);
	}

	function handleClose() {
		dispatch('close');
		onClose?.();
	}

	onMount(() => {
		// Listener para cerrar el modal cuando la sesión expire
		const handleSessionExpired = () => {
			console.log('🔒 Sesión expirada - cerrando BlogPostModal');
			visible = false;
			handleClose();
		};

		// Listener para cerrar cuando se llame closeAll()
		const handleCloseAll = () => {
			console.log('🔒 Close all modals - cerrando BlogPostModal');
			visible = false;
			handleClose();
		};

		window.addEventListener('session-expired', handleSessionExpired);
		window.addEventListener('close-all-modals', handleCloseAll);

		return () => {
			window.removeEventListener('session-expired', handleSessionExpired);
			window.removeEventListener('close-all-modals', handleCloseAll);
		};
	});
</script>

<svelte:component
	this={formComponent}
	{visible}
	{post}
	{nextOrderNumber}
	on:created={handleCreated}
	on:updated={handleUpdated}
	on:close={handleClose}
/>
