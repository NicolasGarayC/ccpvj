import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ModuleCard from '../ModuleCard.svelte';
import type { ModuleSummaryDto } from '$lib/types/api/materialApoyo.types';

describe('ModuleCard', () => {
const mockModule: ModuleSummaryDto = {
	id: 'module-1',
	title: 'Introducción a las Matemáticas',
	description: 'Módulo introductorio que cubre los conceptos básicos',
	orderNumber: 1,
	isActive: true,
	materialApoyoId: 'material-1',
	postCount: 8
};


	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render module card with all basic information', () => {
			render(ModuleCard, { module: mockModule, showActions: false });

			expect(screen.getByText('Introducción a las Matemáticas')).toBeInTheDocument();
			expect(
				screen.getByText('Módulo introductorio que cubre los conceptos básicos')
			).toBeInTheDocument();
			expect(screen.getByText('#1')).toBeInTheDocument();
			expect(screen.getByText('8')).toBeInTheDocument();
		});

		it('should display order number badge', () => {
			render(ModuleCard, { module: mockModule, showActions: false });

			const orderBadge = screen.getByText('#1');
			expect(orderBadge).toBeInTheDocument();
			expect(orderBadge.closest('.order-number')).toBeInTheDocument();
		});

		it('should display active status badge when module is active', () => {
			render(ModuleCard, { module: mockModule, showActions: false });

			expect(screen.getByText('Activo')).toBeInTheDocument();
			const badge = screen.getByText('Activo');
			expect(badge).toHaveClass('active');
		});

		it('should display inactive status badge when module is inactive', () => {
			const inactiveModule = { ...mockModule, isActive: false };
			render(ModuleCard, { module: inactiveModule, showActions: false });

			expect(screen.getByText('Inactivo')).toBeInTheDocument();
			const badge = screen.getByText('Inactivo');
			expect(badge).toHaveClass('inactive');
		});

		it('should display post count with icon', () => {
			render(ModuleCard, { module: mockModule, showActions: false });

			const postCount = screen.getByText('8');
			expect(postCount.closest('.stat')).toBeInTheDocument();
		});

		it('should render without description if not provided', () => {
			const moduleWithoutDescription = { ...mockModule, description: undefined };
			const { container } = render(ModuleCard, {
				module: moduleWithoutDescription,
				showActions: false
			});

			expect(container.querySelector('.module-description')).not.toBeInTheDocument();
		});
	});

	describe('Actions - Public View', () => {
		it('should show only "Ver" button when showActions is false', () => {
			render(ModuleCard, { module: mockModule, showActions: false });

			expect(screen.getByRole('button', { name: /ver/i })).toBeInTheDocument();
			expect(screen.queryByTitle(/editar módulo/i)).not.toBeInTheDocument();
			expect(screen.queryByTitle(/eliminar módulo/i)).not.toBeInTheDocument();
		});

		it('should call view handler when "Ver" button is clicked', async () => {
	const onView = vi.fn();
	render(ModuleCard, { module: mockModule, showActions: false, onView });
	await fireEvent.click(screen.getByRole('button', { name: /ver/i }));
	expect(onView).toHaveBeenCalledWith('module-1');
	});
	});

	describe('Actions - Admin View', () => {
		it('should show edit and delete buttons when showActions is true', () => {
			render(ModuleCard, { module: mockModule, showActions: true });

			expect(screen.getByRole('button', { name: /ver/i })).toBeInTheDocument();
			expect(screen.getByTitle(/editar módulo/i)).toBeInTheDocument();
			expect(screen.getByTitle(/eliminar módulo/i)).toBeInTheDocument();
		});

		it('should call edit handler when edit button is clicked', async () => {
	const onEdit = vi.fn();
	render(ModuleCard, { module: mockModule, showActions: true, onEdit });
	await fireEvent.click(screen.getByTitle(/editar módulo/i));
	expect(onEdit).toHaveBeenCalledWith('module-1');
	});

		it('should open confirmation modal when delete button is clicked', async () => {
			render(ModuleCard, { module: mockModule, showActions: true });

			const deleteButton = screen.getByTitle(/eliminar módulo/i);
			await fireEvent.click(deleteButton);

			// Modal should appear
			expect(screen.getByText(/eliminar módulo/i)).toBeInTheDocument();
			expect(
				screen.getByText(/introducción a las matemáticas/i, { selector: ':not(h4)' })
			).toBeInTheDocument();
			expect(screen.getByText(/esta acción no se puede deshacer/i)).toBeInTheDocument();
		});

		it('should call delete handler when deletion is confirmed', async () => {
	const onDelete = vi.fn();
	render(ModuleCard, { module: mockModule, showActions: true, onDelete });
	await fireEvent.click(screen.getByTitle(/eliminar módulo/i));
	const confirmButton = screen.getAllByRole('button', { name: /eliminar/i }).pop()!;
	await fireEvent.click(confirmButton);
	expect(onDelete).toHaveBeenCalledWith('module-1');
	});

		it('should close modal when deletion is cancelled', async () => {
			render(ModuleCard, { module: mockModule, showActions: true });
			await fireEvent.click(screen.getByTitle(/eliminar módulo/i));
			const cancelButton = screen.getByRole('button', { name: /action.cancel/i });
			await fireEvent.click(cancelButton);
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});
	});

	describe('Visual Styling', () => {
		it('should have highlight styling on "Ver" button', () => {
			const { container } = render(ModuleCard, { module: mockModule, showActions: false });

			const viewButton = container.querySelector('.btn-primary.highlight');
			expect(viewButton).toBeInTheDocument();
			expect(viewButton?.textContent).toContain('Ver');
		});

		it('should display emoji in "Ver" button', () => {
			render(ModuleCard, { module: mockModule, showActions: false });

			const viewButton = screen.getByRole('button', { name: /ver/i });
			expect(viewButton.textContent).toContain('📚');
		});

		it('should display chevron in "Ver" button', () => {
			render(ModuleCard, { module: mockModule, showActions: false });

			const viewButton = screen.getByRole('button', { name: /ver/i });
			expect(viewButton.textContent).toContain('→');
		});
	});

	describe('Different Order Numbers', () => {
		it('should display correct order number for module 5', () => {
			const module5 = { ...mockModule, orderNumber: 5 };
			render(ModuleCard, { module: module5, showActions: false });

			expect(screen.getByText('#5')).toBeInTheDocument();
		});

		it('should display correct order number for module 10', () => {
			const module10 = { ...mockModule, orderNumber: 10 };
			render(ModuleCard, { module: module10, showActions: false });

			expect(screen.getByText('#10')).toBeInTheDocument();
		});
	});

	describe('Post Count Display', () => {
		it('should display zero post count', () => {
			const moduleWithNoPosts = { ...mockModule, postCount: 0 };
			render(ModuleCard, { module: moduleWithNoPosts, showActions: false });

			expect(screen.getByText('0')).toBeInTheDocument();
		});

		it('should display large post count', () => {
			const moduleWithManyPosts = { ...mockModule, postCount: 99 };
			render(ModuleCard, { module: moduleWithManyPosts, showActions: false });

			expect(screen.getByText('99')).toBeInTheDocument();
		});
	});

	describe('Long Titles and Descriptions', () => {
		it('should handle long titles without breaking layout', () => {
			const longTitle = 'A'.repeat(100);
			const moduleWithLongTitle = { ...mockModule, title: longTitle };
			const { container } = render(ModuleCard, {
				module: moduleWithLongTitle,
				showActions: false
			});

			const titleElement = container.querySelector('.module-title');
			expect(titleElement?.textContent).toBe(longTitle);
			expect(titleElement).toBeInTheDocument();
		});

		it('should handle long descriptions without breaking layout', () => {
			const longDescription = 'B'.repeat(500);
			const moduleWithLongDesc = { ...mockModule, description: longDescription };
			const { container } = render(ModuleCard, {
				module: moduleWithLongDesc,
				showActions: false
			});

			const descElement = container.querySelector('.module-description');
			expect(descElement?.textContent).toBe(longDescription);
			expect(descElement).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have title attribute on "Ver" button', () => {
			render(ModuleCard, { module: mockModule, showActions: false });

			const viewButton = screen.getByTitle(/explorar las actividades de este módulo/i);
			expect(viewButton).toBeInTheDocument();
		});

		it('should have title attribute on edit button when showActions is true', () => {
			render(ModuleCard, { module: mockModule, showActions: true });

			const editButton = screen.getByTitle(/editar módulo/i);
			expect(editButton).toBeInTheDocument();
		});

		it('should have title attribute on delete button when showActions is true', () => {
			render(ModuleCard, { module: mockModule, showActions: true });

			const deleteButton = screen.getByTitle(/eliminar módulo/i);
			expect(deleteButton).toBeInTheDocument();
		});

		it('should have title attribute on post count icon', () => {
			render(ModuleCard, { module: mockModule, showActions: false });

			const statElement = screen.getByTitle(/número de contenidos/i);
			expect(statElement).toBeInTheDocument();
		});
	});
});
