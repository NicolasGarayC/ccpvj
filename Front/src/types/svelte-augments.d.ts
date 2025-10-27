import 'svelte';

declare module 'svelte' {
	interface SvelteComponentTyped<Props = {}, Events = {}, Slots = {}> {
		$on(type: string, callback: (event: CustomEvent<any>) => void): () => void;
	}
}
