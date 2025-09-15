CREATE TABLE `library_resource` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`authors` text NOT NULL,
	`publish_year` integer,
	`category` text NOT NULL,
	`media_type` text NOT NULL,
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`file_size` integer NOT NULL,
	`mime_type` text NOT NULL,
	`duration` integer,
	`isbn` text,
	`downloadable` integer DEFAULT true NOT NULL,
	`download_count` integer DEFAULT 0 NOT NULL,
	`tags` text,
	`language` text DEFAULT 'es' NOT NULL,
	`uploaded_by` text NOT NULL,
	`uploaded_at` integer NOT NULL,
	`updated_at` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`uploaded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `module_post` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`content` text,
	`image_path` text,
	`video_path` text,
	`audio_path` text,
	`order_number` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`module_id` text NOT NULL,
	`author_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`module_id`) REFERENCES `module`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `post_element` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`element_type` text NOT NULL,
	`content` text,
	`file_path` text,
	`file_name` text,
	`file_size` integer,
	`mime_type` text,
	`order_number` integer NOT NULL,
	`metadata` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`post_id`) REFERENCES `module_post`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`nombre` text,
	`apellido` text,
	`telefono` text,
	`role` text DEFAULT 'asistente' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user`("id", "username", "password_hash", "nombre", "apellido", "telefono", "role", "created_at", "updated_at") SELECT "id", "username", "password_hash", "nombre", "apellido", "telefono", "role", "created_at", "updated_at" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);