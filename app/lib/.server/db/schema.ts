import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/*
 * ---------------------------------------------------------------------------
 * Auth tables (better-auth)
 * ---------------------------------------------------------------------------
 */
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: text('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
    updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => [index('idx_session_user_id').on(t.userId), index('idx_session_token').on(t.token)],
);

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: text('access_token_expires_at'),
    refreshTokenExpiresAt: text('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
    updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
  },
  (t) => [
    index('idx_account_user_id').on(t.userId),
    index('idx_account_provider').on(t.providerId, t.accountId),
  ],
);

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: text('expires_at').notNull(),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
    updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  },
  (t) => [index('idx_verification_identifier').on(t.identifier)],
);

/**
 * SQLite schema for Veyra — mirrors the IndexedDB v3 structure
 * so that data can be migrated from client-side IndexedDB to
 * server-side SQLite seamlessly.
 *
 * Tables: chats, messages, snapshots, versions
 */

/*
 * ---------------------------------------------------------------------------
 * chats
 * ---------------------------------------------------------------------------
 */
export const chats = sqliteTable(
  'chats',
  {
    id: text('id').primaryKey(),
    urlId: text('url_id').unique(),
    description: text('description'),
    timestamp: text('timestamp'),

    /** JSON-serialised IChatMetadata (gitUrl, gitBranch, netlifySiteId) */
    metadata: text('metadata', { mode: 'json' }),
    userId: text('user_id'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index('idx_chats_url_id').on(table.urlId),
    index('idx_chats_user_id').on(table.userId),
    index('idx_chats_created_at').on(table.createdAt),
  ],
);

/*
 * ---------------------------------------------------------------------------
 * messages
 * ---------------------------------------------------------------------------
 */
export const messages = sqliteTable(
  'messages',
  {
    id: text('id').primaryKey(),
    chatId: text('chat_id')
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
    content: text('content').notNull(),

    /** Full AI SDK message payload stored as JSON for lossless round-tripping */
    fullMessage: text('full_message', { mode: 'json' }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index('idx_messages_chat_id').on(table.chatId),
    index('idx_messages_sort_order').on(table.chatId, table.sortOrder),
  ],
);

/*
 * ---------------------------------------------------------------------------
 * snapshots
 * ---------------------------------------------------------------------------
 */
export const snapshots = sqliteTable('snapshots', {
  chatId: text('chat_id')
    .primaryKey()
    .references(() => chats.id, { onDelete: 'cascade' }),

  /** JSON-serialised Snapshot ({ chatIndex, files, summary }) */
  snapshot: text('snapshot', { mode: 'json' }).notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

/*
 * ---------------------------------------------------------------------------
 * deployments
 * ---------------------------------------------------------------------------
 */
export const deployments = sqliteTable(
  'deployments',
  {
    id: text('id').primaryKey(),

    /** The chat session this deployment belongs to */
    chatId: text('chat_id').notNull(),

    /** Hosting provider identifier (vercel | cloudflare | etc.) */
    provider: text('provider').notNull().default('vercel'),

    /** Provider-side project identifier */
    projectId: text('project_id'),

    /** Human-readable project name on the provider */
    projectName: text('project_name'),

    /** Provider-side deployment identifier */
    deploymentId: text('deployment_id'),

    /** Live public URL returned after a successful deploy */
    url: text('url'),

    /** Current deployment phase */
    state: text('state', { enum: ['idle', 'uploading', 'building', 'ready', 'error'] })
      .notNull()
      .default('idle'),

    /** Human-readable error details when state = 'error' */
    errorMessage: text('error_message'),

    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index('idx_deployments_chat_id').on(table.chatId),
    index('idx_deployments_state').on(table.state),
    index('idx_deployments_created_at').on(table.createdAt),
  ],
);
