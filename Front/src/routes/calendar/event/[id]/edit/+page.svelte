<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { calendarService, type EventDetail, type UpdateEventData } from '$lib/services/calendar/calendarService';
	import { materialApoyoService } from '$lib/services/materialApoyoService';
	import { blogService } from '$lib/services/blog/blogService';
	import { jwtService } from '$lib/services/auth/jwtService';
	import EventForm from '$lib/components/calendar/EventForm.svelte';

	// Props desde la URL
	$: eventId = $page.params.id;

	// Estado de la página
	let loading = true;
	let error = '';
	let saving = false;
	let deleting = false;
	let event: EventDetail | null = null;
	let availableProjects: Array<{ id: string; title: string }> = [];
	let availableBlogPosts: Array<{ id: string; title: string; slug: string }> = [];

	// Estado de autorización
	let isAuthenticated = false;
	let canEditEvent = false;
	let currentUser: any = null;

	onMount(async () => {
		// Verificar autenticación
		isAuthenticated = jwtService.isAuthenticated();
		if (!isAuthenticated) {
			goto(`/auth/login?redirect=/calendar/event/${eventId}/edit`);
			return;
		}

		currentUser = jwtService.getUser();

		// Cargar evento y datos relacionados
		await Promise.all([
			loadEvent(),
			loadRelatedContent()
		]);
	});

	async function loadEvent() {
		try {
			loading = true;
			error = '';

			event = await calendarService.getEvent(eventId);

			if (!event) {
				error = 'Evento no encontrado';
				return;
			}

			// Verificar si el usuario puede editar este evento
			if (currentUser) {
				canEditEvent = currentUser.role === 'Administrador' ||
							  (event.organizerId === currentUser.id);
			}

			if (!canEditEvent) {
				error = 'No tienes permisos para editar este evento';
				return;
			}
		} catch (err) {
			console.error('Error al cargar evento:', err);
			error = 'Error al cargar el evento';
		} finally {
			loading = false;
		}
	}

	async function loadRelatedContent() {
		try {
			// Cargar proyectos (material de apoyo) disponibles
			const projects = await materialApoyoService.getAllMaterialApoyo();
			availableProjects = projects.map(project => ({
				id: project.id,
				title: project.title
			}));

			// Cargar posts de blog disponibles
			const blogPosts = await blogService.getAllPosts();
			availableBlogPosts = blogPosts
				.filter(post => post.status === 'published')
				.map(post => ({
					id: post.id,
					title: post.title,
					slug: post.slug
				}));
		} catch (err) {
			console.error('Error al cargar contenido relacionado:', err);
		}
	}

	async function handleUpdate(updatedData: any) {
		if (!event || saving) return;

		try {
			saving = true;
			error = '';

			const updateData: UpdateEventData = {
				id: event.id,
				title: updatedData.title,
				description: updatedData.description,
				startDateTime: updatedData.startDateTime,
				endDateTime: updatedData.endDateTime,
				isAllDay: updatedData.isAllDay,
				location: updatedData.location,
				eventType: updatedData.eventType,
				isFeatured: updatedData.isFeatured,
				isRecurring: updatedData.isRecurring,
				recurrencePattern: updatedData.recurrencePattern,
				recurrenceInterval: updatedData.recurrenceInterval,
				recurrenceEndDate: updatedData.recurrenceEndDate,
				recurrenceDaysOfWeek: updatedData.recurrenceDaysOfWeek,
				relatedProjectId: updatedData.relatedProjectId || undefined,
				relatedBlogPostId: updatedData.relatedBlogPostId || undefined
			};

			await calendarService.updateEvent(updateData);

			// Navegar de vuelta al detalle del evento
			goto(`/calendar/event/${eventId}`);
		} catch (err) {
			console.error('Error al actualizar evento:', err);

			// Detectar error 401 (sesión expirada)
			if (err instanceof Error && (err.message.includes('401') || err.message.includes('Unauthorized'))) {
				jwtService.clearToken();
				goto(`/auth/login?redirect=/calendar/event/${eventId}/edit&message=session-expired`);
				return;
			}

			error = 'Error al actualizar el evento. Inténtalo de nuevo.';
			saving = false;
		}
	}

	async function handleDelete() {
		if (!event || deleting) return;

		let confirmMessage = `¿Estás seguro de que deseas eliminar el evento "${event.title}"?`;

		// Si es un evento recurrente, advertir que se eliminan todas las ocurrencias
		if (event.isRecurring) {
			const patternText = event.recurrencePattern === 'daily' ? 'diario' :
			                   event.recurrencePattern === 'weekly' ? 'semanal' :
			                   event.recurrencePattern === 'monthly' ? 'mensual' :
			                   event.recurrencePattern === 'yearly' ? 'anual' : 'recurrente';

			confirmMessage = `⚠️ ATENCIÓN: Este es un evento ${patternText} recurrente.\n\n` +
			                `Al eliminar este evento, se eliminarán TODAS las ocurrencias futuras del evento "${event.title}".\n\n` +
			                `Esta acción no se puede deshacer.\n\n` +
			                `¿Estás seguro de que deseas continuar?`;
		} else {
			confirmMessage += ' Esta acción no se puede deshacer.';
		}

		const confirmed = confirm(confirmMessage);

		if (!confirmed) return;

		try {
			deleting = true;
			error = '';

			await calendarService.deleteEvent(eventId);

			// Navegar de vuelta al calendario
			goto('/calendar');
		} catch (err) {
			console.error('Error al eliminar evento:', err);
			error = 'Error al eliminar el evento. Inténtalo de nuevo.';
			deleting = false;
		}
	}

	function handleCancel() {
		goto(`/calendar/event/${eventId}`);
	}
