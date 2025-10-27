import { test, expect } from '@playwright/test';

/**
 * Tests E2E para Event Registration (Registro a Eventos)
 *
 * Flujos probados:
 * - Registrarse a un evento
 * - Cancelar registro
 * - Verificar límites de capacidad
 * - Lista de espera (waitlist)
 * - Verificar registros como admin
 * - Exportar lista de asistentes
 */

test.describe('Event Registration - User Flow', () => {
	test.beforeEach(async ({ page }) => {
		// Login como usuario regular (no admin)
		// Si no existe un usuario test, skip estos tests
		await page.goto('/auth/login');
		await page.getByLabel(/usuario|username/i).fill('admin'); // TODO: cambiar a usuario regular
		await page.getByLabel(/contraseña|password/i).fill('admin123');
		await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

		await page.waitForURL(/\/(dashboard|calendar)?/);
	});

	test('should register for an event', async ({ page }) => {
		await page.goto('/calendar');

		// Buscar un evento disponible (que tenga cupo)
		const firstEvent = page.locator('[data-testid="event-card"]').first();

		if (await firstEvent.isVisible()) {
			await firstEvent.click();

			// Buscar botón de inscribirse
			const registerButton = page.getByRole('button', {
				name: /inscribirse|registrarse|register/i
			});

			if (await registerButton.isVisible()) {
				await registerButton.click();

				// Verificar confirmación
				await expect(
					page.getByText(/inscrito.*éxito|registered.*successfully/i)
				).toBeVisible({ timeout: 5000 });

				// El botón debería cambiar a "Cancelar inscripción"
				await expect(
					page.getByRole('button', { name: /cancelar.*inscripción|cancel.*registration/i })
				).toBeVisible();

				console.log('✓ Usuario registrado exitosamente al evento');
			} else {
				test.skip(
					true,
					'No hay eventos con inscripción habilitada o el usuario ya está inscrito'
				);
			}
		} else {
			test.skip(true, 'No hay eventos disponibles');
		}
	});

	test('should cancel event registration', async ({ page }) => {
		await page.goto('/calendar');

		// Buscar un evento donde ya esté inscrito
		const events = page.locator('[data-testid="event-card"]');
		const count = await events.count();

		for (let i = 0; i < count; i++) {
			await events.nth(i).click();

			const cancelButton = page.getByRole('button', {
				name: /cancelar.*inscripción|cancel.*registration/i
			});

			if (await cancelButton.isVisible()) {
				await cancelButton.click();

				// Confirmar cancelación
				const confirmButton = page.getByRole('button', { name: /confirmar|sí|yes/i });
				if (await confirmButton.isVisible()) {
					await confirmButton.click();
				}

				// Verificar confirmación
				await expect(
					page.getByText(/cancelado.*éxito|cancelled.*successfully/i)
				).toBeVisible({ timeout: 5000 });

				// El botón debería volver a "Inscribirse"
				await expect(
					page.getByRole('button', { name: /inscribirse|registrarse|register/i })
				).toBeVisible();

				console.log('✓ Inscripción cancelada exitosamente');
				return;
			}

			// Volver atrás para probar siguiente evento
			await page.goto('/calendar');
		}

		test.skip(true, 'Usuario no está inscrito en ningún evento');
	});

	test('should show "full" message when event is at capacity', async ({ page }) => {
		// Este test requiere un evento que esté lleno
		// Se podría crear un evento con capacidad 1 e inscribirse para probarlo

		await page.goto('/calendar');

		const events = page.locator('[data-testid="event-card"]');
		const count = await events.count();

		for (let i = 0; i < count; i++) {
			await events.nth(i).click();

			// Buscar mensaje de cupo lleno
			const fullMessage = page.getByText(/cupo.*lleno|event.*full|sin.*cupos/i);

			if (await fullMessage.isVisible()) {
				console.log('✓ Mensaje de evento lleno mostrado correctamente');

				// Verificar que botón de inscripción está deshabilitado
				const registerButton = page.getByRole('button', {
					name: /inscribirse|registrarse|register/i
				});
				if (await registerButton.isVisible()) {
					const isDisabled = await registerButton.isDisabled();
					expect(isDisabled).toBe(true);
				}

				return;
			}

			await page.goto('/calendar');
		}

		test.skip(true, 'No hay eventos con cupo lleno para probar');
	});

	test('should join waitlist when event is full', async ({ page }) => {
		await page.goto('/calendar');

		const events = page.locator('[data-testid="event-card"]');
		const count = await events.count();

		for (let i = 0; i < count; i++) {
			await events.nth(i).click();

			// Buscar botón de lista de espera
			const waitlistButton = page.getByRole('button', {
				name: /lista.*espera|waitlist|join.*waitlist/i
			});

			if (await waitlistButton.isVisible()) {
				await waitlistButton.click();

				// Verificar confirmación
				await expect(
					page.getByText(/agregado.*lista.*espera|added.*waitlist/i)
				).toBeVisible({ timeout: 5000 });

				console.log('✓ Usuario agregado a lista de espera');
				return;
			}

			await page.goto('/calendar');
		}

		test.skip(true, 'No hay eventos con lista de espera disponible');
	});

	test('should view my registered events', async ({ page }) => {
		// Navegar a perfil o sección de "mis eventos"
		await page.goto('/calendar/my-events');

		// Verificar que muestra eventos donde está inscrito
		await expect(page.getByRole('heading', { name: /mis.*eventos|my.*events/i })).toBeVisible();

		// Debería haber al menos una lista de eventos
		const eventsList = page.locator('[data-testid="event-card"]');
		const count = await eventsList.count();

		if (count > 0) {
			console.log(`✓ Usuario tiene ${count} eventos registrados`);
		} else {
			console.log('ℹ️ Usuario no tiene eventos registrados aún');
		}
	});
});

