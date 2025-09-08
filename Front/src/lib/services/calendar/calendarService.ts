import type { Event, EventRegistration } from '$lib/server/db/schema';

// Tipos TypeScript para el frontend
export interface EventSummary {
  id: string;
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime?: Date;
  isAllDay: boolean;
  location?: string;
  eventType: string;
  isFeatured: boolean;
  imagePath?: string;
  isRecurring: boolean;
  organizerName: string;
  relatedCourseId?: string;
  relatedCourseTitle?: string;
  relatedBlogPostId?: string;
  relatedBlogPostTitle?: string;
  relatedBlogPostSlug?: string;
}

export interface EventDetail extends EventSummary {
  isActive: boolean;
  maxAttendees?: number;
  currentAttendees: number;
  requiresRegistration: boolean;
  registrationDeadline?: Date;
  pdfPath?: string;
  recurrencePattern?: string;
  recurrenceInterval?: number;
  recurrenceEndDate?: Date;
  recurrenceDaysOfWeek?: string;
  createdAt: Date;
  updatedAt?: Date;
  organizerId: number;
}

export interface CreateEventData {
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime?: Date;
  isAllDay: boolean;
  location?: string;
  eventType: string;
  isFeatured: boolean;
  maxAttendees?: number;
  requiresRegistration: boolean;
  registrationDeadline?: Date;
  imagePath?: string;
  pdfPath?: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  recurrenceInterval?: number;
  recurrenceEndDate?: Date;
  recurrenceDaysOfWeek?: string;
  relatedCourseId?: string;
  relatedBlogPostId?: string;
}

export interface EventSearchParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  eventType?: string;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  isFeatured?: boolean;
  requiresRegistration?: boolean;
  relatedCourseId?: string;
  sortBy?: string;
}

export interface EventPagedResult {
  events: EventSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CalendarView {
  viewDate: Date;
  viewType: string;
  events: EventSummary[];
}

export interface EventType {
  type: string;
  displayName: string;
  color: string;
  icon: string;
  count: number;
}

class CalendarService {
  private isOnline = false;
  private baseURL = 'https://localhost:5251/api';
  private offlineEvents: EventSummary[] = [];

  constructor() {
    this.checkConnection();
    this.initializeOfflineData();
  }

  private async checkConnection() {
    try {
      const response = await fetch(`${this.baseURL}/calendar/upcoming?limit=1`, { 
        method: 'HEAD', 
        signal: AbortSignal.timeout(2000) 
      });
      this.isOnline = response.ok;
    } catch (error) {
      this.isOnline = false;
      console.log('Modo offline activado para calendario');
    }
  }

