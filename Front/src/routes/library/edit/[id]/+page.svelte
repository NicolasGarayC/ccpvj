<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
import { digitalLibraryService } from '$lib/application/services/library/DigitalLibraryService';
import type { LibraryItemDto, UpdateLibraryItemDto } from '$lib/application/services/library/DigitalLibraryService';
import { contextualUploadService } from '$lib/application/services/upload/ContextualUploadService';

interface LibraryItemForm {
	title: string;
	description: string;
	author: string;
	category: string;
	subcategory: string;
	fileType: string;
	language: string;
	tags: string;
	filePath?: string;
	fileName?: string;
	fileSize?: number;
	mimeType?: string;
	isFeatured?: boolean;
	collectionIds?: string[];
	year?: number;
}

let resourceId = $page.params.id as string;
let resource: LibraryItemDto | null = null;
let formData: LibraryItemForm = {
	title: '',
	description: '',
	author: '',
	category: '',
	subcategory: '',
	fileType: 'document',
	language: 'Español',
	tags: '',
	filePath: '',
	fileName: '',
	fileSize: undefined,
	mimeType: '',
	isFeatured: false,
	collectionIds: [],
	year: undefined
};

	let selectedFile: File | null = null;
	let authorInput = '';
	let tagsInput = '';
let loading = false;
let loadingResource = true;
let errors: Record<string, string> = {};
let successMessage = '';

	const languageOptions = [
		'Español',
		'Inglés',
		'Francés',
		'Portugués',
		'Catalán',
		'Italiano',
		'Alemán'
	];

	const categoryOptions = [
		{ value: 'Literatura', label: 'Literatura' },
		{ value: 'Ciencias Sociales', label: 'Ciencias Sociales' },
		{ value: 'Arte y Música', label: 'Arte y Música' },
		{ value: 'Ciencias Exactas', label: 'Ciencias Exactas' },
		{ value: 'Educación', label: 'Educación' },
		{ value: 'Medio Ambiente', label: 'Medio Ambiente' },
		{ value: 'Historia', label: 'Historia' }
	];

const fileTypeOptions = [
	{ value: 'document', label: 'Documento' },
	{ value: 'video', label: 'Video' },
	{ value: 'audio', label: 'Audio' },
	{ value: 'image', label: 'Imagen' }
];

function populateFormFromResource(item: LibraryItemDto) {
	formData = {
		title: item.title,
		description: item.description ?? '',
		author: item.author ?? '',
		category: item.category ?? '',
		subcategory: item.subcategory ?? '',
		fileType: item.fileType ?? 'document',
		language: item.language ?? 'Español',
		tags: Array.isArray(item.tags)
			? item.tags.filter(Boolean).join(', ')
			: typeof item.tags === 'string'
				? item.tags
				: '',
		filePath: item.filePath,
		fileName: item.fileName,
		fileSize: item.fileSize,
		mimeType: item.mimeType ?? '',
		isFeatured: item.isFeatured ?? false,
		collectionIds: Array.isArray(item.collections) ? item.collections.map(collection => collection.id) : [],
		year: item.year
	};

	authorInput = formData.author;
	tagsInput = formData.tags;
}

onMount(async () => {
	await loadResource();
});

async function loadResource() {
		try {
			loadingResource = true;
			resource = await digitalLibraryService.getItemById(resourceId);
			
			if (!resource) {
				goto('/library');
				return;
			}

			populateFormFromResource(resource);
		} catch (error) {
			console.error('Error loading resource:', error);
			goto('/library');
		} finally {
			loadingResource = false;
		}
	}

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

	if (file) {
		const validation = digitalLibraryService.validateFile(file);
		if (!validation.isValid) {
			errors.file = validation.error || 'Archivo no válido';
			selectedFile = null;
			return;
		}

		delete errors.file;
		selectedFile = file;

		if (validation.fileType) {
			formData.fileType = validation.fileType;
		} else {
			const mimeType = file.type;
			if (mimeType.startsWith('video/')) {
				formData.fileType = 'video';
			} else if (mimeType.startsWith('audio/')) {
				formData.fileType = 'audio';
			} else if (mimeType.startsWith('image/')) {
				formData.fileType = 'image';
			} else {
				formData.fileType = 'document';
			}
		}

		formData.fileName = file.name;
		formData.fileSize = file.size;
		formData.mimeType = file.type;
	}

	validateField('file');
}

	function updateAuthor() {
		formData.author = authorInput.trim();
	}

