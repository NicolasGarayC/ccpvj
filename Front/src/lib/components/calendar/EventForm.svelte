<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { CreateEventData, EventDetail } from '$lib/services/calendar/calendarService';

	export let event: EventDetail | null = null;
	export let isEdit: boolean = false;
	export let availableCourses: Array<{ id: string; title: string }> = [];
	export let availableBlogPosts: Array<{ id: string; title: string; slug: string }> = [];
	export let initialDate: Date | null = null;

	const dispatch = createEventDispatcher<{
		save: { eventData: CreateEventData };
		cancel: void;
	}>();

	// Datos del formulario
	let formData: CreateEventData = {
		title: '',
		description: '',
		startDateTime: initialDate || new Date(),
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
		relatedCourseId: ''
	};

	// Estado del formulario
	let isSubmitting = false;
	let errors: Record<string, string> = {};

	// Actualizar fecha inicial cuando cambie el prop
	$: if (initialDate && !isEdit) {
		formData.startDateTime = new Date(initialDate);
	}

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
			relatedCourseId: event.relatedCourseId || ''
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

<div class="event-form">
	<div class="form-header">
		<h2 class="form-title">
			🎪 {isEdit ? 'Editar Evento' : 'Crear Nuevo Evento'}
		</h2>
		<p class="form-subtitle">
			{isEdit ? 'Modifica los detalles de tu evento' : 'Crea una nueva actividad para el centro cultural'}
		</p>
	</div>

	<form on:submit|preventDefault={handleSubmit} class="form-content">
		<!-- Información básica -->
		<div class="form-section">
			<h3 class="section-title">📝 Información Básica</h3>

			<div class="form-group full-width">
				<label for="title" class="label">
					Título del evento <span class="required">*</span>
				</label>
				<input
					id="title"
					type="text"
					bind:value={formData.title}
					class="input"
					class:error={errors.title}
					placeholder="Ej: Taller de Teatro Infantil"
					maxlength="200"
					disabled={isSubmitting}
					required
				/>
				{#if errors.title}
					<span class="error-message">{errors.title}</span>
				{/if}
				<div class="character-count">
					{formData.title.length}/200 caracteres
				</div>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="eventType" class="label">
						🏷️ Tipo de Evento
					</label>
					<select
						id="eventType"
						bind:value={formData.eventType}
						class="input"
						disabled={isSubmitting}
					>
						{#each eventTypes as type}
							<option value={type.value}>{type.label}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label for="location" class="label">
						📍 Ubicación
					</label>
					<input
						id="location"
						type="text"
						bind:value={formData.location}
						class="input"
						placeholder="Ej: Aula Principal, Salón de Eventos"
						maxlength="200"
						disabled={isSubmitting}
					/>
				</div>
			</div>
		</div>

		<div class="form-section">
			<div class="form-group full-width">
				<label for="description" class="label">
					📄 Descripción
				</label>
				<textarea
					id="description"
					bind:value={formData.description}
					class="textarea"
					placeholder="Describe el evento, actividades, objetivos y todo lo que los participantes deben saber..."
					rows="5"
					maxlength="1000"
					disabled={isSubmitting}
				></textarea>
				<div class="character-count">
					{formData.description.length}/1000 caracteres
				</div>
			</div>
		</div>

		<!-- Fechas y horarios -->
		<div class="form-section">
			<h3 class="section-title">📅 Fechas y Horarios</h3>

			<div class="form-group full-width">
				<label class="checkbox-label">
					<input
						type="checkbox"
						bind:checked={formData.isAllDay}
						on:change={handleAllDayChange}
						class="checkbox"
						disabled={isSubmitting}
					/>
					✨ Evento de todo el día
				</label>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="startDateTime" class="label">
						🚀 Fecha de Inicio <span class="required">*</span>
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
						class="input"
						class:error={errors.startDateTime}
						disabled={isSubmitting}
						required
					/>
					{#if errors.startDateTime}
						<span class="error-message">{errors.startDateTime}</span>
					{/if}
				</div>

				<div class="form-group">
					<label for="endDateTime" class="label">
						🏁 Fecha de Fin (opcional)
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
						class="input"
						class:error={errors.endDateTime}
						disabled={isSubmitting}
					/>
					{#if errors.endDateTime}
						<span class="error-message">{errors.endDateTime}</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Eventos recurrentes -->
		<div class="form-section">
			<h3 class="section-title">🔄 Recurrencia</h3>

			<div class="form-group full-width">
				<label for="isRecurring" class="checkbox-label">
					<input
						id="isRecurring"
						type="checkbox"
						bind:checked={formData.isRecurring}
						class="checkbox"
						disabled={isSubmitting}
					/>
					🔁 Evento recurrente
				</label>
				<p class="help-text">💡 Los eventos recurrentes se repetirán automáticamente según el patrón configurado</p>
			</div>

			{#if formData.isRecurring}
				<div class="form-row">
					<div class="form-group">
						<label for="recurrencePattern" class="label">
							🔄 Patrón de Recurrencia <span class="required">*</span>
						</label>
						<select
							id="recurrencePattern"
							bind:value={formData.recurrencePattern}
							class="input"
							class:error={errors.recurrencePattern}
							disabled={isSubmitting}
						>
							{#each recurrencePatterns.slice(1) as pattern}
								<option value={pattern.value}>{pattern.label}</option>
							{/each}
						</select>
						{#if errors.recurrencePattern}
							<span class="error-message">{errors.recurrencePattern}</span>
						{/if}
					</div>

					<div class="form-group">
						<label for="recurrenceInterval" class="label">
							⏱️ Cada
						</label>
						<input
							id="recurrenceInterval"
							type="number"
							bind:value={formData.recurrenceInterval}
							class="input"
							min="1"
							max="52"
							disabled={isSubmitting}
						/>
						<p class="help-text">
							{#if formData.recurrencePattern === 'daily'}📅 días{:else if formData.recurrencePattern === 'weekly'}📅 semanas{:else if formData.recurrencePattern === 'monthly'}📅 meses{:else if formData.recurrencePattern === 'yearly'}📅 años{/if}
						</p>
					</div>

				</div>

				{#if formData.recurrencePattern === 'weekly'}
					<div class="form-group full-width">
						<label class="label">
							📅 Días de la Semana
						</label>
						<div class="flex flex-wrap gap-3">
							{#each daysOfWeek as day}
								<label class="checkbox-label">
									<input
										type="checkbox"
										checked={isDaySelected(day.value)}
										on:change={(e) => handleDaySelection(day.value, e.currentTarget.checked)}
										class="checkbox"
										disabled={isSubmitting}
									/>
									{day.label}
								</label>
							{/each}
						</div>
						<p class="help-text">💡 Selecciona los días en que se repetirá el evento</p>
					</div>
				{/if}

				<div class="form-group full-width">
					<label for="recurrenceEndDate" class="label">
						🏁 Fin de la Recurrencia (opcional)
					</label>
					<input
						id="recurrenceEndDate"
						type="date"
						value={formData.recurrenceEndDate ? formData.recurrenceEndDate.toISOString().split('T')[0] : ''}
						on:input={(e) => {
							formData.recurrenceEndDate = e.currentTarget.value ? new Date(e.currentTarget.value) : undefined;
						}}
						class="input"
						class:error={errors.recurrenceEndDate}
						disabled={isSubmitting}
					/>
					{#if errors.recurrenceEndDate}
						<span class="error-message">{errors.recurrenceEndDate}</span>
					{/if}
					<p class="help-text">💡 Si no especificas una fecha, la recurrencia continuará indefinidamente</p>
				</div>
			{/if}
		</div>

		<!-- Registro y capacidad -->
		<div class="form-section">
			<h3 class="section-title">👥 Registro y Capacidad</h3>

			<div class="form-group full-width">
				<label class="checkbox-label">
					<input
						type="checkbox"
						bind:checked={formData.requiresRegistration}
						class="checkbox"
						disabled={isSubmitting}
					/>
					📋 Requiere registro previo
				</label>
				<p class="help-text">💡 Los participantes deberán registrarse antes del evento</p>
			</div>

			{#if formData.requiresRegistration}
				<div class="form-row">
					<div class="form-group">
						<label for="maxAttendees" class="label">
							👥 Capacidad Máxima
						</label>
						<input
							id="maxAttendees"
							type="number"
							bind:value={formData.maxAttendees}
							min="1"
							placeholder="Sin límite"
							class="input"
							disabled={isSubmitting}
						/>
						<p class="help-text">💡 Deja vacío para capacidad ilimitada</p>
					</div>

					<div class="form-group">
						<label for="registrationDeadline" class="label">
							⏰ Fecha Límite de Registro
						</label>
						<input
							id="registrationDeadline"
							type="datetime-local"
							value={formData.registrationDeadline ? formatDateTimeLocal(formData.registrationDeadline) : ''}
							on:input={(e) => {
								formData.registrationDeadline = e.currentTarget.value ? parseDateTimeLocal(e.currentTarget.value) : undefined;
							}}
							class="input"
							class:error={errors.registrationDeadline}
							disabled={isSubmitting}
						/>
						{#if errors.registrationDeadline}
							<span class="error-message">{errors.registrationDeadline}</span>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Enlaces relacionados -->
		<div class="form-section">
			<h3 class="section-title">🔗 Enlaces Relacionados</h3>

			<div class="form-row">
				<!-- Curso relacionado -->
				{#if availableCourses.length > 0}
					<div class="form-group">
						<label for="relatedCourseId" class="label">
							📚 Curso Relacionado
						</label>
						<select
							id="relatedCourseId"
							bind:value={formData.relatedCourseId}
							class="input"
							disabled={isSubmitting}
						>
							<option value="">Ninguno</option>
							{#each availableCourses as course}
								<option value={course.id}>{course.title}</option>
							{/each}
						</select>
						<p class="help-text">💡 Vincula este evento con un curso específico</p>
					</div>
				{/if}

				<!-- Nota: Las relaciones con posts de blog ahora se manejan desde el módulo de blog usando BlogEventRelation -->
			</div>
		</div>

		<!-- Multimedia -->
		<div class="form-section">
			<h3 class="section-title">🎨 Multimedia</h3>

			<div class="form-row">
				<div class="form-group">
					<label for="imagePath" class="label">
						🖼️ Imagen del Evento
					</label>
					<input
						id="imagePath"
						type="url"
						bind:value={formData.imagePath}
						placeholder="https://ejemplo.com/imagen.jpg"
						class="input"
						disabled={isSubmitting}
					/>
					<p class="help-text">💡 URL de la imagen promocional del evento</p>
				</div>

				<div class="form-group">
					<label for="pdfPath" class="label">
						📄 Documento PDF
					</label>
					<input
						id="pdfPath"
						type="url"
						bind:value={formData.pdfPath}
						placeholder="https://ejemplo.com/documento.pdf"
						class="input"
						disabled={isSubmitting}
					/>
					<p class="help-text">💡 URL de documentos adicionales o programas</p>
				</div>
			</div>
		</div>

		<!-- Configuración especial -->
		<div class="form-section">
			<h3 class="section-title">⭐ Configuración Especial</h3>

			<div class="form-group full-width">
				<label class="checkbox-label">
					<input
						type="checkbox"
						bind:checked={formData.isFeatured}
						class="checkbox"
						disabled={isSubmitting}
					/>
					⭐ Marcar como evento destacado
				</label>
				<p class="help-text">💡 Los eventos destacados aparecerán en la página principal y tendrán mayor visibilidad</p>
			</div>
		</div>

		<!-- Botones -->
		<div class="form-actions">
			<button
				type="button"
				on:click={handleCancel}
				class="btn btn-secondary"
				disabled={isSubmitting}
			>
				❌ Cancelar
			</button>

			<button
				type="submit"
				disabled={isSubmitting}
				class="btn btn-primary"
			>
				{#if isSubmitting}
					<div class="loading-spinner"></div>
					⏳ Guardando...
				{:else}
					✨ {isEdit ? 'Actualizar' : 'Crear'} Evento
				{/if}
			</button>
		</div>
	</form>
</div>

<style>
	.event-form {
		@apply bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto;
		border: 2px solid rgba(59, 130, 246, 0.1);
	}

	.form-header {
		@apply bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-6;
	}

	.form-title {
		@apply text-2xl font-bold mb-2;
	}

	.form-subtitle {
		@apply text-blue-100 font-medium;
	}

	.form-content {
		@apply p-8 space-y-8;
	}

	.form-section {
		@apply bg-white rounded-xl p-6 shadow-md border border-gray-100;
	}

	.section-title {
		@apply text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200;
	}

	.form-row {
		@apply grid grid-cols-1 md:grid-cols-2 gap-6;
	}

	.form-group {
		@apply space-y-2;
	}

	.form-group.full-width {
		@apply col-span-full;
	}

	.label {
		@apply block text-sm font-semibold text-gray-700 mb-2;
	}

	.input {
		@apply w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm;
		@apply focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200;
		@apply placeholder-gray-400;
	}

	.input:disabled {
		@apply bg-gray-100 text-gray-500 cursor-not-allowed;
	}

	.input.error {
		@apply border-red-400 ring-2 ring-red-200;
	}

	.textarea {
		@apply w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm resize-none;
		@apply focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200;
		@apply placeholder-gray-400;
	}

	.textarea:disabled {
		@apply bg-gray-100 text-gray-500 cursor-not-allowed;
	}

	.checkbox {
		@apply w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded;
		@apply focus:ring-blue-500 focus:ring-2 transition-all duration-200;
	}

	.checkbox-label {
		@apply flex items-center space-x-3 text-sm font-medium text-gray-700 cursor-pointer;
		@apply hover:text-blue-600 transition-colors duration-200;
	}

	.required {
		@apply text-red-500 font-bold;
	}

	.error-message {
		@apply text-red-600 text-sm font-medium;
	}

	.character-count {
		@apply text-xs text-gray-500 text-right;
	}

	.help-text {
		@apply text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200;
	}

	.form-actions {
		@apply flex justify-end space-x-4 pt-8 border-t border-gray-200;
	}

	.btn {
		@apply px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2;
		@apply focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
	}

	.btn-primary {
		@apply bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700;
		@apply text-white shadow-lg hover:shadow-xl focus:ring-blue-500;
		@apply transform hover:scale-105 active:scale-95;
	}

	.btn-secondary {
		@apply bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50;
		@apply hover:border-gray-400 focus:ring-gray-400 shadow-md;
	}

	.loading-spinner {
		@apply inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin;
	}
</style>