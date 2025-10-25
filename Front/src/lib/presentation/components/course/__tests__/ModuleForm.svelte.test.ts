import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte';
import ModuleForm from '../ModuleForm.svelte';
import type { ModuleSummaryDto } from '$lib/types/api/materialApoyo.types';
import { materialApoyoService } from '$lib/application/services/material-apoyo/MaterialApoyoService';

vi.mock('$lib/application/services/material-apoyo/MaterialApoyoService', () => ({
	materialApoyoService: {
		getMaterialApoyoModules: vi.fn(),
		createModule: vi.fn(),
		updateModule: vi.fn()
	}
}));

const materialApoyoId = 'material-123';

const existingModules: ModuleSummaryDto[] = [
	{
		id: 'module-1',
		title: 'Módulo 1',
		description: 'Descripción',
		orderNumber: 1,
		postCount: 3,
		materialApoyoId,
		isActive: true
	},
	{
		id: 'module-2',
		title: 'Módulo 2',
		description: 'Otro módulo',
		orderNumber: 2,
		postCount: 1,
		materialApoyoId,
		isActive: true
	}
];

const moduleToEdit: ModuleSummaryDto = {
	id: 'module-edit',
	title: 'Módulo Editar',
	description: 'Descripción existente',
	orderNumber: 4,
	postCount: 6,
	materialApoyoId,
	isActive: true
};

const renderForm = (
	props: Partial<{
		module: ModuleSummaryDto | null;
		visible: boolean;
		onSuccess: (detail: unknown) => void;
		onError: (message: string) => void;
		onCancel: () => void;
	}> = {}
) =>
	render(ModuleForm, {
		props: {
			materialApoyoId,
			module: null,
			visible: true,
			loading: false,
			...props
		}
	});

describe('ModuleForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(materialApoyoService.getMaterialApoyoModules).mockResolvedValue(existingModules);
		vi.mocked(materialApoyoService.createModule).mockResolvedValue({
			...moduleToEdit,
			id: 'module-new'
		});
		vi.mocked(materialApoyoService.updateModule).mockResolvedValue(moduleToEdit);
	});

	it('renders modal when visible and loads existing modules', async () => {
		renderForm();

		expect(screen.getByRole('dialog')).toBeInTheDocument();
		await waitFor(() => {
			expect(materialApoyoService.getMaterialApoyoModules).toHaveBeenCalledWith(materialApoyoId);
		});
	});

	it('initialises form for creation with next order number', async () => {
		renderForm();

	const titleInput = screen.getByLabelText(/Título del módulo/i) as HTMLInputElement;
	const orderInput = screen.getByLabelText(/Posición en el material de apoyo/i) as HTMLInputElement;

		expect(titleInput.value).toBe('');
		await waitFor(() => {
			expect(orderInput.value).toBe('3');
		});
	});

	it('updates form values when editing an existing module', async () => {
		renderForm({ module: moduleToEdit });

		await waitFor(() => {
			expect(screen.getByDisplayValue('Módulo Editar')).toBeInTheDocument();
			expect(screen.getByDisplayValue('Descripción existente')).toBeInTheDocument();
			expect(
				(screen.getByLabelText(/Posición en el material de apoyo/i) as HTMLInputElement).value
			).toBe('4');
		});
	});

	it('validates required title before submitting', async () => {
		renderForm();

	await fireEvent.click(screen.getByRole('button', { name: /Crear Módulo/i }));

	expect(await screen.findByText(/El título es requerido/)).toBeInTheDocument();
		expect(materialApoyoService.createModule).not.toHaveBeenCalled();
	});

	it('creates module and invokes onSuccess callback', async () => {
		const onSuccess = vi.fn();
		renderForm({ onSuccess });

		await waitFor(() => expect(materialApoyoService.getMaterialApoyoModules).toHaveBeenCalled());

		await fireEvent.input(screen.getByLabelText(/Título del módulo/i), {
			target: { value: 'Nuevo módulo' }
		});
	await fireEvent.click(screen.getByRole('button', { name: /Crear Módulo/i }));

		await waitFor(() => {
			expect(materialApoyoService.createModule).toHaveBeenCalledWith({
				title: 'Nuevo módulo',
				description: '',
				orderNumber: 3,
				materialApoyoId
			});
			expect(onSuccess).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'create', module: expect.any(Object) })
			);
		});
	});

	it('updates module and invokes onSuccess callback', async () => {
		const onSuccess = vi.fn();
	renderForm({ module: moduleToEdit, onSuccess });

	await waitFor(() =>
		expect(materialApoyoService.getMaterialApoyoModules).toHaveBeenCalledWith(materialApoyoId)
	);

	await fireEvent.click(screen.getByRole('button', { name: /Actualizar Módulo/i }));

		await waitFor(() => {
			expect(materialApoyoService.updateModule).toHaveBeenCalledWith('module-edit', {
				title: 'Módulo Editar',
				description: 'Descripción existente',
				orderNumber: 4
			});
			expect(onSuccess).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'update', id: 'module-edit' })
			);
		});
	});

	it('propagates errors via onError callback', async () => {
		const onError = vi.fn();
		vi.mocked(materialApoyoService.createModule).mockRejectedValue(new Error('Error de API'));

	renderForm({ onError });

	await waitFor(() =>
		expect(materialApoyoService.getMaterialApoyoModules).toHaveBeenCalledWith(materialApoyoId)
	);
		await fireEvent.input(screen.getByLabelText(/Título del módulo/i), {
			target: { value: 'Nuevo módulo' }
		});
	await fireEvent.click(screen.getByRole('button', { name: /Crear Módulo/i }));

		await waitFor(() => {
			expect(onError).toHaveBeenCalledWith('Error de API');
		});
	});

	it('resets form and invokes onCancel when closing', async () => {
		const onCancel = vi.fn();
		renderForm({ module: moduleToEdit, onCancel });

		await waitFor(() => expect(screen.getByDisplayValue('Módulo Editar')).toBeInTheDocument());
		await fireEvent.click(screen.getByLabelText('Cerrar'));

		await waitFor(() => {
			expect(onCancel).toHaveBeenCalled();
		});
	});

	it('reloads order number when reopened for creation', async () => {
	const { rerender } = renderForm({ visible: false });

	await rerender({ materialApoyoId, visible: true, module: null });
	await waitFor(() =>
		expect(materialApoyoService.getMaterialApoyoModules).toHaveBeenCalledWith(materialApoyoId)
	);
		await waitFor(() => {
		expect(
			(screen.getByLabelText(/Posición en el material de apoyo/i) as HTMLInputElement).value
		).toBe('3');
		});
	});
});
