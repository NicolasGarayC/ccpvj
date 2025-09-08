<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { CreateEventData, EventDetail } from '$lib/services/calendar/calendarService';

	export let event: EventDetail | null = null;
	export let isEdit: boolean = false;
	export let availableCourses: Array<{ id: string; title: string }> = [];
	export let availableBlogPosts: Array<{ id: string; title: string; slug: string }> = [];

	const dispatch = createEventDispatcher<{
		save: { eventData: CreateEventData };
		cancel: void;
	}>();

	// Datos del formulario
	let formData: CreateEventData = {
		title: '',
		description: '',
		startDateTime: new Date(),
		endDateTime: undefined,
		isAllDay: false,
		location: '',
		eventType: 'General',
		isFeatured: false,
		maxAttendees: undefined,
		requiresRegistration: false,
		registrationDeadline: undefined,
		imagePath: '',
		pdfPath: '',
		isRecurring: false,
		recurrencePattern: '',
		recurrenceInterval: 1,
		recurrenceEndDate: undefined,
		recurrenceDaysOfWeek: '',
		relatedCourseId: '',
		relatedBlogPostId: ''
	};

	// Estado del formulario
	let isSubmitting = false;
	let errors: Record<string, string> = {};

	// Cargar datos del evento si es edición
	$: if (event && isEdit) {
		formData = {
			title: event.title,
			description: event.description || '',
			startDateTime: new Date(event.startDateTime),
			endDateTime: event.endDateTime ? new Date(event.endDateTime) : undefined,
			isAllDay: event.isAllDay,
			location: event.location || '',
			eventType: event.eventType,
			isFeatured: event.isFeatured,
			maxAttendees: event.maxAttendees,
			requiresRegistration: event.requiresRegistration,
			registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline) : undefined,
			imagePath: event.imagePath || '',
			pdfPath: event.pdfPath || '',
			isRecurring: event.isRecurring,
			recurrencePattern: event.recurrencePattern || '',
			recurrenceInterval: event.recurrenceInterval || 1,
			recurrenceEndDate: event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : undefined,
			recurrenceDaysOfWeek: event.recurrenceDaysOfWeek || '',
			relatedCourseId: event.relatedCourseId || '',
			relatedBlogPostId: event.relatedBlogPostId || ''
		};
	}

	// Opciones de formulario
	const eventTypes = [
		{ value: 'General', label: 'General' },
		{ value: 'Clase', label: 'Clase' },
		{ value: 'Taller', label: 'Taller' },
		{ value: 'Conferencia', label: 'Conferencia' },
		{ value: 'Evento', label: 'Evento Cultural' }
	];

	const recurrencePatterns = [
		{ value: '', label: 'No recurrente' },
		{ value: 'daily', label: 'Diario' },
		{ value: 'weekly', label: 'Semanal' },
		{ value: 'monthly', label: 'Mensual' },
		{ value: 'yearly', label: 'Anual' }
	];

	const daysOfWeek = [
		{ value: '1', label: 'Lunes' },
		{ value: '2', label: 'Martes' },
		{ value: '3', label: 'Miércoles' },
		{ value: '4', label: 'Jueves' },
		{ value: '5', label: 'Viernes' },
		{ value: '6', label: 'Sábado' },
		{ value: '0', label: 'Domingo' }
	];

	// Validaciones
	function validateForm(): boolean {
		errors = {};

		if (!formData.title.trim()) {
			errors.title = 'El título es obligatorio';
		}

		if (!formData.startDateTime) {
			errors.startDateTime = 'La fecha de inicio es obligatoria';
		}

		if (formData.endDateTime && formData.startDateTime && new Date(formData.endDateTime) <= new Date(formData.startDateTime)) {
			errors.endDateTime = 'La fecha de fin debe ser posterior a la fecha de inicio';
		}

		if (formData.requiresRegistration && formData.registrationDeadline && new Date(formData.registrationDeadline) >= new Date(formData.startDateTime)) {
			errors.registrationDeadline = 'La fecha límite de registro debe ser anterior al evento';
		}

		if (formData.isRecurring) {
			if (!formData.recurrencePattern) {
				errors.recurrencePattern = 'Debe seleccionar un patrón de recurrencia';
			}
			if (formData.recurrenceEndDate && new Date(formData.recurrenceEndDate) <= new Date(formData.startDateTime)) {
				errors.recurrenceEndDate = 'La fecha de fin de recurrencia debe ser posterior al evento';
			}
		}

		return Object.keys(errors).length === 0;
	}

	// Manejar cambios en isAllDay
	function handleAllDayChange() {
		if (formData.isAllDay) {
			// Si es todo el día, ajustar las horas
			const start = new Date(formData.startDateTime);
			start.setHours(0, 0, 0, 0);
			formData.startDateTime = start;

			if (formData.endDateTime) {
				const end = new Date(formData.endDateTime);
				end.setHours(23, 59, 59, 999);
				formData.endDateTime = end;
			}
		}
	}

	// Formatear fecha para input datetime-local
	function formatDateTimeLocal(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	}

	// Parsear fecha desde input datetime-local
	function parseDateTimeLocal(dateString: string): Date {
		return new Date(dateString);
	}

	// Manejar envío del formulario
	async function handleSubmit() {
		if (!validateForm()) return;

		isSubmitting = true;
		try {
			dispatch('save', { eventData: formData });
		} finally {
			isSubmitting = false;
		}
	}

	// Manejar cancelación
	function handleCancel() {
		dispatch('cancel');
	}

	// Manejar selección de días de la semana
	function handleDaySelection(day: string, checked: boolean) {
		const selectedDays = formData.recurrenceDaysOfWeek.split(',').filter(d => d);
		if (checked) {
			if (!selectedDays.includes(day)) {
				selectedDays.push(day);
			}
		} else {
			const index = selectedDays.indexOf(day);
			if (index > -1) {
				selectedDays.splice(index, 1);
			}
		}
		formData.recurrenceDaysOfWeek = selectedDays.join(',');
	}

	function isDaySelected(day: string): boolean {
		return formData.recurrenceDaysOfWeek.includes(day);
	}
