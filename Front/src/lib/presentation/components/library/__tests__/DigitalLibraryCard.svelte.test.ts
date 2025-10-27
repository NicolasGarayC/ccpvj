import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import DigitalLibraryCard from '../DigitalLibraryCard.svelte';
import TestHost from './DigitalLibraryCardTestHost.svelte';
import type { LibraryItemDto } from '$lib/application/services/library/DigitalLibraryService';

// Mock dependencies
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

const mocks = vi.hoisted(() => {
	const downloadFile = vi.fn();
	const incrementViewCount = vi.fn();
	const getFileTypeIcon = (type: string) => {
		const icons: Record<string, string> = {
			image: '🖼️',
			video: '🎥',
			audio: '🎵',
			document: '📄'
		};
		return icons[type] || '📁';
	};
	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	return {
		mockDownloadFile: downloadFile,
		mockIncrementViewCount: incrementViewCount,
		getFileTypeIcon,
		formatFileSize
	};
});

vi.mock('$lib/application/services/library/DigitalLibraryService', () => ({
	digitalLibraryService: {
		downloadFile: mocks.mockDownloadFile,
		incrementViewCount: mocks.mockIncrementViewCount,
		getFileTypeIcon: mocks.getFileTypeIcon,
		formatFileSize: mocks.formatFileSize
	}
}));

