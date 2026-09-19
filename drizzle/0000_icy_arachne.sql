CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`filename` text NOT NULL,
	`text` text NOT NULL,
	`created_at` text NOT NULL,
	`category` text NOT NULL,
	`sha` text NOT NULL,
	`bytes` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `documents_sha_unique` ON `documents` (`sha`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
