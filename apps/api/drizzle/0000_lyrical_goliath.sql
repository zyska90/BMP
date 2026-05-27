CREATE TABLE `expertise_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`category` varchar(100) NOT NULL,
	CONSTRAINT `expertise_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `expertise_tags_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `industries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	CONSTRAINT `industries_id` PRIMARY KEY(`id`),
	CONSTRAINT `industries_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `industry_adjacency` (
	`industry_a_id` int NOT NULL,
	`industry_b_id` int NOT NULL,
	`weight` int NOT NULL DEFAULT 1,
	CONSTRAINT `industry_adj_a_b_pk` UNIQUE(`industry_a_id`,`industry_b_id`)
);
--> statement-breakpoint
CREATE TABLE `match_scores` (
	`user_a_id` int NOT NULL,
	`user_b_id` int NOT NULL,
	`total_score` int NOT NULL,
	`intent_score` int NOT NULL DEFAULT 0,
	`expertise_score` int NOT NULL DEFAULT 0,
	`industry_score` int NOT NULL DEFAULT 0,
	`scale_score` int NOT NULL DEFAULT 0,
	`geo_score` int NOT NULL DEFAULT 0,
	`match_reason_summary` varchar(255),
	`computed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `match_scores_user_a_b_pk` UNIQUE(`user_a_id`,`user_b_id`)
);
--> statement-breakpoint
CREATE TABLE `meeting_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requester_id` int NOT NULL,
	`recipient_id` int NOT NULL,
	`channel` enum('WhatsApp','Meet','Zoom') NOT NULL,
	`proposed_time` datetime NOT NULL,
	`intro_note` varchar(255) NOT NULL,
	`status` enum('pending','accepted','declined','rescheduled') NOT NULL DEFAULT 'pending',
	`meet_link` varchar(255),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meeting_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`payload` text,
	`read_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profile_view_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requester_id` int NOT NULL,
	`target_id` int NOT NULL,
	`status` enum('pending','approved','declined') NOT NULL DEFAULT 'pending',
	`requested_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`responded_at` datetime,
	CONSTRAINT `profile_view_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `view_req_pair` UNIQUE(`requester_id`,`target_id`)
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tally_submission_id` varchar(255),
	`email` varchar(255) NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`role_type` varchar(100),
	`raw_payload` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewed_by` int,
	`reviewed_at` datetime,
	CONSTRAINT `registrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `registrations_tally_submission_id_unique` UNIQUE(`tally_submission_id`)
);
--> statement-breakpoint
CREATE TABLE `user_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`summary` varchar(160) NOT NULL,
	`status` enum('ideation','mvp','live','fundraising') NOT NULL DEFAULT 'ideation',
	`looking_for` enum('co-founder','investor','client','mentor','partner') NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_tags` (
	`user_id` int NOT NULL,
	`tag_id` int NOT NULL,
	CONSTRAINT `user_tags_user_id_tag_id_pk` UNIQUE(`user_id`,`tag_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(255) NOT NULL,
	`passcode_hash` varchar(255) NOT NULL,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`account_status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`full_name` varchar(255),
	`title` varchar(255),
	`company` varchar(255),
	`company_size` enum('Solo','2-10','11-50','51-200','200+'),
	`industry_id` int,
	`city` varchar(255),
	`is_open_to_remote` boolean NOT NULL DEFAULT false,
	`intent_offer` text,
	`intent_seek` text,
	`profile_completeness` int NOT NULL DEFAULT 0,
	`has_completed_profile` boolean NOT NULL DEFAULT false,
	`linkedin_url` varchar(255),
	`instagram_handle` varchar(100),
	`whatsapp_number` varchar(20),
	`website_url` varchar(255),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE INDEX `total_score_idx` ON `match_scores` (`total_score`);--> statement-breakpoint
ALTER TABLE `industry_adjacency` ADD CONSTRAINT `industry_adjacency_industry_a_id_industries_id_fk` FOREIGN KEY (`industry_a_id`) REFERENCES `industries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `industry_adjacency` ADD CONSTRAINT `industry_adjacency_industry_b_id_industries_id_fk` FOREIGN KEY (`industry_b_id`) REFERENCES `industries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_scores` ADD CONSTRAINT `match_scores_user_a_id_users_id_fk` FOREIGN KEY (`user_a_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_scores` ADD CONSTRAINT `match_scores_user_b_id_users_id_fk` FOREIGN KEY (`user_b_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_requests` ADD CONSTRAINT `meeting_requests_requester_id_users_id_fk` FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_requests` ADD CONSTRAINT `meeting_requests_recipient_id_users_id_fk` FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profile_view_requests` ADD CONSTRAINT `profile_view_requests_requester_id_users_id_fk` FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profile_view_requests` ADD CONSTRAINT `profile_view_requests_target_id_users_id_fk` FOREIGN KEY (`target_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `registrations` ADD CONSTRAINT `registrations_reviewed_by_users_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_projects` ADD CONSTRAINT `user_projects_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_tags` ADD CONSTRAINT `user_tags_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_tags` ADD CONSTRAINT `user_tags_tag_id_expertise_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `expertise_tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_industry_id_industries_id_fk` FOREIGN KEY (`industry_id`) REFERENCES `industries`(`id`) ON DELETE set null ON UPDATE no action;