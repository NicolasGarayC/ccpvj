<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { digitalLibraryService } from '$lib/services/digitalLibraryService';
	import type { CreateLibraryItemDto } from '$lib/services/digitalLibraryService';
	import { contextualUploadService } from '$lib/services/contextualUploadService';

	// Estado del formulario
	// Campo separado para el input de tags como string
	let tagsInput = '';

	let formData: CreateLibraryItemDto = {
		title: '',
		description: '',
		author: '',
		fileType: 'document',
		filePath: '',
		fileName: '',
		fileSize: 0,
		mimeType: '',
		tags: [],
		language: 'Español',
		year: new Date().getFullYear(),
		category: '',
		subcategory: '',
		isFeatured: false,
		collectionIds: []
	};

	let selectedFile: File | null = null;
	let isUploading = false;
	let uploadProgress = 0;
	let loading = false;
	let errors: Record<string, string> = {};
	let success = false;

	// Track uploaded files for cleanup
	let uploadedFilePath: string | null = null;
	let itemSaved = false;
	let availableCategories: string[] = [];
	let categoryOptions: Array<{value: string, label: string, description: string}> = [];

	// Opciones para formulario
	const languageOptions = [
		'Español',
		'Inglés',
		'Francés',
		'Portugués',
		'Catalán',
		'Quechua',
		'Mapuche'
	];

	// Función para obtener icono según categoría
	function getCategoryIcon(category: string): string {
		const iconMap: Record<string, string> = {
			'Literatura': '📚',
			'Historia': '🏛️',
			'Arte y Música': '🎨',
			'Ciencias Sociales': '🧠',
			'Ciencias Exactas': '🔬',
			'Educación': '🎓',
			'Filosofía': '🤔',
			'Medio Ambiente': '🌱',
			'Política': '🗳️',
			'Cultura Popular': '🎭',
			'Derechos Humanos': '⚖️',
			'Tecnología': '💻',
			'Salud': '🏥',
			'Economía': '💰',
			'Documentales': '🎬'
		};
		return iconMap[category] || '📂';
	}

	// Función para obtener descripción según categoría
	function getCategoryDescription(category: string): string {
		const descriptionMap: Record<string, string> = {
			'Literatura': 'Novelas, ensayos, poesía y textos literarios',
			'Ciencias Sociales': 'Sociología, política, estudios culturales y antropología',
			'Arte y Música': 'Música, arte visual, performance y expresiones culturales',
			'Ciencias Exactas': 'Física, matemáticas, química y ciencias naturales',
			'Educación': 'Pedagogía, metodologías educativas y formación docente',
			'Medio Ambiente': 'Ecología, sostenibilidad y agricultura urbana',
			'Historia': 'Historia contemporánea, memoria histórica y derechos humanos'
		};
		return descriptionMap[category] || 'Recursos de la biblioteca';
	}

	// Cargar categorías dinámicamente
	onMount(async () => {
		try {
			availableCategories = await digitalLibraryService.getAvailableCategories();
			categoryOptions = availableCategories.map(category => ({
				value: category,
				label: `${getCategoryIcon(category)} ${category}`,
				description: getCategoryDescription(category)
			}));

			// Si hay categorías disponibles, usar la primera como default
			if (categoryOptions.length > 0 && !formData.category) {
				formData.category = categoryOptions[0].value;
			}
		} catch (error) {
			console.error('Error loading categories:', error);
			// Fallback si no se pueden cargar las categorías
			categoryOptions = [
				{ value: 'Literatura', label: '📚 Literatura', description: 'Recursos literarios' }
			];
		}
	});

	onDestroy(async () => {
		// Cleanup orphan files when leaving page without saving
		if (uploadedFilePath && !itemSaved) {
			await contextualUploadService.cleanupOrphanFiles([uploadedFilePath]);
		}
	});

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			selectedFile = file;

			// Validar archivo usando el servicio de upload
			const validation = digitalLibraryService.validateFile(file);
			if (!validation.isValid) {
				errors.file = validation.error || 'Archivo no válido';
				return;
			} else {
				delete errors.file;
			}

			// Auto-detectar tipo de archivo
			if (validation.fileType) {
				formData.fileType = validation.fileType;
			}

			// Si no hay título, usar el nombre del archivo
			if (!formData.title) {
				formData.title = file.name.replace(/\.[^/.]+$/, "");
			}

			formData.fileSize = file.size;
			formData.fileName = file.name;
		}
	}

	async function handleSubmit() {
		if (!validateForm()) return;

		loading = true;
		errors = {};

		try {
			// Convertir tags string a array
			formData.tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

			// Primero subir el archivo
			if (selectedFile) {
				isUploading = true;

				// Generar un ID temporal para el upload
				const tempId = crypto.randomUUID();

				const uploadResult = await digitalLibraryService.uploadLibraryFile({
					itemId: tempId,
					file: selectedFile,
					category: formData.category
				});

				// Track uploaded file for cleanup
				uploadedFilePath = uploadResult.relativePath || uploadResult.url.replace('/media/', '');

				formData.filePath = uploadResult.url;
				formData.fileType = uploadResult.fileType;
				formData.fileSize = uploadResult.size;
				formData.mimeType = selectedFile.type;

				isUploading = false;
			}

			// Crear el recurso en la base de datos
			const newItem = await digitalLibraryService.createItem(formData);

			// Mark as saved successfully
			itemSaved = true;

			success = true;
			setTimeout(() => {
				goto('/library');
			}, 2000);

		} catch (error) {
			console.error('Error creating library item:', error);
			errors.general = 'Error al crear el recurso. Por favor, inténtalo de nuevo.';

			// Cleanup uploaded file on error
			if (uploadedFilePath && !itemSaved) {
				await contextualUploadService.cleanupOrphanFiles([uploadedFilePath]);
				uploadedFilePath = null;
			}
		} finally{
			loading = false;
			isUploading = false;
		}
	}

	function validateForm(): boolean {
		errors = {};

		if (!formData.title.trim()) {
			errors.title = 'El título es obligatorio';
		}

		if (!selectedFile) {
			errors.file = 'Debes seleccionar un archivo';
		}

		if (!formData.author?.trim()) {
			errors.author = 'El autor es obligatorio';
		}

		if (!formData.category) {
			errors.category = 'La categoría es obligatoria';
		}

		return Object.keys(errors).length === 0;
	}

	function resetForm() {
		tagsInput = '';
		formData = {
			title: '',
			description: '',
			author: '',
			fileType: 'document',
			filePath: '',
			fileName: '',
			fileSize: 0,
			mimeType: '',
			tags: [],
			language: 'Español',
			year: new Date().getFullYear(),
			category: categoryOptions.length > 0 ? categoryOptions[0].value : 'Literatura',
			subcategory: '',
			isFeatured: false,
			collectionIds: []
		};
		selectedFile = null;
		errors = {};
		success = false;
	}

	function formatFileSize(bytes: number): string {
		return digitalLibraryService.formatFileSize(bytes);
	}

	function getFileTypeIcon(fileType: string): string {
		return digitalLibraryService.getFileTypeIcon(fileType);
	}
