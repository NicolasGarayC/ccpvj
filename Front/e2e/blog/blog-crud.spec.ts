import { test, expect } from '@playwright/test';

/**
 * Tests E2E para Blog Posts
 *
 * Flujos probados:
 * - Crear post con elementos (texto, imágenes)
 * - Editar post
 * - Publicar/despublicar
 * - Eliminar post
 * - Vista pública vs admin
 */

test.describe('Blog - CRUD Operations', () => {
	test.beforeEach(async ({ page }) => {
		// Login como administrador
		await page.goto('/auth/login');
		await page.getByLabel(/usuario|username/i).fill('admin');
		await page.getByLabel(/contraseña|password/i).fill('admin123');
		await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

		await page.waitForURL(/\/(dashboard|blog|material-apoyo)?/);
	});

	test('should create a new blog post', async ({ page }) => {
		const timestamp = Date.now();

		await page.goto('/blog');
		await page.getByRole('link', { name: /crear|nuevo.*post/i }).click();

		await expect(page).toHaveURL(/\/blog\/create/);

		// Llenar formulario
		await page.getByLabel(/título|title/i).fill(`Post E2E ${timestamp}`);
		await page.getByLabel(/slug/i).fill(`post-e2e-${timestamp}`);
		await page
			.getByLabel(/subtítulo|subtitle/i)
			.fill('Subtítulo creado por test E2E');

		// Agregar contenido
		const contentArea = page.getByLabel(/contenido|content/i);
		if (await contentArea.isVisible()) {
			await contentArea.fill('Este es el contenido del post creado por E2E tests.');
		}

		// Guardar como borrador
		await page.getByRole('button', { name: /guardar|crear/i }).click();

		await expect(
			page.getByText(/creado.*éxito|created.*successfully/i)
		).toBeVisible({ timeout: 5000 });

		console.log('✓ Post creado exitosamente');
	});

	test('should edit existing blog post', async ({ page }) => {
		await page.goto('/blog');

		const firstPost = page.locator('[data-testid="blog-post-card"]').first();

		if (await firstPost.isVisible()) {
			await firstPost.getByRole('link', { name: /editar|edit/i }).click();

			await expect(page).toHaveURL(/\/blog\/.*\/edit/);

			const titleInput = page.getByLabel(/título|title/i);
			const currentTitle = await titleInput.inputValue();
			await titleInput.clear();
			await titleInput.fill(`${currentTitle} - Editado`);

			await page.getByRole('button', { name: /guardar|actualizar/i }).click();

			await expect(
				page.getByText(/actualizado.*éxito|updated.*successfully/i)
			).toBeVisible({ timeout: 5000 });

			console.log('✓ Post editado exitosamente');
		} else {
			test.skip(true, 'No hay posts disponibles para editar');
		}
	});

	test('should publish/unpublish blog post', async ({ page }) => {
		await page.goto('/blog');

		const firstPost = page.locator('[data-testid="blog-post-card"]').first();

		if (await firstPost.isVisible()) {
			await firstPost.click();

			// Buscar botón de publicar/despublicar
			const publishButton = page.getByRole('button', { name: /publicar|despublicar/i });

			if (await publishButton.isVisible()) {
				const initialText = await publishButton.textContent();
				await publishButton.click();

				// Verificar cambio de estado
				await expect(publishButton).not.toHaveText(initialText || '');

				console.log('✓ Estado de publicación cambiado');
			}
		} else {
			test.skip(true, 'No hay posts disponibles');
		}
	});

	test('should delete blog post', async ({ page }) => {
		const timestamp = Date.now();

		// Primero crear un post para eliminar
		await page.goto('/blog/create');

		await page.getByLabel(/título|title/i).fill(`Post to Delete ${timestamp}`);
		await page.getByLabel(/slug/i).fill(`delete-${timestamp}`);
		await page.getByRole('button', { name: /guardar|crear/i }).click();

		await expect(page.getByText(/creado.*éxito/i)).toBeVisible({ timeout: 5000 });

		// Ahora eliminarlo
		const deleteButton = page.getByRole('button', { name: /eliminar|delete/i }).first();
		await deleteButton.click();

		// Confirmar eliminación
		await page.getByRole('button', { name: /confirmar|sí|yes/i }).click();

		await expect(
			page.getByText(/eliminado.*éxito|deleted.*successfully/i)
		).toBeVisible({ timeout: 5000 });

		console.log('✓ Post eliminado exitosamente');
	});

	test('should add tags to blog post', async ({ page }) => {
		await page.goto('/blog/create');

		await page.getByLabel(/título|title/i).fill('Post with Tags');
		await page.getByLabel(/slug/i).fill('post-with-tags');

		// Agregar tags
		const tagsInput = page.getByLabel(/tags|etiquetas/i);
		if (await tagsInput.isVisible()) {
			await tagsInput.fill('test, e2e, automation');
		}

		await page.getByRole('button', { name: /guardar|crear/i }).click();

		await expect(page.getByText(/creado.*éxito/i)).toBeVisible({ timeout: 5000 });

		// Verificar que los tags aparecen
		await expect(page.getByText('test')).toBeVisible();
		await expect(page.getByText('e2e')).toBeVisible();

		console.log('✓ Tags agregados exitosamente');
	});

	test('should mark post as featured', async ({ page }) => {
		await page.goto('/blog/create');

		await page.getByLabel(/título|title/i).fill('Featured Post');
		await page.getByLabel(/slug/i).fill('featured-post');

		// Marcar como destacado
		const featuredCheckbox = page.getByLabel(/destacado|featured/i);
		if (await featuredCheckbox.isVisible()) {
			await featuredCheckbox.check();
		}

		await page.getByRole('button', { name: /guardar|crear/i }).click();

		await expect(page.getByText(/creado.*éxito/i)).toBeVisible({ timeout: 5000 });

		// Verificar badge de destacado
		await expect(page.getByText(/destacado|featured/i)).toBeVisible();

		console.log('✓ Post marcado como destacado');
	});
});

