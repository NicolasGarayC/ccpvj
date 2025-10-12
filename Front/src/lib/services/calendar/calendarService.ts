import { jwtService } from '../auth/jwtService';

// Local type definitions to replace schema imports
export interface Event {
	id: string;
	title: string;
	description?: string;
	startDateTime: Date;
	endDateTime?: Date;
	isAllDay: boolean;
	location?: string;
	eventType: string;
	isActive: boolean;
	isFeatured: boolean;
	maxAttendees?: number;
	currentAttendees: number;
	requiresRegistration: boolean;
	registrationDeadline?: Date;
	isRecurring: boolean;
	recurrencePattern?: string;
	recurrenceInterval?: number;
	recurrenceEndDate?: Date;
	recurrenceDaysOfWeek?: string;
	relatedProjectId?: string;
	relatedBlogPostId?: string;
	createdAt: Date;
	updatedAt?: Date;
	organizerId: string;
}

export interface EventRegistration {
	id: string;
	eventId: string;
	userId: string;
	registrationDate: Date;
	status: string;
}

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
}

export interface EventDetail extends EventSummary {
  isRecurring: boolean;
  recurrencePattern?: string;
  recurrenceInterval?: number;
  recurrenceEndDate?: Date;
  recurrenceDaysOfWeek?: string;
  relatedProjectId?: string;
  relatedBlogPostId?: string;
  relatedProjectTitle?: string;
  relatedBlogPostTitle?: string;
  relatedBlogPostSlug?: string;
  organizerName?: string;
  createdAt: Date;
  updatedAt?: Date;
  organizerId: string;
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
  isRecurring: boolean;
  recurrencePattern?: string;
  recurrenceInterval?: number;
  recurrenceEndDate?: Date;
  recurrenceDaysOfWeek?: string;
  relatedProjectId?: string | undefined;
  relatedBlogPostId?: string | undefined;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id: string;
}

export interface MonthViewEvent {
  id: string;
  title: string;
  startDateTime: Date;
  isAllDay: boolean;
  eventType: string;
  isFeatured: boolean;
}

export interface CalendarFilters {
  eventTypes: string[];
  isFeatured?: boolean;
  requiresRegistration?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface CalendarView {
  viewDate: Date;
  viewType: string;
  events: MonthViewEvent[];
}

export interface EventStats {
  totalEvents: number;
  upcomingEvents: number;
  featuredEvents: number;
  eventsWithRegistration: number;
}

export interface EventTypeStats {
  type: string;
  displayName: string;
  color: string;
  icon: string;
  count: number;
}

class CalendarService {
  private baseURL = 'http://localhost:5251/api';

