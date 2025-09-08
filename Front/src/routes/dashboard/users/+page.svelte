<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import UserList from '$lib/components/users/UserList.svelte';
  import UserForm from '$lib/components/users/UserForm.svelte';
  import { authService } from '$lib/services/authService.js';
  import { userManagementService, type User } from '$lib/services/users/userManagementService';

  let canManageUsers = false;
  let showCreateForm = false;
  let editingUser: User | null = null;
  let userListComponent: UserList;

  onMount(async () => {
    if (!browser) return;

    const isAuthenticated = await authService.isAuthenticated();
    if (!isAuthenticated) {
      goto('/auth/login');
      return;
    }

    canManageUsers = await userManagementService.canManageUsers();
    if (!canManageUsers) {
      goto('/dashboard');
      return;
    }
  });

  function handleCreateUser() {
    editingUser = null;
    showCreateForm = true;
  }

  function handleEditUser(event: CustomEvent<User>) {
    editingUser = event.detail;
    showCreateForm = true;
  }

  function handleUserSaved() {
    showCreateForm = false;
    editingUser = null;
    userListComponent.refreshUsers();
  }

  function handleCloseForm() {
    showCreateForm = false;
    editingUser = null;
  }
</script>

<svelte:head>
  <title>Gestión de Usuarios - Centro Cultural Víctor Jara</title>
</svelte:head>

{#if canManageUsers}
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <p class="text-gray-600 mt-2">Administra los usuarios del sistema</p>
      </div>
      <button
        on:click={handleCreateUser}
        class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Nuevo Usuario
      </button>
    </div>

    <!-- Lista de usuarios -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <UserList 
        bind:this={userListComponent}
        on:edit-user={handleEditUser}
      />
    </div>

    <!-- Modal para crear/editar usuario -->
    {#if showCreateForm}
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
          <div class="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900">
              {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            </h2>
            <button
              on:click={handleCloseForm}
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="p-6">
            <UserForm
              user={editingUser}
              on:user-saved={handleUserSaved}
              on:cancel={handleCloseForm}
            />
          </div>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <div class="container mx-auto px-4 py-8">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
      <p class="text-gray-600">No tienes permisos para gestionar usuarios.</p>
      <a href="/dashboard" class="text-blue-600 hover:text-blue-800 mt-4 inline-block">
        Volver al Dashboard
      </a>
    </div>
  </div>
{/if}