</script>

<div class="bg-white rounded-lg shadow-lg overflow-hidden">
	<div class="px-6 py-4 border-b border-gray-200">
		<h2 class="text-xl font-semibold text-gray-900">
			{isEdit ? 'Editar Evento' : 'Crear Nuevo Evento'}
		</h2>
	</div>

	<form on:submit|preventDefault={handleSubmit} class="p-6 space-y-6">
		<!-- Información básica -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Título -->
			<div class="md:col-span-2">
				<label for="title" class="block text-sm font-medium text-gray-700 mb-2">
					Título <span class="text-red-500">*</span>
				</label>
				<input
					id="title"
					type="text"
					bind:value={formData.title}
					placeholder="Ingresa el título del evento"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
						{errors.title ? 'border-red-500' : ''}"
					required
				/>
				{#if errors.title}
					<p class="mt-1 text-sm text-red-600">{errors.title}</p>
				{/if}
			</div>

			<!-- Tipo de evento -->
			<div>
				<label for="eventType" class="block text-sm font-medium text-gray-700 mb-2">
					Tipo de Evento
				</label>
				<select
					id="eventType"
					bind:value={formData.eventType}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					{#each eventTypes as type}
						<option value={type.value}>{type.label}</option>
					{/each}
				</select>
			</div>

			<!-- Ubicación -->
			<div>
				<label for="location" class="block text-sm font-medium text-gray-700 mb-2">
					Ubicación
				</label>
				<input
					id="location"
					type="text"
					bind:value={formData.location}
					placeholder="Ej: Aula 1, Sala Principal"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
		</div>

		<!-- Descripción -->
		<div>
			<label for="description" class="block text-sm font-medium text-gray-700 mb-2">
				Descripción
			</label>
			<textarea
				id="description"
				bind:value={formData.description}
				rows="4"
				placeholder="Describe el evento, su contenido y objetivo"
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
			></textarea>
		</div>

		<!-- Fechas y horarios -->
		<div class="border border-gray-200 rounded-lg p-4">
			<h3 class="text-lg font-medium text-gray-900 mb-4">Fechas y Horarios</h3>

			<!-- Todo el día -->
			<div class="mb-4">
				<label class="flex items-center">
					<input
						type="checkbox"
						bind:checked={formData.isAllDay}
						on:change={handleAllDayChange}
						class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<span class="ml-2 text-sm font-medium text-gray-700">Evento de todo el día</span>
				</label>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Fecha de inicio -->
				<div>
					<label for="startDateTime" class="block text-sm font-medium text-gray-700 mb-2">
						Fecha de Inicio <span class="text-red-500">*</span>
					</label>
					<input
						id="startDateTime"
						type={formData.isAllDay ? 'date' : 'datetime-local'}
						value={formData.isAllDay ? 
							formData.startDateTime.toISOString().split('T')[0] : 
							formatDateTimeLocal(formData.startDateTime)}
						on:input={(e) => {
							if (formData.isAllDay) {
								const date = new Date(e.currentTarget.value);
								date.setHours(0, 0, 0, 0);
								formData.startDateTime = date;
							} else {
								formData.startDateTime = parseDateTimeLocal(e.currentTarget.value);
							}
						}}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
							{errors.startDateTime ? 'border-red-500' : ''}"
						required
					/>
					{#if errors.startDateTime}
						<p class="mt-1 text-sm text-red-600">{errors.startDateTime}</p>
					{/if}
				</div>

				<!-- Fecha de fin -->
				<div>
					<label for="endDateTime" class="block text-sm font-medium text-gray-700 mb-2">
						Fecha de Fin
					</label>
					<input
						id="endDateTime"
						type={formData.isAllDay ? 'date' : 'datetime-local'}
						value={formData.endDateTime ? 
							(formData.isAllDay ? 
								formData.endDateTime.toISOString().split('T')[0] : 
								formatDateTimeLocal(formData.endDateTime)) 
							: ''}
						on:input={(e) => {
							if (e.currentTarget.value) {
								if (formData.isAllDay) {
									const date = new Date(e.currentTarget.value);
									date.setHours(23, 59, 59, 999);
									formData.endDateTime = date;
								} else {
									formData.endDateTime = parseDateTimeLocal(e.currentTarget.value);
								}
							} else {
								formData.endDateTime = undefined;
							}
						}}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
							{errors.endDateTime ? 'border-red-500' : ''}"
					/>
					{#if errors.endDateTime}
						<p class="mt-1 text-sm text-red-600">{errors.endDateTime}</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Eventos recurrentes -->
		<div class="border border-gray-200 rounded-lg p-4">
			<div class="flex items-center mb-4">
				<input
					id="isRecurring"
					type="checkbox"
					bind:checked={formData.isRecurring}
					class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
				/>
				<label for="isRecurring" class="ml-2 text-sm font-medium text-gray-700">
					Evento recurrente
				</label>
			</div>

			{#if formData.isRecurring}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<!-- Patrón de recurrencia -->
					<div>
						<label for="recurrencePattern" class="block text-sm font-medium text-gray-700 mb-2">
							Patrón de Recurrencia
						</label>
						<select
							id="recurrencePattern"
							bind:value={formData.recurrencePattern}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
								{errors.recurrencePattern ? 'border-red-500' : ''}"
						>
							{#each recurrencePatterns.slice(1) as pattern}
								<option value={pattern.value}>{pattern.label}</option>
							{/each}
						</select>
						{#if errors.recurrencePattern}
							<p class="mt-1 text-sm text-red-600">{errors.recurrencePattern}</p>
						{/if}
					</div>

					<!-- Intervalo -->
					<div>
						<label for="recurrenceInterval" class="block text-sm font-medium text-gray-700 mb-2">
							Cada
						</label>
						<input
							id="recurrenceInterval"
							type="number"
							bind:value={formData.recurrenceInterval}
							min="1"
							max="52"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
						<p class="mt-1 text-xs text-gray-500">
							{#if formData.recurrencePattern === 'daily'}días{:else if formData.recurrencePattern === 'weekly'}semanas{:else if formData.recurrencePattern === 'monthly'}meses{:else if formData.recurrencePattern === 'yearly'}años{/if}
						</p>
					</div>

					<!-- Días de la semana (solo para semanal) -->
					{#if formData.recurrencePattern === 'weekly'}
						<div class="md:col-span-2">
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Días de la Semana
							</label>
							<div class="flex flex-wrap gap-2">
								{#each daysOfWeek as day}
									<label class="flex items-center">
										<input
											type="checkbox"
											checked={isDaySelected(day.value)}
											on:change={(e) => handleDaySelection(day.value, e.currentTarget.checked)}
											class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
										/>
										<span class="ml-1 text-sm text-gray-700">{day.label}</span>
									</label>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Fecha de fin de recurrencia -->
					<div class="md:col-span-2">
						<label for="recurrenceEndDate" class="block text-sm font-medium text-gray-700 mb-2">
							Fin de la Recurrencia
						</label>
						<input
							id="recurrenceEndDate"
							type="date"
							value={formData.recurrenceEndDate ? formData.recurrenceEndDate.toISOString().split('T')[0] : ''}
							on:input={(e) => {
								formData.recurrenceEndDate = e.currentTarget.value ? new Date(e.currentTarget.value) : undefined;
							}}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
								{errors.recurrenceEndDate ? 'border-red-500' : ''}"
						/>
						{#if errors.recurrenceEndDate}
							<p class="mt-1 text-sm text-red-600">{errors.recurrenceEndDate}</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Registro y capacidad -->
		<div class="border border-gray-200 rounded-lg p-4">
			<h3 class="text-lg font-medium text-gray-900 mb-4">Registro y Capacidad</h3>

			<div class="space-y-4">
				<!-- Requiere registro -->
				<div>
					<label class="flex items-center">
						<input
							type="checkbox"
							bind:checked={formData.requiresRegistration}
							class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<span class="ml-2 text-sm font-medium text-gray-700">Requiere registro previo</span>
					</label>
				</div>

				{#if formData.requiresRegistration}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<!-- Capacidad máxima -->
						<div>
							<label for="maxAttendees" class="block text-sm font-medium text-gray-700 mb-2">
								Capacidad Máxima
							</label>
							<input
								id="maxAttendees"
								type="number"
								bind:value={formData.maxAttendees}
								min="1"
								placeholder="Sin límite"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						<!-- Fecha límite de registro -->
						<div>
							<label for="registrationDeadline" class="block text-sm font-medium text-gray-700 mb-2">
								Fecha Límite de Registro
							</label>
							<input
								id="registrationDeadline"
								type="datetime-local"
								value={formData.registrationDeadline ? formatDateTimeLocal(formData.registrationDeadline) : ''}
								on:input={(e) => {
									formData.registrationDeadline = e.currentTarget.value ? parseDateTimeLocal(e.currentTarget.value) : undefined;
								}}
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
									{errors.registrationDeadline ? 'border-red-500' : ''}"
							/>
							{#if errors.registrationDeadline}
								<p class="mt-1 text-sm text-red-600">{errors.registrationDeadline}</p>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Enlaces relacionados -->
		<div class="border border-gray-200 rounded-lg p-4">
			<h3 class="text-lg font-medium text-gray-900 mb-4">Enlaces Relacionados</h3>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Curso relacionado -->
				{#if availableCourses.length > 0}
					<div>
						<label for="relatedCourseId" class="block text-sm font-medium text-gray-700 mb-2">
							Curso Relacionado
						</label>
						<select
							id="relatedCourseId"
							bind:value={formData.relatedCourseId}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="">Ninguno</option>
							{#each availableCourses as course}
								<option value={course.id}>{course.title}</option>
							{/each}
						</select>
					</div>
				{/if}

				<!-- Post de blog relacionado -->
				{#if availableBlogPosts.length > 0}
					<div>
						<label for="relatedBlogPostId" class="block text-sm font-medium text-gray-700 mb-2">
							Post de Blog Relacionado
						</label>
						<select
							id="relatedBlogPostId"
							bind:value={formData.relatedBlogPostId}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="">Ninguno</option>
							{#each availableBlogPosts as post}
								<option value={post.id}>{post.title}</option>
							{/each}
						</select>
					</div>
				{/if}
			</div>
		</div>

		<!-- Multimedia -->
		<div class="border border-gray-200 rounded-lg p-4">
			<h3 class="text-lg font-medium text-gray-900 mb-4">Multimedia</h3>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Imagen -->
				<div>
					<label for="imagePath" class="block text-sm font-medium text-gray-700 mb-2">
						Imagen del Evento
					</label>
					<input
						id="imagePath"
						type="url"
						bind:value={formData.imagePath}
						placeholder="https://ejemplo.com/imagen.jpg"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>

				<!-- PDF -->
				<div>
					<label for="pdfPath" class="block text-sm font-medium text-gray-700 mb-2">
						Documento PDF
					</label>
					<input
						id="pdfPath"
						type="url"
						bind:value={formData.pdfPath}
						placeholder="https://ejemplo.com/documento.pdf"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>
			</div>
		</div>

		<!-- Configuración especial -->
		<div class="border border-gray-200 rounded-lg p-4">
			<h3 class="text-lg font-medium text-gray-900 mb-4">Configuración Especial</h3>

			<div>
				<label class="flex items-center">
					<input
						type="checkbox"
						bind:checked={formData.isFeatured}
						class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<span class="ml-2 text-sm font-medium text-gray-700">Marcar como evento destacado</span>
				</label>
				<p class="mt-1 text-xs text-gray-500">Los eventos destacados aparecerán en la página principal.</p>
			</div>
		</div>

		<!-- Botones -->
		<div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
			<button
				type="button"
				on:click={handleCancel}
				class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
			>
				Cancelar
			</button>
			
			<button
				type="submit"
				disabled={isSubmitting}
				class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center space-x-2"
			>
				{#if isSubmitting}
					<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Guardando...
				{:else}
					<span>{isEdit ? 'Actualizar' : 'Crear'} Evento</span>
				{/if}
			</button>
		</div>
	</form>
</div>