  private async getRequestOptions(options: RequestInit = {}): Promise<RequestInit> {
    const token = jwtService.getToken();
    return {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {})
      },
      ...options
    };
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
      isFeatured: backendEvent.isFeatured
    };
  }

  async getUpcomingEvents(limit: number = 10): Promise<EventSummary[]> {
    try {
      const response = await fetch(`${this.baseURL}/calendar/upcoming?limit=${limit}`, await this.getRequestOptions());
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          return data.map(this.adaptBackendToFrontend);
        }
        return [];
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error('Error cargando eventos próximos:', error);
      throw error;
    }
  }

  async getAllEvents(): Promise<EventSummary[]> {
    try {
      const response = await fetch(`${this.baseURL}/calendar`, await this.getRequestOptions());
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          return data.map(this.adaptBackendToFrontend);
        }
        return [];
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error('Error cargando todos los eventos:', error);
      throw error;
    }
  }

  async getEventById(id: string): Promise<EventDetail | null> {
    try {
      const response = await fetch(`${this.baseURL}/calendar/${id}`, await this.getRequestOptions());
      if (response.ok) {
        const backendEvent = await response.json();
        return {
          ...this.adaptBackendToFrontend(backendEvent),
          isRecurring: backendEvent.isRecurring,
          recurrencePattern: backendEvent.recurrencePattern,
          recurrenceInterval: backendEvent.recurrenceInterval,
          recurrenceEndDate: backendEvent.recurrenceEndDate ? new Date(backendEvent.recurrenceEndDate) : undefined,
          recurrenceDaysOfWeek: backendEvent.recurrenceDaysOfWeek,
          relatedProjectId: backendEvent.relatedProjectId,
          relatedBlogPostId: backendEvent.relatedBlogPostId,
          relatedProjectTitle: backendEvent.relatedProjectTitle,
          relatedBlogPostTitle: backendEvent.relatedBlogPostTitle,
          relatedBlogPostSlug: backendEvent.relatedBlogPostSlug,
          organizerName: backendEvent.organizerName,
          createdAt: new Date(backendEvent.createdAt),
          updatedAt: backendEvent.updatedAt ? new Date(backendEvent.updatedAt) : undefined,
          organizerId: backendEvent.organizerId
        };
      }
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error('Error cargando evento por ID:', error);
      throw error;
    }
  }

  async getCalendarView(viewDate: Date, viewType: string = 'month'): Promise<CalendarView> {
    try {
      const formattedDate = viewDate.toISOString().split('T')[0];
      const response = await fetch(`${this.baseURL}/calendar/view?viewDate=${formattedDate}&viewType=${viewType}`, await this.getRequestOptions());

      if (response.ok) {
        const data = await response.json();
        return {
          viewDate: new Date(data.viewDate),
          viewType: data.viewType,
          events: data.events.map((event: any) => ({
            id: event.id,
            title: event.title,
            startDateTime: new Date(event.startDateTime),
            isAllDay: event.isAllDay,
            eventType: event.eventType,
            isFeatured: event.isFeatured
          }))
        };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error('Error cargando vista de calendario:', error);
      throw error;
    }
  }

  async getFeaturedEvents(limit: number = 5): Promise<EventSummary[]> {
    try {
      const response = await fetch(`${this.baseURL}/calendar/featured?limit=${limit}`, await this.getRequestOptions());
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          return data.map(this.adaptBackendToFrontend);
        }
        return [];
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error('Error cargando eventos destacados:', error);
      throw error;
    }
  }

  async createEvent(data: CreateEventData): Promise<EventDetail> {
    try {
      // Limpiar strings vacíos para campos opcionales de tipo GUID
      const cleanData = {
        ...data,
        relatedProjectId: data.relatedProjectId || undefined,
        relatedBlogPostId: data.relatedBlogPostId || undefined
      };

      const response = await fetch(`${this.baseURL}/calendar`, await this.getRequestOptions({
        method: 'POST',
        body: JSON.stringify(cleanData)
      }));

      if (response.ok) {
        const backendEvent = await response.json();
        return {
          ...this.adaptBackendToFrontend(backendEvent),
          isRecurring: backendEvent.isRecurring,
          recurrencePattern: backendEvent.recurrencePattern,
          recurrenceInterval: backendEvent.recurrenceInterval,
          recurrenceEndDate: backendEvent.recurrenceEndDate ? new Date(backendEvent.recurrenceEndDate) : undefined,
          recurrenceDaysOfWeek: backendEvent.recurrenceDaysOfWeek,
          relatedProjectId: backendEvent.relatedProjectId,
          relatedBlogPostId: backendEvent.relatedBlogPostId,
          createdAt: new Date(backendEvent.createdAt),
          updatedAt: backendEvent.updatedAt ? new Date(backendEvent.updatedAt) : undefined,
          organizerId: backendEvent.organizerId
        };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error('Error creando evento:', error);
      throw error;
    }
  }

  async updateEvent(data: UpdateEventData): Promise<EventDetail> {
    try {
      const response = await fetch(`${this.baseURL}/calendar/${data.id}`, await this.getRequestOptions({
        method: 'PUT',
        body: JSON.stringify(data)
      }));

      if (response.ok) {
        const backendEvent = await response.json();
        return {
          ...this.adaptBackendToFrontend(backendEvent),
          isRecurring: backendEvent.isRecurring,
          recurrencePattern: backendEvent.recurrencePattern,
          recurrenceInterval: backendEvent.recurrenceInterval,
          recurrenceEndDate: backendEvent.recurrenceEndDate ? new Date(backendEvent.recurrenceEndDate) : undefined,
          recurrenceDaysOfWeek: backendEvent.recurrenceDaysOfWeek,
          relatedProjectId: backendEvent.relatedProjectId,
          relatedBlogPostId: backendEvent.relatedBlogPostId,
          createdAt: new Date(backendEvent.createdAt),
          updatedAt: backendEvent.updatedAt ? new Date(backendEvent.updatedAt) : undefined,
          organizerId: backendEvent.organizerId
        };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error('Error actualizando evento:', error);
      throw error;
    }
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/calendar/${id}`, await this.getRequestOptions({
        method: 'DELETE'
      }));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error eliminando evento:', error);
      throw error;
    }
  }

  async getEventsByProject(projectId: string): Promise<EventSummary[]> {
    try {
      const response = await fetch(`${this.baseURL}/calendar/project/${projectId}`, await this.getRequestOptions());
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          return data.map(this.adaptBackendToFrontend);
        }
        return [];
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error('Error cargando eventos por proyecto:', error);
      throw error;
    }
  }

  async getEventsByBlogPost(blogPostId: string): Promise<EventSummary[]> {
    try {
      const response = await fetch(`${this.baseURL}/calendar/blog/${blogPostId}`, await this.getRequestOptions());
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          return data.map(this.adaptBackendToFrontend);
        }
        return [];
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error('Error cargando eventos por blog post:', error);
      throw error;
    }
  }


  async getEvent(eventId: string): Promise<EventDetail | null> {
    return this.getEventById(eventId);
  }
}

export const calendarService = new CalendarService();