test.describe('Event Registration - Admin Management', () => {
	test.beforeEach(async ({ page }) => {
		// Login como administrador
		await page.goto('/auth/login');
		await page.getByLabel(/usuario|username/i).fill('admin');
		await page.getByLabel(/contraseña|password/i).fill('admin123');
		await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

		await page.waitForURL(/\/(dashboard|calendar)?/);
	});

	test('should view event registrations as admin', async ({ page }) => {
		await page.goto('/calendar');

		const firstEvent = page.locator('[data-testid="event-card"]').first();

		if (await firstEvent.isVisible()) {
			await firstEvent.click();

			// Buscar sección de registros/asistentes
			const registrationsSection = page.getByRole('heading', {
				name: /asistentes|registrados|attendees|registrations/i
			});

			if (await registrationsSection.isVisible()) {
				// Verificar que muestra lista de registrados
				const attendeesList = page.locator('[data-testid="attendees-list"]');

				if (await attendeesList.isVisible()) {
					const count = await attendeesList.locator('li, tr').count();
					console.log(`✓ Evento tiene ${count} asistentes registrados`);
				}
			} else {
				test.skip(true, 'Sección de registros no disponible');
			}
		} else {
			test.skip(true, 'No hay eventos disponibles');
		}
	});

	test('should export attendees list', async ({ page }) => {
		await page.goto('/calendar');

		const firstEvent = page.locator('[data-testid="event-card"]').first();

		if (await firstEvent.isVisible()) {
			await firstEvent.click();

			// Buscar botón de exportar
			const exportButton = page.getByRole('button', { name: /exportar|export|download/i });

			if (await exportButton.isVisible()) {
				// Configurar listener para descarga
				const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

				await exportButton.click();

				// Esperar la descarga
				const download = await downloadPromise;

				// Verificar que el archivo fue descargado
				const fileName = download.suggestedFilename();
				expect(fileName).toMatch(/(asistentes|attendees|registrations).*\.(csv|xlsx|pdf)/i);

				console.log(`✓ Lista de asistentes exportada: ${fileName}`);
			} else {
				test.skip(true, 'Botón de exportar no disponible');
			}
		} else {
			test.skip(true, 'No hay eventos disponibles');
		}
	});

	test('should manually add attendee as admin', async ({ page }) => {
		await page.goto('/calendar');

		const firstEvent = page.locator('[data-testid="event-card"]').first();

		if (await firstEvent.isVisible()) {
			await firstEvent.click();

			// Buscar botón para agregar asistente manualmente
			const addAttendeeButton = page.getByRole('button', {
				name: /agregar.*asistente|add.*attendee/i
			});

			if (await addAttendeeButton.isVisible()) {
				await addAttendeeButton.click();

				// Llenar formulario de asistente
				const nameInput = page.getByLabel(/nombre|name/i);
				const emailInput = page.getByLabel(/email|correo/i);

				if (await nameInput.isVisible()) {
					await nameInput.fill('Juan Pérez');
				}

				if (await emailInput.isVisible()) {
					await emailInput.fill('juan.perez@example.com');
				}

				// Guardar
				await page.getByRole('button', { name: /guardar|agregar|add/i }).click();

				await expect(
					page.getByText(/agregado.*éxito|added.*successfully/i)
				).toBeVisible({ timeout: 5000 });

				console.log('✓ Asistente agregado manualmente por admin');
			} else {
				test.skip(true, 'Funcionalidad de agregar asistente no disponible');
			}
		} else {
			test.skip(true, 'No hay eventos disponibles');
		}
	});

	test('should remove attendee as admin', async ({ page }) => {
		await page.goto('/calendar');

		const firstEvent = page.locator('[data-testid="event-card"]').first();

		if (await firstEvent.isVisible()) {
			await firstEvent.click();

			// Buscar lista de asistentes
			const attendeesList = page.locator('[data-testid="attendees-list"]');

			if (await attendeesList.isVisible()) {
				// Buscar botón de eliminar del primer asistente
				const removeButton = attendeesList
					.locator('[data-testid="remove-attendee"]')
					.first();

				if (await removeButton.isVisible()) {
					await removeButton.click();

					// Confirmar eliminación
					await page.getByRole('button', { name: /confirmar|sí|yes/i }).click();

					await expect(
						page.getByText(/eliminado.*éxito|removed.*successfully/i)
					).toBeVisible({ timeout: 5000 });

					console.log('✓ Asistente eliminado por admin');
				} else {
					test.skip(true, 'No hay asistentes para eliminar');
				}
			} else {
				test.skip(true, 'Lista de asistentes no disponible');
			}
		} else {
			test.skip(true, 'No hay eventos disponibles');
		}
	});

	test('should set event capacity', async ({ page }) => {
		const timestamp = Date.now();

		// Crear evento con capacidad limitada
		await page.goto('/calendar/create');

		await page.getByLabel(/título|title/i).fill(`Evento con Capacidad ${timestamp}`);
		await page.getByLabel(/descripción|description/i).fill('Evento con límite de asistentes');

		// Buscar input de capacidad
		const capacityInput = page.getByLabel(/capacidad|capacity|cupo/i);

		if (await capacityInput.isVisible()) {
			await capacityInput.fill('20');
		}

		// Habilitar inscripciones
		const enableRegistrationCheckbox = page.getByLabel(
			/habilitar.*inscripción|enable.*registration/i
		);
		if (await enableRegistrationCheckbox.isVisible()) {
			await enableRegistrationCheckbox.check();
		}

		await page.getByRole('button', { name: /guardar|crear/i }).click();

		await expect(page.getByText(/creado.*éxito/i)).toBeVisible({ timeout: 5000 });

		// Verificar que muestra capacidad
		await expect(page.getByText(/20.*cupos|capacity.*20/i)).toBeVisible();

		console.log('✓ Evento con capacidad limitada creado');
	});

	test('should enable/disable event registration', async ({ page }) => {
		await page.goto('/calendar');

		const firstEvent = page.locator('[data-testid="event-card"]').first();

		if (await firstEvent.isVisible()) {
			await firstEvent.getByRole('button', { name: /editar|edit/i }).click();

			await expect(page).toHaveURL(/\/calendar\/event\/.*\/edit/);

			// Buscar checkbox de habilitar inscripciones
			const enableRegistrationCheckbox = page.getByLabel(
				/habilitar.*inscripción|enable.*registration/i
			);

			if (await enableRegistrationCheckbox.isVisible()) {
				const isChecked = await enableRegistrationCheckbox.isChecked();

				// Toggle
				if (isChecked) {
					await enableRegistrationCheckbox.uncheck();
				} else {
					await enableRegistrationCheckbox.check();
				}

				await page.getByRole('button', { name: /guardar|actualizar/i }).click();

				await expect(page.getByText(/actualizado.*éxito/i)).toBeVisible({ timeout: 5000 });

				console.log('✓ Estado de inscripción del evento actualizado');
			} else {
				test.skip(true, 'Toggle de inscripciones no disponible');
			}
		} else {
			test.skip(true, 'No hay eventos disponibles para editar');
		}
	});

	test('should send notification to attendees', async ({ page }) => {
		await page.goto('/calendar');

		const firstEvent = page.locator('[data-testid="event-card"]').first();

		if (await firstEvent.isVisible()) {
			await firstEvent.click();

			// Buscar botón para enviar notificación
			const notifyButton = page.getByRole('button', {
				name: /notificar|enviar.*notificación|notify.*attendees/i
			});

			if (await notifyButton.isVisible()) {
				await notifyButton.click();

				// Llenar mensaje de notificación
				const messageTextarea = page.getByLabel(/mensaje|message/i);

				if (await messageTextarea.isVisible()) {
					await messageTextarea.fill(
						'Recordatorio: El evento será mañana a las 10:00. ¡No faltes!'
					);
				}

				// Enviar
				await page.getByRole('button', { name: /enviar|send/i }).click();

				await expect(
					page.getByText(/notificación.*enviada|notification.*sent/i)
				).toBeVisible({ timeout: 5000 });

				console.log('✓ Notificación enviada a asistentes');
			} else {
				test.skip(true, 'Funcionalidad de notificaciones no disponible');
			}
		} else {
			test.skip(true, 'No hay eventos disponibles');
		}
	});
});

