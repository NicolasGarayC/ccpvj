<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import BlogPostCard from '$lib/presentation/components/blog/BlogPostCard.svelte';
	import FeatureCard from '$lib/presentation/components/common/FeatureCard.svelte';
	import UpcomingEventsWidget from '$lib/presentation/components/calendar/UpcomingEventsWidget.svelte';
import { blogService } from '$lib/application/services/blog/blogService';
	import { materialApoyoService } from '$lib/application/services/material-apoyo/MaterialApoyoService';
	import { digitalLibraryService } from '$lib/application/services/library/DigitalLibraryService';
	import type { LibraryItemDto } from '$lib/application/services/library/DigitalLibraryService';
	import { jwtService } from '$lib/application/services/auth/JwtService.js';
	import { analyticsService } from '$lib/application/services/analytics/AnalyticsService';
import type { BlogPost } from '$lib/types/api';
import type { MaterialApoyoSummaryDto } from '$lib/types/api/materialApoyo.types';

	import { t } from '$lib/i18n';

	let currentLocale = 'es';


	function switchLocale() {
		currentLocale = currentLocale === 'es' ? 'en' : 'es';
	}

	$: isLoggedIn = jwtService.isAuthenticated();
	$: user = jwtService.getUser();
	$: isEducator = isLoggedIn && (user?.role === 'administrador' || user?.role === 'colaborador');

	let latestBlogPosts: BlogPost[] = [];
let featuredCourses: MaterialApoyoSummaryDto[] = [];
let allCourses: MaterialApoyoSummaryDto[] = [];
	let libraryItems: LibraryItemDto[] = [];
	let totalModulesCount = 0;
	let totalVisitors = 0;

	// Colores para los proyectos en la vista de grid
	const courseColors = [
		{ color: 'from-blue-400 to-purple-600', icon: 'fa-book' },
		{ color: 'from-green-400 to-blue-600', icon: 'fa-graduation-cap' },
		{ color: 'from-purple-400 to-pink-600', icon: 'fa-laptop-code' },
		{ color: 'from-orange-400 to-red-600', icon: 'fa-globe' },
		{ color: 'from-yellow-400 to-orange-600', icon: 'fa-lightbulb' },
		{ color: 'from-pink-400 to-purple-600', icon: 'fa-paint-brush' },
		{ color: 'from-indigo-400 to-purple-600', icon: 'fa-music' },
		{ color: 'from-cyan-400 to-blue-600', icon: 'fa-palette' }
	];

	// Función para dividir texto en spans animados
	function splitTextIntoAnimatedSpans(text: string) {
		return text.split('').map((char, index) => ({
			char,
			delay: index * 0.1
		}));
	}

	$: welcomeChars = splitTextIntoAnimatedSpans($t('welcome'));
	$: readyAdventureChars = splitTextIntoAnimatedSpans($t('readyForAdventure'));

	function truncateDescription(text: string, maxLength = 220): string {
		if (!text) return '';
		return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
	}

	onMount(async () => {
		try {
			latestBlogPosts = await blogService.getLatestPosts();
			allCourses = await materialApoyoService.getAllMaterialApoyo();

			const activeCourses = allCourses.filter((course) => course.isActive !== false);
			const featuredFromAll = activeCourses.filter((course) => course.isFeatured);
			const sourceCourses = featuredFromAll.length > 0 ? featuredFromAll : activeCourses;
			featuredCourses = sourceCourses.slice(0, 6);

			// Calcular total de módulos
			totalModulesCount = allCourses.reduce((sum, course) => sum + (course.moduleCount || 0), 0);

			// Cargar items de la biblioteca para la sección Educational Materials
			try {
				const libraryResult = await digitalLibraryService.getItems({ pageSize: 4, page: 1 });
				libraryItems = libraryResult.items || [];
			} catch (err) {
				console.error('Error cargando biblioteca:', err);
				libraryItems = [];
			}

			// Cargar estadísticas de visitantes (el endpoint ahora es público)
			try {
				const analytics = await analyticsService.getSummary();
				totalVisitors = analytics.totalVisitors;
			} catch (err) {
				console.error('Error cargando analytics:', err);
				totalVisitors = 0;
			}
		} catch (error) {
			console.error('Error cargando datos iniciales:', error);
		}
	});
</script>

<svelte:head>
	<title>{$t('centroTitle') || 'Centro Cultural Popular Víctor Jara'}</title>
	<meta name="description" content={$t('centroDescription') || 'Centro Cultural Popular Víctor Jara - Red Comunitaria de Aprendizaje'} />
