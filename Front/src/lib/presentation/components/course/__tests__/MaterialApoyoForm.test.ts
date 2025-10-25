import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import MaterialApoyoForm from '../MaterialApoyoForm.svelte';
import type { MaterialApoyoDetailDto } from '$lib/types/api/materialApoyo.types';

// Mock services
vi.mock('$lib/application/services/material-apoyo/MaterialApoyoService', () => ({
	materialApoyoService: {
		createMaterialApoyoWithId: vi.fn(),
		updateMaterialApoyo: vi.fn()
	}
}));

describe('MaterialApoyoForm', () => {
	const mockExistingMaterial: MaterialApoyoDetailDto = {
		id: 'test-1',
		title: 'Matemáticas Básicas',
		description: 'Curso de matemáticas nivel básico',
		isActive: true,
		isFeatured: false,
		createdAt: Date.now(),
		educatorId: '1',
		educatorName: 'Prof. Test',
		imagePath: '/media/test.jpg',
		modules: []
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Create Mode', () => {
		it('should render form in create mode with empty fields', () => {
			render(MaterialApoyoForm, { course: null, loading: false });

			expect(screen.getByLabelText(/título del proyecto/i)).toHaveValue('');
			expect(screen.getByLabelText(/descripción/i)).toHaveValue('');
			expect(screen.getByLabelText(/nombre del encargado/i)).toHaveValue('');
			expect(screen.getByLabelText(/marcar como proyecto destacado/i)).not.toBeChecked();
		});

		it('should show "Crear Proyecto" button in create mode', () => {
			render(MaterialApoyoForm, { course: null, loading: false });

			expect(screen.getByRole('button', { name: /crear proyecto/i })).toBeInTheDocument();
		});

		it('should call createMaterialApoyoWithId when form is submitted', async () => {
			const { materialApoyoService } = await import('$lib/application/services/material-apoyo/MaterialApoyoService');
			const mockCreate = vi.fn().mockResolvedValue({ id: 'new-id', title: 'New Material' });
			(materialApoyoService.createMaterialApoyoWithId as any) = mockCreate;

			render(MaterialApoyoForm, { course: null, loading: false });

			// Fill form
			await fireEvent.input(screen.getByLabelText(/título del proyecto/i), {
				target: { value: 'New Material' }
			});
			await fireEvent.input(screen.getByLabelText(/descripción/i), {
				target: { value: 'This is a new material description' }
			});
			await fireEvent.input(screen.getByLabelText(/nombre del encargado/i), {
				target: { value: 'Prof. New' }
			});

			// Submit
			await fireEvent.click(screen.getByRole('button', { name: /crear proyecto/i }));

			await waitFor(() => {
				expect(mockCreate).toHaveBeenCalledWith(
					expect.any(String), // tempId
					expect.objectContaining({
						title: 'New Material',
						description: 'This is a new material description',
						educatorName: 'Prof. New',
						isFeatured: false
					})
				);
			});

		});
	});

	describe('Edit Mode', () => {
		it('should render form in edit mode with existing data', () => {
			render(MaterialApoyoForm, { course: mockExistingMaterial, loading: false });

			expect(screen.getByLabelText(/título del proyecto/i)).toHaveValue('Matemáticas Básicas');
			expect(screen.getByLabelText(/descripción/i)).toHaveValue(
				'Curso de matemáticas nivel básico'
			);
			expect(screen.getByLabelText(/nombre del encargado/i)).toHaveValue('Prof. Test');
			expect(screen.getByLabelText(/marcar como proyecto destacado/i)).not.toBeChecked();
		});

		it('should show "Actualizar Proyecto" button in edit mode', () => {
			render(MaterialApoyoForm, { course: mockExistingMaterial, loading: false });

			expect(screen.getByRole('button', { name: /actualizar proyecto/i })).toBeInTheDocument();
		});

		it('should load isFeatured checkbox state correctly', () => {
			const featuredMaterial = { ...mockExistingMaterial, isFeatured: true };
			render(MaterialApoyoForm, { course: featuredMaterial, loading: false });

			expect(screen.getByLabelText(/marcar como proyecto destacado/i)).toBeChecked();
		});

		it('should call updateMaterialApoyo when form is submitted in edit mode', async () => {
			const { materialApoyoService } = await import('$lib/application/services/material-apoyo/MaterialApoyoService');
			const mockUpdate = vi.fn().mockResolvedValue({ id: 'test-1' });
			(materialApoyoService.updateMaterialApoyo as any) = mockUpdate;

			render(MaterialApoyoForm, {
				course: mockExistingMaterial,
				loading: false
			});

			// Modify form
			const titleInput = screen.getByLabelText(/título del proyecto/i);
			await fireEvent.input(titleInput, { target: { value: 'Matemáticas Avanzadas' } });

			// Submit
			await fireEvent.click(screen.getByRole('button', { name: /actualizar proyecto/i }));

			await waitFor(() => {
				expect(mockUpdate).toHaveBeenCalledWith(
					'test-1',
					expect.objectContaining({
						title: 'Matemáticas Avanzadas',
						description: 'Curso de matemáticas nivel básico',
						educatorName: 'Prof. Test',
						isFeatured: false
					})
				);
			});

		});
	});

	describe('Validation', () => {
		it('should show error when title is empty', async () => {
			render(MaterialApoyoForm, { course: null, loading: false });

			// Try to submit without title
			await fireEvent.click(screen.getByRole('button', { name: /crear proyecto/i }));

			expect(await screen.findByText(/el título es requerido/i)).toBeInTheDocument();
		});

		it('should show error when title is too short (< 3 characters)', async () => {
			render(MaterialApoyoForm, { course: null, loading: false });

			await fireEvent.input(screen.getByLabelText(/título del proyecto/i), {
				target: { value: 'AB' }
			});
			await fireEvent.input(screen.getByLabelText(/descripción/i), {
				target: { value: 'Valid description here' }
			});

			await fireEvent.click(screen.getByRole('button', { name: /crear proyecto/i }));

			expect(
				await screen.findByText(/el título debe tener al menos 3 caracteres/i)
			).toBeInTheDocument();
		});

		it('should show error when title is too long (> 200 characters)', async () => {
			render(MaterialApoyoForm, { course: null, loading: false });

			const longTitle = 'A'.repeat(201);
			await fireEvent.input(screen.getByLabelText(/título del proyecto/i), {
				target: { value: longTitle }
			});
			await fireEvent.input(screen.getByLabelText(/descripción/i), {
				target: { value: 'Valid description' }
			});

			await fireEvent.click(screen.getByRole('button', { name: /crear proyecto/i }));

			expect(
				await screen.findByText(/el título no puede exceder 200 caracteres/i)
			).toBeInTheDocument();
		});

		it('should show error when description is empty', async () => {
			render(MaterialApoyoForm, { course: null, loading: false });

			await fireEvent.input(screen.getByLabelText(/título del proyecto/i), {
				target: { value: 'Valid Title' }
			});

			await fireEvent.click(screen.getByRole('button', { name: /crear proyecto/i }));

			expect(await screen.findByText(/la descripción es requerida/i)).toBeInTheDocument();
		});

		it('should show error when description is too short (< 10 characters)', async () => {
			render(MaterialApoyoForm, { course: null, loading: false });

			await fireEvent.input(screen.getByLabelText(/título del proyecto/i), {
				target: { value: 'Valid Title' }
			});
			await fireEvent.input(screen.getByLabelText(/descripción/i), {
				target: { value: 'Short' }
			});

			await fireEvent.click(screen.getByRole('button', { name: /crear proyecto/i }));

			expect(
				await screen.findByText(/la descripción debe tener al menos 10 caracteres/i)
			).toBeInTheDocument();
		});

		it('should show error when description is too long (> 1000 characters)', async () => {
			render(MaterialApoyoForm, { course: null, loading: false });

			const longDescription = 'B'.repeat(1001);
			await fireEvent.input(screen.getByLabelText(/título del proyecto/i), {
				target: { value: 'Valid Title' }
			});
			await fireEvent.input(screen.getByLabelText(/descripción/i), {
				target: { value: longDescription }
			});

			await fireEvent.click(screen.getByRole('button', { name: /crear proyecto/i }));

			expect(
				await screen.findByText(/la descripción no puede exceder 1000 caracteres/i)
			).toBeInTheDocument();
		});

		it('should clear validation errors when fields are corrected', async () => {
			render(MaterialApoyoForm, { course: null, loading: false });

			// Submit with empty fields to trigger errors
			await fireEvent.click(screen.getByRole('button', { name: /crear proyecto/i }));

			expect(await screen.findByText(/el título es requerido/i)).toBeInTheDocument();

			// Fix the title
			await fireEvent.input(screen.getByLabelText(/título del proyecto/i), {
				target: { value: 'Valid Title' }
			});
			await fireEvent.input(screen.getByLabelText(/descripción/i), {
				target: { value: 'Valid description here' }
			});

			// Submit again
			await fireEvent.click(screen.getByRole('button', { name: /crear proyecto/i }));

			// Errors should be cleared
			await waitFor(() => {
				expect(screen.queryByText(/el título es requerido/i)).not.toBeInTheDocument();
				expect(screen.queryByText(/la descripción es requerida/i)).not.toBeInTheDocument();
			});
		});
	});

	describe('Character Counters', () => {
		it('should display title character count', () => {
			render(MaterialApoyoForm, { course: null, loading: false });

			expect(screen.getByText('0/200 caracteres')).toBeInTheDocument();
		});

		it('should update title character count as user types', async () => {
			render(MaterialApoyoForm, { course: null, loading: false });

			await fireEvent.input(screen.getByLabelText(/título del proyecto/i), {
				target: { value: 'Test' }
			});

			expect(screen.getByText('4/200 caracteres')).toBeInTheDocument();
		});

		it('should display description character count', () => {
			render(MaterialApoyoForm, { course: null, loading: false });

			expect(screen.getByText('0/1000 caracteres')).toBeInTheDocument();
		});

		it('should update description character count as user types', async () => {
			render(MaterialApoyoForm, { course: null, loading: false });

			await fireEvent.input(screen.getByLabelText(/descripción/i), {
				target: { value: 'Test description' }
			});

			expect(screen.getByText('16/1000 caracteres')).toBeInTheDocument();
		});
	});

	describe('Cancel Button', () => {
		it('should emit cancel event when cancel button is clicked', async () => {
			const { materialApoyoService } = await import('$lib/application/services/material-apoyo/MaterialApoyoService');
			const createSpy = vi.spyOn(materialApoyoService, 'createMaterialApoyoWithId');
			const updateSpy = vi.spyOn(materialApoyoService, 'updateMaterialApoyo');

			render(MaterialApoyoForm, { course: null, loading: false });

			await fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

			expect(createSpy).not.toHaveBeenCalled();
			expect(updateSpy).not.toHaveBeenCalled();
		});
	});

	describe('isFeatured Checkbox', () => {
		it('should toggle isFeatured when checkbox is clicked', async () => {
			render(MaterialApoyoForm, { course: null, loading: false });

			const checkbox = screen.getByLabelText(/marcar como proyecto destacado/i);
			expect(checkbox).not.toBeChecked();

			await fireEvent.click(checkbox);
			expect(checkbox).toBeChecked();

			await fireEvent.click(checkbox);
			expect(checkbox).not.toBeChecked();
		});
	});

	describe('Loading States', () => {
		it('should disable form fields when loading prop is true', () => {
			render(MaterialApoyoForm, { course: null, loading: true });

			expect(screen.getByLabelText(/título del proyecto/i)).toBeDisabled();
			expect(screen.getByLabelText(/descripción/i)).toBeDisabled();
			expect(screen.getByLabelText(/nombre del encargado/i)).toBeDisabled();
			expect(screen.getByLabelText(/marcar como proyecto destacado/i)).toBeDisabled();
		});

		it('should disable buttons when loading prop is true', () => {
			render(MaterialApoyoForm, { course: null, loading: true });

			expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
			expect(screen.getByRole('button', { name: /crear proyecto/i })).toBeDisabled();
		});

		it('should show loading spinner and text when submitting', async () => {
			const { materialApoyoService } = await import('$lib/application/services/material-apoyo/MaterialApoyoService');
			const mockCreate = vi.fn(
				() => new Promise((resolve) => setTimeout(() => resolve({ id: 'new-id' }), 100))
			);
			(materialApoyoService.createMaterialApoyoWithId as any) = mockCreate;

			render(MaterialApoyoForm, { course: null, loading: false });

			await fireEvent.input(screen.getByLabelText(/título del proyecto/i), {
				target: { value: 'New Material' }
			});
			await fireEvent.input(screen.getByLabelText(/descripción/i), {
				target: { value: 'This is a new material description' }
			});

			await fireEvent.click(screen.getByRole('button', { name: /crear proyecto/i }));

			// Check for loading state
			expect(screen.getByRole('button', { name: /creando\.\.\./i })).toBeInTheDocument();
		});
	});

	describe('Error Handling', () => {
		it('should keep form interactable when creation fails', async () => {
			const { materialApoyoService } = await import('$lib/application/services/material-apoyo/MaterialApoyoService');
			const mockCreate = vi.fn().mockRejectedValue(new Error('Network error'));
			(materialApoyoService.createMaterialApoyoWithId as any) = mockCreate;

			render(MaterialApoyoForm, { course: null, loading: false });

			await fireEvent.input(screen.getByLabelText(/título del proyecto/i), {
				target: { value: 'New Material' }
			});
			await fireEvent.input(screen.getByLabelText(/descripción/i), {
				target: { value: 'This is a new material description' }
			});

			await fireEvent.click(screen.getByRole('button', { name: /crear proyecto/i }));

			await waitFor(() => {
				expect(mockCreate).toHaveBeenCalled();
			});

			expect(screen.getByRole('button', { name: /crear proyecto/i })).not.toBeDisabled();
		});

		it('should keep form interactable when update fails', async () => {
			const { materialApoyoService } = await import('$lib/application/services/material-apoyo/MaterialApoyoService');
			const mockUpdate = vi.fn().mockRejectedValue(new Error('Update failed'));
			(materialApoyoService.updateMaterialApoyo as any) = mockUpdate;

			render(MaterialApoyoForm, {
				course: mockExistingMaterial,
				loading: false
			});

			await fireEvent.click(screen.getByRole('button', { name: /actualizar proyecto/i }));

			await waitFor(() => {
				expect(mockUpdate).toHaveBeenCalled();
			});

			expect(screen.getByRole('button', { name: /actualizar proyecto/i })).not.toBeDisabled();
		});
	});

	describe('Help Text', () => {
		it('should display help text for educatorName field', () => {
			render(MaterialApoyoForm, { course: null, loading: false });

			expect(
				screen.getByText(/nombre de la persona responsable de este proyecto/i)
			).toBeInTheDocument();
		});

		it('should display help text for isFeatured checkbox', () => {
			render(MaterialApoyoForm, { course: null, loading: false });

			expect(
				screen.getByText(/los proyectos destacados aparecen en la sección principal/i)
			).toBeInTheDocument();
		});
	});

	describe('Educator Name Field', () => {
		it('should be optional and allow empty value', async () => {
			const { materialApoyoService } = await import('$lib/application/services/material-apoyo/MaterialApoyoService');
			const mockCreate = vi.fn().mockResolvedValue({ id: 'new-id' });
			(materialApoyoService.createMaterialApoyoWithId as any) = mockCreate;

			render(MaterialApoyoForm, { course: null, loading: false });

			await fireEvent.input(screen.getByLabelText(/título del proyecto/i), {
				target: { value: 'New Material' }
			});
			await fireEvent.input(screen.getByLabelText(/descripción/i), {
				target: { value: 'This is a new material description' }
			});
			// Leave educatorName empty

			await fireEvent.click(screen.getByRole('button', { name: /crear proyecto/i }));

			await waitFor(() => {
				expect(mockCreate).toHaveBeenCalledWith(
					expect.any(String),
					expect.objectContaining({
						educatorName: undefined // Should be undefined when empty
					})
				);
			});
		});
	});
});
