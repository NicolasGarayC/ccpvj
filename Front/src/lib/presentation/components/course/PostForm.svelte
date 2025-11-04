<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { modulePostService, type CreatePostDto, type UpdatePostDto } from '$lib/application/services/material-apoyo/ModulePostService';
	import { postElementService, type ElementType, type ElementWithFile } from '$lib/application/services/material-apoyo/PostElementService';
	import type { PostDetail } from '$lib/application/services/material-apoyo/ModulePostService';
	import type { PostElement } from '$lib/application/services/material-apoyo/PostElementService';
	import ContextualMediaUploader from '../upload/ContextualMediaUploader.svelte';
	import type { UploadResult } from '$lib/services/contextualUploadService';
	import { contextualUploadService } from '$lib/services/contextualUploadService';
	import { safeRandomUUID } from '$lib/utils/uuid';

	export let visible = false;
	export let moduleId: string;
	export let materialApoyoId: string;
	export let post: PostDetail | null = null;
	export let nextOrderNumber = 1;

	type PostMutationDetail = Record<string, unknown>;

	export let onCreated: ((detail: PostMutationDetail) => void) | undefined = undefined;
	export let onUpdated: ((detail: PostMutationDetail) => void) | undefined = undefined;
	export let onClose: (() => void) | undefined = undefined;

	const dispatch = createEventDispatcher();

	let isLoading = false;
	let errors: Record<string, string> = {};
	let isDragging = false;

	interface ElementBlock {
		id: string;
		elementType: ElementType;
		content?: string;
		file?: File;
		filePath?: string;
		fileName?: string;
		previewUrl?: string;
		orderNumber: number;
		isEditing?: boolean;
		isUploading?: boolean;
		uploadProgress?: number;
		uploadFileName?: string;
	}

	let formData = {
		title: '',
		orderNumber: nextOrderNumber
	};

	let elements: ElementBlock[] = [];
	let draggedIndex: number | null = null;

	// Track uploaded files for cleanup
let uploadedFiles: string[] = [];
let postSaved = false;

// Track uploading state to disable submit button
let isUploadingMedia = false;
let activeElementUpload: ElementBlock | null = null;

	$: isEdit = !!post;
	$: modalTitle = isEdit ? 'Editar Post' : 'Crear Nuevo Post';

	// Update order number for new posts when nextOrderNumber changes
$: if (!isEdit && nextOrderNumber) {
	formData.orderNumber = nextOrderNumber;
}

