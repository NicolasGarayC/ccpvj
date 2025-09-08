<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { CreateUserData, UpdateUserData, User, Role } from '$lib/services/users/userManagementService';
	import { userManagementService } from '$lib/services/users/userManagementService';

	export let user: User | null = null;
	export let isEdit: boolean = false;
	export let availableRoles: Role[] = [];

	const dispatch = createEventDispatcher<{
		save: { userData: CreateUserData | UpdateUserData };
		cancel: void;
	}>();

	// Datos del formulario
	let formData = {
		username: '',
		password: '',
		confirmPassword: '',
		nombre: '',
		apellido: '',
		telefono: '',
		role: 'Asistente',
		isActive: true,
		newPassword: ''
	};

	// Estado del formulario
	let isSubmitting = false;
	let errors: Record<string, string> = {};
	let showPassword = false;
	let usernameChecking = false;
	let usernameAvailable = true;

	// Cargar datos del usuario si es edición
	$: if (user && isEdit) {
		formData = {
			username: user.username,
			password: '',
			confirmPassword: '',
			nombre: user.nombre,
			apellido: user.apellido,
			telefono: user.telefono || '',
			role: user.role,
			isActive: user.isActive,
			newPassword: ''
		};
	}

	// Validaciones en tiempo real
	async function validateUsername() {
		if (!formData.username.trim()) return;
		
		try {
			usernameChecking = true;
			const excludeId = isEdit && user ? user.id : undefined;
			usernameAvailable = await userManagementService.checkUsernameAvailability(formData.username, excludeId);
			
			if (!usernameAvailable) {
				errors.username = 'Este nombre de usuario ya está en uso';
			} else {
				delete errors.username;
			}
		} catch (error) {
			console.error('Error al verificar username:', error);
		} finally {
			usernameChecking = false;
		}
	}

	// Validar formulario completo
	function validateForm(): boolean {
		errors = {};

		// Username
		if (!formData.username.trim()) {
			errors.username = 'El nombre de usuario es obligatorio';
		} else if (formData.username.length < 3) {
			errors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
		} else if (!usernameAvailable) {
			errors.username = 'Este nombre de usuario ya está en uso';
		}

		// Password (solo requerido para nuevos usuarios)
		if (!isEdit) {
			if (!formData.password) {
				errors.password = 'La contraseña es obligatoria';
			} else if (formData.password.length < 6) {
				errors.password = 'La contraseña debe tener al menos 6 caracteres';
			}

			if (formData.password !== formData.confirmPassword) {
				errors.confirmPassword = 'Las contraseñas no coinciden';
			}
		} else {
			// En edición, validar solo si se quiere cambiar la contraseña
			if (formData.newPassword) {
				if (formData.newPassword.length < 6) {
					errors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
				}
				if (formData.newPassword !== formData.confirmPassword) {
					errors.confirmPassword = 'Las contraseñas no coinciden';
				}
			}
		}

		// Nombre
		if (!formData.nombre.trim()) {
			errors.nombre = 'El nombre es obligatorio';
		}

		// Apellido
		if (!formData.apellido.trim()) {
			errors.apellido = 'El apellido es obligatorio';
		}

		// Rol
		if (!formData.role) {
			errors.role = 'Debe seleccionar un rol';
		}

		return Object.keys(errors).length === 0;
	}

	// Manejar envío del formulario
	async function handleSubmit() {
		if (!validateForm()) return;

		isSubmitting = true;
		try {
			let userData: CreateUserData | UpdateUserData;

			if (isEdit) {
				userData = {
					username: formData.username,
					nombre: formData.nombre,
					apellido: formData.apellido,
					telefono: formData.telefono || undefined,
					role: formData.role,
					isActive: formData.isActive,
					newPassword: formData.newPassword || undefined
				} as UpdateUserData;
			} else {
				userData = {
					username: formData.username,
					password: formData.password,
					nombre: formData.nombre,
					apellido: formData.apellido,
					telefono: formData.telefono || undefined,
					role: formData.role
				} as CreateUserData;
			}

			dispatch('save', { userData });
		} finally {
			isSubmitting = false;
		}
	}

	// Manejar cancelación
	function handleCancel() {
		dispatch('cancel');
	}

	// Generar contraseña aleatoria
	function generateRandomPassword() {
		const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let password = '';
		for (let i = 0; i < 8; i++) {
			password += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		
		if (isEdit) {
			formData.newPassword = password;
		} else {
			formData.password = password;
		}
		
		formData.confirmPassword = password;
	}

	// Obtener descripción del rol
	function getRoleDescription(roleName: string): string {
		const role = availableRoles.find(r => r.name === roleName);
		return role ? role.description : '';
	}

	// Obtener color del rol
	function getRoleColor(roleName: string): string {
		return userManagementService.getRoleColor(roleName);
	}
</script>

<div class="bg-white rounded-lg shadow-lg overflow-hidden">
	<div class="px-6 py-4 border-b border-gray-200">
		<h2 class="text-xl font-semibold text-gray-900">
			{isEdit ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
		</h2>
	</div>

	<form on:submit|preventDefault={handleSubmit} class="p-6 space-y-6">
		<!-- Información básica -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Nombre de usuario -->
			<div class="md:col-span-2">
				<label for="username" class="block text-sm font-medium text-gray-700 mb-2">
					Nombre de Usuario <span class="text-red-500">*</span>
				</label>
				<div class="relative">
					<input
						id="username"
						type="text"
						bind:value={formData.username}
						on:blur={validateUsername}
						placeholder="Ej: juan.perez"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
							{errors.username ? 'border-red-500' : ''}
							{usernameChecking ? 'pr-10' : ''}
							{usernameAvailable && formData.username && !errors.username ? 'border-green-500' : ''}"
						required
						disabled={isSubmitting}
					/>
					{#if usernameChecking}
						<div class="absolute inset-y-0 right-0 flex items-center pr-3">
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
						</div>
					{:else if formData.username && !errors.username}
						<div class="absolute inset-y-0 right-0 flex items-center pr-3">
							<svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
							</svg>
						</div>
					{/if}
				</div>
				{#if errors.username}
					<p class="mt-1 text-sm text-red-600">{errors.username}</p>
				{:else if formData.username && usernameAvailable && !usernameChecking}
					<p class="mt-1 text-sm text-green-600">Nombre de usuario disponible</p>
				{/if}
			</div>

			<!-- Nombre -->
			<div>
				<label for="nombre" class="block text-sm font-medium text-gray-700 mb-2">
					Nombre <span class="text-red-500">*</span>
				</label>
				<input
					id="nombre"
					type="text"
					bind:value={formData.nombre}
					placeholder="Ej: Juan"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
						{errors.nombre ? 'border-red-500' : ''}"
					required
					disabled={isSubmitting}
				/>
				{#if errors.nombre}
					<p class="mt-1 text-sm text-red-600">{errors.nombre}</p>
				{/if}
			</div>

			<!-- Apellido -->
			<div>
				<label for="apellido" class="block text-sm font-medium text-gray-700 mb-2">
					Apellido <span class="text-red-500">*</span>
				</label>
				<input
					id="apellido"
					type="text"
					bind:value={formData.apellido}
					placeholder="Ej: Pérez"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
						{errors.apellido ? 'border-red-500' : ''}"
					required
					disabled={isSubmitting}
				/>
				{#if errors.apellido}
					<p class="mt-1 text-sm text-red-600">{errors.apellido}</p>
				{/if}
			</div>

			<!-- Teléfono -->
			<div class="md:col-span-2">
				<label for="telefono" class="block text-sm font-medium text-gray-700 mb-2">
					Teléfono
				</label>
				<input
					id="telefono"
					type="tel"
					bind:value={formData.telefono}
					placeholder="Ej: +57 300 123 4567"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					disabled={isSubmitting}
				/>
			</div>
		</div>

		<!-- Contraseña -->
		<div class="border border-gray-200 rounded-lg p-4">
			<h3 class="text-lg font-medium text-gray-900 mb-4">
				{isEdit ? 'Cambiar Contraseña' : 'Contraseña'}
			</h3>

			{#if isEdit}
				<div class="mb-4">
					<label class="flex items-center">
						<input
							type="checkbox"
							bind:checked={showPassword}
							class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<span class="ml-2 text-sm text-gray-700">Cambiar contraseña</span>
					</label>
				</div>
			{:else}
				<!-- Para nuevos usuarios, la contraseña es requerida -->
			{/if}

			{#if !isEdit || showPassword}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<!-- Nueva contraseña -->
					<div>
						<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
							{isEdit ? 'Nueva Contraseña' : 'Contraseña'} 
							{!isEdit ? <span class="text-red-500">*</span> : ''}
						</label>
						<div class="relative">
							<input
								id="password"
								type="password"
								bind:value={isEdit ? formData.newPassword : formData.password}
								placeholder="Mínimo 6 caracteres"
								class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
									{(isEdit ? errors.newPassword : errors.password) ? 'border-red-500' : ''}"
								required={!isEdit}
								disabled={isSubmitting}
								minlength="6"
							/>
							<button
								type="button"
								on:click={generateRandomPassword}
								class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
								title="Generar contraseña aleatoria"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
								</svg>
							</button>
						</div>
						{#if (isEdit ? errors.newPassword : errors.password)}
							<p class="mt-1 text-sm text-red-600">{isEdit ? errors.newPassword : errors.password}</p>
						{/if}
					</div>

					<!-- Confirmar contraseña -->
					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
							Confirmar Contraseña
							{!isEdit ? <span class="text-red-500">*</span> : ''}
						</label>
						<input
							id="confirmPassword"
							type="password"
							bind:value={formData.confirmPassword}
							placeholder="Repetir contraseña"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
								{errors.confirmPassword ? 'border-red-500' : ''}"
							required={!isEdit || showPassword}
							disabled={isSubmitting}
						/>
						{#if errors.confirmPassword}
							<p class="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Rol y estado -->
		<div class="border border-gray-200 rounded-lg p-4">
			<h3 class="text-lg font-medium text-gray-900 mb-4">Permisos y Estado</h3>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Rol -->
				<div>
					<label for="role" class="block text-sm font-medium text-gray-700 mb-2">
						Rol <span class="text-red-500">*</span>
					</label>
					<select
						id="role"
						bind:value={formData.role}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
							{errors.role ? 'border-red-500' : ''}"
						required
						disabled={isSubmitting}
					>
						{#each availableRoles as role}
							<option value={role.name}>{role.displayName}</option>
						{/each}
					</select>
					{#if errors.role}
						<p class="mt-1 text-sm text-red-600">{errors.role}</p>
					{/if}
				</div>

				<!-- Estado (solo en edición) -->
				{#if isEdit}
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Estado</label>
						<div class="flex items-center space-x-4">
							<label class="flex items-center">
								<input
									type="radio"
									bind:group={formData.isActive}
									value={true}
									class="text-blue-600 focus:ring-blue-500"
									disabled={isSubmitting}
								/>
								<span class="ml-2 text-sm text-gray-700">Activo</span>
							</label>
							<label class="flex items-center">
								<input
									type="radio"
									bind:group={formData.isActive}
									value={false}
									class="text-red-600 focus:ring-red-500"
									disabled={isSubmitting}
								/>
								<span class="ml-2 text-sm text-gray-700">Inactivo</span>
							</label>
						</div>
					</div>
				{/if}
			</div>

			<!-- Descripción del rol -->
			{#if formData.role}
				<div class="mt-4 p-3 bg-gray-50 rounded-lg">
					<div class="flex items-center space-x-2 mb-2">
						<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getRoleColor(formData.role)}">
							{formData.role}
						</span>
					</div>
					<p class="text-sm text-gray-600">{getRoleDescription(formData.role)}</p>
				</div>
			{/if}
		</div>

		<!-- Botones -->
		<div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
			<button
				type="button"
				on:click={handleCancel}
				class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
				disabled={isSubmitting}
			>
				Cancelar
			</button>
			
			<button
				type="submit"
				disabled={isSubmitting || usernameChecking || !usernameAvailable}
				class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center space-x-2"
			>
				{#if isSubmitting}
					<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					{isEdit ? 'Actualizando...' : 'Creando...'}
				{:else}
					<span>{isEdit ? 'Actualizar' : 'Crear'} Usuario</span>
				{/if}
			</button>
		</div>
	</form>
</div>