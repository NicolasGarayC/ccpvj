<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { libraryService } from '$lib/services/library/libraryService';
	import type { CreateLibraryResourceDto, MediaType, ResourceCategory } from '$lib/data/models/library';
	import { MEDIA_TYPE_LABELS, CATEGORY_LABELS, SUPPORTED_MEDIA_TYPES, MAX_FILE_SIZES } from '$lib/data/models/library';

	// Estado del formulario
	let formData: CreateLibraryResourceDto = {
		name: '',
		description: '',
		authors: [],
		category: 'educacion',
		mediaType: 'pdf',
		downloadable: true,
		language: 'es',
		tags: [],
		isFeatured: false
	};

	let selectedFile: File | null = null;
	let authorsInput = '';
	let tagsInput = '';
	let loading = false;
	let errors: Record<string, string> = {};

	// Opciones para formulario
	const languageOptions = [
		{ value: 'es', label: 'Español' },
		{ value: 'en', label: 'Inglés' },
		{ value: 'fr', label: 'Francés' },
		{ value: 'pt', label: 'Portugués' }
	];

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (file) {
			selectedFile = file;
			
			// Auto-detectar tipo de archivo
			const mimeType = file.type;
			Object.entries(SUPPORTED_MEDIA_TYPES).forEach(([type, types]) => {
				if (types.includes(mimeType)) {
					formData.mediaType = type as MediaType;
				}
			});
			
			// Si no hay nombre, usar el nombre del archivo
			if (!formData.name) {
				formData.name = file.name.replace(/\.[^/.]+$/, '');
			}
		}
		
		validateField('file');
	}

	function updateAuthors() {
		formData.authors = authorsInput
			.split(',')
			.map(author => author.trim())
			.filter(author => author.length > 0);
	}

	function updateTags() {
		formData.tags = tagsInput
			.split(',')
			.map(tag => tag.trim())
			.filter(tag => tag.length > 0);
	}

	function validateField(field: string) {
		delete errors[field];

		switch (field) {
			case 'name':
				if (!formData.name.trim()) {
					errors.name = 'El nombre es requerido';
				}
				break;
			
			case 'authors':
				if (formData.authors.length === 0) {
					errors.authors = 'Al menos un autor es requerido';
				}
				break;
			
			case 'file':
				if (!selectedFile) {
					errors.file = 'Debe seleccionar un archivo';
					break;
				}
				
				// Validar tipo de archivo
				const supportedTypes = Object.values(SUPPORTED_MEDIA_TYPES).flat();
				if (!supportedTypes.includes(selectedFile.type)) {
					errors.file = 'Tipo de archivo no soportado';
					break;
				}
				
				// Validar tamaño
				const maxSize = MAX_FILE_SIZES[formData.mediaType];
				if (selectedFile.size > maxSize) {
					const maxSizeMB = Math.round(maxSize / (1024 * 1024));
					errors.file = `El archivo es demasiado grande. Máximo ${maxSizeMB}MB`;
				}
				break;
		}
	}

	function validateForm(): boolean {
		errors = {};
		
		validateField('name');
		validateField('authors');
		validateField('file');
		
		return Object.keys(errors).length === 0;
	}

	async function handleSubmit() {
		if (!validateForm()) {
			return;
		}
		
		loading = true;
		
		try {
			await libraryService.createResource(formData, selectedFile!);
			goto('/library');
		} catch (error) {
			console.error('Error creating resource:', error);
			errors.submit = error instanceof Error ? error.message : 'Error al crear el recurso';
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		goto('/library');
	}
</script>

<svelte:head>
	<title>Crear Recurso - Biblioteca</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-6">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Crear Recurso</h1>
				<p class="mt-2 text-gray-600">Agrega un nuevo recurso a la biblioteca</p>
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
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Nombre del recurso *
					</label>
					<input
						type="text"
						bind:value={formData.name}
						on:blur={() => validateField('name')}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
						class:border-red-300={errors.name}
						placeholder="Ingresa el nombre del recurso"
					>
					{#if errors.name}
						<p class="mt-1 text-sm text-red-600">{errors.name}</p>
					{/if}
				</div>

				<!-- Descripción -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Descripción
					</label>
					<textarea
						bind:value={formData.description}
						rows="4"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
						placeholder="Descripción del recurso (opcional)"
					></textarea>
				</div>

				<!-- Autores -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Autores *
					</label>
					<input
						type="text"
						bind:value={authorsInput}
						on:input={updateAuthors}
						on:blur={() => validateField('authors')}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
						class:border-red-300={errors.authors}
						placeholder="Ingresa los autores separados por comas"
					>
					{#if errors.authors}
						<p class="mt-1 text-sm text-red-600">{errors.authors}</p>
					{/if}
					{#if formData.authors.length > 0}
						<div class="mt-2 flex flex-wrap gap-2">
							{#each formData.authors as author}
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
									{author}
								</span>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Archivo -->
		<div class="bg-white rounded-lg shadow-sm border p-6">
			<h2 class="text-lg font-medium text-gray-900 mb-4">Archivo</h2>
			
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">
					Seleccionar archivo *
				</label>
				<input
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
					<div class="mt-3 p-3 bg-gray-50 rounded-md">
						<div class="flex items-center gap-3">
							<i class="fas fa-file text-gray-400"></i>
							<div class="flex-1">
								<p class="text-sm font-medium text-gray-900">{selectedFile.name}</p>
								<p class="text-xs text-gray-500">
									{Math.round(selectedFile.size / 1024)} KB • {selectedFile.type}
								</p>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Metadatos -->
		<div class="bg-white rounded-lg shadow-sm border p-6">
			<h2 class="text-lg font-medium text-gray-900 mb-4">Metadatos</h2>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Categoría -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Categoría *
					</label>
					<select
						bind:value={formData.category}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
					>
						{#each Object.entries(CATEGORY_LABELS) as [value, label]}
							<option {value}>{label}</option>
						{/each}
					</select>
				</div>

				<!-- Tipo de archivo -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Tipo de archivo *
					</label>
					<select
						bind:value={formData.mediaType}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
					>
						{#each Object.entries(MEDIA_TYPE_LABELS) as [value, label]}
							<option {value}>{label}</option>
						{/each}
					</select>
				</div>

				<!-- Año de publicación -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Año de publicación
					</label>
					<input
						type="number"
						bind:value={formData.publishYear}
						min="1900"
						max={new Date().getFullYear()}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
						placeholder="YYYY"
					>
				</div>

				<!-- Idioma -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Idioma *
					</label>
					<select
						bind:value={formData.language}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
					>
						{#each languageOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<!-- ISBN (para documentos) -->
				{#if formData.mediaType === 'pdf' || formData.mediaType === 'document'}
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							ISBN
						</label>
						<input
							type="text"
							bind:value={formData.isbn}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
							placeholder="978-3-16-148410-0"
						>
					</div>
				{/if}

				<!-- Duración (para videos/audio) -->
				{#if formData.mediaType === 'video' || formData.mediaType === 'audio'}
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Duración (segundos)
						</label>
						<input
							type="number"
							bind:value={formData.duration}
							min="1"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
							placeholder="Duración en segundos"
						>
					</div>
				{/if}
			</div>

			<!-- Tags -->
			<div class="mt-6">
				<label class="block text-sm font-medium text-gray-700 mb-2">
					Tags
				</label>
				<input
					type="text"
					bind:value={tagsInput}
					on:input={updateTags}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
					placeholder="Ingresa los tags separados por comas"
				>
				{#if formData.tags && formData.tags.length > 0}
					<div class="mt-2 flex flex-wrap gap-2">
						{#each formData.tags as tag}
							<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
								#{tag}
							</span>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Opciones -->
		<div class="bg-white rounded-lg shadow-sm border p-6">
			<h2 class="text-lg font-medium text-gray-900 mb-4">Opciones</h2>
			
			<div class="space-y-4">
				<label class="flex items-center">
					<input
						type="checkbox"
						bind:checked={formData.downloadable}
						class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
					>
					<span class="ml-2 text-sm text-gray-700">Permitir descarga</span>
				</label>
				
				<label class="flex items-center">
					<input
						type="checkbox"
						bind:checked={formData.isFeatured}
						class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
					>
					<span class="ml-2 text-sm text-gray-700">Destacar recurso</span>
				</label>
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
					Creando...
				{:else}
					<i class="fas fa-save mr-2"></i>
					Crear Recurso
				{/if}
			</button>
		</div>
	</form>
</div>