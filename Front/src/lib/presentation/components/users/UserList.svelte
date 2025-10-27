<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import type { MessageKey } from '$lib/i18n';
	import type { User, Role } from '$lib/application/services/users/UserManagementService';
import { userManagementService } from '$lib/application/services/users/UserManagementService';

export let users: User[] = [];
export let showFilters: boolean = true;
export let showCreateButton: boolean = false;
export let limit: number = 0;
export let currentUserRole: string = '';
// TODO: Revisar uso de callbacks - considerar hacer pattern con eventos solamente
export let onUserClick: ((detail: { user: User }) => void) | undefined = undefined;
export let onCreateUser: (() => void) | undefined = undefined;
export let onEditUser: ((detail: { user: User }) => void) | undefined = undefined;
export let onDeleteUser: ((detail: { user: User }) => void) | undefined = undefined;
export let onToggleUser: ((detail: { user: User; isActive: boolean }) => void) | undefined;
export let onChangeRole: ((detail: { user: User; newRole: string }) => void) | undefined;
export let onResetPassword: ((detail: { user: User }) => void) | undefined = undefined;

	const dispatch = createEventDispatcher<{
		userClick: { user: User };
		createUser: void;
		editUser: { user: User };
		deleteUser: { user: User };
		toggleUser: { user: User; isActive: boolean };
		changeRole: { user: User; newRole: string };
		resetPassword: { user: User };
	}>();

	let loading = false;
	let error = '';

	// If no users are passed as props, fetch them
	onMount(async () => {
		if (users.length === 0) {
			await refreshUsers();
		}
	});

	export async function refreshUsers() {
		loading = true;
		error = '';
		try {
			const result = await userManagementService.getUsers();
			users = result.users;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al cargar usuarios';
			console.error('Error loading users:', err);
		} finally {
			loading = false;
		}
	}

	let searchTerm = '';
	let selectedRole = '';
	let selectedStatus = '';
	let sortBy = 'created_desc';

	$: filteredUsers = filterAndSortUsers(users, searchTerm, selectedRole, selectedStatus, sortBy, limit);

	function filterAndSortUsers(
		userList: User[],
		search: string,
		role: string,
		status: string,
		sort: string,
		itemLimit: number
	): User[] {
		let filtered = [...userList];

		// Filtrar por búsqueda
		if (search.trim()) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter(user =>
				user.username.toLowerCase().includes(searchLower) ||
				user.nombre.toLowerCase().includes(searchLower) ||
				user.apellido.toLowerCase().includes(searchLower) ||
				`${user.nombre} ${user.apellido}`.toLowerCase().includes(searchLower)
			);
		}

		// Filtrar por rol
		if (role) {
			filtered = filtered.filter(user => user.role === role);
		}

		// Filtrar por estado
		if (status) {
			const isActive = status === 'active';
			filtered = filtered.filter(user => user.isActive === isActive);
		}

		// Ordenar
		filtered.sort((a, b) => {
			switch (sort) {
				case 'created_asc':
					return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
				case 'name_asc':
					return `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`);
				case 'username_asc':
					return a.username.localeCompare(b.username);
				case 'role_asc':
					return a.role.localeCompare(b.role);
				default: // created_desc
					return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			}
		});

		// Limitar resultados
		if (itemLimit > 0) {
			filtered = filtered.slice(0, itemLimit);
		}

	return filtered;
}

function handleUserClick(user: User) {
	onUserClick?.({ user });
	dispatch('userClick', { user });
}

function handleCreateUser() {
	onCreateUser?.();
	dispatch('createUser');
}

function handleEditUser(user: User) {
	onEditUser?.({ user });
	dispatch('editUser', { user });
}

function handleDeleteUser(user: User) {
	if (confirm(`¿Estás seguro de que deseas eliminar el usuario ${user.username}?`)) {
		onDeleteUser?.({ user });
		dispatch('deleteUser', { user });
	}
}

