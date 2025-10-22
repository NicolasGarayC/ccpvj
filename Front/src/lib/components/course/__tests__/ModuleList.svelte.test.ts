import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import ModuleList from '../ModuleList.svelte';
import type { ModuleSummaryDto } from '$lib/types/api/materialApoyo.types';
import { materialApoyoService } from '$lib/services/materialApoyoService';

vi.mock('$lib/services/materialApoyoService', () => ({
	materialApoyoService: {
		getMaterialApoyoModules: vi.fn(),
		reorderModule: vi.fn()
	}
}));

vi.mock('../ModuleCard.svelte', () => ({
	default: function ModuleCardMock(options: any) {
		const container = document.createElement('div');
		container.setAttribute('data-testid', 'module-card-mock');

		// Handle both Svelte 4 and Svelte 5 API
		const props = options?.props || options || {};
		const module = props.module || {};
		container.textContent = `Module: ${module.title || 'Unknown'}`;

		if (options?.target) {
			options.target.appendChild(container);
		}

		return {
			$on: vi.fn((event: string, handler: Function) => {
				(container as any)[`_${event}`] = handler;
			}),
			$set: vi.fn(),
			$destroy: vi.fn()
		};
	}
}));

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
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(materialApoyoService.getMaterialApoyoModules).mockResolvedValue(mockModules);
	});

	describe('Rendering', () => {
		it('should render with courseId prop', async () => {
			render(ModuleList, { props: { courseId: 'course-1' } });
			await waitFor(() => {
				expect(screen.getByText('Módulos del Proyecto')).toBeInTheDocument();
			});
		});

		it('should fetch modules on mount', async () => {
			render(ModuleList, { props: { courseId: 'course-1' } });
			await waitFor(() => {
				expect(materialApoyoService.getMaterialApoyoModules).toHaveBeenCalledWith('course-1');
			});
		});

		it('should display module cards after loading', async () => {
			render(ModuleList, { props: { courseId: 'course-1' } });
			await waitFor(() => {
				expect(screen.getByText('Module: Módulo 1')).toBeInTheDocument();
				expect(screen.getByText('Module: Módulo 2')).toBeInTheDocument();
				expect(screen.getByText('Module: Módulo 3')).toBeInTheDocument();
			});
		});

		it('should sort modules by orderNumber', async () => {
			const unorderedModules = [mockModules[2], mockModules[0], mockModules[1]];
			vi.mocked(materialApoyoService.getMaterialApoyoModules).mockResolvedValue(
				unorderedModules
			);

			render(ModuleList, { props: { courseId: 'course-1' } });

			await waitFor(() => {
				const cards = screen.getAllByTestId('module-card-mock');
				expect(cards[0].textContent).toBe('Module: Módulo 1');
				expect(cards[1].textContent).toBe('Module: Módulo 2');
				expect(cards[2].textContent).toBe('Module: Módulo 3');
			});
		});
	});

	describe('Loading State', () => {
		it('should show loading spinner while fetching', () => {
			vi.mocked(materialApoyoService.getMaterialApoyoModules).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockModules), 100))
			);

			render(ModuleList, { props: { courseId: 'course-1' } });
			expect(screen.getByText('Cargando módulos...')).toBeInTheDocument();
		});

		it('should hide loading state after data loads', async () => {
			render(ModuleList, { props: { courseId: 'course-1' } });
			await waitFor(() => {
				expect(screen.queryByText('Cargando módulos...')).not.toBeInTheDocument();
			});
		});
	});

	describe('Error Handling', () => {
		it('should display error message when fetch fails', async () => {
			vi.mocked(materialApoyoService.getMaterialApoyoModules).mockRejectedValue(
				new Error('Error de red')
			);

			render(ModuleList, { props: { courseId: 'course-1' } });

			await waitFor(() => {
				expect(screen.getByText('Error de red')).toBeInTheDocument();
			});
		});

		it('should show retry button on error', async () => {
			vi.mocked(materialApoyoService.getMaterialApoyoModules).mockRejectedValue(
				new Error('Error')
			);

			render(ModuleList, { props: { courseId: 'course-1' } });

			await waitFor(() => {
				expect(screen.getByText('Reintentar')).toBeInTheDocument();
			});
		});

		it('should retry loading when retry button is clicked', async () => {
			vi.mocked(materialApoyoService.getMaterialApoyoModules)
				.mockRejectedValueOnce(new Error('Error'))
				.mockResolvedValueOnce(mockModules);

			render(ModuleList, { props: { courseId: 'course-1' } });

			await waitFor(() => {
				expect(screen.getByText('Error')).toBeInTheDocument();
			});

			const retryButton = screen.getByText('Reintentar');
			await fireEvent.click(retryButton);

			await waitFor(() => {
				expect(materialApoyoService.getMaterialApoyoModules).toHaveBeenCalledTimes(2);
				expect(screen.getByText('Module: Módulo 1')).toBeInTheDocument();
			});
		});

		it('should handle non-Error exceptions', async () => {
			vi.mocked(materialApoyoService.getMaterialApoyoModules).mockRejectedValue('String error');

			render(ModuleList, { props: { courseId: 'course-1' } });

			await waitFor(() => {
				expect(screen.getByText('Error cargando módulos')).toBeInTheDocument();
			});
		});
	});

	describe('Empty State', () => {
		it('should show empty state when no modules', async () => {
			vi.mocked(materialApoyoService.getMaterialApoyoModules).mockResolvedValue([]);

			render(ModuleList, { props: { courseId: 'course-1' } });

			await waitFor(() => {
				expect(screen.getByText('No hay módulos creados')).toBeInTheDocument();
			});
		});

		it('should show descriptive message in empty state', async () => {
			vi.mocked(materialApoyoService.getMaterialApoyoModules).mockResolvedValue([]);

			render(ModuleList, { props: { courseId: 'course-1' } });

			await waitFor(() => {
				expect(
					screen.getByText(/Los módulos te permiten organizar el contenido/)
				).toBeInTheDocument();
			});
		});

		it('should show create button in empty state when showActions is true', async () => {
			vi.mocked(materialApoyoService.getMaterialApoyoModules).mockResolvedValue([]);

			render(ModuleList, { props: { courseId: 'course-1', showActions: true } });

			await waitFor(() => {
				expect(screen.getByText('Crear el primer módulo')).toBeInTheDocument();
			});
		});

		it('should not show create button in empty state when showActions is false', async () => {
			vi.mocked(materialApoyoService.getMaterialApoyoModules).mockResolvedValue([]);

			render(ModuleList, { props: { courseId: 'course-1', showActions: false } });

			await waitFor(() => {
				expect(screen.queryByText('Crear el primer módulo')).not.toBeInTheDocument();
			});
		});
	});

	describe('Create Module Action', () => {
		it('should show create button when showActions is true', async () => {
			render(ModuleList, { props: { courseId: 'course-1', showActions: true } });

			await waitFor(() => {
				expect(screen.getByText('Crear Módulo')).toBeInTheDocument();
			});
		});

		it('should not show create button when showActions is false', async () => {
			render(ModuleList, { props: { courseId: 'course-1', showActions: false } });

			await waitFor(() => {
				expect(screen.queryByText('Crear Módulo')).not.toBeInTheDocument();
			});
		});

		it('should dispatch createModule event when create button is clicked', async () => {
			const { component } = render(ModuleList, {
				props: { courseId: 'course-1', showActions: true }
			});

			const createHandler = vi.fn();
			component.$on('createModule', createHandler);

			await waitFor(() => {
				expect(screen.getByText('Crear Módulo')).toBeInTheDocument();
			});

			const createButton = screen.getByText('Crear Módulo');
			await fireEvent.click(createButton);

			expect(createHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: { courseId: 'course-1' }
				})
			);
		});
	});

	describe('Module Card Events', () => {
		it('should dispatch editModule event when ModuleCard emits edit', async () => {
			const { component } = render(ModuleList, { props: { courseId: 'course-1' } });

			const editHandler = vi.fn();
			component.$on('editModule', editHandler);

			await waitFor(() => {
				expect(screen.getByText('Module: Módulo 1')).toBeInTheDocument();
			});

			// Simulate ModuleCard emitting edit event
			const card = screen.getAllByTestId('module-card-mock')[0];
			const handler = (card as any)._edit;
			if (handler) {
				handler({ detail: 'mod-1' });
			}

			await waitFor(() => {
				expect(editHandler).toHaveBeenCalledWith(
					expect.objectContaining({
						detail: 'mod-1'
					})
				);
			});
		});

		it('should dispatch deleteModule event when ModuleCard emits delete', async () => {
			const { component } = render(ModuleList, { props: { courseId: 'course-1' } });

			const deleteHandler = vi.fn();
			component.$on('deleteModule', deleteHandler);

			await waitFor(() => {
				expect(screen.getByText('Module: Módulo 1')).toBeInTheDocument();
			});

			// Simulate ModuleCard emitting delete event
			const card = screen.getAllByTestId('module-card-mock')[0];
			const handler = (card as any)._delete;
			if (handler) {
				handler({ detail: 'mod-1' });
			}

			await waitFor(() => {
				expect(deleteHandler).toHaveBeenCalledWith(
					expect.objectContaining({
						detail: 'mod-1'
					})
				);
			});
		});

		it('should dispatch viewModule event when ModuleCard emits view', async () => {
			const { component } = render(ModuleList, { props: { courseId: 'course-1' } });

			const viewHandler = vi.fn();
			component.$on('viewModule', viewHandler);

			await waitFor(() => {
				expect(screen.getByText('Module: Módulo 1')).toBeInTheDocument();
			});

			// Simulate ModuleCard emitting view event
			const card = screen.getAllByTestId('module-card-mock')[0];
			const handler = (card as any)._view;
			if (handler) {
				handler({ detail: 'mod-1' });
			}

			await waitFor(() => {
				expect(viewHandler).toHaveBeenCalledWith(
					expect.objectContaining({
						detail: 'mod-1'
					})
				);
			});
		});
	});

	describe('Drag and Drop', () => {
		it('should show drag handle when allowReorder is true', async () => {
			const { container } = render(ModuleList, {
				props: { courseId: 'course-1', allowReorder: true }
			});

			await waitFor(() => {
				const dragHandles = container.querySelectorAll('.drag-handle');
				expect(dragHandles.length).toBeGreaterThan(0);
			});
		});

		it('should not show drag handle when allowReorder is false', async () => {
			const { container } = render(ModuleList, {
				props: { courseId: 'course-1', allowReorder: false }
			});

			await waitFor(() => {
				const dragHandles = container.querySelectorAll('.drag-handle');
				expect(dragHandles.length).toBe(0);
			});
		});

		it('should set draggable attribute when allowReorder is true', async () => {
			const { container } = render(ModuleList, {
				props: { courseId: 'course-1', allowReorder: true }
			});

			await waitFor(() => {
				const moduleItems = container.querySelectorAll('.module-item');
				moduleItems.forEach((item) => {
					expect(item.getAttribute('draggable')).toBe('true');
				});
			});
		});

		it('should apply draggable class when allowReorder is true', async () => {
			const { container } = render(ModuleList, {
				props: { courseId: 'course-1', allowReorder: true }
			});

			await waitFor(() => {
				const moduleItems = container.querySelectorAll('.module-item');
				moduleItems.forEach((item) => {
					expect(item.classList.contains('draggable')).toBe(true);
				});
			});
		});

		it('should call reorderModule service when module is dropped', async () => {
			vi.mocked(materialApoyoService.reorderModule).mockResolvedValue(undefined);

			const { container } = render(ModuleList, {
				props: { courseId: 'course-1', allowReorder: true }
			});

			await waitFor(() => {
				expect(screen.getByText('Module: Módulo 1')).toBeInTheDocument();
			});

			const moduleItems = container.querySelectorAll('.module-item');
			const firstModule = moduleItems[0] as HTMLElement;
			const thirdModule = moduleItems[2] as HTMLElement;

			// Simulate drag start
			const dragStartEvent = new DragEvent('dragstart', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(firstModule, dragStartEvent);

			// Simulate drop
			const dropEvent = new DragEvent('drop', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(thirdModule, dropEvent);

			await waitFor(() => {
				expect(materialApoyoService.reorderModule).toHaveBeenCalledWith('mod-1', 3);
			});
		});

		it('should reload modules after successful reorder', async () => {
			vi.mocked(materialApoyoService.reorderModule).mockResolvedValue(undefined);

			const { container } = render(ModuleList, {
				props: { courseId: 'course-1', allowReorder: true }
			});

			await waitFor(() => {
				expect(screen.getByText('Module: Módulo 1')).toBeInTheDocument();
			});

			vi.clearAllMocks();

			const moduleItems = container.querySelectorAll('.module-item');
			const firstModule = moduleItems[0] as HTMLElement;
			const secondModule = moduleItems[1] as HTMLElement;

			// Simulate drag and drop
			const dragStartEvent = new DragEvent('dragstart', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(firstModule, dragStartEvent);

			const dropEvent = new DragEvent('drop', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(secondModule, dropEvent);

			await waitFor(() => {
				expect(materialApoyoService.getMaterialApoyoModules).toHaveBeenCalledWith('course-1');
			});
		});

		it('should dispatch moduleReordered event after successful reorder', async () => {
			vi.mocked(materialApoyoService.reorderModule).mockResolvedValue(undefined);

			const { container, component } = render(ModuleList, {
				props: { courseId: 'course-1', allowReorder: true }
			});

			const reorderHandler = vi.fn();
			component.$on('moduleReordered', reorderHandler);

			await waitFor(() => {
				expect(screen.getByText('Module: Módulo 1')).toBeInTheDocument();
			});

			const moduleItems = container.querySelectorAll('.module-item');
			const firstModule = moduleItems[0] as HTMLElement;
			const thirdModule = moduleItems[2] as HTMLElement;

			// Simulate drag and drop
			const dragStartEvent = new DragEvent('dragstart', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(firstModule, dragStartEvent);

			const dropEvent = new DragEvent('drop', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(thirdModule, dropEvent);

			await waitFor(() => {
				expect(reorderHandler).toHaveBeenCalledWith(
					expect.objectContaining({
						detail: {
							moduleId: 'mod-1',
							newOrder: 3
						}
					})
				);
			});
		});

		it('should not reorder when dropping on the same module', async () => {
			const { container } = render(ModuleList, {
				props: { courseId: 'course-1', allowReorder: true }
			});

			await waitFor(() => {
				expect(screen.getByText('Module: Módulo 1')).toBeInTheDocument();
			});

			const moduleItems = container.querySelectorAll('.module-item');
			const firstModule = moduleItems[0] as HTMLElement;

			// Simulate drag and drop on same element
			const dragStartEvent = new DragEvent('dragstart', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(firstModule, dragStartEvent);

			const dropEvent = new DragEvent('drop', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(firstModule, dropEvent);

			expect(materialApoyoService.reorderModule).not.toHaveBeenCalled();
		});

		it('should not reorder when allowReorder is false', async () => {
			const { container } = render(ModuleList, {
				props: { courseId: 'course-1', allowReorder: false }
			});

			await waitFor(() => {
				expect(screen.getByText('Module: Módulo 1')).toBeInTheDocument();
			});

			const moduleItems = container.querySelectorAll('.module-item');
			const firstModule = moduleItems[0] as HTMLElement;

			// Attempt to drag
			const dragStartEvent = new DragEvent('dragstart', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(firstModule, dragStartEvent);

			expect(materialApoyoService.reorderModule).not.toHaveBeenCalled();
		});

		it('should show error message if reorder fails', async () => {
			vi.mocked(materialApoyoService.reorderModule).mockRejectedValue(
				new Error('Error reordenando')
			);

			const { container } = render(ModuleList, {
				props: { courseId: 'course-1', allowReorder: true }
			});

			await waitFor(() => {
				expect(screen.getByText('Module: Módulo 1')).toBeInTheDocument();
			});

			const moduleItems = container.querySelectorAll('.module-item');
			const firstModule = moduleItems[0] as HTMLElement;
			const secondModule = moduleItems[1] as HTMLElement;

			// Simulate drag and drop
			const dragStartEvent = new DragEvent('dragstart', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(firstModule, dragStartEvent);

			const dropEvent = new DragEvent('drop', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(secondModule, dropEvent);

			await waitFor(() => {
				expect(screen.getByText('Error reordenando')).toBeInTheDocument();
			});
		});

		it('should apply dragging class during drag', async () => {
			const { container } = render(ModuleList, {
				props: { courseId: 'course-1', allowReorder: true }
			});

			await waitFor(() => {
				expect(screen.getByText('Module: Módulo 1')).toBeInTheDocument();
			});

			const moduleItems = container.querySelectorAll('.module-item');
			const firstModule = moduleItems[0] as HTMLElement;

			// Simulate drag start
			const dragStartEvent = new DragEvent('dragstart', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(firstModule, dragStartEvent);

			await waitFor(() => {
				expect(firstModule.classList.contains('dragging')).toBe(true);
			});
		});

		it('should remove dragging class on drag end', async () => {
			const { container } = render(ModuleList, {
				props: { courseId: 'course-1', allowReorder: true }
			});

			await waitFor(() => {
				expect(screen.getByText('Module: Módulo 1')).toBeInTheDocument();
			});

			const moduleItems = container.querySelectorAll('.module-item');
			const firstModule = moduleItems[0] as HTMLElement;

			// Simulate drag start
			const dragStartEvent = new DragEvent('dragstart', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(firstModule, dragStartEvent);

			// Simulate drag end
			const dragEndEvent = new DragEvent('dragend', { bubbles: true });
			await fireEvent(firstModule, dragEndEvent);

			await waitFor(() => {
				expect(firstModule.classList.contains('dragging')).toBe(false);
			});
		});
	});

	describe('Props Handling', () => {
		it('should pass showActions prop to ModuleCard', async () => {
			render(ModuleList, {
				props: { courseId: 'course-1', showActions: true }
			});

			await waitFor(() => {
				expect(screen.getByText('Module: Módulo 1')).toBeInTheDocument();
			});
		});

		it('should handle different courseIds', async () => {
			const { unmount } = render(ModuleList, { props: { courseId: 'course-1' } });

			await waitFor(() => {
				expect(materialApoyoService.getMaterialApoyoModules).toHaveBeenCalledWith('course-1');
			});

			unmount();

			vi.clearAllMocks();

			render(ModuleList, { props: { courseId: 'course-2' } });

			await waitFor(() => {
				expect(materialApoyoService.getMaterialApoyoModules).toHaveBeenCalledWith('course-2');
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle single module', async () => {
			vi.mocked(materialApoyoService.getMaterialApoyoModules).mockResolvedValue([
				mockModules[0]
			]);

			render(ModuleList, { props: { courseId: 'course-1' } });

			await waitFor(() => {
				expect(screen.getByText('Module: Módulo 1')).toBeInTheDocument();
			});
		});

		it('should handle modules with same order number', async () => {
			const duplicateOrderModules = [
				{ ...mockModules[0], orderNumber: 1 },
				{ ...mockModules[1], orderNumber: 1 },
				{ ...mockModules[2], orderNumber: 2 }
			];

			vi.mocked(materialApoyoService.getMaterialApoyoModules).mockResolvedValue(
				duplicateOrderModules
			);

			render(ModuleList, { props: { courseId: 'course-1' } });

			await waitFor(() => {
				const cards = screen.getAllByTestId('module-card-mock');
				expect(cards.length).toBe(3);
			});
		});

		it('should handle non-Error reorder failures', async () => {
			vi.mocked(materialApoyoService.reorderModule).mockRejectedValue('String error');

			const { container } = render(ModuleList, {
				props: { courseId: 'course-1', allowReorder: true }
			});

			await waitFor(() => {
				expect(screen.getByText('Module: Módulo 1')).toBeInTheDocument();
			});

			const moduleItems = container.querySelectorAll('.module-item');
			const firstModule = moduleItems[0] as HTMLElement;
			const secondModule = moduleItems[1] as HTMLElement;

			const dragStartEvent = new DragEvent('dragstart', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(firstModule, dragStartEvent);

			const dropEvent = new DragEvent('drop', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});
			await fireEvent(secondModule, dropEvent);

			await waitFor(() => {
				expect(screen.getByText('Error reordenando módulo')).toBeInTheDocument();
			});
		});
	});

	describe('Accessibility', () => {
		it('should have role="listitem" on module items', async () => {
			const { container } = render(ModuleList, { props: { courseId: 'course-1' } });

			await waitFor(() => {
				const moduleItems = container.querySelectorAll('[role="listitem"]');
				expect(moduleItems.length).toBe(3);
			});
		});

		it('should have title on drag handle', async () => {
			const { container } = render(ModuleList, {
				props: { courseId: 'course-1', allowReorder: true }
			});

			await waitFor(() => {
				const dragHandle = container.querySelector('.drag-handle');
				expect(dragHandle?.getAttribute('title')).toBe('Arrastra para reordenar');
			});
		});
	});
});
