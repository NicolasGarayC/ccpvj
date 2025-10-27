import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import tailwindcss from '@tailwindcss/vite';

const projectRootDir = fileURLToPath(new URL('./', import.meta.url));

export default defineConfig({
	plugins: [tailwindcss(), svelteTesting(), sveltekit()],
	resolve: {
		alias: {
			'$lib': resolve(projectRootDir, 'src/lib'),
			'$lib/domain': resolve(projectRootDir, 'src/lib/domain'),
			'$lib/application': resolve(projectRootDir, 'src/lib/application'),
			'$lib/infrastructure': resolve(projectRootDir, 'src/lib/infrastructure'),
			'$lib/presentation': resolve(projectRootDir, 'src/lib/presentation'),
			'$lib/shared': resolve(projectRootDir, 'src/lib/shared')
		}
	},
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['node_modules', 'dist', '.svelte-kit', 'build'],
		setupFiles: ['./vitest-setup-client.ts']
	}
});
