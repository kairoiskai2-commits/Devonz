-- agents table: custom AI agents per user
CREATE TABLE IF NOT EXISTS `agents` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `system_prompt` text NOT NULL,
  `model` text,
  `provider` text,
  `avatar` text DEFAULT '🤖',
  `skills` text DEFAULT '[]',
  `is_public` integer NOT NULL DEFAULT 0,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS `idx_agents_user_id` ON `agents` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_agents_created_at` ON `agents` (`created_at`);

-- agent_skills table: reusable skill instructions
CREATE TABLE IF NOT EXISTS `agent_skills` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text,
  `name` text NOT NULL,
  `description` text,
  `instructions` text NOT NULL,
  `category` text DEFAULT 'custom',
  `is_builtin` integer NOT NULL DEFAULT 0,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS `idx_agent_skills_user_id` ON `agent_skills` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_agent_skills_category` ON `agent_skills` (`category`);