function updateTags() {
	formData.tags = tagsInput.trim();
}

	function validateField(field: string) {
		delete errors[field];

		switch (field) {
			case 'title':
				if (!formData.title.trim()) {
					errors.title = 'El título es requerido';
				}
				break;

			case 'author':
				if (!formData.author.trim()) {
					errors.author = 'El autor es requerido';
				}
				break;

			case 'category':
				if (!formData.category.trim()) {
					errors.category = 'La categoría es requerida';
				}
				break;

			case 'file':
				if (selectedFile) {
					const validation = digitalLibraryService.validateFile(selectedFile);
					if (!validation.isValid) {
						errors.file = validation.error || 'Archivo no válido';
					}
				}
				break;
		}
	}

	function validateForm(): boolean {
		errors = {};

		validateField('title');
		validateField('author');
		validateField('category');
		if (selectedFile) {
			validateField('file');
		}

		return Object.keys(errors).length === 0;
	}

async function handleSubmit() {
	if (!validateForm()) {
		return;
	}
	
	loading = true;
	successMessage = '';
	delete errors.submit;
	let uploadedFileReference: string | null = null;
	
	try {
		const trimmedTags = tagsInput
			.split(',')
			.map(tag => tag.trim())
			.filter(tag => tag.length > 0);

		const updatePayload: UpdateLibraryItemDto = {
			title: formData.title.trim(),
			description: formData.description?.trim(),
			author: formData.author?.trim(),
			category: formData.category?.trim(),
			subcategory: formData.subcategory?.trim() || undefined,
			language: formData.language || undefined,
			year: formData.year,
			fileType: formData.fileType,
			isFeatured: formData.isFeatured,
			isActive: formData.isActive ?? true,
			collectionIds: formData.collectionIds,
			tags: trimmedTags
		};

		if (selectedFile) {
			const uploadResult = await digitalLibraryService.uploadLibraryFile({
				itemId: resourceId,
				file: selectedFile,
				category: formData.category || 'general',
				oldFilePath: resource?.filePath
			});

			uploadedFileReference =
				uploadResult.relativePath ||
				(uploadResult.url?.startsWith('/media/')
					? uploadResult.url.substring('/media/'.length)
					: uploadResult.url);

			updatePayload.filePath = uploadResult.url;
			updatePayload.fileName = uploadResult.filename || selectedFile.name;
			updatePayload.fileSize = uploadResult.size ?? selectedFile.size;
			updatePayload.mimeType = selectedFile.type;
			updatePayload.fileType = uploadResult.fileType ?? formData.fileType;
		}

		await digitalLibraryService.updateItem(resourceId, updatePayload);

		const updatedResource = await digitalLibraryService.getItemById(resourceId);
		resource = updatedResource;
		populateFormFromResource(updatedResource);
		selectedFile = null;

		successMessage = 'Recurso actualizado exitosamente';

		// Auto-hide message after 5 seconds
		setTimeout(() => {
			successMessage = '';
		}, 5000);

		// Scroll to top to show success message
		window.scrollTo({ top: 0, behavior: 'smooth' });
	} catch (error) {
		console.error('Error updating resource:', error);
		errors.submit = error instanceof Error ? error.message : 'Error al actualizar el recurso';
		successMessage = '';

		if (uploadedFileReference) {
			await contextualUploadService.cleanupOrphanFiles([uploadedFileReference]);
		}
	} finally {
		loading = false;
	}
}

	function handleCancel() {
		goto('/library');
	}
