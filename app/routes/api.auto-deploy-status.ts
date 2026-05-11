/**
 * GET /api/auto-deploy-status
 *
 * Lightweight probe — tells the client whether the server has a
 * VERCEL_API_TOKEN configured so the AutoDeployButton can decide
 * whether to render.
 *
 * No auth required (the response contains no sensitive data).
 */

import type { LoaderFunctionArgs } from 'react-router';

export async function loader(_: LoaderFunctionArgs) {
  const available = Boolean(process.env.VERCEL_API_TOKEN);

  return new Response(JSON.stringify({ available, provider: available ? 'vercel' : null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
