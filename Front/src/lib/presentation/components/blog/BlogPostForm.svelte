<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { blogService } from '$lib/application/services/blog/blogService';
	import {
		blogPostElementService,
		type CreateElementDto,
		type ElementType,
		type ElementWithFile
	} from '$lib/application/services/blog/blogPostElementService';
	import type { BlogPost } from '$lib/types/api';
	import type { BlogPostElementDto } from '$lib/types/api/blog.types';
	import ContextualMediaUploader from '../upload/ContextualMediaUploader.svelte';
	import { contextualUploadService, type UploadResult } from '$lib/application/services/upload/ContextualUploadService';
	import BlogEventRelation from './BlogEventRelation.svelte';
	import { calendarService } from '$lib/services/calendar/calendarService';
	import { safeRandomUUID } from '$lib/utils/uuid';

export let visible = false;
export let post: BlogPost | null = null;
export let nextOrderNumber = 1;
export let onClose: (() => void) | undefined;
export let onCreated: ((detail: { message: string; post: BlogPost }) => void) | undefined;
export let onUpdated: ((detail: { postId: string; message: string; post: BlogPost }) => void) | undefined;

	const dispatch = createEventDispatcher();

	let isLoading = false;
	let errors: Record<string, string> = {};
	let isDragging = false;

	// Track uploaded files for cleanup
	let uploadedFiles: string[] = [];
	let postSaved = false;

	// Track active uploads to disable submit button
	let activeUploads = 0;

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
	}

	let formData = {
		title: '',
		orderNumber: nextOrderNumber
	};

let elements: ElementBlock[] = [];
let draggedIndex: number | null = null;
let selectedEventIds: string[] = [];
let postStatus: 'draft' | 'published' = 'draft';

	$: isEdit = !!post;
	$: modalTitle = isEdit ? 'Editar Artículo' : 'Crear Nuevo Artículo';

	// Update order number for new posts when nextOrderNumber changes
	$: if (!isEdit && nextOrderNumber) {
		formData.orderNumber = nextOrderNumber;
	}

	// Track when we need to load post data
	let loadedPostId: string | null = null;

// Load post data when post prop changes and it's different from what we've loaded
$: if (post && visible) {
	const currentId = String(post.id);
	if (currentId !== loadedPostId) {
		loadPostData(post);
		loadedPostId = currentId;
	}
} else if (!post && loadedPostId) {
	resetForm();
	loadedPostId = null;
}

	async function loadPostData(postData: BlogPost) {
	formData = {
		title: postData.title || '',
		orderNumber: 0 // Blog posts don't use orderNumber like course posts
	};
	postStatus = (postData as any).status === 'published' || (postData as any).isPublished
		? 'published'
		: 'draft';

		// Load existing elements for editing
		try {
		const postElements = await blogPostElementService.getElementsByBlogPostId(String(postData.id));
			elements = postElements.map(elem => {
				const elementBlock: ElementBlock = {
					id: elem.id,
					elementType: elem.elementType as ElementType,
					content: elem.content || '',
					// IMPORTANT: Don't convert null/undefined to '' - preserve original values
					// This ensures that existing filePath values are maintained when editing
					filePath: elem.filePath || undefined,
					fileName: elem.fileName || undefined,
					previewUrl: elem.filePath || undefined,
					orderNumber: elem.orderNumber,
					isEditing: false
				};
				return elementBlock;
			});
		} catch (error) {
			console.error('Error loading blog post elements:', error);
			elements = [];
		}

		loadedPostId = String(postData.id);
	}

onMount(() => {
    // Initial load is now handled by reactive statement

    const handleSessionExpired = () => {
        console.log('🔒 Sesión expirada - cerrando modal de blog');
        // Forzar cierre sin limpiar archivos (la sesión ya expiró)
        postSaved = false;
        uploadedFiles = [];
        resetForm();
        dispatch('close');
        onClose?.();
    };

    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
        window.removeEventListener('session-expired', handleSessionExpired);
    };
});