$: activeElementUpload = elements.find((elem) => elem.isUploading) ?? null;

	// Track when we need to load post data
	let loadedPostId: string | null = null;

	// Load post data when post prop changes and it's different from what we've loaded
	$: if (post && post.id !== loadedPostId && visible) {
		loadPostData(post);
		loadedPostId = post.id;
	} else if (!post && loadedPostId) {
		resetForm();
		loadedPostId = null;
	}

	async function loadPostData(postData: PostDetail) {
		formData = {
			title: postData.title || '',
			orderNumber: postData.orderNumber
		};

		// Load existing elements for editing
		try {
		const postElements = await postElementService.getElementsByPostId(postData.id);
		elements = postElements.map(elem => {
			const elementBlock: ElementBlock = {
				id: elem.id,
				elementType: elem.elementType as ElementType,
				content: elem.content || '',
				filePath: elem.filePath || '',
				fileName: elem.fileName || '',
				previewUrl: elem.filePath || '',
				orderNumber: elem.orderNumber,
				isEditing: false,
				isUploading: false,
				uploadProgress: 0,
				uploadFileName: undefined
			};
			return elementBlock;
		});
		} catch (error) {
			console.error('Error loading post elements:', error);
			elements = [];
		}
	}

	onMount(async () => {
		// Initial load is now handled by reactive statement
	});

	function resetForm() {
		formData = {
			title: '',
			orderNumber: nextOrderNumber
		};
		elements = [];
		errors = {};
		isLoading = false;
		draggedIndex = null;
		loadedPostId = null;
	}

	function validateForm(): boolean {
		errors = {};
		let hasErrors = false;

		if (!formData.title.trim()) {
			errors.title = '⚠️ El título es requerido';
			errors.general = '❌ Por favor completa todos los campos requeridos';
			hasErrors = true;
		}

		if (formData.orderNumber < 1) {
			errors.orderNumber = '⚠️ El orden debe ser mayor a 0';
			if (!errors.general) errors.general = '❌ Por favor corrige los errores en el formulario';
			hasErrors = true;
		}

		if (elements.length === 0) {
			errors.elements = '⚠️ Debe agregar al menos un elemento al post';
			if (!errors.general) errors.general = '❌ El post necesita contenido para ser publicado';
			hasErrors = true;
		}

		// Validate each element
		for (const element of elements) {
			if (element.elementType === 'title' || element.elementType === 'text') {
				if (!element.content?.trim()) {
					errors.elements = '⚠️ Los elementos de texto no pueden estar vacíos';
					if (!errors.general) errors.general = '❌ Algunos elementos están incompletos';
					hasErrors = true;
					break;
				}
			} else if (['image', 'video', 'audio'].includes(element.elementType)) {
				if (!element.file && !element.filePath) {
					errors.elements = '⚠️ Los elementos multimedia requieren un archivo';
					if (!errors.general) errors.general = '❌ Falta subir algunos archivos requeridos';
					hasErrors = true;
					break;
				}
			}
		}

		// Si hay errores, hacer scroll al primer campo con error y enfocarlo
		if (hasErrors) {
			setTimeout(() => {
				const errorBanner = document.querySelector('.error-banner');
				const firstErrorField = document.querySelector('.error');

				if (errorBanner) {
					errorBanner.scrollIntoView({ behavior: 'smooth', block: 'start' });
				} else if (firstErrorField) {
					firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
					if (firstErrorField instanceof HTMLInputElement || firstErrorField instanceof HTMLTextAreaElement) {
						firstErrorField.focus();
					}
				}
			}, 100);
		}

		return !hasErrors;
	}

	function validateTitleField() {
		if (!formData.title.trim()) {
			errors.title = '⚠️ El título es requerido';
		} else if (errors.title) {
			errors.title = '';
			// Also clear general error if this was the only issue
			if (errors.general && errors.general.includes('campos requeridos')) {
				errors.general = '';
			}
		}
	}

	function getFileLimit(elementType: ElementType): string {
		switch (elementType) {
			case 'video':
				return '5GB';
			case 'audio':
				return '500MB';
			case 'image':
				return '200MB';
			default:
				return '';
		}
	}

	function getFileLimitInfo(elementType: ElementType): string {
		const limit = getFileLimit(elementType);
		switch (elementType) {
			case 'video':
				return `Películas completas permitidas (hasta ${limit})`;
			case 'audio':
				return `Audios largos permitidos (hasta ${limit})`;
			case 'image':
				return `Imágenes de alta resolución (hasta ${limit})`;
			default:
				return '';
		}
	}

	async function handleSubmit() {
		if (!validateForm()) return;

		isLoading = true;
		errors = {};

		try {
			if (isEdit && post) {
				// Update basic post info
				const updateData: UpdatePostDto = {
					title: formData.title.trim(),
					orderNumber: formData.orderNumber
				};

				await modulePostService.updatePost(post.id, updateData);

				// Handle element updates efficiently without deleting all
				const existingElements = await postElementService.getElementsByPostId(post.id);
				const updatedElements: any[] = [];

				// Track which existing elements are still being used
				const usedElementIds = new Set();

				for (const elem of elements) {
					if (elem.file) {
						// New file uploaded - create new element with file
						const newElementData: ElementWithFile = {
							element: {
								postId: post.id,
								elementType: elem.elementType,
								content: elem.content,
								orderNumber: elem.orderNumber
							},
							file: elem.file
						};
						const createdElements = await postElementService.createElementsInBatch(post.id, [newElementData]);
						updatedElements.push(...createdElements);
					} else if (elem.id && existingElements.some(existing => existing.id === elem.id)) {
						// Existing element (verified to exist in database) - update only content/order if needed
						const updatedElement = await postElementService.updateElement({
							id: elem.id,
							elementType: elem.elementType,
							content: elem.content,
							orderNumber: elem.orderNumber,
							// Preserve existing file information
							filePath: elem.filePath,
							fileName: elem.fileName
						});
						updatedElements.push(updatedElement);
						usedElementIds.add(elem.id);
					} else {
						// New element without file (title, text) or element with temporary ID
						const newElementData: ElementWithFile = {
							element: {
								postId: post.id,
								elementType: elem.elementType,
								content: elem.content,
								orderNumber: elem.orderNumber
							},
							file: undefined
						};
						const createdElements = await postElementService.createElementsInBatch(post.id, [newElementData]);
						updatedElements.push(...createdElements);
					}
				}

				// Delete elements that are no longer used
				for (const existingElem of existingElements) {
					if (!usedElementIds.has(existingElem.id)) {
						await postElementService.deleteElement(existingElem.id);
					}
				}

				// Get updated post information and construct with multimedia paths from elements
				const updatedPostDetail = await modulePostService.getPost(post.id);

				// Extract multimedia paths from updated elements
				console.log('Updated elements:', updatedElements);
				const imagePath = updatedElements.find(e => e.elementType === 'image')?.filePath || null;
				const videoPath = updatedElements.find(e => e.elementType === 'video')?.filePath || null;
				const audioPath = updatedElements.find(e => e.elementType === 'audio')?.filePath || null;
				console.log('Extracted paths:', { imagePath, videoPath, audioPath });

				// Dispatch success with message and complete multimedia info
				const detail = {
					postId: post.id,
					message: `✅ Post "${formData.title}" actualizado exitosamente`,
					post: {
						...(updatedPostDetail || post),
						title: formData.title,
						orderNumber: formData.orderNumber,
						// Override with actual multimedia paths from elements
						imagePath,
						videoPath,
						audioPath
					}
				} satisfies PostMutationDetail;

				onUpdated?.(detail);
				dispatch('updated', detail);
			} else {
				// Create new post
				const createData: CreatePostDto = {
					title: formData.title.trim(),
					orderNumber: formData.orderNumber,
					moduleId: moduleId
				};

				const newPost = await modulePostService.createPost(createData);

				// Create elements
				const elementsWithFiles: ElementWithFile[] = elements.map(elem => ({
					element: {
						postId: newPost.id,
						elementType: elem.elementType,
						content: elem.content,
						orderNumber: elem.orderNumber,
						filePath: elem.filePath,
						fileName: elem.fileName
					},
					file: elem.file
				}));

				const createdElements = await postElementService.createElementsInBatch(newPost.id, elementsWithFiles);

				// Extract multimedia paths from created elements
				const imagePath = createdElements.find(e => e.elementType === 'image')?.filePath || null;
				const videoPath = createdElements.find(e => e.elementType === 'video')?.filePath || null;
				const audioPath = createdElements.find(e => e.elementType === 'audio')?.filePath || null;

				// Dispatch success with message and complete multimedia info
				const detail = {
					...newPost,
					message: `✅ Post "${formData.title}" creado exitosamente`,
					post: {
						...newPost,
						imagePath,
						videoPath,
						audioPath
					}
				} satisfies PostMutationDetail;

				onCreated?.(detail);
				dispatch('created', detail);
			}

			// Mark as saved successfully
			postSaved = true;
			handleClose();
		} catch (error) {
			console.error('Error saving post:', error);
			if (error instanceof Error) {
				if (error.message.includes('Authentication required')) {
					errors.general = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
				} else if (error.message.includes('permisos')) {
					errors.general = error.message;
				} else {
					errors.general = `Error al ${isEdit ? 'actualizar' : 'crear'} el post. Inténtalo de nuevo.`;
				}
			}
		} finally {
			isLoading = false;
		}
	}

	async function handleClose() {
		if (!isLoading) {
			// Cleanup orphan files if closing without saving
			if (!postSaved && uploadedFiles.length > 0) {
				await contextualUploadService.cleanupOrphanFiles(uploadedFiles);
			}

			// Reset state
			uploadedFiles = [];
			postSaved = false;

			resetForm();
			onClose?.();
			dispatch('close');
		}
	}

