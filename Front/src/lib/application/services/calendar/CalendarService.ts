import { ApiError, BaseHttpService } from '$lib/infrastructure/http/BaseHttpClient';

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
	imagePath?: string;
	isRecurring?: boolean;
	organizerName?: string;
	relatedProjectId?: string;
	relatedCourseTitle?: string;
	relatedBlogPostId?: string;
	relatedBlogPostTitle?: string;
	relatedBlogPostSlug?: string;
	currentAttendees?: number;
	requiresRegistration?: boolean;
	registrationDeadline?: Date;
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
  isAllDay?: boolean;
  location?: string;
  eventType: string;
  isFeatured?: boolean;
  isRecurring?: boolean;
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

class CalendarService extends BaseHttpService {
  private readonly basePath = '/calendar';

	private adaptBackendToFrontend(backendEvent: any): EventSummary {
		return {
			id: backendEvent.id?.toString?.() ?? backendEvent.id,
			title: backendEvent.title,
			description: backendEvent.description,
			startDateTime: new Date(backendEvent.startDateTime),
			endDateTime: backendEvent.endDateTime ? new Date(backendEvent.endDateTime) : undefined,
			isAllDay: backendEvent.isAllDay,
			location: backendEvent.location,
			eventType: backendEvent.eventType,
			isFeatured: backendEvent.isFeatured,
			imagePath: backendEvent.imagePath ?? undefined,
			isRecurring: backendEvent.isRecurring,
			organizerName: backendEvent.organizerName,
			relatedProjectId: backendEvent.relatedProjectId ? backendEvent.relatedProjectId.toString() : undefined,
			relatedCourseTitle: backendEvent.relatedProjectTitle,
			relatedBlogPostId: backendEvent.relatedBlogPostId ? backendEvent.relatedBlogPostId.toString() : undefined,
			relatedBlogPostTitle: backendEvent.relatedBlogPostTitle,
			relatedBlogPostSlug: backendEvent.relatedBlogPostSlug,
			currentAttendees: backendEvent.currentAttendees ?? backendEvent.attendeeCount ?? undefined,
			requiresRegistration: backendEvent.requiresRegistration ?? false,
			registrationDeadline: backendEvent.registrationDeadline
				? new Date(backendEvent.registrationDeadline)
				: undefined
		};
	}

  async getUpcomingEvents(limit: number = 10): Promise<EventSummary[]> {
    try {
      const data = await this.get<any[]>(`${this.basePath}/upcoming`, { limit });
			if (data && Array.isArray(data)) {
				return data.map(event => this.adaptBackendToFrontend(event));
			}
      return [];
    } catch (error) {
      console.error('Error cargando eventos próximos:', error);
      throw error;
    }
  }

  async getAllEvents(): Promise<EventSummary[]> {
    try {
      const data = await this.get<any[]>(this.basePath);
			if (data && Array.isArray(data)) {
				return data.map(event => this.adaptBackendToFrontend(event));
			}
      return [];
    } catch (error) {
      console.error('Error cargando todos los eventos:', error);
      throw error;
    }
  }

  async getEventById(id: string): Promise<EventDetail | null> {
    try {
      const backendEvent = await this.get<any>(`${this.basePath}/${id}`);

			return {
				...this.adaptBackendToFrontend(backendEvent),
				isRecurring: backendEvent.isRecurring,
				recurrencePattern: backendEvent.recurrencePattern,
				recurrenceInterval: backendEvent.recurrenceInterval,
				recurrenceEndDate: backendEvent.recurrenceEndDate ? new Date(backendEvent.recurrenceEndDate) : undefined,
				recurrenceDaysOfWeek: backendEvent.recurrenceDaysOfWeek,
				relatedProjectId: backendEvent.relatedProjectId ? backendEvent.relatedProjectId.toString() : undefined,
				relatedBlogPostId: backendEvent.relatedBlogPostId ? backendEvent.relatedBlogPostId.toString() : undefined,
				relatedProjectTitle: backendEvent.relatedProjectTitle,
				relatedBlogPostTitle: backendEvent.relatedBlogPostTitle,
				relatedBlogPostSlug: backendEvent.relatedBlogPostSlug,
				organizerName: backendEvent.organizerName,
				createdAt: new Date(backendEvent.createdAt),
				updatedAt: backendEvent.updatedAt ? new Date(backendEvent.updatedAt) : undefined,
				organizerId: backendEvent.organizerId?.toString?.() ?? backendEvent.organizerId
			};
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      console.error('Error cargando evento por ID:', error);
      throw error;
    }
  }

  async getCalendarView(viewDate: Date, viewType: string = 'month'): Promise<CalendarView> {
    try {
      const formattedDate = viewDate.toISOString().split('T')[0];
      const data = await this.get<any>(`${this.basePath}/view`, {
        viewDate: formattedDate,
        viewType
      });

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
    } catch (error) {
      console.error('Error cargando vista de calendario:', error);
      throw error;
    }
  }

  async getFeaturedEvents(limit: number = 5): Promise<EventSummary[]> {
    try {
      const data = await this.get<any[]>(`${this.basePath}/featured`, { limit });
			if (data && Array.isArray(data)) {
				return data.map(event => this.adaptBackendToFrontend(event));
			}
      return [];
    } catch (error) {
      console.error('Error cargando eventos destacados:', error);
      throw error;
    }
  }

