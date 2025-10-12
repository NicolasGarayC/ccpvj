<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { CreateEventData, EventDetail } from '$lib/services/calendar/calendarService';

	export let event: EventDetail | null = null;
	export let isEdit: boolean = false;
	export let availableProjects: Array<{ id: string; title: string }> = [];
	export let availableBlogPosts: Array<{ id: string; title: string; slug: string }> = [];
	export let initialDate: Date | null = null;
	export let saving: boolean = false;

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
		isRecurring: false,
		recurrencePattern: '',
		recurrenceInterval: 1,
		recurrenceEndDate: undefined,
		recurrenceDaysOfWeek: '',
		relatedProjectId: undefined,
		relatedBlogPostId: undefined
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
			// Si es recurrente, usar recurrenceEndDate como endDateTime
			endDateTime: event.isRecurring
				? (event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : undefined)
				: (event.endDateTime ? new Date(event.endDateTime) : undefined),
			isAllDay: event.isAllDay,
			location: event.location || '',
			eventType: event.eventType,
			isFeatured: event.isFeatured,
			isRecurring: event.isRecurring,
			recurrencePattern: event.recurrencePattern || '',
			recurrenceInterval: event.recurrenceInterval || 1,
			recurrenceEndDate: event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : undefined,
			recurrenceDaysOfWeek: event.recurrenceDaysOfWeek || '',
			relatedProjectId: event.relatedProjectId || undefined,
			relatedBlogPostId: event.relatedBlogPostId || undefined
		};
	}

	// Opciones de formulario
	const eventTypes = [
		{ value: 'General', label: 'General' },
		{ value: 'Clase', label: 'Clase' },
		{ value: 'Taller', label: 'Taller' },
		{ value: 'Conferencia', label: 'Conferencia' },
		{ value: 'Evento', label: 'Evento Cultural' },
		{ value: 'Otro', label: 'Otro' }
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

		if (formData.isRecurring) {
			// Para eventos recurrentes, endDateTime es obligatorio (representa hasta cuándo se repite)
			if (!formData.endDateTime) {
				errors.endDateTime = 'Para eventos recurrentes, debes especificar hasta cuándo se repite';
			} else if (new Date(formData.endDateTime) <= new Date(formData.startDateTime)) {
				errors.endDateTime = 'La fecha final debe ser posterior a la fecha de inicio';
			}

			if (!formData.recurrencePattern) {
				errors.recurrencePattern = 'Debe seleccionar un patrón de recurrencia';
			}
		} else {
			// Para eventos no recurrentes, endDateTime es opcional pero debe ser posterior
			if (formData.endDateTime && formData.startDateTime && new Date(formData.endDateTime) <= new Date(formData.startDateTime)) {
				errors.endDateTime = 'La fecha de fin debe ser posterior a la fecha de inicio';
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
			// Si es recurrente, copiar endDateTime a recurrenceEndDate
			const dataToSend = { ...formData };
			if (dataToSend.isRecurring && dataToSend.endDateTime) {
				dataToSend.recurrenceEndDate = dataToSend.endDateTime;
				// Para eventos recurrentes, no enviar endDateTime individual
				dataToSend.endDateTime = undefined;
			}

			dispatch('save', { eventData: dataToSend });
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
						{#if formData.isRecurring}
							📅 Repetir Hasta <span class="required">*</span>
						{:else}
							🏁 Fecha/Hora de Fin (opcional)
						{/if}
					</label>
					<input
						id="endDateTime"
						type={formData.isRecurring ? 'date' : (formData.isAllDay ? 'date' : 'datetime-local')}
						value={formData.endDateTime ?
							((formData.isRecurring || formData.isAllDay) ?
								formData.endDateTime.toISOString().split('T')[0] :
								formatDateTimeLocal(formData.endDateTime))
							: ''}
						on:input={(e) => {
							if (e.currentTarget.value) {
								if (formData.isRecurring || formData.isAllDay) {
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
						required={formData.isRecurring}
					/>
					{#if errors.endDateTime}
						<span class="error-message">{errors.endDateTime}</span>
					{/if}
					<p class="help-text">
						{#if formData.isRecurring}
							💡 Fecha límite hasta la cual se repetirá este evento
						{:else}
							💡 Cuándo termina este evento (ej: taller de 10am a 12pm)
						{/if}
					</p>
				</div>
			</div>
		</div>

		<!-- Eventos recurrentes -->
		<div class="form-section">
			<h3 class="section-title">🔄 Recurrencia</h3>

			<div class="form-group full-width">
				<label class="checkbox-label">
					<input
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
			{/if}
		</div>

		<!-- Enlaces relacionados -->
		<div class="form-section">
			<h3 class="section-title">🔗 Enlaces Relacionados</h3>

			<div class="form-row">
				<!-- Proyecto relacionado -->
				{#if availableProjects.length > 0}
					<div class="form-group">
						<label for="relatedProjectId" class="label">
							📚 Proyecto Relacionado
						</label>
						<select
							id="relatedProjectId"
							bind:value={formData.relatedProjectId}
							class="input"
							disabled={isSubmitting}
						>
							<option value="">Ninguno</option>
							{#each availableProjects as project}
								<option value={project.id}>{project.title}</option>
							{/each}
						</select>
						<p class="help-text">💡 Vincula este evento con un proyecto específico</p>
					</div>
				{/if}

				<!-- Blog post relacionado -->
				{#if availableBlogPosts.length > 0}
					<div class="form-group">
						<label for="relatedBlogPostId" class="label">
							📝 Artículo de Blog Relacionado
						</label>
						<select
							id="relatedBlogPostId"
							bind:value={formData.relatedBlogPostId}
							class="input"
							disabled={isSubmitting}
						>
							<option value="">Ninguno</option>
							{#each availableBlogPosts as blogPost}
								<option value={blogPost.id}>{blogPost.title}</option>
							{/each}
						</select>
						<p class="help-text">💡 Vincula este evento con un artículo de blog (anuncios, contexto, etc.)</p>
					</div>
				{/if}
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
		background: linear-gradient(to bottom right, white, #dbeafe, #f3e8ff);
		border-radius: 1rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		overflow: hidden;
		max-width: 56rem;
		margin: 0 auto;
		border: 2px solid rgba(59, 130, 246, 0.1);
	}

	.form-header {
		background: linear-gradient(to right, #2563eb, #9333ea);
		color: white;
		padding: 1.5rem 2rem;
	}

	.form-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	.form-subtitle {
		color: #bfdbfe;
		font-weight: 500;
	}

	.form-content {
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.form-section {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		border: 1px solid #f3f4f6;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	@media (min-width: 768px) {
		.form-row {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group.full-width {
		grid-column: 1 / -1;
	}

	.label {
		display: block;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.input {
		width: 100%;
		padding: 0.75rem 1rem;
		color: #111827;
		background-color: white;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		transition: all 0.2s;
	}

	.input::placeholder {
		color: #9ca3af;
	}

	.input:focus {
		outline: none;
		ring: 2px;
		ring-color: #3b82f6;
		border-color: #3b82f6;
	}

	.input:disabled {
		background-color: #f3f4f6;
		color: #6b7280;
		cursor: not-allowed;
	}

	.input.error {
		border-color: #f87171;
		ring: 2px;
		ring-color: #fecaca;
	}

	.textarea {
		width: 100%;
		padding: 0.75rem 1rem;
		color: #111827;
		background-color: white;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		resize: none;
		transition: all 0.2s;
	}

	.textarea::placeholder {
		color: #9ca3af;
	}

	.textarea:focus {
		outline: none;
		ring: 2px;
		ring-color: #3b82f6;
		border-color: #3b82f6;
	}

	.textarea:disabled {
		background-color: #f3f4f6;
		color: #6b7280;
		cursor: not-allowed;
	}

	.checkbox {
		width: 1rem;
		height: 1rem;
		color: #2563eb;
		background-color: white;
		border: 2px solid #d1d5db;
		border-radius: 0.25rem;
		transition: all 0.2s;
		cursor: pointer;
		flex-shrink: 0;
		appearance: auto;
	}

	.checkbox:checked {
		background-color: #2563eb;
		border-color: #2563eb;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		cursor: pointer;
		transition: color 0.2s;
	}

	.checkbox-label:hover {
		color: #2563eb;
	}

	.required {
		color: #ef4444;
		font-weight: 700;
	}

	.error-message {
		color: #dc2626;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.character-count {
		font-size: 0.75rem;
		color: #6b7280;
		text-align: right;
	}

	.help-text {
		font-size: 0.875rem;
		color: #4b5563;
		background-color: #eff6ff;
		padding: 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid #bfdbfe;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding-top: 2rem;
		border-top: 1px solid #e5e7eb;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.btn:focus {
		outline: none;
		ring: 2px;
		ring-offset: 2px;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: linear-gradient(to right, #2563eb, #9333ea);
		color: white;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
		border: none;
	}

	.btn-primary:hover:not(:disabled) {
		background: linear-gradient(to right, #1d4ed8, #7e22ce);
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		transform: scale(1.05);
	}

	.btn-primary:active:not(:disabled) {
		transform: scale(0.95);
	}

	.btn-primary:focus {
		ring-color: #3b82f6;
	}

	.btn-secondary {
		background-color: white;
		color: #374151;
		border: 2px solid #d1d5db;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	.btn-secondary:hover:not(:disabled) {
		background-color: #f9fafb;
		border-color: #9ca3af;
	}

	.btn-secondary:focus {
		ring-color: #9ca3af;
	}

	.loading-spinner {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		border: 2px solid white;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.flex {
		display: flex;
	}

	.flex-wrap {
		flex-wrap: wrap;
	}

	.gap-3 {
		gap: 0.75rem;
	}
</style>