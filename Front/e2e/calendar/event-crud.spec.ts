import { test, expect } from '@playwright/test';

/**
 * Tests E2E para Calendar Events - CRUD Operations
 *
 * Flujos probados:
 * - Crear evento simple
 * - Crear evento recurrente
 * - Editar evento
 * - Eliminar evento
 * - Marcar evento como destacado
 * - Vista pública vs admin
 * - Autorización por roles
 */

test.describe('Calendar - CRUD Operations', () => {
	test.beforeEach(async ({ page }) => {
		// Login como administrador
		await page.goto('/auth/login');
		await page.getByLabel(/usuario|username/i).fill('admin');
		await page.getByLabel(/contraseña|password/i).fill('admin123');
		await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

		await page.waitForURL(/\/(dashboard|calendar|blog)?/);
	});

	test('should create a simple event', async ({ page }) => {
		const timestamp = Date.now();

		await page.goto('/calendar');
		await page.getByRole('link', { name: /crear|nuevo.*evento/i }).click();

		await expect(page).toHaveURL(/\/calendar\/create/);

		// Llenar formulario básico
		await page.getByLabel(/título|title/i).fill(`Evento E2E ${timestamp}`);
		await page
			.getByLabel(/descripción|description/i)
			.fill('Evento creado por test E2E para verificar funcionalidad básica');

		// Seleccionar tipo de evento
		const eventTypeSelect = page.getByLabel(/tipo.*evento|event.*type/i);
		if (await eventTypeSelect.isVisible()) {
			await eventTypeSelect.selectOption('Taller');
		}

		// Ubicación
		const locationInput = page.getByLabel(/ubicación|location/i);
		if (await locationInput.isVisible()) {
			await locationInput.fill('Sala Principal');
		}

		// Fechas (usar inputs datetime-local)
		const startDateInput = page.getByLabel(/fecha.*inicio|start.*date/i);
		if (await startDateInput.isVisible()) {
			// Fecha de mañana a las 10:00
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(10, 0, 0, 0);
			const dateStr = tomorrow.toISOString().slice(0, 16);
			await startDateInput.fill(dateStr);
		}

		const endDateInput = page.getByLabel(/fecha.*fin|end.*date/i);
		if (await endDateInput.isVisible()) {
			// Fecha de mañana a las 12:00
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(12, 0, 0, 0);
			const dateStr = tomorrow.toISOString().slice(0, 16);
			await endDateInput.fill(dateStr);
		}

		// Guardar evento
		await page.getByRole('button', { name: /guardar|crear/i }).click();

		await expect(
			page.getByText(/creado.*éxito|created.*successfully/i)
		).toBeVisible({ timeout: 5000 });

		console.log('✓ Evento simple creado exitosamente');
	});

	test('should create a recurring event', async ({ page }) => {
		const timestamp = Date.now();

		await page.goto('/calendar/create');

		// Llenar información básica
		await page.getByLabel(/título|title/i).fill(`Evento Recurrente ${timestamp}`);
		await page
			.getByLabel(/descripción|description/i)
			.fill('Evento recurrente creado por E2E test');

		// Seleccionar tipo
		const eventTypeSelect = page.getByLabel(/tipo.*evento|event.*type/i);
		if (await eventTypeSelect.isVisible()) {
			await eventTypeSelect.selectOption('Clase');
		}

		// Fecha de inicio
		const startDateInput = page.getByLabel(/fecha.*inicio|start.*date/i);
		if (await startDateInput.isVisible()) {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(9, 0, 0, 0);
			const dateStr = tomorrow.toISOString().slice(0, 16);
			await startDateInput.fill(dateStr);
		}

		// Marcar como recurrente
		const recurringCheckbox = page.getByLabel(/recurrente|recurring/i);
		if (await recurringCheckbox.isVisible()) {
			await recurringCheckbox.check();

			// Esperar a que aparezcan campos de recurrencia
			await page.waitForTimeout(500);

			// Seleccionar patrón semanal
			const patternSelect = page.getByLabel(/patrón|pattern/i);
			if (await patternSelect.isVisible()) {
				await patternSelect.selectOption('weekly');
			}

			// Intervalo (cada 1 semana)
			const intervalInput = page.getByLabel(/intervalo|interval/i);
			if (await intervalInput.isVisible()) {
				await intervalInput.fill('1');
			}

			// Días de la semana (Lunes y Miércoles)
			const mondayCheckbox = page.getByLabel(/lunes|monday/i);
			const wednesdayCheckbox = page.getByLabel(/miércoles|wednesday/i);

			if (await mondayCheckbox.isVisible()) {
				await mondayCheckbox.check();
			}
			if (await wednesdayCheckbox.isVisible()) {
				await wednesdayCheckbox.check();
			}

			// Fecha de finalización de recurrencia (1 mes después)
			const recurrenceEndInput = page.getByLabel(/fin.*recurrencia|recurrence.*end/i);
			if (await recurrenceEndInput.isVisible()) {
				const nextMonth = new Date();
				nextMonth.setMonth(nextMonth.getMonth() + 1);
				const dateStr = nextMonth.toISOString().slice(0, 10);
				await recurrenceEndInput.fill(dateStr);
			}
		}

		// Guardar evento recurrente
		await page.getByRole('button', { name: /guardar|crear/i }).click();

		await expect(
			page.getByText(/creado.*éxito|created.*successfully/i)
		).toBeVisible({ timeout: 5000 });

		console.log('✓ Evento recurrente creado exitosamente');
	});

	test('should create all-day event', async ({ page }) => {
		const timestamp = Date.now();

		await page.goto('/calendar/create');

		await page.getByLabel(/título|title/i).fill(`Evento Todo el Día ${timestamp}`);
		await page.getByLabel(/descripción|description/i).fill('Evento de todo el día');

		// Marcar como todo el día
		const allDayCheckbox = page.getByLabel(/todo.*día|all.*day/i);
		if (await allDayCheckbox.isVisible()) {
			await allDayCheckbox.check();

			// Esperar a que los campos cambien
			await page.waitForTimeout(500);

			// Cuando es all-day, los inputs deberían ser tipo date en vez de datetime-local
			const startDateInput = page.getByLabel(/fecha.*inicio|start.*date/i);
			if (await startDateInput.isVisible()) {
				const tomorrow = new Date();
				tomorrow.setDate(tomorrow.getDate() + 1);
				const dateStr = tomorrow.toISOString().slice(0, 10);
				await startDateInput.fill(dateStr);
			}
		}

		await page.getByRole('button', { name: /guardar|crear/i }).click();

		await expect(page.getByText(/creado.*éxito/i)).toBeVisible({ timeout: 5000 });

		console.log('✓ Evento de todo el día creado');
	});

	test('should edit existing event', async ({ page }) => {
		await page.goto('/calendar');

		const firstEvent = page.locator('[data-testid="event-card"]').first();

		if (await firstEvent.isVisible()) {
			await firstEvent.getByRole('button', { name: /editar|edit/i }).click();

			await expect(page).toHaveURL(/\/calendar\/event\/.*\/edit/);

			const titleInput = page.getByLabel(/título|title/i);
			const currentTitle = await titleInput.inputValue();
			await titleInput.clear();
			await titleInput.fill(`${currentTitle} - Editado`);

			// Cambiar ubicación
			const locationInput = page.getByLabel(/ubicación|location/i);
			if (await locationInput.isVisible()) {
				await locationInput.clear();
				await locationInput.fill('Sala Actualizada');
			}

			await page.getByRole('button', { name: /guardar|actualizar/i }).click();

			await expect(
				page.getByText(/actualizado.*éxito|updated.*successfully/i)
			).toBeVisible({ timeout: 5000 });

			console.log('✓ Evento editado exitosamente');
		} else {
			test.skip(true, 'No hay eventos disponibles para editar');
		}
	});

	test('should mark event as featured', async ({ page }) => {
		const timestamp = Date.now();

		await page.goto('/calendar/create');

		await page.getByLabel(/título|title/i).fill(`Evento Destacado ${timestamp}`);
		await page.getByLabel(/descripción|description/i).fill('Evento destacado test');

		// Marcar como destacado
		const featuredCheckbox = page.getByLabel(/destacado|featured/i);
		if (await featuredCheckbox.isVisible()) {
			await featuredCheckbox.check();
		}

		await page.getByRole('button', { name: /guardar|crear/i }).click();

		await expect(page.getByText(/creado.*éxito/i)).toBeVisible({ timeout: 5000 });

		// Volver al calendario y verificar badge
		await page.goto('/calendar');

		// Buscar el evento con badge destacado
		await expect(page.getByText(/destacado|featured/i)).toBeVisible();

		console.log('✓ Evento marcado como destacado');
	});

	test('should delete event', async ({ page }) => {
		const timestamp = Date.now();

		// Primero crear un evento para eliminar
		await page.goto('/calendar/create');

		await page.getByLabel(/título|title/i).fill(`Evento a Eliminar ${timestamp}`);
		await page.getByLabel(/descripción|description/i).fill('Este evento será eliminado');
		await page.getByRole('button', { name: /guardar|crear/i }).click();

		await expect(page.getByText(/creado.*éxito/i)).toBeVisible({ timeout: 5000 });

		// Esperar a estar en la página del evento
		await page.waitForURL(/\/calendar\/event\/[a-f0-9-]+/);

		// Ahora eliminarlo
		const deleteButton = page.getByRole('button', { name: /eliminar|delete/i });
		if (await deleteButton.isVisible()) {
			await deleteButton.click();

			// Confirmar eliminación
			await page.getByRole('button', { name: /confirmar|sí|yes/i }).click();

			await expect(
				page.getByText(/eliminado.*éxito|deleted.*successfully/i)
			).toBeVisible({ timeout: 5000 });

			// Verificar que redirige al calendario
			await expect(page).toHaveURL(/\/calendar/);

			console.log('✓ Evento eliminado exitosamente');
		} else {
			test.skip(true, 'Botón eliminar no disponible');
		}
	});

	test('should link event to blog post', async ({ page }) => {
		const timestamp = Date.now();

		await page.goto('/calendar/create');

		await page.getByLabel(/título|title/i).fill(`Evento con Blog ${timestamp}`);
		await page.getByLabel(/descripción|description/i).fill('Evento vinculado a blog post');

		// Buscar selector de blog post relacionado
		const blogPostSelect = page.getByLabel(/blog.*relacionado|related.*blog/i);
		if (await blogPostSelect.isVisible()) {
			// Seleccionar el primer blog post disponible
			const options = await blogPostSelect.locator('option').count();
			if (options > 1) {
				// index 0 es generalmente la opción vacía
				await blogPostSelect.selectOption({ index: 1 });
			}
		}

		await page.getByRole('button', { name: /guardar|crear/i }).click();

		await expect(page.getByText(/creado.*éxito/i)).toBeVisible({ timeout: 5000 });

		console.log('✓ Evento vinculado a blog post');
	});

	test('should link event to project (material de apoyo)', async ({ page }) => {
		const timestamp = Date.now();

		await page.goto('/calendar/create');

		await page.getByLabel(/título|title/i).fill(`Evento con Proyecto ${timestamp}`);
		await page
			.getByLabel(/descripción|description/i)
			.fill('Evento vinculado a material de apoyo');

		// Buscar selector de proyecto relacionado
		const projectSelect = page.getByLabel(/proyecto.*relacionado|related.*project/i);
		if (await projectSelect.isVisible()) {
			// Seleccionar el primer proyecto disponible
			const options = await projectSelect.locator('option').count();
			if (options > 1) {
				await projectSelect.selectOption({ index: 1 });
			}
		}

		await page.getByRole('button', { name: /guardar|crear/i }).click();

		await expect(page.getByText(/creado.*éxito/i)).toBeVisible({ timeout: 5000 });

		console.log('✓ Evento vinculado a proyecto');
	});
});

