<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { MediaType } from '$lib/data/models/library';
	import { SUPPORTED_MEDIA_TYPES, MAX_FILE_SIZES } from '$lib/data/models/library';

	export let accept: string = '';
	export let maxSize: number = 0;
	export let mediaType: MediaType | null = null;
	export let currentFile: string | null = null;
	export let required: boolean = false;
	export let disabled: boolean = false;

	const dispatch = createEventDispatcher<{
		fileSelected: File;
		fileRemoved: void;
		error: string;
	}>();

	let selectedFile: File | null = null;
	let dragActive = false;
	let error = '';

	function validateFile(file: File): boolean {
		error = '';

		// Validar tipo de archivo
		if (accept && !accept.split(',').some(type => file.type.includes(type.trim()))) {
			error = 'Tipo de archivo no soportado';
			return false;
		}

		// Validar tamaño si se especifica
		if (maxSize && file.size > maxSize) {
			const maxSizeMB = Math.round(maxSize / (1024 * 1024));
			error = `El archivo es demasiado grande. Máximo ${maxSizeMB}MB`;
			return false;
		}

		// Validar según tipo de media si se especifica
		if (mediaType) {
			const supportedTypes = SUPPORTED_MEDIA_TYPES[mediaType];
			if (!supportedTypes.includes(file.type)) {
				error = `Tipo de archivo no soportado para ${mediaType}`;
				return false;
			}

			const maxMediaSize = MAX_FILE_SIZES[mediaType];
			if (file.size > maxMediaSize) {
				const maxSizeMB = Math.round(maxMediaSize / (1024 * 1024));
				error = `El archivo es demasiado grande para ${mediaType}. Máximo ${maxSizeMB}MB`;
				return false;
			}
		}

		return true;
	}

	function handleFileSelect(file: File) {
		if (validateFile(file)) {
			selectedFile = file;
			dispatch('fileSelected', file);
		} else {
			dispatch('error', error);
		}
	}

	function handleFileInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			handleFileSelect(file);
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragActive = false;
		
		if (disabled) return;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			handleFileSelect(files[0]);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (!disabled) {
			dragActive = true;
		}
	}

	function handleDragLeave() {
		dragActive = false;
	}

	function removeFile() {
		selectedFile = null;
		error = '';
		dispatch('fileRemoved');
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function getFileIcon(type: string): string {
		if (type.startsWith('image/')) return 'fas fa-image text-blue-500';
		if (type.startsWith('video/')) return 'fas fa-play-circle text-purple-500';
		if (type.startsWith('audio/')) return 'fas fa-volume-up text-green-500';
		if (type === 'application/pdf') return 'fas fa-file-pdf text-red-500';
		if (type.includes('document') || type.includes('word')) return 'fas fa-file-alt text-blue-500';
		return 'fas fa-file text-gray-500';
	}
</script>

<div class="space-y-4">
	<!-- Drag and drop area -->
	<div
		class="relative border-2 border-dashed rounded-lg p-6 transition-colors"
		class:border-gray-300={!dragActive && !error}
		class:bg-gray-50={!dragActive && !error}
		class:border-indigo-400={dragActive && !disabled}
		class:bg-indigo-50={dragActive && !disabled}
		class:border-red-300={error}
		class:bg-red-50={error}
		class:opacity-50={disabled}
		on:drop={handleDrop}
		on:dragover={handleDragOver}
		on:dragleave={handleDragLeave}
	>
		<input
			type="file"
			{accept}
			{required}
			{disabled}
			on:change={handleFileInput}
			class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
			class:cursor-not-allowed={disabled}
		>

		<div class="text-center">
			{#if selectedFile}
				<!-- Archivo seleccionado -->
				<div class="flex items-center justify-center gap-3 mb-4">
					<i class="{getFileIcon(selectedFile.type)} text-2xl"></i>
					<div class="text-left">
						<p class="text-sm font-medium text-gray-900">{selectedFile.name}</p>
						<p class="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
					</div>
					<button
						type="button"
						on:click={removeFile}
						class="ml-2 text-gray-400 hover:text-red-500"
						title="Eliminar archivo"
					>
						<i class="fas fa-times"></i>
					</button>
				</div>
			{:else if currentFile}
				<!-- Archivo actual (para edición) -->
				<div class="flex items-center justify-center gap-3 mb-4">
					<i class="fas fa-file text-2xl text-gray-400"></i>
					<div class="text-left">
						<p class="text-sm font-medium text-gray-700">Archivo actual</p>
						<p class="text-xs text-gray-500">{currentFile}</p>
					</div>
				</div>
			{/if}

			<div class="space-y-2">
				<i class="fas fa-cloud-upload-alt text-3xl text-gray-400"></i>
				<div>
					<p class="text-sm text-gray-600">
						{#if disabled}
							Carga de archivos deshabilitada
						{:else if selectedFile}
							Archivo seleccionado - Arrastra otro archivo para reemplazar
						{:else}
							<span class="font-medium text-indigo-600">Haz clic para seleccionar</span>
							o arrastra un archivo aquí
						{/if}
					</p>
					{#if accept}
						<p class="text-xs text-gray-500 mt-1">
							Archivos soportados: {accept.replace(/\./g, '').toUpperCase()}
						</p>
					{/if}
					{#if maxSize}
						<p class="text-xs text-gray-500">
							Tamaño máximo: {formatFileSize(maxSize)}
						</p>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Error message -->
	{#if error}
		<div class="flex items-center gap-2 text-sm text-red-600">
			<i class="fas fa-exclamation-circle"></i>
			<span>{error}</span>
		</div>
	{/if}

	<!-- Preview for images -->
	{#if selectedFile && selectedFile.type.startsWith('image/')}
		<div class="mt-4">
			<img
				src={URL.createObjectURL(selectedFile)}
				alt="Preview"
				class="max-w-full h-48 object-cover rounded-lg border"
			>
		</div>
	{/if}
</div>