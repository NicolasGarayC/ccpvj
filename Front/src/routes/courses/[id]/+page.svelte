<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { courseService, type CourseDetail } from '$lib/services/courseService';
	import { authService } from '$lib/services/authService';
	import ModuleList from '$lib/components/course/ModuleList.svelte';

	let course: CourseDetail | null = null;
	let loading = true;
	let error = '';
	let isAuthenticated = false;
	let canManage = false;
	let user = null;

	const courseId = $page.params.id;

	onMount(async () => {
		// Check authentication
		isAuthenticated = authService.isAuthenticated();
		if (isAuthenticated) {
			user = authService.getUser();
			canManage = user?.role === 'colaborador' || user?.role === 'administrador';
		}

		// Load course details
		await loadCourse();
	});

	async function loadCourse() {
		try {
			loading = true;
			error = '';
			course = await courseService.getCourse(courseId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error cargando el curso';
			console.error('Error loading course:', err);
		} finally {
			loading = false;
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function handleEditCourse() {
		goto(`/courses/${courseId}/edit`);
	}

	function handleBackToCourses() {
		goto('/courses');
	}
</script>

<svelte:head>
	<title>{course?.title || 'Curso'} - Centro Cultural Víctor Jara</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
	{#if loading}
		<!-- Loading State -->
		<div class="container mx-auto px-4 py-8 max-w-6xl">
			<div class="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-16">
				<div class="text-center">
					<div class="relative inline-block mb-8">
						<div class="w-20 h-20 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
						<div class="absolute inset-0 w-20 h-20 border-4 border-transparent border-l-teal-500 rounded-full animate-spin" style="animation-direction: reverse; animation-duration: 1.5s;"></div>
						<div class="absolute inset-0 flex items-center justify-center">
							<span class="text-2xl animate-pulse">📚</span>
						</div>
					</div>
					<h3 class="text-2xl font-bold text-gray-800 mb-4">Cargando curso...</h3>
					<p class="text-gray-600">Obteniendo todos los detalles del curso</p>
				</div>
			</div>
		</div>

	{:else if error}
		<!-- Error State -->
		<div class="container mx-auto px-4 py-8 max-w-6xl">
			<div class="bg-white rounded-3xl shadow-xl border-2 border-red-200 p-16">
				<div class="text-center">
					<div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8">
						<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-600">
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="15" y1="9" x2="9" y2="15"></line>
							<line x1="9" y1="9" x2="15" y2="15"></line>
						</svg>
					</div>
					<h3 class="text-2xl font-bold text-red-800 mb-6">😔 No pudimos cargar el curso</h3>
					<p class="text-red-600 mb-8 text-lg">{error}</p>
					<div class="flex gap-4 justify-center flex-wrap">
						<button
							class="px-8 py-4 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1"
							on:click={loadCourse}
						>
							🔄 Reintentar
						</button>
						<button
							class="px-8 py-4 bg-gray-200 text-gray-700 rounded-2xl hover:bg-gray-300 transition-all duration-300 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1"
							on:click={handleBackToCourses}
						>
							← Volver a cursos
						</button>
					</div>
				</div>
			</div>
		</div>

	{:else if course}
		<!-- Course Detail Content -->
		<div class="container mx-auto px-4 py-8 max-w-6xl">

			<!-- Navigation Breadcrumb -->
			<div class="mb-6">
				<nav class="flex items-center space-x-2 text-sm">
					<button
						on:click={handleBackToCourses}
						class="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
					>
						🏠 Cursos
					</button>
					<span class="text-gray-400">/</span>
					<span class="text-gray-600 font-medium">{course.title}</span>
				</nav>
			</div>

			<!-- Course Header -->
			<div class="bg-gradient-to-br from-white/90 to-emerald-50/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-emerald-100 overflow-hidden mb-8">
				<div class="relative">
					{#if course.imagePath}
						<div class="h-80 overflow-hidden">
							<img
								src={course.imagePath}
								alt={course.title}
								class="w-full h-full object-cover"
							/>
							<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
						</div>
					{:else}
						<div class="h-80 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 relative overflow-hidden">
							<!-- Elementos decorativos -->
							<div class="absolute top-8 right-8 w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
							<div class="absolute bottom-12 left-12 w-12 h-12 bg-white/15 rounded-full animate-pulse" style="animation-delay: 1s;"></div>
							<div class="absolute top-20 left-1/3 w-8 h-8 bg-white/10 rounded-full animate-pulse" style="animation-delay: 2s;"></div>

							<div class="absolute inset-0 flex items-center justify-center">
								<div class="text-center text-white">
									<div class="w-24 h-24 bg-white/20 rounded-3xl backdrop-blur-sm flex items-center justify-center mb-4 mx-auto">
										<span class="text-5xl">🎓</span>
									</div>
									<div class="text-6xl font-black tracking-wider drop-shadow-lg">
										{course.title.substring(0, 2).toUpperCase()}
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Course Status Badges -->
					<div class="absolute top-6 right-6 flex gap-2">
						{#if course.isFeatured}
							<div class="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-xl border-2 border-white/50">
								<span class="flex items-center gap-1">
									<span>⭐</span>
									Destacado
								</span>
							</div>
						{/if}

						<div class="bg-white/90 backdrop-blur-sm text-emerald-700 px-4 py-2 rounded-2xl text-sm font-bold shadow-lg border border-emerald-200">
							<span class="flex items-center gap-1">
								<span>📚</span>
								{course.moduleCount || 0} módulos
							</span>
						</div>
					</div>

					<!-- Course Title and Info Overlay -->
					<div class="absolute bottom-0 left-0 right-0 p-8 text-white">
						<div class="mb-4">
							<h1 class="text-4xl md:text-5xl font-black mb-4 leading-tight drop-shadow-lg">
								{course.title}
							</h1>
							<div class="flex flex-wrap gap-3 mb-4">
								<span class="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-2xl text-sm font-bold border border-white/30">
									📖 {course.subject}
								</span>
								<span class="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-2xl text-sm font-bold border border-white/30">
									👨‍🏫 {course.educatorName || 'Instructor'}
								</span>
								<span class="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-2xl text-sm font-bold border border-white/30">
									📅 {formatDate(course.createdAt)}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Course Content -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

				<!-- Main Content -->
				<div class="lg:col-span-2 space-y-8">

					<!-- Description Section -->
					<div class="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-8">
						<h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
							<span class="text-3xl">📝</span>
							Descripción del Curso
						</h2>
						<div class="prose prose-lg max-w-none">
							<p class="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">{course.description}</p>
						</div>
					</div>

					<!-- Modules Section -->
					<div class="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 overflow-hidden">
						<div class="p-8 pb-0">
							<h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
								<span class="text-3xl">📚</span>
								Contenido del Curso
							</h2>
						</div>

						<div class="px-8 pb-8">
							<ModuleList
								courseId={course.id}
								showActions={canManage}
								on:createModule={(e) => console.log('Create module:', e.detail)}
								on:editModule={(e) => console.log('Edit module:', e.detail)}
								on:deleteModule={(e) => console.log('Delete module:', e.detail)}
								on:viewModule={(e) => console.log('View module:', e.detail)}
							/>
						</div>
					</div>
				</div>

				<!-- Sidebar -->
				<div class="space-y-6">

					<!-- Course Actions -->
					{#if canManage}
						<div class="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-6">
							<h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
								<span class="text-2xl">⚙️</span>
								Gestión del Curso
							</h3>
							<div class="space-y-3">
								<button
									on:click={handleEditCourse}
									class="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
								>
									<span class="text-xl">✏️</span>
									Editar Curso
								</button>

								<button
									class="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 rounded-2xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
								>
									<span class="text-xl">📊</span>
									Estadísticas
								</button>
							</div>
						</div>
					{/if}

					<!-- Course Info -->
					<div class="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-6">
						<h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
							<span class="text-2xl">ℹ️</span>
							Información del Curso
						</h3>
						<div class="space-y-4">
							<div class="flex justify-between items-center py-3 border-b border-gray-100">
								<span class="text-gray-600 font-medium">Estado:</span>
								<span class="px-3 py-1 rounded-full text-sm font-bold {course.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">
									{course.isActive ? '✅ Activo' : '⏸️ Inactivo'}
								</span>
							</div>

							<div class="flex justify-between items-center py-3 border-b border-gray-100">
								<span class="text-gray-600 font-medium">Materia:</span>
								<span class="font-bold text-emerald-600">{course.subject}</span>
							</div>

							<div class="flex justify-between items-center py-3 border-b border-gray-100">
								<span class="text-gray-600 font-medium">Educador:</span>
								<span class="font-bold text-purple-600">{course.educatorName || 'No asignado'}</span>
							</div>

							<div class="flex justify-between items-center py-3 border-b border-gray-100">
								<span class="text-gray-600 font-medium">Módulos:</span>
								<span class="font-bold text-blue-600">{course.moduleCount || 0}</span>
							</div>

							<div class="flex justify-between items-center py-3">
								<span class="text-gray-600 font-medium">Contenidos:</span>
								<span class="font-bold text-indigo-600">{course.workItemCount || 0}</span>
							</div>
						</div>
					</div>

					<!-- Quick Navigation -->
					<div class="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-6">
						<h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
							<span class="text-2xl">🧭</span>
							Navegación
						</h3>
						<div class="space-y-3">
							<button
								on:click={handleBackToCourses}
								class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-2xl transition-all duration-300 font-medium hover:shadow-lg hover:-translate-y-1 flex items-center gap-2"
							>
								<span>←</span>
								Volver a Cursos
							</button>

							<button
								class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-2xl transition-all duration-300 font-medium hover:shadow-lg hover:-translate-y-1 flex items-center gap-2"
							>
								<span>🏠</span>
								Ir al Dashboard
							</button>
						</div>
					</div>

				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.prose p {
		margin-bottom: 1rem;
		line-height: 1.7;
	}

	@media (max-width: 768px) {
		.container {
			padding-left: 1rem;
			padding-right: 1rem;
		}

		.grid.lg\\:grid-cols-3 {
			grid-template-columns: 1fr;
		}

		h1 {
			font-size: 2rem !important;
		}
	}
</style>