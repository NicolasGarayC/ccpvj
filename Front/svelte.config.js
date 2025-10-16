import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: [vitePreprocess(), mdsvex()],
	kit: {
		adapter: adapter({
			// Increase body size limit for large file uploads (20GB)
			maxBodySize: '21474836480' // 20GB in bytes
		})
	},
	extensions: ['.svelte', '.svx'],
};

export default config;
