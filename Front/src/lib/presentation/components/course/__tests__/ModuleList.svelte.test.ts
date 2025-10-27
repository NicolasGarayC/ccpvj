import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import ModuleList from '../ModuleList.svelte';
import { materialApoyoService } from '$lib/application/services/material-apoyo/MaterialApoyoService';
import type { ModuleSummaryDto } from '$lib/types/api/materialApoyo.types';

vi.mock('$lib/application/services/material-apoyo/MaterialApoyoService', () => ({
	materialApoyoService: {
		getMaterialApoyoModules: vi.fn(),
		reorderModule: vi.fn()
	}
}));

if (typeof DataTransfer === 'undefined') {
	class DataTransferMock {
		dropEffect = 'none';
		effectAllowed = 'all';
		files: File[] = [];
		items: unknown[] = [];
		types: string[] = [];
		setData() {}
		getData() {
			return '';
		}
		clearData() {}
	}

	// @ts-expect-error jsdom polyfill
	globalThis.DataTransfer = DataTransferMock;
}

if (typeof DragEvent === 'undefined') {
	class DragEventMock extends Event {
		dataTransfer: DataTransfer;

		constructor(type: string, init?: DragEventInit) {
			super(type, init);
			this.dataTransfer = init?.dataTransfer ?? new DataTransfer();
		}
	}

	// @ts-expect-error jsdom polyfill
	globalThis.DragEvent = DragEventMock;
}

const mockModules: ModuleSummaryDto[] = [
	{
		id: 'mod-1',
		title: 'Módulo 1',
		description: 'Descripción del módulo 1',
		orderNumber: 1,
		isActive: true,
		postCount: 5,
		materialApoyoId: 'course-1'
	},
	{
		id: 'mod-2',
		title: 'Módulo 2',
		description: 'Descripción del módulo 2',
		orderNumber: 2,
		isActive: true,
		postCount: 3,
		materialApoyoId: 'course-1'
	},
	{
		id: 'mod-3',
		title: 'Módulo 3',
		description: 'Descripción del módulo 3',
		orderNumber: 3,
		isActive: true,
		postCount: 0,
		materialApoyoId: 'course-1'
	}
];

