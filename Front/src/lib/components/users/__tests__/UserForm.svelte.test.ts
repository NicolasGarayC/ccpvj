import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import UserForm from '../UserForm.svelte';
import { userManagementService } from '$lib/services/users/userManagementService';
import type { User, Role } from '$lib/services/users/userManagementService';

// Mock dependencies
vi.mock('$lib/services/users/userManagementService', () => ({
	userManagementService: {
		checkUsernameAvailability: vi.fn(),
		getRoleColor: vi.fn()
	}
}));

vi.mock('$lib/i18n', () => ({
	t: vi.fn((key: string) => {
		const translations: Record<string, string> = {
			'dashboard.editUser': 'Edit User',
			'dashboard.createUser': 'Create User',
			'users.form.username.label': 'Username',
			'users.form.username.placeholder': 'Enter username',
			'users.form.username.available': 'Username available',
			'users.form.name.label': 'First Name',
			'users.form.name.placeholder': 'Enter first name',
			'users.form.lastName.label': 'Last Name',
			'users.form.lastName.placeholder': 'Enter last name',
			'users.form.phone.label': 'Phone',
			'users.form.phone.placeholder': 'Enter phone',
			'users.form.password.sectionTitleEdit': 'Password',
			'users.form.password.sectionTitleCreate': 'Password',
			'users.form.password.toggleChange': 'Change password',
			'users.form.password.labelEdit': 'New Password',
			'users.form.password.labelCreate': 'Password',
			'users.form.password.placeholder': 'Enter password',
			'users.form.password.generate': 'Generate password',
			'users.form.password.confirmLabel': 'Confirm Password',
			'users.form.password.confirmPlaceholder': 'Confirm password',
			'users.form.permissions.title': 'Permissions',
			'users.form.role.label': 'Role',
			'users.form.status.label': 'Status',
			'users.form.status.active': 'Active',
			'users.form.status.inactive': 'Inactive',
			'users.form.cancel': 'Cancel',
			'users.form.submitCreate': 'Create User',
			'users.form.submitUpdate': 'Update User',
			'users.form.submittingCreate': 'Creating...',
			'users.form.submittingUpdate': 'Updating...',
			'users.form.errors.usernameRequired': 'Username is required',
			'users.form.errors.usernameTooShort': 'Username must be at least 3 characters',
			'users.form.errors.usernameTaken': 'Username is already taken',
			'users.form.errors.passwordRequired': 'Password is required',
			'users.form.errors.passwordTooShort': 'Password must be at least 6 characters',
			'users.form.errors.passwordMismatch': 'Passwords do not match',
			'users.form.errors.nameRequired': 'First name is required',
			'users.form.errors.lastNameRequired': 'Last name is required',
			'users.form.errors.roleRequired': 'Role is required'
		};
		return translations[key] || key;
	})
}));

const mockRoles: Role[] = [
	{ id: 1, name: 'administrador', displayName: 'Administrator', description: 'Full access' },
	{ id: 2, name: 'colaborador', displayName: 'Collaborator', description: 'Can create content' },
	{ id: 3, name: 'asistente', displayName: 'Assistant', description: 'Read only' }
];

const mockUser: User = {
	id: 1,
	username: 'testuser',
	nombre: 'Test',
	apellido: 'User',
	telefono: '123456789',
	role: 'colaborador',
	isActive: true,
	createdAt: '2024-01-01T00:00:00Z',
	updatedAt: '2024-01-02T00:00:00Z'
};

