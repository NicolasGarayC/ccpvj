import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import DigitalLibraryFilters from '../DigitalLibraryFilters.svelte';
import type { LibrarySearchDto } from '$lib/services/digitalLibraryService';

// Mock i18n
vi.mock('$lib/i18n', () => ({
	t: {
		subscribe: (fn: any) => {
			fn((key: string) => {
				const translations: Record<string, string> = {
					'filters.title': 'Filtros',
					'filters.active': 'activos',
					'filters.clearAll': 'Limpiar todo',
					'filters.show': 'Mostrar',
					'filters.hide': 'Ocultar',
					'filters.activeFilters': 'Filtros activos',
					'filters.fileType': 'Tipo de archivo',
					'filters.category': 'Categoría',
					'filters.author': 'Autor',
					'filters.language': 'Idioma',
					'filters.year': 'Año',
					'filters.tags': 'Etiquetas',
					'filters.allAuthors': 'Todos los autores',
					'filters.allLanguages': 'Todos los idiomas',
					'filters.allYears': 'Todos los años',
					'filters.noTags': 'No hay etiquetas disponibles',
					'filters.fileType.image': 'Imagen',
					'filters.fileType.video': 'Video',
					'filters.fileType.audio': 'Audio',
					'filters.fileType.document': 'Documento',
					'filters.category.victorJara': 'Víctor Jara',
					'filters.category.nuevaCancion': 'Nueva Canción',
					'filters.category.educacionPopular': 'Educación Popular',
					'filters.category.memoriaHistorica': 'Memoria Histórica',
					'filters.category.talleresEventos': 'Talleres y Eventos',
					'filters.category.archivoPrensa': 'Archivo de Prensa',
					'filters.category.audiovisual': 'Audiovisual',
					'filters.category.literatura': 'Literatura',
					'filters.category.general': 'General'
				};
				return translations[key] || key;
			});
			return () => {};
		}
	},
	translate: vi.fn((key: string) => {
		const translations: Record<string, string> = {
			'filters.fileType.image': 'Imagen',
			'filters.fileType.video': 'Video',
			'filters.fileType.audio': 'Audio',
			'filters.fileType.document': 'Documento',
			'filters.category.victorJara': 'Víctor Jara',
			'filters.category.nuevaCancion': 'Nueva Canción',
			'filters.category.educacionPopular': 'Educación Popular',
			'filters.category.memoriaHistorica': 'Memoria Histórica',
			'filters.category.talleresEventos': 'Talleres y Eventos',
			'filters.category.archivoPrensa': 'Archivo de Prensa',
			'filters.category.audiovisual': 'Audiovisual',
			'filters.category.literatura': 'Literatura',
			'filters.category.general': 'General'
		};
		return translations[key] || key;
	})
}));

// Mock digital library service
vi.mock('$lib/services/digitalLibraryService', () => ({
	digitalLibraryService: {
		getAvailableCategories: vi.fn(() =>
			Promise.resolve(['victor-jara', 'nueva-cancion', 'educacion-popular'])
		),
		getAvailableAuthors: vi.fn(() =>
			Promise.resolve(['Víctor Jara', 'Violeta Parra', 'Patricio Manns'])
		),
		getAvailableTags: vi.fn(() => Promise.resolve(['música', 'folklore', 'historia'])),
		getAvailableLanguages: vi.fn(() => Promise.resolve(['es', 'en', 'fr'])),
		getAvailableYears: vi.fn(() => Promise.resolve([2024, 2023, 2022, 2021, 2020]))
	}
}));