function handleBackdropClick(event: MouseEvent) {
	if (event.target === event.currentTarget) {
		handleClose();
	}
}

function handleBackdropKeydown(event: KeyboardEvent) {
	if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
		event.preventDefault();
		handleClose();
	}
}

	// Element management functions
	function addElement(type: ElementType) {
	const newElement: ElementBlock = {
		id: safeRandomUUID(),
		elementType: type,
		content: type === 'title' ? 'Nuevo título' : (type === 'text' ? 'Nuevo texto' : ''),
		orderNumber: elements.length + 1,
		isEditing: true,
		isUploading: false,
		uploadProgress: 0,
		uploadFileName: undefined
	};
		elements = [...elements, newElement];
	}

	async function removeElement(index: number) {
		const elementToRemove = elements[index];

		// If the element has an ID, it exists in the database and needs to be deleted via API
		if (elementToRemove.id && elementToRemove.id !== 'temp') {
			try {
				await postElementService.deleteElement(elementToRemove.id);
			} catch (error) {
				console.error('Error deleting element from database:', error);
				// You might want to show an error message to the user here
				return; // Don't remove from local array if database deletion failed
			}
		}

		// Remove from local array
		elements = elements.filter((_, i) => i !== index);
		// Reorder remaining elements
		elements = elements.map((elem, i) => ({ ...elem, orderNumber: i + 1 }));
	}

	function toggleEditElement(index: number) {
		elements[index].isEditing = !elements[index].isEditing;
		elements = [...elements];
	}

	function updateElementContent(index: number, content: string) {
		elements[index].content = content;
		elements = [...elements];
	}

