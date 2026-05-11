import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '~/lib/.server/db';
import { auth } from '~/lib/.server/auth';
import { withSecurity } from '~/lib/security';
import { successResponse, errorResponse } from '~/lib/api/responses';
import { AppError, AppErrorType } from '~/lib/api/errors';
import { AUTH_PRESETS } from '~/lib/security-config';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.agents.$id');

const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  systemPrompt: z.string().min(1).max(10000).optional(),
  model: z.string().optional(),
  provider: z.string().optional(),
  avatar: z.string().max(10).optional(),
  skills: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

async function agentLoader({ request, params }: LoaderFunctionArgs) {
  const sessionData = await auth.api.getSession({ headers: request.headers });

  if (!sessionData?.user?.id) {
    return errorResponse(new AppError(AppErrorType.UNAUTHORIZED, 'Not authenticated'), 401);
  }

  const { id } = params;

  if (!id) {
    return errorResponse(new AppError(AppErrorType.VALIDATION, 'Agent ID required'), 400);
  }

  const agent = await db.select().from(schema.agents).where(eq(schema.agents.id, id)).limit(1);

  if (!agent[0]) {
    return errorResponse(new AppError(AppErrorType.NOT_FOUND, 'Agent not found'), 404);
  }

  if (!agent[0].isPublic && agent[0].userId !== sessionData.user.id) {
    return errorResponse(new AppError(AppErrorType.UNAUTHORIZED, 'Access denied'), 403);
  }

  return successResponse({ agent: agent[0] });
}

async function agentAction({ request, params }: ActionFunctionArgs) {
  const sessionData = await auth.api.getSession({ headers: request.headers });

  if (!sessionData?.user?.id) {
    return errorResponse(new AppError(AppErrorType.UNAUTHORIZED, 'Not authenticated'), 401);
  }

  const { id } = params;

  if (!id) {
    return errorResponse(new AppError(AppErrorType.VALIDATION, 'Agent ID required'), 400);
  }

  const userId = sessionData.user.id;

  const existing = await db
    .select()
    .from(schema.agents)
    .where(and(eq(schema.agents.id, id), eq(schema.agents.userId, userId)))
    .limit(1);

  if (!existing[0]) {
    return errorResponse(new AppError(AppErrorType.NOT_FOUND, 'Agent not found'), 404);
  }

  if (request.method === 'DELETE') {
    await db.delete(schema.agents).where(eq(schema.agents.id, id));
    logger.info(`Deleted agent ${id}`);

    return successResponse({ deleted: true });
  }

  if (request.method === 'PATCH' || request.method === 'PUT') {
    let rawBody: unknown;

    try {
      rawBody = await request.json();
    } catch {
      return errorResponse(new AppError(AppErrorType.VALIDATION, 'Invalid JSON'), 400);
    }

    const parsed = updateAgentSchema.safeParse(rawBody);

    if (!parsed.success) {
      return errorResponse(new AppError(AppErrorType.VALIDATION, 'Invalid agent data'), 400);
    }

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    const { name, description, systemPrompt, model, provider, avatar, skills, isPublic } = parsed.data;

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (systemPrompt !== undefined) updates.systemPrompt = systemPrompt;
    if (model !== undefined) updates.model = model;
    if (provider !== undefined) updates.provider = provider;
    if (avatar !== undefined) updates.avatar = avatar;
    if (skills !== undefined) updates.skills = skills;
    if (isPublic !== undefined) updates.isPublic = isPublic;

    await db.update(schema.agents).set(updates).where(eq(schema.agents.id, id));
    logger.info(`Updated agent ${id}`);

    const updated = await db.select().from(schema.agents).where(eq(schema.agents.id, id)).limit(1);

    return successResponse({ agent: updated[0] });
  }

  return errorResponse(new AppError(AppErrorType.VALIDATION, 'Method not allowed'), 405);
}

export const loader = withSecurity(agentLoader, {
  auth: AUTH_PRESETS.authenticated,
  allowedMethods: ['GET'],
});

export const action = withSecurity(agentAction, {
  auth: AUTH_PRESETS.authenticated,
  allowedMethods: ['DELETE', 'PATCH', 'PUT'],
  csrfExempt: true,
});
