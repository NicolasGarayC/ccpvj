<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { EventSummary } from '$lib/services/calendar/calendarService';

	export let events: EventSummary[] = [];
	export let showFilters: boolean = true;
	export let showCreateButton: boolean = false;
	export let limit: number = 0;
	export let featured: boolean = false;

	const dispatch = createEventDispatcher<{
		eventClick: { event: EventSummary };
		createEvent: void;
		editEvent: { event: EventSummary };
		deleteEvent: { event: EventSummary };
	}>();

	let searchTerm = '';
	let selectedEventType = '';
	let sortBy = 'start_asc';

	$: filteredEvents = filterAndSortEvents(events, searchTerm, selectedEventType, sortBy, limit, featured);

	function filterAndSortEvents(
		eventList: EventSummary[],
		search: string,
		eventType: string,
		sort: string,
		itemLimit: number,
		onlyFeatured: boolean
	): EventSummary[] {
		let filtered = [...eventList];

		// Filtrar por búsqueda
		if (search.trim()) {
			filtered = filtered.filter(event =>
				event.title.toLowerCase().includes(search.toLowerCase()) ||
				(event.description && event.description.toLowerCase().includes(search.toLowerCase()))
			);
		}

		// Filtrar por tipo de evento
		if (eventType) {
			filtered = filtered.filter(event => event.eventType === eventType);
		}

		// Filtrar por destacados
		if (onlyFeatured) {
			filtered = filtered.filter(event => event.isFeatured);
		}

		// Ordenar
		filtered.sort((a, b) => {
			switch (sort) {
				case 'start_desc':
					return new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime();
				case 'title_asc':
					return a.title.localeCompare(b.title);
				case 'title_desc':
					return b.title.localeCompare(a.title);
				default: // start_asc
					return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
			}
		});

		// Limitar resultados
		if (itemLimit > 0) {
			filtered = filtered.slice(0, itemLimit);
		}

		return filtered;
	}

	function handleEventClick(event: EventSummary) {
		dispatch('eventClick', { event });
	}

	function handleCreateEvent() {
		dispatch('createEvent');
	}

	function handleEditEvent(event: EventSummary) {
		dispatch('editEvent', { event });
	}

	function handleDeleteEvent(event: EventSummary) {
		dispatch('deleteEvent', { event });
	}

	function getEventTypeColor(eventType: string): string {
		const colors: Record<string, string> = {
			'Clase': 'border-blue-500 bg-blue-50',
			'Taller': 'border-green-500 bg-green-50',
			'Conferencia': 'border-purple-500 bg-purple-50',
			'Evento': 'border-yellow-500 bg-yellow-50',
			'General': 'border-gray-500 bg-gray-50'
		};
		return colors[eventType] || 'border-gray-500 bg-gray-50';
	}

	function getEventTypeTextColor(eventType: string): string {
		const colors: Record<string, string> = {
			'Clase': 'text-blue-700',
			'Taller': 'text-green-700',
			'Conferencia': 'text-purple-700',
			'Evento': 'text-yellow-700',
			'General': 'text-gray-700'
		};
		return colors[eventType] || 'text-gray-700';
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
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		}).format(new Date(date));
	}

	function formatTimeOnly(date: Date): string {
		return new Intl.DateTimeFormat('es-ES', {
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(date));
	}

	function isUpcoming(date: Date): boolean {
		return new Date(date) > new Date();
	}

	function isPast(date: Date): boolean {
		return new Date(date) < new Date();
	}

	const eventTypes = [
		{ value: '', label: 'Todos los tipos' },
		{ value: 'Clase', label: 'Clases' },
		{ value: 'Taller', label: 'Talleres' },
		{ value: 'Conferencia', label: 'Conferencias' },
		{ value: 'Evento', label: 'Eventos' },
		{ value: 'General', label: 'General' }
	];

	const sortOptions = [
		{ value: 'start_asc', label: 'Fecha (próximos primero)' },
		{ value: 'start_desc', label: 'Fecha (recientes primero)' },
		{ value: 'title_asc', label: 'Título (A-Z)' },
		{ value: 'title_desc', label: 'Título (Z-A)' }
	];
</script>

<div class="space-y-6">
	<!-- Filtros y búsqueda -->
	{#if showFilters}
		<div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
			<div class="flex flex-col md:flex-row gap-4 items-center">
				<!-- Búsqueda -->
				<div class="flex-1">
					<div class="relative">
						<svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
						</svg>
						<input
							type="text"
							bind:value={searchTerm}
							placeholder="Buscar eventos..."
							class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
				</div>

				<!-- Filtro por tipo -->
				<div class="w-full md:w-48">
					<select
						bind:value={selectedEventType}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						{#each eventTypes as type}
							<option value={type.value}>{type.label}</option>
						{/each}
					</select>
				</div>

				<!-- Ordenar -->
				<div class="w-full md:w-48">
					<select
						bind:value={sortBy}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						{#each sortOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<!-- Botón crear evento -->
				{#if showCreateButton}
					<button
						on:click={handleCreateEvent}
						class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
						</svg>
						<span>Crear Evento</span>
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Lista de eventos -->
	<div class="space-y-4">
		{#if filteredEvents.length === 0}
			<div class="text-center py-12 bg-white rounded-lg border border-gray-200">
				<svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8V9a2 2 0 012-2h4a2 2 0 012 2v8m-6 4v-2"/>
				</svg>
				<h3 class="text-lg font-medium text-gray-900 mb-2">No hay eventos</h3>
				<p class="text-gray-500">No se encontraron eventos que coincidan con los filtros seleccionados.</p>
			</div>
		{:else}
			{#each filteredEvents as event}
				<div 
					class="bg-white border-l-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer
						{getEventTypeColor(event.eventType)}
						{isPast(event.startDateTime) ? 'opacity-75' : ''}"
					on:click={() => handleEventClick(event)}
					role="button"
					tabindex="0"
					on:keydown={(e) => e.key === 'Enter' && handleEventClick(event)}
				>
					<div class="p-4">
						<div class="flex items-start justify-between">
							<div class="flex-1 min-w-0">
								<!-- Título y tipo -->
								<div class="flex items-center space-x-2 mb-2">
									<h3 class="text-lg font-semibold text-gray-900 truncate">{event.title}</h3>
									{#if event.isFeatured}
										<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
											Destacado
										</span>
									{/if}
									{#if event.isRecurring}
										<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
											Recurrente
										</span>
									{/if}
								</div>

								<!-- Tipo de evento -->
								<div class="mb-2">
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getEventTypeTextColor(event.eventType)} bg-opacity-10">
										{event.eventType}
									</span>
								</div>

								<!-- Fecha y hora -->
								<div class="flex items-center space-x-4 text-sm text-gray-600 mb-2">
									<div class="flex items-center space-x-1">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8V9a2 2 0 012-2h4a2 2 0 012 2v8m-6 4v-2"/>
										</svg>
										<span>{formatDateOnly(event.startDateTime)}</span>
									</div>
									{#if !event.isAllDay}
										<div class="flex items-center space-x-1">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
											</svg>
											<span>{formatTimeOnly(event.startDateTime)}</span>
											{#if event.endDateTime}
												<span>- {formatTimeOnly(event.endDateTime)}</span>
											{/if}
										</div>
									{:else}
										<span class="text-blue-600 font-medium">Todo el día</span>
									{/if}
								</div>

								<!-- Ubicación -->
								{#if event.location}
									<div class="flex items-center space-x-1 text-sm text-gray-600 mb-2">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
										</svg>
										<span>{event.location}</span>
									</div>
								{/if}

								<!-- Descripción -->
								{#if event.description}
									<p class="text-gray-700 text-sm line-clamp-2 mb-2">{event.description}</p>
								{/if}

								<!-- Organizador -->
								<div class="flex items-center space-x-1 text-sm text-gray-500">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
									</svg>
									<span>Organizado por {event.organizerName}</span>
								</div>

								<!-- Enlaces relacionados -->
								{#if event.relatedCourseTitle || event.relatedBlogPostTitle}
									<div class="mt-2 space-y-1">
										{#if event.relatedCourseTitle}
											<div class="flex items-center space-x-1 text-sm text-blue-600">
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
												</svg>
												<span>Curso: {event.relatedCourseTitle}</span>
											</div>
										{/if}
										{#if event.relatedBlogPostTitle}
											<div class="flex items-center space-x-1 text-sm text-green-600">
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2C7 1.44772 7.44772 1 8 1H16C16.5523 1 17 1.44772 17 2V4M7 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4H17M7 4H17"/>
												</svg>
												<span>Post: {event.relatedBlogPostTitle}</span>
											</div>
										{/if}
									</div>
								{/if}
							</div>

							<!-- Imagen del evento -->
							{#if event.imagePath}
								<div class="ml-4 flex-shrink-0">
									<img
										src={event.imagePath}
										alt={event.title}
										class="w-20 h-20 object-cover rounded-lg"
									/>
								</div>
							{/if}
						</div>

						<!-- Estado del evento -->
						{#if isPast(event.startDateTime)}
							<div class="mt-2 text-xs text-gray-500 font-medium">
								Evento finalizado
							</div>
						{:else if isUpcoming(event.startDateTime)}
							<div class="mt-2 text-xs text-green-600 font-medium">
								Próximo evento
							</div>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>