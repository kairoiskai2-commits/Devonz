/**
 * better-auth server configuration.
 *
 * Supports:
 *   - Email + password (always enabled)
 *   - GitHub OAuth  (enabled when GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET are set)
 *   - Google OAuth  (enabled when GOOGLE_CLIENT_ID  + GOOGLE_CLIENT_SECRET  are set)
 *
 * Sessions are stored in the existing SQLite database via the Drizzle adapter.
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '~/lib/.server/db';

function getBaseURL(): string {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }

  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }

  return 'http://localhost:5000';
}

function getTrustedOrigins(): string[] {
  const origins = new Set<string>();

  origins.add(getBaseURL());

  if (process.env.REPLIT_DEV_DOMAIN) {
    origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
  }

  if (process.env.BETTER_AUTH_URL) {
    origins.add(process.env.BETTER_AUTH_URL);
  }

  // Allow any replit.app deployment domains
  if (process.env.REPLIT_DOMAINS) {
    for (const domain of process.env.REPLIT_DOMAINS.split(',')) {
      origins.add(`https://${domain.trim()}`);
    }
  }

  return [...origins];
}

const socialProviders: Record<string, unknown> = {};

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  baseURL: getBaseURL(),
  secret: process.env.BETTER_AUTH_SECRET || process.env.DEVONZ_AUTH_TOKEN || 'veyra-dev-secret-change-in-production',

  database: drizzleAdapter(db, {
    provider: 'sqlite',
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },

  socialProviders,

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  user: {
    additionalFields: {},
  },

  trustedOrigins: getTrustedOrigins(),
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
