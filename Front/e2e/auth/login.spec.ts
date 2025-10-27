import { test, expect } from '@playwright/test';

/**
 * Tests E2E para Autenticación y Login
 *
 * Flujos que se prueban:
 * - Login exitoso
 * - Login fallido (credenciales incorrectas)
 * - Logout
 * - Persistencia de sesión
 * - Redirección después de login
 */

test.describe('Authentication Flow', () => {
	test.beforeEach(async ({ page }) => {
		// Navegar a la página de login antes de cada test
		await page.goto('/auth/login');
	});

	test('should display login form', async ({ page }) => {
		// Verificar que el formulario de login está presente
		await expect(page.getByLabel(/usuario|username/i)).toBeVisible();
		await expect(page.getByLabel(/contraseña|password/i)).toBeVisible();
		await expect(page.getByRole('button', { name: /iniciar sesión|login/i })).toBeVisible();
	});

	test('should login successfully with valid credentials', async ({ page }) => {
		// Llenar el formulario con credenciales válidas
		await page.getByLabel(/usuario|username/i).fill('admin');
		await page.getByLabel(/contraseña|password/i).fill('admin123');

		// Click en el botón de login
		await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

		// Esperar redirección (puede ser a dashboard o home)
		await page.waitForURL(/\/(dashboard|material-apoyo|blog)?/);

		// Verificar que el usuario está autenticado
		// Buscar elementos que solo aparecen cuando estás logueado
		await expect(
			page.getByRole('button', { name: /cerrar sesión|logout|salir/i })
		).toBeVisible({ timeout: 5000 });
	});

	test('should show error with invalid credentials', async ({ page }) => {
		// Intentar login con credenciales incorrectas
		await page.getByLabel(/usuario|username/i).fill('wronguser');
		await page.getByLabel(/contraseña|password/i).fill('wrongpassword');

		await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

		// Verificar que muestra un mensaje de error
		await expect(page.getByText(/credenciales.*incorrectas|invalid.*credentials/i)).toBeVisible({
			timeout: 3000
		});

		// Verificar que sigue en la página de login
		await expect(page).toHaveURL(/\/auth\/login/);
	});

	test('should show validation errors for empty fields', async ({ page }) => {
		// Intentar submit sin llenar campos
		await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

		// Verificar mensajes de validación
		await expect(page.getByText(/requerido|required|obligatorio/i).first()).toBeVisible();
	});

	test('should logout successfully', async ({ page, context }) => {
		// Primero hacer login
		await page.getByLabel(/usuario|username/i).fill('admin');
		await page.getByLabel(/contraseña|password/i).fill('admin123');
		await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

		// Esperar a que cargue la página autenticada
		await page.waitForURL(/\/(dashboard|material-apoyo|blog)?/);

		// Buscar y click en logout
		const logoutButton = page.getByRole('button', { name: /cerrar sesión|logout|salir/i });
		await logoutButton.click();

		// Verificar redirección a login o home
		await page.waitForURL(/\/(auth\/login|$)/);

		// Verificar que el token fue eliminado del localStorage
		const token = await page.evaluate(() => localStorage.getItem('jwt_token'));
		expect(token).toBeNull();
	});

	test('should persist session after page reload', async ({ page }) => {
		// Login
		await page.getByLabel(/usuario|username/i).fill('admin');
		await page.getByLabel(/contraseña|password/i).fill('admin123');
		await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

		await page.waitForURL(/\/(dashboard|material-apoyo|blog)?/);

		// Recargar la página
		await page.reload();

		// Verificar que sigue autenticado
		await expect(
			page.getByRole('button', { name: /cerrar sesión|logout|salir/i })
		).toBeVisible();
	});

	test('should redirect to login when accessing protected route', async ({ page }) => {
		// Intentar acceder a ruta protegida sin autenticación
		await page.goto('/material-apoyo/create');

		// Debería redirigir a login
		await expect(page).toHaveURL(/\/auth\/login/);
	});

	test('should not show admin options for non-admin users', async ({ page }) => {
		// Este test requeriría un usuario colaborador o asistente
		// Por ahora lo marcamos como skip hasta tener más usuarios de prueba
		test.skip(!process.env.TEST_COLLABORATOR_USER, 'Requires collaborator test user');

		// Login como colaborador
		// await page.getByLabel(/usuario|username/i).fill(process.env.TEST_COLLABORATOR_USER!);
		// await page.getByLabel(/contraseña|password/i).fill(process.env.TEST_COLLABORATOR_PASSWORD!);
		// await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

		// Verificar que no aparecen opciones de admin
		// await expect(page.getByRole('link', { name: /usuarios|gestión/i })).not.toBeVisible();
	});
});

test.describe('Session Management', () => {
	test('should handle token expiration', async ({ page }) => {
		// Este test es más complejo y requeriría mockear el tiempo
		// Lo dejamos como ejemplo de lo que se podría testear
		test.skip(true, 'Requires time mocking setup');

		// Simular token expirado
		// Verificar que muestra modal de sesión expirada
		// Verificar que redirige a login
	});
});
