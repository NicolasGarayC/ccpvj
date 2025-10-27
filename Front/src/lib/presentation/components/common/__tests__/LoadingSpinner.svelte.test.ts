import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import LoadingSpinner from '../LoadingSpinner.svelte';

describe('LoadingSpinner Component', () => {
	describe('Rendering - Basic', () => {
		it('should render with default props', () => {
			render(LoadingSpinner);

			const spinner = screen.getByLabelText('Cargando...');
			expect(spinner).toBeInTheDocument();
		});

		it('should have spinner element inside', () => {
			render(LoadingSpinner);

			const spinner = screen.getByLabelText('Cargando...');
			const spinnerElement = spinner.querySelector('.spinner');
			expect(spinnerElement).toBeInTheDocument();
		});

		it('should have default medium size', () => {
			const { container } = render(LoadingSpinner);

			const spinner = container.querySelector('.loading-spinner');
			expect(spinner).toHaveStyle({ '--spinner-size': '1.5rem' });
		});
	});

	describe('Size Variants', () => {
		it('should apply small size correctly', () => {
			const { container } = render(LoadingSpinner, { props: { size: 'small' } });

			const spinner = container.querySelector('.loading-spinner');
			expect(spinner).toHaveStyle({ '--spinner-size': '1rem' });
		});

		it('should apply medium size correctly', () => {
			const { container } = render(LoadingSpinner, { props: { size: 'medium' } });

			const spinner = container.querySelector('.loading-spinner');
			expect(spinner).toHaveStyle({ '--spinner-size': '1.5rem' });
		});

		it('should apply large size correctly', () => {
			const { container } = render(LoadingSpinner, { props: { size: 'large' } });

			const spinner = container.querySelector('.loading-spinner');
			expect(spinner).toHaveStyle({ '--spinner-size': '2rem' });
		});
	});

	describe('Color Customization', () => {
		it('should apply default color', () => {
			const { container } = render(LoadingSpinner);

			const spinner = container.querySelector('.loading-spinner');
			expect(spinner).toHaveStyle({ '--spinner-color': 'var(--color-primary)' });
		});

		it('should apply custom color', () => {
			const { container } = render(LoadingSpinner, { props: { color: '#ff0000' } });

			const spinner = container.querySelector('.loading-spinner');
			expect(spinner).toHaveStyle({ '--spinner-color': '#ff0000' });
		});

		it('should apply custom CSS variable color', () => {
			const { container } = render(LoadingSpinner, { props: { color: 'var(--color-error)' } });

			const spinner = container.querySelector('.loading-spinner');
			expect(spinner).toHaveStyle({ '--spinner-color': 'var(--color-error)' });
		});
	});

	describe('Display Mode', () => {
		it('should not have inline class by default', () => {
			const { container } = render(LoadingSpinner);

			const spinner = container.querySelector('.loading-spinner');
			expect(spinner).not.toHaveClass('inline');
		});

		it('should apply inline class when inline is true', () => {
			const { container } = render(LoadingSpinner, { props: { inline: true } });

			const spinner = container.querySelector('.loading-spinner');
			expect(spinner).toHaveClass('inline');
		});

		it('should remove inline class when inline is false', () => {
			const { container } = render(LoadingSpinner, { props: { inline: false } });

			const spinner = container.querySelector('.loading-spinner');
			expect(spinner).not.toHaveClass('inline');
		});
	});

	describe('Accessibility', () => {
		it('should have accessible label', () => {
			render(LoadingSpinner);

			const spinner = screen.getByLabelText('Cargando...');
			expect(spinner).toBeInTheDocument();
		});

		it('should have aria-label attribute', () => {
			render(LoadingSpinner);

			const spinner = screen.getByLabelText('Cargando...');
			expect(spinner).toHaveAttribute('aria-label', 'Cargando...');
		});
	});

	describe('Props Combination', () => {
		it('should correctly apply multiple props together', () => {
			const { container } = render(LoadingSpinner, {
				props: {
					size: 'large',
					color: '#00ff00',
					inline: true
				}
			});

			const spinner = container.querySelector('.loading-spinner');
			expect(spinner).toHaveClass('inline');
			expect(spinner).toHaveStyle({
				'--spinner-size': '2rem',
				'--spinner-color': '#00ff00'
			});
		});

		it('should handle all small props correctly', () => {
			const { container } = render(LoadingSpinner, {
				props: {
					size: 'small',
					color: 'blue',
					inline: true
				}
			});

			const spinner = container.querySelector('.loading-spinner');
			expect(spinner).toHaveClass('inline');
			expect(spinner).toHaveStyle({
				'--spinner-size': '1rem',
				'--spinner-color': 'blue'
			});
		});
	});

	describe('Reactive Updates', () => {
		it('should update size when prop changes', async () => {
			const { container, rerender } = render(LoadingSpinner, { props: { size: 'small' } });

			const spinner = container.querySelector('.loading-spinner');
			expect(spinner).toHaveStyle({ '--spinner-size': '1rem' });

			await rerender({ size: 'large' });

			expect(spinner).toHaveStyle({ '--spinner-size': '2rem' });
		});

		it('should update color when prop changes', async () => {
			const { container, rerender } = render(LoadingSpinner, { props: { color: 'red' } });

			const spinner = container.querySelector('.loading-spinner');
			expect(spinner).toHaveStyle({ '--spinner-color': 'red' });

			await rerender({ color: 'blue' });

			expect(spinner).toHaveStyle({ '--spinner-color': 'blue' });
		});

		it('should toggle inline class when prop changes', async () => {
			const { container, rerender } = render(LoadingSpinner, { props: { inline: false } });

			const spinner = container.querySelector('.loading-spinner');
			expect(spinner).not.toHaveClass('inline');

			await rerender({ inline: true });

			expect(spinner).toHaveClass('inline');
		});
	});
});
