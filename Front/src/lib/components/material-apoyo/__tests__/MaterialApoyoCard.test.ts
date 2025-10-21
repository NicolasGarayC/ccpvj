import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import MaterialApoyoCard from '../MaterialApoyoCard.svelte';
import type { MaterialApoyoSummaryDto } from '$lib/types/api/materialApoyo.types';

// Mock navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

// Mock service
vi.mock('$lib/services/materialApoyoService', () => ({
	materialApoyoService: {
		deleteMaterialApoyo: vi.fn()
	}
}));

describe('MaterialApoyoCard', () => {
	const mockMaterial: MaterialApoyoSummaryDto = {
		id: 'test-1',
		title: 'Matemáticas Básicas',
		description: 'Curso completo de matemáticas nivel básico con ejercicios prácticos',
		isActive: true,
		isFeatured: false,
		createdAt: 1735689600, // Jan 1, 2025
		educatorId: '1',
		educatorName: 'Prof. Test',
		imagePath: '/media/test.jpg',
		moduleCount: 5,
		postCount: 15
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render material card with all basic information', () => {
			render(MaterialApoyoCard, { materialApoyo: mockMaterial, showActions: false });

			expect(screen.getByText('Matemáticas Básicas')).toBeInTheDocument();
			expect(screen.getByText(/Curso completo de matemáticas/)).toBeInTheDocument();
			expect(screen.getByText('Prof. Test')).toBeInTheDocument();
			expect(screen.getByText(/5 módulos/)).toBeInTheDocument();
			expect(screen.getByText(/15 contenidos/)).toBeInTheDocument();
		});

		it('should display image when imagePath is provided', () => {
			render(MaterialApoyoCard, { materialApoyo: mockMaterial, showActions: false });

			const img = screen.getByAltText('Matemáticas Básicas');
			expect(img).toBeInTheDocument();
			expect(img).toHaveAttribute('src', '/media/test.jpg');
		});

		it('should display placeholder when no imagePath', () => {
			const materialWithoutImage = { ...mockMaterial, imagePath: undefined };
			const { container } = render(MaterialApoyoCard, {
				materialApoyo: materialWithoutImage,
				showActions: false
			});

			const placeholder = container.querySelector('.course-image.placeholder');
			expect(placeholder).toBeInTheDocument();
		});

		it('should display featured badge when isFeatured is true', () => {
			const featuredMaterial = { ...mockMaterial, isFeatured: true };
			render(MaterialApoyoCard, { materialApoyo: featuredMaterial, showActions: false });

			expect(screen.getByText('Destacado')).toBeInTheDocument();
		});

		it('should not display featured badge when isFeatured is false', () => {
			render(MaterialApoyoCard, { materialApoyo: mockMaterial, showActions: false });

			expect(screen.queryByText('Destacado')).not.toBeInTheDocument();
		});

		it('should truncate long descriptions to 150 characters', () => {
			const longDescription = 'A'.repeat(200);
			const materialWithLongDesc = { ...mockMaterial, description: longDescription };
			const { container } = render(MaterialApoyoCard, {
				materialApoyo: materialWithLongDesc,
				showActions: false
			});

			const description = container.querySelector('.course-description');
			expect(description?.textContent).toContain('...');
			expect(description?.textContent?.length).toBeLessThanOrEqual(154); // 150 + "..."
		});

		it('should display inactive overlay when isActive is false', () => {
			const inactiveMaterial = { ...mockMaterial, isActive: false };
			render(MaterialApoyoCard, { materialApoyo: inactiveMaterial, showActions: false });

			expect(screen.getByText('Material Inactivo')).toBeInTheDocument();
		});
	});

	describe('Actions - Public View', () => {
		it('should show only "Ver Material" button when showActions is false', () => {
			render(MaterialApoyoCard, { materialApoyo: mockMaterial, showActions: false });

			expect(screen.getByRole('button', { name: /ver material/i })).toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument();
		});

		it('should navigate to material detail when "Ver Material" is clicked', async () => {
			const { goto } = await import('$app/navigation');
			render(MaterialApoyoCard, { materialApoyo: mockMaterial, showActions: false });

			const viewButton = screen.getByRole('button', { name: /ver material/i });
			await fireEvent.click(viewButton);

			expect(goto).toHaveBeenCalledWith('/material-apoyo/test-1');
		});
	});

	describe('Actions - Admin View', () => {
		it('should show edit and delete buttons when showActions is true', () => {
			render(MaterialApoyoCard, { materialApoyo: mockMaterial, showActions: true });

			expect(screen.getByRole('button', { name: /ver material/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
		});

		it('should navigate to edit page when "Editar" is clicked', async () => {
			const { goto } = await import('$app/navigation');
			render(MaterialApoyoCard, { materialApoyo: mockMaterial, showActions: true });

			const editButton = screen.getByRole('button', { name: /editar/i });
			await fireEvent.click(editButton);

			expect(goto).toHaveBeenCalledWith('/material-apoyo/test-1/edit');
		});

		it('should open delete modal when "Eliminar" is clicked', async () => {
			render(MaterialApoyoCard, { materialApoyo: mockMaterial, showActions: true });

			const deleteButton = screen.getByRole('button', { name: /eliminar/i });
			await fireEvent.click(deleteButton);

			// Modal should appear
			expect(screen.getByText(/eliminar material de apoyo/i)).toBeInTheDocument();
			expect(screen.getByText(/matemáticas básicas/i)).toBeInTheDocument();
		});

		it('should call delete service when deletion is confirmed', async () => {
			const { materialApoyoService } = await import('$lib/services/materialApoyoService');
			const mockDelete = vi.fn().mockResolvedValue(undefined);
			(materialApoyoService.deleteMaterialApoyo as any) = mockDelete;

			const { component } = render(MaterialApoyoCard, {
				materialApoyo: mockMaterial,
				showActions: true
			});

			const deletedEventSpy = vi.fn();
			component.$on('deleted', deletedEventSpy);

			// Click delete button
			const deleteButton = screen.getByRole('button', { name: /eliminar/i });
			await fireEvent.click(deleteButton);

			// Confirm deletion
			const confirmButton = screen.getByRole('button', { name: /sí, eliminar material/i });
			await fireEvent.click(confirmButton);

			expect(mockDelete).toHaveBeenCalledWith('test-1');
			expect(deletedEventSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: 'test-1'
				})
			);
		});

		it('should display error message when deletion fails', async () => {
			const { materialApoyoService } = await import('$lib/services/materialApoyoService');
			const mockDelete = vi.fn().mockRejectedValue(new Error('Network error'));
			(materialApoyoService.deleteMaterialApoyo as any) = mockDelete;

			render(MaterialApoyoCard, { materialApoyo: mockMaterial, showActions: true });

			// Click delete button
			const deleteButton = screen.getByRole('button', { name: /eliminar/i });
			await fireEvent.click(deleteButton);

			// Confirm deletion
			const confirmButton = screen.getByRole('button', { name: /sí, eliminar material/i });
			await fireEvent.click(confirmButton);

			// Wait for error message
			await screen.findByText(/network error/i);

			expect(screen.getByText(/network error/i)).toBeInTheDocument();
		});

		it('should close delete modal when "Cancelar" is clicked', async () => {
			render(MaterialApoyoCard, { materialApoyo: mockMaterial, showActions: true });

			// Open modal
			const deleteButton = screen.getByRole('button', { name: /eliminar/i });
			await fireEvent.click(deleteButton);

			expect(screen.getByText(/eliminar material de apoyo/i)).toBeInTheDocument();

			// Cancel
			const cancelButton = screen.getByRole('button', { name: /cancelar/i });
			await fireEvent.click(cancelButton);

			// Modal should close
			expect(screen.queryByText(/eliminar material de apoyo/i)).not.toBeInTheDocument();
		});
	});

	describe('Date Formatting', () => {
		it('should format Unix timestamp correctly', () => {
			render(MaterialApoyoCard, { materialApoyo: mockMaterial, showActions: false });

			// Check for formatted date (Spanish locale)
			expect(screen.getByText(/creado:/i)).toBeInTheDocument();
			expect(screen.getByText(/2025/)).toBeInTheDocument();
		});
	});

	describe('Module and Post Counts', () => {
		it('should display module count', () => {
			render(MaterialApoyoCard, { materialApoyo: mockMaterial, showActions: false });

			expect(screen.getByText(/5 módulos/)).toBeInTheDocument();
		});

		it('should display post count when available', () => {
			render(MaterialApoyoCard, { materialApoyo: mockMaterial, showActions: false });

			expect(screen.getByText(/15 contenidos/)).toBeInTheDocument();
		});

		it('should not display post count when undefined', () => {
			const materialWithoutPostCount = { ...mockMaterial, postCount: undefined };
			render(MaterialApoyoCard, {
				materialApoyo: materialWithoutPostCount,
				showActions: false
			});

			expect(screen.queryByText(/contenidos/)).not.toBeInTheDocument();
		});
	});

	describe('Image URL Handling', () => {
		it('should handle relative paths by prepending /media/', () => {
			const materialWithRelativePath = { ...mockMaterial, imagePath: 'test.jpg' };
			render(MaterialApoyoCard, {
				materialApoyo: materialWithRelativePath,
				showActions: false
			});

			const img = screen.getByAltText('Matemáticas Básicas');
			expect(img).toHaveAttribute('src', '/media/test.jpg');
		});

		it('should not modify paths starting with http', () => {
			const materialWithAbsolutePath = {
				...mockMaterial,
				imagePath: 'http://example.com/test.jpg'
			};
			render(MaterialApoyoCard, {
				materialApoyo: materialWithAbsolutePath,
				showActions: false
			});

			const img = screen.getByAltText('Matemáticas Básicas');
			expect(img).toHaveAttribute('src', 'http://example.com/test.jpg');
		});

		it('should not modify paths already starting with /media/', () => {
			const materialWithMediaPath = { ...mockMaterial, imagePath: '/media/test.jpg' };
			render(MaterialApoyoCard, {
				materialApoyo: materialWithMediaPath,
				showActions: false
			});

			const img = screen.getByAltText('Matemáticas Básicas');
			expect(img).toHaveAttribute('src', '/media/test.jpg');
		});
	});
});
