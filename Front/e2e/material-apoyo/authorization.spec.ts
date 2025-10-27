import { test, expect } from '@playwright/test';

/**
 * Tests E2E para Autorización JWT en Material de Apoyo
 *
 * Verifica que:
 * - GET operations son públicas (sin autenticación)
 * - CREATE/UPDATE/DELETE requieren JWT válido
 * - Roles tienen permisos apropiados (admin, colaborador, asistente)
 * - Tokens expirados o inválidos son rechazados
 */

test.describe('Material de Apoyo - Authorization Tests', () => {
	test.describe('Public Access (No Authentication)', () => {
		test('should allow viewing materials list without login', async ({ page }) => {
			await page.goto('/material-apoyo');

			// Verificar que la página carga
			await expect(page).toHaveURL(/\/material-apoyo/);

			// Verificar que muestra el listado
			await expect(
				page.getByRole('heading', { name: /material.*apoyo|materiales/i })
			).toBeVisible();

			// Verificar que NO aparecen botones de crear
			await expect(page.getByRole('link', { name: /crear|nuevo/i })).not.toBeVisible();

			console.log('✓ Public access to materials list works');
		});

		test('should allow viewing material details without login', async ({ page }) => {
			await page.goto('/material-apoyo');

			const firstMaterial = page.locator('[data-testid="material-card"]').first();

			if (await firstMaterial.isVisible()) {
				await firstMaterial.click();

				// Verificar que muestra detalles
				await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

				// Verificar que NO aparecen botones de editar/eliminar
				await expect(page.getByRole('button', { name: /editar|edit/i })).not.toBeVisible();
				await expect(page.getByRole('button', { name: /eliminar|delete/i })).not.toBeVisible();

				console.log('✓ Public access to material details works');
			} else {
				test.skip(true, 'No materials available for testing');
			}
		});

		test('should allow viewing modules without login', async ({ page }) => {
			await page.goto('/material-apoyo');

			const firstMaterial = page.locator('[data-testid="material-card"]').first();

			if (await firstMaterial.isVisible()) {
				await firstMaterial.click();

				// Verificar que muestra módulos
				await expect(
					page.getByRole('heading', { name: /módulos|modules/i })
				).toBeVisible();

				// Verificar que NO aparecen botones de crear módulo
				await expect(
					page.getByRole('button', { name: /agregar.*módulo|crear módulo/i })
				).not.toBeVisible();

				console.log('✓ Public access to modules works');
			} else {
				test.skip(true, 'No materials available for testing');
			}
		});

		test('should redirect to login when trying to create material without auth', async ({
			page
		}) => {
			await page.goto('/material-apoyo/create');

			// Debería redirigir a login
			await page.waitForURL(/\/auth\/login/, { timeout: 5000 });

			expect(page.url()).toContain('/auth/login');

			console.log('✓ Redirects to login for protected route');
		});
	});

	test.describe('Admin Role - Full Access', () => {
		test.beforeEach(async ({ page }) => {
			// Login como administrador
			await page.goto('/auth/login');
			await page.getByLabel(/usuario|username/i).fill('admin');
			await page.getByLabel(/contraseña|password/i).fill('admin123');
			await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

			await page.waitForURL(/\/(dashboard|material-apoyo|blog)?/);
		});

		test('admin should create material de apoyo', async ({ page }) => {
			const timestamp = Date.now();

			await page.goto('/material-apoyo');
			await page.getByRole('link', { name: /crear|nuevo material/i }).click();

			await expect(page).toHaveURL(/\/material-apoyo\/create/);

			await page.getByLabel(/título|title/i).fill(`Material Admin ${timestamp}`);
			await page.getByLabel(/descripción|description/i).fill('Creado por admin');

			await page.getByRole('button', { name: /guardar|crear|publicar/i }).click();

			await expect(
				page.getByText(/creado.*éxito|created.*successfully/i)
			).toBeVisible({ timeout: 5000 });

			console.log('✓ Admin can create material');
		});

		test('admin should update any material de apoyo', async ({ page }) => {
			await page.goto('/material-apoyo');

			const firstMaterial = page.locator('[data-testid="material-card"]').first();

			if (await firstMaterial.isVisible()) {
				await firstMaterial.click();

				// Buscar botón de editar
				const editButton = page.getByRole('button', { name: /editar|edit/i });
				await expect(editButton).toBeVisible();

				await editButton.click();

				// Verificar que está en modo edición
				await expect(page).toHaveURL(/\/material-apoyo\/.*\/edit/);

				const titleInput = page.getByLabel(/título|title/i);
				await titleInput.clear();
				await titleInput.fill(`Material Editado ${Date.now()}`);

				await page.getByRole('button', { name: /guardar|actualizar/i }).click();

				await expect(
					page.getByText(/actualizado.*éxito|updated.*successfully/i)
				).toBeVisible({ timeout: 5000 });

				console.log('✓ Admin can update material');
			} else {
				test.skip(true, 'No materials available for testing');
			}
		});

		test('admin should delete material de apoyo', async ({ page }) => {
			// Primero crear un material para eliminar
			const timestamp = Date.now();

			await page.goto('/material-apoyo/create');
			await page.getByLabel(/título|title/i).fill(`Material to Delete ${timestamp}`);
			await page.getByLabel(/descripción|description/i).fill('Para eliminar');
			await page.getByRole('button', { name: /guardar|crear/i }).click();

			await page.waitForURL(/\/material-apoyo\/[a-f0-9-]+/);

			// Ahora eliminarlo
			const deleteButton = page.getByRole('button', { name: /eliminar|delete/i }).first();
			await deleteButton.click();

			// Confirmar eliminación
			await page.getByRole('button', { name: /confirmar|sí|yes/i }).click();

			await expect(
				page.getByText(/eliminado.*éxito|deleted.*successfully/i)
			).toBeVisible({ timeout: 5000 });

			console.log('✓ Admin can delete material');
		});

		test('admin should create module', async ({ page }) => {
			await page.goto('/material-apoyo');

			const firstMaterial = page.locator('[data-testid="material-card"]').first();

			if (await firstMaterial.isVisible()) {
				await firstMaterial.click();

				// Buscar botón de crear módulo
				const createModuleButton = page.getByRole('button', {
					name: /agregar.*módulo|crear módulo/i
				});
				await expect(createModuleButton).toBeVisible();

				await createModuleButton.click();

				await page
					.getByLabel(/título.*módulo|module.*title/i)
					.fill(`Módulo Admin ${Date.now()}`);
				await page
					.getByLabel(/descripción.*módulo|module.*description/i)
					.fill('Creado por admin');

				await page.getByRole('button', { name: /guardar.*módulo|save.*module/i }).click();

				await expect(page.getByText(/módulo.*creado|module.*created/i)).toBeVisible({
					timeout: 5000
				});

				console.log('✓ Admin can create module');
			} else {
				test.skip(true, 'No materials available for testing');
			}
		});

		test('admin should create post', async ({ page }) => {
			await page.goto('/material-apoyo');

			const firstMaterial = page.locator('[data-testid="material-card"]').first();

			if (await firstMaterial.isVisible()) {
				await firstMaterial.click();

				const firstModule = page.locator('[data-testid="module-card"]').first();

				if (await firstModule.isVisible()) {
					await firstModule.click();

					// Buscar botón de crear post
					const createPostButton = page.getByRole('button', {
						name: /agregar.*post|crear post/i
					});
					await expect(createPostButton).toBeVisible();

					await createPostButton.click();

					await page.getByLabel(/título.*post|post.*title/i).fill(`Post Admin ${Date.now()}`);
					await page
						.getByLabel(/contenido|content|descripción/i)
						.fill('Creado por admin');

					await page
						.getByRole('button', { name: /guardar.*post|save.*post|publicar/i })
						.click();

					await expect(page.getByText(/post.*creado|post.*created/i)).toBeVisible({
						timeout: 5000
					});

					console.log('✓ Admin can create post');
				} else {
					test.skip(true, 'No modules available for testing');
				}
			} else {
				test.skip(true, 'No materials available for testing');
			}
		});
	});

	test.describe('Collaborator Role - Manage Own Content', () => {
		test.skip(!process.env.TEST_COLLABORATOR_USER, 'Requires collaborator test user');

		test.beforeEach(async ({ page }) => {
			// Login como colaborador
			await page.goto('/auth/login');
			await page.getByLabel(/usuario|username/i).fill(process.env.TEST_COLLABORATOR_USER!);
			await page.getByLabel(/contraseña|password/i).fill(process.env.TEST_COLLABORATOR_PASSWORD!);
			await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

			await page.waitForURL(/\/(dashboard|material-apoyo|blog)?/);
		});

		test('collaborator should create own material', async ({ page }) => {
			const timestamp = Date.now();

			await page.goto('/material-apoyo');

			// Verificar que puede crear
			await expect(page.getByRole('link', { name: /crear|nuevo/i })).toBeVisible();

			await page.getByRole('link', { name: /crear|nuevo material/i }).click();

			await page.getByLabel(/título|title/i).fill(`Material Colaborador ${timestamp}`);
			await page.getByLabel(/descripción|description/i).fill('Creado por colaborador');

			await page.getByRole('button', { name: /guardar|crear/i }).click();

			await expect(page.getByText(/creado.*éxito/i)).toBeVisible({ timeout: 5000 });

			console.log('✓ Collaborator can create own material');
		});

		test('collaborator should NOT edit materials from other users', async ({ page }) => {
			await page.goto('/material-apoyo');

			// Buscar un material que no sea del colaborador
			const otherUserMaterial = page
				.locator('[data-testid="material-card"]')
				.filter({ hasNot: page.getByText(/colaborador/i) })
				.first();

			if (await otherUserMaterial.isVisible()) {
				await otherUserMaterial.click();

				// Verificar que NO puede editar
				await expect(page.getByRole('button', { name: /editar|edit/i })).not.toBeVisible();

				console.log('✓ Collaborator cannot edit other users materials');
			} else {
				test.skip(true, 'No materials from other users available');
			}
		});
	});

	test.describe('Asistente Role - Read Only', () => {
		test.skip(!process.env.TEST_ASISTENTE_USER, 'Requires asistente test user');

		test.beforeEach(async ({ page }) => {
			// Login como asistente
			await page.goto('/auth/login');
			await page.getByLabel(/usuario|username/i).fill(process.env.TEST_ASISTENTE_USER!);
			await page.getByLabel(/contraseña|password/i).fill(process.env.TEST_ASISTENTE_PASSWORD!);
			await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

			await page.waitForURL(/\/(dashboard|material-apoyo|blog)?/);
		});

		test('asistente should NOT see create button', async ({ page }) => {
			await page.goto('/material-apoyo');

			// Verificar que NO puede crear
			await expect(page.getByRole('link', { name: /crear|nuevo/i })).not.toBeVisible();

			console.log('✓ Asistente cannot create material');
		});

		test('asistente should NOT see edit buttons', async ({ page }) => {
			await page.goto('/material-apoyo');

			const firstMaterial = page.locator('[data-testid="material-card"]').first();

			if (await firstMaterial.isVisible()) {
				await firstMaterial.click();

				// Verificar que NO puede editar ni eliminar
				await expect(page.getByRole('button', { name: /editar|edit/i })).not.toBeVisible();
				await expect(page.getByRole('button', { name: /eliminar|delete/i })).not.toBeVisible();

				console.log('✓ Asistente cannot edit or delete material');
			} else {
				test.skip(true, 'No materials available');
			}
		});
	});

	test.describe('Invalid or Expired Token', () => {
		test('should reject invalid token', async ({ page, context }) => {
			// Establecer un token inválido en localStorage
			await page.goto('/material-apoyo');

			await page.evaluate(() => {
				localStorage.setItem('jwt_token', 'invalid-token-123');
				localStorage.setItem('jwt_user', JSON.stringify({ id: 1, username: 'fake' }));
			});

			// Intentar crear material
			await page.goto('/material-apoyo/create');

			// Debería redirigir a login o mostrar error
			const isLoginPage = await page.url().includes('/auth/login');
			const hasError = await page.getByText(/no autorizado|unauthorized/i).isVisible();

			expect(isLoginPage || hasError).toBe(true);

			console.log('✓ Invalid token is rejected');
		});

		test('should reject expired token', async ({ page }) => {
			// Crear un token expirado (exp en el pasado)
			const expiredToken =
				'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6InRlc3QiLCJleHAiOjE2MDE1MjAwMDB9.test';

			await page.goto('/material-apoyo');

			await page.evaluate((token) => {
				localStorage.setItem('jwt_token', token);
				localStorage.setItem('jwt_user', JSON.stringify({ id: 1, username: 'test' }));
			}, expiredToken);

			// Intentar crear material
			await page.goto('/material-apoyo/create');

			// Debería redirigir a login
			await page.waitForURL(/\/auth\/login/, { timeout: 5000 });

			expect(page.url()).toContain('/auth/login');

			console.log('✓ Expired token is rejected');
		});
	});

	test.describe('Token Storage and Persistence', () => {
		test('should persist token across page reloads', async ({ page }) => {
			// Login
			await page.goto('/auth/login');
			await page.getByLabel(/usuario|username/i).fill('admin');
			await page.getByLabel(/contraseña|password/i).fill('admin123');
			await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

			await page.waitForURL(/\/(dashboard|material-apoyo|blog)?/);

			// Verificar que el token está en localStorage
			const token = await page.evaluate(() => localStorage.getItem('jwt_token'));
			expect(token).toBeTruthy();

			// Recargar la página
			await page.reload();

			// Verificar que sigue autenticado
			await expect(
				page.getByRole('button', { name: /cerrar sesión|logout/i })
			).toBeVisible();

			// Verificar que puede acceder a rutas protegidas
			await page.goto('/material-apoyo/create');
			await expect(page).toHaveURL(/\/material-apoyo\/create/);

			console.log('✓ Token persists across page reloads');
		});

		test('should clear token on logout', async ({ page }) => {
			// Login
			await page.goto('/auth/login');
			await page.getByLabel(/usuario|username/i).fill('admin');
			await page.getByLabel(/contraseña|password/i).fill('admin123');
			await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

			await page.waitForURL(/\/(dashboard|material-apoyo|blog)?/);

			// Logout
			await page.getByRole('button', { name: /cerrar sesión|logout/i }).click();

			// Verificar que el token fue eliminado
			const token = await page.evaluate(() => localStorage.getItem('jwt_token'));
			expect(token).toBeNull();

			// Verificar que no puede acceder a rutas protegidas
			await page.goto('/material-apoyo/create');
			await page.waitForURL(/\/auth\/login/, { timeout: 5000 });

			console.log('✓ Token is cleared on logout');
		});
	});
});