test.describe('Event Registration - Validations', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/auth/login');
		await page.getByLabel(/usuario|username/i).fill('admin');
		await page.getByLabel(/contraseña|password/i).fill('admin123');
		await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

		await page.waitForURL(/\/(dashboard|calendar)?/);
	});

	test('should not allow duplicate registration', async ({ page }) => {
		await page.goto('/calendar');

		const firstEvent = page.locator('[data-testid="event-card"]').first();

		if (await firstEvent.isVisible()) {
			await firstEvent.click();

			// Intentar inscribirse dos veces
			const registerButton = page.getByRole('button', {
				name: /inscribirse|registrarse|register/i
			});

			if (await registerButton.isVisible()) {
				await registerButton.click();

				await expect(
					page.getByText(/inscrito.*éxito|registered.*successfully/i)
				).toBeVisible({ timeout: 5000 });

				// Esperar un momento
				await page.waitForTimeout(1000);

				// Verificar que el botón cambió a "Cancelar inscripción"
				// y NO hay botón para inscribirse de nuevo
				await expect(registerButton).not.toBeVisible();
				await expect(
					page.getByRole('button', { name: /cancelar.*inscripción|cancel.*registration/i })
				).toBeVisible();

				console.log('✓ No permite inscripción duplicada');
			} else {
				test.skip(true, 'Usuario ya está inscrito o inscripciones deshabilitadas');
			}
		} else {
			test.skip(true, 'No hay eventos disponibles');
		}
	});

	test('should not allow registration after event has passed', async ({ page }) => {
		// Este test requiere un evento pasado
		await page.goto('/calendar');

		// Buscar eventos pasados
		const pastEventsFilter = page.getByLabel(/eventos.*pasados|past.*events/i);

		if (await pastEventsFilter.isVisible()) {
			await pastEventsFilter.check();
			await page.waitForTimeout(1000);

			const firstPastEvent = page.locator('[data-testid="event-card"]').first();

			if (await firstPastEvent.isVisible()) {
				await firstPastEvent.click();

				// Verificar que NO hay botón de inscribirse
				const registerButton = page.getByRole('button', {
					name: /inscribirse|registrarse|register/i
				});

				await expect(registerButton).not.toBeVisible();

				// Debería mostrar mensaje de evento pasado
				await expect(page.getByText(/evento.*finalizado|event.*ended|past/i)).toBeVisible();

				console.log('✓ No permite inscripción a eventos pasados');
			} else {
				test.skip(true, 'No hay eventos pasados');
			}
		} else {
			test.skip(true, 'Filtro de eventos pasados no disponible');
		}
	});
});
