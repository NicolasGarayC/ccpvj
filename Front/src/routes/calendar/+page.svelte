<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import CalendarView from '$lib/components/calendar/CalendarView.svelte';
	import EventList from '$lib/components/calendar/EventList.svelte';
	import { calendarService, type EventSummary, type CalendarView as CalendarViewType } from '$lib/services/calendar/calendarService';
	import { jwtService } from '$lib/services/auth/jwtService.js';

	// Estado de la página
	let loading = true;
	let error = '';
	let currentView: 'calendar' | 'list' = 'calendar';
	let currentDate = new Date();
	let calendarData: CalendarViewType | null = null;
	let upcomingEvents: EventSummary[] = [];
	let featuredEvents: EventSummary[] = [];
	
	// ✅ Estado de autenticación
	let isAuthenticated = false;
	let canCreateEvents = false;

	// Cargar datos iniciales
	onMount(async () => {
		// ✅ Verificar autenticación y permisos
		isAuthenticated = jwtService.isAuthenticated();
		if (isAuthenticated) {
			const user = jwtService.getUser();
			canCreateEvents = user?.role === 'colaborador' || user?.role === 'administrador';
		}

		await Promise.all([
			loadCalendarView(),
			loadUpcomingEvents(),
			loadFeaturedEvents()
		]);
	});

	async function loadCalendarView() {
		try {
			loading = true;
			calendarData = await calendarService.getCalendarView(currentDate, 'month');
			error = '';
		} catch (err) {
			console.error('Error al cargar vista de calendario:', err);
			error = 'Error al cargar el calendario. Inténtalo de nuevo.';
		} finally {
			loading = false;
		}
	}

	async function loadUpcomingEvents() {
		try {
			upcomingEvents = await calendarService.getUpcomingEvents(10);
		} catch (err) {
			console.error('Error al cargar eventos próximos:', err);
		}
	}

	async function loadFeaturedEvents() {
		try {
			featuredEvents = await calendarService.getFeaturedEvents(5);
		} catch (err) {
			console.error('Error al cargar eventos destacados:', err);
		}
	}

	// Manejar cambios en la vista del calendario
	async function handleViewChange(event: CustomEvent<{ date: Date; viewType: string }>) {
		currentDate = event.detail.date;
		await loadCalendarView();
	}

	// Manejar clic en evento
	function handleEventClick(event: CustomEvent<{ event: EventSummary }>) {
		goto(`/calendar/event/${event.detail.event.id}`);
	}

	// Manejar clic en fecha
	function handleDateClick(event: CustomEvent<{ date: Date }>) {
		// Opcional: navegar a vista de día o abrir modal para crear evento
		console.log('Fecha clickeada:', event.detail.date);
	}

	// Cambiar vista
	function setView(view: 'calendar' | 'list') {
		currentView = view;
	}

	// Navegar a crear evento
	function navigateToCreateEvent() {
		if (!isAuthenticated) {
			goto('/auth/login?redirect=/calendar/create');
		} else if (!canCreateEvents) {
			alert('No tienes permisos para crear eventos. Contacta al administrador.');
		} else {
			goto('/calendar/create');
		}
	}

	// Obtener mensaje de estado
	function getStatusMessage(): string {
		if (loading) return 'Cargando calendario...';
		if (error) return error;
		if (!calendarData?.events || calendarData.events.length === 0) {
			return 'No hay eventos programados para este período.';
		}
		return `${calendarData.events.length} evento${calendarData.events.length !== 1 ? 's' : ''} encontrado${calendarData.events.length !== 1 ? 's' : ''}`;
	}
</script>

