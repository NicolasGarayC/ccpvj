<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import EventForm from '$lib/components/calendar/EventForm.svelte';
	import { calendarService, type CreateEventData } from '$lib/services/calendar/calendarService';
	import { jwtService } from '$lib/services/auth/jwtService.js';
	import { blogService } from '$lib/services/blog/blogService';
	import { materialApoyoService } from '$lib/services/materialApoyoService';
	import { t, translate, type MessageKey } from '$lib/i18n';

	const translateKey = (key: MessageKey, fallback: string): string => {
		const value = translate(key);
		return value && value !== key ? value : fallback;
	};

	let loading = false;
	let error = '';
	let availableProjects: Array<{ id: string; title: string }> = [];
	let availableBlogPosts: Array<{ id: string; title: string; slug: string }> = [];
	let initialDate: Date | null = null;

	onMount(async () => {
		// ✅ Verificar autenticación
		if (!jwtService.isAuthenticated()) {
			goto('/auth/login?redirect=/calendar/create');
			return;
		}

		const user = jwtService.getUser();
		const canCreate = user?.role === 'colaborador' || user?.role === 'administrador';

		if (!canCreate) {
			goto('/calendar');
			return;
		}

		// Leer fecha inicial desde URL si se proporciona
		const dateParam = $page.url.searchParams.get('date');
		if (dateParam) {
			try {
				const parsedDate = new Date(dateParam);
				if (!isNaN(parsedDate.getTime())) {
					initialDate = parsedDate;
				}
			} catch (e) {
				console.warn('Invalid date parameter:', dateParam);
			}
		}

		// Cargar proyectos y posts de blog disponibles
		await loadRelatedContent();
	});

	async function loadRelatedContent() {
		try {
			// Cargar proyectos (material de apoyo) disponibles
			const projects = await materialApoyoService.getAllMaterialApoyo();
			availableProjects = projects.map(project => ({
				id: project.id,
				title: project.title
			}));

			// Cargar blog posts publicados
			const posts = await blogService.getAllPosts();
			availableBlogPosts = posts
				.filter(post => post.status === 'published')
				.map(post => ({
					id: String(post.id),
					title: post.title,
					slug: post.slug
				}));
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

			// Detectar error 401 (sesión expirada)
			if (err instanceof Error && (err.message.includes('401') || err.message.includes('Unauthorized'))) {
				// Limpiar token expirado
				jwtService.removeToken();
				// Redirigir al login con mensaje
				goto('/auth/login?redirect=/calendar/create&message=session-expired');
				return;
			}

			error = err instanceof Error ? err.message : translateKey('calendar.create.error_generic', 'Error al crear el evento');
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		goto('/calendar');
	}
</script>

<svelte:head>
	<title>{$t('calendar.form.create_title') || 'Crear Nuevo Evento'} - {$t('centroTitle') || 'Centro Cultural Víctor Jara'}</title>
	<meta name="description" content={$t('calendar.create.meta_description') || 'Crear un nuevo evento en el calendario del Centro Cultural Víctor Jara'} />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">{$t('calendar.form.create_title') || 'Crear Nuevo Evento'}</h1>
					<p class="mt-2 text-gray-600">
						{$t('calendar.form.create_subtitle') || 'Programa una nueva actividad en el calendario del centro cultural'}
					</p>
				</div>

				<!-- Breadcrumb -->
				<nav class="flex items-center space-x-2 text-sm text-gray-500">
					<a href="/calendar" class="hover:text-gray-700">{$t('calendar') || 'Calendario'}</a>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
					</svg>
					<span class="text-gray-900 font-medium">{$t('calendar.create.breadcrumb_current') || 'Crear Evento'}</span>
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
						<h3 class="text-sm font-medium text-red-800">{$t('calendar.create.error_heading') || 'Error al crear el evento'}</h3>
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
						<p class="text-gray-600">{$t('calendar.create.loading') || 'Creando evento...'}</p>
					</div>
				</div>
			{/if}

			<EventForm
				event={null}
				isEdit={false}
				{availableProjects}
				{availableBlogPosts}
				{initialDate}
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
					<h3 class="text-sm font-medium text-blue-800">{$t('calendar.create.tips_title') || 'Consejos para crear un evento exitoso'}</h3>
					<div class="mt-2 text-sm text-blue-700">
						<ul class="list-disc list-inside space-y-1">
							<li>{$t('calendar.create.tip_1') || 'Usa un título descriptivo y atractivo que capture la atención'}</li>
							<li>{$t('calendar.create.tip_2') || 'Incluye una descripción detallada del contenido y objetivos'}</li>
							<li>{$t('calendar.create.tip_3') || 'Especifica claramente la ubicación y horarios'}</li>
							<li>{$t('calendar.create.tip_4') || 'Si requiere registro, establece una fecha límite apropiada'}</li>
							<li>{$t('calendar.create.tip_5') || 'Relaciona el evento con proyectos o posts del blog cuando sea relevante'}</li>
							<li>{$t('calendar.create.tip_6') || 'Considera marcar como destacado eventos especiales o importantes'}</li>
							<li>{$t('calendar.create.tip_7') || 'Para eventos recurrentes, revisa bien el patrón de repetición'}</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
