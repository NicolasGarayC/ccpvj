import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import UserList from '../UserList.svelte';
import { userManagementService, type User } from '$lib/services/users/userManagementService';

vi.mock('$lib/services/users/userManagementService', () => ({
	userManagementService: {
		getUsers: vi.fn(),
		getRoleColor: vi.fn(() => 'bg-blue-100 text-blue-800')
	}
}));

vi.mock('$lib/i18n', () => ({
	t: vi.fn((key: string) => key)
}));

const mockUsers: User[] = [
	{ id: 1, username: 'admin', nombre: 'Admin', apellido: 'User', telefono: '123', role: 'administrador', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
	{ id: 2, username: 'collab', nombre: 'Collab', apellido: 'User', telefono: null, role: 'colaborador', isActive: true, createdAt: '2024-01-02', updatedAt: '2024-01-02' },
	{ id: 3, username: 'assist', nombre: 'Assist', apellido: 'User', telefono: '789', role: 'asistente', isActive: false, createdAt: '2024-01-03', updatedAt: '2024-01-03' }
];

describe('UserList', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(userManagementService.getUsers).mockResolvedValue({ users: mockUsers, total: 3 });
		global.confirm = vi.fn(() => true);
	});

	describe('Rendering', () => {
		it('should render with provided users', async () => {
			render(UserList, { props: { users: mockUsers } });
			await waitFor(() => {
				expect(screen.getByText('Admin User')).toBeInTheDocument();
			});
		});

		it('should fetch users if none provided', async () => {
			render(UserList);
			await waitFor(() => {
				expect(userManagementService.getUsers).toHaveBeenCalled();
			});
		});

		it('should show filters when showFilters is true', () => {
			render(UserList, { props: { users: mockUsers, showFilters: true } });
			expect(screen.getByPlaceholderText('dashboard.userSearchPlaceholder')).toBeInTheDocument();
		});

		it('should hide filters when showFilters is false', () => {
			render(UserList, { props: { users: mockUsers, showFilters: false } });
			expect(screen.queryByPlaceholderText('dashboard.userSearchPlaceholder')).not.toBeInTheDocument();
		});

		it('should show create button when showCreateButton is true', () => {
			render(UserList, { props: { users: mockUsers, showCreateButton: true } });
			expect(screen.getByText('dashboard.userCreateButton')).toBeInTheDocument();
		});
	});

	describe('Search and Filters', () => {
		it('should filter by search term', async () => {
			render(UserList, { props: { users: mockUsers } });
			const searchInput = screen.getByPlaceholderText('dashboard.userSearchPlaceholder');
			await fireEvent.input(searchInput, { target: { value: 'admin' } });
			await waitFor(() => {
				expect(screen.getByText('Admin User')).toBeInTheDocument();
				expect(screen.queryByText('Collab User')).not.toBeInTheDocument();
			});
		});

		it('should filter by role', async () => {
			render(UserList, { props: { users: mockUsers } });
			const roleSelect = screen.getAllByRole('combobox')[0];
			await fireEvent.change(roleSelect, { target: { value: 'administrador' } });
			await waitFor(() => {
				expect(screen.getByText('Admin User')).toBeInTheDocument();
				expect(screen.queryByText('Collab User')).not.toBeInTheDocument();
			});
		});

		it('should filter by status', async () => {
			render(UserList, { props: { users: mockUsers } });
			const statusSelect = screen.getAllByRole('combobox')[1];
			await fireEvent.change(statusSelect, { target: { value: 'inactive' } });
			await waitFor(() => {
				expect(screen.getByText('Assist User')).toBeInTheDocument();
				expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
			});
		});

		it('should sort by name', async () => {
			render(UserList, { props: { users: mockUsers } });
			const sortSelect = screen.getAllByRole('combobox')[2];
			await fireEvent.change(sortSelect, { target: { value: 'name_asc' } });
			await waitFor(() => {
				const userNames = Array.from(document.querySelectorAll('.text-sm.font-medium.text-gray-900')).map(el => el.textContent);
				expect(userNames[0]).toBe('Admin User');
			});
		});
	});

	describe('User Display', () => {
		it('should display user initials', async () => {
			render(UserList, { props: { users: mockUsers } });
			await waitFor(() => {
				expect(screen.getByText('AU')).toBeInTheDocument();
			});
		});

		it('should display user role badge', async () => {
			render(UserList, { props: { users: mockUsers } });
			await waitFor(() => {
				expect(screen.getAllByText('administrador')[0]).toBeInTheDocument();
			});
		});

		it('should display active status', async () => {
			render(UserList, { props: { users: mockUsers } });
			await waitFor(() => {
				expect(screen.getAllByText('Activo').length).toBeGreaterThan(0);
			});
		});

		it('should display phone if available', async () => {
			render(UserList, { props: { users: mockUsers } });
			await waitFor(() => {
				expect(screen.getByText('123')).toBeInTheDocument();
			});
		});
	});

	describe('Actions', () => {
		it('should dispatch editUser event', async () => {
			const { component } = render(UserList, { props: { users: mockUsers, currentUserRole: 'administrador' } });
			const editSpy = vi.fn();
			component.$on('editUser', editSpy);

			await waitFor(() => {
				const editButtons = screen.getAllByText('action.edit');
				fireEvent.click(editButtons[0]);
			});

			expect(editSpy).toHaveBeenCalled();
		});

		it('should dispatch deleteUser event with confirmation', async () => {
			const { component } = render(UserList, { props: { users: mockUsers, currentUserRole: 'administrador' } });
			const deleteSpy = vi.fn();
			component.$on('deleteUser', deleteSpy);

			await waitFor(() => {
				const deleteButtons = screen.getAllByText('action.delete');
				fireEvent.click(deleteButtons[0]);
			});

			expect(global.confirm).toHaveBeenCalled();
			expect(deleteSpy).toHaveBeenCalled();
		});

		it('should dispatch toggleUser event', async () => {
			const { component } = render(UserList, { props: { users: mockUsers, currentUserRole: 'administrador' } });
			const toggleSpy = vi.fn();
			component.$on('toggleUser', toggleSpy);

			await waitFor(() => {
				const toggleButtons = screen.getAllByText('users.actions.deactivate');
				fireEvent.click(toggleButtons[0]);
			});

			expect(toggleSpy).toHaveBeenCalled();
		});

		it('should dispatch resetPassword event', async () => {
			const { component } = render(UserList, { props: { users: mockUsers, currentUserRole: 'administrador' } });
			const resetSpy = vi.fn();
			component.$on('resetPassword', resetSpy);

			await waitFor(() => {
				const resetButtons = screen.getAllByText('users.actions.resetPassword');
				fireEvent.click(resetButtons[0]);
			});

			expect(resetSpy).toHaveBeenCalled();
		});
	});

	describe('Permissions', () => {
		it('should show edit button for admin on all users', async () => {
			render(UserList, { props: { users: mockUsers, currentUserRole: 'administrador' } });
			await waitFor(() => {
				expect(screen.getAllByText('action.edit').length).toBeGreaterThan(0);
			});
		});

		it('should hide delete button for non-admin users', async () => {
			render(UserList, { props: { users: mockUsers, currentUserRole: 'colaborador' } });
			await waitFor(() => {
				expect(screen.queryByText('action.delete')).not.toBeInTheDocument();
			});
		});

		it('should not show delete button for admin users', async () => {
			const adminOnly = [mockUsers[0]];
			render(UserList, { props: { users: adminOnly, currentUserRole: 'administrador' } });
			await waitFor(() => {
				expect(screen.queryByText('action.delete')).not.toBeInTheDocument();
			});
		});
	});

	describe('Loading and Error States', () => {
		it('should show loading state', async () => {
			vi.mocked(userManagementService.getUsers).mockImplementation(
				() => new Promise(resolve => setTimeout(() => resolve({ users: mockUsers, total: 3 }), 100))
			);
			render(UserList);
			expect(screen.getByText('Cargando usuarios...')).toBeInTheDocument();
		});

		it('should show error state', async () => {
			vi.mocked(userManagementService.getUsers).mockRejectedValue(new Error('Failed'));
			render(UserList);
			await waitFor(() => {
				expect(screen.getByText('Error al cargar usuarios')).toBeInTheDocument();
			});
		});

		it('should retry on error', async () => {
			vi.mocked(userManagementService.getUsers)
				.mockRejectedValueOnce(new Error('Failed'))
				.mockResolvedValueOnce({ users: mockUsers, total: 3 });

			const { component } = render(UserList);
			await waitFor(() => screen.getByText('dashboard.userRetryButton'));

			await component.refreshUsers();
			expect(userManagementService.getUsers).toHaveBeenCalledTimes(2);
		});

		it('should show empty state', async () => {
			vi.mocked(userManagementService.getUsers).mockResolvedValue({ users: [], total: 0 });
			render(UserList);
			await waitFor(() => {
				expect(screen.getByText('No hay usuarios')).toBeInTheDocument();
			});
		});
	});

	describe('Limit', () => {
		it('should respect limit prop', async () => {
			render(UserList, { props: { users: mockUsers, limit: 2 } });
			await waitFor(() => {
				const rows = document.querySelectorAll('tbody tr');
				expect(rows.length).toBe(2);
			});
		});

		it('should show all users when limit is 0', async () => {
			render(UserList, { props: { users: mockUsers, limit: 0 } });
			await waitFor(() => {
				const rows = document.querySelectorAll('tbody tr');
				expect(rows.length).toBe(3);
			});
		});
	});
});