describe('UserForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(userManagementService.checkUsernameAvailability).mockResolvedValue(true);
		vi.mocked(userManagementService.getRoleColor).mockReturnValue('#3b82f6');
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering - Create Mode', () => {
		it('should render create user title', () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			expect(screen.getByText('Create User')).toBeInTheDocument();
		});

		it('should render all required form fields', () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			expect(screen.getByLabelText(/Username/)).toBeInTheDocument();
			expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
			expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument();
			expect(screen.getByLabelText(/Phone/)).toBeInTheDocument();
			expect(screen.getByLabelText('Password *')).toBeInTheDocument();
			expect(screen.getByLabelText('Confirm Password *')).toBeInTheDocument();
			expect(screen.getByLabelText(/Role/)).toBeInTheDocument();
		});

		it('should render submit button with create text', () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			expect(screen.getByText('Create User')).toBeInTheDocument();
		});

		it('should not show status radio buttons in create mode', () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			expect(screen.queryByText('Active')).not.toBeInTheDocument();
			expect(screen.queryByText('Inactive')).not.toBeInTheDocument();
		});
	});

	describe('Rendering - Edit Mode', () => {
		it('should render edit user title', () => {
			render(UserForm, {
				props: {
					user: mockUser,
					isEdit: true,
					availableRoles: mockRoles
				}
			});

			expect(screen.getByText('Edit User')).toBeInTheDocument();
		});

		it('should populate form fields with user data', async () => {
			render(UserForm, {
				props: {
					user: mockUser,
					isEdit: true,
					availableRoles: mockRoles
				}
			});

			await waitFor(() => {
				const usernameInput = screen.getByLabelText(/Username/) as HTMLInputElement;
				expect(usernameInput.value).toBe('testuser');

				const nombreInput = screen.getByLabelText(/First Name/) as HTMLInputElement;
				expect(nombreInput.value).toBe('Test');

				const apellidoInput = screen.getByLabelText(/Last Name/) as HTMLInputElement;
				expect(apellidoInput.value).toBe('User');

				const phoneInput = screen.getByLabelText(/Phone/) as HTMLInputElement;
				expect(phoneInput.value).toBe('123456789');
			});
		});

		it('should render submit button with update text', () => {
			render(UserForm, {
				props: {
					user: mockUser,
					isEdit: true,
					availableRoles: mockRoles
				}
			});

			expect(screen.getByText('Update User')).toBeInTheDocument();
		});

		it('should show status radio buttons in edit mode', () => {
			render(UserForm, {
				props: {
					user: mockUser,
					isEdit: true,
					availableRoles: mockRoles
				}
			});

			expect(screen.getByText('Active')).toBeInTheDocument();
			expect(screen.getByText('Inactive')).toBeInTheDocument();
		});

		it('should show password change checkbox in edit mode', () => {
			render(UserForm, {
				props: {
					user: mockUser,
					isEdit: true,
					availableRoles: mockRoles
				}
			});

			expect(screen.getByText('Change password')).toBeInTheDocument();
		});

		it('should hide password fields initially in edit mode', () => {
			render(UserForm, {
				props: {
					user: mockUser,
					isEdit: true,
					availableRoles: mockRoles
				}
			});

			const passwordInput = screen.queryByLabelText('New Password');
			expect(passwordInput).not.toBeInTheDocument();
		});

		it('should show password fields when checkbox is clicked', async () => {
			render(UserForm, {
				props: {
					user: mockUser,
					isEdit: true,
					availableRoles: mockRoles
				}
			});

			const checkbox = screen.getByText('Change password').previousSibling as HTMLInputElement;
			await fireEvent.click(checkbox);

			await waitFor(() => {
				expect(screen.getByLabelText('New Password')).toBeInTheDocument();
			});
		});
	});

	describe('Form Fields - Username Validation', () => {
		it('should validate username availability on blur', async () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const usernameInput = screen.getByLabelText(/Username/) as HTMLInputElement;
			await fireEvent.input(usernameInput, { target: { value: 'newuser' } });
			await fireEvent.blur(usernameInput);

			await waitFor(() => {
				expect(userManagementService.checkUsernameAvailability).toHaveBeenCalledWith('newuser', undefined);
			});
		});

		it('should show checking indicator while validating', async () => {
			vi.mocked(userManagementService.checkUsernameAvailability).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(true), 100))
			);

			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const usernameInput = screen.getByLabelText(/Username/) as HTMLInputElement;
			await fireEvent.input(usernameInput, { target: { value: 'newuser' } });
			await fireEvent.blur(usernameInput);

			await waitFor(() => {
				const spinner = document.querySelector('.animate-spin');
				expect(spinner).toBeInTheDocument();
			});
		});

		it('should show success icon when username is available', async () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const usernameInput = screen.getByLabelText(/Username/) as HTMLInputElement;
			await fireEvent.input(usernameInput, { target: { value: 'newuser' } });
			await fireEvent.blur(usernameInput);

			await waitFor(() => {
				expect(screen.getByText('Username available')).toBeInTheDocument();
			});
		});

		it('should show error when username is taken', async () => {
			vi.mocked(userManagementService.checkUsernameAvailability).mockResolvedValue(false);

			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const usernameInput = screen.getByLabelText(/Username/) as HTMLInputElement;
			await fireEvent.input(usernameInput, { target: { value: 'takenuser' } });
			await fireEvent.blur(usernameInput);

			await waitFor(() => {
				expect(screen.getByText('Username is already taken')).toBeInTheDocument();
			});
		});

		it('should exclude current user id when checking in edit mode', async () => {
			render(UserForm, {
				props: {
					user: mockUser,
					isEdit: true,
					availableRoles: mockRoles
				}
			});

			const usernameInput = screen.getByLabelText(/Username/) as HTMLInputElement;
			await fireEvent.input(usernameInput, { target: { value: 'testuser' } });
			await fireEvent.blur(usernameInput);

			await waitFor(() => {
				expect(userManagementService.checkUsernameAvailability).toHaveBeenCalledWith('testuser', 1);
			});
		});
	});

	describe('Form Fields - Role Selection', () => {
		it('should render all available roles', () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			expect(screen.getByText('Administrator')).toBeInTheDocument();
			expect(screen.getByText('Collaborator')).toBeInTheDocument();
			expect(screen.getByText('Assistant')).toBeInTheDocument();
		});

		it('should select default role in create mode', () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const roleSelect = screen.getByLabelText(/Role/) as HTMLSelectElement;
			expect(roleSelect.value).toBe('colaborador');
		});

		it('should select user role in edit mode', async () => {
			render(UserForm, {
				props: {
					user: mockUser,
					isEdit: true,
					availableRoles: mockRoles
				}
			});

			await waitFor(() => {
				const roleSelect = screen.getByLabelText(/Role/) as HTMLSelectElement;
				expect(roleSelect.value).toBe('colaborador');
			});
		});

		it('should allow changing role', async () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const roleSelect = screen.getByLabelText(/Role/) as HTMLSelectElement;
			await fireEvent.change(roleSelect, { target: { value: 'administrador' } });

			expect(roleSelect.value).toBe('administrador');
		});
	});

	describe('Password Generation', () => {
		it('should render password generation button', () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const generateButton = document.querySelector('[title="Generate password"]');
			expect(generateButton).toBeInTheDocument();
		});

		it('should generate random password when button clicked', async () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const generateButton = document.querySelector('[title="Generate password"]') as HTMLElement;
			await fireEvent.click(generateButton);

			await waitFor(() => {
				const passwordInput = screen.getByLabelText('Password *') as HTMLInputElement;
				expect(passwordInput.value.length).toBe(8);

				const confirmInput = screen.getByLabelText('Confirm Password *') as HTMLInputElement;
				expect(confirmInput.value).toBe(passwordInput.value);
			});
		});

		it('should generate different passwords on each click', async () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const generateButton = document.querySelector('[title="Generate password"]') as HTMLElement;

			await fireEvent.click(generateButton);
			const passwordInput = screen.getByLabelText('Password *') as HTMLInputElement;
			const firstPassword = passwordInput.value;

			await fireEvent.click(generateButton);
			const secondPassword = passwordInput.value;

			expect(firstPassword).not.toBe(secondPassword);
		});

		it('should populate newPassword field in edit mode', async () => {
			render(UserForm, {
				props: {
					user: mockUser,
					isEdit: true,
					availableRoles: mockRoles
				}
			});

			// Enable password change
			const checkbox = screen.getByText('Change password').previousSibling as HTMLInputElement;
			await fireEvent.click(checkbox);

			await waitFor(() => {
				const generateButton = document.querySelector('[title="Generate password"]') as HTMLElement;
				fireEvent.click(generateButton);
			});

			await waitFor(() => {
				const passwordInput = screen.getByLabelText('New Password') as HTMLInputElement;
				expect(passwordInput.value.length).toBe(8);
			});
		});
	});

	describe('Validation - Create Mode', () => {
		it('should show error when username is empty', async () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const submitButton = screen.getByText('Create User');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('Username is required')).toBeInTheDocument();
			});
		});

		it('should show error when username is too short', async () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const usernameInput = screen.getByLabelText(/Username/) as HTMLInputElement;
			await fireEvent.input(usernameInput, { target: { value: 'ab' } });

			const submitButton = screen.getByText('Create User');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
			});
		});

		it('should show error when password is empty', async () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const usernameInput = screen.getByLabelText(/Username/) as HTMLInputElement;
			await fireEvent.input(usernameInput, { target: { value: 'testuser' } });

			const nombreInput = screen.getByLabelText(/First Name/) as HTMLInputElement;
			await fireEvent.input(nombreInput, { target: { value: 'Test' } });

			const apellidoInput = screen.getByLabelText(/Last Name/) as HTMLInputElement;
			await fireEvent.input(apellidoInput, { target: { value: 'User' } });

			const submitButton = screen.getByText('Create User');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('Password is required')).toBeInTheDocument();
			});
		});

		it('should show error when password is too short', async () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const usernameInput = screen.getByLabelText(/Username/) as HTMLInputElement;
			await fireEvent.input(usernameInput, { target: { value: 'testuser' } });

			const passwordInput = screen.getByLabelText('Password *') as HTMLInputElement;
			await fireEvent.input(passwordInput, { target: { value: '12345' } });

			const nombreInput = screen.getByLabelText(/First Name/) as HTMLInputElement;
			await fireEvent.input(nombreInput, { target: { value: 'Test' } });

			const apellidoInput = screen.getByLabelText(/Last Name/) as HTMLInputElement;
			await fireEvent.input(apellidoInput, { target: { value: 'User' } });

			const submitButton = screen.getByText('Create User');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
			});
		});

		it('should show error when passwords do not match', async () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const usernameInput = screen.getByLabelText(/Username/) as HTMLInputElement;
			await fireEvent.input(usernameInput, { target: { value: 'testuser' } });

			const passwordInput = screen.getByLabelText('Password *') as HTMLInputElement;
			await fireEvent.input(passwordInput, { target: { value: '123456' } });

			const confirmInput = screen.getByLabelText('Confirm Password *') as HTMLInputElement;
			await fireEvent.input(confirmInput, { target: { value: '654321' } });

			const nombreInput = screen.getByLabelText(/First Name/) as HTMLInputElement;
			await fireEvent.input(nombreInput, { target: { value: 'Test' } });

			const apellidoInput = screen.getByLabelText(/Last Name/) as HTMLInputElement;
			await fireEvent.input(apellidoInput, { target: { value: 'User' } });

			const submitButton = screen.getByText('Create User');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
			});
		});

		it('should show error when first name is empty', async () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const usernameInput = screen.getByLabelText(/Username/) as HTMLInputElement;
			await fireEvent.input(usernameInput, { target: { value: 'testuser' } });

			const submitButton = screen.getByText('Create User');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('First name is required')).toBeInTheDocument();
			});
		});

		it('should show error when last name is empty', async () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const usernameInput = screen.getByLabelText(/Username/) as HTMLInputElement;
			await fireEvent.input(usernameInput, { target: { value: 'testuser' } });

			const nombreInput = screen.getByLabelText(/First Name/) as HTMLInputElement;
			await fireEvent.input(nombreInput, { target: { value: 'Test' } });

			const submitButton = screen.getByText('Create User');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('Last name is required')).toBeInTheDocument();
			});
		});
	});

	describe('Validation - Edit Mode', () => {
		it('should not require password in edit mode when not changing', async () => {
			const { component } = render(UserForm, {
				props: {
					user: mockUser,
					isEdit: true,
					availableRoles: mockRoles
				}
			});

			const saveSpy = vi.fn();
			component.$on('save', saveSpy);

			const submitButton = screen.getByText('Update User');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(saveSpy).toHaveBeenCalled();
			});
		});

		it('should validate new password length when changing password', async () => {
			render(UserForm, {
				props: {
					user: mockUser,
					isEdit: true,
					availableRoles: mockRoles
				}
			});

			// Enable password change
			const checkbox = screen.getByText('Change password').previousSibling as HTMLInputElement;
			await fireEvent.click(checkbox);

			await waitFor(() => {
				const passwordInput = screen.getByLabelText('New Password') as HTMLInputElement;
				fireEvent.input(passwordInput, { target: { value: '12345' } });
			});

			const submitButton = screen.getByText('Update User');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
			});
		});

		it('should validate password match when changing password', async () => {
			render(UserForm, {
				props: {
					user: mockUser,
					isEdit: true,
					availableRoles: mockRoles
				}
			});

			// Enable password change
			const checkbox = screen.getByText('Change password').previousSibling as HTMLInputElement;
			await fireEvent.click(checkbox);

			await waitFor(() => {
				const passwordInput = screen.getByLabelText('New Password') as HTMLInputElement;
				fireEvent.input(passwordInput, { target: { value: '123456' } });

				const confirmInput = screen.getByLabelText('Confirm Password') as HTMLInputElement;
				fireEvent.input(confirmInput, { target: { value: '654321' } });
			});

			const submitButton = screen.getByText('Update User');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
			});
		});
	});

	describe('Submit Behavior', () => {
		it('should dispatch save event with correct data in create mode', async () => {
			const { component } = render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const saveSpy = vi.fn();
			component.$on('save', saveSpy);

			// Fill form
			const usernameInput = screen.getByLabelText(/Username/) as HTMLInputElement;
			await fireEvent.input(usernameInput, { target: { value: 'newuser' } });
			await fireEvent.blur(usernameInput);

			const nombreInput = screen.getByLabelText(/First Name/) as HTMLInputElement;
			await fireEvent.input(nombreInput, { target: { value: 'New' } });

			const apellidoInput = screen.getByLabelText(/Last Name/) as HTMLInputElement;
			await fireEvent.input(apellidoInput, { target: { value: 'User' } });

			const passwordInput = screen.getByLabelText('Password *') as HTMLInputElement;
			await fireEvent.input(passwordInput, { target: { value: '123456' } });

			const confirmInput = screen.getByLabelText('Confirm Password *') as HTMLInputElement;
			await fireEvent.input(confirmInput, { target: { value: '123456' } });

			const submitButton = screen.getByText('Create User');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(saveSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						detail: {
							userData: expect.objectContaining({
								username: 'newuser',
								nombre: 'New',
								apellido: 'User',
								password: '123456',
								role: 'colaborador'
							})
						}
					})
				);
			});
		});

		it('should dispatch save event with correct data in edit mode', async () => {
			const { component } = render(UserForm, {
				props: {
					user: mockUser,
					isEdit: true,
					availableRoles: mockRoles
				}
			});

			const saveSpy = vi.fn();
			component.$on('save', saveSpy);

			const submitButton = screen.getByText('Update User');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(saveSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						detail: {
							userData: expect.objectContaining({
								username: 'testuser',
								nombre: 'Test',
								apellido: 'User',
								telefono: '123456789',
								role: 'colaborador',
								isActive: true
							})
						}
					})
				);
			});
		});

		it('should include new password in save event when changing', async () => {
			const { component } = render(UserForm, {
				props: {
					user: mockUser,
					isEdit: true,
					availableRoles: mockRoles
				}
			});

			const saveSpy = vi.fn();
			component.$on('save', saveSpy);

			// Enable password change
			const checkbox = screen.getByText('Change password').previousSibling as HTMLInputElement;
			await fireEvent.click(checkbox);

			await waitFor(() => {
				const passwordInput = screen.getByLabelText('New Password') as HTMLInputElement;
				fireEvent.input(passwordInput, { target: { value: 'newpass123' } });

				const confirmInput = screen.getByLabelText('Confirm Password') as HTMLInputElement;
				fireEvent.input(confirmInput, { target: { value: 'newpass123' } });
			});

			const submitButton = screen.getByText('Update User');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(saveSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						detail: {
							userData: expect.objectContaining({
								newPassword: 'newpass123'
							})
						}
					})
				);
			});
		});

		it('should disable submit button while submitting', async () => {
			const { component } = render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			component.$on('save', () => {
				// Simulate async operation
				return new Promise((resolve) => setTimeout(resolve, 100));
			});

			// Fill form with valid data
			const usernameInput = screen.getByLabelText(/Username/) as HTMLInputElement;
			await fireEvent.input(usernameInput, { target: { value: 'newuser' } });
			await fireEvent.blur(usernameInput);

			const nombreInput = screen.getByLabelText(/First Name/) as HTMLInputElement;
			await fireEvent.input(nombreInput, { target: { value: 'New' } });

			const apellidoInput = screen.getByLabelText(/Last Name/) as HTMLInputElement;
			await fireEvent.input(apellidoInput, { target: { value: 'User' } });

			const passwordInput = screen.getByLabelText('Password *') as HTMLInputElement;
			await fireEvent.input(passwordInput, { target: { value: '123456' } });

			const confirmInput = screen.getByLabelText('Confirm Password *') as HTMLInputElement;
			await fireEvent.input(confirmInput, { target: { value: '123456' } });

			const submitButton = screen.getByText('Create User') as HTMLButtonElement;
			await fireEvent.click(submitButton);

			// Button should be disabled during submission
			expect(submitButton.disabled).toBe(true);
		});

		it('should show loading text while submitting', async () => {
			const { component } = render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			component.$on('save', () => {
				return new Promise((resolve) => setTimeout(resolve, 100));
			});

			// Fill form
			const usernameInput = screen.getByLabelText(/Username/) as HTMLInputElement;
			await fireEvent.input(usernameInput, { target: { value: 'newuser' } });
			await fireEvent.blur(usernameInput);

			const nombreInput = screen.getByLabelText(/First Name/) as HTMLInputElement;
			await fireEvent.input(nombreInput, { target: { value: 'New' } });

			const apellidoInput = screen.getByLabelText(/Last Name/) as HTMLInputElement;
			await fireEvent.input(apellidoInput, { target: { value: 'User' } });

			const passwordInput = screen.getByLabelText('Password *') as HTMLInputElement;
			await fireEvent.input(passwordInput, { target: { value: '123456' } });

			const confirmInput = screen.getByLabelText('Confirm Password *') as HTMLInputElement;
			await fireEvent.input(confirmInput, { target: { value: '123456' } });

			const submitButton = screen.getByText('Create User');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('Creating...')).toBeInTheDocument();
			});
		});

		it('should disable submit when username is not available', async () => {
			vi.mocked(userManagementService.checkUsernameAvailability).mockResolvedValue(false);

			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const usernameInput = screen.getByLabelText(/Username/) as HTMLInputElement;
			await fireEvent.input(usernameInput, { target: { value: 'takenuser' } });
			await fireEvent.blur(usernameInput);

			await waitFor(() => {
				const submitButton = screen.getByText('Create User') as HTMLButtonElement;
				expect(submitButton.disabled).toBe(true);
			});
		});
	});

	describe('Cancel Behavior', () => {
		it('should dispatch cancel event when cancel button clicked', async () => {
			const { component } = render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const cancelSpy = vi.fn();
			component.$on('cancel', cancelSpy);

			const cancelButton = screen.getByText('Cancel');
			await fireEvent.click(cancelButton);

			expect(cancelSpy).toHaveBeenCalled();
		});

		it('should disable cancel button while submitting', async () => {
			const { component } = render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			component.$on('save', () => {
				return new Promise((resolve) => setTimeout(resolve, 100));
			});

			// Fill and submit form
			const usernameInput = screen.getByLabelText(/Username/) as HTMLInputElement;
			await fireEvent.input(usernameInput, { target: { value: 'newuser' } });
			await fireEvent.blur(usernameInput);

			const nombreInput = screen.getByLabelText(/First Name/) as HTMLInputElement;
			await fireEvent.input(nombreInput, { target: { value: 'New' } });

			const apellidoInput = screen.getByLabelText(/Last Name/) as HTMLInputElement;
			await fireEvent.input(apellidoInput, { target: { value: 'User' } });

			const passwordInput = screen.getByLabelText('Password *') as HTMLInputElement;
			await fireEvent.input(passwordInput, { target: { value: '123456' } });

			const confirmInput = screen.getByLabelText('Confirm Password *') as HTMLInputElement;
			await fireEvent.input(confirmInput, { target: { value: '123456' } });

			const submitButton = screen.getByText('Create User');
			await fireEvent.click(submitButton);

			const cancelButton = screen.getByText('Cancel') as HTMLButtonElement;
			expect(cancelButton.disabled).toBe(true);
		});
	});

	describe('Accessibility', () => {
		it('should have proper label associations', () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const usernameInput = screen.getByLabelText(/Username/);
			expect(usernameInput).toHaveAttribute('id', 'username');

			const nombreInput = screen.getByLabelText(/First Name/);
			expect(nombreInput).toHaveAttribute('id', 'nombre');

			const apellidoInput = screen.getByLabelText(/Last Name/);
			expect(apellidoInput).toHaveAttribute('id', 'apellido');
		});

		it('should mark required fields with asterisk', () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			expect(screen.getByText('Username *')).toBeInTheDocument();
			expect(screen.getByText('First Name *')).toBeInTheDocument();
			expect(screen.getByText('Last Name *')).toBeInTheDocument();
			expect(screen.getByText('Password *')).toBeInTheDocument();
			expect(screen.getByText('Confirm Password *')).toBeInTheDocument();
			expect(screen.getByText('Role *')).toBeInTheDocument();
		});

		it('should have required attribute on required fields', () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const usernameInput = screen.getByLabelText(/Username/);
			expect(usernameInput).toHaveAttribute('required');

			const nombreInput = screen.getByLabelText(/First Name/);
			expect(nombreInput).toHaveAttribute('required');

			const apellidoInput = screen.getByLabelText(/Last Name/);
			expect(apellidoInput).toHaveAttribute('required');
		});
	});

	describe('Edge Cases', () => {
		it('should handle user with null phone number', () => {
			const userWithoutPhone = { ...mockUser, telefono: null };

			render(UserForm, {
				props: {
					user: userWithoutPhone,
					isEdit: true,
					availableRoles: mockRoles
				}
			});

			const phoneInput = screen.getByLabelText(/Phone/) as HTMLInputElement;
			expect(phoneInput.value).toBe('');
		});

		it('should handle empty roles array', () => {
			render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: []
				}
			});

			const roleSelect = screen.getByLabelText(/Role/) as HTMLSelectElement;
			expect(roleSelect.options.length).toBe(0);
		});

		it('should trim whitespace from text inputs on submit', async () => {
			const { component } = render(UserForm, {
				props: {
					user: null,
					isEdit: false,
					availableRoles: mockRoles
				}
			});

			const saveSpy = vi.fn();
			component.$on('save', saveSpy);

			const usernameInput = screen.getByLabelText(/Username/) as HTMLInputElement;
			await fireEvent.input(usernameInput, { target: { value: '  testuser  ' } });
			await fireEvent.blur(usernameInput);

			const nombreInput = screen.getByLabelText(/First Name/) as HTMLInputElement;
			await fireEvent.input(nombreInput, { target: { value: '  Test  ' } });

			const apellidoInput = screen.getByLabelText(/Last Name/) as HTMLInputElement;
			await fireEvent.input(apellidoInput, { target: { value: '  User  ' } });

			const passwordInput = screen.getByLabelText('Password *') as HTMLInputElement;
			await fireEvent.input(passwordInput, { target: { value: '123456' } });

			const confirmInput = screen.getByLabelText('Confirm Password *') as HTMLInputElement;
			await fireEvent.input(confirmInput, { target: { value: '123456' } });

			// Validation should pass with trimmed values
			const submitButton = screen.getByText('Create User');
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(saveSpy).toHaveBeenCalled();
			});
		});
	});
});
