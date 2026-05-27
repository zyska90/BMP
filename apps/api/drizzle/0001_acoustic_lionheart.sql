ALTER TABLE `users` ADD `email` varchar(255) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);
