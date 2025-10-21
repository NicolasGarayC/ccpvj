import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import FeatureCard from '../FeatureCard.svelte';

describe('FeatureCard Component', () => {
	describe('Rendering - Basic', () => {
		it('should render with empty props', () => {
			const { container } = render(FeatureCard);

			const card = container.querySelector('.bg-white');
			expect(card).toBeInTheDocument();
		});

		it('should render title when provided', () => {
			render(FeatureCard, { props: { title: 'Feature Title' } });

			expect(screen.getByText('Feature Title')).toBeInTheDocument();
		});

		it('should render description when provided', () => {
			render(FeatureCard, { props: { description: 'This is a feature description' } });

			expect(screen.getByText('This is a feature description')).toBeInTheDocument();
		});

		it('should render both title and description', () => {
			render(FeatureCard, {
				props: {
					title: 'Amazing Feature',
					description: 'This feature is really amazing'
				}
			});

			expect(screen.getByText('Amazing Feature')).toBeInTheDocument();
			expect(screen.getByText('This feature is really amazing')).toBeInTheDocument();
		});
	});

	describe('Icon Rendering', () => {
		it('should not render icon container when icon is not provided', () => {
			const { container } = render(FeatureCard, {
				props: { title: 'Title', description: 'Description' }
			});

			const iconContainer = container.querySelector('.text-indigo-600');
			expect(iconContainer).not.toBeInTheDocument();
		});

		it('should render icon when provided', () => {
			const { container } = render(FeatureCard, {
				props: {
					title: 'Title',
					description: 'Description',
					icon: 'fas fa-check'
				}
			});

			const iconContainer = container.querySelector('.text-indigo-600');
			expect(iconContainer).toBeInTheDocument();
		});

		it('should apply icon class correctly', () => {
			const { container } = render(FeatureCard, {
				props: {
					title: 'Title',
					description: 'Description',
					icon: 'fas fa-star'
				}
			});

			const icon = container.querySelector('i.fas.fa-star');
			expect(icon).toBeInTheDocument();
		});

		it('should render icon with multiple classes', () => {
			const { container } = render(FeatureCard, {
				props: {
					title: 'Title',
					description: 'Description',
					icon: 'fas fa-heart fa-2x'
				}
			});

			const icon = container.querySelector('i.fas.fa-heart.fa-2x');
			expect(icon).toBeInTheDocument();
		});
	});

	describe('Slot Content', () => {
		it('should render slot content', () => {
			const { container } = render(FeatureCard, {
				props: {
					title: 'Title',
					description: 'Description',
					$$slots: { default: true }
				}
			});

			// Check that the component has a slot
			const card = container.querySelector('.bg-white');
			expect(card).toBeInTheDocument();
		});
	});

	describe('Styling Classes', () => {
		it('should have base styling classes', () => {
			const { container } = render(FeatureCard);

			const card = container.querySelector('.bg-white.p-6.rounded-lg.shadow-md');
			expect(card).toBeInTheDocument();
		});

		it('should have icon container with correct classes when icon is present', () => {
			const { container } = render(FeatureCard, {
				props: { icon: 'fas fa-check' }
			});

			const iconContainer = container.querySelector('.text-indigo-600.mb-4');
			expect(iconContainer).toBeInTheDocument();
		});

		it('should have title with correct classes', () => {
			const { container } = render(FeatureCard, {
				props: { title: 'Test Title' }
			});

			const title = container.querySelector('h3.text-xl.font-semibold.mb-3');
			expect(title).toBeInTheDocument();
			expect(title?.textContent).toBe('Test Title');
		});

		it('should have description with correct classes', () => {
			const { container } = render(FeatureCard, {
				props: { description: 'Test Description' }
			});

			const description = container.querySelector('p.text-gray-600');
			expect(description).toBeInTheDocument();
			expect(description?.textContent).toBe('Test Description');
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty strings for title and description', () => {
			const { container } = render(FeatureCard, {
				props: { title: '', description: '' }
			});

			const card = container.querySelector('.bg-white');
			expect(card).toBeInTheDocument();
		});

		it('should handle very long title', () => {
			const longTitle = 'This is a very long title that goes on and on and on and should still render correctly';
			render(FeatureCard, { props: { title: longTitle } });

			expect(screen.getByText(longTitle)).toBeInTheDocument();
		});

		it('should handle very long description', () => {
			const longDescription =
				'This is a very long description that contains a lot of text and should still be displayed correctly without breaking the layout of the feature card component';
			render(FeatureCard, { props: { description: longDescription } });

			expect(screen.getByText(longDescription)).toBeInTheDocument();
		});

		it('should handle special characters in title', () => {
			const specialTitle = 'Feature <>&"\'';
			render(FeatureCard, { props: { title: specialTitle } });

			expect(screen.getByText(specialTitle)).toBeInTheDocument();
		});

		it('should handle special characters in description', () => {
			const specialDescription = 'Description with <>&"\' characters';
			render(FeatureCard, { props: { description: specialDescription } });

			expect(screen.getByText(specialDescription)).toBeInTheDocument();
		});

		it('should handle empty icon string', () => {
			const { container } = render(FeatureCard, {
				props: { title: 'Title', icon: '' }
			});

			const iconContainer = container.querySelector('.text-indigo-600');
			expect(iconContainer).not.toBeInTheDocument();
		});
	});

	describe('Props Updates', () => {
		it('should update title when prop changes', async () => {
			const { component } = render(FeatureCard, {
				props: { title: 'Initial Title' }
			});

			expect(screen.getByText('Initial Title')).toBeInTheDocument();

			await component.$set({ title: 'Updated Title' });

			expect(screen.queryByText('Initial Title')).not.toBeInTheDocument();
			expect(screen.getByText('Updated Title')).toBeInTheDocument();
		});

		it('should update description when prop changes', async () => {
			const { component } = render(FeatureCard, {
				props: { description: 'Initial Description' }
			});

			expect(screen.getByText('Initial Description')).toBeInTheDocument();

			await component.$set({ description: 'Updated Description' });

			expect(screen.queryByText('Initial Description')).not.toBeInTheDocument();
			expect(screen.getByText('Updated Description')).toBeInTheDocument();
		});

		it('should update icon when prop changes', async () => {
			const { component, container } = render(FeatureCard, {
				props: { icon: 'fas fa-check' }
			});

			expect(container.querySelector('i.fas.fa-check')).toBeInTheDocument();

			await component.$set({ icon: 'fas fa-star' });

			expect(container.querySelector('i.fas.fa-check')).not.toBeInTheDocument();
			expect(container.querySelector('i.fas.fa-star')).toBeInTheDocument();
		});

		it('should show icon when changed from empty to non-empty', async () => {
			const { component, container } = render(FeatureCard, {
				props: { icon: '' }
			});

			expect(container.querySelector('.text-indigo-600')).not.toBeInTheDocument();

			await component.$set({ icon: 'fas fa-check' });

			expect(container.querySelector('.text-indigo-600')).toBeInTheDocument();
		});

		it('should hide icon when changed from non-empty to empty', async () => {
			const { component, container } = render(FeatureCard, {
				props: { icon: 'fas fa-check' }
			});

			expect(container.querySelector('.text-indigo-600')).toBeInTheDocument();

			await component.$set({ icon: '' });

			expect(container.querySelector('.text-indigo-600')).not.toBeInTheDocument();
		});
	});
});
