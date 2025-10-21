import { test, expect } from '@playwright/test';

/**
 * Tests E2E para Material de Apoyo (CRUD)
 *
 * Flujos que se prueban:
 * - Listar materiales educativos
 * - Crear nuevo material
 * - Editar material existente
 * - Eliminar material
 * - Búsqueda y filtrado
 */

test.describe('Material de Apoyo - CRUD Operations', () => {
	// Login antes de todos los tests
	test.beforeEach(async ({ page }) => {
		// Login como admin
		await page.goto('/auth/login');
		await page.getByLabel(/usuario|username/i).fill('admin');
		await page.getByLabel(/contraseña|password/i).fill('admin123');
		await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

		// Esperar a que el login complete
		await page.waitForURL(/\/(dashboard|material-apoyo|blog)?/);

		// Navegar a material de apoyo
		await page.goto('/material-apoyo');
	});

	test('should display list of materials', async ({ page }) => {
		// Verificar que la página carga
		await expect(page).toHaveURL(/\/material-apoyo/);

		// Verificar que hay algún título o header
		await expect(
			page.getByRole('heading', { name: /material.*apoyo|materiales/i })
		).toBeVisible();

		// Verificar botón de crear (solo para usuarios autenticados)
		await expect(page.getByRole('link', { name: /crear|nuevo/i })).toBeVisible();
	});

	test('should create new material successfully', async ({ page }) => {
		// Click en crear
		await page.getByRole('link', { name: /crear|nuevo/i }).click();

		// Esperar a que cargue el formulario
		await expect(page).toHaveURL(/\/material-apoyo\/create/);

		// Llenar el formulario
		const timestamp = Date.now();
		await page.getByLabel(/título|title/i).fill(`Material de Prueba ${timestamp}`);
		await page
			.getByLabel(/descripción|description/i)
			.fill('Esta es una descripción de prueba para el material educativo.');

		// Submit el formulario
		await page.getByRole('button', { name: /guardar|crear|publicar/i }).click();

		// Esperar mensaje de éxito o redirección
		await expect(
			page.getByText(/creado.*éxito|created.*successfully/i)
		).toBeVisible({ timeout: 5000 });

		// Verificar que redirige al listado o al detalle
		await expect(page).toHaveURL(/\/material-apoyo(\/[a-f0-9-]+)?/);
	});

	test('should show validation errors when creating with empty fields', async ({ page }) => {
		await page.getByRole('link', { name: /crear|nuevo/i }).click();

		// Intentar submit sin llenar campos requeridos
		await page.getByRole('button', { name: /guardar|crear|publicar/i }).click();

		// Verificar mensajes de validación
		await expect(page.getByText(/requerido|required|obligatorio/i).first()).toBeVisible();
	});

	test('should edit existing material', async ({ page }) => {
		// Buscar el primer material en la lista
		const firstMaterial = page.locator('[data-testid="material-card"]').first();
		await firstMaterial.waitFor({ state: 'visible', timeout: 5000 });

		// Click en editar (puede ser un botón o link)
		await firstMaterial.getByRole('link', { name: /editar|edit/i }).click();

		// Esperar a que cargue el formulario de edición
		await expect(page).toHaveURL(/\/material-apoyo\/[a-f0-9-]+/);

		// Modificar el título
		const titleInput = page.getByLabel(/título|title/i);
		await titleInput.clear();
		await titleInput.fill(`Material Editado ${Date.now()}`);

		// Guardar cambios
		await page.getByRole('button', { name: /guardar|actualizar|update/i }).click();

		// Verificar mensaje de éxito
		await expect(
			page.getByText(/actualizado.*éxito|updated.*successfully/i)
		).toBeVisible({ timeout: 5000 });
	});

	test('should delete material with confirmation', async ({ page }) => {
		// Crear un material específico para eliminar
		await page.goto('/material-apoyo/create');
		const testTitle = `Material a Eliminar ${Date.now()}`;
		await page.getByLabel(/título|title/i).fill(testTitle);
		await page.getByLabel(/descripción|description/i).fill('Material temporal para test');
		await page.getByRole('button', { name: /guardar|crear|publicar/i }).click();

		// Esperar confirmación
		await page.waitForURL(/\/material-apoyo/);

		// Buscar el material recién creado
		const materialToDelete = page.getByText(testTitle).first();
		await materialToDelete.waitFor({ state: 'visible' });

		// Click en el material o en su contenedor
		await materialToDelete.click();

		// Buscar botón de eliminar
		const deleteButton = page.getByRole('button', { name: /eliminar|delete|borrar/i });
		await deleteButton.click();

		// Confirmar eliminación en el modal/dialog
		await page.getByRole('button', { name: /confirmar|sí|yes|aceptar/i }).click();

		// Verificar mensaje de éxito
		await expect(
			page.getByText(/eliminado.*éxito|deleted.*successfully/i)
		).toBeVisible({ timeout: 5000 });
	});

	test('should search materials by title', async ({ page }) => {
		// Buscar campo de búsqueda
		const searchInput = page.getByPlaceholder(/buscar|search/i);

		if (await searchInput.isVisible()) {
			// Escribir término de búsqueda
			await searchInput.fill('Matemáticas');

			// Esperar a que se filtren los resultados
			await page.waitForTimeout(500);

			// Verificar que los resultados contienen el término buscado
			const results = page.locator('[data-testid="material-card"]');
			const count = await results.count();

			if (count > 0) {
				const firstResult = results.first();
				await expect(firstResult).toContainText(/matemáticas/i);
			}
		} else {
			test.skip(true, 'Search functionality not visible');
		}
	});

	test('should filter materials by featured', async ({ page }) => {
		// Buscar filtro de destacados
		const featuredFilter = page.getByRole('button', { name: /destacados|featured/i });

		if (await featuredFilter.isVisible()) {
			await featuredFilter.click();

			// Esperar a que se aplique el filtro
			await page.waitForTimeout(500);

			// Verificar que los resultados tienen el badge de destacado
			const results = page.locator('[data-testid="material-card"]');
			const count = await results.count();

			if (count > 0) {
				await expect(results.first().getByText(/destacado|featured/i)).toBeVisible();
			}
		} else {
			test.skip(true, 'Featured filter not visible');
		}
	});

	test('should navigate to material detail', async ({ page }) => {
		// Click en el primer material
		const firstMaterial = page.locator('[data-testid="material-card"]').first();

		if (await firstMaterial.isVisible()) {
			await firstMaterial.click();

			// Verificar navegación al detalle
			await expect(page).toHaveURL(/\/material-apoyo\/[a-f0-9-]+/);

			// Verificar que muestra información del material
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		} else {
			test.skip(true, 'No materials available to test');
		}
	});
});

