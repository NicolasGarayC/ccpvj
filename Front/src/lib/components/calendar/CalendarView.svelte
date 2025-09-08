<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type { EventSummary } from '$lib/services/calendar/calendarService';

	export let events: EventSummary[] = [];
	export let currentDate: Date = new Date();
	export let viewType: 'month' | 'week' | 'day' = 'month';

	const dispatch = createEventDispatcher<{
		eventClick: { event: EventSummary };
		dateClick: { date: Date };
		viewChange: { date: Date; viewType: string };
	}>();

	let calendarDays: Array<{ date: Date; isCurrentMonth: boolean; events: EventSummary[] }> = [];
	let monthNames = [
		'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
		'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
	];
	let dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

	$: if (currentDate || events) {
		generateCalendarDays();
	}

	function generateCalendarDays() {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const startDate = new Date(firstDay);
		startDate.setDate(startDate.getDate() - firstDay.getDay());

		const endDate = new Date(lastDay);
		endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

		calendarDays = [];
		const current = new Date(startDate);

		while (current <= endDate) {
			const dayEvents = events.filter(event => {
				const eventDate = new Date(event.startDateTime);
				return eventDate.toDateString() === current.toDateString();
			});

			calendarDays.push({
				date: new Date(current),
				isCurrentMonth: current.getMonth() === month,
				events: dayEvents
			});

			current.setDate(current.getDate() + 1);
		}
	}

	function navigateMonth(direction: number) {
		const newDate = new Date(currentDate);
		newDate.setMonth(newDate.getMonth() + direction);
		currentDate = newDate;
		dispatch('viewChange', { date: currentDate, viewType });
	}

	function goToToday() {
		currentDate = new Date();
		dispatch('viewChange', { date: currentDate, viewType });
	}

	function handleEventClick(event: EventSummary) {
		dispatch('eventClick', { event });
	}

	function handleDateClick(date: Date) {
		dispatch('dateClick', { date });
	}

	function getEventTypeColor(eventType: string): string {
		const colors: Record<string, string> = {
			'Clase': 'bg-blue-500',
			'Taller': 'bg-green-500',
			'Conferencia': 'bg-purple-500',
			'Evento': 'bg-yellow-500',
			'General': 'bg-gray-500'
		};
		return colors[eventType] || 'bg-gray-500';
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('es-ES', { 
			hour: '2-digit', 
			minute: '2-digit',
			hour12: false 
		});
	}

	function isToday(date: Date): boolean {
		const today = new Date();
		return date.toDateString() === today.toDateString();
	}

	function isWeekend(date: Date): boolean {
		return date.getDay() === 0 || date.getDay() === 6;
	}
</script>

<div class="bg-white rounded-lg shadow-lg overflow-hidden">
	<!-- Header del calendario -->
	<div class="bg-blue-600 text-white p-4 flex items-center justify-between">
		<div class="flex items-center space-x-4">
			<button 
				on:click={() => navigateMonth(-1)}
				class="p-2 hover:bg-blue-700 rounded-lg transition-colors"
				aria-label="Mes anterior"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
				</svg>
			</button>
			
			<h2 class="text-xl font-semibold">
				{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
			</h2>
			
			<button 
				on:click={() => navigateMonth(1)}
				class="p-2 hover:bg-blue-700 rounded-lg transition-colors"
				aria-label="Mes siguiente"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
				</svg>
			</button>
		</div>
		
		<button 
			on:click={goToToday}
			class="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
		>
			Hoy
		</button>
	</div>

	<!-- Encabezados de días -->
	<div class="grid grid-cols-7 border-b border-gray-200">
		{#each dayNames as dayName}
			<div class="p-3 text-center text-sm font-medium text-gray-700 bg-gray-50">
				{dayName}
			</div>
		{/each}
	</div>

	<!-- Días del calendario -->
	<div class="grid grid-cols-7">
		{#each calendarDays as day}
			<div 
				class="min-h-[120px] border-r border-b border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors
					{!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
					{isToday(day.date) ? 'bg-blue-50' : ''}
					{isWeekend(day.date) && day.isCurrentMonth ? 'bg-orange-50' : ''}"
				on:click={() => handleDateClick(day.date)}
				role="gridcell"
				tabindex="0"
				on:keydown={(e) => e.key === 'Enter' && handleDateClick(day.date)}
			>
				<!-- Número del día -->
				<div class="flex justify-between items-start mb-1">
					<span 
						class="text-sm font-medium
							{isToday(day.date) ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
							{!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}"
					>
						{day.date.getDate()}
					</span>
					
					{#if day.events.length > 0}
						<span class="text-xs bg-red-500 text-white rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
							{day.events.length}
						</span>
					{/if}
				</div>

				<!-- Eventos del día -->
				<div class="space-y-1">
					{#each day.events.slice(0, 3) as event}
						<div 
							class="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity
								{getEventTypeColor(event.eventType)} text-white"
							on:click|stopPropagation={() => handleEventClick(event)}
							role="button"
							tabindex="0"
							on:keydown={(e) => e.key === 'Enter' && handleEventClick(event)}
							title="{event.title} - {event.isAllDay ? 'Todo el día' : formatTime(new Date(event.startDateTime))}"
						>
							<div class="truncate font-medium">{event.title}</div>
							{#if !event.isAllDay}
								<div class="text-[10px] opacity-90">{formatTime(new Date(event.startDateTime))}</div>
							{/if}
						</div>
					{/each}
					
					{#if day.events.length > 3}
						<div class="text-xs text-gray-600 px-1">
							+{day.events.length - 3} más
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Leyenda de tipos de eventos -->
<div class="mt-4 flex flex-wrap gap-4 text-sm">
	<div class="flex items-center space-x-2">
		<div class="w-3 h-3 bg-blue-500 rounded"></div>
		<span>Clases</span>
	</div>
	<div class="flex items-center space-x-2">
		<div class="w-3 h-3 bg-green-500 rounded"></div>
		<span>Talleres</span>
	</div>
	<div class="flex items-center space-x-2">
		<div class="w-3 h-3 bg-purple-500 rounded"></div>
		<span>Conferencias</span>
	</div>
	<div class="flex items-center space-x-2">
		<div class="w-3 h-3 bg-yellow-500 rounded"></div>
		<span>Eventos</span>
	</div>
	<div class="flex items-center space-x-2">
		<div class="w-3 h-3 bg-gray-500 rounded"></div>
		<span>General</span>
	</div>
</div>

<style>
	/* Asegurar que las celdas tengan altura mínima consistente */
	.grid > div {
		min-height: 120px;
	}
	
	@media (max-width: 768px) {
		.grid > div {
			min-height: 80px;
		}
	}
</style>