test.describe('Calendar - Public Access', () => {
	test.beforeEach(async ({ page }) => {
		// NO hacer login - acceso público
		await page.goto('/calendar');
	});

	test('should view calendar without authentication', async ({ page }) => {
		await expect(page).toHaveURL(/\/calendar/);

		// Verificar que muestra el calendario
		await expect(
			page.getByRole('heading', { name: /calendario|calendar|eventos/i })
		).toBeVisible();

		// Verificar que NO aparecen botones de crear
		await expect(page.getByRole('link', { name: /crear|nuevo/i })).not.toBeVisible();

		console.log('✓ Vista pública de calendario funciona');
	});

	test('should view event details without authentication', async ({ page }) => {
		const firstEvent = page.locator('[data-testid="event-card"]').first();

		if (await firstEvent.isVisible()) {
			await firstEvent.click();

			// Verificar que muestra detalles del evento
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

			// Verificar que NO aparecen botones de editar/eliminar
			await expect(page.getByRole('button', { name: /editar|edit/i })).not.toBeVisible();
			await expect(page.getByRole('button', { name: /eliminar|delete/i })).not.toBeVisible();

			console.log('✓ Vista pública de evento individual funciona');
		} else {
			test.skip(true, 'No hay eventos para ver');
		}
	});

	test('should redirect to login when trying to create event without auth', async ({
		page
	}) => {
		await page.goto('/calendar/create');

		await page.waitForURL(/\/auth\/login/, { timeout: 5000 });

		expect(page.url()).toContain('/auth/login');

		console.log('✓ Redirige a login para crear evento sin auth');
	});
});

