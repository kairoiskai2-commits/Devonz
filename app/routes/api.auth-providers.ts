/**
 * GET /api/auth-providers
 *
 * Tells the frontend which OAuth providers are configured server-side
 * so the login/signup pages can conditionally render their buttons.
 */

import type { LoaderFunctionArgs } from 'react-router';

export async function loader(_: LoaderFunctionArgs) {
  return new Response(
    JSON.stringify({
      github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
  );
}
