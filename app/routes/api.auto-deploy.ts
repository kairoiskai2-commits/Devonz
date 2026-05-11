/**
 * POST /api/auto-deploy
 *
 * Server-side auto-deployment endpoint.  Uses the platform's own
 * VERCEL_API_TOKEN so users never need to configure credentials.
 *
 * Streams Server-Sent Events back so the client gets real-time
 * phase transitions: uploading → building → ready (or error).
 *
 * Body:
 *   { chatId: string, files: Record<string, string>, existingProjectId?: string }
 *
 * SSE event shape:
 *   data: { phase, url?, deploymentId?, projectId?, projectName?, errorMessage? }
 */

import type { ActionFunctionArgs } from 'react-router';
import { z } from 'zod';
import { withSecurity } from '~/lib/security';
import { AUTH_PRESETS } from '~/lib/security-config';
import { createScopedLogger } from '~/utils/logger';
import { deployToVercel } from '~/lib/services/auto-deploy-service';
import { db, schema } from '~/lib/.server/db';
import { eq, and } from 'drizzle-orm';

const logger = createScopedLogger('ApiAutoDeploy');

const requestSchema = z.object({
  chatId: z.string().min(1).max(200),
  files: z.record(z.string(), z.string()),
  existingProjectId: z.string().optional(),
});

async function autoDeployAction({ request }: ActionFunctionArgs) {
  const token = process.env.VERCEL_API_TOKEN;

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Deployment not configured — VERCEL_API_TOKEN is not set' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { chatId, files, existingProjectId } = parsed.data;

  logger.info(`Auto-deploy requested — chatId=${chatId}, files=${Object.keys(files).length}`);

  // -------------------------------------------------------------------
  // Build SSE stream
  // -------------------------------------------------------------------
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  const send = (data: Record<string, unknown>) => {
    const line = `data: ${JSON.stringify(data)}\n\n`;

    writer.write(encoder.encode(line)).catch(() => {});
  };

  const abortController = new AbortController();

  request.signal.addEventListener('abort', () => {
    abortController.abort();
  });

  // Run deployment in background — SSE stream stays open until done
  (async () => {
    try {
      let deploymentDbId: string | null = null;

      // Upsert a deployment row in 'uploading' state
      try {
        const existing = await db
          .select()
          .from(schema.deployments)
          .where(
            and(
              eq(schema.deployments.chatId, chatId),
              eq(schema.deployments.provider, 'vercel'),
            ),
          )
          .orderBy(schema.deployments.createdAt)
          .limit(1);

        if (existing.length > 0) {
          deploymentDbId = existing[0].id;
          await db
            .update(schema.deployments)
            .set({ state: 'uploading', errorMessage: null, updatedAt: new Date().toISOString() })
            .where(eq(schema.deployments.id, deploymentDbId));
        } else {
          const newId = `dep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          deploymentDbId = newId;
          await db.insert(schema.deployments).values({
            id: newId,
            chatId,
            provider: 'vercel',
            state: 'uploading',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (dbErr) {
        logger.warn('DB upsert failed (non-fatal):', dbErr);
      }

      const result = await deployToVercel({
        token,
        chatId,
        files,
        existingProjectId,
        signal: abortController.signal,
        onStatus: (update) => {
          send(update as unknown as Record<string, unknown>);
          logger.info(`Deploy phase: ${update.phase}`, update.url ?? '');

          // Keep DB in sync with each phase change
          if (deploymentDbId) {
            const dbUpdate: Record<string, string | null> = {
              state: update.phase,
              updatedAt: new Date().toISOString(),
            };

            if (update.deploymentId) {
              dbUpdate.deploymentId = update.deploymentId;
            }

            if (update.projectId) {
              dbUpdate.projectId = update.projectId;
            }

            if (update.projectName) {
              dbUpdate.projectName = update.projectName;
            }

            if (update.url) {
              dbUpdate.url = update.url;
            }

            db.update(schema.deployments)
              .set(dbUpdate)
              .where(eq(schema.deployments.id, deploymentDbId))
              .catch((e) => logger.warn('DB phase update failed:', e));
          }
        },
      });

      // Persist final state
      if (deploymentDbId) {
        await db
          .update(schema.deployments)
          .set({
            state: 'ready',
            url: result.url,
            deploymentId: result.deploymentId,
            projectId: result.projectId,
            projectName: result.projectName,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.deployments.id, deploymentDbId))
          .catch((e) => logger.warn('DB final update failed:', e));
      }

      logger.info(`Auto-deploy complete: ${result.url}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deployment failed';
      logger.error('Auto-deploy failed:', message);
      send({ phase: 'error', errorMessage: message });

      // Persist error state
      try {
        await db
          .update(schema.deployments)
          .set({ state: 'error', errorMessage: message, updatedAt: new Date().toISOString() })
          .where(eq(schema.deployments.chatId, chatId));
      } catch (dbErr) {
        logger.warn('DB error update failed:', dbErr);
      }
    } finally {
      writer.close().catch(() => {});
    }
  })();

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

export const action = withSecurity(autoDeployAction, {
  allowedMethods: ['POST'],
  auth: AUTH_PRESETS.public,
});