describe('ModuleList', () => {
const getModuleTitles = () =>
	Array.from(document.querySelectorAll('.module-title')).map((node) =>
		node.textContent?.trim()
	);

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(materialApoyoService.getMaterialApoyoModules).mockResolvedValue(mockModules);
		vi.mocked(materialApoyoService.reorderModule).mockResolvedValue(undefined);
	});

	const renderList = (props: Partial<{ courseId: string; showActions: boolean; allowReorder: boolean }> = {}) =>
		render(ModuleList, { props: { courseId: 'course-1', ...props } });

	it('renders header and fetches modules on mount', async () => {
		renderList();

		await waitFor(() => {
			expect(screen.getByText('Módulos del Proyecto')).toBeInTheDocument();
			expect(materialApoyoService.getMaterialApoyoModules).toHaveBeenCalledWith('course-1');
		});
	});

	it('displays modules sorted by order number', async () => {
		renderList();
		await waitFor(() => expect(getModuleTitles()).toEqual(['Módulo 1', 'Módulo 2', 'Módulo 3']));
	});

	it('shows loading indicator while fetching', () => {
		vi.mocked(materialApoyoService.getMaterialApoyoModules).mockImplementation(
			() => new Promise((resolve) => setTimeout(() => resolve(mockModules), 50))
		);

		renderList();
		expect(screen.getByText('Cargando módulos...')).toBeInTheDocument();
	});

	it('displays error and allows retry', async () => {
		vi.mocked(materialApoyoService.getMaterialApoyoModules)
			.mockRejectedValueOnce(new Error('Error de red'))
			.mockResolvedValueOnce(mockModules);

		renderList();

		await waitFor(() => expect(screen.getByText('Error de red')).toBeInTheDocument());
		await fireEvent.click(screen.getByText('Reintentar'));

		await waitFor(() => {
			expect(materialApoyoService.getMaterialApoyoModules).toHaveBeenCalledTimes(2);
			expect(getModuleTitles()).toEqual(['Módulo 1', 'Módulo 2', 'Módulo 3']);
		});
	});

	it('shows empty state when there are no modules', async () => {
		vi.mocked(materialApoyoService.getMaterialApoyoModules).mockResolvedValue([]);
		renderList();
		await waitFor(() => expect(screen.getByText('No hay módulos creados')).toBeInTheDocument());
	});

	it('renders create button when showActions is true and dispatches create callback', async () => {
		const createHandler = vi.fn();
		renderList({ showActions: true, onCreateModule: createHandler });

		await waitFor(() => expect(screen.getByText('Crear Módulo')).toBeInTheDocument());
		await fireEvent.click(screen.getByText('Crear Módulo'));

		expect(createHandler).toHaveBeenCalledWith({ courseId: 'course-1' });
	});

	it('invokes onViewModule when the view button is clicked', async () => {
		const viewHandler = vi.fn();
		renderList({ onViewModule: viewHandler });

		await waitFor(() => expect(getModuleTitles().length).toBe(3));
		const firstModule = document.querySelector('.module-item');
		await fireEvent.click(within(firstModule as HTMLElement).getByRole('button', { name: /ver/i }));

		expect(viewHandler).toHaveBeenCalledWith('mod-1');
	});

	it('invokes onEditModule when the edit button is clicked', async () => {
		const editHandler = vi.fn();
		renderList({ showActions: true, onEditModule: editHandler });

		await waitFor(() => expect(getModuleTitles().length).toBe(3));
		const firstModule = document.querySelector('.module-item');
		await fireEvent.click(within(firstModule as HTMLElement).getByTitle('Editar módulo'));

		expect(editHandler).toHaveBeenCalledWith('mod-1');
	});

	it('invokes onDeleteModule when deletion is confirmed', async () => {
		const deleteHandler = vi.fn();
		renderList({ showActions: true, onDeleteModule: deleteHandler });

		await waitFor(() => expect(getModuleTitles().length).toBe(3));
		const firstModule = document.querySelector('.module-item');
		await fireEvent.click(within(firstModule as HTMLElement).getByTitle('Eliminar módulo'));
		await waitFor(() => expect(screen.getByText('Eliminar Módulo')).toBeInTheDocument());
		await fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

		expect(deleteHandler).toHaveBeenCalledWith('mod-1');
	});

	it('calls reorder service and reloads modules when items are reordered', async () => {
		const { container } = renderList({ allowReorder: true });

		await waitFor(() => expect(getModuleTitles()).toEqual(['Módulo 1', 'Módulo 2', 'Módulo 3']));

		const items = container.querySelectorAll('.module-item');
		const first = items[0] as HTMLElement;
		const third = items[2] as HTMLElement;

		await fireEvent(first, new DragEvent('dragstart', { bubbles: true, dataTransfer: new DataTransfer() }));
		await fireEvent(third, new DragEvent('drop', { bubbles: true, dataTransfer: new DataTransfer() }));

		await waitFor(() => {
			expect(materialApoyoService.reorderModule).toHaveBeenCalledWith('mod-1', 3);
			expect(materialApoyoService.getMaterialApoyoModules).toHaveBeenCalledTimes(2);
		});
	});

	it('invokes onModuleReordered callback after successful reorder', async () => {
		const reorderHandler = vi.fn();
		const { container } = renderList({ allowReorder: true, onModuleReordered: reorderHandler });

		await waitFor(() => expect(getModuleTitles().length).toBe(3));

		const items = container.querySelectorAll('.module-item');
		await fireEvent(items[0] as HTMLElement, new DragEvent('dragstart', { bubbles: true, dataTransfer: new DataTransfer() }));
		await fireEvent(items[2] as HTMLElement, new DragEvent('drop', { bubbles: true, dataTransfer: new DataTransfer() }));

		await waitFor(() => {
			expect(reorderHandler).toHaveBeenCalledWith({ moduleId: 'mod-1', newOrder: 3 });
		});
	});

	it('does not reorder when dropping on the same position', async () => {
		const { container } = renderList({ allowReorder: true });
		await waitFor(() => expect(getModuleTitles().length).toBe(3));

		const first = container.querySelector('.module-item') as HTMLElement;
		await fireEvent(first, new DragEvent('dragstart', { bubbles: true, dataTransfer: new DataTransfer() }));
		await fireEvent(first, new DragEvent('drop', { bubbles: true, dataTransfer: new DataTransfer() }));

		expect(materialApoyoService.reorderModule).not.toHaveBeenCalled();
	});

	it('shows error message when reorder fails', async () => {
		vi.mocked(materialApoyoService.reorderModule).mockRejectedValueOnce(new Error('Error reordenando módulo'));
		const { container } = renderList({ allowReorder: true });

		await waitFor(() => expect(getModuleTitles().length).toBe(3));

		const items = container.querySelectorAll('.module-item');
		await fireEvent(items[0] as HTMLElement, new DragEvent('dragstart', { bubbles: true, dataTransfer: new DataTransfer() }));
		await fireEvent(items[1] as HTMLElement, new DragEvent('drop', { bubbles: true, dataTransfer: new DataTransfer() }));

		await waitFor(() => {
			expect(screen.getByText('Error reordenando módulo')).toBeInTheDocument();
		});
	});
});
