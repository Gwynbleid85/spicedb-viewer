CREATE TABLE `shopping_item` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `shopping_item_user_id_idx` ON `shopping_item` (`userId`);--> statement-breakpoint
CREATE INDEX `shopping_item_user_completed_idx` ON `shopping_item` (`userId`,`completed`);