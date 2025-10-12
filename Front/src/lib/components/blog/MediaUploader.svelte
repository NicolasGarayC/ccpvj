<script lang="ts">
  import { t } from '$lib/i18n';

  export let contentType: string; // 'blog', 'course', 'post', 'event' (legacy: 'workitem')
  export let contentId: string;
  export let mediaType: string; // 'image', 'video', 'audio', 'pdf'
  export let onUploadComplete: ((mediaUrl: string) => void) | null = null;
  export let onRemoveComplete: (() => void) | null = null;
  export let currentMedia = '';
  export let disabled = false;

  let fileInput: HTMLInputElement;
  let isUploading = false;
  let uploadProgress = 0;
  let error: string | null = null;
  let previewUrl = currentMedia;


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
      case 'document':
        return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';
      default:
        return '*/*';
    }
  }

  function validateFile(file: File): string | null {
    const validTypes: Record<string, string[]> = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'image/bmp', 'image/tiff'],
      video: ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/mkv'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/wave'],
      pdf: ['application/pdf'],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ]
    };

    const maxSizes: Record<string, number> = {
      image: 20 * 1024 * 1024,    // 20MB
      video: 500 * 1024 * 1024,   // 500MB
      audio: 100 * 1024 * 1024,   // 100MB
      pdf: 50 * 1024 * 1024,      // 50MB
      document: 1024 * 1024 * 1024 // 1GB
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
      // Create temporary file first (simulate file creation)
      const formData = new FormData();
      formData.append('file', file);

      // Use appropriate upload endpoint based on content type
      let endpoint: string;
      const headers: Record<string, string> = {};

      if (contentType === 'course' && mediaType === 'image') {
        endpoint = `/api/upload/course-images`;
        if (contentId) {
          headers['X-Course-ID'] = contentId;
        }
      } else if (mediaType === 'document') {
        // Handle documents with their own endpoint
        endpoint = `/api/upload/documents`;
        if (contentId) {
          headers['X-Element-ID'] = contentId;
        }
      } else {
        // Default to existing endpoints for other content types
        endpoint = `/api/upload/${mediaType}s`;
        if (contentId) {
          headers['X-Element-ID'] = contentId;
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        // TODO: Add JWT Bearer token when implemented
        headers,
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

  async function handleRemove() {
    // Si es material de apoyo y tiene un ID, eliminar desde el servidor
    if (contentType === 'course' && contentId && mediaType === 'image' && previewUrl) {
      try {
        const response = await fetch(`/api/material-apoyo/${contentId}/remove-image`, {
          method: 'DELETE',
          // TODO: Add JWT Bearer token when implemented
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al eliminar la imagen');
        }

        const result = await response.json();
        console.log('✅ Imagen eliminada del servidor:', result.message);

        // Limpiar la UI
        previewUrl = '';
        if (onUploadComplete) {
          onUploadComplete('');
        }
        if (fileInput) {
          fileInput.value = '';
        }

        // Llamar callback de eliminación para recargar página o actualizar datos
        if (onRemoveComplete) {
          onRemoveComplete();
        }

      } catch (err: any) {
        console.error('Error al eliminar imagen:', err);
        error = err.message || 'Error al eliminar la imagen';
        return; // No limpiar UI si hay error
      }
    } else {
      // Comportamiento original para otros tipos de contenido
      previewUrl = '';
      if (onUploadComplete) {
        onUploadComplete('');
      }
      if (fileInput) {
        fileInput.value = '';
      }

      if (onRemoveComplete) {
        onRemoveComplete();
      }
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
      case 'document':
        return 'fas fa-file-alt';
      default:
        return 'fas fa-file';
    }
  }

  function isImage(url: string) {
    return mediaType === 'image' || url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);
  }

  function isVideo(url: string) {
    return mediaType === 'video' || url.match(/\.(mp4|webm|mov|avi|mkv)$/i);
  }

  function isAudio(url: string) {
    return mediaType === 'audio' || url.match(/\.(mp3|wav|ogg|flac|aac)$/i);
  }

  function isPdf(url: string) {
    return mediaType === 'pdf' || url.match(/\.pdf$/i);
  }

  function isDocument(url: string) {
    return mediaType === 'document' || url.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i);
  }

  function getDocumentIcon(url: string) {
    if (url.match(/\.pdf$/i)) return 'fas fa-file-pdf text-red-500';
    if (url.match(/\.(doc|docx)$/i)) return 'fas fa-file-word text-blue-500';
    if (url.match(/\.(xls|xlsx)$/i)) return 'fas fa-file-excel text-green-500';
    if (url.match(/\.(ppt|pptx)$/i)) return 'fas fa-file-powerpoint text-orange-500';
    return 'fas fa-file-alt text-gray-500';
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
      {:else if isDocument(previewUrl)}
        <div class="text-center p-4 bg-gray-50 rounded">
          <i class="{getDocumentIcon(previewUrl)} text-4xl mb-2"></i>
          <p class="text-sm text-gray-600">
            {#if previewUrl.match(/\.pdf$/i)}
              Documento PDF
            {:else if previewUrl.match(/\.(doc|docx)$/i)}
              Documento Word
            {:else if previewUrl.match(/\.(xls|xlsx)$/i)}
              Hoja de Excel
            {:else if previewUrl.match(/\.(ppt|pptx)$/i)}
              Presentación PowerPoint
            {:else}
              Documento
            {/if}
          </p>
          <a href={previewUrl} target="_blank" class="text-blue-600 hover:underline text-sm">
            Descargar archivo
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
          Formatos: JPG, PNG, GIF, WebP, SVG, AVIF, BMP, TIFF (máx. 20MB)
        {:else if mediaType === 'video'}
          Formatos: MP4, WebM, MOV, AVI, MKV (máx. 500MB)
        {:else if mediaType === 'audio'}
          Formatos: MP3, WAV, OGG, FLAC, AAC (máx. 100MB)
        {:else if mediaType === 'pdf'}
          Formato: PDF (máx. 50MB)
        {:else if mediaType === 'document'}
          Formatos: PDF, Word (DOC/DOCX), Excel (XLS/XLSX), PowerPoint (PPT/PPTX) (máx. 1GB)
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