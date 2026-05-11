import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { eq, or, desc } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '~/lib/.server/db';
import { auth } from '~/lib/.server/auth';
import { withSecurity } from '~/lib/security';
import { successResponse, errorResponse } from '~/lib/api/responses';
import { AppError, AppErrorType } from '~/lib/api/errors';
import { AUTH_PRESETS } from '~/lib/security-config';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.agents');

const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  systemPrompt: z.string().min(1).max(10000),
  model: z.string().optional(),
  provider: z.string().optional(),
  avatar: z.string().max(10).optional(),
  skills: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

async function agentsLoader({ request }: LoaderFunctionArgs) {
  const sessionData = await auth.api.getSession({ headers: request.headers });

  if (!sessionData?.user?.id) {
    return errorResponse(new AppError(AppErrorType.UNAUTHORIZED, 'Not authenticated'), 401);
  }

  const userId = sessionData.user.id;

  const rows = await db
    .select()
    .from(schema.agents)
    .where(or(eq(schema.agents.userId, userId), eq(schema.agents.isPublic, true)))
    .orderBy(desc(schema.agents.createdAt));

  return successResponse({ agents: rows });
}

async function agentsAction({ request }: ActionFunctionArgs) {
  const sessionData = await auth.api.getSession({ headers: request.headers });

  if (!sessionData?.user?.id) {
    return errorResponse(new AppError(AppErrorType.UNAUTHORIZED, 'Not authenticated'), 401);
  }

  const userId = sessionData.user.id;

  if (request.method === 'POST') {
    let rawBody: unknown;

    try {
      rawBody = await request.json();
    } catch {
      return errorResponse(new AppError(AppErrorType.VALIDATION, 'Invalid JSON'), 400);
    }

    const parsed = createAgentSchema.safeParse(rawBody);

    if (!parsed.success) {
      return errorResponse(new AppError(AppErrorType.VALIDATION, 'Invalid agent data'), 400);
    }

    const { name, description, systemPrompt, model, provider, avatar, skills, isPublic } = parsed.data;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(schema.agents).values({
      id,
      userId,
      name,
      description: description ?? null,
      systemPrompt,
      model: model ?? null,
      provider: provider ?? null,
      avatar: avatar ?? '🤖',
      skills: skills ?? [],
      isPublic: isPublic ?? false,
      createdAt: now,
      updatedAt: now,
    });

    logger.info(`Created agent ${id} for user ${userId}`);

    const created = await db.select().from(schema.agents).where(eq(schema.agents.id, id)).limit(1);

    return successResponse({ agent: created[0] }, undefined, 201);
  }

  return errorResponse(new AppError(AppErrorType.VALIDATION, 'Method not allowed'), 405);
}

// Auth is enforced inside agentsLoader / agentsAction via auth.api.getSession.
// Using AUTH_PRESETS.public here keeps withSecurity for rate-limiting, security
// headers, and method checks without a redundant second session lookup that can
// fail due to Replit proxy cookie-forwarding edge-cases.
export const loader = withSecurity(agentsLoader, {
  auth: AUTH_PRESETS.public,
  allowedMethods: ['GET'],
});

export const action = withSecurity(agentsAction, {
  auth: AUTH_PRESETS.public,
  allowedMethods: ['POST'],
  csrfExempt: true,
});
