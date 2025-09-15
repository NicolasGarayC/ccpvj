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

// Renaming workItem to modulePost for better clarity
export const modulePost = sqliteTable('module_post', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	subtitle: text('subtitle'),
	content: text('content'), // Main text content
	imagePath: text('image_path'),
	videoPath: text('video_path'),
	audioPath: text('audio_path'),
	orderNumber: integer('order_number').notNull(),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	moduleId: text('module_id').notNull().references(() => module.id, { onDelete: 'cascade' }),
	authorId: text('author_id').notNull().references(() => user.id),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
});

// Nueva tabla para elementos dinámicos de posts
export const postElement = sqliteTable('post_element', {
	id: text('id').primaryKey(),
	postId: text('post_id').notNull().references(() => modulePost.id, { onDelete: 'cascade' }),
	elementType: text('element_type').notNull(), // 'title', 'text', 'image', 'video', 'audio'
	content: text('content'), // Para título y texto
	filePath: text('file_path'), // Para archivos multimedia
	fileName: text('file_name'), // Nombre original del archivo
	fileSize: integer('file_size'), // Tamaño del archivo en bytes
	mimeType: text('mime_type'), // Tipo MIME del archivo
	orderNumber: integer('order_number').notNull(), // Orden dentro del post
	metadata: text('metadata'), // JSON para datos adicionales
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
});

// Keep workItem for backward compatibility, but mark as deprecated
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

export const libraryResource = sqliteTable('library_resource', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	authors: text('authors').notNull(), // JSON array of author names
	publishYear: integer('publish_year'),
	category: text('category').notNull(), // educacion, cultura, historia, arte, literatura, ciencias, otros
	mediaType: text('media_type').notNull(), // pdf, video, image, audio, document
	fileName: text('file_name').notNull(),
	filePath: text('file_path').notNull(),
	fileSize: integer('file_size').notNull(),
	mimeType: text('mime_type').notNull(),
	duration: integer('duration'), // For video/audio files (in seconds)
	isbn: text('isbn'), // For books/documents
	downloadable: integer('downloadable', { mode: 'boolean' }).notNull().default(true),
	downloadCount: integer('download_count').notNull().default(0),
	tags: text('tags'), // JSON array of tags
	language: text('language').notNull().default('es'),
	uploadedBy: text('uploaded_by').notNull().references(() => user.id),
	uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false)
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type InsertUser = typeof user.$inferInsert;

export type Course = typeof course.$inferSelect;
export type InsertCourse = typeof course.$inferInsert;

export type Module = typeof module.$inferSelect;
export type InsertModule = typeof module.$inferInsert;

export type ModulePost = typeof modulePost.$inferSelect;
export type InsertModulePost = typeof modulePost.$inferInsert;

export type WorkItem = typeof workItem.$inferSelect;
export type InsertWorkItem = typeof workItem.$inferInsert;

export type BlogPost = typeof blogPost.$inferSelect;
export type InsertBlogPost = typeof blogPost.$inferInsert;

export type Event = typeof event.$inferSelect;
export type InsertEvent = typeof event.$inferInsert;

export type EventRegistration = typeof eventRegistration.$inferSelect;
export type InsertEventRegistration = typeof eventRegistration.$inferInsert;

export type PostElement = typeof postElement.$inferSelect;
export type InsertPostElement = typeof postElement.$inferInsert;

export type LibraryResource = typeof libraryResource.$inferSelect;
export type InsertLibraryResource = typeof libraryResource.$inferInsert;
