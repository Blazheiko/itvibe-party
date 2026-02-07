CREATE TABLE `contact_as` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`message` text NOT NULL,
	`created_at` datetime NOT NULL DEFAULT '2026-01-12 09:48:23.135',
	`updated_at` datetime NOT NULL DEFAULT '2026-01-12 09:48:23.135',
	CONSTRAINT `contact_as_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_activity` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`token` varchar(255) NOT NULL,
	`user_agent` text NOT NULL,
	`ip` varchar(45) NOT NULL,
	`count_click` int NOT NULL DEFAULT 0,
	`date` date NOT NULL,
	`referer` varchar(512),
	`path` varchar(512) NOT NULL,
	`device_type` varchar(50),
	`browser` varchar(100),
	`os` varchar(100),
	`created_at` datetime NOT NULL DEFAULT '2026-01-12 09:48:23.146',
	`updated_at` datetime NOT NULL DEFAULT '2026-01-12 09:48:23.146',
	CONSTRAINT `user_activity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `date_idx` ON `user_activity` (`date`);
--> statement-breakpoint
CREATE INDEX `token_idx` ON `user_activity` (`token`);
--> statement-breakpoint
CREATE INDEX `date_token_idx` ON `user_activity` (`date`,`token`);
--> statement-breakpoint
CREATE INDEX `ip_idx` ON `user_activity` (`ip`);