</script>

<svelte:head>
	<title>Crear Recurso - Biblioteca Digital</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
	<div class="container mx-auto px-4 py-8 max-w-4xl">
		<!-- Header -->
		<div class="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-8 mb-8 border-2 border-indigo-100 overflow-hidden">
			<div class="absolute top-4 right-6 text-6xl opacity-20 animate-pulse">✨</div>
			<div class="absolute -top-4 -left-4 w-20 h-20 bg-indigo-200/30 rounded-full animate-bounce" style="animation-duration: 3s;"></div>

			<div class="relative z-10">
				<h1 class="text-3xl md:text-4xl font-black mb-4">
					<span class="text-3xl mr-3">📝</span>
					<span class="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-800 bg-clip-text text-transparent">
						Agregar Recurso Genial
					</span>
				</h1>
				<p class="text-lg text-gray-700 max-w-2xl leading-relaxed font-medium">
					🌟 ¡Comparte conocimiento increíble! Agrega libros, videos, audios y documentos súper geniales para que otros puedan aprender y crear cosas asombrosas.
				</p>
			</div>
		</div>

		{#if success}
			<!-- Mensaje de éxito -->
			<div class="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-xl border-2 border-green-200 p-8 mb-8 overflow-hidden">
				<div class="absolute top-4 right-6 text-6xl opacity-20 animate-bounce">🎉</div>

				<div class="relative z-10 text-center">
					<div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
						<span class="text-3xl text-white">✅</span>
					</div>
					<h2 class="text-2xl md:text-3xl font-black text-green-800 mb-4">
						¡Recurso Creado con Éxito! 🎊
					</h2>
					<p class="text-lg text-green-700 mb-6 font-medium">
						Tu recurso súper genial ha sido agregado a la biblioteca. ¡Ahora otros pueden disfrutar de tu contenido increíble!
					</p>
					<p class="text-sm text-green-600">Redirigiendo a la biblioteca en unos segundos...</p>
				</div>
			</div>
		{:else}
			<!-- Formulario -->
			<form on:submit|preventDefault={handleSubmit} class="space-y-8">
				<!-- Información básica -->
				<div class="bg-gradient-to-br from-white/95 to-indigo-50/95 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-indigo-100 p-8 overflow-hidden">
					<div class="absolute -top-4 -right-4 w-16 h-16 bg-indigo-200/20 rounded-full animate-pulse"></div>

					<h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
						<span class="text-2xl">📋</span>
						Información Básica
					</h2>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<!-- Título -->
						<div class="md:col-span-2">
							<label for="title" class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
								<span>📝</span>
								Título *
							</label>
							<input
								id="title"
								type="text"
								bind:value={formData.title}
								placeholder="Ingresa un título súper genial..."
								class="w-full p-4 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-300/20 focus:border-indigo-400 transition-all duration-300 bg-white font-medium {errors.title ? 'border-red-400 ring-red-300/20' : ''}"
								required
							>
							{#if errors.title}
								<p class="text-red-600 text-sm mt-2 flex items-center gap-1">
									<span>⚠️</span>
									{errors.title}
								</p>
							{/if}
						</div>

						<!-- Autor -->
						<div>
							<label for="author" class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
								<span>👤</span>
								Autor *
							</label>
							<input
								id="author"
								type="text"
								bind:value={formData.author}
								placeholder="Nombre del autor..."
								class="w-full p-4 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-300/20 focus:border-indigo-400 transition-all duration-300 bg-white font-medium {errors.author ? 'border-red-400 ring-red-300/20' : ''}"
								required
							>
							{#if errors.author}
								<p class="text-red-600 text-sm mt-2 flex items-center gap-1">
									<span>⚠️</span>
									{errors.author}
								</p>
							{/if}
						</div>

						<!-- Año de publicación -->
						<div>
							<label for="publishYear" class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
								<span>📅</span>
								Año de Publicación
							</label>
							<input
								id="publishYear"
								type="number"
								bind:value={formData.year}
								min="1800"
								max={new Date().getFullYear() + 1}
								class="w-full p-4 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-300/20 focus:border-indigo-400 transition-all duration-300 bg-white font-medium"
							>
						</div>

						<!-- Descripción -->
						<div class="md:col-span-2">
							<label for="description" class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
								<span>📄</span>
								Descripción
							</label>
							<textarea
								id="description"
								bind:value={formData.description}
								placeholder="Describe tu recurso súper genial..."
								rows="4"
								class="w-full p-4 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-300/20 focus:border-indigo-400 transition-all duration-300 bg-white font-medium resize-none"
							></textarea>
						</div>
					</div>
				</div>

				<!-- Archivo -->
				<div class="bg-gradient-to-br from-white/95 to-purple-50/95 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-purple-100 p-8 overflow-hidden">
					<div class="absolute -top-4 -right-4 w-16 h-16 bg-purple-200/20 rounded-full animate-pulse"></div>

					<h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
						<span class="text-2xl">📁</span>
						Archivo
					</h2>

					<div class="space-y-6">
						<!-- Upload de archivo -->
						<div>
							<label class="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
								<span>📎</span>
								Seleccionar Archivo *
							</label>

							<div class="relative">
								<input
									type="file"
									on:change={handleFileChange}
									accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.avi,.mov,.mp3,.wav,.ogg,.m4a"
									class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
									required
								>

								<div class="border-2 border-dashed border-purple-300 rounded-2xl p-8 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-300 {errors.file ? 'border-red-400 bg-red-50/30' : ''}">
									{#if selectedFile}
										<div class="flex items-center justify-center gap-4">
											<div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
												<span class="text-2xl text-white">{getFileTypeIcon(formData.fileType)}</span>
											</div>
											<div class="text-left">
												<p class="font-bold text-gray-800">{selectedFile.name}</p>
												<p class="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
												<p class="text-xs text-purple-600 font-semibold">Tipo: {formData.fileType}</p>
											</div>
										</div>
									{:else}
										<div class="space-y-4">
											<div class="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center">
												<span class="text-3xl">📁</span>
											</div>
											<div>
												<p class="text-lg font-bold text-gray-700 mb-2">🚀 Arrastra tu archivo aquí o haz clic para seleccionar</p>
												<p class="text-sm text-gray-500">Soportamos: PDF, Word, Excel, PowerPoint, imágenes, videos y audio</p>
											</div>
										</div>
									{/if}
								</div>
							</div>

							{#if errors.file}
								<p class="text-red-600 text-sm mt-2 flex items-center gap-1">
									<span>⚠️</span>
									{errors.file}
								</p>
							{/if}
						</div>
					</div>
				</div>

				<!-- Categorización -->
				<div class="bg-gradient-to-br from-white/95 to-green-50/95 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-green-100 p-8 overflow-hidden">
					<div class="absolute -top-4 -right-4 w-16 h-16 bg-green-200/20 rounded-full animate-pulse"></div>

					<h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
						<span class="text-2xl">🏷️</span>
						Categorización
					</h2>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<!-- Categoría -->
						<div class="md:col-span-2">
							<label for="category" class="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
								<span>📂</span>
								Categoría *
							</label>
							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
								{#each categoryOptions as option}
									<label class="cursor-pointer">
										<input
											type="radio"
											bind:group={formData.category}
											value={option.value}
											class="sr-only"
										>
										<div class="p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 transition-all duration-300 hover:shadow-md {formData.category === option.value ? 'bg-gradient-to-r from-green-400 to-green-600 text-white border-transparent shadow-lg' : 'bg-white hover:bg-green-50'}">
											<div class="text-sm font-bold {formData.category === option.value ? 'text-white' : 'text-gray-800'}">{option.label}</div>
											<div class="text-xs {formData.category === option.value ? 'text-green-100' : 'text-gray-600'} mt-1">{option.description}</div>
										</div>
									</label>
								{/each}
							</div>
							{#if errors.category}
								<p class="text-red-600 text-sm mt-2 flex items-center gap-1">
									<span>⚠️</span>
									{errors.category}
								</p>
							{/if}
						</div>

						<!-- Idioma -->
						<div>
							<label for="language" class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
								<span>🌐</span>
								Idioma
							</label>
							<select
								id="language"
								bind:value={formData.language}
								class="w-full p-4 border-2 border-green-200 rounded-xl focus:ring-4 focus:ring-green-300/20 focus:border-green-400 transition-all duration-300 bg-white font-medium"
							>
								{#each languageOptions as language}
									<option value={language}>{language}</option>
								{/each}
							</select>
						</div>

						<!-- Subcategoría -->
						<div>
							<label for="subcategory" class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
								<span>📂</span>
								Subcategoría (opcional)
							</label>
							<input
								id="subcategory"
								type="text"
								bind:value={formData.subcategory}
								placeholder="Ej: Poesía, Narrativa..."
								class="w-full p-4 border-2 border-green-200 rounded-xl focus:ring-4 focus:ring-green-300/20 focus:border-green-400 transition-all duration-300 bg-white font-medium"
							>
						</div>

						<!-- Tags -->
						<div class="md:col-span-2">
							<label for="tags" class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
								<span>🏷️</span>
								Etiquetas
							</label>
							<input
								id="tags"
								type="text"
								bind:value={tagsInput}
								placeholder="música, educación, historia (separadas por comas)"
								class="w-full p-4 border-2 border-green-200 rounded-xl focus:ring-4 focus:ring-green-300/20 focus:border-green-400 transition-all duration-300 bg-white font-medium"
							>
							<p class="text-xs text-gray-500 mt-2">💡 Usa etiquetas para que otros puedan encontrar tu recurso más fácilmente</p>
						</div>
					</div>
				</div>

				<!-- Error general -->
				{#if errors.general}
					<div class="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
						<div class="flex items-center gap-3">
							<span class="text-2xl">❌</span>
							<p class="text-red-700 font-semibold">{errors.general}</p>
						</div>
					</div>
				{/if}

				<!-- Botones de acción -->
				<div class="flex flex-col sm:flex-row gap-4 justify-between items-center">
					<button
						type="button"
						on:click={() => goto('/library')}
						class="group inline-flex items-center gap-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white px-8 py-4 rounded-2xl hover:from-gray-500 hover:to-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg font-bold"
					>
						<span class="text-xl group-hover:-translate-x-1 transition-transform duration-300">⬅️</span>
						Volver a la Biblioteca
					</button>

					<div class="flex gap-4">
						<button
							type="button"
							on:click={resetForm}
							disabled={loading || isUploading}
							class="group inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-4 rounded-2xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<span class="text-xl group-hover:rotate-180 transition-transform duration-500">🔄</span>
							Limpiar
						</button>

						<button
							type="submit"
							disabled={loading || isUploading || !selectedFile}
							class="group inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if loading || isUploading}
								<div class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
								{isUploading ? 'Subiendo...' : 'Creando...'}
							{:else}
								<span class="text-xl group-hover:rotate-90 transition-transform duration-500">✨</span>
								Crear Recurso Genial
							{/if}
						</button>
					</div>
				</div>
			</form>
		{/if}
	</div>
</div>