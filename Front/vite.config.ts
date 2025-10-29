import { paraglideVitePlugin } from '@inlang/paraglide-js';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson(),
		// paraglideVitePlugin({
		// 	project: './project.inlang',
		// 	outdir: './src/lib/paraglide'
		// })
	],
	server: {
		host: '0.0.0.0', // Allow access from network
		port: 5173, // Force specific port
		strictPort: true, // Fail if port is not available
		allowedHosts: ['ccpvj.com', 'www.ccpvj.com', '192.168.68.101', 'localhost'],
		proxy: {
			'/api': {
				// Exclude routes that SvelteKit handles directly
				bypass: (req) => {
					// Let SvelteKit handle upload and cleanup endpoints
					if (req.url?.startsWith('/api/upload/') || req.url?.startsWith('/api/cleanup/')) {
						return req.url; // Return the URL to bypass proxy
					}
					// Everything else goes to backend .NET
				},
				target: 'http://192.168.68.101:5251',
				changeOrigin: true,
				secure: false,
				timeout: 3600000, // 60 minutes for movie uploads
				proxyTimeout: 3600000 // 60 minutes for movie uploads
			}
		},
		watch: {
			ignored: [
				'**/project.inlang/cache/**',
				'**/src/lib/paraglide/**'
			]
		}
	}
});