function handleToggleUser(user: User) {
	const action = user.isActive ? 'desactivar' : 'activar';
	if (confirm(`¿Estás seguro de que deseas ${action} el usuario ${user.username}?`)) {
		onToggleUser?.({ user, isActive: !user.isActive });
		dispatch('toggleUser', { user, isActive: !user.isActive });
	}
}

async function handleChangeRole(user: User, newRole: string) {
	if (confirm(`¿Cambiar el rol de ${user.username} a ${newRole}?`)) {
		onChangeRole?.({ user, newRole });
		dispatch('changeRole', { user, newRole });
	}
}

function handleResetPassword(user: User) {
	if (confirm(`¿Restablecer la contraseña de ${user.username}?`)) {
		onResetPassword?.({ user });
		dispatch('resetPassword', { user });
	}
}

	function formatDate(date: Date): string {
		return new Intl.DateTimeFormat('es-ES', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(date));
	}

	function canEditUser(user: User): boolean {
		if (currentUserRole === 'administrador') return true;
		if (currentUserRole === 'colaborador' && user.role !== 'administrador') return true;
		return false;
	}

	function canDeleteUser(user: User): boolean {
		return currentUserRole === 'administrador' && user.role !== 'administrador';
	}

	function canChangeRole(user: User, targetRole: string): boolean {
		if (currentUserRole === 'administrador') return true;
		if (currentUserRole === 'colaborador' && user.role !== 'administrador' && targetRole !== 'administrador') {
			return true;
		}
		return false;
	}

	const roles: { value: string; labelKey: MessageKey }[] = [
		{ value: '', labelKey: 'dashboard.userFilters.allRoles' },
		{ value: 'asistente', labelKey: 'dashboard.userFilters.assistants' },
		{ value: 'colaborador', labelKey: 'dashboard.userFilters.collaborators' },
		{ value: 'administrador', labelKey: 'dashboard.userFilters.admins' }
	];

	const statusOptions: { value: string; labelKey: MessageKey }[] = [
		{ value: '', labelKey: 'dashboard.userFilters.allStatuses' },
		{ value: 'active', labelKey: 'dashboard.userFilters.active' },
		{ value: 'inactive', labelKey: 'dashboard.userFilters.inactive' }
	];

	const sortOptions: { value: string; labelKey: MessageKey }[] = [
		{ value: 'created_desc', labelKey: 'dashboard.userSort.mostRecent' },
		{ value: 'created_asc', labelKey: 'dashboard.userSort.oldest' },
		{ value: 'name_asc', labelKey: 'dashboard.userSort.nameAZ' },
		{ value: 'username_asc', labelKey: 'dashboard.userSort.usernameAZ' },
		{ value: 'role_asc', labelKey: 'dashboard.userSort.roleAZ' }
	];
</script>

