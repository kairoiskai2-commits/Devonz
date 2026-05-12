import type { ActionFunctionArgs } from 'react-router';
import { createScopedLogger } from '~/utils/logger';
import { withSecurity } from '~/lib/security';
import { successResponse, errorResponse } from '~/lib/api/responses';
import { AUTH_PRESETS } from '~/lib/security-config';

const logger = createScopedLogger('VerifyProvider');

const TIMEOUT_MS = 10_000;

interface VerifyResult {
  valid: boolean;
  message: string;
  credits?: number;
  creditsUsed?: number;
  models?: number;
  rateLimit?: string;
  label?: string;
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function verifyOpenRouter(apiKey: string): Promise<VerifyResult> {
  const res = await fetchWithTimeout('https://openrouter.ai/api/v1/auth/key', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    if (res.status === 401) return { valid: false, message: 'Invalid API key — check openrouter.ai/settings/keys' };

    return { valid: false, message: `OpenRouter returned HTTP ${res.status}` };
  }

  const data = (await res.json()) as {
    data?: {
      label?: string;
      usage?: number;
      limit?: number | null;
      is_free_tier?: boolean;
      rate_limit?: { requests: number; interval: string };
    };
  };

  const d = data.data;
  const credits = d?.limit != null ? d.limit - (d.usage ?? 0) : undefined;

  return {
    valid: true,
    message: d?.is_free_tier ? 'Free tier — no credits required for :free models' : `${credits?.toFixed(4) ?? '?'} credits remaining`,
    credits,
    creditsUsed: d?.usage,
    label: d?.label,
    rateLimit: d?.rate_limit ? `${d.rate_limit.requests} req / ${d.rate_limit.interval}` : undefined,
  };
}

async function verifyOpenAICompatible(
  apiKey: string,
  modelsUrl: string,
  headerStyle: 'bearer' | 'x-api-key' = 'bearer',
): Promise<VerifyResult> {
  const headers: Record<string, string> =
    headerStyle === 'x-api-key' ? { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' } : { Authorization: `Bearer ${apiKey}` };

  const res = await fetchWithTimeout(modelsUrl, { headers });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) return { valid: false, message: 'Invalid API key' };

    return { valid: false, message: `Provider returned HTTP ${res.status}` };
  }

  const data = (await res.json()) as { data?: unknown[]; models?: unknown[] };
  const count = (data.data ?? data.models ?? []).length;

  return { valid: true, message: `Connected — ${count} model${count !== 1 ? 's' : ''} available`, models: count };
}

