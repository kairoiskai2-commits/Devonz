import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { eq, or, isNull, desc } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '~/lib/.server/db';
import { auth } from '~/lib/.server/auth';
import { withSecurity } from '~/lib/security';
import { successResponse, errorResponse } from '~/lib/api/responses';
import { AppError, AppErrorType } from '~/lib/api/errors';
import { AUTH_PRESETS } from '~/lib/security-config';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.agent-skills');

const createSkillSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  instructions: z.string().min(1).max(5000),
  category: z.string().max(50).optional(),
});

async function skillsLoader({ request }: LoaderFunctionArgs) {
  const sessionData = await auth.api.getSession({ headers: request.headers });

  if (!sessionData?.user?.id) {
    return errorResponse(new AppError(AppErrorType.UNAUTHORIZED, 'Not authenticated'), 401);
  }

  const userId = sessionData.user.id;

  const rows = await db
    .select()
    .from(schema.agentSkills)
    .where(or(eq(schema.agentSkills.userId, userId), eq(schema.agentSkills.isBuiltin, true), isNull(schema.agentSkills.userId)))
    .orderBy(desc(schema.agentSkills.isBuiltin), desc(schema.agentSkills.createdAt));

  return successResponse({ skills: rows });
}

async function skillsAction({ request }: ActionFunctionArgs) {
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

    const parsed = createSkillSchema.safeParse(rawBody);

    if (!parsed.success) {
      return errorResponse(new AppError(AppErrorType.VALIDATION, 'Invalid skill data'), 400);
    }

    const { name, description, instructions, category } = parsed.data;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(schema.agentSkills).values({
      id,
      userId,
      name,
      description: description ?? null,
      instructions,
      category: category ?? 'custom',
      isBuiltin: false,
      createdAt: now,
      updatedAt: now,
    });

    logger.info(`Created skill ${id} for user ${userId}`);

    const created = await db.select().from(schema.agentSkills).where(eq(schema.agentSkills.id, id)).limit(1);

    return successResponse({ skill: created[0] }, undefined, 201);
  }

  return errorResponse(new AppError(AppErrorType.VALIDATION, 'Method not allowed'), 405);
}

export const loader = withSecurity(skillsLoader, {
  auth: AUTH_PRESETS.authenticated,
  allowedMethods: ['GET'],
});

export const action = withSecurity(skillsAction, {
  auth: AUTH_PRESETS.authenticated,
  allowedMethods: ['POST'],
  csrfExempt: true,
});