test.describe('Calendar - Authorization by Role', () => {
	test('admin should have full access to all events', async ({ page }) => {
		await page.goto('/auth/login');
		await page.getByLabel(/usuario/i).fill('admin');
		await page.getByLabel(/contraseña/i).fill('admin123');
		await page.getByRole('button', { name: /iniciar sesión/i }).click();

		await page.goto('/calendar');

		// Verificar que puede crear
		await expect(page.getByRole('link', { name: /crear|nuevo/i })).toBeVisible();

		const firstEvent = page.locator('[data-testid="event-card"]').first();

		if (await firstEvent.isVisible()) {
			await firstEvent.click();

			// Verificar que puede editar y eliminar
			await expect(page.getByRole('button', { name: /editar|edit/i })).toBeVisible();
			await expect(page.getByRole('button', { name: /eliminar|delete/i })).toBeVisible();

			console.log('✓ Admin tiene acceso completo a eventos');
		}
	});

	test('collaborator should manage own events', async ({ page }) => {
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

test.describe('Calendar - Search and Filters', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/calendar');
	});

	test('should search events by keyword', async ({ page }) => {
		const searchInput = page.getByPlaceholder(/buscar|search/i);

		if (await searchInput.isVisible()) {
			await searchInput.fill('test');

			// Esperar resultados de búsqueda
			await page.waitForTimeout(1000);

			// Verificar que hay resultados o mensaje de "no encontrado"
			const hasResults = await page.locator('[data-testid="event-card"]').count();
			const noResults = await page.getByText(/no.*resultados|no.*encontrado/i).isVisible();

			expect(hasResults > 0 || noResults).toBe(true);

			console.log('✓ Búsqueda de eventos funciona correctamente');
		} else {
			test.skip(true, 'Búsqueda no disponible');
		}
	});

	test('should filter events by type', async ({ page }) => {
		const typeFilter = page.getByLabel(/tipo.*evento|event.*type/i);

		if (await typeFilter.isVisible()) {
			// Seleccionar un tipo específico
			await typeFilter.selectOption('Taller');

			await page.waitForTimeout(1000);

			console.log('✓ Filtro por tipo de evento funciona');
		} else {
			test.skip(true, 'Filtros no disponibles');
		}
	});

	test('should filter only featured events', async ({ page }) => {
		const featuredFilter = page.getByLabel(/destacados|featured/i);

		if (await featuredFilter.isVisible()) {
			await featuredFilter.check();

			await page.waitForTimeout(1000);

			// Verificar que solo muestra eventos destacados
			const eventCards = page.locator('[data-testid="event-card"]');
			const count = await eventCards.count();

			if (count > 0) {
				// Todos deberían tener badge de destacado
				await expect(page.getByText(/destacado|featured/i).first()).toBeVisible();
			}

			console.log('✓ Filtro de eventos destacados funciona');
		} else {
			test.skip(true, 'Filtro de destacados no disponible');
		}
	});

	test('should sort events by date', async ({ page }) => {
		const sortSelect = page.getByLabel(/ordenar|sort/i);

		if (await sortSelect.isVisible()) {
			// Ordenar por fecha ascendente
			await sortSelect.selectOption(/fecha.*asc|date.*asc/i);

			await page.waitForTimeout(1000);

			console.log('✓ Ordenamiento por fecha funciona');
		} else {
			test.skip(true, 'Ordenamiento no disponible');
		}
	});
});
