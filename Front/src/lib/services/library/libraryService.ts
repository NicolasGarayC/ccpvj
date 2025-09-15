import type { 
  LibraryResource, 
  CreateLibraryResourceDto, 
  LibraryResourceResponseDto,
  LibrarySearchFilters,
  LibraryStats 
} from '$lib/data/models/library';

class LibraryService {
  private baseURL = '/api/library';

  // Obtener todos los recursos con filtros opcionales
  async getAllResources(filters?: LibrarySearchFilters): Promise<LibraryResource[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              params.append(key, value.join(','));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      const response = await fetch(`${this.baseURL}?${params.toString()}`);
      const data: LibraryResourceResponseDto = await response.json();

      if (response.ok && data.success && Array.isArray(data.data)) {
        return data.data;
      }

      throw new Error(data.error || 'Error al cargar recursos');
    } catch (error) {
      console.error('Error fetching library resources:', error);
      // Retornar datos mock para desarrollo
      return this.getMockResources();
    }
  }

  // Obtener un recurso por ID
  async getResourceById(id: string): Promise<LibraryResource | null> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`);
      const data: LibraryResourceResponseDto = await response.json();

      if (response.ok && data.success && !Array.isArray(data.data)) {
        return data.data || null;
      }

      throw new Error(data.error || 'Recurso no encontrado');
    } catch (error) {
      console.error('Error fetching resource:', error);
      return null;
    }
  }

  // Crear nuevo recurso
  async createResource(resourceData: CreateLibraryResourceDto, file: File): Promise<LibraryResource> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('data', JSON.stringify(resourceData));

      const response = await fetch(`${this.baseURL}`, {
        method: 'POST',
        body: formData
      });

      const data: LibraryResourceResponseDto = await response.json();

      if (response.ok && data.success && !Array.isArray(data.data)) {
        return data.data!;
      }

      throw new Error(data.error || 'Error al crear recurso');
    } catch (error) {
      console.error('Error creating resource:', error);
      throw error;
    }
  }

  // Actualizar recurso
  async updateResource(id: string, resourceData: Partial<CreateLibraryResourceDto>): Promise<LibraryResource> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resourceData)
      });

      const data: LibraryResourceResponseDto = await response.json();

      if (response.ok && data.success && !Array.isArray(data.data)) {
        return data.data!;
      }

      throw new Error(data.error || 'Error al actualizar recurso');
    } catch (error) {
      console.error('Error updating resource:', error);
      throw error;
    }
  }

  // Eliminar recurso
  async deleteResource(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE'
      });

      const data: LibraryResourceResponseDto = await response.json();

      if (response.ok && data.success) {
        return true;
      }

      throw new Error(data.error || 'Error al eliminar recurso');
    } catch (error) {
      console.error('Error deleting resource:', error);
      return false;
    }
  }

  // Descargar recurso
  async downloadResource(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/${id}/download`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('filename') || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Error al descargar archivo');
      }
    } catch (error) {
      console.error('Error downloading resource:', error);
      throw error;
    }
  }

  // Obtener estadísticas
  async getStats(): Promise<LibraryStats> {
    try {
      const response = await fetch(`${this.baseURL}/stats`);
      const data = await response.json();

      if (response.ok && data.success) {
        return data.data;
      }

      throw new Error('Error al cargar estadísticas');
    } catch (error) {
      console.error('Error fetching stats:', error);
      return this.getMockStats();
    }
  }

  // Datos mock para desarrollo
  private getMockResources(): LibraryResource[] {
    return [];
  }

  private getMockStats(): LibraryStats {
    return {
      totalResources: 0,
      totalDownloads: 0,
      resourcesByType: {
        pdf: 0,
        video: 0,
        image: 0,
        audio: 0,
        document: 0
      },
      resourcesByCategory: {
        educacion: 0,
        cultura: 0,
        historia: 0,
        arte: 0,
        literatura: 0,
        ciencias: 0,
        otros: 0
      },
      popularResources: [],
      recentUploads: []
    };
  }
}

export const libraryService = new LibraryService();