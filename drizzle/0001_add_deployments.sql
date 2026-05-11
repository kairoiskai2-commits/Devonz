CREATE TABLE `deployments` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_id` text NOT NULL,
	`provider` text NOT NULL DEFAULT 'vercel',
	`project_id` text,
	`project_name` text,
	`deployment_id` text,
	`url` text,
	`state` text NOT NULL DEFAULT 'idle',
	`error_message` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_deployments_chat_id` ON `deployments` (`chat_id`);--> statement-breakpoint
CREATE INDEX `idx_deployments_state` ON `deployments` (`state`);--> statement-breakpoint
CREATE INDEX `idx_deployments_created_at` ON `deployments` (`created_at`);
