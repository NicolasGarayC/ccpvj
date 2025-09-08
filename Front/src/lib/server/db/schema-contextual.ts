import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// =====================================================
// AUTHENTICATION & USER MANAGEMENT
// =====================================================

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	nombre: text('nombre'),
	apellido: text('apellido'),
	telefono: text('telefono'),
	role: text('role').notNull().default('Estudiante'),
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

export const rol = sqliteTable('Rol', {
	idRol: integer('IdRol').primaryKey({ autoIncrement: true }),
	nombreRol: text('NombreRol').notNull(),
	descripcion: text('Descripcion')
});

// =====================================================
// EDUCATIONAL CONTENT SYSTEM
// =====================================================

export const course = sqliteTable('Course', {
	id: text('Id').primaryKey(),
	title: text('Title').notNull(),
	description: text('Description').notNull(),
	subject: text('Subject').notNull(), // 'Matemáticas', 'Física', 'Sociales', 'Economía'
	isActive: integer('IsActive', { mode: 'boolean' }).notNull().default(true),
	isFeatured: integer('IsFeatured', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('CreatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('UpdatedAt', { mode: 'timestamp' }),
	educatorId: text('EducatorId').notNull().references(() => user.id),
	// Course-specific multimedia
	imagePath: text('ImagePath') // Course banner/thumbnail
});

export const module = sqliteTable('Module', {
	id: text('Id').primaryKey(),
	title: text('Title').notNull(),
	description: text('Description').default(''),
	orderNumber: integer('OrderNumber').notNull().default(0),
	isActive: integer('IsActive', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('CreatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('UpdatedAt', { mode: 'timestamp' }),
	courseId: text('CourseId').notNull().references(() => course.id)
});

// NEW: WorkItem table for module work items with contextual multimedia
export const workItem = sqliteTable('WorkItem', {
	id: text('Id').primaryKey(),
	title: text('Title').notNull(),
	description: text('Description'),
	longText: text('LongText'), // Detailed content/instructions
	orderNumber: integer('OrderNumber').notNull().default(0),
	isActive: integer('IsActive', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('CreatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('UpdatedAt', { mode: 'timestamp' }),
	moduleId: text('ModuleId').notNull().references(() => module.id),
	// WorkItem-specific multimedia (contextual to this work item)
	imagePath: text('ImagePath'), // Work item illustration/diagram
	videoPath: text('VideoPath')  // Instructional video
});

// =====================================================
// BLOG & CONTENT MANAGEMENT SYSTEM
// =====================================================

export const blogCategory = sqliteTable('BlogCategory', {
	id: text('Id').primaryKey(),
	name: text('Name').notNull().unique(),
	description: text('Description'),
	color: text('Color').default('#6B7280'),
	createdAt: integer('CreatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

export const blogPost = sqliteTable('BlogPost', {
	id: text('Id').primaryKey(),
	title: text('Title').notNull(),
	content: text('Content').notNull(),
	summary: text('Summary'),
	slug: text('Slug').notNull().unique(),
	isPublished: integer('IsPublished', { mode: 'boolean' }).notNull().default(false),
	isFeatured: integer('IsFeatured', { mode: 'boolean' }).notNull().default(false),
	views: integer('Views').notNull().default(0),
	createdAt: integer('CreatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('UpdatedAt', { mode: 'timestamp' }),
	publishedAt: integer('PublishedAt', { mode: 'timestamp' }),
	authorId: text('AuthorId').notNull().references(() => user.id),
	categoryId: text('CategoryId').references(() => blogCategory.id),
	// Blog-specific multimedia (contextual to this post)
	featuredImagePath: text('FeaturedImagePath'), // Article featured image
	pdfPath: text('PdfPath'), // Downloadable PDF document
	videoPath: text('VideoPath') // Embedded video
});

// =====================================================
// EVENTS & CALENDAR SYSTEM
// =====================================================

export const event = sqliteTable('Event', {
	id: text('Id').primaryKey(),
	title: text('Title').notNull(),
	description: text('Description'),
	startDateTime: integer('StartDateTime', { mode: 'timestamp' }).notNull(),
	endDateTime: integer('EndDateTime', { mode: 'timestamp' }).notNull(),
	location: text('Location'),
	maxAttendees: integer('MaxAttendees'),
	currentAttendees: integer('CurrentAttendees').notNull().default(0),
	isActive: integer('IsActive', { mode: 'boolean' }).notNull().default(true),
	requiresRegistration: integer('RequiresRegistration', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('CreatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('UpdatedAt', { mode: 'timestamp' }),
	organizerId: text('OrganizerId').notNull().references(() => user.id),
	// Event-specific multimedia (contextual to this event)
	imagePath: text('ImagePath') // Event poster/image
});

export const eventRegistration = sqliteTable('EventRegistration', {
	id: text('Id').primaryKey(),
	eventId: text('EventId').notNull().references(() => event.id),
	userId: text('UserId').notNull().references(() => user.id),
	registrationDate: integer('RegistrationDate', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	status: text('Status').notNull().default('confirmed'), // confirmed, cancelled, attended
	notes: text('Notes')
});

// =====================================================
// CONTEXTUAL MULTIMEDIA TRACKING
// =====================================================

// MediaFile: Tracks uploaded files but they MUST belong to specific content
export const mediaFile = sqliteTable('MediaFile', {
	id: integer('Id').primaryKey({ autoIncrement: true }),
	fileName: text('FileName').notNull(),
	relativePath: text('RelativePath').notNull(),
	fileSize: integer('FileSize').notNull().default(0),
	mimeType: text('MimeType').notNull(),
	uploadedBy: text('UploadedBy').notNull().references(() => user.id),
	uploadedAt: integer('UploadedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	
	// Context Information - ONE of these contexts must be filled
	contentType: text('ContentType').notNull(), // 'course', 'workitem', 'blog', 'event'
	contentId: text('ContentId').notNull(), // ID of the related content
	mediaType: text('MediaType').notNull() // 'image', 'video', 'pdf', 'audio'
});

export const uploadStatus = sqliteTable('UploadStatus', {
	uploadId: text('UploadId').primaryKey(),
	status: text('Status').notNull().default('pending'), // pending, processing, completed, error
	errorMessage: text('ErrorMessage'),
	mediaFileId: integer('MediaFileId').references(() => mediaFile.id),
	createdAt: integer('CreatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	completedAt: integer('CompletedAt', { mode: 'timestamp' }),
	progress: integer('Progress').notNull().default(0), // 0-100
	fileName: text('FileName').notNull(),
	userId: text('UserId').notNull().references(() => user.id),
	
	// Context for what content this upload is for
	targetContentType: text('TargetContentType').notNull(), // 'course', 'workitem', 'blog', 'event'
	targetContentId: text('TargetContentId').notNull(), // ID of the target content
	targetMediaType: text('TargetMediaType').notNull() // 'image', 'video', 'pdf', 'audio'
});

// =====================================================
// JWT TOKEN MANAGEMENT
// =====================================================

export const refreshToken = sqliteTable('RefreshToken', {
	id: text('Id').primaryKey(),
	token: text('Token').notNull().unique(),
	expiresAt: integer('ExpiresAt', { mode: 'timestamp' }).notNull(),
	createdAt: integer('CreatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	isRevoked: integer('IsRevoked', { mode: 'boolean' }).notNull().default(false),
	userId: text('UserId').notNull().references(() => user.id)
});

export const tokenBlacklist = sqliteTable('TokenBlacklist', {
	id: text('Id').primaryKey(),
	tokenJti: text('TokenJti').notNull().unique(),
	expiresAt: integer('ExpiresAt', { mode: 'timestamp' }).notNull(),
	createdAt: integer('CreatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	userId: text('UserId').notNull().references(() => user.id)
});

// =====================================================
// TYPE EXPORTS
// =====================================================

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

export type BlogCategory = typeof blogCategory.$inferSelect;
export type InsertBlogCategory = typeof blogCategory.$inferInsert;

export type Event = typeof event.$inferSelect;
export type InsertEvent = typeof event.$inferInsert;

export type EventRegistration = typeof eventRegistration.$inferSelect;
export type InsertEventRegistration = typeof eventRegistration.$inferInsert;

export type MediaFile = typeof mediaFile.$inferSelect;
export type InsertMediaFile = typeof mediaFile.$inferInsert;

export type UploadStatus = typeof uploadStatus.$inferSelect;
export type InsertUploadStatus = typeof uploadStatus.$inferInsert;

// =====================================================
// CONTENT TYPE CONSTANTS
// =====================================================

export const CONTENT_TYPES = {
	COURSE: 'course',
	WORKITEM: 'workitem',
	BLOG: 'blog',
	EVENT: 'event'
} as const;

export const MEDIA_TYPES = {
	IMAGE: 'image',
	VIDEO: 'video', 
	PDF: 'pdf',
	AUDIO: 'audio'
} as const;

export const SUBJECTS = {
	MATEMATICAS: 'Matemáticas',
	FISICA: 'Física',
	SOCIALES: 'Sociales',
	ECONOMIA: 'Economía'
} as const;