import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import UserList from '../UserList.svelte';
import { userManagementService, type User, type UserPagedResult } from '$lib/application/services/users/UserManagementService';

vi.mock('$lib/application/services/users/UserManagementService', () => ({
	userManagementService: {
		getUsers: vi.fn(),
		getRoleColor: vi.fn(() => 'bg-blue-100 text-blue-800')
	}
}));

const mockUsers: User[] = [
	{
		id: 1,
		username: 'admin',
		nombre: 'Admin',
		apellido: 'User',
		telefono: '123',
		role: 'administrador',
		isActive: true,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01')
	},
	{
		id: 2,
		username: 'collab',
		nombre: 'Collab',
		apellido: 'User',
		role: 'colaborador',
		isActive: true,
		createdAt: new Date('2024-01-02'),
		updatedAt: new Date('2024-01-02')
	},
	{
		id: 3,
		username: 'assist',
		nombre: 'Assist',
		apellido: 'User',
		telefono: '789',
		role: 'asistente',
		isActive: false,
		createdAt: new Date('2024-01-03'),
		updatedAt: new Date('2024-01-03')
	}
];

const createPagedResult = (
	users: User[],
	overrides: Partial<UserPagedResult> = {}
): UserPagedResult => ({
	users,
	totalCount: overrides.totalCount ?? users.length,
	page: overrides.page ?? 1,
	pageSize: overrides.pageSize ?? (users.length || 1),
	totalPages: overrides.totalPages ?? 1,
	hasNextPage: overrides.hasNextPage ?? false,
	hasPreviousPage: overrides.hasPreviousPage ?? false
});

describe('UserList', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(userManagementService.getUsers).mockResolvedValue(createPagedResult(mockUsers));
		global.confirm = vi.fn(() => true);
	});

	describe('Rendering', () => {
		it('should render with provided users', async () => {
			render(UserList, { props: { users: mockUsers } });
			await waitFor(() => {
				expect(screen.getAllByText('Admin User')[0]).toBeInTheDocument();
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
				expect(screen.getAllByText('Admin User').length).toBeGreaterThan(0);
				expect(screen.queryByText('Collab User')).not.toBeInTheDocument();
			});
		});

		it('should filter by role', async () => {
			render(UserList, { props: { users: mockUsers } });
			const roleSelect = screen.getAllByRole('combobox')[0];
			await fireEvent.change(roleSelect, { target: { value: 'administrador' } });
			await waitFor(() => {
				expect(screen.getAllByText('Admin User').length).toBeGreaterThan(0);
				expect(screen.queryByText('Collab User')).not.toBeInTheDocument();
			});
		});

		it('should filter by status', async () => {
			render(UserList, { props: { users: mockUsers } });
			const statusSelect = screen.getAllByRole('combobox')[1];
			await fireEvent.change(statusSelect, { target: { value: 'inactive' } });
			await waitFor(() => {
				expect(screen.getAllByText('Assist User').length).toBeGreaterThan(0);
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
				expect(screen.getAllByText('AU').length).toBeGreaterThan(0);
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
			const editSpy = vi.fn();
			render(UserList, {
				props: {
					users: mockUsers,
					currentUserRole: 'administrador',
					onEditUser: editSpy
				}
			});

			const editButtons = await screen.findAllByText('action.edit');
			await fireEvent.click(editButtons[0]);

			expect(editSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					user: expect.objectContaining({ username: 'assist' })
				})
			);
		});

		it('should dispatch deleteUser event with confirmation', async () => {
			const deleteSpy = vi.fn();
			render(UserList, {
				props: {
					users: mockUsers,
					currentUserRole: 'administrador',
					onDeleteUser: deleteSpy
				}
			});

			const deleteButtons = await screen.findAllByText('action.delete');
			await fireEvent.click(deleteButtons[0]);

			expect(global.confirm).toHaveBeenCalled();
			expect(deleteSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					user: expect.objectContaining({ username: 'assist' })
				})
			);
		});

		it('should dispatch toggleUser event', async () => {
			const toggleSpy = vi.fn();
			render(UserList, {
				props: {
					users: mockUsers,
					currentUserRole: 'administrador',
					onToggleUser: toggleSpy
				}
			});

			const toggleButtons = await screen.findAllByText('users.actions.deactivate');
			await fireEvent.click(toggleButtons[0]);

			expect(toggleSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					user: expect.objectContaining({ username: 'collab' }),
					isActive: false
				})
			);
		});

		it('should dispatch resetPassword event', async () => {
			const resetSpy = vi.fn();
			render(UserList, {
				props: {
					users: mockUsers,
					currentUserRole: 'administrador',
					onResetPassword: resetSpy
				}
			});

			const resetButtons = await screen.findAllByText('users.actions.resetPassword');
			await fireEvent.click(resetButtons[0]);

			expect(resetSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					user: expect.objectContaining({ username: 'assist' })
				})
			);
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
				() => new Promise(resolve => setTimeout(() => resolve(createPagedResult(mockUsers)), 100))
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
				.mockResolvedValueOnce(createPagedResult(mockUsers));

			const { component } = render(UserList);
			await waitFor(() => screen.getByText('dashboard.userRetryButton'));

			await component.refreshUsers();
			expect(userManagementService.getUsers).toHaveBeenCalledTimes(2);
		});

		it('should show empty state', async () => {
			vi.mocked(userManagementService.getUsers).mockResolvedValue(createPagedResult([], { totalCount: 0 }));
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
