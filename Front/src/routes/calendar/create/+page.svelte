<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import EventForm from '$lib/components/calendar/EventForm.svelte';
	import { calendarService, type CreateEventData } from '$lib/services/calendar/calendarService';
	import { authService } from '$lib/services/authService';

	let loading = false;
	let error = '';
	let availableCourses: Array<{ id: string; title: string }> = [];
	let availableBlogPosts: Array<{ id: string; title: string; slug: string }> = [];

	onMount(async () => {
		// ✅ Verificar autenticación
		if (!authService.isAuthenticated()) {
			goto('/auth/login?redirect=/calendar/create');
			return;
		}

		const user = authService.getUser();
		const canCreate = user?.role === 'Colaborador' || user?.role === 'Administrador';
		
		if (!canCreate) {
			goto('/calendar');
			return;
		}

		// Cargar cursos y posts de blog disponibles
		await loadRelatedContent();
	});

	async function loadRelatedContent() {
		try {
			// Por ahora, datos de ejemplo. En un ambiente real, cargarías desde APIs
			availableCourses = [
				{ id: 'course-1', title: 'Preuniversitario' },
				{ id: 'course-2', title: 'Matemáticas Básicas' },
				{ id: 'course-3', title: 'Historia Colombiana' }
			];

			availableBlogPosts = [
				{ id: 'post-1', title: 'Inauguración del Centro Cultural', slug: 'inauguracion-centro-cultural' },
				{ id: 'post-2', title: 'Programación Cultural 2024', slug: 'programacion-cultural-2024' },
				{ id: 'post-3', title: 'Talleres Comunitarios', slug: 'talleres-comunitarios' }
			];
		} catch (err) {
			console.error('Error al cargar contenido relacionado:', err);
		}
	}

	async function handleSave(event: CustomEvent<{ eventData: CreateEventData }>) {
		const eventData = event.detail.eventData;
		
		try {
			loading = true;
			error = '';
			
			const newEvent = await calendarService.createEvent(eventData);
			
			// Redirigir al evento creado
			goto(`/calendar/event/${newEvent.id}`);
		} catch (err) {
			console.error('Error al crear evento:', err);
			error = err instanceof Error ? err.message : 'Error al crear el evento';
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		goto('/calendar');
	}
</script>

<svelte:head>
	<title>Crear Evento - Centro Cultural Víctor Jara</title>
	<meta name="description" content="Crear un nuevo evento en el calendario del Centro Cultural Víctor Jara" />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Crear Nuevo Evento</h1>
					<p class="mt-2 text-gray-600">
						Programa una nueva actividad en el calendario del centro cultural
					</p>
				</div>

				<!-- Breadcrumb -->
				<nav class="flex items-center space-x-2 text-sm text-gray-500">
					<a href="/calendar" class="hover:text-gray-700">Calendario</a>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
					</svg>
					<span class="text-gray-900 font-medium">Crear Evento</span>
				</nav>
			</div>
		</div>

		<!-- Mensaje de error -->
		{#if error}
			<div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
				<div class="flex">
					<svg class="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
					</svg>
					<div>
						<h3 class="text-sm font-medium text-red-800">Error al crear el evento</h3>
						<p class="mt-1 text-sm text-red-700">{error}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Formulario -->
		<div class="relative">
			{#if loading}
				<div class="absolute inset-0 bg-white bg-opacity-75 z-10 flex items-center justify-center">
					<div class="text-center">
						<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
						<p class="text-gray-600">Creando evento...</p>
					</div>
				</div>
			{/if}

			<EventForm
				event={null}
				isEdit={false}
				{availableCourses}
				{availableBlogPosts}
				on:save={handleSave}
				on:cancel={handleCancel}
			/>
		</div>

		<!-- Información adicional -->
		<div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
			<div class="flex">
				<svg class="w-5 h-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
				</svg>
				<div>
					<h3 class="text-sm font-medium text-blue-800">Consejos para crear un evento exitoso</h3>
					<div class="mt-2 text-sm text-blue-700">
						<ul class="list-disc list-inside space-y-1">
							<li>Usa un título descriptivo y atractivo que capture la atención</li>
							<li>Incluye una descripción detallada del contenido y objetivos</li>
							<li>Especifica claramente la ubicación y horarios</li>
							<li>Si requiere registro, establece una fecha límite apropiada</li>
							<li>Relaciona el evento con cursos o posts del blog cuando sea relevante</li>
							<li>Considera marcar como destacado eventos especiales o importantes</li>
							<li>Para eventos recurrentes, revisa bien el patrón de repetición</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>