<div class="space-y-6">
	<!-- Filtros y búsqueda -->
	{#if showFilters}
		<div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
			<div class="flex flex-col lg:flex-row gap-4 items-center">
				<!-- Búsqueda -->
				<div class="flex-1 w-full lg:w-auto">
					<div class="relative">
						<svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
						</svg>
						<input
							type="text"
							bind:value={searchTerm}
							placeholder={$t('dashboard.userSearchPlaceholder')}
							class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
				</div>

				<!-- Filtros -->
				<div class="flex flex-wrap gap-2 w-full lg:w-auto">
					<!-- Filtro por rol -->
					<select
						bind:value={selectedRole}
						class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						{#each roles as role}
							<option value={role.value}>{$t(role.labelKey)}</option>
						{/each}
					</select>

					<!-- Filtro por estado -->
					<select
						bind:value={selectedStatus}
						class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						{#each statusOptions as status}
							<option value={status.value}>{$t(status.labelKey)}</option>
						{/each}
					</select>

					<!-- Ordenar -->
					<select
						bind:value={sortBy}
						class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						{#each sortOptions as option}
							<option value={option.value}>{$t(option.labelKey)}</option>
						{/each}
					</select>
				</div>

				<!-- Botón crear usuario -->
				{#if showCreateButton}
					<button
						on:click={handleCreateUser}
						class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 w-full lg:w-auto justify-center"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
						</svg>
						<span class="text-center whitespace-normal text-sm sm:text-base">{$t('dashboard.userCreateButton')}</span>
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Lista de usuarios -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
		{#if loading}
			<div class="text-center py-12">
				<svg class="animate-spin mx-auto h-8 w-8 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				<p class="text-gray-600">Cargando usuarios...</p>
			</div>
		{:else if error}
			<div class="text-center py-12">
				<svg class="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				<h3 class="text-lg font-medium text-gray-900 mb-2">Error al cargar usuarios</h3>
				<p class="text-gray-500 mb-4">{error}</p>
				<button
					on:click={refreshUsers}
					class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base text-center whitespace-normal"
				>
					{$t('dashboard.userRetryButton')}
				</button>
			</div>
		{:else if filteredUsers.length === 0}
			<div class="text-center py-12">
				<svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
				</svg>
				<h3 class="text-lg font-medium text-gray-900 mb-2">No hay usuarios</h3>
				<p class="text-gray-500 mb-4">No se encontraron usuarios que coincidan con los filtros seleccionados.</p>
				{#if showCreateButton}
					<button
						on:click={handleCreateUser}
						class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base text-center whitespace-normal"
					>
						{$t('dashboard.userCreateFirstButton')}
					</button>
				{/if}
			</div>
		{:else}
			<!-- Vista de escritorio -->
			<div class="hidden md:block">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Usuario
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Rol
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Estado
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Creado
							</th>
							<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								Acciones
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each filteredUsers as user}
							<tr class="hover:bg-gray-50 transition-colors">
								<!-- Usuario -->
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div class="flex-shrink-0 h-10 w-10">
											<div class="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
												<span class="text-sm font-medium text-white">
													{user.nombre.charAt(0).toUpperCase()}{user.apellido.charAt(0).toUpperCase()}
												</span>
											</div>
										</div>
										<div class="ml-4">
											<div class="text-sm font-medium text-gray-900">
												{user.nombre} {user.apellido}
											</div>
											<div class="text-sm text-gray-500">@{user.username}</div>
											{#if user.telefono}
												<div class="text-xs text-gray-400">{user.telefono}</div>
											{/if}
										</div>
									</div>
								</td>

								<!-- Rol -->
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {userManagementService.getRoleColor(user.role)}">
										{user.role}
									</span>
								</td>

								<!-- Estado -->
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
										{user.isActive ? 'Activo' : 'Inactivo'}
									</span>
								</td>

								<!-- Fecha de creación -->
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDate(user.createdAt)}
								</td>

								<!-- Acciones -->
								<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<div class="flex flex-wrap items-center justify-end gap-2">
										<!-- Ver/Editar -->
										{#if canEditUser(user)}
											<button
												on:click={() => handleEditUser(user)}
												class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-blue-100 text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
												title={$t('action.edit')}
												aria-label={$t('action.edit')}
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
												</svg>
												<span>{$t('action.edit')}</span>
											</button>
										{/if}

										<!-- Activar/Desactivar -->
										{#if canEditUser(user)}
											<button
												on:click={() => handleToggleUser(user)}
												class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 {user.isActive ? 'border-red-100 text-red-600 hover:bg-red-50 focus:ring-red-500' : 'border-green-100 text-green-600 hover:bg-green-50 focus:ring-green-500'}"
												title={user.isActive ? $t('users.actions.deactivate') : $t('users.actions.activate')}
												aria-label={user.isActive ? $t('users.actions.deactivate') : $t('users.actions.activate')}
											>
												{#if user.isActive}
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636"/>
													</svg>
													<span>{$t('users.actions.deactivate')}</span>
												{:else}
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
													</svg>
													<span>{$t('users.actions.activate')}</span>
												{/if}
											</button>
										{/if}

										<!-- Restablecer contraseña -->
										{#if canEditUser(user)}
											<button
												on:click={() => handleResetPassword(user)}
												class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-yellow-100 text-yellow-600 hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 transition-colors"
												title={$t('users.actions.resetPassword')}
												aria-label={$t('users.actions.resetPassword')}
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2H7v-2H4a1 1 0 01-1-1v-4a1 1 0 011-1h3l4.586-4.586A6 6 0 0119 9z"/>
												</svg>
												<span>{$t('users.actions.resetPassword')}</span>
											</button>
										{/if}

										<!-- Eliminar -->
										{#if canDeleteUser(user)}
											<button
												on:click={() => handleDeleteUser(user)}
												class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
												title={$t('action.delete')}
												aria-label={$t('action.delete')}
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
												</svg>
												<span>{$t('action.delete')}</span>
											</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Vista móvil -->
			<div class="md:hidden">
				<div class="divide-y divide-gray-200">
					{#each filteredUsers as user}
						<div class="p-4 hover:bg-gray-50 transition-colors">
							<div class="flex items-center space-x-3 mb-3">
								<div class="flex-shrink-0 h-10 w-10">
									<div class="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
										<span class="text-sm font-medium text-white">
											{user.nombre.charAt(0).toUpperCase()}{user.apellido.charAt(0).toUpperCase()}
										</span>
									</div>
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-gray-900 truncate">
										{user.nombre} {user.apellido}
									</p>
									<p class="text-sm text-gray-500 truncate">@{user.username}</p>
								</div>
								<div class="flex flex-col items-end space-y-1">
									<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {userManagementService.getRoleColor(user.role)}">
										{user.role}
									</span>
									<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
										{user.isActive ? 'Activo' : 'Inactivo'}
									</span>
								</div>
							</div>

							<div class="flex items-center justify-between">
								<div class="text-xs text-gray-500">
									Creado: {formatDate(user.createdAt)}
								</div>
								<div class="flex flex-wrap items-center justify-end gap-2">
										{#if canEditUser(user)}
											<button
												on:click={() => handleEditUser(user)}
												class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-blue-100 text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
												title={$t('action.edit')}
												aria-label={$t('action.edit')}
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
												</svg>
												<span>{$t('action.edit')}</span>
											</button>
										{/if}
										{#if canEditUser(user)}
											<button
												on:click={() => handleToggleUser(user)}
												class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 {user.isActive ? 'border-red-100 text-red-600 hover:bg-red-50 focus:ring-red-500' : 'border-green-100 text-green-600 hover:bg-green-50 focus:ring-green-500'}"
												title={user.isActive ? $t('users.actions.deactivate') : $t('users.actions.activate')}
												aria-label={user.isActive ? $t('users.actions.deactivate') : $t('users.actions.activate')}
											>
												{#if user.isActive}
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636"/>
													</svg>
													<span>{$t('users.actions.deactivate')}</span>
												{:else}
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
													</svg>
													<span>{$t('users.actions.activate')}</span>
												{/if}
											</button>
										{/if}
										{#if canEditUser(user)}
											<button
												on:click={() => handleResetPassword(user)}
												class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-yellow-100 text-yellow-600 hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 transition-colors"
												title={$t('users.actions.resetPassword')}
												aria-label={$t('users.actions.resetPassword')}
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2H7v-2H4a1 1 0 01-1-1v-4a1 1 0 011-1h3l4.586-4.586A6 6 0 0119 9z"/>
												</svg>
												<span>{$t('users.actions.resetPassword')}</span>
											</button>
										{/if}
										{#if canDeleteUser(user)}
											<button
												on:click={() => handleDeleteUser(user)}
												class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
												title={$t('action.delete')}
												aria-label={$t('action.delete')}
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
												</svg>
												<span>{$t('action.delete')}</span>
											</button>
										{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
