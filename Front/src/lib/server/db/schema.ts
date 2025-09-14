import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	nombre: text('nombre'),
	apellido: text('apellido'),
	telefono: text('telefono'),
	role: text('role').notNull().default('asistente'), // asistente, colaborador, administrador
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const course = sqliteTable('course', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description').notNull(),
	subject: text('subject').notNull(), // Matemáticas, Física, Sociales, Economía
	imagePath: text('image_path'),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }),
	educatorId: text('educator_id').notNull().references(() => user.id)
});

export const module = sqliteTable('module', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description').notNull(),
	orderNumber: integer('order_number').notNull(),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	courseId: text('course_id').notNull().references(() => course.id, { onDelete: 'cascade' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
});

export const workItem = sqliteTable('work_item', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	longText: text('long_text'),
	imagePath: text('image_path'),
	videoPath: text('video_path'),
	orderNumber: integer('order_number').notNull(),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	moduleId: text('module_id').notNull().references(() => module.id, { onDelete: 'cascade' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
});

export const blogPost = sqliteTable('blog_post', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	content: text('content').notNull(),
	summary: text('summary'),
	slug: text('slug').notNull().unique(),
	isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(false),
	isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
	views: integer('views').notNull().default(0),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }),
	publishedAt: integer('published_at', { mode: 'timestamp' }),
	authorId: text('author_id').notNull().references(() => user.id),
	categoryId: text('category_id'),
	featuredImagePath: text('featured_image_path'),
	pdfPath: text('pdf_path'),
	videoPath: text('video_path')
});

export const event = sqliteTable('event', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	startDateTime: integer('start_date_time', { mode: 'timestamp' }).notNull(),
	endDateTime: integer('end_date_time', { mode: 'timestamp' }),
	isAllDay: integer('is_all_day', { mode: 'boolean' }).notNull().default(false),
	location: text('location'),
	eventType: text('event_type').notNull().default('General'),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
	maxAttendees: integer('max_attendees'),
	currentAttendees: integer('current_attendees').notNull().default(0),
	requiresRegistration: integer('requires_registration', { mode: 'boolean' }).notNull().default(false),
	registrationDeadline: integer('registration_deadline', { mode: 'timestamp' }),
	imagePath: text('image_path'),
	pdfPath: text('pdf_path'),
	
	// Eventos recurrentes
	isRecurring: integer('is_recurring', { mode: 'boolean' }).notNull().default(false),
	recurrencePattern: text('recurrence_pattern'),
	recurrenceInterval: integer('recurrence_interval').default(1),
	recurrenceEndDate: integer('recurrence_end_date', { mode: 'timestamp' }),
	recurrenceDaysOfWeek: text('recurrence_days_of_week'),
	
	// Referencias a contenido relacionado
	relatedCourseId: text('related_course_id').references(() => course.id),
	relatedBlogPostId: text('related_blog_post_id').references(() => blogPost.id),
	
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }),
	organizerId: text('organizer_id').notNull().references(() => user.id)
});

export const eventRegistration = sqliteTable('event_registration', {
	id: text('id').primaryKey(),
	eventId: text('event_id').notNull().references(() => event.id),
	userId: text('user_id').notNull().references(() => user.id),
	registrationDate: integer('registration_date', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	status: text('status').notNull().default('confirmed') // confirmed, cancelled, waitlist
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type InsertUser = typeof user.$inferInsert;

export type Course = typeof course.$inferSelect;
export type InsertCourse = typeof course.$inferInsert;

export type Module = typeof module.$inferSelect;
export type InsertModule = typeof module.$inferInsert;

export type WorkItem = typeof workItem.$inferSelect;
export type InsertWorkItem = typeof workItem.$inferInsert;

export type BlogPost = typeof blogPost.$inferSelect;
export type InsertBlogPost = typeof blogPost.$inferInsert;

export type Event = typeof event.$inferSelect;
export type InsertEvent = typeof event.$inferInsert;

export type EventRegistration = typeof eventRegistration.$inferSelect;
export type InsertEventRegistration = typeof eventRegistration.$inferInsert;
