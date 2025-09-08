<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { calendarService, type EventSummary } from '$lib/services/calendar/calendarService';

	export let limit: number = 5;
	export let showHeader: boolean = true;
	export let title: string = 'Próximos Eventos';

	let events: EventSummary[] = [];
	let loading = true;
	let error = '';

	onMount(async () => {
		await loadEvents();
	});

	async function loadEvents() {
		try {
			loading = true;
			error = '';
			events = await calendarService.getUpcomingEvents(limit);
		} catch (err) {
			console.error('Error al cargar eventos próximos:', err);
			error = 'Error al cargar eventos';
		} finally {
			loading = false;
		}
	}

	function handleEventClick(eventId: string) {
		goto(`/calendar/event/${eventId}`);
	}

	function navigateToCalendar() {
		goto('/calendar');
	}

	function getEventTypeColor(eventType: string): string {
		const colors: Record<string, string> = {
			'Clase': 'bg-blue-100 text-blue-800',
			'Taller': 'bg-green-100 text-green-800',
			'Conferencia': 'bg-purple-100 text-purple-800',
			'Evento': 'bg-yellow-100 text-yellow-800',
			'General': 'bg-gray-100 text-gray-800'
		};
		return colors[eventType] || 'bg-gray-100 text-gray-800';
	}

	function formatEventDate(date: Date): string {
		return new Intl.DateTimeFormat('es-ES', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(date));
	}

	function isToday(date: Date): boolean {
		const today = new Date();
		const eventDate = new Date(date);
		return eventDate.toDateString() === today.toDateString();
	}

	function isTomorrow(date: Date): boolean {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		const eventDate = new Date(date);
		return eventDate.toDateString() === tomorrow.toDateString();
	}

	function getDateLabel(date: Date): string {
		if (isToday(date)) return 'Hoy';
		if (isTomorrow(date)) return 'Mañana';
		return formatEventDate(date);
	}
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
	{#if showHeader}
		<div class="px-4 py-3 border-b border-gray-200 bg-gray-50">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-gray-900 flex items-center">
					<svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8V9a2 2 0 012-2h4a2 2 0 012 2v8m-6 4v-2"/>
					</svg>
					{title}
				</h3>
				<button
					on:click={navigateToCalendar}
					class="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
				>
					Ver todo
					<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
					</svg>
				</button>
			</div>
		</div>
	{/if}

	<div class="p-4">
		{#if loading}
			<div class="space-y-3">
				{#each Array(3) as _}
					<div class="animate-pulse flex items-center space-x-3">
						<div class="w-12 h-12 bg-gray-200 rounded-lg"></div>
						<div class="flex-1 space-y-2">
							<div class="h-4 bg-gray-200 rounded w-3/4"></div>
							<div class="h-3 bg-gray-200 rounded w-1/2"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if error}
			<div class="text-center py-6">
				<svg class="mx-auto h-8 w-8 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				<p class="text-sm text-red-600">{error}</p>
				<button
					on:click={loadEvents}
					class="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
				>
					Reintentar
				</button>
			</div>
		{:else if events.length === 0}
			<div class="text-center py-6">
				<svg class="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8V9a2 2 0 012-2h4a2 2 0 012 2v8m-6 4v-2"/>
				</svg>
				<p class="text-sm text-gray-600">No hay eventos próximos</p>
				<button
					on:click={navigateToCalendar}
					class="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
				>
					Ver calendario completo
				</button>
			</div>
		{:else}
			<div class="space-y-3">
				{#each events as event}
					<div 
						class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-200"
						on:click={() => handleEventClick(event.id)}
						role="button"
						tabindex="0"
						on:keydown={(e) => e.key === 'Enter' && handleEventClick(event.id)}
					>
						<!-- Imagen o icono del evento -->
						{#if event.imagePath}
							<img 
								src={event.imagePath} 
								alt={event.title}
								class="w-12 h-12 object-cover rounded-lg flex-shrink-0"
							/>
						{:else}
							<div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
								<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8V9a2 2 0 012-2h4a2 2 0 012 2v8m-6 4v-2"/>
								</svg>
							</div>
						{/if}

						<!-- Información del evento -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center space-x-2 mb-1">
								<h4 class="font-medium text-gray-900 truncate">{event.title}</h4>
								{#if event.isFeatured}
									<svg class="w-3 h-3 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
									</svg>
								{/if}
							</div>
							
							<div class="flex items-center space-x-2 text-sm">
								<!-- Tipo de evento -->
								<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getEventTypeColor(event.eventType)}">
									{event.eventType}
								</span>
								
								<!-- Fecha -->
								<span class="text-gray-600">
									{getDateLabel(event.startDateTime)}
								</span>
								
								<!-- Ubicación -->
								{#if event.location}
									<span class="text-gray-500">•</span>
									<span class="text-gray-600 truncate">{event.location}</span>
								{/if}
							</div>

							<!-- Organizador -->
							<div class="text-xs text-gray-500 mt-1">
								Por {event.organizerName}
							</div>
						</div>

						<!-- Indicador de tiempo -->
						<div class="flex-shrink-0 text-right">
							{#if isToday(event.startDateTime)}
								<div class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
									Hoy
								</div>
							{:else if isTomorrow(event.startDateTime)}
								<div class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
									Mañana
								</div>
							{:else}
								<div class="text-xs text-gray-500">
									{formatEventDate(event.startDateTime)}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<!-- Botón ver más si hay más eventos -->
			{#if events.length >= limit}
				<div class="mt-4 pt-3 border-t border-gray-200 text-center">
					<button
						on:click={navigateToCalendar}
						class="text-sm text-blue-600 hover:text-blue-800 font-medium"
					>
						Ver todos los eventos del mes
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>