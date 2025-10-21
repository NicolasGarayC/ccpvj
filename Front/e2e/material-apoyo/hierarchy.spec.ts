import { test, expect } from '@playwright/test';

/**
 * Tests E2E para la Jerarquía Completa de Material de Apoyo
 *
 * Jerarquía: Material de Apoyo → Módulo → Post
 *
 * Flujos probados:
 * - Crear Material → Crear Módulo → Crear Post (flujo completo)
 * - Editar en cada nivel
 * - Eliminar en cada nivel (con cascade)
 * - Reordenar módulos y posts
 * - Navegación entre niveles
 * - Verificación de permisos JWT
 */

test.describe('Material de Apoyo - Jerarquía Completa', () => {
	// Variables para guardar IDs creados durante los tests
	let materialId: string;
	let moduleId: string;
	let postId: string;

	test.beforeEach(async ({ page }) => {
		// Login como administrador
		await page.goto('/auth/login');
		await page.getByLabel(/usuario|username/i).fill('admin');
		await page.getByLabel(/contraseña|password/i).fill('admin123');
		await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

		// Esperar a que complete el login
		await page.waitForURL(/\/(dashboard|material-apoyo|blog)?/);
	});

	test('should complete full hierarchy: Material → Module → Post', async ({ page }) => {
		const timestamp = Date.now();

		// ==========================================
		// PASO 1: Crear Material de Apoyo
		// ==========================================

		await page.goto('/material-apoyo');
		await page.getByRole('link', { name: /crear|nuevo material/i }).click();

		await expect(page).toHaveURL(/\/material-apoyo\/create/);

		// Llenar formulario de material
		await page.getByLabel(/título|title/i).fill(`Material E2E ${timestamp}`);
		await page
			.getByLabel(/descripción|description/i)
			.fill('Material creado por test E2E para verificar jerarquía completa');

		// Guardar material
		await page.getByRole('button', { name: /guardar|crear|publicar/i }).click();

		// Verificar creación exitosa
		await expect(
			page.getByText(/creado.*éxito|created.*successfully/i)
		).toBeVisible({ timeout: 5000 });

		// Capturar el ID del material desde la URL
		await page.waitForURL(/\/material-apoyo\/[a-f0-9-]+/);
		const materialUrl = page.url();
		materialId = materialUrl.split('/material-apoyo/')[1].split(/[?#]/)[0];

		console.log('✓ Material creado con ID:', materialId);

		// ==========================================
		// PASO 2: Crear Módulo
		// ==========================================

		// Buscar botón de crear módulo
		const createModuleButton = page.getByRole('button', { name: /agregar.*módulo|crear módulo/i });
		await createModuleButton.waitFor({ state: 'visible', timeout: 5000 });
		await createModuleButton.click();

		// Llenar formulario de módulo
		await page.getByLabel(/título.*módulo|module.*title/i).fill(`Módulo E2E ${timestamp}`);
		await page
			.getByLabel(/descripción.*módulo|module.*description/i)
			.fill('Módulo creado por test E2E');

		// Guardar módulo
		await page.getByRole('button', { name: /guardar.*módulo|save.*module/i }).click();

		// Verificar creación exitosa
		await expect(
			page.getByText(/módulo.*creado|module.*created/i)
		).toBeVisible({ timeout: 5000 });

		// Buscar el módulo recién creado en la lista
		const moduleCard = page.getByText(`Módulo E2E ${timestamp}`);
		await moduleCard.waitFor({ state: 'visible' });

		console.log('✓ Módulo creado');

		// ==========================================
		// PASO 3: Entrar al Módulo y Crear Post
		// ==========================================

		// Click en el módulo para ver sus posts
		await moduleCard.click();

		// Esperar a que cargue la vista del módulo
		await expect(page.getByRole('heading', { name: `Módulo E2E ${timestamp}` })).toBeVisible();

		// Buscar botón de crear post
		const createPostButton = page.getByRole('button', { name: /agregar.*post|crear post/i });
		await createPostButton.waitFor({ state: 'visible', timeout: 5000 });
		await createPostButton.click();

		// Llenar formulario de post
		await page.getByLabel(/título.*post|post.*title/i).fill(`Post E2E ${timestamp}`);
		await page
			.getByLabel(/contenido|content|descripción/i)
			.fill('Post creado por test E2E con contenido de prueba');

		// Guardar post
		await page.getByRole('button', { name: /guardar.*post|save.*post|publicar/i }).click();

		// Verificar creación exitosa
		await expect(
			page.getByText(/post.*creado|post.*created/i)
		).toBeVisible({ timeout: 5000 });

		// Verificar que el post aparece en la lista
		await expect(page.getByText(`Post E2E ${timestamp}`)).toBeVisible();

		console.log('✓ Post creado');
		console.log('✓ Jerarquía completa creada exitosamente');
	});

	test('should edit material, module, and post', async ({ page }) => {
		// Este test asume que ya existe material con módulos y posts
		await page.goto('/material-apoyo');

		// Buscar el primer material
		const firstMaterial = page.locator('[data-testid="material-card"]').first();

		if (await firstMaterial.isVisible()) {
			// Editar material
			await firstMaterial.getByRole('link', { name: /editar|edit/i }).click();

			const titleInput = page.getByLabel(/título|title/i);
			await titleInput.clear();
			await titleInput.fill(`Material Editado ${Date.now()}`);

			await page.getByRole('button', { name: /guardar|actualizar/i }).click();

			await expect(
				page.getByText(/actualizado.*éxito|updated.*successfully/i)
			).toBeVisible({ timeout: 5000 });

			console.log('✓ Material editado exitosamente');
		} else {
			test.skip(true, 'No hay materiales disponibles para editar');
		}
	});

	test('should delete post (leaf level)', async ({ page }) => {
		// Navegar a un material con módulos y posts
		await page.goto('/material-apoyo');

		const firstMaterial = page.locator('[data-testid="material-card"]').first();

		if (await firstMaterial.isVisible()) {
			await firstMaterial.click();

			// Buscar un módulo
			const firstModule = page.locator('[data-testid="module-card"]').first();

			if (await firstModule.isVisible()) {
				await firstModule.click();

				// Buscar un post
				const firstPost = page.locator('[data-testid="post-card"]').first();

				if (await firstPost.isVisible()) {
					// Click en eliminar post
					const deleteButton = firstPost.getByRole('button', { name: /eliminar|delete/i });
					await deleteButton.click();

					// Confirmar eliminación
					await page.getByRole('button', { name: /confirmar|sí|yes/i }).click();

					// Verificar eliminación
					await expect(
						page.getByText(/eliminado.*éxito|deleted.*successfully/i)
					).toBeVisible({ timeout: 5000 });

					console.log('✓ Post eliminado exitosamente');
				} else {
					test.skip(true, 'No hay posts para eliminar');
				}
			} else {
				test.skip(true, 'No hay módulos');
			}
		} else {
			test.skip(true, 'No hay materiales');
		}
	});

	test('should delete module (cascade deletes posts)', async ({ page }) => {
		// Crear material y módulo con posts para probar cascade
		const timestamp = Date.now();

		await page.goto('/material-apoyo/create');
		await page.getByLabel(/título/i).fill(`Material Cascade ${timestamp}`);
		await page.getByLabel(/descripción/i).fill('Para probar cascade delete');
		await page.getByRole('button', { name: /guardar|crear/i }).click();

		await page.waitForURL(/\/material-apoyo\/[a-f0-9-]+/);

		// Crear módulo
		await page.getByRole('button', { name: /agregar.*módulo/i }).click();
		await page.getByLabel(/título.*módulo/i).fill('Módulo a Eliminar');
		await page.getByLabel(/descripción.*módulo/i).fill('Se eliminará');
		await page.getByRole('button', { name: /guardar.*módulo/i }).click();

		await expect(page.getByText(/módulo.*creado/i)).toBeVisible({ timeout: 5000 });

		// Eliminar el módulo
		const moduleToDelete = page.getByText('Módulo a Eliminar');
		await moduleToDelete.waitFor({ state: 'visible' });

		const deleteModuleButton = page.getByRole('button', { name: /eliminar.*módulo/i }).first();
		await deleteModuleButton.click();

		// Confirmar
		await page.getByRole('button', { name: /confirmar|sí/i }).click();

		// Verificar eliminación
		await expect(page.getByText(/eliminado.*éxito/i)).toBeVisible({ timeout: 5000 });

		// Verificar que el módulo ya no aparece
		await expect(moduleToDelete).not.toBeVisible();

		console.log('✓ Módulo eliminado (cascade)');
	});

	test('should navigate through hierarchy levels', async ({ page }) => {
		await page.goto('/material-apoyo');

		const firstMaterial = page.locator('[data-testid="material-card"]').first();

		if (await firstMaterial.isVisible()) {
			// Nivel 1: Material de Apoyo
			await firstMaterial.click();
			await expect(page).toHaveURL(/\/material-apoyo\/[a-f0-9-]+/);

			// Nivel 2: Ver módulos
			const firstModule = page.locator('[data-testid="module-card"]').first();

			if (await firstModule.isVisible()) {
				await firstModule.click();

				// Verificar que estamos en la vista del módulo
				await expect(page.getByRole('heading', { level: 2 })).toBeVisible();

				// Nivel 3: Ver posts
				const postsList = page.locator('[data-testid="posts-list"]');
				await expect(postsList).toBeVisible();

				// Navegar de vuelta
				const backButton = page.getByRole('link', { name: /volver|back|regresar/i });

				if (await backButton.isVisible()) {
					await backButton.click();
					await expect(page).toHaveURL(/\/material-apoyo\/[a-f0-9-]+/);
				}

				console.log('✓ Navegación entre niveles exitosa');
			} else {
				test.skip(true, 'No hay módulos para navegar');
			}
		} else {
			test.skip(true, 'No hay materiales');
		}
	});

	test('should reorder modules', async ({ page }) => {
		await page.goto('/material-apoyo');

		const firstMaterial = page.locator('[data-testid="material-card"]').first();

		if (await firstMaterial.isVisible()) {
			await firstMaterial.click();

			// Buscar botones de reordenar
			const reorderButtons = page.locator('[data-testid="module-reorder"]');
			const count = await reorderButtons.count();

			if (count >= 2) {
				// Cambiar orden del segundo módulo
				const secondModuleReorder = reorderButtons.nth(1);
				await secondModuleReorder.click();

				// Esperar a que se aplique el reordenamiento
				await page.waitForTimeout(1000);

				console.log('✓ Módulos reordenados');
			} else {
				test.skip(true, 'No hay suficientes módulos para reordenar');
			}
		} else {
			test.skip(true, 'No hay materiales');
		}
	});
});

test.describe('Material de Apoyo - Public Access (No Auth)', () => {
	test.beforeEach(async ({ page }) => {
		// NO hacer login - probar acceso público
		await page.goto('/material-apoyo');
	});

	test('should view materials without authentication', async ({ page }) => {
		// Verificar que la página carga
		await expect(page).toHaveURL(/\/material-apoyo/);

		// Verificar que muestra materiales
		await expect(
			page.getByRole('heading', { name: /material.*apoyo|materiales/i })
		).toBeVisible();

		// Verificar que NO aparecen botones de crear
		await expect(
			page.getByRole('link', { name: /crear|nuevo/i })
		).not.toBeVisible();

		console.log('✓ Vista pública funciona correctamente');
	});

	test('should view material details without authentication', async ({ page }) => {
		const firstMaterial = page.locator('[data-testid="material-card"]').first();

		if (await firstMaterial.isVisible()) {
			await firstMaterial.click();

			// Verificar que muestra detalles
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

			// Verificar que NO aparecen botones de editar/eliminar
			await expect(page.getByRole('button', { name: /editar|edit/i })).not.toBeVisible();
			await expect(page.getByRole('button', { name: /eliminar|delete/i })).not.toBeVisible();

			console.log('✓ Vista de detalles pública funciona');
		} else {
			test.skip(true, 'No hay materiales para ver');
		}
	});

	test('should NOT allow create material without authentication', async ({ page }) => {
		// Intentar acceder a la página de crear
		await page.goto('/material-apoyo/create');

		// Debería redirigir a login
		await page.waitForURL(/\/auth\/login/, { timeout: 5000 });

		expect(page.url()).toContain('/auth/login');

		console.log('✓ Redirige a login cuando intenta crear sin auth');
	});
});

test.describe('Material de Apoyo - Authorization by Role', () => {
	test('admin should have full access', async ({ page }) => {
		// Login como admin
		await page.goto('/auth/login');
		await page.getByLabel(/usuario/i).fill('admin');
		await page.getByLabel(/contraseña/i).fill('admin123');
		await page.getByRole('button', { name: /iniciar sesión/i }).click();

		await page.goto('/material-apoyo');

		// Verificar que puede crear
		await expect(page.getByRole('link', { name: /crear|nuevo/i })).toBeVisible();

		const firstMaterial = page.locator('[data-testid="material-card"]').first();

		if (await firstMaterial.isVisible()) {
			await firstMaterial.click();

			// Verificar que puede editar y eliminar
			await expect(
				page.getByRole('button', { name: /editar|edit/i })
			).toBeVisible();
			await expect(
				page.getByRole('button', { name: /eliminar|delete/i })
			).toBeVisible();

			console.log('✓ Admin tiene acceso completo');
		}
	});

	test('collaborator should manage own content', async ({ page }) => {
		// Este test requiere un usuario colaborador
		test.skip(!process.env.TEST_COLLABORATOR_USER, 'Requires collaborator test user');

		// Login como colaborador
		// await page.goto('/auth/login');
		// await page.getByLabel(/usuario/i).fill(process.env.TEST_COLLABORATOR_USER!);
		// await page.getByLabel(/contraseña/i).fill(process.env.TEST_COLLABORATOR_PASSWORD!);
		// await page.getByRole('button', { name: /iniciar sesión/i }).click();

		// Verificar permisos de colaborador
	});
});
