import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import Pagination from '../Pagination.svelte';

describe('Pagination Component', () => {
	describe('Rendering - Visibility', () => {
		it('should not render when totalPages is 1', () => {
			render(Pagination, {
				props: {
					currentPage: 1,
					totalPages: 1,
					hasNext: false,
					hasPrevious: false
				}
			});

			expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
		});

		it('should render when totalPages is greater than 1', () => {
			render(Pagination, {
				props: {
					currentPage: 1,
					totalPages: 5,
					hasNext: true,
					hasPrevious: false
				}
			});

			expect(screen.getByRole('navigation')).toBeInTheDocument();
		});

		it('should display current page info', () => {
			render(Pagination, {
				props: {
					currentPage: 3,
					totalPages: 10,
					hasNext: true,
					hasPrevious: true
				}
			});

			expect(screen.getByText('Página 3 de 10')).toBeInTheDocument();
		});
	});

	describe('Navigation Buttons', () => {
		it('should render all navigation buttons', () => {
			render(Pagination, {
				props: {
					currentPage: 5,
					totalPages: 10,
					hasNext: true,
					hasPrevious: true
				}
			});

			expect(screen.getByLabelText('Primera página')).toBeInTheDocument();
			expect(screen.getByLabelText('Página anterior')).toBeInTheDocument();
			expect(screen.getByLabelText('Página siguiente')).toBeInTheDocument();
			expect(screen.getByLabelText('Última página')).toBeInTheDocument();
		});

		it('should disable first and previous buttons when hasPrevious is false', () => {
			render(Pagination, {
				props: {
					currentPage: 1,
					totalPages: 5,
					hasNext: true,
					hasPrevious: false
				}
			});

			expect(screen.getByLabelText('Primera página')).toBeDisabled();
			expect(screen.getByLabelText('Página anterior')).toBeDisabled();
		});

		it('should disable next and last buttons when hasNext is false', () => {
			render(Pagination, {
				props: {
					currentPage: 5,
					totalPages: 5,
					hasNext: false,
					hasPrevious: true
				}
			});

			expect(screen.getByLabelText('Página siguiente')).toBeDisabled();
			expect(screen.getByLabelText('Última página')).toBeDisabled();
		});

		it('should enable all buttons when in middle of pagination', () => {
			render(Pagination, {
				props: {
					currentPage: 3,
					totalPages: 5,
					hasNext: true,
					hasPrevious: true
				}
			});

			expect(screen.getByLabelText('Primera página')).not.toBeDisabled();
			expect(screen.getByLabelText('Página anterior')).not.toBeDisabled();
			expect(screen.getByLabelText('Página siguiente')).not.toBeDisabled();
			expect(screen.getByLabelText('Última página')).not.toBeDisabled();
		});
	});

	describe('Page Number Buttons', () => {
		it('should render page number buttons', () => {
			render(Pagination, {
				props: {
					currentPage: 1,
					totalPages: 5,
					hasNext: true,
					hasPrevious: false
				}
			});

			expect(screen.getByLabelText('Página 1')).toBeInTheDocument();
			expect(screen.getByLabelText('Página 2')).toBeInTheDocument();
			expect(screen.getByLabelText('Página 3')).toBeInTheDocument();
		});

		it('should highlight current page', () => {
			render(Pagination, {
				props: {
					currentPage: 3,
					totalPages: 10,
					hasNext: true,
					hasPrevious: true
				}
			});

			const currentPageButton = screen.getByLabelText('Página 3');
			expect(currentPageButton).toHaveClass('active');
		});

		it('should set aria-current on current page', () => {
			render(Pagination, {
				props: {
					currentPage: 3,
					totalPages: 10,
					hasNext: true,
					hasPrevious: true
				}
			});

			const currentPageButton = screen.getByLabelText('Página 3');
			expect(currentPageButton).toHaveAttribute('aria-current', 'page');
		});

		it('should not have aria-current on other pages', () => {
			render(Pagination, {
				props: {
					currentPage: 3,
					totalPages: 10,
					hasNext: true,
					hasPrevious: true
				}
			});

			const otherPageButton = screen.getByLabelText('Página 4');
			expect(otherPageButton).not.toHaveAttribute('aria-current');
		});
	});

	describe('Visible Pages Calculation', () => {
		it('should show default 5 pages when showRange is not specified', () => {
			render(Pagination, {
				props: {
					currentPage: 5,
					totalPages: 20,
					hasNext: true,
					hasPrevious: true
				}
			});

			// Should show pages 3, 4, 5, 6, 7 (5 pages centered around current page)
			expect(screen.getByLabelText('Página 3')).toBeInTheDocument();
			expect(screen.getByLabelText('Página 4')).toBeInTheDocument();
			expect(screen.getByLabelText('Página 5')).toBeInTheDocument();
			expect(screen.getByLabelText('Página 6')).toBeInTheDocument();
			expect(screen.getByLabelText('Página 7')).toBeInTheDocument();
		});

		it('should respect custom showRange', () => {
			render(Pagination, {
				props: {
					currentPage: 5,
					totalPages: 20,
					hasNext: true,
					hasPrevious: true,
					showRange: 3
				}
			});

			// Should show pages 4, 5, 6 (3 pages centered around current page)
			expect(screen.getByLabelText('Página 4')).toBeInTheDocument();
			expect(screen.getByLabelText('Página 5')).toBeInTheDocument();
			expect(screen.getByLabelText('Página 6')).toBeInTheDocument();
		});

		it('should show ellipsis when there are gaps', () => {
			render(Pagination, {
				props: {
					currentPage: 10,
					totalPages: 20,
					hasNext: true,
					hasPrevious: true,
					showRange: 5
				}
			});

			const ellipsis = screen.getAllByText('...');
			expect(ellipsis.length).toBeGreaterThan(0);
		});

		it('should always show first page when not in visible range', () => {
			render(Pagination, {
				props: {
					currentPage: 10,
					totalPages: 20,
					hasNext: true,
					hasPrevious: true,
					showRange: 5
				}
			});

			expect(screen.getByText('1')).toBeInTheDocument();
		});

		it('should always show last page when not in visible range', () => {
			render(Pagination, {
				props: {
					currentPage: 10,
					totalPages: 20,
					hasNext: true,
					hasPrevious: true,
					showRange: 5
				}
			});

			expect(screen.getByText('20')).toBeInTheDocument();
		});

		it('should adjust visible range when near start', () => {
			render(Pagination, {
				props: {
					currentPage: 2,
					totalPages: 20,
					hasNext: true,
					hasPrevious: true,
					showRange: 5
				}
			});

			// Should show pages 1, 2, 3, 4, 5
			expect(screen.getByLabelText('Página 1')).toBeInTheDocument();
			expect(screen.getByLabelText('Página 2')).toBeInTheDocument();
			expect(screen.getByLabelText('Página 3')).toBeInTheDocument();
			expect(screen.getByLabelText('Página 4')).toBeInTheDocument();
			expect(screen.getByLabelText('Página 5')).toBeInTheDocument();
		});

		it('should adjust visible range when near end', () => {
			render(Pagination, {
				props: {
					currentPage: 19,
					totalPages: 20,
					hasNext: true,
					hasPrevious: true,
					showRange: 5
				}
			});

			// Should show pages 16, 17, 18, 19, 20
			expect(screen.getByLabelText('Página 16')).toBeInTheDocument();
			expect(screen.getByLabelText('Página 17')).toBeInTheDocument();
			expect(screen.getByLabelText('Página 18')).toBeInTheDocument();
			expect(screen.getByLabelText('Página 19')).toBeInTheDocument();
			expect(screen.getByLabelText('Página 20')).toBeInTheDocument();
		});
	});

	describe('Page Navigation Events', () => {
		it('should dispatch pageChange event when clicking a page number', async () => {
			const pageChangeHandler = vi.fn();
			render(Pagination, {
				props: {
					currentPage: 1,
					totalPages: 5,
					hasNext: true,
					hasPrevious: false,
					onPageChangeCallback: pageChangeHandler
				}
			});

			const page3Button = screen.getByLabelText('Página 3');
			await fireEvent.click(page3Button);

			expect(pageChangeHandler).toHaveBeenCalledTimes(1);
			expect(pageChangeHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: 3
				})
			);
		});

		it('should dispatch pageChange when clicking next button', async () => {
			const pageChangeHandler = vi.fn();
			render(Pagination, {
				props: {
					currentPage: 2,
					totalPages: 5,
					hasNext: true,
					hasPrevious: true,
					onPageChangeCallback: pageChangeHandler
				}
			});

			const nextButton = screen.getByLabelText('Página siguiente');
			await fireEvent.click(nextButton);

			expect(pageChangeHandler).toHaveBeenCalledTimes(1);
			expect(pageChangeHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: 3
				})
			);
		});

		it('should dispatch pageChange when clicking previous button', async () => {
			const pageChangeHandler = vi.fn();
			render(Pagination, {
				props: {
					currentPage: 3,
					totalPages: 5,
					hasNext: true,
					hasPrevious: true,
					onPageChangeCallback: pageChangeHandler
				}
			});

			const prevButton = screen.getByLabelText('Página anterior');
			await fireEvent.click(prevButton);

			expect(pageChangeHandler).toHaveBeenCalledTimes(1);
			expect(pageChangeHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: 2
				})
			);
		});

		it('should dispatch pageChange when clicking first button', async () => {
			const pageChangeHandler = vi.fn();
			render(Pagination, {
				props: {
					currentPage: 5,
					totalPages: 10,
					hasNext: true,
					hasPrevious: true,
					onPageChangeCallback: pageChangeHandler
				}
			});

			const firstButton = screen.getByLabelText('Primera página');
			await fireEvent.click(firstButton);

			expect(pageChangeHandler).toHaveBeenCalledTimes(1);
			expect(pageChangeHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: 1
				})
			);
		});

		it('should dispatch pageChange when clicking last button', async () => {
			const pageChangeHandler = vi.fn();
			render(Pagination, {
				props: {
					currentPage: 5,
					totalPages: 10,
					hasNext: true,
					hasPrevious: true,
					onPageChangeCallback: pageChangeHandler
				}
			});

			const lastButton = screen.getByLabelText('Última página');
			await fireEvent.click(lastButton);

			expect(pageChangeHandler).toHaveBeenCalledTimes(1);
			expect(pageChangeHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: 10
				})
			);
		});

		it('should not dispatch event when clicking current page', async () => {
			const pageChangeHandler = vi.fn();
			render(Pagination, {
				props: {
					currentPage: 3,
					totalPages: 5,
					hasNext: true,
					hasPrevious: true,
					onPageChangeCallback: pageChangeHandler
				}
			});

			const currentPageButton = screen.getByLabelText('Página 3');
			await fireEvent.click(currentPageButton);

			expect(pageChangeHandler).not.toHaveBeenCalled();
		});

		it('should not dispatch event when clicking disabled previous button', async () => {
			const pageChangeHandler = vi.fn();
			render(Pagination, {
				props: {
					currentPage: 1,
					totalPages: 5,
					hasNext: true,
					hasPrevious: false,
					onPageChangeCallback: pageChangeHandler
				}
			});

			const prevButton = screen.getByLabelText('Página anterior');
			await fireEvent.click(prevButton);

			expect(pageChangeHandler).not.toHaveBeenCalled();
		});

		it('should not dispatch event when clicking disabled next button', async () => {
			const pageChangeHandler = vi.fn();
			render(Pagination, {
				props: {
					currentPage: 5,
					totalPages: 5,
					hasNext: false,
					hasPrevious: true,
					onPageChangeCallback: pageChangeHandler
				}
			});

			const nextButton = screen.getByLabelText('Página siguiente');
			await fireEvent.click(nextButton);

			expect(pageChangeHandler).not.toHaveBeenCalled();
		});
	});

	describe('Edge Cases', () => {
		it('should handle totalPages of 2', () => {
			render(Pagination, {
				props: {
					currentPage: 1,
					totalPages: 2,
					hasNext: true,
					hasPrevious: false
				}
			});

			expect(screen.getByLabelText('Página 1')).toBeInTheDocument();
			expect(screen.getByLabelText('Página 2')).toBeInTheDocument();
		});

		it('should handle showRange larger than totalPages', () => {
			render(Pagination, {
				props: {
					currentPage: 2,
					totalPages: 3,
					hasNext: true,
					hasPrevious: true,
					showRange: 10
				}
			});

			// Should show all 3 pages
			expect(screen.getByLabelText('Página 1')).toBeInTheDocument();
			expect(screen.getByLabelText('Página 2')).toBeInTheDocument();
			expect(screen.getByLabelText('Página 3')).toBeInTheDocument();
		});

		it('should update when currentPage prop changes', async () => {
			const { rerender } = render(Pagination, {
				props: {
					currentPage: 1,
					totalPages: 5,
					hasNext: true,
					hasPrevious: false
				}
			});

			expect(screen.getByLabelText('Página 1')).toHaveClass('active');

			await rerender({ currentPage: 3, hasPrevious: true });

			expect(screen.getByLabelText('Página 3')).toHaveClass('active');
		});

		it('should update when totalPages prop changes', async () => {
			const { rerender } = render(Pagination, {
				props: {
					currentPage: 3,
					totalPages: 5,
					hasNext: true,
					hasPrevious: true
				}
			});

			expect(screen.getByText('Página 3 de 5')).toBeInTheDocument();

			await rerender({ totalPages: 10 });

			expect(screen.getByText('Página 3 de 10')).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have navigation role', () => {
			render(Pagination, {
				props: {
					currentPage: 1,
					totalPages: 5,
					hasNext: true,
					hasPrevious: false
				}
			});

			expect(screen.getByRole('navigation')).toBeInTheDocument();
		});

		it('should have aria-label on navigation', () => {
			render(Pagination, {
				props: {
					currentPage: 1,
					totalPages: 5,
					hasNext: true,
					hasPrevious: false
				}
			});

			const nav = screen.getByRole('navigation');
			expect(nav).toHaveAttribute('aria-label', 'Navegación de páginas');
		});

		it('should have appropriate aria-labels on all navigation buttons', () => {
			render(Pagination, {
				props: {
					currentPage: 5,
					totalPages: 10,
					hasNext: true,
					hasPrevious: true
				}
			});

			expect(screen.getByLabelText('Primera página')).toBeInTheDocument();
			expect(screen.getByLabelText('Página anterior')).toBeInTheDocument();
			expect(screen.getByLabelText('Página siguiente')).toBeInTheDocument();
			expect(screen.getByLabelText('Última página')).toBeInTheDocument();
		});

		it('should have title attributes on navigation buttons', () => {
			render(Pagination, {
				props: {
					currentPage: 5,
					totalPages: 10,
					hasNext: true,
					hasPrevious: true
				}
			});

			expect(screen.getByTitle('Primera página')).toBeInTheDocument();
			expect(screen.getByTitle('Página anterior')).toBeInTheDocument();
			expect(screen.getByTitle('Página siguiente')).toBeInTheDocument();
			expect(screen.getByTitle('Última página')).toBeInTheDocument();
		});
	});
});