describe('DigitalLibraryCard', () => {
	let mockItem: LibraryItemDto;

	beforeEach(() => {
		vi.clearAllMocks();
		mocks.mockDownloadFile.mockReset();
		mocks.mockIncrementViewCount.mockReset();
		mocks.mockDownloadFile.mockResolvedValue(undefined);
		mocks.mockIncrementViewCount.mockResolvedValue(undefined);

		mockItem = {
			id: 'item-123',
			title: 'Canción de Víctor Jara',
			description: 'Una hermosa canción del folklore chileno',
			author: 'Víctor Jara',
			createdAt: '2024-01-15T10:30:00Z',
			uploadedBy: 'user1',
			fileType: 'audio',
			filePath: '/media/library/cancion.mp3',
			fileName: 'cancion.mp3',
			fileSize: 5242880, // 5MB
			tags: ['música', 'folklore', 'chile'],
			category: 'victor-jara',
			language: 'es',
			year: 1973,
			downloadCount: 150,
			viewCount: 500,
			isActive: true,
			isFeatured: true,
			collections: [
				{
					id: 'coll-1',
					name: 'Canciones Clásicas',
					isActive: true,
					createdAt: '2024-01-01T00:00:00Z',
					itemCount: 25
				}
			]
		};
	});

	// ================================================================
	// RENDERING - GRID VIEW
	// ================================================================

	describe('Rendering - Grid View', () => {
		it('should render library item card in grid view', () => {
			render(DigitalLibraryCard, { props: { item: mockItem, viewMode: 'grid' } });

			expect(screen.getByText('Canción de Víctor Jara')).toBeInTheDocument();
			expect(screen.getByText('Una hermosa canción del folklore chileno')).toBeInTheDocument();
		});

		it('should display file type and size in grid view', () => {
			render(DigitalLibraryCard, { props: { item: mockItem, viewMode: 'grid' } });

			expect(screen.getByText('audio')).toBeInTheDocument();
			expect(screen.getByText('5 MB')).toBeInTheDocument();
		});

		it('should display author when provided', () => {
			render(DigitalLibraryCard, { props: { item: mockItem, viewMode: 'grid' } });

			expect(screen.getByText('Víctor Jara')).toBeInTheDocument();
		});

		it('should not display author when not provided', () => {
			const itemWithoutAuthor = { ...mockItem, author: undefined };
			render(DigitalLibraryCard, { props: { item: itemWithoutAuthor, viewMode: 'grid' } });

			expect(screen.queryByText('👤')).not.toBeInTheDocument();
		});

		it('should display category with proper formatting', () => {
			render(DigitalLibraryCard, { props: { item: mockItem, viewMode: 'grid' } });

			expect(screen.getByText(/Victor Jara/i)).toBeInTheDocument();
		});

		it('should display year when provided', () => {
			render(DigitalLibraryCard, { props: { item: mockItem, viewMode: 'grid' } });

			expect(screen.getByText('1973')).toBeInTheDocument();
		});

		it('should display language when provided', () => {
			render(DigitalLibraryCard, { props: { item: mockItem, viewMode: 'grid' } });

			expect(screen.getByText('es')).toBeInTheDocument();
		});

		it('should display view and download counts', () => {
			render(DigitalLibraryCard, { props: { item: mockItem, viewMode: 'grid' } });

			expect(screen.getByText('500')).toBeInTheDocument(); // viewCount
			expect(screen.getByText('150')).toBeInTheDocument(); // downloadCount
		});

		it('should format date correctly', () => {
			render(DigitalLibraryCard, { props: { item: mockItem, viewMode: 'grid' } });

			// Date should be formatted in Spanish
			expect(screen.getByText(/15 ene 2024/i)).toBeInTheDocument();
		});
	});

	// ================================================================
	// RENDERING - LIST VIEW
	// ================================================================

	describe('Rendering - List View', () => {
		it('should render library item card in list view', () => {
			render(DigitalLibraryCard, { props: { item: mockItem, viewMode: 'list' } });

			expect(screen.getByText('Canción de Víctor Jara')).toBeInTheDocument();
			expect(screen.getByText('Una hermosa canción del folklore chileno')).toBeInTheDocument();
		});

		it('should display file type icon in list view', () => {
			render(DigitalLibraryCard, { props: { item: mockItem, viewMode: 'list' } });

			expect(screen.getByText('🎵')).toBeInTheDocument();
		});

		it('should display metadata inline in list view', () => {
			render(DigitalLibraryCard, { props: { item: mockItem, viewMode: 'list' } });

			expect(screen.getByText('audio')).toBeInTheDocument();
			expect(screen.getByText('5 MB')).toBeInTheDocument();
			expect(screen.getByText('Víctor Jara')).toBeInTheDocument();
		});
	});

	// ================================================================
	// TAGS HANDLING
	// ================================================================

	describe('Tags Handling', () => {
		it('should display tags when provided as array', () => {
			render(DigitalLibraryCard, { props: { item: mockItem, viewMode: 'grid' } });

			expect(screen.getByText('música')).toBeInTheDocument();
			expect(screen.getByText('folklore')).toBeInTheDocument();
			expect(screen.getByText('chile')).toBeInTheDocument();
		});

		it('should parse tags when provided as comma-separated string', () => {
			const itemWithStringTags = {
				...mockItem,
				tags: 'música, folklore, chile'
			};
			render(DigitalLibraryCard, { props: { item: itemWithStringTags, viewMode: 'grid' } });

			expect(screen.getByText('música')).toBeInTheDocument();
			expect(screen.getByText('folklore')).toBeInTheDocument();
			expect(screen.getByText('chile')).toBeInTheDocument();
		});

		it('should limit displayed tags to 3 in grid view', () => {
			const itemWithManyTags = {
				...mockItem,
				tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
			};
			render(DigitalLibraryCard, { props: { item: itemWithManyTags, viewMode: 'grid' } });

			expect(screen.getByText('tag1')).toBeInTheDocument();
			expect(screen.getByText('tag2')).toBeInTheDocument();
			expect(screen.getByText('tag3')).toBeInTheDocument();
			expect(screen.getByText('+2 más')).toBeInTheDocument();
		});

		it('should limit displayed tags to 5 in list view', () => {
			const itemWithManyTags = {
				...mockItem,
				tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7']
			};
			render(DigitalLibraryCard, { props: { item: itemWithManyTags, viewMode: 'list' } });

			expect(screen.getByText('tag1')).toBeInTheDocument();
			expect(screen.getByText('tag5')).toBeInTheDocument();
			expect(screen.getByText('+2 más')).toBeInTheDocument();
		});

		it('should not display tags section when no tags provided', () => {
			const itemWithoutTags = { ...mockItem, tags: null };
			render(DigitalLibraryCard, { props: { item: itemWithoutTags, viewMode: 'grid' } });

			expect(screen.queryByText('🏷️')).not.toBeInTheDocument();
		});

		it('should handle empty tags array', () => {
			const itemWithEmptyTags = { ...mockItem, tags: [] };
			render(DigitalLibraryCard, { props: { item: itemWithEmptyTags, viewMode: 'grid' } });

			expect(screen.queryByText('🏷️')).not.toBeInTheDocument();
		});
	});

	// ================================================================
	// COLLECTIONS
	// ================================================================

	describe('Collections', () => {
		it('should display collections when provided', () => {
			render(DigitalLibraryCard, { props: { item: mockItem, viewMode: 'grid' } });

			expect(screen.getByText('📚')).toBeInTheDocument();
			expect(screen.getByText('Canciones Clásicas')).toBeInTheDocument();
		});

		it('should limit displayed collections to 2', () => {
			const itemWithManyCollections = {
				...mockItem,
				collections: [
					{ id: '1', name: 'Col 1', isActive: true, createdAt: '2024-01-01', itemCount: 10 },
					{ id: '2', name: 'Col 2', isActive: true, createdAt: '2024-01-01', itemCount: 10 },
					{ id: '3', name: 'Col 3', isActive: true, createdAt: '2024-01-01', itemCount: 10 }
				]
			};
			render(DigitalLibraryCard, { props: { item: itemWithManyCollections, viewMode: 'grid' } });

			expect(screen.getByText('Col 1')).toBeInTheDocument();
			expect(screen.getByText('Col 2')).toBeInTheDocument();
			expect(screen.getByText('+1')).toBeInTheDocument();
		});

		it('should not display collections section when empty', () => {
			const itemWithoutCollections = { ...mockItem, collections: [] };
			render(DigitalLibraryCard, { props: { item: itemWithoutCollections, viewMode: 'grid' } });

			expect(screen.queryByText('📚')).not.toBeInTheDocument();
		});
	});

	// ================================================================
	// ACTION BUTTONS
	// ================================================================

	describe('Action Buttons', () => {
		it('should display "Ver" and "Descargar" buttons', () => {
			render(DigitalLibraryCard, { props: { item: mockItem, viewMode: 'grid' } });

			expect(screen.getAllByText('Ver')[0]).toBeInTheDocument();
			expect(screen.getAllByText('Descargar')[0]).toBeInTheDocument();
		});

		it('should show admin buttons when canManage is true', () => {
			render(DigitalLibraryCard, {
				props: { item: mockItem, viewMode: 'grid', canManage: true }
			});

			const editButtons = screen.getAllByTitle('Editar');
			const deleteButtons = screen.getAllByTitle('Eliminar');

			expect(editButtons.length).toBeGreaterThan(0);
			expect(deleteButtons.length).toBeGreaterThan(0);
		});

		it('should not show admin buttons when canManage is false', () => {
			render(DigitalLibraryCard, {
				props: { item: mockItem, viewMode: 'grid', canManage: false }
			});

			expect(screen.queryByTitle('Editar')).not.toBeInTheDocument();
			expect(screen.queryByTitle('Eliminar')).not.toBeInTheDocument();
		});
	});

	// ================================================================
	// EVENTS
	// ================================================================

	describe('Events', () => {
		it('should dispatch view event when "Ver" button is clicked', async () => {
			const viewHandler = vi.fn();

			mocks.mockIncrementViewCount.mockResolvedValueOnce(undefined);

			render(TestHost, {
				props: {
					item: mockItem,
					viewMode: 'grid',
					onView: viewHandler
				}
			});

			const verButton = screen.getAllByRole('button', { name: /ver/i })[0];
			await fireEvent.click(verButton);

			await vi.waitFor(() => {
				expect(viewHandler).toHaveBeenCalled();
			});
			expect(mocks.mockIncrementViewCount).toHaveBeenCalledWith(mockItem.id);
		});

		it('should dispatch download event when "Descargar" button is clicked', async () => {
			mocks.mockDownloadFile.mockResolvedValueOnce(undefined);

			const downloadHandler = vi.fn();

			render(TestHost, {
				props: {
					item: mockItem,
					viewMode: 'grid',
					onDownload: downloadHandler
				}
			});

			const descargarButton = screen.getAllByRole('button', { name: /descargar/i })[0];
			await fireEvent.click(descargarButton);

			await vi.waitFor(() => {
				expect(downloadHandler).toHaveBeenCalled();
			});
			expect(mocks.mockDownloadFile).toHaveBeenCalledWith(mockItem);
		});

		it('should dispatch edit event when edit button is clicked', async () => {
			const editHandler = vi.fn<EventListener>();

			render(TestHost, {
				props: {
					item: mockItem,
					viewMode: 'grid',
					canManage: true,
					onEdit: editHandler
				}
			});

			const editButton = screen.getAllByTitle('Editar')[0];
			await fireEvent.click(editButton);

			expect(editHandler).toHaveBeenCalled();
		});

		it('should dispatch delete event when delete button is clicked', async () => {
			const deleteHandler = vi.fn<EventListener>();

			render(TestHost, {
				props: {
					item: mockItem,
					viewMode: 'grid',
					canManage: true,
					onDelete: deleteHandler
				}
			});

			const deleteButton = screen.getAllByTitle('Eliminar')[0];
			await fireEvent.click(deleteButton);

			expect(deleteHandler).toHaveBeenCalled();
		});
	});

	// ================================================================
	// LOADING STATES
	// ================================================================

	describe('Loading States', () => {
		it('should show loading spinner when downloading', async () => {
			const { digitalLibraryService } = await import('$lib/application/services/library/DigitalLibraryService');

			// Mock slow download
			(digitalLibraryService.downloadFile as any).mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						setTimeout(resolve, 100);
					})
			);

			render(DigitalLibraryCard, { props: { item: mockItem, viewMode: 'grid' } });

			const descargarButton = screen.getAllByText('Descargar')[0];
			await fireEvent.click(descargarButton);

			await vi.waitFor(() => {
				expect(
					screen.getByRole('status', { name: /descargando recurso/i })
				).toBeInTheDocument();
			});
		});

		it('should disable download button while downloading', async () => {
			const { digitalLibraryService } = await import('$lib/application/services/library/DigitalLibraryService');

			(digitalLibraryService.downloadFile as any).mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						setTimeout(resolve, 100);
					})
			);

			render(DigitalLibraryCard, { props: { item: mockItem, viewMode: 'grid' } });

			const descargarButton = screen.getAllByRole('button', { name: /descargar/i })[0];
			await fireEvent.click(descargarButton!);

			await vi.waitFor(() => {
				expect(descargarButton).toBeDisabled();
			});
		});
	});

	// ================================================================
	// FILE TYPE ICONS AND COLORS
	// ================================================================

	describe('File Type Display', () => {
		it('should display correct icon for audio files', () => {
			render(DigitalLibraryCard, { props: { item: mockItem, viewMode: 'grid' } });

			expect(screen.getByText('🎵')).toBeInTheDocument();
		});

		it('should display correct icon for video files', () => {
			const videoItem = { ...mockItem, fileType: 'video' };
			render(DigitalLibraryCard, { props: { item: videoItem, viewMode: 'grid' } });

			expect(screen.getByText('🎥')).toBeInTheDocument();
		});

		it('should display correct icon for image files', () => {
			const imageItem = { ...mockItem, fileType: 'image' };
			render(DigitalLibraryCard, { props: { item: imageItem, viewMode: 'grid' } });

			expect(screen.getByText('🖼️')).toBeInTheDocument();
		});

		it('should display correct icon for document files', () => {
			const docItem = { ...mockItem, fileType: 'document' };
			render(DigitalLibraryCard, { props: { item: docItem, viewMode: 'grid' } });

			expect(screen.getByText('📄')).toBeInTheDocument();
		});
	});

	// ================================================================
	// EDGE CASES
	// ================================================================

	describe('Edge Cases', () => {
		it('should render without description', () => {
			const itemWithoutDescription = { ...mockItem, description: undefined };
			render(DigitalLibraryCard, {
				props: { item: itemWithoutDescription, viewMode: 'grid' }
			});

			expect(screen.getByText('Canción de Víctor Jara')).toBeInTheDocument();
		});

		it('should handle very long titles with line-clamp', () => {
			const itemWithLongTitle = {
				...mockItem,
				title: 'Este es un título muy largo que debería ser truncado con line-clamp para no romper el diseño de la tarjeta'
			};
			render(DigitalLibraryCard, { props: { item: itemWithLongTitle, viewMode: 'grid' } });

			const title = screen.getByText(/Este es un título muy largo/i);
			expect(title).toHaveClass('line-clamp-2');
		});

		it('should handle very long descriptions with line-clamp', () => {
			const itemWithLongDesc = {
				...mockItem,
				description:
					'Esta es una descripción muy larga que debería ser truncada con line-clamp para mantener el diseño consistente de la tarjeta. Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
			};
			render(DigitalLibraryCard, { props: { item: itemWithLongDesc, viewMode: 'grid' } });

			const description = screen.getByText(/Esta es una descripción muy larga/i);
			expect(description).toHaveClass('line-clamp-3');
		});

		it('should handle minimal item data', () => {
			const minimalItem: LibraryItemDto = {
				id: 'min-1',
				title: 'Minimal Item',
				createdAt: '2024-01-01T00:00:00Z',
				uploadedBy: 'user1',
				fileType: 'document',
				filePath: '/file.pdf',
				fileName: 'file.pdf',
				fileSize: 1024,
				tags: null,
				downloadCount: 0,
				viewCount: 0,
				isActive: true,
				isFeatured: false,
				collections: []
			};

			render(DigitalLibraryCard, { props: { item: minimalItem, viewMode: 'grid' } });

			expect(screen.getByText('Minimal Item')).toBeInTheDocument();
			const counters = screen.getAllByText('0');
			expect(counters.length).toBeGreaterThanOrEqual(2);
		});

		it('should handle different category formats', () => {
			const categories = [
				'nueva-cancion',
				'educacion-popular',
				'memoria-historica',
				'general'
			];

			categories.forEach((category) => {
				const itemWithCategory = { ...mockItem, category };
				const { unmount } = render(DigitalLibraryCard, {
					props: { item: itemWithCategory, viewMode: 'grid' }
				});

				const formattedCategory = category
					.replace('-', ' ')
					.replace(/\b\w/g, (l) => l.toUpperCase());
				expect(screen.getByText(formattedCategory)).toBeInTheDocument();

				unmount();
			});
		});
	});

	// ================================================================
	// ACCESSIBILITY
	// ================================================================

	describe('Accessibility', () => {
		it('should have accessible button titles', () => {
			render(DigitalLibraryCard, {
				props: { item: mockItem, viewMode: 'grid', canManage: true }
			});

			expect(screen.getAllByLabelText('Editar recurso')[0]).toBeInTheDocument();
			expect(screen.getAllByLabelText('Eliminar recurso')[0]).toBeInTheDocument();
		});

		it('should show disabled state visually', async () => {
			const { digitalLibraryService } = await import('$lib/application/services/library/DigitalLibraryService');

			(digitalLibraryService.downloadFile as any).mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						setTimeout(resolve, 100);
					})
			);

			render(DigitalLibraryCard, { props: { item: mockItem, viewMode: 'grid' } });

			const descargarButton = screen.getAllByText('Descargar')[0].closest('button');
			fireEvent.click(descargarButton as HTMLButtonElement);

			await vi.waitFor(() => {
				expect(descargarButton).toHaveClass('disabled:opacity-50');
			});
		});
	});
});
