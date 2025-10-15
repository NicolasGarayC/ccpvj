<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { calendarService, type EventDetail, type EventSummary } from '$lib/services/calendar/calendarService';
	import { jwtService } from '$lib/services/auth/jwtService.js';

	// Props desde la URL
	let eventId: string = '';
	$: eventId = ($page.params.id ?? '') as string;

	// Estado de la página
	let loading = true;
	let error = '';
	let event: EventDetail | null = null;
	let relatedEvents: EventSummary[] = [];

	// ✅ Estado de autorización
	let isAuthenticated = false;
	let canEditEvent = false;
	let currentUser: any = null;
	let shareFeedback: { message: string; kind: 'success' | 'error' } | null = null;
	let shareFeedbackTimeout: ReturnType<typeof setTimeout> | null = null;

	// Cargar evento y datos relacionados
	onMount(async () => {
		// ✅ Verificar autenticación y permisos
		isAuthenticated = jwtService.isAuthenticated();
		if (isAuthenticated) {
			currentUser = jwtService.getUser();
		}

		if (eventId) {
			await Promise.all([
				loadEvent(),
				loadRelatedEvents()
			]);
		}
	});

	async function loadEvent() {
		try {
			loading = true;
			error = '';
			
			if (!eventId) {
				throw new Error('ID de evento inválido');
			}

			event = await calendarService.getEvent(eventId);
			
			if (!event) {
				error = 'Evento no encontrado';
				return;
			}

			// ✅ Verificar si el usuario puede editar este evento
			if (isAuthenticated && currentUser) {
				canEditEvent = currentUser.role === 'Administrador' ||
							  (event.organizerId === currentUser.id);
			}
		} catch (err) {
			console.error('Error al cargar evento:', err);
			error = 'Error al cargar el evento';
		} finally {
			loading = false;
		}
	}

	async function loadRelatedEvents() {
		try {
			if (event?.relatedProjectId) {
				const projectEvents = await calendarService.getEventsByProject(event.relatedProjectId);
				relatedEvents = projectEvents.filter(e => e.id !== eventId).slice(0, 5);
			} else if (event?.relatedBlogPostId) {
				const blogEvents = await calendarService.getEventsByBlogPost(event.relatedBlogPostId);
				relatedEvents = blogEvents.filter(e => e.id !== eventId).slice(0, 5);
			}
		} catch (err) {
			console.error('Error al cargar eventos relacionados:', err);
		}
	}

	function navigateToEdit() {
		if (!isAuthenticated) {
			goto(`/auth/login?redirect=/calendar/event/${eventId}`);
		} else if (!canEditEvent) {
			alert('No tienes permisos para editar este evento.');
		} else {
			goto(`/calendar/event/${eventId}/edit`);
		}
	}

	function navigateToRelatedEvent(relatedEventId: string) {
		goto(`/calendar/event/${relatedEventId}`);
	}

	function navigateToRelatedProject() {
		if (event?.relatedProjectId) {
			goto(`/material-apoyo/${event.relatedProjectId}`);
		}
	}

	function navigateToRelatedBlogPost() {
		if (event?.relatedBlogPostSlug) {
			goto(`/blog/${event.relatedBlogPostSlug}`);
		}
	}

	function formatDateTime(date: Date): string {
		return new Intl.DateTimeFormat('es-ES', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(date));
	}

	function formatDateOnly(date: Date): string {
		return new Intl.DateTimeFormat('es-ES', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(new Date(date));
	}

	function formatTimeOnly(date: Date): string {
		return new Intl.DateTimeFormat('es-ES', {
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(date));
	}

	function getEventTypeColor(eventType: string): string {
		const colors: Record<string, string> = {
			'Clase': 'bg-blue-100 text-blue-800',
			'Taller': 'bg-green-100 text-green-800',
			'Conferencia': 'bg-purple-100 text-purple-800',
			'Evento': 'bg-yellow-100 text-yellow-800',
			'General': 'bg-gray-100 text-gray-800',
			'Otro': 'bg-indigo-100 text-indigo-800'
		};
		return colors[eventType] || 'bg-gray-100 text-gray-800';
	}

	function isUpcoming(date: Date): boolean {
		return new Date(date) > new Date();
	}

	function isPast(date: Date): boolean {
		return new Date(date) < new Date();
	}

	function setShareFeedback(message: string, kind: 'success' | 'error') {
		shareFeedback = { message, kind };
		if (shareFeedbackTimeout) {
			clearTimeout(shareFeedbackTimeout);
		}
		shareFeedbackTimeout = setTimeout(() => {
			shareFeedback = null;
			shareFeedbackTimeout = null;
		}, 3500);
	}

	async function shareEvent() {
		if (!event) return;

		const shareData = {
			title: event.title,
			text: event.description ?? event.title,
			url: window.location.href
		};

		try {
			if (navigator.share) {
				await navigator.share(shareData);
				setShareFeedback('Enlace compartido correctamente.', 'success');
				return;
			}
		} catch (err) {
			if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
				return;
			}
			console.warn('Fallo el uso de navigator.share, intentando copiar portapapeles.', err);
		}

		try {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(shareData.url);
				setShareFeedback('Enlace copiado al portapapeles.', 'success');
			} else {
				setShareFeedback('Tu navegador no permite copiar automáticamente. Copia el enlace manualmente.', 'error');
			}
		} catch (err) {
			console.error('Error al copiar enlace:', err);
			setShareFeedback('No se pudo copiar el enlace. Copia la URL manualmente.', 'error');
		}
	}

	onDestroy(() => {
		if (shareFeedbackTimeout) {
			clearTimeout(shareFeedbackTimeout);
		}
	});