</script>

<svelte:head>
	<title>Editar Evento - {event?.title || 'Cargando...'} - Centro Cultural Víctor Jara</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
		{#if loading}
			<!-- Loading state -->
			<div class="flex items-center justify-center min-h-screen">
				<div class="text-center">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p class="text-gray-600">Cargando evento...</p>
				</div>
			</div>
		{:else if error}
			<!-- Error state -->
			<div class="flex items-center justify-center min-h-screen">
				<div class="text-center max-w-md">
					<svg class="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
					<h1 class="text-2xl font-bold text-gray-900 mb-2">Error</h1>
					<p class="text-gray-600 mb-4">{error}</p>
					<a
						href="/calendar"
						class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
						</svg>
						Volver al Calendario
					</a>
				</div>
			</div>
		{:else if event && canEditEvent}
			<!-- Breadcrumb -->
			<nav class="flex items-center space-x-2 text-sm text-gray-500 mb-8">
				<a href="/calendar" class="hover:text-gray-700">Calendario</a>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
				</svg>
				<a href="/calendar/event/{eventId}" class="hover:text-gray-700">{event.title}</a>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
				</svg>
				<span class="text-gray-900 font-medium">Editar</span>
			</nav>

			<!-- Header -->
			<div class="mb-8">
				<h1 class="text-3xl font-bold text-gray-900 mb-2">Editar Evento</h1>
				<p class="text-gray-600">Modifica la información del evento o elimínalo permanentemente</p>
			</div>

			<!-- Event Form -->
			<div class="bg-white rounded-lg shadow-lg p-6 mb-6">
				<EventForm
					{event}
					{availableProjects}
					{availableBlogPosts}
					on:save={(e) => handleUpdate(e.detail.eventData)}
					on:cancel={handleCancel}
					isEdit={true}
				/>
			</div>

			<!-- Danger Zone - Delete -->
			<div class="bg-white rounded-lg shadow-lg border-2 border-red-200 p-6">
				<div class="flex items-start space-x-4">
					<div class="flex-shrink-0">
						<svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
						</svg>
					</div>
					<div class="flex-1">
						<h3 class="text-lg font-semibold text-gray-900 mb-2">Zona de Peligro</h3>
						<p class="text-gray-600 mb-4">
							Una vez que elimines este evento, no hay vuelta atrás. Por favor, ten cuidado.
						</p>
						<button
							on:click={handleDelete}
							disabled={deleting}
							class="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
						>
							{#if deleting}
								<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Eliminando...
							{:else}
								<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
								</svg>
								Eliminar Evento Permanentemente
							{/if}
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