describe('DigitalLibraryFilters', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ================================================================
	// RENDERING
	// ================================================================

	describe('Rendering', () => {
		it('should render filters component with title', async () => {
			render(DigitalLibraryFilters, { props: { currentFilters: {} } });

			await waitFor(() => {
				expect(screen.getByText('Filtros')).toBeInTheDocument();
			});
		});

		it('should display toggle button to show filters', () => {
			render(DigitalLibraryFilters, { props: { currentFilters: {} } });

			expect(screen.getByText(/Mostrar/i)).toBeInTheDocument();
		});

		it('should display filter count badge when filters are active', () => {
			const filters: LibrarySearchDto = {
				fileType: 'audio',
				category: 'victor-jara'
			};

			render(DigitalLibraryFilters, { props: { currentFilters: filters } });

			expect(screen.getByText(/2.*activos/i)).toBeInTheDocument();
		});

		it('should not display filter count badge when no filters active', () => {
			render(DigitalLibraryFilters, { props: { currentFilters: {} } });

			expect(screen.queryByText(/activos/i)).not.toBeInTheDocument();
		});

		it('should display clear all button when filters are active', () => {
			const filters: LibrarySearchDto = {
				fileType: 'audio'
			};

			render(DigitalLibraryFilters, { props: { currentFilters: filters } });

			expect(screen.getByText('Limpiar todo')).toBeInTheDocument();
		});

		it('should not display clear all button when no filters active', () => {
			render(DigitalLibraryFilters, { props: { currentFilters: {} } });

			expect(screen.queryByText('Limpiar todo')).not.toBeInTheDocument();
		});
	});

	// ================================================================
	// TOGGLE FILTERS PANEL
	// ================================================================

	describe('Toggle Filters Panel', () => {
		it('should hide filters panel by default', () => {
			render(DigitalLibraryFilters, { props: { currentFilters: {} } });

			expect(screen.queryByText(/Tipo de archivo/i)).not.toBeInTheDocument();
		});

		it('should show filters panel when toggle button is clicked', async () => {
			render(DigitalLibraryFilters, { props: { currentFilters: {} } });

			const toggleButton = screen.getByText(/Mostrar.*Filtros/i);
			await fireEvent.click(toggleButton);

			await waitFor(() => {
				expect(screen.getByText(/Tipo de archivo/i)).toBeInTheDocument();
			});
		});

		it('should hide filters panel when toggle button is clicked again', async () => {
			render(DigitalLibraryFilters, { props: { currentFilters: {} } });

			const toggleButton = screen.getByText(/Mostrar/i);
			await fireEvent.click(toggleButton);

			await waitFor(() => {
				expect(screen.getByText(/Tipo de archivo/i)).toBeInTheDocument();
			});

			await fireEvent.click(screen.getByText(/Ocultar/i));

			await waitFor(() => {
				expect(screen.queryByText(/Tipo de archivo/i)).not.toBeInTheDocument();
			});
		});
	});

	// ================================================================
	// ACTIVE FILTERS DISPLAY
	// ================================================================

	describe('Active Filters Display', () => {
		it('should display active fileType filter', () => {
			const filters: LibrarySearchDto = {
				fileType: 'audio'
			};

			render(DigitalLibraryFilters, { props: { currentFilters: filters } });

			expect(screen.getByText(/Tipo de archivo: Audio/i)).toBeInTheDocument();
		});

		it('should display active category filter', () => {
			const filters: LibrarySearchDto = {
				category: 'victor-jara'
			};

			render(DigitalLibraryFilters, { props: { currentFilters: filters } });

			expect(screen.getByText(/Categoría:.*Víctor Jara/i)).toBeInTheDocument();
		});

		it('should display active author filter', () => {
			const filters: LibrarySearchDto = {
				author: 'Víctor Jara'
			};

			render(DigitalLibraryFilters, { props: { currentFilters: filters } });

			expect(screen.getByText(/Autor: Víctor Jara/i)).toBeInTheDocument();
		});

		it('should display active language filter', () => {
			const filters: LibrarySearchDto = {
				language: 'es'
			};

			render(DigitalLibraryFilters, { props: { currentFilters: filters } });

			expect(screen.getByText(/Idioma: es/i)).toBeInTheDocument();
		});

		it('should display active year filter', () => {
			const filters: LibrarySearchDto = {
				publishYear: 2023
			};

			render(DigitalLibraryFilters, { props: { currentFilters: filters } });

			expect(screen.getByText(/Año: 2023/i)).toBeInTheDocument();
		});

		it('should display active tags filters', () => {
			const filters: LibrarySearchDto = {
				tags: ['música', 'folklore']
			};

			render(DigitalLibraryFilters, { props: { currentFilters: filters } });

			expect(screen.getByText('música')).toBeInTheDocument();
			expect(screen.getByText('folklore')).toBeInTheDocument();
		});

		it('should display multiple active filters', () => {
			const filters: LibrarySearchDto = {
				fileType: 'audio',
				category: 'victor-jara',
				author: 'Víctor Jara',
				tags: ['música']
			};

			render(DigitalLibraryFilters, { props: { currentFilters: filters } });

			expect(screen.getByText(/4.*activos/i)).toBeInTheDocument();
		});
	});

	// ================================================================
	// FILTER OPTIONS LOADING
	// ================================================================

	describe('Filter Options Loading', () => {
		it('should load available categories on mount', async () => {
			const { digitalLibraryService } = await import('$lib/services/digitalLibraryService');

			render(DigitalLibraryFilters, { props: { currentFilters: {} } });

			await waitFor(() => {
				expect(digitalLibraryService.getAvailableCategories).toHaveBeenCalled();
			});
		});

		it('should load available authors on mount', async () => {
			const { digitalLibraryService } = await import('$lib/services/digitalLibraryService');

			render(DigitalLibraryFilters, { props: { currentFilters: {} } });

			await waitFor(() => {
				expect(digitalLibraryService.getAvailableAuthors).toHaveBeenCalled();
			});
		});

		it('should load available tags on mount', async () => {
			const { digitalLibraryService } = await import('$lib/services/digitalLibraryService');

			render(DigitalLibraryFilters, { props: { currentFilters: {} } });

			await waitFor(() => {
				expect(digitalLibraryService.getAvailableTags).toHaveBeenCalled();
			});
		});

		it('should load available languages on mount', async () => {
			const { digitalLibraryService } = await import('$lib/services/digitalLibraryService');

			render(DigitalLibraryFilters, { props: { currentFilters: {} } });

			await waitFor(() => {
				expect(digitalLibraryService.getAvailableLanguages).toHaveBeenCalled();
			});
		});

		it('should load available years on mount', async () => {
			const { digitalLibraryService } = await import('$lib/services/digitalLibraryService');

			render(DigitalLibraryFilters, { props: { currentFilters: {} } });

			await waitFor(() => {
				expect(digitalLibraryService.getAvailableYears).toHaveBeenCalled();
			});
		});
	});

	// ================================================================
	// FILTER SELECTION
	// ================================================================

	describe('Filter Selection', () => {
		it('should dispatch filtersChange event when fileType is selected', async () => {
			const { component } = render(DigitalLibraryFilters, { props: { currentFilters: {} } });

			const filtersChangeHandler = vi.fn();
			component.$on('filtersChange', filtersChangeHandler);

			// Open filters panel
			await fireEvent.click(screen.getByText(/Mostrar/i));

			await waitFor(() => {
				expect(screen.getByText('Imagen')).toBeInTheDocument();
			});

			// Select audio fileType (using parent div since radio is sr-only)
			const audioOption = screen.getByText('Audio').closest('div');
			await fireEvent.click(audioOption!);

			await waitFor(() => {
				expect(filtersChangeHandler).toHaveBeenCalled();
			});
		});

		it('should dispatch filtersChange event when author is selected', async () => {
			const { component } = render(DigitalLibraryFilters, { props: { currentFilters: {} } });

			const filtersChangeHandler = vi.fn();
			component.$on('filtersChange', filtersChangeHandler);

			// Open filters panel
			await fireEvent.click(screen.getByText(/Mostrar/i));

			await waitFor(() => {
				const authorSelect = screen.getByLabelText(/Autor/i) as HTMLSelectElement;
				expect(authorSelect).toBeInTheDocument();
			});

			const authorSelect = screen.getAllByRole('combobox').find(
				(el) => el.previousElementSibling?.textContent?.includes('Autor')
			) as HTMLSelectElement;

			if (authorSelect) {
				await fireEvent.change(authorSelect, { target: { value: 'Víctor Jara' } });

				await waitFor(() => {
					expect(filtersChangeHandler).toHaveBeenCalled();
				});
			}
		});

		it('should handle tag toggle', async () => {
			const { component } = render(DigitalLibraryFilters, { props: { currentFilters: {} } });

			const filtersChangeHandler = vi.fn();
			component.$on('filtersChange', filtersChangeHandler);

			// Open filters panel
			await fireEvent.click(screen.getByText(/Mostrar/i));

			await waitFor(() => {
				const musicaTag = screen.getByText('música').closest('label');
				expect(musicaTag).toBeInTheDocument();
			});

			// Click on tag
			const musicaTag = screen.getByText('música').closest('label');
			await fireEvent.click(musicaTag!);

			await waitFor(() => {
				expect(filtersChangeHandler).toHaveBeenCalled();
				const event = filtersChangeHandler.mock.calls[0][0];
				expect(event.detail.tags).toContain('música');
			});
		});
	});

	// ================================================================
	// REMOVE FILTERS
	// ================================================================

	describe('Remove Filters', () => {
		it('should remove fileType filter when X button is clicked', async () => {
			const filters: LibrarySearchDto = {
				fileType: 'audio'
			};

			const { component } = render(DigitalLibraryFilters, { props: { currentFilters: filters } });

			const filtersChangeHandler = vi.fn();
			component.$on('filtersChange', filtersChangeHandler);

			const removeButton = screen.getByText('✕');
			await fireEvent.click(removeButton);

			await waitFor(() => {
				expect(filtersChangeHandler).toHaveBeenCalled();
				const event = filtersChangeHandler.mock.calls[0][0];
				expect(event.detail.fileType).toBeUndefined();
			});
		});

		it('should remove category filter when X button is clicked', async () => {
			const filters: LibrarySearchDto = {
				category: 'victor-jara'
			};

			const { component } = render(DigitalLibraryFilters, { props: { currentFilters: filters } });

			const filtersChangeHandler = vi.fn();
			component.$on('filtersChange', filtersChangeHandler);

			const removeButton = screen.getByText('✕');
			await fireEvent.click(removeButton);

			await waitFor(() => {
				expect(filtersChangeHandler).toHaveBeenCalled();
			});
		});

		it('should remove tag when clicked', async () => {
			const filters: LibrarySearchDto = {
				tags: ['música', 'folklore']
			};

			const { component } = render(DigitalLibraryFilters, { props: { currentFilters: filters } });

			const filtersChangeHandler = vi.fn();
			component.$on('filtersChange', filtersChangeHandler);

			// Find and click the X button for 'música'
			const musicaRemoveButton = screen.getAllByText('✕')[0];
			await fireEvent.click(musicaRemoveButton);

			await waitFor(() => {
				expect(filtersChangeHandler).toHaveBeenCalled();
			});
		});
	});

	// ================================================================
	// CLEAR ALL FILTERS
	// ================================================================

	describe('Clear All Filters', () => {
		it('should clear all filters when clear all button is clicked', async () => {
			const filters: LibrarySearchDto = {
				fileType: 'audio',
				category: 'victor-jara',
				author: 'Víctor Jara',
				tags: ['música']
			};

			const { component } = render(DigitalLibraryFilters, { props: { currentFilters: filters } });

			const filtersChangeHandler = vi.fn();
			component.$on('filtersChange', filtersChangeHandler);

			const clearButton = screen.getByText('Limpiar todo');
			await fireEvent.click(clearButton);

			await waitFor(() => {
				expect(filtersChangeHandler).toHaveBeenCalled();
				const event = filtersChangeHandler.mock.calls[0][0];
				expect(Object.keys(event.detail)).toHaveLength(0);
			});
		});

		it('should hide clear all button after clearing filters', async () => {
			const filters: LibrarySearchDto = {
				fileType: 'audio'
			};

			render(DigitalLibraryFilters, { props: { currentFilters: filters } });

			const clearButton = screen.getByText('Limpiar todo');
			await fireEvent.click(clearButton);

			await waitFor(() => {
				expect(screen.queryByText('Limpiar todo')).not.toBeInTheDocument();
			});
		});

		it('should hide filter count badge after clearing', async () => {
			const filters: LibrarySearchDto = {
				fileType: 'audio',
				category: 'victor-jara'
			};

			render(DigitalLibraryFilters, { props: { currentFilters: filters } });

			expect(screen.getByText(/2.*activos/i)).toBeInTheDocument();

			const clearButton = screen.getByText('Limpiar todo');
			await fireEvent.click(clearButton);

			await waitFor(() => {
				expect(screen.queryByText(/activos/i)).not.toBeInTheDocument();
			});
		});
	});

	// ================================================================
	// FILTER COUNT
	// ================================================================

	describe('Filter Count', () => {
		it('should count single filter', () => {
			const filters: LibrarySearchDto = {
				fileType: 'audio'
			};

			render(DigitalLibraryFilters, { props: { currentFilters: filters } });

			expect(screen.getByText(/1.*activos/i)).toBeInTheDocument();
		});

		it('should count multiple filters', () => {
			const filters: LibrarySearchDto = {
				fileType: 'audio',
				category: 'victor-jara',
				author: 'Víctor Jara'
			};

			render(DigitalLibraryFilters, { props: { currentFilters: filters } });

			expect(screen.getByText(/3.*activos/i)).toBeInTheDocument();
		});

		it('should not count empty string values', () => {
			const filters: LibrarySearchDto = {
				fileType: 'audio',
				author: ''
			};

			render(DigitalLibraryFilters, { props: { currentFilters: filters } });

			expect(screen.getByText(/1.*activos/i)).toBeInTheDocument();
		});

		it('should not count empty arrays', () => {
			const filters: LibrarySearchDto = {
				fileType: 'audio',
				tags: []
			};

			render(DigitalLibraryFilters, { props: { currentFilters: filters } });

			expect(screen.getByText(/1.*activos/i)).toBeInTheDocument();
		});
	});

	// ================================================================
	// EDGE CASES
	// ================================================================

	describe('Edge Cases', () => {
		it('should handle loading error gracefully', async () => {
			const { digitalLibraryService } = await import('$lib/services/digitalLibraryService');
			(digitalLibraryService.getAvailableCategories as any).mockRejectedValueOnce(
				new Error('Network error')
			);

			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			render(DigitalLibraryFilters, { props: { currentFilters: {} } });

			await waitFor(() => {
				expect(consoleErrorSpy).toHaveBeenCalled();
			});

			consoleErrorSpy.mockRestore();
		});

		it('should handle empty available options', async () => {
			const { digitalLibraryService } = await import('$lib/services/digitalLibraryService');
			(digitalLibraryService.getAvailableTags as any).mockResolvedValueOnce([]);

			render(DigitalLibraryFilters, { props: { currentFilters: {} } });

			// Open filters
			await fireEvent.click(screen.getByText(/Mostrar/i));

			await waitFor(() => {
				expect(screen.getByText('No hay etiquetas disponibles')).toBeInTheDocument();
			});
		});

		it('should handle years in descending order', async () => {
			render(DigitalLibraryFilters, { props: { currentFilters: {} } });

			// Open filters
			await fireEvent.click(screen.getByText(/Mostrar/i));

			await waitFor(() => {
				const yearSelect = screen.getAllByRole('combobox').find(
					(el) => el.previousElementSibling?.textContent?.includes('Año')
				) as HTMLSelectElement;

				expect(yearSelect).toBeInTheDocument();

				// Years should be sorted descending (2024, 2023, 2022, etc.)
				const options = Array.from(yearSelect.options)
					.slice(1)
					.map((opt) => parseInt(opt.value));
				expect(options[0]).toBeGreaterThan(options[options.length - 1]);
			});
		});
	});
});
