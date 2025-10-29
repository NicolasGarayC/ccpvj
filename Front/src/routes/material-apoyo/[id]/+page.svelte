<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { materialApoyoService } from '$lib/application/services/material-apoyo/MaterialApoyoService';
	import type { MaterialApoyoDetailDto, UpdateMaterialApoyoDto, ModuleSummaryDto } from '$lib/types/api/materialApoyo.types';
	import type { UploadResult } from '$lib/application/services/upload/ContextualUploadService';
	import { jwtService } from '$lib/application/services/auth/JwtService.js';
	import ModuleList from '$lib/presentation/components/course/ModuleList.svelte';
	import ContextualMediaUploader from '$lib/presentation/components/upload/ContextualMediaUploader.svelte';
	import ModuleForm from '$lib/presentation/components/course/ModuleForm.svelte';

	let course: MaterialApoyoDetailDto | null = null;
	let loading = true;
	let error = '';
	let isAuthenticated = false;
	let canManage = false;
	let user = null;

	// Edit mode state
	let editMode = false;
	let saving = false;

	// Form data for editing
	let editForm = {
		title: '',
		description: '',
		isFeatured: false,
		imagePath: '',
		educatorName: ''
	};

	// Form errors
	let formErrors: Record<string, string> = {};

	// Module management state
	let showModuleForm = false;
	let editingModule: ModuleSummaryDto | null = null;
	let moduleFormLoading = false;

