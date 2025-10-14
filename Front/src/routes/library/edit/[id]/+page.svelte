<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
import { digitalLibraryService } from '$lib/services/digitalLibraryService';
import type { LibraryItemDto } from '$lib/services/digitalLibraryService';

interface LibraryItemForm {
	title: string;
	description: string;
	author: string;
	category: string;
	subcategory: string;
	fileType: string;
	language: string;
	tags: string;
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
	language: 'es',
	tags: '',
	year: undefined
};

	let selectedFile: File | null = null;
	let authorInput = '';
	let tagsInput = '';
	let loading = false;
	let loadingResource = true;
	let errors: Record<string, string> = {};

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

			// Llenar formulario con datos existentes
			formData = {
				title: resource.title,
				description: resource.description || '',
				author: resource.author || '',
				year: resource.year,
				category: resource.category || '',
				subcategory: resource.subcategory || '',
				fileType: resource.fileType,
				tags: Array.isArray(resource.tags) ? resource.tags.join(', ') : '',
				language: resource.language || 'es'
			};

			authorInput = resource.author || '';
			tagsInput = Array.isArray(resource.tags) ? resource.tags.join(', ') : '';
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
			selectedFile = file;

			// Auto-detect file type
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
					// Basic file size validation (max 500MB)
					const maxSize = 500 * 1024 * 1024;
					if (selectedFile.size > maxSize) {
						errors.file = 'El archivo es demasiado grande. Máximo 500MB';
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
		
		try {
			// Note: The digitalLibraryService doesn't have an update method yet
			// This would need to be implemented in the service
			console.warn('Update functionality not yet implemented in digitalLibraryService');
			errors.submit = 'Función de edición aún no implementada';
		} catch (error) {
			console.error('Error updating resource:', error);
			errors.submit = error instanceof Error ? error.message : 'Error al actualizar el recurso';
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
	<div class="flex justify-center items-center min-h-screen">
		<div class="text-center">
			<i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
			<p class="text-gray-600">Cargando recurso...</p>
		</div>
	</div>
{:else}
	<div class="max-w-4xl mx-auto p-6">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Editar Recurso</h1>
					<p class="mt-2 text-gray-600">Modifica la información del recurso</p>
				</div>
				<button
					on:click={handleCancel}
					class="text-gray-600 hover:text-gray-800"
					title="Volver a la biblioteca"
				>
					<i class="fas fa-times text-xl"></i>
				</button>
			</div>
		</div>

		<!-- Formulario -->
		<form on:submit|preventDefault={handleSubmit} class="space-y-8">
			<!-- Información básica -->
			<div class="bg-white rounded-lg shadow-sm border p-6">
				<h2 class="text-lg font-medium text-gray-900 mb-4">Información Básica</h2>
				
				<div class="grid grid-cols-1 gap-6">
					<!-- Nombre -->
					<div>
						<label for="resource-name" class="block text-sm font-medium text-gray-700 mb-2">
							Nombre del recurso *
						</label>
						<input
							id="resource-name"
							type="text"
							bind:value={formData.title}
							on:blur={() => validateField('title')}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
							class:border-red-300={errors.title}
							placeholder="Ingresa el nombre del recurso"
						>
						{#if errors.title}
							<p class="mt-1 text-sm text-red-600">{errors.title}</p>
						{/if}
					</div>

					<!-- Descripción -->
					<div>
						<label for="resource-description" class="block text-sm font-medium text-gray-700 mb-2">
							Descripción
						</label>
						<textarea
							id="resource-description"
							bind:value={formData.description}
							rows="4"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
							placeholder="Descripción del recurso (opcional)"
						></textarea>
					</div>

					<!-- Autor -->
					<div>
						<label for="resource-authors" class="block text-sm font-medium text-gray-700 mb-2">
							Autor *
						</label>
						<input
							id="resource-authors"
							type="text"
							bind:value={authorInput}
							on:input={updateAuthor}
							on:blur={() => validateField('author')}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
							class:border-red-300={errors.author}
							placeholder="Ingresa el autor principal"
						>
						{#if errors.author}
							<p class="mt-1 text-sm text-red-600">{errors.author}</p>
						{/if}
						{#if formData.author}
							<div class="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
								{formData.author}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Archivo actual -->
			{#if resource}
				<div class="bg-white rounded-lg shadow-sm border p-6">
					<h2 class="text-lg font-medium text-gray-900 mb-4">Archivo Actual</h2>
					
					<div class="p-4 bg-gray-50 rounded-md mb-4">
						<div class="flex items-center gap-3">
							<i class="fas fa-file text-gray-400 text-xl"></i>
							<div class="flex-1">
								<p class="text-sm font-medium text-gray-900">{resource.fileName}</p>
								<p class="text-xs text-gray-500">
									{Math.round(resource.fileSize / 1024)} KB • {resource.mimeType}
								</p>
							</div>
						</div>
					</div>

					<div>
						<label for="resource-file" class="block text-sm font-medium text-gray-700 mb-2">
							Reemplazar archivo (opcional)
						</label>
						<input
							id="resource-file"
							type="file"
							on:change={handleFileChange}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
							class:border-red-300={errors.file}
							accept=".pdf,.mp4,.webm,.mov,.avi,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.ogg,.m4a,.doc,.docx,.txt"
						>
						{#if errors.file}
							<p class="mt-1 text-sm text-red-600">{errors.file}</p>
						{/if}
						
						{#if selectedFile}
							<div class="mt-3 p-3 bg-blue-50 rounded-md">
								<div class="flex items-center gap-3">
									<i class="fas fa-file-upload text-blue-400"></i>
									<div class="flex-1">
										<p class="text-sm font-medium text-blue-900">Nuevo archivo: {selectedFile.name}</p>
										<p class="text-xs text-blue-700">
											{Math.round(selectedFile.size / 1024)} KB • {selectedFile.type}
										</p>
									</div>
								</div>
							</div>
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
				<div class="bg-red-50 border border-red-200 rounded-md p-4">
					<div class="flex">
						<i class="fas fa-exclamation-circle text-red-400 mr-2 mt-0.5"></i>
						<p class="text-sm text-red-800">{errors.submit}</p>
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
{/if}