async function verifyGoogle(apiKey: string): Promise<VerifyResult> {
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(apiKey)}`;
  const res = await fetchWithTimeout(url, {});

  if (!res.ok) {
    if (res.status === 400 || res.status === 401 || res.status === 403) return { valid: false, message: 'Invalid API key' };

    return { valid: false, message: `Google AI returned HTTP ${res.status}` };
  }

  const data = (await res.json()) as { models?: unknown[] };
  const count = data.models?.length ?? 0;

  return { valid: true, message: `Connected — ${count} model${count !== 1 ? 's' : ''} available`, models: count };
}

async function verifyHuggingFace(apiKey: string): Promise<VerifyResult> {
  const res = await fetchWithTimeout('https://huggingface.co/api/whoami', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    if (res.status === 401) return { valid: false, message: 'Invalid API key' };

    return { valid: false, message: `HuggingFace returned HTTP ${res.status}` };
  }

  const data = (await res.json()) as { name?: string; type?: string };

  return { valid: true, message: `Authenticated as ${data.name ?? 'unknown'} (${data.type ?? 'user'})`, label: data.name };
}

async function verifyNoKey(providerName: string, pingUrl: string): Promise<VerifyResult> {
  try {
    const res = await fetchWithTimeout(pingUrl, {});

    if (res.ok || res.status === 404) {
      return { valid: true, message: `${providerName} is available — no API key required` };
    }

    return { valid: true, message: `${providerName} is available (no key needed)` };
  } catch {
    return { valid: true, message: `${providerName} — no API key required (could not ping, may still work)` };
  }
}

const PROVIDER_VERIFIERS: Record<string, (key: string) => Promise<VerifyResult>> = {
  OpenRouter: verifyOpenRouter,
  Anthropic: (key) => verifyOpenAICompatible(key, 'https://api.anthropic.com/v1/models', 'x-api-key'),
  OpenAI: (key) => verifyOpenAICompatible(key, 'https://api.openai.com/v1/models'),
  Google: verifyGoogle,
  Groq: (key) => verifyOpenAICompatible(key, 'https://api.groq.com/openai/v1/models'),
  Mistral: (key) => verifyOpenAICompatible(key, 'https://api.mistral.ai/v1/models'),
  Cohere: (key) => verifyOpenAICompatible(key, 'https://api.cohere.com/v2/models'),
  Cerebras: (key) => verifyOpenAICompatible(key, 'https://api.cerebras.ai/v1/models'),
  Together: (key) => verifyOpenAICompatible(key, 'https://api.together.xyz/v1/models'),
  Fireworks: (key) => verifyOpenAICompatible(key, 'https://api.fireworks.ai/inference/v1/models'),
  Perplexity: (key) => verifyOpenAICompatible(key, 'https://api.perplexity.ai/models'),
  HuggingFace: verifyHuggingFace,
  xAI: (key) => verifyOpenAICompatible(key, 'https://api.x.ai/v1/models'),
  Deepseek: (key) => verifyOpenAICompatible(key, 'https://api.deepseek.com/v1/models'),
  Moonshot: (key) => verifyOpenAICompatible(key, 'https://api.moonshot.cn/v1/models'),
  Hyperbolic: (key) => verifyOpenAICompatible(key, 'https://api.hyperbolic.xyz/v1/models'),
  Github: (key) => verifyOpenAICompatible(key, 'https://models.inference.ai.azure.com/models'),
  Chutes: (key) => verifyOpenAICompatible(key, 'https://llm.chutes.ai/v1/models'),
  SambaNova: (key) => verifyOpenAICompatible(key, 'https://api.sambanova.ai/v1/models'),
  GLHF: (key) => verifyOpenAICompatible(key, 'https://glhf.chat/api/openai/v1/models'),
  Pollinations: () => verifyNoKey('Pollinations', 'https://text.pollinations.ai/'),
  Transformers: () => Promise.resolve({ valid: true, message: 'Runs locally in-browser — no key required' }),
  Ollama: () => verifyNoKey('Ollama', 'http://localhost:11434/api/tags'),
  LMStudio: () => verifyNoKey('LMStudio', 'http://localhost:1234/v1/models'),
};

async function verifyProviderAction({ request }: ActionFunctionArgs) {
  let body: { provider?: string; apiKey?: string };

  try {
    body = (await request.json()) as { provider?: string; apiKey?: string };
  } catch {
    return errorResponse('Request body must be valid JSON', 400);
  }

  const { provider, apiKey } = body;

  if (!provider || typeof provider !== 'string') {
    return errorResponse('Missing required field: provider', 400);
  }

  const verifier = PROVIDER_VERIFIERS[provider];

  if (!verifier) {
    return errorResponse(`Unknown provider: ${provider}`, 400);
  }

  const needsKey = !['Pollinations', 'Transformers', 'Ollama', 'LMStudio'].includes(provider);

  if (needsKey && (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0)) {
    return errorResponse(`Provider "${provider}" requires an API key`, 400);
  }

  try {
    logger.info(`Verifying provider: ${provider}`);
    const result = await verifier(apiKey?.trim() ?? '');
    logger.info(`Verification result for ${provider}: valid=${result.valid}`);

    return successResponse(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Verification failed for ${provider}: ${message}`);

    if (message.includes('AbortError') || message.includes('abort') || message.includes('timeout')) {
      return successResponse<VerifyResult>({ valid: false, message: `${provider} did not respond within ${TIMEOUT_MS / 1000}s — check if the API is reachable` });
    }

    return successResponse<VerifyResult>({ valid: false, message: `Could not reach ${provider}: ${message}` });
  }
}

export const action = withSecurity(verifyProviderAction, {
  auth: AUTH_PRESETS.authenticated,
  allowedMethods: ['POST'],
  rateLimit: false,
});