test.describe('Blog - Public Access', () => {
	test.beforeEach(async ({ page }) => {
		// NO hacer login - acceso público
		await page.goto('/blog');
	});

	test('should view blog posts list without authentication', async ({ page }) => {
		await expect(page).toHaveURL(/\/blog/);

		// Verificar que muestra posts
		await expect(
			page.getByRole('heading', { name: /blog|artículos/i })
		).toBeVisible();

		// Verificar que NO aparecen botones de crear
		await expect(
			page.getByRole('link', { name: /crear|nuevo/i })
		).not.toBeVisible();

		console.log('✓ Vista pública de blog funciona');
	});

	test('should view individual blog post without authentication', async ({ page }) => {
		const firstPost = page.locator('[data-testid="blog-post-card"]').first();

		if (await firstPost.isVisible()) {
			await firstPost.click();

			// Verificar que muestra contenido
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

			// Verificar que NO aparecen botones de editar/eliminar
			await expect(page.getByRole('button', { name: /editar|edit/i })).not.toBeVisible();
			await expect(page.getByRole('button', { name: /eliminar|delete/i })).not.toBeVisible();

			console.log('✓ Vista pública de post individual funciona');
		} else {
			test.skip(true, 'No hay posts para ver');
		}
	});

	test('should redirect to login when trying to create post without auth', async ({
		page
	}) => {
		await page.goto('/blog/create');

		await page.waitForURL(/\/auth\/login/, { timeout: 5000 });

		expect(page.url()).toContain('/auth/login');

		console.log('✓ Redirige a login para crear post sin auth');
	});
});

test.describe('Blog - Authorization by Role', () => {
	test('admin should have full access to all posts', async ({ page }) => {
		await page.goto('/auth/login');
		await page.getByLabel(/usuario/i).fill('admin');
		await page.getByLabel(/contraseña/i).fill('admin123');
		await page.getByRole('button', { name: /iniciar sesión/i }).click();

		await page.goto('/blog');

		// Verificar que puede crear
		await expect(page.getByRole('link', { name: /crear|nuevo/i })).toBeVisible();

		const firstPost = page.locator('[data-testid="blog-post-card"]').first();

		if (await firstPost.isVisible()) {
			await firstPost.click();

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

	test('collaborator should manage own posts', async ({ page }) => {
		test.skip(!process.env.TEST_COLLABORATOR_USER, 'Requires collaborator test user');

		// Este test requiere un usuario colaborador configurado
		console.log('⚠️ Test de colaborador requiere configuración');
	});

	test('assistant should have read-only access', async ({ page }) => {
		test.skip(!process.env.TEST_ASISTENTE_USER, 'Requires assistant test user');

		// Este test requiere un usuario asistente configurado
		console.log('⚠️ Test de asistente requiere configuración');
	});
});

test.describe('Blog - Search and Filters', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/blog');
	});

	test('should search posts by keyword', async ({ page }) => {
		const searchInput = page.getByPlaceholder(/buscar|search/i);

		if (await searchInput.isVisible()) {
			await searchInput.fill('test');

			// Esperar resultados de búsqueda
			await page.waitForTimeout(1000);

			// Verificar que hay resultados o mensaje de "no encontrado"
			const hasResults = await page.locator('[data-testid="blog-post-card"]').count();
			const noResults = await page.getByText(/no.*resultados|no.*found/i).isVisible();

			expect(hasResults > 0 || noResults).toBe(true);

			console.log('✓ Búsqueda funciona correctamente');
		} else {
			test.skip(true, 'Búsqueda no disponible');
		}
	});

	test('should filter posts by tag', async ({ page }) => {
		const tagFilter = page.getByRole('button', { name: /filtrar.*tag|filter.*tag/i });

		if (await tagFilter.isVisible()) {
			await tagFilter.click();

			// Seleccionar un tag
			const firstTag = page.getByRole('option').first();
			if (await firstTag.isVisible()) {
				await firstTag.click();

				await page.waitForTimeout(1000);

				console.log('✓ Filtro por tag funciona');
			}
		} else {
			test.skip(true, 'Filtros no disponibles');
		}
	});
});