function handleMediaUploadStart(index: number) {
	if (elements[index]) {
		elements[index].isUploading = true;
		elements[index].uploadProgress = 0;
		elements[index].uploadFileName = undefined;
		elements = [...elements];
	}
	isUploadingMedia = elements.some(elem => elem.isUploading);
}

function handleMediaUploadProgress(index: number, event: CustomEvent<{ progress: number; fileName: string; mediaType: string; size: number }>) {
	const { progress, fileName } = event.detail;
	if (elements[index]) {
		elements[index].uploadProgress = progress;
		elements[index].uploadFileName = fileName;
		elements = [...elements];
	}
}

	function handleMediaUpload(index: number, event: CustomEvent<UploadResult>) {
	const result = event.detail;

	if (elements[index]) {
		// Track uploaded file for potential cleanup
		if (!isEdit) {
			uploadedFiles.push(result.relativePath);
		}

		// Update element with uploaded file information
		elements[index].filePath = result.relativePath;
		elements[index].fileName = result.filename;
		elements[index].previewUrl = result.url;
		elements[index].file = undefined; // Clear the file object since it's uploaded
		elements[index].isUploading = false;
		elements[index].uploadProgress = 100;
		elements = [...elements];
	}

	// Upload finished (success)
	isUploadingMedia = elements.some(elem => elem.isUploading);
}

