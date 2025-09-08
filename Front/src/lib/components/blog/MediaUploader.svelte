<script lang="ts">
  import { onMount } from 'svelte';
  import { translate as paraglideT } from '$lib/paraglide/runtime';

  export let contentType: string; // 'blog', 'course', 'workitem', 'event'
  export let contentId: string;
  export let mediaType: string; // 'image', 'video', 'audio', 'pdf'
  export let onUploadComplete: ((mediaUrl: string) => void) | null = null;
  export let currentMedia = '';
  export let disabled = false;

  let t = (key: string) => key;
  let fileInput: HTMLInputElement;
  let isUploading = false;
  let uploadProgress = 0;
  let error: string | null = null;
  let previewUrl = currentMedia;

  onMount(() => {
    t = paraglideT;
  });

  function getAcceptedTypes() {
    switch (mediaType) {
      case 'image':
        return 'image/*';
      case 'video':
        return 'video/*';
      case 'audio':
        return 'audio/*';
      case 'pdf':
        return 'application/pdf';
      default:
        return '*/*';
    }
  }

  function validateFile(file: File): string | null {
    const validTypes: Record<string, string[]> = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/webm', 'video/mov'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
      pdf: ['application/pdf']
    };

    const maxSizes: Record<string, number> = {
      image: 20 * 1024 * 1024,    // 20MB
      video: 500 * 1024 * 1024,   // 500MB
      audio: 100 * 1024 * 1024,   // 100MB
      pdf: 50 * 1024 * 1024       // 50MB
    };

    if (!validTypes[mediaType]?.includes(file.type)) {
      return `Tipo de archivo no válido para ${mediaType}`;
    }

    if (file.size > maxSizes[mediaType]) {
      const maxSizeMB = Math.round(maxSizes[mediaType] / (1024 * 1024));
      return `Archivo muy grande (máx. ${maxSizeMB}MB para ${mediaType})`;
    }

    return null;
  }

  function handleFileSelect() {
    fileInput.click();
  }

  async function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      error = validationError;
      return;
    }

    await uploadFile(file);
  }

  async function uploadFile(file: File) {
    isUploading = true;
    error = null;
    uploadProgress = 0;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Create temporary file first (simulate file creation)
      const formData = new FormData();
      formData.append('file', file);

      // Use contextual upload endpoint
      const endpoint = `/api/upload/${contentType}/${contentId}/${mediaType}s`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-File-Path': URL.createObjectURL(file) // Temporary - backend should handle this differently
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Backend returns the media info
      previewUrl = result.url || result.relativePath;
      
      if (onUploadComplete) {
        onUploadComplete(previewUrl);
      }

      uploadProgress = 100;
    } catch (err: any) {
      error = err.message || 'Error al subir el archivo';
      console.error('Upload error:', err);
    } finally {
      isUploading = false;
    }
  }

  function handleRemove() {
    previewUrl = '';
    if (onUploadComplete) {
      onUploadComplete('');
    }
    if (fileInput) {
      fileInput.value = '';
    }
  }

  function getMediaIcon() {
    switch (mediaType) {
      case 'image':
        return 'fas fa-image';
      case 'video':
        return 'fas fa-video';
      case 'audio':
        return 'fas fa-music';
      case 'pdf':
        return 'fas fa-file-pdf';
      default:
        return 'fas fa-file';
    }
  }

  function isImage(url: string) {
    return mediaType === 'image' || url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  }

  function isVideo(url: string) {
    return mediaType === 'video' || url.match(/\.(mp4|webm|mov)$/i);
  }

  function isAudio(url: string) {
    return mediaType === 'audio' || url.match(/\.(mp3|wav|ogg)$/i);
  }

  function isPdf(url: string) {
    return mediaType === 'pdf' || url.match(/\.pdf$/i);
  }
</script>

<div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
  <!-- Input file oculto -->
  <input
    bind:this={fileInput}
    type="file"
    accept={getAcceptedTypes()}
    on:change={handleFileChange}
    class="hidden"
    {disabled}
  />

  {#if previewUrl}
    <!-- Preview del archivo actual -->
    <div class="mb-4">
      {#if isImage(previewUrl)}
        <img src={previewUrl} alt="Preview" class="w-full max-w-md mx-auto rounded" />
      {:else if isVideo(previewUrl)}
        <video class="w-full max-w-md mx-auto rounded" controls>
          <source src={previewUrl} type="video/mp4">
          Video no soportado
        </video>
      {:else if isAudio(previewUrl)}
        <audio class="w-full max-w-md mx-auto" controls>
          <source src={previewUrl} type="audio/mpeg">
          Audio no soportado
        </audio>
      {:else if isPdf(previewUrl)}
        <div class="text-center p-4 bg-gray-50 rounded">
          <i class="fas fa-file-pdf text-red-500 text-4xl mb-2"></i>
          <p class="text-sm text-gray-600">Documento PDF</p>
          <a href={previewUrl} target="_blank" class="text-blue-600 hover:underline text-sm">
            Ver documento
          </a>
        </div>
      {:else}
        <div class="text-center p-4 bg-gray-50 rounded">
          <i class="{getMediaIcon()} text-gray-500 text-4xl mb-2"></i>
          <p class="text-sm text-gray-600">Archivo subido</p>
        </div>
      {/if}
      
      <div class="text-center mt-2">
        <button
          type="button"
          on:click={handleRemove}
          class="text-red-600 hover:text-red-800 text-sm"
          {disabled}
        >
          <i class="fas fa-trash mr-1"></i>
          Eliminar
        </button>
      </div>
    </div>
  {/if}

  {#if isUploading}
    <!-- Estado de carga -->
    <div class="text-center">
      <div class="mb-2">
        <i class="fas fa-cloud-upload-alt text-indigo-500 text-3xl"></i>
      </div>
      <p class="text-sm text-gray-600 mb-2">
        Subiendo {mediaType}...
      </p>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div class="bg-indigo-600 h-2 rounded-full transition-all" style="width: {uploadProgress}%"></div>
      </div>
    </div>
  {:else if !previewUrl}
    <!-- Zona de drop/selección -->
    <div class="text-center">
      <div class="mb-4">
        <i class="{getMediaIcon()} text-gray-400 text-4xl"></i>
      </div>
      <p class="text-sm text-gray-600 mb-2">
        Selecciona un archivo de {mediaType}
      </p>
      <p class="text-xs text-gray-500 mb-4">
        {#if mediaType === 'image'}
          Formatos: JPG, PNG, GIF, WebP (máx. 20MB)
        {:else if mediaType === 'video'}
          Formatos: MP4, WebM, MOV (máx. 500MB)
        {:else if mediaType === 'audio'}
          Formatos: MP3, WAV, OGG (máx. 100MB)
        {:else if mediaType === 'pdf'}
          Formato: PDF (máx. 50MB)
        {/if}
      </p>
      <button
        type="button"
        on:click={handleFileSelect}
        class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
        {disabled}
      >
        Seleccionar {mediaType}
      </button>
    </div>
  {:else}
    <!-- Cambiar archivo -->
    <div class="text-center">
      <button
        type="button"
        on:click={handleFileSelect}
        class="text-indigo-600 hover:text-indigo-800 text-sm"
        {disabled}
      >
        <i class="fas fa-exchange-alt mr-1"></i>
        Cambiar {mediaType}
      </button>
    </div>
  {/if}

  {#if error}
    <div class="mt-3 p-2 bg-red-50 border border-red-200 rounded">
      <p class="text-red-700 text-sm">{error}</p>
    </div>
  {/if}
</div>