</script>

<svelte:head>
	<title>{event?.title || 'Cargando...'} - Centro Cultural Víctor Jara</title>
	<meta name="description" content={event?.description || 'Evento del Centro Cultural Víctor Jara'} />
</svelte:head>

<div class="min-h-screen bg-gray-50">
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
				<h1 class="text-2xl font-bold text-gray-900 mb-2">Evento no encontrado</h1>
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
	{:else if event}
		<!-- Event content -->
		<div class="py-8">
			<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<!-- Breadcrumb -->
				<nav class="flex items-center space-x-2 text-sm text-gray-500 mb-8">
					<a href="/calendar" class="hover:text-gray-700">Calendario</a>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
					</svg>
					<span class="text-gray-900 font-medium truncate">{event.title}</span>
				</nav>

				<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<!-- Contenido principal -->
					<div class="lg:col-span-2 space-y-6">
						<!-- Header del evento -->
						<div class="bg-white rounded-lg shadow-lg overflow-hidden">
							<div class="p-6">
								<!-- Estado y tipo -->
								<div class="flex items-center space-x-3 mb-4">
									<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {getEventTypeColor(event.eventType)}">
										{event.eventType}
									</span>
									
									{#if event.isFeatured}
										<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
											<svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
												<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
											</svg>
											Destacado
										</span>
									{/if}
									
									{#if event.isRecurring}
										<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
											<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
											</svg>
											Recurrente
										</span>
									{/if}

									{#if isPast(event.startDateTime)}
										<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
											Finalizado
										</span>
									{:else if isUpcoming(event.startDateTime)}
										<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
											Próximo
										</span>
									{/if}
								</div>

								<!-- Título -->
								<h1 class="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>

								<!-- Banner informativo para eventos recurrentes -->
								{#if event.isRecurring}
									<div class="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
										<div class="flex">
											<div class="flex-shrink-0">
												<svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
												</svg>
											</div>
											<div class="ml-3">
												<h3 class="text-sm font-medium text-blue-800">
													🔄 Este es un evento recurrente
												</h3>
												<div class="mt-2 text-sm text-blue-700">
													<p>
														Patrón: <strong>
															{#if event.recurrencePattern === 'daily'}Diario{/if}
															{#if event.recurrencePattern === 'weekly'}Semanal{/if}
															{#if event.recurrencePattern === 'monthly'}Mensual{/if}
															{#if event.recurrencePattern === 'yearly'}Anual{/if}
														</strong>
														{#if event.recurrenceInterval && event.recurrenceInterval > 1}
															(cada {event.recurrenceInterval} {event.recurrencePattern === 'daily' ? 'días' : event.recurrencePattern === 'weekly' ? 'semanas' : event.recurrencePattern === 'monthly' ? 'meses' : 'años'})
														{/if}
													</p>
													{#if event.recurrenceEndDate}
														<p class="mt-1">
															Se repite hasta: <strong>{formatDateOnly(event.recurrenceEndDate)}</strong>
														</p>
													{/if}
													<p class="mt-2 text-xs">
														⚠️ <strong>Importante:</strong> Si eliminas este evento, se eliminarán todas las ocurrencias futuras.
													</p>
												</div>
											</div>
										</div>
									</div>
								{/if}

								<!-- Información básica -->
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
									<!-- Fecha y hora -->
									<div class="flex items-start space-x-3">
										<svg class="w-5 h-5 text-gray-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8V9a2 2 0 012-2h4a2 2 0 012 2v8m-6 4v-2"/>
										</svg>
										<div>
											<p class="font-medium text-gray-900">
												{formatDateOnly(event.startDateTime)}
											</p>
											{#if event.isAllDay}
												<p class="text-sm text-gray-600">Todo el día</p>
											{:else}
												<p class="text-sm text-gray-600">
													{formatTimeOnly(event.startDateTime)}
													{#if event.endDateTime}
														- {formatTimeOnly(event.endDateTime)}
													{/if}
												</p>
											{/if}
										</div>
									</div>

									<!-- Ubicación -->
									{#if event.location}
										<div class="flex items-start space-x-3">
											<svg class="w-5 h-5 text-gray-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
											</svg>
											<div>
												<p class="font-medium text-gray-900">Ubicación</p>
												<p class="text-sm text-gray-600">{event.location}</p>
											</div>
										</div>
									{/if}

									<!-- Organizador -->
									<div class="flex items-start space-x-3">
										<svg class="w-5 h-5 text-gray-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
										</svg>
										<div>
											<p class="font-medium text-gray-900">Organizador</p>
											<p class="text-sm text-gray-600">{event.organizerName}</p>
										</div>
									</div>
								</div>

								<!-- Descripción -->
								{#if event.description}
									<div class="mb-6">
										<h3 class="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
										<div class="prose max-w-none text-gray-700">
											<p>{event.description}</p>
										</div>
									</div>
								{/if}
							</div>
						</div>

						<!-- Enlaces relacionados -->
						{#if event.relatedProjectTitle || event.relatedBlogPostTitle}
							<div class="bg-white rounded-lg shadow p-6">
								<h3 class="text-lg font-semibold text-gray-900 mb-4">Contenido Relacionado</h3>

								<div class="space-y-3">
									{#if event.relatedProjectTitle}
										<div
											class="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
											on:click={navigateToRelatedProject}
											role="button"
											tabindex="0"
											on:keydown={(e) => e.key === 'Enter' && navigateToRelatedProject()}
										>
											<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
											</svg>
											<div class="flex-1">
												<p class="font-medium text-blue-900">Proyecto: {event.relatedProjectTitle}</p>
												<p class="text-sm text-blue-700">Ver información del proyecto completo</p>
											</div>
											<svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
											</svg>
										</div>
									{/if}

									{#if event.relatedBlogPostTitle}
										<div 
											class="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
											on:click={navigateToRelatedBlogPost}
											role="button"
											tabindex="0"
											on:keydown={(e) => e.key === 'Enter' && navigateToRelatedBlogPost()}
										>
											<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15"/>
											</svg>
											<div class="flex-1">
												<p class="font-medium text-green-900">Post: {event.relatedBlogPostTitle}</p>
												<p class="text-sm text-green-700">Leer artículo relacionado</p>
											</div>
											<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
											</svg>
										</div>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Eventos relacionados -->
						{#if relatedEvents.length > 0}
							<div class="bg-white rounded-lg shadow p-6">
								<h3 class="text-lg font-semibold text-gray-900 mb-4">Otros Eventos Relacionados</h3>
								
								<div class="space-y-3">
									{#each relatedEvents as relatedEvent}
										<div
											class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
											on:click={() => navigateToRelatedEvent(relatedEvent.id)}
											role="button"
											tabindex="0"
											on:keydown={(e) => e.key === 'Enter' && navigateToRelatedEvent(relatedEvent.id)}
										>
											<div class="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
												<svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8V9a2 2 0 012-2h4a2 2 0 012 2v8m-6 4v-2"/>
												</svg>
											</div>
											<div class="flex-1 min-w-0">
												<p class="font-medium text-gray-900 truncate">{relatedEvent.title}</p>
												<p class="text-sm text-gray-500">
													{new Intl.DateTimeFormat('es-ES', {
														month: 'short',
														day: 'numeric',
														hour: '2-digit',
														minute: '2-digit'
													}).format(new Date(relatedEvent.startDateTime))}
												</p>
											</div>
											<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getEventTypeColor(relatedEvent.eventType)}">
												{relatedEvent.eventType}
											</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<!-- Sidebar -->
					<div class="space-y-6">
						<!-- Acciones -->
						<div class="bg-white rounded-lg shadow p-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>

							<div class="space-y-3">
								<!-- ✅ Editar evento solo para organizador/admin -->
								{#if canEditEvent}
									<button
										on:click={navigateToEdit}
										class="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
										</svg>
										<span>Editar Evento</span>
									</button>
								{/if}

								<!-- Compartir -->
								<button
									on:click={shareEvent}
									class="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
									</svg>
									<span>Compartir</span>
								</button>
								{#if shareFeedback}
									<p class={`text-sm mt-2 ${shareFeedback.kind === 'success' ? 'text-green-600' : 'text-red-600'}`}>
										{shareFeedback.message}
									</p>
								{/if}
							</div>
						</div>

						<!-- Información de recurrencia -->
						{#if event.isRecurring}
							<div class="bg-white rounded-lg shadow p-6">
								<h3 class="text-lg font-semibold text-gray-900 mb-4">Información de Recurrencia</h3>
								
								<div class="space-y-2 text-sm">
									<div class="flex justify-between">
										<span class="text-gray-600">Patrón:</span>
										<span class="font-medium capitalize">{event.recurrencePattern}</span>
									</div>
									
									{#if event.recurrenceInterval && event.recurrenceInterval > 1}
										<div class="flex justify-between">
											<span class="text-gray-600">Intervalo:</span>
											<span class="font-medium">Cada {event.recurrenceInterval} 
												{event.recurrencePattern === 'daily' ? 'días' : 
												 event.recurrencePattern === 'weekly' ? 'semanas' : 
												 event.recurrencePattern === 'monthly' ? 'meses' : 'años'}
											</span>
										</div>
									{/if}

									{#if event.recurrenceEndDate}
										<div class="flex justify-between">
											<span class="text-gray-600">Hasta:</span>
											<span class="font-medium">{formatDateOnly(event.recurrenceEndDate)}</span>
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