test.describe('Material de Apoyo - Module Management', () => {
	test.beforeEach(async ({ page }) => {
		// Login
		await page.goto('/auth/login');
		await page.getByLabel(/usuario|username/i).fill('admin');
		await page.getByLabel(/contraseña|password/i).fill('admin123');
		await page.getByRole('button', { name: /iniciar sesión|login/i }).click();
		await page.waitForURL(/\/(dashboard|material-apoyo|blog)?/);
	});

	test('should add module to material', async ({ page }) => {
		// Este test asume que hay al menos un material
		await page.goto('/material-apoyo');

		const firstMaterial = page.locator('[data-testid="material-card"]').first();
		if (await firstMaterial.isVisible()) {
			await firstMaterial.click();

			// Buscar botón de agregar módulo
			const addModuleButton = page.getByRole('button', { name: /agregar módulo|add module/i });

			if (await addModuleButton.isVisible()) {
				await addModuleButton.click();

				// Llenar formulario de módulo
				await page.getByLabel(/título.*módulo/i).fill(`Módulo de Prueba ${Date.now()}`);
				await page.getByLabel(/descripción/i).fill('Descripción del módulo de prueba');

				// Guardar
				await page.getByRole('button', { name: /guardar|crear/i }).click();

				// Verificar éxito
				await expect(page.getByText(/módulo.*creado/i)).toBeVisible({ timeout: 5000 });
			} else {
				test.skip(true, 'Add module functionality not available');
			}
		} else {
			test.skip(true, 'No materials available');
		}
	});
});
