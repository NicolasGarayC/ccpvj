import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para Tests E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	// Directorio donde se encuentran los tests E2E
	testDir: './e2e',

	// Ejecutar tests en paralelo
	fullyParallel: true,

	// Fallar el build si hay tests marcados como `.only`
	forbidOnly: !!process.env.CI,

	// Reintentar tests fallidos en CI
	retries: process.env.CI ? 2 : 0,

	// Número de workers
	workers: process.env.CI ? 1 : undefined,

	// Reporter para los resultados
	reporter: [
		['html', { outputFolder: 'playwright-report' }],
		['json', { outputFile: 'test-results/results.json' }],
		['list']
	],

	// Configuración compartida para todos los proyectos
	use: {
		// URL base para los tests
		baseURL: 'http://localhost:5173',

		// Recolectar traces en caso de fallo
		trace: 'on-first-retry',

		// Screenshots solo en fallos
		screenshot: 'only-on-failure',

		// Video solo en fallos
		video: 'retain-on-failure'
	},

	// Configurar proyectos para diferentes navegadores
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},

		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] }
		},

		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] }
		},

		// Tests móviles
		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] }
		},
		{
			name: 'Mobile Safari',
			use: { ...devices['iPhone 12'] }
		}
	],

	// Servidor de desarrollo para los tests
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000
	}
});
