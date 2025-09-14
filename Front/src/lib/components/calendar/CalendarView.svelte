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

<div class="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-transparent hover:border-blue-200 transition-all duration-300">
	<!-- Header del calendario juvenil -->
	<div class="relative bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white p-6 overflow-hidden">
		<!-- Elementos decorativos -->
		<div class="absolute top-2 right-4 text-6xl opacity-20 animate-pulse">📅</div>
		<div class="absolute -top-8 -left-8 w-20 h-20 bg-white/10 rounded-full animate-bounce" style="animation-duration: 3s;"></div>
		<div class="absolute -bottom-4 -right-4 w-16 h-16 bg-yellow-300/20 rounded-full animate-pulse" style="animation-delay: 1s;"></div>

		<div class="relative z-10 flex items-center justify-between">
			<div class="flex items-center space-x-6">
				<!-- Botón anterior mejorado -->
				<button
					on:click={() => navigateMonth(-1)}
					class="group p-3 hover:bg-white/20 rounded-2xl transition-all duration-300 hover:scale-110 hover:rotate-12"
					aria-label="Mes anterior"
				>
					<svg class="w-6 h-6 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7"/>
					</svg>
				</button>

				<!-- Título con animación -->
				<div class="text-center">
					<h2 class="text-2xl md:text-3xl font-black tracking-wide">
						{monthNames[currentDate.getMonth()]}
						<span class="text-yellow-300">{currentDate.getFullYear()}</span>
					</h2>
					<div class="w-24 h-1 bg-yellow-300 rounded-full mx-auto mt-2"></div>
				</div>

				<!-- Botón siguiente mejorado -->
				<button
					on:click={() => navigateMonth(1)}
					class="group p-3 hover:bg-white/20 rounded-2xl transition-all duration-300 hover:scale-110 hover:-rotate-12"
					aria-label="Mes siguiente"
				>
					<svg class="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"/>
					</svg>
				</button>
			</div>

			<!-- Botón "Hoy" mejorado -->
			<button
				on:click={goToToday}
				class="group relative bg-white/20 backdrop-blur-sm hover:bg-white/30 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 hover:scale-105 shadow-lg border-2 border-white/30"
			>
				<span class="relative z-10 flex items-center gap-2">
					<span class="text-lg group-hover:scale-125 transition-transform duration-300">🌟</span>
					Hoy
				</span>
			</button>
		</div>
	</div>

	<!-- Encabezados de días mejorados -->
	<div class="grid grid-cols-7 bg-gradient-to-r from-slate-50 to-gray-50 border-b-2 border-blue-100">
		{#each dayNames as dayName, index}
			<div class="p-4 text-center relative group transition-all duration-300 hover:bg-blue-50">
				<!-- Indicador de fin de semana -->
				{#if index === 0 || index === 6}
					<div class="absolute top-1 right-1 w-2 h-2 bg-orange-400 rounded-full opacity-60"></div>
				{/if}

				<span class="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
					{dayName}
				</span>

				<!-- Línea decorativa -->
				<div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full group-hover:w-8 transition-all duration-300"></div>
			</div>
		{/each}
	</div>

	<!-- Días del calendario mejorados -->
	<div class="grid grid-cols-7 gap-1 p-1 bg-slate-100">
		{#each calendarDays as day, dayIndex}
			<div
				class="group relative min-h-[120px] p-3 cursor-pointer transition-all duration-300 hover:scale-102 hover:-translate-y-1 hover:shadow-lg
					{!day.isCurrentMonth
						? 'bg-slate-50 text-gray-400 hover:bg-slate-100'
						: 'bg-white hover:bg-blue-50'
					}
					{isToday(day.date)
						? 'bg-gradient-to-br from-blue-100 to-purple-100 ring-2 ring-blue-400 shadow-lg'
						: ''
					}
					{isWeekend(day.date) && day.isCurrentMonth
						? 'bg-gradient-to-br from-orange-50 to-yellow-50'
						: ''
					}
					rounded-2xl border-2 border-transparent hover:border-blue-200"
				on:click={() => handleDateClick(day.date)}
				role="gridcell"
				tabindex="0"
				on:keydown={(e) => e.key === 'Enter' && handleDateClick(day.date)}
				style="animation-delay: {dayIndex * 0.02}s;"
			>
				<!-- Elementos decorativos sutiles -->
				{#if day.events.length > 0}
					<div class="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-400 to-red-400 rounded-full animate-pulse"></div>
				{/if}

				<!-- Número del día mejorado -->
				<div class="flex justify-between items-start mb-2">
					<span class="relative">
						{#if isToday(day.date)}
							<div class="absolute -inset-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse opacity-20"></div>
							<span class="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-black shadow-lg">
								{day.date.getDate()}
							</span>
						{:else}
							<span class="text-lg font-bold transition-all duration-300 group-hover:scale-125
								{!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-800 group-hover:text-blue-600'}"
							>
								{day.date.getDate()}
							</span>
						{/if}
					</span>

					<!-- Contador de eventos más atractivo -->
					{#if day.events.length > 0}
						<div class="relative">
							<div class="absolute -inset-1 bg-gradient-to-r from-red-400 to-pink-400 rounded-full animate-ping opacity-20"></div>
							<span class="relative bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full px-2 py-1 text-xs font-bold flex items-center justify-center shadow-md">
								{day.events.length}
							</span>
						</div>
					{/if}
				</div>

				<!-- Eventos del día mejorados -->
				<div class="space-y-1.5">
					{#each day.events.slice(0, 3) as event}
						<div
							class="group/event relative text-xs p-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md border border-transparent hover:border-white/50
								{getEventTypeColor(event.eventType)} text-white"
							on:click|stopPropagation={() => handleEventClick(event)}
							role="button"
							tabindex="0"
							on:keydown={(e) => e.key === 'Enter' && handleEventClick(event)}
							title="{event.title} - {event.isAllDay ? 'Todo el día' : formatTime(new Date(event.startDateTime))}"
						>
							<!-- Icono del tipo de evento -->
							<div class="absolute -top-1 -left-1 w-3 h-3 bg-white/30 rounded-full opacity-0 group-hover/event:opacity-100 transition-opacity duration-300"></div>

							<div class="relative z-10">
								<div class="truncate font-semibold mb-0.5">{event.title}</div>
								{#if !event.isAllDay}
									<div class="text-[10px] opacity-90 bg-black/20 rounded-full px-2 py-0.5 inline-block">
										{formatTime(new Date(event.startDateTime))}
									</div>
								{/if}
							</div>
						</div>
					{/each}

					<!-- Indicador de más eventos -->
					{#if day.events.length > 3}
						<div class="text-xs text-center font-semibold bg-gray-100 text-gray-600 rounded-full py-1 hover:bg-gray-200 transition-colors duration-300">
							+{day.events.length - 3} eventos más 🎉
						</div>
					{/if}
				</div>

				<!-- Efecto hover sutil -->
				<div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/5 group-hover:to-purple-400/5 transition-all duration-300 pointer-events-none"></div>
			</div>
		{/each}
	</div>
</div>

<!-- Leyenda de tipos de eventos mejorada -->
<div class="mt-8 p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-3xl border-2 border-gray-200">
	<div class="text-center mb-6">
		<h3 class="text-lg font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
			<span class="text-2xl">🎨</span>
			Tipos de Eventos
		</h3>
		<p class="text-sm text-gray-600">Cada color representa un tipo diferente de actividad</p>
	</div>

	<div class="flex flex-wrap justify-center gap-4">
		<div class="group flex items-center gap-3 bg-white px-4 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 border border-blue-100">
			<div class="relative">
				<div class="w-5 h-5 bg-blue-500 rounded-full shadow-lg"></div>
				<div class="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-30"></div>
			</div>
			<span class="font-semibold text-gray-700 group-hover:text-blue-600 transition-colors duration-300">📚 Clases</span>
		</div>

		<div class="group flex items-center gap-3 bg-white px-4 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 border border-green-100">
			<div class="relative">
				<div class="w-5 h-5 bg-green-500 rounded-full shadow-lg"></div>
				<div class="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-30"></div>
			</div>
			<span class="font-semibold text-gray-700 group-hover:text-green-600 transition-colors duration-300">🛠️ Talleres</span>
		</div>

		<div class="group flex items-center gap-3 bg-white px-4 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 border border-purple-100">
			<div class="relative">
				<div class="w-5 h-5 bg-purple-500 rounded-full shadow-lg"></div>
				<div class="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-30"></div>
			</div>
			<span class="font-semibold text-gray-700 group-hover:text-purple-600 transition-colors duration-300">🎤 Conferencias</span>
		</div>

		<div class="group flex items-center gap-3 bg-white px-4 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 border border-yellow-100">
			<div class="relative">
				<div class="w-5 h-5 bg-yellow-500 rounded-full shadow-lg"></div>
				<div class="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-30"></div>
			</div>
			<span class="font-semibold text-gray-700 group-hover:text-yellow-600 transition-colors duration-300">🎪 Eventos</span>
		</div>

		<div class="group flex items-center gap-3 bg-white px-4 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 border border-gray-100">
			<div class="relative">
				<div class="w-5 h-5 bg-gray-500 rounded-full shadow-lg"></div>
				<div class="absolute inset-0 bg-gray-400 rounded-full animate-ping opacity-30"></div>
			</div>
			<span class="font-semibold text-gray-700 group-hover:text-gray-600 transition-colors duration-300">⭐ General</span>
		</div>
	</div>

	<!-- Tips adicionales -->
	<div class="mt-6 text-center">
		<div class="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
			<span class="text-lg">💡</span>
			Haz clic en cualquier día para crear un nuevo evento
		</div>
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