  async createEvent(data: CreateEventData): Promise<EventDetail> {
    try {
      const cleanData: CreateEventData = {
        ...data,
        isAllDay: data.isAllDay ?? false,
        isFeatured: data.isFeatured ?? false,
        isRecurring: data.isRecurring ?? false,
        relatedProjectId: data.relatedProjectId || undefined,
        relatedBlogPostId: data.relatedBlogPostId || undefined
      };

			const backendEvent = await this.post<any>(this.basePath, cleanData);

			return {
				...this.adaptBackendToFrontend(backendEvent),
				isRecurring: backendEvent.isRecurring,
				recurrencePattern: backendEvent.recurrencePattern,
				recurrenceInterval: backendEvent.recurrenceInterval,
				recurrenceEndDate: backendEvent.recurrenceEndDate ? new Date(backendEvent.recurrenceEndDate) : undefined,
				recurrenceDaysOfWeek: backendEvent.recurrenceDaysOfWeek,
				relatedProjectId: backendEvent.relatedProjectId ? backendEvent.relatedProjectId.toString() : undefined,
				relatedBlogPostId: backendEvent.relatedBlogPostId ? backendEvent.relatedBlogPostId.toString() : undefined,
				createdAt: new Date(backendEvent.createdAt),
				updatedAt: backendEvent.updatedAt ? new Date(backendEvent.updatedAt) : undefined,
				organizerId: backendEvent.organizerId?.toString?.() ?? backendEvent.organizerId
			};
    } catch (error) {
      console.error('Error creando evento:', error);
      throw error;
    }
  }

  async updateEvent(id: string, data: Partial<CreateEventData>): Promise<EventDetail> {
    try {
			const backendEvent = await this.put<any>(`${this.basePath}/${id}`, data);

			return {
				...this.adaptBackendToFrontend(backendEvent),
				isRecurring: backendEvent.isRecurring,
				recurrencePattern: backendEvent.recurrencePattern,
				recurrenceInterval: backendEvent.recurrenceInterval,
				recurrenceEndDate: backendEvent.recurrenceEndDate ? new Date(backendEvent.recurrenceEndDate) : undefined,
				recurrenceDaysOfWeek: backendEvent.recurrenceDaysOfWeek,
				relatedProjectId: backendEvent.relatedProjectId ? backendEvent.relatedProjectId.toString() : undefined,
				relatedBlogPostId: backendEvent.relatedBlogPostId ? backendEvent.relatedBlogPostId.toString() : undefined,
				createdAt: new Date(backendEvent.createdAt),
				updatedAt: backendEvent.updatedAt ? new Date(backendEvent.updatedAt) : undefined,
				organizerId: backendEvent.organizerId?.toString?.() ?? backendEvent.organizerId
			};
    } catch (error) {
      console.error('Error actualizando evento:', error);
      throw error;
    }
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      await this.delete<void>(`${this.basePath}/${id}`);
    } catch (error) {
      console.error('Error eliminando evento:', error);
      throw error;
    }
  }

  async getEventsByProject(projectId: string): Promise<EventSummary[]> {
    try {
      const data = await this.get<any[]>(`${this.basePath}/project/${projectId}`);
			if (data && Array.isArray(data)) {
				return data.map(event => this.adaptBackendToFrontend(event));
			}
      return [];
    } catch (error) {
      console.error('Error cargando eventos por proyecto:', error);
      throw error;
    }
  }

  async getEventsByBlogPost(blogPostId: string): Promise<EventSummary[]> {
    try {
      const data = await this.get<any[]>(`${this.basePath}/blog/${blogPostId}`);
			if (data && Array.isArray(data)) {
				return data.map(event => this.adaptBackendToFrontend(event));
			}
      return [];
    } catch (error) {
      console.error('Error cargando eventos por blog post:', error);
      throw error;
    }
  }

  async getEventsByDateRange(startDate: Date, endDate: Date): Promise<EventSummary[]> {
    try {
      const params = new URLSearchParams({
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });
			const data = await this.get<any[]>(`${this.basePath}/range?${params.toString()}`);
			if (data && Array.isArray(data)) {
				return data.map(event => this.adaptBackendToFrontend(event));
			}
      return [];
    } catch (error) {
      console.error('Error cargando eventos por rango de fechas:', error);
      throw error;
    }
  }

	async registerForEvent(eventId: string, payload: Record<string, unknown> = {}): Promise<EventRegistration> {
		try {
			const registration = await this.post<any>(`${this.basePath}/${eventId}/registrations`, payload);
			return {
				...registration,
				registrationDate: registration.registrationDate ? new Date(registration.registrationDate) : new Date()
			};
		} catch (error) {
			console.error('Error registrando en evento:', error);
			throw error;
		}
	}

	async cancelEventRegistration(eventId: string, registrationId: string): Promise<void> {
		try {
			await this.delete<void>(`${this.basePath}/${eventId}/registrations/${registrationId}`);
		} catch (error) {
			console.error('Error cancelando registro de evento:', error);
			throw error;
		}
	}


  async getEvent(eventId: string): Promise<EventDetail | null> {
    return this.getEventById(eventId);
  }
}

export const calendarService = new CalendarService();
