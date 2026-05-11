import { generateId, generateText } from 'ai';
import { eq } from 'drizzle-orm';
import type { ActionFunctionArgs } from 'react-router';
import { db, schema } from '~/lib/.server/db';
import { auth } from '~/lib/.server/auth';
import { getApiKeysFromCookie, getProviderSettingsFromCookie } from '~/lib/api/cookies';
import { LLMManager } from '~/lib/modules/llm/manager';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.background-chat');

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const sessionData = await auth.api.getSession({ headers: request.headers });

  if (!sessionData?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = getApiKeysFromCookie(cookieHeader);
  const providerSettings = getProviderSettingsFromCookie(cookieHeader);

  let body: {
    messages: Array<{ role: string; content: string }>;
    model?: string;
    provider?: string;
    chatId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const jobId = generateId();

  await db.insert(schema.bgChatJobs).values({
    id: jobId,
    userId: sessionData.user.id,
    requestPayload: body,
    status: 'pending',
  });

  // Fire-and-forget: process in the background without blocking the response.
  // Node.js event loop keeps running after the response is sent, so the
  // AI generation continues even if the browser tab is closed.
  processJobInBackground(jobId, body, apiKeys, providerSettings as Record<string, unknown>).catch(
    (err) => logger.error('Background job failed:', err),
  );

  return new Response(JSON.stringify({ success: true, jobId }), {
    status: 202,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function processJobInBackground(
  jobId: string,
  body: {
    messages: Array<{ role: string; content: string }>;
    model?: string;
    provider?: string;
  },
  apiKeys: Record<string, string>,
  providerSettings: Record<string, unknown>,
) {
  try {
    await db
      .update(schema.bgChatJobs)
      .set({ status: 'running', updatedAt: new Date().toISOString() })
      .where(eq(schema.bgChatJobs.id, jobId));

    const llmManager = LLMManager.getInstance();
    const providerName = body.provider ?? 'Pollinations';
    const modelName = body.model ?? 'openai';

    const provider = llmManager.getProvider(providerName) ?? llmManager.getDefaultProvider();
    const modelInstance = provider.getModelInstance({
      model: modelName,
      serverEnv: {},
      apiKeys,
      providerSettings: providerSettings as Record<string, { enabled: boolean }>,
    });

    const coreMessages = body.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant' || m.role === 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }));

    const result = await generateText({
      model: modelInstance,
      messages: coreMessages,
      maxTokens: 8192,
    });

    await db
      .update(schema.bgChatJobs)
      .set({
        status: 'done',
        result: result.text,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.bgChatJobs.id, jobId));

    logger.info(`Background job ${jobId} completed (${result.usage?.totalTokens ?? 0} tokens)`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Background job ${jobId} error:`, message);

    await db
      .update(schema.bgChatJobs)
      .set({ status: 'error', error: message, updatedAt: new Date().toISOString() })
      .where(eq(schema.bgChatJobs.id, jobId));
  }
}
