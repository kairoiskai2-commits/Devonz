/**
 * Catch-all route that delegates all /api/auth/* requests to better-auth.
 *
 * Routes handled automatically by better-auth:
 *   POST /api/auth/sign-in/email
 *   POST /api/auth/sign-up/email
 *   POST /api/auth/sign-out
 *   GET  /api/auth/session
 *   GET  /api/auth/callback/:provider   ← OAuth callback
 *   GET  /api/auth/error
 *   ...and more
 */

import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { auth } from '~/lib/.server/auth';

export async function loader({ request }: LoaderFunctionArgs) {
  return auth.handler(request);
}

export async function action({ request }: ActionFunctionArgs) {
  return auth.handler(request);
}
