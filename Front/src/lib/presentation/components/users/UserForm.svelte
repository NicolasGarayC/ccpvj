<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { t } from '$lib/i18n';
	import type { MessageKey } from '$lib/i18n';
	import type { CreateUserData, UpdateUserData, User, Role } from '$lib/application/services/users/UserManagementService';
	import { userManagementService } from '$lib/application/services/users/UserManagementService';

export let user: User | null = null;
export let isEdit: boolean = false;
export let availableRoles: Role[] = [];
// TODO: Revisar uso de callbacks - considerar hacer pattern con eventos solamente
export let onSave: ((detail: { userData: CreateUserData | UpdateUserData }) => void) | undefined = undefined;
export let onCancel: (() => void) | undefined = undefined;

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
		role: 'colaborador',
		isActive: true,
		newPassword: ''
	};

	// Estado del formulario
	let isSubmitting = false;
	type UserFormErrorKey =
		| 'username'
		| 'password'
		| 'confirmPassword'
		| 'newPassword'
		| 'nombre'
		| 'apellido'
		| 'role';

	let errors: Partial<Record<UserFormErrorKey, MessageKey>> = {};
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
				errors = { ...errors, username: 'users.form.errors.usernameTaken' };
			} else if (errors.username === 'users.form.errors.usernameTaken') {
				const { username: _usernameError, ...rest } = errors;
				errors = rest;
			}
		} catch (error) {
			console.error('Error al verificar username:', error);
		} finally {
			usernameChecking = false;
		}
	}

	// Validar formulario completo
	function validateForm(): boolean {
		const nextErrors: Partial<Record<UserFormErrorKey, MessageKey>> = {};

		// Username
		if (!formData.username.trim()) {
			nextErrors.username = 'users.form.errors.usernameRequired';
		} else if (formData.username.length < 3) {
			nextErrors.username = 'users.form.errors.usernameTooShort';
		} else if (!usernameAvailable) {
			nextErrors.username = 'users.form.errors.usernameTaken';
		}

		// Password (solo requerido para nuevos usuarios)
		if (!isEdit) {
			if (!formData.password) {
				nextErrors.password = 'users.form.errors.passwordRequired';
			} else if (formData.password.length < 6) {
				nextErrors.password = 'users.form.errors.passwordTooShort';
			}

			if (formData.password !== formData.confirmPassword) {
				nextErrors.confirmPassword = 'users.form.errors.passwordMismatch';
			}
		} else {
			// En edición, validar solo si se quiere cambiar la contraseña
			if (formData.newPassword) {
				if (formData.newPassword.length < 6) {
					nextErrors.newPassword = 'users.form.errors.passwordTooShort';
				}
				if (formData.newPassword !== formData.confirmPassword) {
					nextErrors.confirmPassword = 'users.form.errors.passwordMismatch';
				}
			}
		}

		// Nombre
		if (!formData.nombre.trim()) {
			nextErrors.nombre = 'users.form.errors.nameRequired';
		}

		// Apellido
		if (!formData.apellido.trim()) {
			nextErrors.apellido = 'users.form.errors.lastNameRequired';
		}

		// Rol
		if (!formData.role) {
			nextErrors.role = 'users.form.errors.roleRequired';
		}

		errors = nextErrors;
		return Object.keys(nextErrors).length === 0;
	}

	// Manejar envío del formulario
	async function handleSubmit() {
		formData = {
			...formData,
			username: formData.username.trim(),
			nombre: formData.nombre.trim(),
			apellido: formData.apellido.trim(),
			telefono: formData.telefono.trim()
		};

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

			const maybePromise = onSave?.({ userData });
			dispatch('save', { userData });
			if (maybePromise && typeof (maybePromise as PromiseLike<void>).then === 'function') {
				await maybePromise;
			}
		} finally {
			isSubmitting = false;
		}
	}

	// Manejar cancelación
	function handleCancel() {
		onCancel?.();
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
			{isEdit ? $t('dashboard.editUser') : $t('dashboard.createUser')}
		</h2>
	</div>

	<form on:submit|preventDefault={handleSubmit} class="p-6 space-y-6">
		<!-- Información básica -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Nombre de usuario -->
			<div class="md:col-span-2">
				<label for="username" class="block text-sm font-medium text-gray-700 mb-2">
					{$t('users.form.username.label')} <span class="text-red-500">*</span>
				</label>
				<div class="relative">
					<input
						id="username"
						type="text"
						bind:value={formData.username}
						on:blur={validateUsername}
						placeholder={$t('users.form.username.placeholder')}
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
					<p class="mt-1 text-sm text-red-600">{$t(errors.username)}</p>
				{:else if formData.username && usernameAvailable && !usernameChecking}
					<p class="mt-1 text-sm text-green-600">{$t('users.form.username.available')}</p>
				{/if}
			</div>

			<!-- Nombre -->
			<div>
				<label for="nombre" class="block text-sm font-medium text-gray-700 mb-2">
					{$t('users.form.name.label')} <span class="text-red-500">*</span>
				</label>
				<input
					id="nombre"
					type="text"
					bind:value={formData.nombre}
					placeholder={$t('users.form.name.placeholder')}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
						{errors.nombre ? 'border-red-500' : ''}"
					required
					disabled={isSubmitting}
				/>
				{#if errors.nombre}
					<p class="mt-1 text-sm text-red-600">{$t(errors.nombre)}</p>
				{/if}
			</div>

			<!-- Apellido -->
			<div>
				<label for="apellido" class="block text-sm font-medium text-gray-700 mb-2">
					{$t('users.form.lastName.label')} <span class="text-red-500">*</span>
				</label>
				<input
					id="apellido"
					type="text"
					bind:value={formData.apellido}
					placeholder={$t('users.form.lastName.placeholder')}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
						{errors.apellido ? 'border-red-500' : ''}"
					required
					disabled={isSubmitting}
				/>
				{#if errors.apellido}
					<p class="mt-1 text-sm text-red-600">{$t(errors.apellido)}</p>
				{/if}
			</div>

			<!-- Teléfono -->
			<div class="md:col-span-2">
				<label for="telefono" class="block text-sm font-medium text-gray-700 mb-2">
					{$t('users.form.phone.label')}
				</label>
				<input
					id="telefono"
					type="tel"
					bind:value={formData.telefono}
					placeholder={$t('users.form.phone.placeholder')}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					disabled={isSubmitting}
				/>
			</div>
		</div>

		<!-- Contraseña -->
		<div class="border border-gray-200 rounded-lg p-4">
			<h3 class="text-lg font-medium text-gray-900 mb-4">
				{isEdit ? $t('users.form.password.sectionTitleEdit') : $t('users.form.password.sectionTitleCreate')}
			</h3>

			{#if isEdit}
				<div class="mb-4">
					<label class="flex items-center">
						<input
							type="checkbox"
							bind:checked={showPassword}
							class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<span class="ml-2 text-sm text-gray-700">{$t('users.form.password.toggleChange')}</span>
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
							{isEdit ? $t('users.form.password.labelEdit') : $t('users.form.password.labelCreate')}
							{#if !isEdit}<span class="text-red-500">*</span>{/if}
						</label>
						<div class="relative">
							{#if isEdit}
								<input
									id="password"
									type="password"
									bind:value={formData.newPassword}
									placeholder={$t('users.form.password.placeholder')}
									class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
										{errors.newPassword ? 'border-red-500' : ''}"
									disabled={isSubmitting}
									minlength="6"
								/>
							{:else}
								<input
									id="password"
									type="password"
									bind:value={formData.password}
									placeholder={$t('users.form.password.placeholder')}
									class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
										{errors.password ? 'border-red-500' : ''}"
									required
									disabled={isSubmitting}
									minlength="6"
								/>
							{/if}
							<button
								type="button"
								on:click={generateRandomPassword}
								class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
								title={$t('users.form.password.generate')}
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
								</svg>
							</button>
						</div>
						{#if isEdit && errors.newPassword}
							<p class="mt-1 text-sm text-red-600">{$t(errors.newPassword)}</p>
						{:else if !isEdit && errors.password}
							<p class="mt-1 text-sm text-red-600">{$t(errors.password)}</p>
						{/if}
					</div>

					<!-- Confirmar contraseña -->
					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
							{$t('users.form.password.confirmLabel')}
							{#if !isEdit}<span class="text-red-500">*</span>{/if}
						</label>
						<input
							id="confirmPassword"
							type="password"
							bind:value={formData.confirmPassword}
							placeholder={$t('users.form.password.confirmPlaceholder')}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
								{errors.confirmPassword ? 'border-red-500' : ''}"
							required={!isEdit || showPassword}
							disabled={isSubmitting}
						/>
						{#if errors.confirmPassword}
							<p class="mt-1 text-sm text-red-600">{$t(errors.confirmPassword)}</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Rol y estado -->
		<div class="border border-gray-200 rounded-lg p-4">
			<h3 class="text-lg font-medium text-gray-900 mb-4">{$t('users.form.permissions.title')}</h3>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Rol -->
				<div>
					<label for="role" class="block text-sm font-medium text-gray-700 mb-2">
						{$t('users.form.role.label')} <span class="text-red-500">*</span>
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
						<p class="mt-1 text-sm text-red-600">{$t(errors.role)}</p>
					{/if}
				</div>

				<!-- Estado (solo en edición) -->
		{#if isEdit}
			<fieldset class="border-0 p-0">
				<legend class="block text-sm font-medium text-gray-700 mb-2">{$t('users.form.status.label')}</legend>
				<div class="flex items-center space-x-4">
					<label class="flex items-center">
						<input
							type="radio"
							bind:group={formData.isActive}
							value={true}
							class="text-blue-600 focus:ring-blue-500"
							disabled={isSubmitting}
						/>
						<span class="ml-2 text-sm text-gray-700">{$t('users.form.status.active')}</span>
					</label>
					<label class="flex items-center">
						<input
							type="radio"
							bind:group={formData.isActive}
							value={false}
							class="text-red-600 focus:ring-red-500"
							disabled={isSubmitting}
						/>
						<span class="ml-2 text-sm text-gray-700">{$t('users.form.status.inactive')}</span>
					</label>
				</div>
			</fieldset>
		{/if}
			</div>

		</div>

		<!-- Botones -->
		<div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
			<button
				type="button"
				on:click={handleCancel}
				class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
				disabled={isSubmitting}
			>
				{$t('users.form.cancel')}
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
					{isEdit ? $t('users.form.submittingUpdate') : $t('users.form.submittingCreate')}
				{:else}
					<span>{isEdit ? $t('users.form.submitUpdate') : $t('users.form.submitCreate')}</span>
				{/if}
			</button>
		</div>
	</form>
</div>
