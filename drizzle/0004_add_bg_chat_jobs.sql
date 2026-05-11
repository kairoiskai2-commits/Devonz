CREATE TABLE IF NOT EXISTS `bg_chat_jobs` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text,
  `request_payload` text NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `result` text,
  `error` text,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_bg_chat_jobs_user_id` ON `bg_chat_jobs` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_bg_chat_jobs_status` ON `bg_chat_jobs` (`status`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_bg_chat_jobs_created_at` ON `bg_chat_jobs` (`created_at`);