const materialApoyoId = $page.params.id as string;
let actualMaterialApoyoId = materialApoyoId; // ID real del material de apoyo para operaciones

	// Function to update authentication state (same as layout)
	async function updateAuthState() {
		// Verificar el token JWT
		isAuthenticated = jwtService.isAuthenticated();
		user = jwtService.getUser();

		// Si hay token pero no usuario, intentar validarlo con el servidor
		if (isAuthenticated && !user) {
			const validatedUser = await jwtService.validateToken();
			if (validatedUser) {
				user = validatedUser;
			} else {
				isAuthenticated = false;
			}
		}

		// Set canManage using the service method
		canManage = isAuthenticated && jwtService.canManageContent();
	}

	onMount(async () => {
		// Update authentication state
		await updateAuthState();

		// Load course details
		await loadCourse();

	});

	async function loadCourse() {
		try {
			loading = true;
			error = '';
			course = await materialApoyoService.getMaterialApoyoById(materialApoyoId);

			// Update actualMaterialApoyoId with the real ID from the loaded course
			if (course) {
				actualMaterialApoyoId = course.id;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error cargando el material de apoyo';
			console.error('Error loading material de apoyo:', err);
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


	function handleBackToCourses() {
		goto('/material-apoyo');
	}

	function enableEditMode() {
		if (!course) return;

		editForm = {
			title: course.title,
			description: course.description,
			isFeatured: course.isFeatured || false,
			imagePath: course.imagePath || '',
			educatorName: course.educatorName || ''
		};

		formErrors = {};
		editMode = true;
	}

	function cancelEdit() {
		editMode = false;
		formErrors = {};
		error = '';
	}

	function validateForm(): boolean {
		formErrors = {};
		let isValid = true;

		if (!editForm.title.trim()) {
			formErrors.title = 'El título es requerido';
			isValid = false;
		} else if (editForm.title.length < 3) {
			formErrors.title = 'El título debe tener al menos 3 caracteres';
			isValid = false;
		} else if (editForm.title.length > 200) {
			formErrors.title = 'El título no puede exceder 200 caracteres';
			isValid = false;
		}

		if (!editForm.description.trim()) {
			formErrors.description = 'La descripción es requerida';
			isValid = false;
		} else if (editForm.description.length < 10) {
			formErrors.description = 'La descripción debe tener al menos 10 caracteres';
			isValid = false;
		} else if (editForm.description.length > 1000) {
			formErrors.description = 'La descripción no puede exceder 1000 caracteres';
			isValid = false;
		}


		return isValid;
	}

	async function saveChanges() {
		if (!course || !validateForm()) {
			return;
		}

		saving = true;
		error = '';

		try {
			const updateData: UpdateMaterialApoyoDto = {
				title: editForm.title.trim(),
				description: editForm.description.trim(),
				isFeatured: editForm.isFeatured,
				imagePath: editForm.imagePath || undefined,
				educatorName: editForm.educatorName.trim() || undefined
			};

			await materialApoyoService.updateMaterialApoyo(course.id, updateData);

			// Reload course data
			await loadCourse();

			// Exit edit mode
			editMode = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al guardar cambios';
			console.error('Error saving course:', err);
		} finally {
			saving = false;
		}
	}

	function handleImageUpload(result: UploadResult) {
		const relativePath =
			result?.relativePath ||
			(result?.url?.startsWith('/media/') ? result.url.substring('/media/'.length) : result?.url) ||
			'';

		editForm.imagePath = relativePath;

		if (course) {
			course = {
				...course,
				imagePath: relativePath
			};
		}
	}

	function handleImageRemove() {
		editForm.imagePath = '';

		if (course) {
			course = {
				...course,
				imagePath: ''
			};
		}
	}

	function handleImageUploadError(message: string) {
		console.error('Error al subir imagen:', message);
		error = message || 'Error al subir la imagen';
	}

	// Module management functions
	function handleCreateModule() {
		editingModule = null;
		showModuleForm = true;
	}

	function handleEditModule(event: CustomEvent<string>) {
		const moduleId = event.detail;
		if (course?.modules) {
			editingModule = course.modules.find(m => m.id === moduleId) || null;
			showModuleForm = true;
		}
	}

	async function handleDeleteModule(event: CustomEvent<string>) {
		const moduleId = event.detail;
		if (!course) return;

		try {
			moduleFormLoading = true;
			error = '';

			await materialApoyoService.deleteModule(moduleId);

			// Reload course data to get updated modules
			await loadCourse();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al eliminar el módulo';
			console.error('Error deleting module:', err);
		} finally {
			moduleFormLoading = false;
		}
	}

	function handleViewModule(event: CustomEvent<string>) {
		const moduleId = event.detail;
		goto(`/modules/${moduleId}`);
	}

	function handleModuleFormSuccess(event: CustomEvent<{type: string, module?: ModuleSummaryDto, id?: string, data?: any}>) {
		const { type } = event.detail;

		showModuleForm = false;
		editingModule = null;

		// Reload course data to show updated modules
		loadCourse();
	}

	function handleModuleFormError(event: CustomEvent<string>) {
		error = event.detail;
		setTimeout(() => {
			error = '';
		}, 5000);
	}

	function handleModuleFormCancel() {
		showModuleForm = false;
		editingModule = null;
	}
</script>

<svelte:head>
	<title>{course?.title || 'Proyecto'} - Centro Cultural Víctor Jara</title>
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
					<h3 class="text-2xl font-bold text-gray-800 mb-4">Cargando proyecto...</h3>
					<p class="text-gray-600">Obteniendo todos los detalles del proyecto</p>
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
					<h3 class="text-2xl font-bold text-red-800 mb-6">😔 No pudimos cargar el proyecto</h3>
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
							← Volver a proyectos
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
						🏠 Proyectos
					</button>
					<span class="text-gray-400">/</span>
					<span class="text-gray-600 font-medium break-words overflow-wrap-anywhere hyphens-auto max-w-full">{course.title}</span>
				</nav>
			</div>

			<!-- Course Header -->
			<div class="bg-gradient-to-br from-white/90 to-emerald-50/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-emerald-100 overflow-hidden mb-8">
				<div class="relative">
					{#if course.imagePath}
						<div class="h-80 overflow-hidden">
							<img
								src={course.imagePath.startsWith('http') ? course.imagePath : `/media/${course.imagePath.startsWith('/media/') ? course.imagePath.substring(7) : course.imagePath}`}
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
							{#if editMode}
								<div class="mb-4">
									<input
										bind:value={editForm.title}
										class="text-4xl md:text-5xl font-black leading-tight bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-2xl p-4 w-full text-white placeholder-white/70 focus:outline-none focus:border-white/60"
										class:border-red-300={formErrors.title}
										placeholder="Título del proyecto"
										maxlength="200"
										disabled={saving}
									/>
									{#if formErrors.title}
										<div class="text-red-300 text-sm mt-2 bg-red-900/30 backdrop-blur-sm rounded-lg p-2">{formErrors.title}</div>
									{/if}
								</div>
							{:else}
								<h1 class="text-4xl md:text-5xl font-black mb-4 leading-tight drop-shadow-lg break-words overflow-wrap-anywhere hyphens-auto max-w-full">
									{course.title}
								</h1>
							{/if}
							<div class="flex flex-wrap gap-3 mb-4">
								<span class="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-2xl text-sm font-bold border border-white/30">
									👨‍🏫 {course.educatorName || 'Encargado'}
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
							Descripción del Proyecto
							{#if editMode}
								<span class="text-sm font-normal text-blue-600 ml-auto">✏️ Editando</span>
							{/if}
						</h2>
						<div class="prose prose-lg max-w-none">
							{#if editMode}
								<div class="space-y-4">
									<textarea
										bind:value={editForm.description}
										class="w-full p-4 border-2 border-emerald-200 rounded-2xl text-gray-700 leading-relaxed text-lg resize-vertical min-h-32 focus:outline-none focus:border-emerald-500"
										class:border-red-300={formErrors.description}
										placeholder="Descripción del proyecto"
										maxlength="1000"
										disabled={saving}
										rows="6"
									></textarea>
									<div class="flex justify-between items-center">
										{#if formErrors.description}
											<div class="text-red-600 text-sm">{formErrors.description}</div>
										{:else}
											<div></div>
										{/if}
										<div class="text-gray-500 text-sm">{editForm.description.length}/1000 caracteres</div>
									</div>
								</div>
							{:else}
								<p class="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap break-words overflow-wrap-anywhere hyphens-auto max-w-full">{course.description}</p>
							{/if}
						</div>
					</div>

					<!-- Modules Section -->
					<div class="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 overflow-hidden">
						<div class="p-8 pb-0">
							<h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
								<span class="text-3xl">📚</span>
								Contenido del Proyecto
							</h2>
						</div>

						<div class="px-8 pb-8">
							<ModuleList
								courseId={course.id}
								showActions={canManage}
								on:createModule={handleCreateModule}
								on:editModule={handleEditModule}
								on:deleteModule={handleDeleteModule}
								on:viewModule={handleViewModule}
							/>
						</div>
					</div>
				</div>

				<!-- Sidebar -->
				<div class="space-y-6">

					<!-- Image Upload Section (Edit Mode) -->
					{#if editMode && canManage}
						<div class="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-6">
							<h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
								<span class="text-2xl">🖼️</span>
								Imagen del Proyecto
							</h3>
							<ContextualMediaUploader
								context="material-apoyo"
								contentId={course.id}
								mediaType="image"
								currentMedia={editForm.imagePath}
								disabled={saving}
								on:uploadSuccess={(event) => handleImageUpload(event.detail)}
								on:mediaRemoved={handleImageRemove}
								on:uploadError={(event) => handleImageUploadError(event.detail)}
							/>
						</div>
					{/if}

					<!-- Featured Course Option (Edit Mode) -->
					{#if editMode && canManage}
						<div class="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-6">
							<h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
								<span class="text-2xl">⭐</span>
								Destacado
							</h3>
							<label class="flex items-center gap-3 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={editForm.isFeatured}
									class="w-5 h-5 text-emerald-600 border-2 border-emerald-300 rounded focus:ring-emerald-500"
									disabled={saving}
								/>
								<span class="text-gray-700 font-medium">Marcar como proyecto destacado</span>
							</label>
							<p class="text-gray-500 text-sm mt-2">
								Los proyectos destacados aparecen en la sección principal.
							</p>
						</div>
					{/if}

					<!-- Educator Name (Edit Mode) -->
					{#if editMode && canManage}
						<div class="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-6">
							<h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
								<span class="text-2xl">👨‍🏫</span>
								Encargado del Proyecto
							</h3>
							<input
								type="text"
								bind:value={editForm.educatorName}
								class="w-full p-3 border-2 border-emerald-200 rounded-xl text-gray-700 focus:outline-none focus:border-emerald-500 transition-colors"
								placeholder="Nombre del encargado"
								maxlength="100"
								disabled={saving}
							/>
							<p class="text-gray-500 text-sm mt-2">
								Nombre de la persona responsable de este proyecto.
							</p>
						</div>
					{/if}

					<!-- Course Actions -->
					{#if canManage}
						<div class="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-6">
							<h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
								<span class="text-2xl">⚙️</span>
								Gestión del Proyecto
							</h3>
							<div class="space-y-3">
								{#if !editMode}
									<button
										on:click={enableEditMode}
										class="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
									>
										<span class="text-xl">✏️</span>
										Editar Proyecto
									</button>
								{:else}
									<button
										on:click={saveChanges}
										class="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
										disabled={saving}
									>
										{#if saving}
											<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
											Guardando...
										{:else}
											<span class="text-xl">💾</span>
											Guardar Cambios
										{/if}
									</button>

									<button
										on:click={cancelEdit}
										class="w-full bg-gray-500 text-white px-6 py-4 rounded-2xl hover:bg-gray-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
										disabled={saving}
									>
										<span class="text-xl">✖️</span>
										Cancelar
									</button>
								{/if}

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
							Información del Proyecto
						</h3>
						<div class="space-y-4">
							<div class="flex justify-between items-center py-3 border-b border-gray-100">
								<span class="text-gray-600 font-medium">Estado:</span>
								<span class="px-3 py-1 rounded-full text-sm font-bold {course.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">
									{course.isActive ? '✅ Activo' : '⏸️ Inactivo'}
								</span>
							</div>


							<div class="flex justify-between items-center py-3 border-b border-gray-100">
								<span class="text-gray-600 font-medium">Encargado:</span>
								<span class="font-bold text-purple-600">{course.educatorName || 'No asignado'}</span>
							</div>

							<div class="flex justify-between items-center py-3 border-b border-gray-100">
								<span class="text-gray-600 font-medium">Módulos:</span>
								<span class="font-bold text-blue-600">{course.moduleCount || 0}</span>
							</div>

							<div class="flex justify-between items-center py-3">
								<span class="text-gray-600 font-medium">Contenidos:</span>
								<span class="font-bold text-indigo-600">{course.postCount || 0}</span>
							</div>
						</div>
					</div>

					<!-- Error Message -->
					{#if error}
						<div class="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
							<div class="flex items-center">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500 mr-3">
									<circle cx="12" cy="12" r="10"></circle>
									<line x1="15" y1="9" x2="9" y2="15"></line>
									<line x1="9" y1="9" x2="15" y2="15"></line>
								</svg>
								<span class="text-red-700 font-medium">{error}</span>
							</div>
						</div>
					{/if}

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
								Volver a Proyectos
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

<!-- Module Form Modal -->
<ModuleForm
	module={editingModule}
	materialApoyoId={actualMaterialApoyoId}
	loading={moduleFormLoading}
	visible={showModuleForm}
	on:success={handleModuleFormSuccess}
	on:error={handleModuleFormError}
	on:cancel={handleModuleFormCancel}
/>

<style>
	.prose p {
		margin-bottom: 1rem;
		line-height: 1.7;
		word-wrap: break-word;
		overflow-wrap: break-word;
		hyphens: auto;
		max-width: 100%;
	}

	/* Forzar wrapping en textos largos */
	.break-words {
		word-wrap: break-word;
		overflow-wrap: break-word;
		word-break: break-word;
		hyphens: auto;
	}

	.overflow-wrap-anywhere {
		overflow-wrap: anywhere;
	}

	/* Contenedores que deben prevenir overflow */
	.bg-white {
		overflow-wrap: break-word;
		word-wrap: break-word;
	}

	/* Específico para contenedores de texto largo */
	.prose {
		max-width: 100%;
		overflow-wrap: break-word;
		word-wrap: break-word;
	}

	/* Navigation breadcrumb */
	nav {
		overflow-wrap: break-word;
		word-wrap: break-word;
	}

	@media (max-width: 768px) {
		.container {
			padding-left: 1rem;
			padding-right: 1rem;
		}


		h1 {
			font-size: 2rem !important;
		}
	}
</style>
