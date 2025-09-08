<script lang="ts">
	import { onMount } from 'svelte';
	import { canManageUsers, ROLES, getRoleDisplayName, getRoleDescription, type UserRole } from '$lib/utils/roleUtils';

	export let currentUser: { role?: UserRole; id?: string } | null = null;

	let users: any[] = [];
	let loading = false;
	let error = '';
	let success = '';

	// Check if current user can manage roles
	$: canManage = canManageUsers(currentUser?.role);

	onMount(() => {
		if (canManage) {
			loadUsers();
		}
	});

	async function loadUsers() {
		try {
			loading = true;
			error = '';

			const response = await fetch('/api/users', {
				method: 'GET',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error('Error cargando usuarios');
			}

			users = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error desconocido';
		} finally {
			loading = false;
		}
	}

	async function updateUserRole(userId: string, newRole: UserRole) {
		try {
			success = '';
			error = '';

			const response = await fetch(`/api/users/${userId}/role`, {
				method: 'PUT',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ role: newRole })
			});

			if (!response.ok) {
				throw new Error('Error actualizando rol del usuario');
			}

			// Update user in local array
			users = users.map(user => 
				user.id === userId ? { ...user, role: newRole } : user
			);

			success = `Rol actualizado correctamente para el usuario.`;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error actualizando rol';
		}
	}

	function handleRoleChange(event: Event, userId: string) {
		const target = event.target as HTMLSelectElement;
		const newRole = target.value as UserRole;
		
		if (confirm(`¿Estás seguro de cambiar el rol de este usuario a "${getRoleDisplayName(newRole)}"?`)) {
			updateUserRole(userId, newRole);
		} else {
			// Revert select value
			const user = users.find(u => u.id === userId);
			if (user) {
				target.value = user.role;
			}
		}
	}
</script>

{#if !canManage}
	<div class="access-denied">
		<h3>Acceso Denegado</h3>
		<p>No tienes permisos para gestionar roles de usuarios. Esta función está disponible solo para Administradores.</p>
	</div>
{:else}
	<div class="role-management">
		<div class="header">
			<h2>Gestión de Roles</h2>
			<p>Administra los roles de los usuarios del sistema</p>
		</div>

		{#if error}
			<div class="alert alert-error">
				{error}
			</div>
		{/if}

		{#if success}
			<div class="alert alert-success">
				{success}
			</div>
		{/if}

		<div class="role-info">
			<h3>Información de Roles</h3>
			<div class="role-cards">
				{#each Object.values(ROLES) as role}
					<div class="role-card">
						<h4>{getRoleDisplayName(role)}</h4>
						<p>{getRoleDescription(role)}</p>
					</div>
				{/each}
			</div>
		</div>

		{#if loading}
			<div class="loading">
				<div class="loading-spinner"></div>
				<p>Cargando usuarios...</p>
			</div>
		{:else if users.length === 0}
			<div class="empty-state">
				<p>No se encontraron usuarios</p>
			</div>
		{:else}
			<div class="users-table">
				<h3>Usuarios del Sistema</h3>
				<div class="table-container">
					<table>
						<thead>
							<tr>
								<th>Usuario</th>
								<th>Nombre</th>
								<th>Email</th>
								<th>Rol Actual</th>
								<th>Cambiar Rol</th>
							</tr>
						</thead>
						<tbody>
							{#each users as user (user.id)}
								<tr>
									<td class="username">{user.username}</td>
									<td>{user.nombre || 'N/A'} {user.apellido || ''}</td>
									<td>{user.email || 'N/A'}</td>
									<td>
										<span class="role-badge role-{user.role?.toLowerCase()}">
											{getRoleDisplayName(user.role)}
										</span>
									</td>
									<td>
										{#if user.id !== currentUser?.id}
											<select 
												value={user.role}
												on:change={(e) => handleRoleChange(e, user.id)}
												class="role-select"
											>
												{#each Object.values(ROLES) as role}
													<option value={role}>
														{getRoleDisplayName(role)}
													</option>
												{/each}
											</select>
										{:else}
											<span class="current-user">Tu cuenta</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.role-management {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.access-denied {
		background: var(--color-error-light);
		color: var(--color-error-dark);
		padding: 2rem;
		border-radius: 8px;
		text-align: center;
	}

	.access-denied h3 {
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
	}

	.header {
		margin-bottom: 2rem;
	}

	.header h2 {
		margin: 0 0 0.5rem 0;
		color: var(--color-text-primary);
		font-size: 1.8rem;
	}

	.header p {
		margin: 0;
		color: var(--color-text-muted);
	}

	.alert {
		padding: 1rem;
		border-radius: 6px;
		margin-bottom: 1rem;
	}

	.alert-error {
		background: var(--color-error-light);
		color: var(--color-error-dark);
		border: 1px solid var(--color-error);
	}

	.alert-success {
		background: var(--color-success-light);
		color: var(--color-success-dark);
		border: 1px solid var(--color-success);
	}

	.role-info {
		background: var(--color-background-alt);
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.role-info h3 {
		margin: 0 0 1rem 0;
		color: var(--color-text-primary);
	}

	.role-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.role-card {
		background: white;
		padding: 1rem;
		border-radius: 6px;
		border: 1px solid var(--color-border);
	}

	.role-card h4 {
		margin: 0 0 0.5rem 0;
		color: var(--color-text-primary);
		font-size: 1rem;
	}

	.role-card p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		text-align: center;
	}

	.loading-spinner {
		width: 2.5rem;
		height: 2.5rem;
		border: 3px solid var(--color-border);
		border-top: 3px solid var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: var(--color-text-muted);
	}

	.users-table h3 {
		margin: 0 0 1rem 0;
		color: var(--color-text-primary);
	}

	.table-container {
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid var(--color-border);
	}

	th {
		background: var(--color-background-alt);
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.username {
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.role-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.role-asistente {
		background: var(--color-secondary-light);
		color: var(--color-secondary-dark);
	}

	.role-colaborador {
		background: var(--color-primary-light);
		color: var(--color-primary-dark);
	}

	.role-administrador {
		background: var(--color-accent-light);
		color: var(--color-accent-dark);
	}

	.role-select {
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background: white;
		min-width: 120px;
	}

	.current-user {
		font-style: italic;
		color: var(--color-text-muted);
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	@media (max-width: 768px) {
		.role-management {
			padding: 1rem;
		}

		.role-cards {
			grid-template-columns: 1fr;
		}

		.table-container {
			overflow-x: auto;
		}

		table {
			min-width: 600px;
		}
	}
</style>