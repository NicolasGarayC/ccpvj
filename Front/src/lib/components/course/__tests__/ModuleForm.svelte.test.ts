import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import ModuleForm from '../ModuleForm.svelte';
import type { ModuleSummaryDto } from '$lib/types/api/materialApoyo.types';
import { materialApoyoService } from '$lib/services/materialApoyoService';

// Mock del servicio
vi.mock('$lib/services/materialApoyoService', () => ({
	materialApoyoService: {
		getMaterialApoyoModules: vi.fn(),
		createModule: vi.fn(),
		updateModule: vi.fn()
	}
}));

describe('ModuleForm Component', () => {
	const mockMaterialApoyoId = 'material-123';
	const mockModule: ModuleSummaryDto = {
		id: 'module-1',
		title: 'Módulo Existente',
		description: 'Descripción del módulo',
		orderNumber: 1,
		postCount: 5,
		materialApoyoId: mockMaterialApoyoId,
		isActive: true
	};

	const mockExistingModules: ModuleSummaryDto[] = [
		mockModule,
		{
			id: 'module-2',
			title: 'Módulo 2',
			description: 'Otro módulo',
			orderNumber: 2,
			postCount: 3,
			materialApoyoId: mockMaterialApoyoId,
			isActive: true
		}
	];

	beforeEach(() => {
		vi.mocked(materialApoyoService.getMaterialApoyoModules).mockResolvedValue(mockExistingModules);
		vi.mocked(materialApoyoService.createModule).mockResolvedValue({
			...mockModule,
			id: 'new-module'
		});
		vi.mocked(materialApoyoService.updateModule).mockResolvedValue(mockModule);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering - Modal Visibility', () => {
		it('should not render modal when visible is false', () => {
			render(ModuleForm, {
				props: { materialApoyoId: mockMaterialApoyoId, visible: false }
			});

			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		it('should render modal when visible is true', () => {
			render(ModuleForm, {
				props: { materialApoyoId: mockMaterialApoyoId, visible: true }
			});

			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});

		it('should show "Crear Nuevo Módulo" title in create mode', () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			expect(screen.getByText(/Crear Nuevo Módulo/i)).toBeInTheDocument();
		});

		it('should show "Editar Módulo" title in edit mode', () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: mockModule,
					visible: true
				}
			});

			expect(screen.getByText(/Editar Módulo/i)).toBeInTheDocument();
		});
	});

	describe('Form Fields - Create Mode', () => {
		it('should render empty title input in create mode', () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			const titleInput = screen.getByLabelText(/Título/i) as HTMLInputElement;
			expect(titleInput.value).toBe('');
		});

		it('should render empty description in create mode', () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			const descInput = screen.getByLabelText(/Descripción/i) as HTMLTextAreaElement;
			expect(descInput.value).toBe('');
		});

		it('should set orderNumber to next available number in create mode', async () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			await waitFor(() => {
				const orderInput = screen.getByLabelText(/Orden/i) as HTMLInputElement;
				expect(orderInput.value).toBe('3'); // 2 existing modules + 1
			});
		});
	});

	describe('Form Fields - Edit Mode', () => {
		it('should populate title with module data in edit mode', () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: mockModule,
					visible: true
				}
			});

			const titleInput = screen.getByLabelText(/Título/i) as HTMLInputElement;
			expect(titleInput.value).toBe('Módulo Existente');
		});

		it('should populate description with module data in edit mode', () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: mockModule,
					visible: true
				}
			});

			const descInput = screen.getByLabelText(/Descripción/i) as HTMLTextAreaElement;
			expect(descInput.value).toBe('Descripción del módulo');
		});

		it('should populate orderNumber with module data in edit mode', () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: mockModule,
					visible: true
				}
			});

			const orderInput = screen.getByLabelText(/Orden/i) as HTMLInputElement;
			expect(orderInput.value).toBe('1');
		});
	});

	describe('Validation - Title Field', () => {
		it('should show error when title is empty', async () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			const submitButton = screen.getByRole('button', { name: /crear|guardar/i });
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/El título es requerido/i)).toBeInTheDocument();
			});
		});

		it('should show error when title is less than 3 characters', async () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			const titleInput = screen.getByLabelText(/Título/i);
			await fireEvent.input(titleInput, { target: { value: 'AB' } });

			const submitButton = screen.getByRole('button', { name: /crear|guardar/i });
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/debe tener al menos 3 caracteres/i)).toBeInTheDocument();
			});
		});

		it('should show error when title exceeds 200 characters', async () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			const longTitle = 'A'.repeat(201);
			const titleInput = screen.getByLabelText(/Título/i);
			await fireEvent.input(titleInput, { target: { value: longTitle } });

			const submitButton = screen.getByRole('button', { name: /crear|guardar/i });
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/no puede exceder 200 caracteres/i)).toBeInTheDocument();
			});
		});

		it('should accept valid title between 3 and 200 characters', async () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			const titleInput = screen.getByLabelText(/Título/i);
			await fireEvent.input(titleInput, { target: { value: 'Módulo Válido' } });

			const submitButton = screen.getByRole('button', { name: /crear|guardar/i });
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(materialApoyoService.createModule).toHaveBeenCalled();
			});
		});
	});

	describe('Validation - Description Field', () => {
		it('should allow empty description', async () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			const titleInput = screen.getByLabelText(/Título/i);
			await fireEvent.input(titleInput, { target: { value: 'Módulo Test' } });

			const submitButton = screen.getByRole('button', { name: /crear|guardar/i });
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(materialApoyoService.createModule).toHaveBeenCalled();
			});
		});

		it('should show error when description exceeds 500 characters', async () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			const titleInput = screen.getByLabelText(/Título/i);
			await fireEvent.input(titleInput, { target: { value: 'Módulo Test' } });

			const longDesc = 'A'.repeat(501);
			const descInput = screen.getByLabelText(/Descripción/i);
			await fireEvent.input(descInput, { target: { value: longDesc } });

			const submitButton = screen.getByRole('button', { name: /crear|guardar/i });
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/no puede exceder 500 caracteres/i)).toBeInTheDocument();
			});
		});
	});

	describe('Validation - Order Number', () => {
		it('should show error when orderNumber is less than 1', async () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			const titleInput = screen.getByLabelText(/Título/i);
			await fireEvent.input(titleInput, { target: { value: 'Módulo Test' } });

			const orderInput = screen.getByLabelText(/Orden/i);
			await fireEvent.input(orderInput, { target: { value: '0' } });

			const submitButton = screen.getByRole('button', { name: /crear|guardar/i });
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/debe ser mayor a 0/i)).toBeInTheDocument();
			});
		});

		it('should accept orderNumber of 1 or greater', async () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			const titleInput = screen.getByLabelText(/Título/i);
			await fireEvent.input(titleInput, { target: { value: 'Módulo Test' } });

			const orderInput = screen.getByLabelText(/Orden/i);
			await fireEvent.input(orderInput, { target: { value: '5' } });

			const submitButton = screen.getByRole('button', { name: /crear|guardar/i });
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(materialApoyoService.createModule).toHaveBeenCalled();
			});
		});
	});

	describe('Submit - Create Mode', () => {
		it('should call createModule with correct data', async () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			const titleInput = screen.getByLabelText(/Título/i);
			await fireEvent.input(titleInput, { target: { value: 'Nuevo Módulo' } });

			const descInput = screen.getByLabelText(/Descripción/i);
			await fireEvent.input(descInput, { target: { value: 'Descripción nueva' } });

			const submitButton = screen.getByRole('button', { name: /crear|guardar/i });
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(materialApoyoService.createModule).toHaveBeenCalledWith({
					title: 'Nuevo Módulo',
					description: 'Descripción nueva',
					orderNumber: 3,
					materialApoyoId: mockMaterialApoyoId
				});
			});
		});

		it('should dispatch success event on successful create', async () => {
			const { component } = render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			const successHandler = vi.fn();
			component.$on('success', successHandler);

			const titleInput = screen.getByLabelText(/Título/i);
			await fireEvent.input(titleInput, { target: { value: 'Nuevo Módulo' } });

			const submitButton = screen.getByRole('button', { name: /crear|guardar/i });
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(successHandler).toHaveBeenCalledWith(
					expect.objectContaining({
						detail: expect.objectContaining({
							type: 'create'
						})
					})
				);
			});
		});

		it('should trim title and description before submitting', async () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			const titleInput = screen.getByLabelText(/Título/i);
			await fireEvent.input(titleInput, { target: { value: '  Módulo con espacios  ' } });

			const descInput = screen.getByLabelText(/Descripción/i);
			await fireEvent.input(descInput, { target: { value: '  Desc con espacios  ' } });

			const submitButton = screen.getByRole('button', { name: /crear|guardar/i });
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(materialApoyoService.createModule).toHaveBeenCalledWith(
					expect.objectContaining({
						title: 'Módulo con espacios',
						description: 'Desc con espacios'
					})
				);
			});
		});
	});

	describe('Submit - Edit Mode', () => {
		it('should call updateModule with correct data', async () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: mockModule,
					visible: true
				}
			});

			const titleInput = screen.getByLabelText(/Título/i);
			await fireEvent.input(titleInput, { target: { value: 'Módulo Actualizado' } });

			const submitButton = screen.getByRole('button', { name: /guardar|actualizar/i });
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(materialApoyoService.updateModule).toHaveBeenCalledWith('module-1', {
					title: 'Módulo Actualizado',
					description: 'Descripción del módulo',
					orderNumber: 1
				});
			});
		});

		it('should dispatch success event on successful update', async () => {
			const { component } = render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: mockModule,
					visible: true
				}
			});

			const successHandler = vi.fn();
			component.$on('success', successHandler);

			const submitButton = screen.getByRole('button', { name: /guardar|actualizar/i });
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(successHandler).toHaveBeenCalledWith(
					expect.objectContaining({
						detail: expect.objectContaining({
							type: 'update',
							id: 'module-1'
						})
					})
				);
			});
		});
	});

	describe('Error Handling', () => {
		it('should dispatch error event when create fails', async () => {
			vi.mocked(materialApoyoService.createModule).mockRejectedValue(
				new Error('Error de red')
			);

			const { component } = render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			const errorHandler = vi.fn();
			component.$on('error', errorHandler);

			const titleInput = screen.getByLabelText(/Título/i);
			await fireEvent.input(titleInput, { target: { value: 'Nuevo Módulo' } });

			const submitButton = screen.getByRole('button', { name: /crear|guardar/i });
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(errorHandler).toHaveBeenCalledWith(
					expect.objectContaining({
						detail: 'Error de red'
					})
				);
			});
		});

		it('should dispatch error event when update fails', async () => {
			vi.mocked(materialApoyoService.updateModule).mockRejectedValue(
				new Error('Error al actualizar')
			);

			const { component } = render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: mockModule,
					visible: true
				}
			});

			const errorHandler = vi.fn();
			component.$on('error', errorHandler);

			const submitButton = screen.getByRole('button', { name: /guardar|actualizar/i });
			await fireEvent.click(submitButton);

			await waitFor(() => {
				expect(errorHandler).toHaveBeenCalled();
			});
		});
	});

	describe('Cancel and Reset', () => {
		it('should dispatch cancel event when cancel button is clicked', async () => {
			const { component } = render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			const cancelHandler = vi.fn();
			component.$on('cancel', cancelHandler);

			const cancelButton = screen.getByRole('button', { name: /cancelar|cerrar/i });
			await fireEvent.click(cancelButton);

			expect(cancelHandler).toHaveBeenCalled();
		});

		it('should reset form when cancel is clicked', async () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: mockModule,
					visible: true
				}
			});

			const titleInput = screen.getByLabelText(/Título/i) as HTMLInputElement;
			await fireEvent.input(titleInput, { target: { value: 'Cambio temporal' } });

			const cancelButton = screen.getByRole('button', { name: /cancelar|cerrar/i });
			await fireEvent.click(cancelButton);

			// After cancel, if reopened, should show original data
			expect(titleInput.value).toBe('Módulo Existente');
		});

		it('should dispatch cancel when backdrop is clicked', async () => {
			const { component } = render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			const cancelHandler = vi.fn();
			component.$on('cancel', cancelHandler);

			const backdrop = screen.getByRole('dialog');
			await fireEvent.click(backdrop);

			expect(cancelHandler).toHaveBeenCalled();
		});
	});

	describe('Loading States', () => {
		it('should disable buttons when submitting', async () => {
			vi.mocked(materialApoyoService.createModule).mockImplementation(
				() => new Promise(resolve => setTimeout(() => resolve(mockModule), 100))
			);

			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			const titleInput = screen.getByLabelText(/Título/i);
			await fireEvent.input(titleInput, { target: { value: 'Nuevo Módulo' } });

			const submitButton = screen.getByRole('button', { name: /crear|guardar/i });
			await fireEvent.click(submitButton);

			// Durante la sumisión, los botones deberían estar deshabilitados
			await waitFor(() => {
				expect(submitButton).toBeDisabled();
			});
		});
	});

	describe('Character Limits', () => {
		it('should show character count for title', () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			const titleInput = screen.getByLabelText(/Título/i);
			expect(titleInput).toHaveAttribute('maxlength', '200');
		});

		it('should show character count for description', () => {
			render(ModuleForm, {
				props: {
					materialApoyoId: mockMaterialApoyoId,
					module: null,
					visible: true
				}
			});

			const descInput = screen.getByLabelText(/Descripción/i);
			expect(descInput).toHaveAttribute('maxlength', '500');
		});
	});
});