function resetForm() {
	formData = {
		title: '',
		orderNumber: nextOrderNumber
	};
	postStatus = 'draft';
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

		if (elements.length === 0) {
			errors.elements = '⚠️ Debe agregar al menos un elemento al artículo';
			if (!errors.general) errors.general = '❌ El artículo necesita contenido para ser publicado';
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
			} else if (['image', 'video', 'audio', 'document'].includes(element.elementType)) {
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
			case 'document':
				return '1GB';
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
			case 'document':
				return `PDF, Word, Excel, PowerPoint (hasta ${limit})`;
			default:
				return '';
		}
	}

	async function handleSubmit() {
		if (!validateForm()) return;

		isLoading = true;
		errors = {};

	try {
		const combinedContent = elements
			.filter(elem => elem.elementType === 'text')
			.map(elem => elem.content?.trim() ?? '')
			.filter(Boolean)
			.join('\n\n');

		if (isEdit && post) {
			// Prepare element payload to send to backend (prevents media cleanup removing files)
			const elementsPayload = elements.map((elem, index) => {
				const payload: Record<string, unknown> = {
					blogPostId: String(post.id),
					elementType: elem.elementType,
					orderNumber: elem.orderNumber ?? index + 1,
					isActive: true
				};

					if (elem.content && elem.content.trim() !== '') {
						payload.content = elem.content.trim();
					}

					if (elem.filePath && elem.filePath.trim() !== '') {
						payload.filePath = elem.filePath;
						if (elem.fileName) {
							payload.fileName = elem.fileName;
						}
					}

					// Metadata is not currently supported on the form, but preserve structure for backend expectations
					payload.metadata = null;

					return payload;
				});

			const rawTags = (post as any)?.tags;
			const resolvedTags = Array.isArray(rawTags)
				? rawTags
				: typeof rawTags === 'string'
					? rawTags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
					: [];

			const resolvedCategoryId = post?.categoryId != null ? String(post.categoryId) : null;
			const updateData = {
				title: formData.title.trim(),
				excerpt: post?.excerpt ?? '',
				slug: post?.slug ?? '',
				status: postStatus,
				isPublished: postStatus === 'published',
				categoryId: resolvedCategoryId,
				featuredMedia: post?.featuredMedia ?? undefined,
				tags: resolvedTags,
				content: combinedContent,
				elements: elementsPayload as unknown as BlogPostElementDto[]
			};

			await blogService.updatePost(String(post.id), updateData);

			// Get updated post information
			const updatedPost = await blogService.getArticleById(String(post.id));

			// Update event relations if any were selected
			await updateEventRelations(String(post.id));

			// Dispatch success with message
			if (updatedPost) {
				const detail = {
					postId: String(post.id),
					message: `✅ Artículo "${formData.title}" actualizado exitosamente`,
					post: updatedPost
				};
				dispatch('updated', detail);
				onUpdated?.(detail);
			}
		} else {
			// Create new blog post
			const createData = {
				title: formData.title.trim(),
				excerpt: '',
				content: combinedContent,
				slug: '',
				status: postStatus,
				isPublished: postStatus === 'published',
				categoryId: null as string | null,
				tags: [] as string[]
			};

			const newPost = await blogService.createPost(createData);

			// Create elements
			const elementsWithFiles: ElementWithFile[] = elements.map(elem => ({
				element: {
					blogPostId: String(newPost.id),
					elementType: elem.elementType,
					content: elem.content,
					orderNumber: elem.orderNumber,
					filePath: elem.filePath,
					fileName: elem.fileName
				},
				file: elem.file
			}));

			await blogPostElementService.createElementsInBatch(String(newPost.id), elementsWithFiles);

			// Update event relations if any were selected
			await updateEventRelations(String(newPost.id));

			// Dispatch success with message
			const detail = {
				...newPost,
				message: `✅ Artículo "${formData.title}" creado exitosamente`,
				post: newPost
			};
			dispatch('created', detail);
			onCreated?.(detail);
		}

			// Mark as saved successfully
			postSaved = true;
			handleClose();
		} catch (error) {
			console.error('Error saving blog post:', error);
			if (error instanceof Error) {
				if (error.message.includes('Authentication required')) {
					errors.general = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
				} else if (error.message.includes('permisos')) {
					errors.general = error.message;
				} else if (error.message.includes('slug ya está en uso')) {
					errors.general = '⚠️ Ya existe un artículo con ese título. Por favor, usa un título diferente.';
				} else if (error.message.includes('slug')) {
					errors.general = '⚠️ Error con el título del artículo. Por favor, elige un título diferente.';
				} else {
					errors.general = `❌ ${error.message || `Error al ${isEdit ? 'actualizar' : 'crear'} el artículo`}`;
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
				console.log(`🧹 Modal closing without save - cleaning up ${uploadedFiles.length} orphan file(s)`);
				await contextualUploadService.cleanupOrphanFiles(uploadedFiles);
			}

			// Reset state
			uploadedFiles = [];
			postSaved = false;

			resetForm();
			dispatch('close');
			onClose?.();
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
			isEditing: true
		};
		elements = [...elements, newElement];
	}

	async function removeElement(index: number) {
		const elementToRemove = elements[index];

		// If the element has an ID and it's not a temporary UUID, it exists in the database
		if (elementToRemove.id && post?.id) {
			try {
				await blogPostElementService.deleteElement(elementToRemove.id);
				console.log(`✅ Element ${elementToRemove.id} deleted from database and filesystem`);
			} catch (error) {
				console.error('Error deleting element from database:', error);
				return; // Don't remove from local array if database deletion failed
			}
		} else if (elementToRemove.filePath && !post?.id) {
			// If it's a new element with an uploaded file that hasn't been saved to DB yet,
			// track it for cleanup when the modal closes
			uploadedFiles.push(elementToRemove.filePath);
			console.log(`🗑️ Marked orphan file for cleanup: ${elementToRemove.filePath}`);
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
		activeUploads++;
		console.log(`📤 Upload started for element ${index}. Active uploads: ${activeUploads}`);
	}

	function handleMediaUpload(index: number, event: CustomEvent<UploadResult>) {
		const result = event.detail;
		activeUploads = Math.max(0, activeUploads - 1);
		console.log(`✅ Upload completed for element ${index}. Active uploads: ${activeUploads}`);

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
			elements = [...elements];

			console.log(`✅ Media uploaded for element ${index}:`, result);
		}
	}

	function handleMediaUploadError(index: number, event: CustomEvent<string>) {
		const error = event.detail;
		activeUploads = Math.max(0, activeUploads - 1);
		console.error(`❌ Media upload error for element ${index}:`, error, `Active uploads: ${activeUploads}`);
	}

	function handleRemoveMedia(index: number) {
		if (elements[index]) {
			// Clear all media-related properties
			elements[index].file = undefined;
			elements[index].previewUrl = '';
			elements[index].filePath = '';
			elements[index].fileName = '';
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

	function handleEventChange(eventIds: string[]) {
		selectedEventIds = eventIds;
		console.log('📅 Eventos relacionados actualizados:', selectedEventIds);
	}

	async function updateEventRelations(blogPostId: string) {
		try {
			// Get events that were previously related to this blog post
			const previouslyRelatedEvents = await calendarService.getEventsByBlogPost(blogPostId);
			const previouslyRelatedIds = previouslyRelatedEvents.map(e => e.id);

			// Find events to remove (were related but no longer selected)
			const eventsToRemove = previouslyRelatedIds.filter(id => !selectedEventIds.includes(id));

			// Find events to add (are selected but weren't related before)
			const eventsToAdd = selectedEventIds.filter(id => !previouslyRelatedIds.includes(id));

			console.log(`📅 Actualizando relaciones: ${eventsToAdd.length} a agregar, ${eventsToRemove.length} a eliminar`);

			// Remove relations from events that are no longer selected
			for (const eventId of eventsToRemove) {
				const event = await calendarService.getEventById(eventId);
				if (!event) continue;

			await calendarService.updateEvent(eventId, {
				title: event.title,
				description: event.description,
				startDateTime: event.startDateTime,
				endDateTime: event.endDateTime,
				isAllDay: event.isAllDay,
					location: event.location,
					eventType: event.eventType,
					isFeatured: event.isFeatured,
					isRecurring: event.isRecurring,
					recurrencePattern: event.recurrencePattern,
					recurrenceInterval: event.recurrenceInterval,
					recurrenceEndDate: event.recurrenceEndDate,
					recurrenceDaysOfWeek: event.recurrenceDaysOfWeek,
					relatedProjectId: event.relatedProjectId,
					relatedBlogPostId: undefined // Remove the relation
				});

				console.log(`🗑️ Relación eliminada del evento "${event.title}"`);
			}

			// Add relations to newly selected events
			for (const eventId of eventsToAdd) {
				const event = await calendarService.getEventById(eventId);
				if (!event) {
					console.warn(`⚠️ Evento ${eventId} no encontrado, saltando...`);
					continue;
				}

			await calendarService.updateEvent(eventId, {
				title: event.title,
				description: event.description,
				startDateTime: event.startDateTime,
				endDateTime: event.endDateTime,
				isAllDay: event.isAllDay,
					location: event.location,
					eventType: event.eventType,
					isFeatured: event.isFeatured,
					isRecurring: event.isRecurring,
					recurrencePattern: event.recurrencePattern,
					recurrenceInterval: event.recurrenceInterval,
					recurrenceEndDate: event.recurrenceEndDate,
					recurrenceDaysOfWeek: event.recurrenceDaysOfWeek,
					relatedProjectId: event.relatedProjectId,
					relatedBlogPostId: blogPostId // Set the relation
				});

				console.log(`✅ Evento "${event.title}" relacionado con el blog post`);
			}
		} catch (error) {
			console.error('❌ Error actualizando relaciones de eventos:', error);
			// Don't throw - we don't want to fail the entire blog post save if event relations fail
		}
	}
</script>

{#if visible}
	<div class="modal-overlay" on:click={handleBackdropClick} on:keydown={handleBackdropKeydown} tabindex="-1" role="presentation">
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
						<h4>Información del Artículo</h4>

						<div class="form-group">
							<label for="title">Título del Artículo *</label>
							<input
								id="title"
								type="text"
								bind:value={formData.title}
								placeholder="Título del artículo"
								disabled={isLoading}
								class:error={errors.title}
								on:blur={validateTitleField}
								on:input={() => { if (errors.title) errors.title = ''; if (errors.general) errors.general = ''; }}
							/>
							{#if errors.title}
								<span class="error-text">{errors.title}</span>
							{/if}
						</div>
					</div>

					<div class="form-section">
						<h4>Estado de Publicación</h4>
						<div class="form-group">
							<label for="postStatus">Elige el estado</label>
							<select
								id="postStatus"
								bind:value={postStatus}
								disabled={isLoading}
							>
								<option value="draft">Borrador (no visible para visitantes)</option>
								<option value="published">Publicado (visible para todos)</option>
							</select>
							<p class="hint">Cambia a "Publicado" cuando quieras que el artículo sea público.</p>
						</div>
					</div>

					<!-- Dynamic Content Elements -->
					<div class="form-section">
						<div class="section-header">
							<h4>Contenido del Artículo</h4>
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
								<button type="button" class="btn btn-sm btn-outline" on:click={() => addElement('document')} disabled={isLoading}>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
										<polyline points="14,2 14,8 20,8"></polyline>
									</svg>
									Documento
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
								<p>Agrega elementos para crear el contenido de tu artículo</p>
								<p class="hint">Puedes agregar títulos, texto, imágenes, videos, audios y documentos en cualquier orden</p>
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
													 element.elementType === 'video' ? 'Video' :
													 element.elementType === 'audio' ? 'Audio' : 'Documento'}
												</div>
												{#if ['image', 'video', 'audio', 'document'].includes(element.elementType)}
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
											{:else if ['image', 'video', 'audio', 'document'].includes(element.elementType)}
												<div class="media-uploader-container">
								<ContextualMediaUploader
									context="blog"
									mediaType={element.elementType}
									blogPostId={post ? String(post.id) : 'temp'}
														currentMedia={element.filePath || ''}
														disabled={isLoading}
														label=""
														on:uploadStart={() => handleMediaUploadStart(index)}
														on:uploadSuccess={(e) => handleMediaUpload(index, e)}
														on:uploadError={(e) => handleMediaUploadError(index, e)}
														on:mediaRemoved={() => handleRemoveMedia(index)}
													/>
													{#if !post?.id}
														<p class="media-upload-hint">
															💡 Los archivos se organizarán automáticamente cuando guardes el artículo.
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

					<!-- Event Relations Section -->
					<div class="form-section">
						<h4>Eventos Relacionados</h4>
						<p class="section-description">
							Relaciona este artículo con eventos del calendario para que los visitantes puedan ver el contenido vinculado.
						</p>
						<BlogEventRelation
							blogPostId={post ? String(post.id) : undefined}
							onChange={handleEventChange}
							compact={false}
						/>
					</div>
				</div>

				<div class="modal-footer">
					<button type="button" class="btn btn-outline" on:click={handleClose} disabled={isLoading || activeUploads > 0}>
						Cancelar
					</button>
					<button type="submit" class="btn btn-primary" disabled={isLoading || activeUploads > 0}>
						{#if activeUploads > 0}
							<div class="loading-spinner"></div>
							Subiendo archivos... ({activeUploads})
						{:else if isLoading}
							<div class="loading-spinner"></div>
							{isEdit ? 'Actualizando...' : 'Creando...'}
						{:else}
							{isEdit ? 'Actualizar Artículo' : 'Crear Artículo'}
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Import the same styles from PostForm.svelte -->
<style>
	/* Reutilizar todos los estilos del PostForm.svelte */
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

	.section-description {
		margin: 0.5rem 0 1rem 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.5;
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
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
		padding: 0.75rem 1rem;
		background: var(--color-background-subtle);
		border-radius: 8px;
		border: 1px solid var(--color-border);
	}

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
</style>