function handleMediaUploadError(index: number, event: CustomEvent<string>) {
	const error = event.detail;
	console.error(`Media upload error for element ${index}:`, error);

	// Upload finished (error)
	if (elements[index]) {
		elements[index].isUploading = false;
		elements[index].uploadProgress = 0;
	}
	isUploadingMedia = elements.some(elem => elem.isUploading);
}

	function handleRemoveMedia(index: number) {
	if (elements[index]) {
		// Clear all media-related properties
		elements[index].file = undefined;
		elements[index].previewUrl = '';
		elements[index].filePath = '';
		elements[index].fileName = '';
		elements[index].isUploading = false;
		elements[index].uploadProgress = 0;
		elements[index].uploadFileName = undefined;
		elements = [...elements];
	}
}

	// Drag and drop functions
	function handleDragStart(event: DragEvent, index: number) {
		draggedIndex = index;
		isDragging = true;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDrop(event: DragEvent, dropIndex: number) {
		event.preventDefault();
		isDragging = false;

		if (draggedIndex !== null && draggedIndex !== dropIndex) {
			const draggedElement = elements[draggedIndex];
			elements.splice(draggedIndex, 1);
			elements.splice(dropIndex, 0, draggedElement);

			// Update order numbers
			elements = elements.map((elem, i) => ({ ...elem, orderNumber: i + 1 }));
		}

		draggedIndex = null;
	}

	function handleDragEnd() {
		isDragging = false;
		draggedIndex = null;
	}
</script>

{#if visible}
	<div
		class="modal-overlay"
		role="button"
		tabindex="0"
		aria-label="Cerrar formulario"
		on:click={handleBackdropClick}
		on:keydown={handleBackdropKeydown}
	>
		<div class="modal-content post-form-modal">
			<div class="modal-header">
				<h3>{modalTitle}</h3>
			<button class="btn-close" on:click={handleClose} disabled={isLoading} aria-label="Cerrar formulario" title="Cerrar formulario">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<form on:submit|preventDefault={handleSubmit} class="modal-body">
				{#if errors.general}
					<div class="error-banner">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="15" y1="9" x2="9" y2="15"></line>
							<line x1="9" y1="9" x2="15" y2="15"></line>
						</svg>
						{errors.general}
					</div>
				{/if}

				<div class="form-grid">
					<!-- Basic Information -->
					<div class="form-section">
						<h4>Información del Post</h4>

						<div class="form-group">
							<label for="title">Título del Post *</label>
							<input
								id="title"
								type="text"
								bind:value={formData.title}
								placeholder="Título del post"
								disabled={isLoading}
								class:error={errors.title}
								on:blur={validateTitleField}
								on:input={() => { if (errors.title) errors.title = ''; if (errors.general) errors.general = ''; }}
							/>
							{#if errors.title}
								<span class="error-text">{errors.title}</span>
							{/if}
						</div>

						<div class="form-group">
							<label for="orderNumber">Orden *</label>
							<input
								id="orderNumber"
								type="number"
								bind:value={formData.orderNumber}
								min="1"
								disabled={isLoading}
								class:error={errors.orderNumber}
							/>
							{#if errors.orderNumber}
								<span class="error-text">{errors.orderNumber}</span>
							{/if}
						</div>
					</div>

					<!-- Dynamic Content Elements -->
					<div class="form-section">
						<div class="section-header">
							<h4>Contenido del Post</h4>
							<div class="add-element-buttons">
								<button type="button" class="btn btn-sm btn-outline" on:click={() => addElement('title')} disabled={isLoading}>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M4 6h16M4 12h8m-8 6h16"></path>
									</svg>
									Título
								</button>
								<button type="button" class="btn btn-sm btn-outline" on:click={() => addElement('text')} disabled={isLoading}>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
										<polyline points="14,2 14,8 20,8"></polyline>
										<line x1="16" y1="13" x2="8" y2="13"></line>
										<line x1="16" y1="17" x2="8" y2="17"></line>
										<polyline points="10,9 9,9 8,9"></polyline>
									</svg>
									Texto
								</button>
								<button type="button" class="btn btn-sm btn-outline" on:click={() => addElement('image')} disabled={isLoading}>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
										<circle cx="8.5" cy="8.5" r="1.5"></circle>
										<polyline points="21,15 16,10 5,21"></polyline>
									</svg>
									Imagen
								</button>
								<button type="button" class="btn btn-sm btn-outline" on:click={() => addElement('video')} disabled={isLoading}>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<polygon points="23 7 16 12 23 17 23 7"></polygon>
										<rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
									</svg>
									Video
								</button>
								<button type="button" class="btn btn-sm btn-outline" on:click={() => addElement('audio')} disabled={isLoading}>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
									</svg>
									Audio
								</button>
							</div>
						</div>

						{#if errors.elements}
							<div class="error-text">{errors.elements}</div>
						{/if}

						{#if elements.length === 0}
							<div class="empty-elements">
								<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
									<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
									<line x1="16" y1="2" x2="16" y2="6"></line>
									<line x1="8" y1="2" x2="8" y2="6"></line>
									<line x1="3" y1="10" x2="21" y2="10"></line>
								</svg>
								<p>Agrega elementos para crear el contenido de tu post</p>
								<p class="hint">Puedes agregar títulos, texto, imágenes, videos y audios en cualquier orden</p>
							</div>
						{:else}
							<div class="elements-list" class:dragging={isDragging}>
								{#each elements as element, index (element.id)}
							<div
								class="element-block element-{element.elementType}"
								class:is-editing={element.isEditing}
								class:is-dragged={draggedIndex === index}
								draggable="true"
								on:dragstart={(e) => handleDragStart(e, index)}
								on:dragover={handleDragOver}
								on:drop={(e) => handleDrop(e, index)}
								on:dragend={handleDragEnd}
								role="listitem"
							>
										<div class="element-header">
											<div class="element-type-info">
												<div class="element-type-badge">
													{element.elementType === 'title' ? 'Título' :
													 element.elementType === 'text' ? 'Texto' :
													 element.elementType === 'image' ? 'Imagen' :
													 element.elementType === 'video' ? 'Video' : 'Audio'}
												</div>
												{#if ['image', 'video', 'audio'].includes(element.elementType)}
													<div class="file-limit-info">
														{getFileLimitInfo(element.elementType)}
													</div>
												{/if}
											</div>
											<div class="element-order"># {element.orderNumber}</div>
											<div class="element-actions">
						<button
							type="button"
							class="btn-icon"
							on:click={() => toggleEditElement(index)}
							disabled={isLoading}
							title={element.isEditing ? 'Guardar elemento' : 'Editar elemento'}
							aria-label={element.isEditing ? 'Guardar elemento' : 'Editar elemento'}
						>
													{#if element.isEditing}
														<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
															<polyline points="20,6 9,17 4,12"></polyline>
														</svg>
													{:else}
														<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
															<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
														</svg>
													{/if}
												</button>
						<button
							type="button"
							class="btn-icon btn-danger"
							on:click={() => removeElement(index)}
							disabled={isLoading}
							title="Eliminar elemento"
							aria-label="Eliminar elemento"
						>
													<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
														<polyline points="3,6 5,6 21,6"></polyline>
														<path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
													</svg>
												</button>
												<div class="drag-handle">
													<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
														<line x1="3" y1="6" x2="21" y2="6"></line>
														<line x1="3" y1="12" x2="21" y2="12"></line>
														<line x1="3" y1="18" x2="21" y2="18"></line>
													</svg>
												</div>
											</div>
										</div>

										<div class="element-content">
											{#if element.elementType === 'title' || element.elementType === 'text'}
												{#if element.isEditing}
													{#if element.elementType === 'title'}
														<input
															type="text"
															value={element.content || ''}
															on:input={(e) => updateElementContent(index, e.currentTarget.value)}
															placeholder="Ingresa el título..."
															class="element-input title-input"
														/>
													{:else}
														<textarea
															value={element.content || ''}
															on:input={(e) => updateElementContent(index, e.currentTarget.value)}
															placeholder="Ingresa el texto..."
															class="element-input text-input"
															rows="4"
														></textarea>
													{/if}
												{:else}
													<div class="element-preview {element.elementType}-preview">
														{element.content || 'Sin contenido'}
													</div>
												{/if}
											{:else if ['image', 'video', 'audio'].includes(element.elementType)}
												<div class="media-uploader-container">
								<ContextualMediaUploader
									context="post"
									mediaType={element.elementType}
									materialApoyoId={materialApoyoId}
									moduleId={moduleId}
									postId={post ? String(post.id) : 'temp'}
									currentMedia={element.filePath || ''}
									disabled={isLoading}
									label=""
									on:uploadStart={() => handleMediaUploadStart(index)}
									on:uploadSuccess={(e) => handleMediaUpload(index, e)}
									on:uploadError={(e) => handleMediaUploadError(index, e)}
									on:mediaRemoved={() => handleRemoveMedia(index)}
									on:uploadProgress={(e) => handleMediaUploadProgress(index, e)}
								/>

								{#if element.isUploading}
									<div class="element-upload-status">
										<div class="element-status-text">
											<span>Subiendo {element.uploadFileName || 'archivo'}...</span>
											<strong>{Math.round(element.uploadProgress ?? 0)}%</strong>
										</div>
										<div class="element-status-bar">
											<div class="element-status-bar-fill" style={`width: ${Math.round(element.uploadProgress ?? 0)}%;`}></div>
										</div>
									</div>
								{/if}
								{#if !post?.id}
									<p class="media-upload-hint">
										💡 Los archivos se organizarán automáticamente cuando guardes el post.
									</p>
								{/if}
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<div class="modal-footer">
					<button type="button" class="btn btn-outline" on:click={handleClose} disabled={isLoading}>
						Cancelar
					</button>
					<button type="submit" class="btn btn-primary" disabled={isLoading || isUploadingMedia}>
				{#if isLoading}
					<div class="loading-spinner"></div>
					{isEdit ? 'Actualizando...' : 'Creando...'}
				{:else if isUploadingMedia}
				<div class="loading-spinner"></div>
				{#if activeElementUpload}
					Subiendo {activeElementUpload.uploadFileName || 'archivo'}... {Math.round(activeElementUpload.uploadProgress ?? 0)}%
				{:else}
					Subiendo archivo...
				{/if}
				{:else}
					{isEdit ? 'Actualizar Post' : 'Crear Post'}
				{/if}
			</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.post-form-modal {
		max-width: 800px;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem 2rem;
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.btn-close {
		background: none;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.btn-close:hover:not(:disabled) {
		background: var(--color-background-muted);
		color: var(--color-text-primary);
	}

	.btn-close:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 0;
	}

	.form-grid {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: 2rem;
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-section h4 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text-primary);
		border-bottom: 2px solid var(--color-primary);
		padding-bottom: 0.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 500;
		color: var(--color-text-primary);
		font-size: 0.9rem;
	}

	.form-group input,
	.form-group textarea {
		padding: 0.75rem;
		border: 2px solid var(--color-border);
		border-radius: 8px;
		font-size: 0.9rem;
		transition: border-color 0.2s ease;
		font-family: inherit;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.form-group input:disabled,
	.form-group textarea:disabled {
		background: var(--color-background-muted);
		cursor: not-allowed;
		opacity: 0.7;
	}

	.form-group input.error {
		border-color: var(--color-danger);
		border-width: 2px;
		background: #fef2f2;
		animation: shake 0.3s ease-in-out;
	}

	.form-group textarea {
		resize: vertical;
		min-height: 120px;
		line-height: 1.5;
	}

	.error-text {
		color: var(--color-danger);
		font-size: 0.85rem;
		font-weight: 600;
		margin-top: 0.5rem;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		animation: fadeInShake 0.4s ease-out;
	}

	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		background: #fef2f2;
		color: #991b1b;
		border: 2px solid #fca5a5;
		border-left: 4px solid var(--color-danger);
		border-radius: 8px;
		font-size: 0.95rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.1);
		animation: slideInFromTop 0.4s ease-out;
	}




	.remove-media {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		border: none;
		border-radius: 50%;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.remove-media:hover {
		background: rgba(0, 0, 0, 0.9);
	}

	.media-container {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.file-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: var(--color-background-muted);
		border-radius: 6px;
		font-size: 0.85rem;
	}

	.file-name {
		font-weight: 500;
		color: var(--color-text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 200px;
	}

	.file-status {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		flex-shrink: 0;
		margin-left: 0.75rem;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.5rem 2rem;
		border-top: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border: 2px solid transparent;
		border-radius: 8px;
		font-weight: 500;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;
		justify-content: center;
		min-width: 120px;
	}

	.btn-outline {
		background: transparent;
		color: var(--color-text-muted);
		border-color: var(--color-border);
	}

	.btn-outline:hover:not(:disabled) {
		color: var(--color-text-primary);
		border-color: var(--color-text-muted);
	}

	.btn-primary {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--color-primary-dark);
		border-color: var(--color-primary-dark);
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.modal-content {
			margin: 0;
			max-width: none;
			height: 100vh;
			border-radius: 0;
		}

		.modal-header,
		.modal-footer {
			padding: 1rem 1.5rem;
		}

		.form-grid {
			padding: 1.5rem;
		}

		.form-section {
			gap: 1rem;
		}

	}

	/* Dynamic Elements Styles */
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.add-element-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.btn-sm {
		padding: 0.5rem 0.75rem;
		font-size: 0.8rem;
		min-width: auto;
	}

	.empty-elements {
		text-align: center;
		padding: 3rem 2rem;
		color: var(--color-text-muted);
		background: var(--color-background-subtle);
		border-radius: 12px;
		border: 2px dashed var(--color-border);
	}

	.empty-elements svg {
		opacity: 0.5;
		margin-bottom: 1rem;
	}

	.empty-elements p {
		margin: 0.5rem 0;
		font-size: 1rem;
	}

	.empty-elements .hint {
		font-size: 0.875rem;
		opacity: 0.8;
	}

	.elements-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.elements-list.dragging {
		cursor: grabbing;
	}

	.element-block {
		background: var(--color-background-subtle);
		border: 2px solid var(--color-border);
		border-radius: 12px;
		padding: 1rem;
		transition: all 0.2s ease;
		cursor: grab;
	}

	.element-block:hover {
		border-color: var(--color-primary);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.element-block.is-dragged {
		opacity: 0.5;
		transform: rotate(2deg);
		cursor: grabbing;
	}

	.element-block.is-editing {
		border-color: var(--color-primary);
		background: white;
	}

	.element-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
		gap: 0.75rem;
	}

	.element-type-badge {
		background: var(--color-primary);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.element-order {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		font-weight: 500;
		min-width: fit-content;
	}

	.element-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn-icon {
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 0.375rem;
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-icon:hover:not(:disabled) {
		background: var(--color-background-muted);
		color: var(--color-text-primary);
		border-color: var(--color-text-muted);
	}

	.btn-icon.btn-danger:hover:not(:disabled) {
		background: var(--color-danger-light);
		color: var(--color-danger-dark);
		border-color: var(--color-danger);
	}

	.btn-icon:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.drag-handle {
		color: var(--color-text-muted);
		cursor: grab;
		padding: 0.25rem;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.drag-handle:hover {
		background: var(--color-background-muted);
		color: var(--color-text-primary);
	}

	.element-content {
		min-height: 2.5rem;
	}

	.element-input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid var(--color-border);
		border-radius: 8px;
		font-size: 0.9rem;
		transition: border-color 0.2s ease;
		font-family: inherit;
		resize: vertical;
	}

	.element-input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.title-input {
		font-size: 1.1rem;
		font-weight: 600;
	}

	.text-input {
		min-height: 100px;
		line-height: 1.5;
	}

	.element-preview {
		padding: 0.75rem;
		border: 2px dashed var(--color-border-light);
		border-radius: 8px;
		color: var(--color-text-muted);
		min-height: 2.5rem;
		display: flex;
		align-items: center;
	}

	.element-preview.title-preview {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.element-preview.text-preview {
		line-height: 1.5;
		color: var(--color-text-primary);
		white-space: pre-wrap;
		align-items: flex-start;
		min-height: 3rem;
	}

	.element-file-input {
		width: 100%;
		padding: 1rem;
		border: 2px dashed var(--color-border);
		border-radius: 8px;
		background: var(--color-background-subtle);
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: center;
	}

	.element-file-input:hover:not(:disabled) {
		border-color: var(--color-primary);
		background: var(--color-primary-light);
	}

	.media-uploader-container {
		width: 100%;
	}

	.media-upload-hint {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		font-style: italic;
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: var(--color-background-muted);
		border-radius: 6px;
		text-align: center;
	}

	.element-upload-status {
		margin-top: 0.75rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-primary, #6366f1);
		background: var(--color-primary-lightest, rgba(129, 140, 248, 0.08));
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.element-status-text {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
		color: var(--color-text-primary);
	}

	.element-status-bar {
		height: 6px;
		background: rgba(99, 102, 241, 0.2);
		border-radius: 999px;
		overflow: hidden;
	}

	.element-status-bar-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-primary, #6366f1), #a855f7);
		border-radius: inherit;
		transition: width 0.2s ease;
	}

	@media (max-width: 768px) {
		.section-header {
			flex-direction: column;
			align-items: stretch;
		}

		.add-element-buttons {
			justify-content: center;
		}

		.element-header {
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		.element-actions {
			gap: 0.25rem;
		}

		.empty-elements {
			padding: 2rem 1rem;
		}
	}

	@media (max-width: 480px) {
		.modal-footer {
			flex-direction: column;
		}

		.btn {
			width: 100%;
		}

		.add-element-buttons {
			flex-direction: column;
		}

		.btn-sm {
			width: 100%;
			justify-content: center;
		}
	}

	/* Animations for better UX */
	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-5px); }
		75% { transform: translateX(5px); }
	}

	@keyframes fadeInShake {
		0% { opacity: 0; transform: translateY(-10px); }
		50% { opacity: 1; transform: translateY(-2px); }
		100% { opacity: 1; transform: translateY(0); }
	}

	@keyframes slideInFromTop {
		0% {
			opacity: 0;
			transform: translateY(-20px);
			max-height: 0;
		}
		100% {
			opacity: 1;
			transform: translateY(0);
			max-height: 100px;
		}
	}

	/* Element type information styling */
	.element-type-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.element-type-badge {
		display: inline-block;
		background: var(--color-primary);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.file-limit-info {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		font-weight: 500;
		font-style: italic;
		line-height: 1.2;
	}

	.element-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
		padding: 0.75rem 1rem;
		background: var(--color-background-subtle);
		border-radius: 8px;
		border: 1px solid var(--color-border);
	}

	.element-order {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
		background: var(--color-background-muted);
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
	}

	.element-actions {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}
</style>
