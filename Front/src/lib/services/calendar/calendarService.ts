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
	imagePath?: string;
	pdfPath?: string;
	isRecurring: boolean;
	recurrencePattern?: string;
	recurrenceInterval?: number;
	recurrenceEndDate?: Date;
	recurrenceDaysOfWeek?: string;
	relatedCourseId?: string;
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
  imagePath?: string;
  requiresRegistration: boolean;
  maxAttendees?: number;
  currentAttendees: number;
  registrationDeadline?: Date;
}

export interface EventDetail extends EventSummary {
  pdfPath?: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  recurrenceInterval?: number;
  recurrenceEndDate?: Date;
  recurrenceDaysOfWeek?: string;
  relatedCourseId?: string;
  relatedBlogPostId?: string;
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

  // TODO: Add JWT Bearer token when implemented
  private getRequestOptions(options: RequestInit = {}): RequestInit {
    return {
      // TODO: Add JWT Bearer token when implemented
      headers: {
        'Content-Type': 'application/json',
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
      isFeatured: backendEvent.isFeatured,
      imagePath: backendEvent.imagePath,
      requiresRegistration: backendEvent.requiresRegistration,
      maxAttendees: backendEvent.maxAttendees,
      currentAttendees: backendEvent.currentAttendees || 0,
      registrationDeadline: backendEvent.registrationDeadline ? new Date(backendEvent.registrationDeadline) : undefined
    };
  }

  async getUpcomingEvents(limit: number = 10): Promise<EventSummary[]> {
    try {
      const response = await fetch(`${this.baseURL}/calendar/upcoming?limit=${limit}`, this.getRequestOptions());
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
      const response = await fetch(`${this.baseURL}/calendar`, this.getRequestOptions());
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
      const response = await fetch(`${this.baseURL}/calendar/${id}`, this.getRequestOptions());
      if (response.ok) {
        const backendEvent = await response.json();
        return {
          ...this.adaptBackendToFrontend(backendEvent),
          pdfPath: backendEvent.pdfPath,
          isRecurring: backendEvent.isRecurring,
          recurrencePattern: backendEvent.recurrencePattern,
          recurrenceInterval: backendEvent.recurrenceInterval,
          recurrenceEndDate: backendEvent.recurrenceEndDate ? new Date(backendEvent.recurrenceEndDate) : undefined,
          recurrenceDaysOfWeek: backendEvent.recurrenceDaysOfWeek,
          relatedCourseId: backendEvent.relatedCourseId,
          relatedBlogPostId: backendEvent.relatedBlogPostId,
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

  async getEventsByBlogPost(blogPostId: string): Promise<EventSummary[]> {
    try {
      const response = await fetch(`${this.baseURL}/calendar/blog/${blogPostId}`, this.getRequestOptions());
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

  async createEvent(data: CreateEventData): Promise<EventDetail> {
    try {
      const response = await fetch(`${this.baseURL}/calendar`, this.getRequestOptions({
        method: 'POST',
        body: JSON.stringify(data)
      }));

      if (response.ok) {
        const backendEvent = await response.json();
        return {
          ...this.adaptBackendToFrontend(backendEvent),
          pdfPath: backendEvent.pdfPath,
          isRecurring: backendEvent.isRecurring,
          recurrencePattern: backendEvent.recurrencePattern,
          recurrenceInterval: backendEvent.recurrenceInterval,
          recurrenceEndDate: backendEvent.recurrenceEndDate ? new Date(backendEvent.recurrenceEndDate) : undefined,
          recurrenceDaysOfWeek: backendEvent.recurrenceDaysOfWeek,
          relatedCourseId: backendEvent.relatedCourseId,
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
      const response = await fetch(`${this.baseURL}/calendar/${data.id}`, this.getRequestOptions({
        method: 'PUT',
        body: JSON.stringify(data)
      }));

      if (response.ok) {
        const backendEvent = await response.json();
        return {
          ...this.adaptBackendToFrontend(backendEvent),
          pdfPath: backendEvent.pdfPath,
          isRecurring: backendEvent.isRecurring,
          recurrencePattern: backendEvent.recurrencePattern,
          recurrenceInterval: backendEvent.recurrenceInterval,
          recurrenceEndDate: backendEvent.recurrenceEndDate ? new Date(backendEvent.recurrenceEndDate) : undefined,
          recurrenceDaysOfWeek: backendEvent.recurrenceDaysOfWeek,
          relatedCourseId: backendEvent.relatedCourseId,
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
      const response = await fetch(`${this.baseURL}/calendar/${id}`, this.getRequestOptions({
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
}

export const calendarService = new CalendarService();