  private getAuthHeaders() {
    const token = sessionStorage.getItem('accessToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private adaptBackendToFrontend(backendEvent: any): EventSummary {
    return {
      id: backendEvent.id,
      title: backendEvent.title,
      description: backendEvent.description,
      startDateTime: new Date(backendEvent.startDateTime),
      endDateTime: backendEvent.endDateTime ? new Date(backendEvent.endDateTime) : undefined,
      isAllDay: backendEvent.isAllDay,
      location: backendEvent.location,
      eventType: backendEvent.eventType,
      isFeatured: backendEvent.isFeatured,
      imagePath: backendEvent.imagePath,
      isRecurring: backendEvent.isRecurring,
      organizerName: backendEvent.organizerName,
      relatedCourseId: backendEvent.relatedCourseId,
      relatedCourseTitle: backendEvent.relatedCourseTitle,
      relatedBlogPostId: backendEvent.relatedBlogPostId,
      relatedBlogPostTitle: backendEvent.relatedBlogPostTitle,
      relatedBlogPostSlug: backendEvent.relatedBlogPostSlug
    };
  }

  private adaptBackendToDetail(backendEvent: any): EventDetail {
    return {
      ...this.adaptBackendToFrontend(backendEvent),
      isActive: backendEvent.isActive,
      maxAttendees: backendEvent.maxAttendees,
      currentAttendees: backendEvent.currentAttendees,
      requiresRegistration: backendEvent.requiresRegistration,
      registrationDeadline: backendEvent.registrationDeadline ? new Date(backendEvent.registrationDeadline) : undefined,
      pdfPath: backendEvent.pdfPath,
      recurrencePattern: backendEvent.recurrencePattern,
      recurrenceInterval: backendEvent.recurrenceInterval,
      recurrenceEndDate: backendEvent.recurrenceEndDate ? new Date(backendEvent.recurrenceEndDate) : undefined,
      recurrenceDaysOfWeek: backendEvent.recurrenceDaysOfWeek,
      createdAt: new Date(backendEvent.createdAt),
      updatedAt: backendEvent.updatedAt ? new Date(backendEvent.updatedAt) : undefined,
      organizerId: backendEvent.organizerId
    };
  }

  private initializeOfflineData() {
    // Datos de ejemplo para modo offline
    this.offlineEvents = [
      {
        id: '1',
        title: 'Clase Preuniversitario - Matemáticas',
        description: 'Clase de matemáticas del curso preuniversitario',
        startDateTime: new Date(Date.now() + 86400000), // mañana
        endDateTime: new Date(Date.now() + 86400000 + 7200000), // +2 horas
        isAllDay: false,
        location: 'Aula 1',
        eventType: 'Clase',
        isFeatured: true,
        isRecurring: true,
        organizerName: 'Prof. García',
        relatedCourseId: 'course-1',
        relatedCourseTitle: 'Preuniversitario'
      },
      {
        id: '2',
        title: 'Taller de Escritura Creativa',
        description: 'Taller comunitario de escritura creativa',
        startDateTime: new Date(Date.now() + 172800000), // pasado mañana
        endDateTime: new Date(Date.now() + 172800000 + 10800000), // +3 horas
        isAllDay: false,
        location: 'Sala Principal',
        eventType: 'Taller',
        isFeatured: false,
        isRecurring: false,
        organizerName: 'Ana López'
      }
    ];
  }

  // Obtener evento por ID
  async getEvent(id: string): Promise<EventDetail | null> {
    if (!this.isOnline) {
      const event = this.offlineEvents.find(e => e.id === id);
      return event ? { ...event, isActive: true, currentAttendees: 0, requiresRegistration: false, createdAt: new Date(), organizerId: 1 } as EventDetail : null;
    }

    try {
      const response = await fetch(`${this.baseURL}/calendar/${id}`, {
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() }
      });

      if (!response.ok) return null;

      const data = await response.json();
      return this.adaptBackendToDetail(data);
    } catch (error) {
      console.error('Error al obtener evento:', error);
      return null;
    }
  }

  // Obtener eventos con filtros y paginación
  async getEvents(params: EventSearchParams = {}): Promise<EventPagedResult> {
    if (!this.isOnline) {
      let filteredEvents = [...this.offlineEvents];
      
      if (params.searchTerm) {
        filteredEvents = filteredEvents.filter(event => 
          event.title.toLowerCase().includes(params.searchTerm!.toLowerCase()) ||
          (event.description && event.description.toLowerCase().includes(params.searchTerm!.toLowerCase()))
        );
      }

      if (params.eventType) {
        filteredEvents = filteredEvents.filter(event => event.eventType === params.eventType);
      }

      if (params.isFeatured !== undefined) {
        filteredEvents = filteredEvents.filter(event => event.isFeatured === params.isFeatured);
      }

      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      const totalCount = filteredEvents.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedEvents = filteredEvents.slice(startIndex, startIndex + pageSize);

      return {
        events: paginatedEvents,
        totalCount,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      };
    }

    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`${this.baseURL}/calendar?${queryParams}`, {
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() }
      });

      if (!response.ok) throw new Error('Error al obtener eventos');