</svelte:head>

<!-- Hero Section Juvenil -->
<section class="relative min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 text-white overflow-hidden">
	<!-- Elementos decorativos animados -->
	<div class="absolute inset-0">
		<!-- Burbujas flotantes -->
		<div class="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-bounce" style="animation-delay: 0s;"></div>
		<div class="absolute top-40 right-20 w-16 h-16 bg-yellow-300/20 rounded-full animate-bounce" style="animation-delay: 1s;"></div>
		<div class="absolute top-60 left-1/4 w-12 h-12 bg-green-300/15 rounded-full animate-bounce" style="animation-delay: 2s;"></div>
		<div class="absolute bottom-40 right-1/3 w-24 h-24 bg-blue-300/10 rounded-full animate-bounce" style="animation-delay: 1.5s;"></div>

		<!-- Formas geométricas -->
		<div class="absolute top-32 right-10 w-8 h-8 bg-white/20 transform rotate-45 animate-spin" style="animation-duration: 8s;"></div>
		<div class="absolute bottom-32 left-16 w-6 h-6 bg-yellow-300/30 transform rotate-45 animate-spin" style="animation-duration: 6s;"></div>
	</div>

	<div class="relative container mx-auto flex flex-col items-center justify-center px-4 py-20 text-center min-h-screen">
		<!-- Logo animado -->
		<div class="mb-8 animate-pulse">
			<div class="w-24 h-24 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center text-4xl">
				🎨
			</div>
		</div>

		<!-- Título principal con animación -->
		<h1 class="mb-6 text-4xl sm:text-6xl lg:text-7xl font-bold animate-fade-in-up">
			{#each welcomeChars as {char, delay}}
				<span class="inline-block animate-bounce" style="animation-delay: {delay}s;">{char}</span>
			{/each}
			<span class="text-5xl animate-spin inline-block ml-2" style="animation-duration: 3s;">🎉</span>
		</h1>

		<p class="mx-auto mb-8 max-w-2xl text-xl md:text-2xl text-pink-100 animate-fade-in-up" style="animation-delay: 0.5s;">
			{$t('centroPurpose')}
		</p>

		<!-- Botones de acción juveniles -->
		<div class="mt-8 flex flex-wrap justify-center gap-4 animate-fade-in-up" style="animation-delay: 0.8s;">
			{#if !isLoggedIn}
				<a href="/material-apoyo" class="group relative overflow-hidden rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-8 py-4 font-bold text-purple-900 shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-yellow-300/50">
					<span class="relative z-10 flex items-center gap-2">
						{$t('startLearning')}
					</span>
					<div class="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
				</a>
				<a href="/auth/login" class="group relative overflow-hidden rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 px-8 py-4 font-bold text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-white/30">
					<span class="flex items-center gap-2">
						{$t('educatorLogin')}
					</span>
				</a>
			{:else if isEducator}
				<a href="/dashboard" class="group relative overflow-hidden rounded-full bg-gradient-to-r from-green-400 to-blue-500 px-8 py-4 font-bold text-white shadow-2xl transition-all duration-300 hover:scale-110">
					<span class="relative z-10 flex items-center gap-2">
						📊 {$t('educatorDashboard')}
					</span>
				</a>
				<a href="/editor" class="group relative overflow-hidden rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 px-8 py-4 font-bold text-white shadow-2xl transition-all duration-300 hover:scale-110">
					<span class="flex items-center gap-2">
						✨ {$t('createContent')}
					</span>
				</a>
			{:else}
				<a href="/material-apoyo" class="group relative overflow-hidden rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-4 font-bold text-white shadow-2xl transition-all duration-300 hover:scale-110">
					<span class="relative z-10 flex items-center gap-2">
						🎒 {$t('myMaterials')}
					</span>
				</a>
				<a href="/library" class="group relative overflow-hidden rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 px-8 py-4 font-bold text-white shadow-2xl transition-all duration-300 hover:scale-110">
					<span class="flex items-center gap-2">
						📖 {$t('exploreLibrary')}
					</span>
				</a>
			{/if}
		</div>

		<!-- Estadísticas juveniles con iconos grandes -->
		<div class="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8 animate-fade-in-up" style="animation-delay: 1s;">
			<div class="group text-center transition-transform duration-300 hover:scale-110">
				<div class="text-6xl mb-2 animate-pulse">📚</div>
				<div class="text-3xl font-bold mb-1">{allCourses.length || 0}</div>
				<div class="text-pink-100 text-sm">{$t('availableCourses')}</div>
			</div>
			<div class="group text-center transition-transform duration-300 hover:scale-110">
				<div class="text-6xl mb-2 animate-pulse" style="animation-delay: 0.5s;">📝</div>
				<div class="text-3xl font-bold mb-1">{totalModulesCount || 0}</div>
				<div class="text-pink-100 text-sm">{$t('totalModules')}</div>
			</div>
			<div class="group text-center transition-transform duration-300 hover:scale-110">
				<div class="text-6xl mb-2 animate-pulse" style="animation-delay: 1s;">📰</div>
				<div class="text-3xl font-bold mb-1">{latestBlogPosts.length || 0}</div>
				<div class="text-pink-100 text-sm">{$t('recentNews')}</div>
			</div>
			<div class="group text-center transition-transform duration-300 hover:scale-110">
				<div class="text-6xl mb-2 animate-pulse" style="animation-delay: 1.5s;">👥</div>
				<div class="text-3xl font-bold mb-1">{totalVisitors || 0}</div>
				<div class="text-pink-100 text-sm">{$t('uniqueVisitors')}</div>
			</div>
		</div>
	</div>

	<!-- Wave decorativo -->
	<div class="absolute bottom-0 left-0 w-full overflow-hidden">
		<svg viewBox="0 0 1200 120" preserveAspectRatio="none" class="w-full h-20">
			<path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" class="fill-white"></path>
			<path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" class="fill-white"></path>
			<path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" class="fill-white"></path>
		</svg>
	</div>
</section>

<!-- Sección de Noticias Juvenil -->
<section class="bg-gradient-to-b from-white via-blue-50 to-purple-50 py-20">
	<div class="container mx-auto px-4">
		<!-- Encabezado con diseño juvenil -->
		<div class="mb-16 text-center relative">
			<!-- Decoraciones -->
			<div class="absolute top-0 left-1/4 w-8 h-8 bg-yellow-300 rounded-full animate-bounce"></div>
			<div class="absolute top-4 right-1/4 w-6 h-6 bg-pink-300 rounded-full animate-bounce" style="animation-delay: 0.5s;"></div>

			<div class="inline-block mb-4 text-6xl animate-pulse">📰</div>
			<h2 class="mb-6 text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
				{$t('latestNews')}
			</h2>
			<div class="mx-auto h-2 w-32 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 mb-4"></div>
			<p class="mx-auto max-w-2xl text-lg text-gray-600 font-medium">
				{$t('stayUpdated')}
			</p>
		</div>

		<!-- Grid de noticias con efectos juveniles -->
		<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3 {latestBlogPosts.length === 1 ? 'justify-center' : ''}">
			{#if latestBlogPosts.length > 0}
				{#each latestBlogPosts as post, index}
					<div class="group relative w-full max-w-md mx-auto transform transition-all duration-500 hover:-translate-y-4 hover:rotate-1" style="animation-delay: {index * 0.1}s;">
						<!-- Sombra de color -->
						<div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400 to-pink-400 opacity-20 blur-lg group-hover:opacity-40 transition-opacity duration-300"></div>

						<!-- Tarjeta -->
						<div class="relative bg-white rounded-2xl overflow-hidden shadow-xl border-4 border-transparent group-hover:border-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400">
							<BlogPostCard {post} />
						</div>

						<!-- Decoración flotante -->
						<div class="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-bounce">
							✨
						</div>
					</div>
				{/each}
			{:else}
				<div class="col-span-full">
					<div class="text-center py-20 rounded-3xl bg-gradient-to-br from-purple-100 to-pink-100 border-4 border-dashed border-purple-300">
						<div class="text-8xl mb-6 animate-bounce">🎪</div>
						<h3 class="text-2xl font-bold text-purple-800 mb-4">
							{$t('noBlogPostsYet')}
						</h3>
						<p class="text-purple-600 max-w-md mx-auto">
							{$t('noBlogPostsMessage')}
						</p>

						<!-- Elementos decorativos -->
						<div class="mt-8 flex justify-center gap-4">
							<div class="w-4 h-4 bg-purple-400 rounded-full animate-pulse"></div>
							<div class="w-4 h-4 bg-pink-400 rounded-full animate-pulse" style="animation-delay: 0.5s;"></div>
							<div class="w-4 h-4 bg-yellow-400 rounded-full animate-pulse" style="animation-delay: 1s;"></div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Botón de ver todas las noticias -->
		<div class="mt-16 text-center">
			<a href="/blog" class="group relative inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-purple-300/50">
				<span class="relative z-10">{$t('viewAllNews')}</span>
				<div class="text-2xl animate-bounce group-hover:translate-x-1 transition-transform duration-300">👀</div>

				<!-- Efecto de onda en hover -->
				<div class="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
			</a>
		</div>
	</div>
</section>

<!-- Sección de Eventos Geniales -->
<section class="py-20 bg-gradient-to-b from-orange-50 via-yellow-50 to-orange-100">
	<div class="container mx-auto px-4">
		<!-- Encabezado juvenil -->
		<div class="text-center mb-16 relative">
			<!-- Decoraciones -->
			<div class="absolute top-0 left-1/3 text-4xl animate-bounce">🎪</div>
			<div class="absolute top-8 right-1/3 text-3xl animate-bounce" style="animation-delay: 1s;">🎉</div>

			<div class="inline-block mb-4 text-7xl animate-pulse">📅</div>
			<h2 class="mb-6 text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
				{$t('upcomingEvents')}
			</h2>
			<div class="mx-auto h-2 w-40 rounded-full bg-gradient-to-r from-orange-400 to-red-400 mb-4"></div>
			<p class="mx-auto max-w-2xl text-lg text-gray-700 font-medium">
				{$t('upcomingEventsMessage')}
			</p>
		</div>

		<!-- Widget de eventos mejorado -->
		<div class="max-w-6xl mx-auto">
			<div class="relative p-8 rounded-3xl bg-white shadow-2xl border-4 border-orange-200 overflow-hidden">
				<!-- Elementos decorativos -->
				<div class="absolute top-4 right-4 w-12 h-12 bg-yellow-300 rounded-full flex items-center justify-center text-2xl animate-spin" style="animation-duration: 4s;">
					⭐
				</div>
				<div class="absolute bottom-4 left-4 w-10 h-10 bg-orange-300 rounded-full flex items-center justify-center text-xl animate-bounce">
					🎯
				</div>

				<UpcomingEventsWidget limit={5} />
			</div>
		</div>

		<!-- Botón para ver calendario completo -->
		<div class="mt-12 text-center">
			<a href="/calendar" class="group relative inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-orange-300/50">
				<span class="relative z-10">{$t('viewCalendar')}</span>
				<div class="text-2xl animate-bounce group-hover:rotate-12 transition-transform duration-300">📅</div>

				<!-- Efecto de resplandor -->
				<div class="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
			</a>
		</div>
	</div>
</section>

<!-- Materiales Educativos Súper Cool -->
<section class="py-20 bg-gradient-to-b from-green-50 via-cyan-50 to-blue-50">
	<div class="container mx-auto px-4">
		<!-- Encabezado épico -->
		<div class="text-center mb-20 relative">
			<!-- Elementos flotantes -->
			<div class="absolute top-0 left-1/4 text-5xl animate-bounce">🎒</div>
			<div class="absolute top-4 right-1/4 text-4xl animate-bounce" style="animation-delay: 1.5s;">📚</div>
			<div class="absolute top-8 left-1/2 transform -translate-x-1/2 text-3xl animate-bounce" style="animation-delay: 0.8s;">✨</div>

			<div class="inline-block mb-6 text-8xl animate-pulse">🌟</div>
			<h2 class="mb-6 text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
				{$t('educationalMaterials')}
			</h2>
			<div class="mx-auto h-3 w-48 rounded-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 mb-6"></div>
			<p class="mx-auto max-w-3xl text-xl text-gray-700 font-medium leading-relaxed">
				{$t('accessCourseMaterials')}
			</p>
		</div>

		<!-- Grid de materiales de biblioteca súper cool -->
		<div class="grid gap-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 {libraryItems.length === 1 ? 'justify-center' : ''}">
			{#if libraryItems.length > 0}
				{#each libraryItems.slice(0, 4) as item, index}
					{@const colorScheme = courseColors[index % courseColors.length]}
					<div class="group relative w-full max-w-xs mx-auto transform transition-all duration-500 hover:-translate-y-6 hover:rotate-3 hover:scale-105"
						 style="animation-delay: {index * 0.2}s;">

						<!-- Sombra colorida -->
						<div class="absolute inset-0 rounded-3xl bg-gradient-to-r {colorScheme.color} opacity-20 blur-xl group-hover:opacity-40 group-hover:scale-110 transition-all duration-500"></div>

						<!-- Tarjeta principal -->
						<div class="relative bg-white rounded-3xl p-6 shadow-2xl border-4 border-transparent group-hover:border-white overflow-hidden">

							<!-- Background gradient -->
							<div class="absolute inset-0 bg-gradient-to-br {colorScheme.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>

							<!-- Contenido -->
							<div class="relative z-10">
								<!-- Icono grande central -->
								<div class="text-center mb-6">
									<div class="inline-block w-20 h-20 rounded-full bg-gradient-to-r {colorScheme.color} flex items-center justify-center text-3xl text-white shadow-lg transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
										{digitalLibraryService.getFileTypeIcon(item.fileType)}
									</div>
								</div>

								<!-- Título -->
								<h3 class="text-xl font-bold text-center mb-3 text-gray-800 group-hover:text-gray-900 transition-colors line-clamp-2">
									{item.title}
								</h3>

								<!-- Descripción genial -->
								<div class="text-center mb-6">
									<div class="inline-block bg-gradient-to-r {colorScheme.color} text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
										{digitalLibraryService.formatFileSize(item.fileSize)}
									</div>
								</div>

								<!-- Botón de acceso épico -->
								<div class="text-center">
									<a href={`/library/${item.id}`}
									   class="group/btn relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r {colorScheme.color} text-white font-bold text-sm rounded-full shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-xl">
										<span class="relative z-10">{$t('viewResource') || 'Ver Recurso'}</span>
										<div class="text-lg animate-bounce group-hover/btn:translate-x-1 transition-transform duration-300">🎯</div>
									</a>
								</div>
							</div>

							<!-- Decoraciones flotantes -->
							<div class="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 animate-spin">
								⭐
							</div>
							<div class="absolute -bottom-2 -left-2 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse">
								💎
							</div>
						</div>

						<!-- Número de orden divertido -->
						<div class="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg animate-bounce z-20">
							{index + 1}
						</div>
					</div>
				{/each}
			{:else}
				<div class="col-span-full text-center py-20 rounded-3xl bg-gradient-to-br from-purple-100 to-pink-100 border-4 border-dashed border-purple-300">
					<div class="text-8xl mb-6 animate-bounce">📚</div>
					<h3 class="text-2xl font-bold text-purple-800 mb-4">
						{$t('noLibraryItemsYet') || 'No hay recursos todavía'}
					</h3>
					<p class="text-purple-600 max-w-md mx-auto">
						{$t('noLibraryItemsMessage') || 'Pronto agregaremos recursos educativos a la biblioteca'}
					</p>
				</div>
			{/if}
		</div>

		<!-- Sección de Quick Actions -->
		<div class="mt-20">
			<h3 class="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
				{$t('quickActions')} ⚡
			</h3>

			<div class="flex flex-wrap justify-center gap-4">
				<a href="/material-apoyo" class="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-full shadow-xl transform transition-all duration-300 hover:scale-110">
					<span class="relative z-10">🚀 {$t('exploreAllProjects')}</span>
					<div class="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
				</a>

				<a href="/library" class="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-bold rounded-full shadow-xl transform transition-all duration-300 hover:scale-110">
					<span class="relative z-10">📖 {$t('viewLibrary')}</span>
					<div class="absolute inset-0 bg-gradient-to-r from-cyan-500 to-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
				</a>
			</div>
		</div>
	</div>
</section>

<!-- Proyectos Más Populares - Súper Geniales -->
<section class="py-20 bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50">
	<div class="container mx-auto px-4">
		<!-- Encabezado estrella -->
		<div class="text-center mb-20 relative">
			<!-- Decoraciones estelares -->
			<div class="absolute top-2 left-1/4 text-4xl animate-spin" style="animation-duration: 8s;">⭐</div>
			<div class="absolute top-6 right-1/4 text-5xl animate-bounce">🏆</div>
			<div class="absolute top-12 left-1/2 transform -translate-x-1/2 text-3xl animate-pulse">🔥</div>

			<div class="inline-block mb-6 text-9xl animate-bounce">🌟</div>
			<h2 class="mb-6 text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
				{$t('featuredCourses')}
			</h2>
			<div class="mx-auto h-3 w-56 rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-6"></div>
			<p class="mx-auto max-w-3xl text-xl text-gray-700 font-medium leading-relaxed">
				{$t('exploreCourseOfferings')}
			</p>
		</div>

		<!-- Proyectos destacados con diseño juvenil -->
		<div class="grid gap-10 md:grid-cols-2 lg:grid-cols-3 {featuredCourses.length === 1 ? 'justify-center' : ''}">
			{#if featuredCourses.length > 0}
				{#each featuredCourses as course, index}
					<div class="group relative w-full max-w-sm mx-auto transform transition-all duration-700 hover:-translate-y-8 hover:rotate-2 hover:scale-105"
					     style="animation-delay: {index * 0.3}s;">

						<!-- Sombra holográfica -->
						<div class="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 opacity-25 blur-2xl group-hover:opacity-50 group-hover:scale-110 transition-all duration-700"></div>

						<!-- Tarjeta principal -->
						<div class="relative bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-white">

							<!-- Header con gradiente dinámico -->
							<div class="relative h-48 bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 flex items-center justify-center overflow-hidden">
								<!-- Elementos decorativos -->
								<div class="absolute top-4 left-4 w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
								<div class="absolute top-4 right-4 w-6 h-6 bg-yellow-300/60 rounded-full animate-bounce"></div>
								<div class="absolute bottom-4 left-4 w-4 h-4 bg-green-300/50 rounded-full animate-spin"></div>
								<div class="absolute bottom-4 right-4 w-10 h-10 bg-white/10 rounded-full animate-pulse"></div>

								<!-- Letra inicial gigante y animada -->
								<div class="relative z-10 text-8xl font-black text-white/80 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
									{course.title.charAt(0)}
								</div>

								<!-- Badge "Popular" -->
								<div class="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce">
									🔥 POPULAR
								</div>
							</div>

							<!-- Contenido -->
							<div class="p-8">
								<h3 class="text-2xl font-bold mb-4 text-gray-800 group-hover:text-purple-600 transition-colors duration-300">
									{course.title}
								</h3>
									<p class="text-gray-600 mb-6 leading-relaxed">
										{truncateDescription(course.description)}
									</p>

								<!-- Estadísticas mini -->
								{#if course.moduleCount || course.educatorName}
									<div class="flex items-center gap-4 mb-6 text-sm text-gray-500">
										{#if course.moduleCount}
											<div class="flex items-center gap-1">
												<span class="text-purple-500">📚</span>
												<span>{course.moduleCount} {course.moduleCount === 1 ? $t('module') : $t('modules')}</span>
											</div>
										{/if}
										{#if course.educatorName}
											<div class="flex items-center gap-1">
												<span class="text-blue-500">👨‍🏫</span>
												<span class="truncate max-w-[150px]">{course.educatorName}</span>
											</div>
										{/if}
									</div>
								{/if}

								<!-- Botón épico -->
								<a href={`/material-apoyo/${course.id}`}
								   class="group/btn relative inline-flex items-center gap-3 w-full justify-center px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg rounded-2xl shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-300/50">
									<span class="relative z-10">{$t('exploreCourseMaterials')}</span>
									<div class="text-2xl animate-bounce group-hover/btn:translate-x-2 transition-transform duration-300">🎮</div>

									<!-- Efecto de brillo -->
									<div class="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
								</a>
							</div>

							<!-- Decoraciones flotantes -->
							<div class="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 animate-spin">
								⚡
							</div>
							<div class="absolute -bottom-3 -left-3 w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-xl opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse">
								💎
							</div>
						</div>

						<!-- Rank badge -->
						<div class="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-2xl z-20 animate-bounce">
							#{index + 1}
						</div>
					</div>
				{/each}
			{:else}
				<div class="col-span-full">
					<div class="text-center py-24 rounded-3xl bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 border-4 border-dashed border-purple-300">
						<div class="text-9xl mb-8 animate-bounce">🎪</div>
						<h3 class="text-3xl font-bold text-purple-800 mb-6">
							{$t('noCoursesYet')}
						</h3>
						<p class="text-purple-600 max-w-lg mx-auto text-lg">
							{$t('noCoursesMessage')}
						</p>

						<!-- Loading dots -->
						<div class="mt-10 flex justify-center gap-2">
							<div class="w-4 h-4 bg-purple-400 rounded-full animate-bounce"></div>
							<div class="w-4 h-4 bg-pink-400 rounded-full animate-bounce" style="animation-delay: 0.2s;"></div>
							<div class="w-4 h-4 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 0.4s;"></div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Botón para ver todos los proyectos -->
		<div class="mt-20 text-center">
			<a href="/material-apoyo" class="group relative inline-flex items-center gap-4 px-12 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xl rounded-full shadow-2xl transform transition-all duration-500 hover:scale-110 hover:shadow-indigo-300/50">
				<span class="relative z-10">{$t('viewAllCourses')}</span>
				<div class="text-3xl animate-bounce group-hover:translate-x-3 group-hover:scale-125 transition-all duration-300">🌟</div>

				<!-- Efecto de resplandor -->
				<div class="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

				<!-- Partículas flotantes -->
				<div class="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-0 group-hover:opacity-100"></div>
				<div class="absolute -bottom-2 -right-2 w-3 h-3 bg-pink-400 rounded-full animate-pulse opacity-0 group-hover:opacity-100"></div>
			</a>
		</div>
	</div>
</section>

<!-- Información del centro -->
<section class="bg-indigo-50 py-16">
	<div class="container mx-auto max-w-4xl px-4">
		<div class="mb-12 text-center">
			<h2 class="mb-3 text-3xl font-bold">{$t('aboutCenter')}</h2>
			<div class="mx-auto h-1 w-20 rounded-full bg-indigo-600"></div>
		</div>
		<div class="rounded-xl bg-white p-8 shadow-lg">
			<div class="prose prose-indigo max-w-none">
				<p class="mb-4 text-lg leading-relaxed">{$t('centerDescription1')}</p>
				<p class="mb-6 text-lg leading-relaxed">{$t('centerDescription2')}</p>
			</div>
			<div class="mt-8 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-6">
				<div class="flex items-start">
					<div class="mr-4 text-indigo-600">
						<i class="fas fa-wifi text-3xl"></i>
					</div>
					<div>
						<h3 class="mb-3 text-xl font-semibold text-indigo-800">{$t('noInternetRequired')}</h3>
						<p class="leading-relaxed text-gray-700">{$t('localNetworkExplanation')}</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- CTA Final Súper Épico -->
<section class="relative py-24 bg-gradient-to-br from-purple-900 via-pink-800 to-indigo-900 text-white overflow-hidden">
	<!-- Background animado -->
	<div class="absolute inset-0">
		<!-- Burbujas flotantes -->
		<div class="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full animate-bounce" style="animation-duration: 6s;"></div>
		<div class="absolute top-40 right-16 w-24 h-24 bg-yellow-300/10 rounded-full animate-bounce" style="animation-delay: 2s; animation-duration: 4s;"></div>
		<div class="absolute bottom-32 left-1/4 w-20 h-20 bg-pink-300/10 rounded-full animate-bounce" style="animation-delay: 1s; animation-duration: 5s;"></div>
		<div class="absolute bottom-40 right-1/3 w-28 h-28 bg-blue-300/8 rounded-full animate-bounce" style="animation-delay: 3s; animation-duration: 7s;"></div>

		<!-- Formas geométricas -->
		<div class="absolute top-1/4 right-1/4 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 transform rotate-45 animate-spin" style="animation-duration: 12s;"></div>
		<div class="absolute bottom-1/3 left-1/3 w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 transform rotate-45 animate-spin" style="animation-duration: 10s;"></div>
	</div>

	<div class="relative container mx-auto px-4 text-center">
		<!-- Encabezado épico -->
		<div class="mb-16">
			<div class="inline-block mb-8 text-8xl animate-pulse">🎯</div>
			<h2 class="mb-8 text-5xl md:text-7xl font-black animate-fade-in-up">
				{#each readyAdventureChars as {char, delay}}
					<span class="inline-block animate-bounce" style="animation-delay: {delay}s;">{char}</span>
				{/each}
				<span class="text-6xl animate-spin inline-block ml-4" style="animation-duration: 3s;">🎉</span>
			</h2>
			<p class="mx-auto max-w-3xl text-xl md:text-2xl text-purple-100 leading-relaxed animate-fade-in-up" style="animation-delay: 0.8s;">
				{$t('joinCommunityText')}
			</p>
		</div>

		<!-- Botones de acción épicos -->
		<div class="flex flex-wrap justify-center gap-8 mb-16 animate-fade-in-up" style="animation-delay: 1.2s;">
			<a href="/material-apoyo" class="group relative overflow-hidden rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-12 py-5 font-black text-xl text-purple-900 shadow-2xl transition-all duration-500 hover:scale-125 hover:shadow-yellow-300/50 transform hover:-rotate-3">
				<span class="relative z-10 flex items-center gap-3">
					<span class="text-3xl animate-bounce">🚀</span>
					{$t('exploreCourses')}
					<span class="text-2xl group-hover:translate-x-2 transition-transform duration-300">→</span>
				</span>
				<div class="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-full"></div>
			</a>

			<a href="/blog" class="group relative overflow-hidden rounded-full bg-white/10 backdrop-blur-sm border-4 border-white/30 px-12 py-5 font-black text-xl text-white shadow-2xl transition-all duration-500 hover:scale-125 hover:bg-white/20 transform hover:rotate-3">
				<span class="relative z-10 flex items-center gap-3">
					<span class="text-3xl animate-bounce">📱</span>
					{$t('readLatestNews')}
					<span class="text-2xl group-hover:translate-x-2 transition-transform duration-300">→</span>
				</span>
			</a>

			<a href="/library" class="group relative overflow-hidden rounded-full bg-gradient-to-r from-green-400 to-cyan-500 px-12 py-5 font-black text-xl text-white shadow-2xl transition-all duration-500 hover:scale-125 hover:shadow-green-300/50 transform hover:-rotate-2">
				<span class="relative z-10 flex items-center gap-3">
					<span class="text-3xl animate-bounce">📖</span>
					{$t('viewLibrary')}
					<span class="text-2xl group-hover:translate-x-2 transition-transform duration-300">→</span>
				</span>
				<div class="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-full"></div>
			</a>
		</div>

		<!-- Elementos decorativos finales -->
		<div class="flex justify-center items-center gap-8 animate-fade-in-up" style="animation-delay: 1.5s;">
			<div class="text-4xl animate-spin" style="animation-duration: 8s;">⭐</div>
			<div class="text-5xl animate-bounce">💫</div>
			<div class="text-4xl animate-pulse">✨</div>
			<div class="text-6xl animate-bounce" style="animation-delay: 0.5s;">🌟</div>
			<div class="text-4xl animate-spin" style="animation-duration: 6s;">🎊</div>
		</div>

		<!-- Mensaje final -->
		<div class="mt-12 animate-fade-in-up" style="animation-delay: 2s;">
			<p class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
				{$t('adventureStartsNow')} 🎉
			</p>
		</div>
	</div>
</section>

<style>
  /* Animaciones personalizadas juveniles */
  @keyframes fade-in-up {
    0% {
      opacity: 0;
      transform: translateY(30px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
  }

  @keyframes wiggle {
    0%, 100% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(3deg);
    }
    75% {
      transform: rotate(-3deg);
    }
  }

  @keyframes rainbow {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
  }

  @keyframes glow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(147, 51, 234, 0.5);
    }
    50% {
      box-shadow: 0 0 40px rgba(147, 51, 234, 0.8), 0 0 60px rgba(147, 51, 234, 0.4);
    }
  }

  /* Clases de animación */
  .animate-fade-in-up {
    animation: fade-in-up 0.8s ease-out forwards;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-wiggle {
    animation: wiggle 1s ease-in-out infinite;
  }

  .animate-rainbow {
    animation: rainbow 3s linear infinite;
  }

  .animate-glow {
    animation: glow 2s ease-in-out infinite alternate;
  }

  /* Mejoras de hover para elementos juveniles */
  .group:hover .group-hover\:rainbow {
    animation: rainbow 0.5s linear infinite;
  }

  .group:hover .group-hover\:glow {
    animation: glow 1s ease-in-out infinite alternate;
  }

  /* Efectos de glassmorphism para elementos flotantes */
  .glass-effect {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  /* Efectos de neón */
  .neon-text {
    text-shadow:
      0 0 5px currentColor,
      0 0 10px currentColor,
      0 0 15px currentColor,
      0 0 20px currentColor;
  }

  /* Responsive improvements */
  @media (max-width: 768px) {
    .animate-bounce {
      animation-duration: 1s;
    }

    /* Reducir animaciones en móviles para mejor performance */
    .group:hover .group-hover\:scale-110 {
      transform: scale(1.05);
    }

    .hover\:scale-125:hover {
      transform: scale(1.1);
    }
  }

  /* Custom scrollbar para mejor UX juvenil */
  :global(::-webkit-scrollbar) {
    width: 12px;
  }

  :global(::-webkit-scrollbar-track) {
    background: linear-gradient(to bottom, #e5e7eb, #f3f4f6);
    border-radius: 10px;
  }

  :global(::-webkit-scrollbar-thumb) {
    background: linear-gradient(to bottom, #8b5cf6, #ec4899);
    border-radius: 10px;
    border: 2px solid #f3f4f6;
  }

  :global(::-webkit-scrollbar-thumb:hover) {
    background: linear-gradient(to bottom, #7c3aed, #db2777);
  }

  /* Mejoras de accesibilidad */
  @media (prefers-reduced-motion: reduce) {
    .animate-bounce,
    .animate-pulse,
    .animate-spin,
    .animate-fade-in-up,
    .animate-float,
    .animate-wiggle,
    .animate-rainbow {
      animation: none;
    }
  }
</style>