<svelte:head>
	<title>Calendario - Centro Cultural Víctor Jara</title>
	<meta name="description" content="Calendario de eventos, clases y actividades del Centro Cultural Víctor Jara" />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header juvenil mejorado -->
		<div class="mb-8">
			<div class="relative bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 rounded-3xl p-8 border-2 border-blue-100 overflow-hidden">
				<!-- Elementos decorativos -->
				<div class="absolute top-4 right-6 text-6xl opacity-20">📅</div>
				<div class="absolute -top-4 -left-4 w-16 h-16 bg-blue-200/30 rounded-full animate-pulse"></div>
				<div class="absolute bottom-6 right-12 w-12 h-12 bg-purple-200/30 rounded-full animate-pulse" style="animation-delay: 1s;"></div>

				<div class="relative z-10 flex items-center justify-between">
					<div class="flex-1">
						<h1 class="text-4xl md:text-5xl lg:text-6xl font-black mb-4">
							<span class="text-4xl mr-3">🎪</span>
							<span class="bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-800 bg-clip-text text-transparent">
								Calendario de Eventos
							</span>
						</h1>
						<p class="text-lg md:text-xl text-gray-700 max-w-2xl leading-relaxed font-medium">
							✨ Descubre todas las actividades, clases y eventos increíbles que tenemos preparados para ti en nuestro centro cultural
						</p>
					</div>

					<div class="flex items-center space-x-6 ml-8">
						<!-- Selector de vista mejorado -->
						<div class="flex bg-white/70 backdrop-blur-sm border-2 border-blue-200 rounded-2xl p-1.5 shadow-lg">
							<button
								on:click={() => setView('calendar')}
								class="group px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2
									{currentView === 'calendar'
										? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
										: 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}"
							>
								<svg class="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8V9a2 2 0 012-2h4a2 2 0 012 2v8m-6 4v-2"/>
								</svg>
								📅 Calendario
							</button>
							<button
								on:click={() => setView('list')}
								class="group px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2
									{currentView === 'list'
										? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
										: 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'}"
							>
								<svg class="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
								</svg>
								📋 Lista
							</button>
						</div>

						<!-- Botón crear evento mejorado -->
						{#if canCreateEvents}
							<button
								on:click={navigateToCreateEvent}
								class="group bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg flex items-center space-x-3 border-2 border-green-400"
							>
								<svg class="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"/>
								</svg>
								<span class="text-lg">✨ Crear Evento</span>
							</button>
						{/if}
					</div>
				</div>
			</div>

			<!-- Estado -->
			<div class="mt-4">
				<p class="text-sm text-gray-600">{getStatusMessage()}</p>
			</div>
		</div>

		<!-- Contenido principal -->
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
			<!-- Vista principal -->
			<div class="lg:col-span-3">
				{#if loading}
					<div class="bg-white rounded-lg shadow p-8 text-center">
						<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
						<p class="text-gray-600">Cargando calendario...</p>
					</div>
				{:else if error}
					<div class="bg-red-50 border border-red-200 rounded-lg p-6">
						<div class="flex">
							<svg class="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
							</svg>
							<div>
								<h3 class="text-sm font-medium text-red-800">Error al cargar el calendario</h3>
								<p class="mt-1 text-sm text-red-700">{error}</p>
								<button
									on:click={loadCalendarView}
									class="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
								>
									Reintentar
								</button>
							</div>
						</div>
					</div>
				{:else if currentView === 'calendar' && calendarData}
					<CalendarView
						events={calendarData.events}
						currentDate={currentDate}
						on:eventClick={handleEventClick}
						on:dateClick={handleDateClick}
						on:viewChange={handleViewChange}
					/>
				{:else if currentView === 'list' && calendarData}
					<EventList
						events={calendarData.events}
						showFilters={true}
						showCreateButton={false}
						on:eventClick={handleEventClick}
						on:createEvent={navigateToCreateEvent}
					/>
				{/if}
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Eventos destacados -->
				{#if featuredEvents.length > 0}
					<div class="bg-white rounded-lg shadow">
						<div class="p-4 border-b border-gray-200">
							<h3 class="text-lg font-semibold text-gray-900 flex items-center">
								<svg class="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
								</svg>
								Eventos Destacados
							</h3>
						</div>
						<div class="p-4 space-y-4">
							{#each featuredEvents as event}
								<div 
									class="cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
									on:click={() => goto(`/calendar/event/${event.id}`)}
									role="button"
									tabindex="0"
									on:keydown={(e) => e.key === 'Enter' && goto(`/calendar/event/${event.id}`)}
								>
									<div class="flex items-start space-x-3">
										{#if event.imagePath}
											<img src={event.imagePath} alt={event.title} class="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
										{:else}
											<div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
												<svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8V9a2 2 0 012-2h4a2 2 0 012 2v8m-6 4v-2"/>
												</svg>
											</div>
										{/if}
										<div class="flex-1 min-w-0">
											<h4 class="text-sm font-medium text-gray-900 truncate">{event.title}</h4>
											<p class="text-xs text-gray-500">
												{new Intl.DateTimeFormat('es-ES', {
													month: 'short',
													day: 'numeric',
													hour: '2-digit',
													minute: '2-digit'
												}).format(new Date(event.startDateTime))}
											</p>
											<p class="text-xs text-gray-600 mt-1">{event.eventType}</p>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Próximos eventos -->
				{#if upcomingEvents.length > 0}
					<div class="bg-white rounded-lg shadow">
						<div class="p-4 border-b border-gray-200">
							<h3 class="text-lg font-semibold text-gray-900 flex items-center">
								<svg class="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
								</svg>
								Próximos Eventos
							</h3>
						</div>
						<div class="p-4 space-y-3">
							{#each upcomingEvents.slice(0, 8) as event}
								<div 
									class="cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
									on:click={() => goto(`/calendar/event/${event.id}`)}
									role="button"
									tabindex="0"
									on:keydown={(e) => e.key === 'Enter' && goto(`/calendar/event/${event.id}`)}
								>
									<div class="flex items-center justify-between">
										<div class="flex-1 min-w-0">
											<h4 class="text-sm font-medium text-gray-900 truncate">{event.title}</h4>
											<div class="flex items-center space-x-2 mt-1">
												<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
													{event.eventType}
												</span>
												<span class="text-xs text-gray-500">
													{new Intl.DateTimeFormat('es-ES', {
														month: 'short',
														day: 'numeric'
													}).format(new Date(event.startDateTime))}
												</span>
											</div>
										</div>
										<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
										</svg>
									</div>
								</div>
							{/each}
							
							{#if upcomingEvents.length > 8}
								<div class="pt-2 border-t border-gray-200">
									<button
										on:click={() => setView('list')}
										class="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
									>
										Ver todos los eventos ({upcomingEvents.length})
									</button>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Leyenda de colores -->
				<div class="bg-white rounded-lg shadow">
					<div class="p-4 border-b border-gray-200">
						<h3 class="text-lg font-semibold text-gray-900">Tipos de Eventos</h3>
					</div>
					<div class="p-4 space-y-3">
						<div class="flex items-center space-x-3">
							<div class="w-3 h-3 bg-blue-500 rounded-full"></div>
							<span class="text-sm text-gray-700">Clases</span>
						</div>
						<div class="flex items-center space-x-3">
							<div class="w-3 h-3 bg-green-500 rounded-full"></div>
							<span class="text-sm text-gray-700">Talleres</span>
						</div>
						<div class="flex items-center space-x-3">
							<div class="w-3 h-3 bg-purple-500 rounded-full"></div>
							<span class="text-sm text-gray-700">Conferencias</span>
						</div>
						<div class="flex items-center space-x-3">
							<div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
							<span class="text-sm text-gray-700">Eventos Culturales</span>
						</div>
						<div class="flex items-center space-x-3">
							<div class="w-3 h-3 bg-gray-500 rounded-full"></div>
							<span class="text-sm text-gray-700">General</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>