      const data = await response.json();
      return {
        events: data.events.map((event: any) => this.adaptBackendToFrontend(event)),
        totalCount: data.totalCount,
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
        hasNextPage: data.hasNextPage,
        hasPreviousPage: data.hasPreviousPage
      };
    } catch (error) {
      console.error('Error al obtener eventos:', error);
      throw error;
    }
  }

  // Obtener vista de calendario
  async getCalendarView(viewDate: Date, viewType: string = 'month'): Promise<CalendarView> {
    if (!this.isOnline) {
      return {
        viewDate,
        viewType,
        events: this.offlineEvents
      };
    }

    try {
      const response = await fetch(`${this.baseURL}/calendar/calendar-view?viewDate=${viewDate.toISOString()}&viewType=${viewType}`, {
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() }
      });

      if (!response.ok) throw new Error('Error al obtener vista de calendario');

      const data = await response.json();
      return {
        viewDate: new Date(data.viewDate),
        viewType: data.viewType,
        events: data.events.map((event: any) => this.adaptBackendToFrontend(event))
      };
    } catch (error) {
      console.error('Error al obtener vista de calendario:', error);
      throw error;
    }
  }

  // Crear evento
  async createEvent(eventData: CreateEventData): Promise<EventDetail> {
    if (!this.isOnline) {
      throw new Error('No se puede crear evento en modo offline');
    }

    try {
      const response = await fetch(`${this.baseURL}/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify({
          ...eventData,
          startDateTime: eventData.startDateTime.toISOString(),
          endDateTime: eventData.endDateTime?.toISOString(),
          registrationDeadline: eventData.registrationDeadline?.toISOString(),
          recurrenceEndDate: eventData.recurrenceEndDate?.toISOString()
        })
      });

      if (!response.ok) throw new Error('Error al crear evento');

      const data = await response.json();
      return this.adaptBackendToDetail(data);
    } catch (error) {
      console.error('Error al crear evento:', error);
      throw error;
    }
  }

  // Actualizar evento
  async updateEvent(id: string, eventData: Partial<CreateEventData>): Promise<EventDetail> {
    if (!this.isOnline) {
      throw new Error('No se puede actualizar evento en modo offline');
    }

    try {
      const body = { ...eventData };
      if (eventData.startDateTime) body.startDateTime = eventData.startDateTime.toISOString() as any;
      if (eventData.endDateTime) body.endDateTime = eventData.endDateTime.toISOString() as any;
      if (eventData.registrationDeadline) body.registrationDeadline = eventData.registrationDeadline.toISOString() as any;
      if (eventData.recurrenceEndDate) body.recurrenceEndDate = eventData.recurrenceEndDate.toISOString() as any;

      const response = await fetch(`${this.baseURL}/calendar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Error al actualizar evento');

      const data = await response.json();
      return this.adaptBackendToDetail(data);
    } catch (error) {
      console.error('Error al actualizar evento:', error);
      throw error;
    }
  }

  // Eliminar evento
  async deleteEvent(id: string): Promise<boolean> {
    if (!this.isOnline) {
      throw new Error('No se puede eliminar evento en modo offline');
    }

    try {
      const response = await fetch(`${this.baseURL}/calendar/${id}`, {
        method: 'DELETE',
        headers: { ...this.getAuthHeaders() }
      });

      return response.ok;
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      throw error;
    }
  }

  // Obtener eventos próximos
  async getUpcomingEvents(limit: number = 10): Promise<EventSummary[]> {
    if (!this.isOnline) {
      return this.offlineEvents
        .filter(event => event.startDateTime > new Date())
        .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime())
        .slice(0, limit);
    }

    try {
      const response = await fetch(`${this.baseURL}/calendar/upcoming?limit=${limit}`, {
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() }
      });

      if (!response.ok) throw new Error('Error al obtener eventos próximos');

      const data = await response.json();
      return data.map((event: any) => this.adaptBackendToFrontend(event));
    } catch (error) {
      console.error('Error al obtener eventos próximos:', error);
      throw error;
    }
  }

  // Obtener eventos destacados
  async getFeaturedEvents(limit: number = 5): Promise<EventSummary[]> {
    if (!this.isOnline) {
      return this.offlineEvents
        .filter(event => event.isFeatured)
        .slice(0, limit);
    }

    try {
      const response = await fetch(`${this.baseURL}/calendar/featured?limit=${limit}`, {
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() }
      });

      if (!response.ok) throw new Error('Error al obtener eventos destacados');

      const data = await response.json();
      return data.map((event: any) => this.adaptBackendToFrontend(event));
    } catch (error) {
      console.error('Error al obtener eventos destacados:', error);
      throw error;
    }
  }

  // Obtener tipos de eventos
  async getEventTypes(): Promise<EventType[]> {
    if (!this.isOnline) {
      return [
        { type: 'Clase', displayName: 'Clase', color: '#3B82F6', icon: 'academic-cap', count: 1 },
        { type: 'Taller', displayName: 'Taller', color: '#10B981', icon: 'wrench-screwdriver', count: 1 },
        { type: 'Evento', displayName: 'Evento', color: '#F59E0B', icon: 'calendar-days', count: 0 }
      ];
    }

    try {
      const response = await fetch(`${this.baseURL}/calendar/types`, {
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() }
      });

      if (!response.ok) throw new Error('Error al obtener tipos de eventos');

      return await response.json();
    } catch (error) {
      console.error('Error al obtener tipos de eventos:', error);
      throw error;
    }
  }

  // Obtener eventos por curso
  async getEventsByCourse(courseId: string): Promise<EventSummary[]> {
    if (!this.isOnline) {
      return this.offlineEvents.filter(event => event.relatedCourseId === courseId);
    }

    try {
      const response = await fetch(`${this.baseURL}/calendar/course/${courseId}`, {
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() }
      });

      if (!response.ok) throw new Error('Error al obtener eventos del curso');

      const data = await response.json();
      return data.map((event: any) => this.adaptBackendToFrontend(event));
    } catch (error) {
      console.error('Error al obtener eventos del curso:', error);
      throw error;
    }
  }

  // Obtener eventos por post de blog
  async getEventsByBlogPost(blogPostId: string): Promise<EventSummary[]> {
    if (!this.isOnline) {
      return this.offlineEvents.filter(event => event.relatedBlogPostId === blogPostId);
    }

    try {
      const response = await fetch(`${this.baseURL}/calendar/blog/${blogPostId}`, {
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() }
      });

      if (!response.ok) throw new Error('Error al obtener eventos del blog post');

      const data = await response.json();
      return data.map((event: any) => this.adaptBackendToFrontend(event));
    } catch (error) {
      console.error('Error al obtener eventos del blog post:', error);
      throw error;
    }
  }

  // Registrarse a un evento
  async registerToEvent(eventId: string): Promise<boolean> {
    if (!this.isOnline) {
      throw new Error('No se puede registrar a evento en modo offline');
    }

    try {
      const response = await fetch(`${this.baseURL}/calendar/${eventId}/register`, {
        method: 'POST',
        headers: { ...this.getAuthHeaders() }
      });

      return response.ok;
    } catch (error) {
      console.error('Error al registrarse al evento:', error);
      throw error;
    }
  }

  // Desregistrarse de un evento
  async unregisterFromEvent(eventId: string): Promise<boolean> {
    if (!this.isOnline) {
      throw new Error('No se puede desregistrar de evento en modo offline');
    }

    try {
      const response = await fetch(`${this.baseURL}/calendar/${eventId}/unregister`, {
        method: 'POST',
        headers: { ...this.getAuthHeaders() }
      });

      return response.ok;
    } catch (error) {
      console.error('Error al desregistrarse del evento:', error);
      throw error;
    }
  }

  // Obtener mis registraciones
  async getMyRegisteredEvents(): Promise<EventSummary[]> {
    if (!this.isOnline) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseURL}/calendar/my-registrations`, {
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() }
      });

      if (!response.ok) throw new Error('Error al obtener eventos registrados');

      const data = await response.json();
      return data.map((event: any) => this.adaptBackendToFrontend(event));
    } catch (error) {
      console.error('Error al obtener eventos registrados:', error);
      throw error;
    }
  }
}

export const calendarService = new CalendarService();