</script>

<svelte:head>
	<title>Editar Recurso - Biblioteca</title>
</svelte:head>

{#if loadingResource}
	<div class="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
		<div class="text-center bg-white rounded-3xl p-12 shadow-2xl border-2 border-indigo-100">
			<div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center animate-spin">
				<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
				</svg>
			</div>
			<p class="text-xl font-bold text-gray-800">Cargando recurso...</p>
			<p class="text-sm text-gray-500 mt-2">Preparando la edición</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
		<div class="container mx-auto px-4 py-8 max-w-4xl">
			<!-- Header -->
			<div class="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-8 mb-8 border-2 border-indigo-100 overflow-hidden">
				<div class="absolute top-4 right-6 text-6xl opacity-20 animate-pulse">✏️</div>
				<div class="absolute -top-4 -left-4 w-20 h-20 bg-indigo-200/30 rounded-full animate-bounce" style="animation-duration: 3s;"></div>

				<div class="relative z-10">
					<div class="flex items-center justify-between">
						<div>
							<h1 class="text-3xl md:text-4xl font-black mb-4">
								<span class="text-3xl mr-3">✏️</span>
								<span class="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-800 bg-clip-text text-transparent">
									Editar Recurso Genial
								</span>
							</h1>
							<p class="text-lg text-gray-700 leading-relaxed font-medium">
								🌟 Actualiza la información de tu recurso para mantenerlo súper actualizado
							</p>
						</div>
						<button
							on:click={handleCancel}
							class="ml-4 p-3 bg-white/80 hover:bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 text-gray-600 hover:text-gray-800"
							title="Volver a la biblioteca"
							type="button"
						>
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
							</svg>
						</button>
					</div>
				</div>
			</div>

		{#if successMessage}
			<div class="mb-6 rounded-2xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 p-6 shadow-lg animate-pulse">
				<div class="flex items-center gap-4">
					<div class="flex-shrink-0">
						<div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
							<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
							</svg>
						</div>
					</div>
					<div class="flex-1">
						<h3 class="text-lg font-bold text-green-900 mb-1">¡Actualización Exitosa!</h3>
						<p class="text-green-700 font-medium">{successMessage}</p>
					</div>
					<button
						on:click={() => successMessage = ''}
						class="flex-shrink-0 text-green-600 hover:text-green-800 transition-colors"
						aria-label="Cerrar mensaje"
						type="button"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>
			</div>
		{/if}

		<!-- Formulario -->
		<form on:submit|preventDefault={handleSubmit} class="space-y-8">
			<!-- Información básica -->
			<div class="bg-gradient-to-br from-white/95 to-indigo-50/95 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-indigo-100 p-8 overflow-hidden relative">
				<div class="absolute -top-4 -right-4 w-16 h-16 bg-indigo-200/20 rounded-full animate-pulse"></div>

				<h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
					<span class="text-2xl">📋</span>
					Información Básica
				</h2>

				<div class="grid grid-cols-1 gap-6">
					<!-- Nombre -->
					<div>
						<label for="resource-name" class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
							<span>📝</span>
							Nombre del recurso *
						</label>
						<input
							id="resource-name"
							type="text"
							bind:value={formData.title}
							on:blur={() => validateField('title')}
							class="w-full p-4 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-300/20 focus:border-indigo-400 transition-all duration-300 bg-white font-medium {errors.title ? 'border-red-400 ring-red-300/20' : ''}"
							placeholder="Ingresa el nombre del recurso..."
						>
						{#if errors.title}
							<p class="mt-2 text-sm text-red-600 flex items-center gap-1">
								<span>⚠️</span>
								{errors.title}
							</p>
						{/if}
					</div>

					<!-- Descripción -->
					<div>
						<label for="resource-description" class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
							<span>📄</span>
							Descripción
						</label>
						<textarea
							id="resource-description"
							bind:value={formData.description}
							rows="4"
							class="w-full p-4 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-300/20 focus:border-indigo-400 transition-all duration-300 bg-white font-medium resize-none"
							placeholder="Descripción del recurso (opcional)..."
						></textarea>
					</div>

					<!-- Autor -->
					<div>
						<label for="resource-authors" class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
							<span>👤</span>
							Autor *
						</label>
						<input
							id="resource-authors"
							type="text"
							bind:value={authorInput}
							on:input={updateAuthor}
							on:blur={() => validateField('author')}
							class="w-full p-4 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-300/20 focus:border-indigo-400 transition-all duration-300 bg-white font-medium {errors.author ? 'border-red-400 ring-red-300/20' : ''}"
							placeholder="Ingresa el autor principal..."
						>
						{#if errors.author}
							<p class="mt-2 text-sm text-red-600 flex items-center gap-1">
								<span>⚠️</span>
								{errors.author}
							</p>
						{/if}
						{#if formData.author}
							<div class="mt-3 inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border-2 border-indigo-200">
								<span class="mr-2">👤</span>
								{formData.author}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Archivo actual -->
			{#if resource}
				<div class="bg-gradient-to-br from-white/95 to-purple-50/95 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-purple-100 p-8 overflow-hidden relative">
					<div class="absolute -top-4 -right-4 w-16 h-16 bg-purple-200/20 rounded-full animate-pulse"></div>

					<h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
						<span class="text-2xl">📁</span>
						Archivo Actual
					</h2>

					<!-- Archivo actual -->
					<div class="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl mb-6 border-2 border-purple-200">
						<div class="flex items-center gap-4">
							<div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center flex-shrink-0">
								<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-base font-bold text-gray-900 truncate">{resource.fileName}</p>
								<p class="text-sm text-gray-600 mt-1">
									<span class="font-semibold">{Math.round(resource.fileSize / 1024)} KB</span>
									<span class="mx-2">•</span>
									<span>{resource.mimeType}</span>
								</p>
							</div>
						</div>
					</div>

					<!-- Reemplazar archivo -->
					<div>
						<label for="resource-file" class="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
							<span>🔄</span>
							Reemplazar archivo (opcional)
						</label>

						<div class="relative">
							<input
								id="resource-file"
								type="file"
								on:change={handleFileChange}
								accept=".pdf,.mp4,.webm,.mov,.avi,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.ogg,.m4a,.doc,.docx,.txt"
								class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
							>

							<div class="border-2 border-dashed border-purple-300 rounded-2xl p-6 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-300 {errors.file ? 'border-red-400 bg-red-50/30' : ''}">
								{#if selectedFile}
									<div class="flex items-center justify-center gap-4">
										<div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
											<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
											</svg>
										</div>
										<div class="text-left">
											<p class="font-bold text-gray-800 text-base">✨ Nuevo archivo seleccionado</p>
											<p class="text-sm text-gray-900 font-medium mt-1">{selectedFile.name}</p>
											<p class="text-xs text-gray-600 mt-1">{Math.round(selectedFile.size / 1024)} KB • {selectedFile.type}</p>
										</div>
									</div>
								{:else}
									<div class="space-y-4">
										<div class="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center">
											<span class="text-3xl">📂</span>
										</div>
										<div>
											<p class="text-lg font-bold text-gray-700 mb-2">🔄 Arrastra un nuevo archivo o haz clic</p>
											<p class="text-sm text-gray-500">Para reemplazar el archivo actual</p>
										</div>
									</div>
								{/if}
							</div>
						</div>

						{#if errors.file}
							<p class="mt-2 text-sm text-red-600 flex items-center gap-1">
								<span>⚠️</span>
								{errors.file}
							</p>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Metadatos -->
			<div class="bg-white rounded-lg shadow-sm border p-6">
				<h2 class="text-lg font-medium text-gray-900 mb-4">Metadatos</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<!-- Categoría -->
					<div>
						<label for="resource-category" class="block text-sm font-medium text-gray-700 mb-2">
							Categoría *
						</label>
						<select
							id="resource-category"
							bind:value={formData.category}
							on:blur={() => validateField('category')}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
							class:border-red-300={errors.category}
						>
							<option value="">Selecciona una categoría</option>
							{#each categoryOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						{#if errors.category}
							<p class="mt-1 text-sm text-red-600">{errors.category}</p>
						{/if}
					</div>

					<!-- Tipo de archivo -->
					<div>
						<label for="resource-file-type" class="block text-sm font-medium text-gray-700 mb-2">
							Tipo de archivo *
						</label>
						<select
							id="resource-file-type"
							bind:value={formData.fileType}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
						>
							{#each fileTypeOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>

					<!-- Año de publicación -->
					<div>
						<label for="resource-year" class="block text-sm font-medium text-gray-700 mb-2">
							Año de publicación
						</label>
						<input
							id="resource-year"
							type="number"
							bind:value={formData.year}
							min="1900"
							max={new Date().getFullYear()}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
							placeholder="YYYY"
						>
					</div>

					<!-- Idioma -->
					<div>
						<label for="resource-language" class="block text-sm font-medium text-gray-700 mb-2">
							Idioma *
						</label>
						<select
							id="resource-language"
							bind:value={formData.language}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
						>
							{#each languageOptions as language}
								<option value={language}>{language}</option>
							{/each}
						</select>
					</div>

					<!-- Subcategoría -->
					<div>
						<label for="resource-subcategory" class="block text-sm font-medium text-gray-700 mb-2">
							Subcategoría
						</label>
						<input
							id="resource-subcategory"
							type="text"
							bind:value={formData.subcategory}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
							placeholder="Ej: Novela, Física, etc."
						>
					</div>

				</div>

				<!-- Tags -->
				<div class="mt-6">
					<label for="resource-tags" class="block text-sm font-medium text-gray-700 mb-2">
						Tags
					</label>
					<input
						id="resource-tags"
						type="text"
						bind:value={tagsInput}
						on:input={updateTags}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
						placeholder="Ingresa tags separados por comas"
					>
					{#if formData.tags && formData.tags.trim().length > 0}
						<div class="mt-2 flex flex-wrap gap-2">
							{#each formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0) as tag}
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
									#{tag}
								</span>
							{/each}
						</div>
					{/if}
				</div>
			</div>



			<!-- Error general -->
			{#if errors.submit}
				<div class="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 rounded-2xl p-6 shadow-lg">
					<div class="flex items-center gap-4">
						<div class="flex-shrink-0">
							<div class="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center">
								<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
							</div>
						</div>
						<div class="flex-1">
							<h3 class="text-lg font-bold text-red-900 mb-1">Error al Actualizar</h3>
							<p class="text-red-700 font-medium">{errors.submit}</p>
						</div>
						<button
							on:click={() => delete errors.submit}
							class="flex-shrink-0 text-red-600 hover:text-red-800 transition-colors"
							aria-label="Cerrar mensaje"
							type="button"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
							</svg>
						</button>
					</div>
				</div>
			{/if}

			<!-- Botones -->
			<div class="flex justify-end gap-4 pt-6 border-t border-gray-200">
				<button
					type="button"
					on:click={handleCancel}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					disabled={loading}
				>
					Cancelar
				</button>
				
				<button
					type="submit"
					class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
					disabled={loading}
				>
					{#if loading}
						<i class="fas fa-spinner fa-spin mr-2"></i>
						Guardando...
					{:else}
						<i class="fas fa-save mr-2"></i>
						Guardar Cambios
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
{/if}
