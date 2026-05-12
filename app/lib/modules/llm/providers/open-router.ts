import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createScopedLogger } from '~/utils/logger';
import { LLMManager } from '~/lib/modules/llm/manager';

const logger = createScopedLogger('OpenRouter');

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';
const OPENROUTER_MODELS_URL = `${OPENROUTER_API_BASE}/models`;
const SITE_URL = 'https://veyra.app';
const SITE_NAME = 'Veyra';

const MODELS_FETCH_TIMEOUT_MS = 12_000;
const MAX_FETCH_RETRIES = 2;
const RETRY_DELAY_MS = 600;

interface OpenRouterModelPricing {
  prompt: string | number;
  completion: string | number;
  image?: string | number;
  request?: string | number;
}

interface OpenRouterModelArchitecture {
  modality?: string;
  tokenizer?: string;
  instruct_type?: string | null;
}

interface OpenRouterModelTopProvider {
  context_length?: number;
  max_completion_tokens?: number | null;
  is_moderated?: boolean;
}

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  architecture?: OpenRouterModelArchitecture;
  pricing: OpenRouterModelPricing;
  top_provider?: OpenRouterModelTopProvider;
  per_request_limits?: Record<string, unknown> | null;
}

interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

function toFloat(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0;
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(n) ? 0 : n;
}

function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(0)}M ctx`;
  if (tokens >= 1_000) return `${Math.floor(tokens / 1_000)}k ctx`;
  return `${tokens} ctx`;
}

function formatPrice(pricePerToken: number): string {
  const perMillion = pricePerToken * 1_000_000;
  if (perMillion === 0) return 'free';
  if (perMillion < 0.01) return `$${perMillion.toFixed(4)}/M`;
  if (perMillion < 1) return `$${perMillion.toFixed(3)}/M`;
  return `$${perMillion.toFixed(2)}/M`;
}

function buildModelLabel(model: OpenRouterModel, isFree: boolean): string {
  const name = model.name || model.id;
  const ctx = formatContextWindow(model.context_length);
  const inputPrice = toFloat(model.pricing.prompt);
  const outputPrice = toFloat(model.pricing.completion);

  if (isFree) {
    return `${name} [FREE] — ${ctx}`;
  }

  const inLabel = formatPrice(inputPrice);
  const outLabel = formatPrice(outputPrice);
  return `${name} — in: ${inLabel} / out: ${outLabel} — ${ctx}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  headers: Record<string, string>,
  retries: number = MAX_FETCH_RETRIES,
): Promise<OpenRouterModel[]> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAY_MS * attempt);
      logger.info(`Retrying model fetch (attempt ${attempt + 1}/${retries + 1})...`);
    }

    try {
      const signal = AbortSignal.timeout(MODELS_FETCH_TIMEOUT_MS);
      const response = await fetch(url, { headers, signal });

      if (response.status === 401 || response.status === 403) {
        throw new Error(`OpenRouter auth failed (${response.status}) — check your API key`);
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : RETRY_DELAY_MS * 2;
        logger.warn(`Rate limited — waiting ${waitMs}ms before retry`);
        await sleep(waitMs);
        continue;
      }

      if (!response.ok) {
        throw new Error(`OpenRouter models API returned HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as OpenRouterModelsResponse;

      if (!Array.isArray(data?.data)) {
        throw new Error('OpenRouter models response has unexpected shape (missing data array)');
      }

      return data.data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (lastError.message.includes('auth failed') || lastError.message.includes('API key')) {
        throw lastError;
      }

      logger.warn(`Model fetch attempt ${attempt + 1} failed: ${lastError.message}`);
    }
  }

  throw lastError;
}

export default class OpenRouterProvider extends BaseProvider {
  name = 'OpenRouter';
  getApiKeyLink = 'https://openrouter.ai/settings/keys';
  labelForGetApiKey = 'Get OpenRouter API Key';
  icon = 'i-simple-icons-openai';

  config = {
    apiTokenKey: 'OPEN_ROUTER_API_KEY',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'anthropic/claude-opus-4',
      label: 'Claude Opus 4 (Anthropic)',
      provider: 'OpenRouter',
      maxTokenAllowed: 200_000,
      maxCompletionTokens: 32_000,
    },
    {
      name: 'anthropic/claude-sonnet-4-5',
      label: 'Claude Sonnet 4.5 (Anthropic)',
      provider: 'OpenRouter',
      maxTokenAllowed: 200_000,
      maxCompletionTokens: 16_000,
    },
    {
      name: 'anthropic/claude-3.5-sonnet',
      label: 'Claude 3.5 Sonnet (Anthropic)',
      provider: 'OpenRouter',
      maxTokenAllowed: 200_000,
      maxCompletionTokens: 8_192,
    },
    {
      name: 'anthropic/claude-3.7-sonnet',
      label: 'Claude 3.7 Sonnet (Anthropic)',
      provider: 'OpenRouter',
      maxTokenAllowed: 200_000,
      maxCompletionTokens: 16_000,
    },
    {
      name: 'anthropic/claude-3-haiku',
      label: 'Claude 3 Haiku · Fast (Anthropic)',
      provider: 'OpenRouter',
      maxTokenAllowed: 200_000,
      maxCompletionTokens: 4_096,
    },
    {
      name: 'openai/gpt-4o',
      label: 'GPT-4o (OpenAI)',
      provider: 'OpenRouter',
      maxTokenAllowed: 128_000,
      maxCompletionTokens: 16_384,
    },
    {
      name: 'openai/gpt-4o-mini',
      label: 'GPT-4o Mini · Fast (OpenAI)',
      provider: 'OpenRouter',
      maxTokenAllowed: 128_000,
      maxCompletionTokens: 16_384,
    },
    {
      name: 'openai/o3',
      label: 'o3 · Reasoning (OpenAI)',
      provider: 'OpenRouter',
      maxTokenAllowed: 200_000,
      maxCompletionTokens: 100_000,
    },
    {
      name: 'openai/o4-mini',
      label: 'o4-mini · Reasoning (OpenAI)',
      provider: 'OpenRouter',
      maxTokenAllowed: 200_000,
      maxCompletionTokens: 100_000,
    },
    {
      name: 'google/gemini-2.5-pro-preview',
      label: 'Gemini 2.5 Pro Preview (Google)',
      provider: 'OpenRouter',
      maxTokenAllowed: 1_000_000,
      maxCompletionTokens: 65_536,
    },
    {
      name: 'google/gemini-2.5-flash-preview',
      label: 'Gemini 2.5 Flash Preview · Fast (Google)',
      provider: 'OpenRouter',
      maxTokenAllowed: 1_000_000,
      maxCompletionTokens: 65_536,
    },
    {
      name: 'google/gemini-2.0-flash-001',
      label: 'Gemini 2.0 Flash (Google)',
      provider: 'OpenRouter',
      maxTokenAllowed: 1_000_000,
      maxCompletionTokens: 8_192,
    },
    {
      name: 'deepseek/deepseek-chat-v3-0324',
      label: 'DeepSeek Chat V3 (DeepSeek)',
      provider: 'OpenRouter',
      maxTokenAllowed: 163_840,
      maxCompletionTokens: 8_192,
    },
    {
      name: 'deepseek/deepseek-r1',
      label: 'DeepSeek R1 · Reasoning (DeepSeek)',
      provider: 'OpenRouter',
      maxTokenAllowed: 163_840,
      maxCompletionTokens: 32_000,
    },
    {
      name: 'meta-llama/llama-4-maverick',
      label: 'Llama 4 Maverick (Meta)',
      provider: 'OpenRouter',
      maxTokenAllowed: 524_288,
      maxCompletionTokens: 16_384,
    },
    {
      name: 'meta-llama/llama-4-scout',
      label: 'Llama 4 Scout (Meta)',
      provider: 'OpenRouter',
      maxTokenAllowed: 524_288,
      maxCompletionTokens: 16_384,
    },
    {
      name: 'meta-llama/llama-3.3-70b-instruct',
      label: 'Llama 3.3 70B Instruct (Meta)',
      provider: 'OpenRouter',
      maxTokenAllowed: 131_072,
      maxCompletionTokens: 8_192,
    },
    {
      name: 'mistralai/mistral-large-2411',
      label: 'Mistral Large 2411 (Mistral)',
      provider: 'OpenRouter',
      maxTokenAllowed: 131_072,
      maxCompletionTokens: 8_192,
    },
    {
      name: 'mistralai/devstral-small-2505',
      label: 'Devstral Small · Coding (Mistral)',
      provider: 'OpenRouter',
      maxTokenAllowed: 131_072,
      maxCompletionTokens: 8_192,
    },
    {
      name: 'qwen/qwen3-235b-a22b',
      label: 'Qwen3 235B A22B (Alibaba)',
      provider: 'OpenRouter',
      maxTokenAllowed: 40_960,
      maxCompletionTokens: 16_384,
    },
    {
      name: 'qwen/qwen3-72b',
      label: 'Qwen3 72B (Alibaba)',
      provider: 'OpenRouter',
      maxTokenAllowed: 40_960,
      maxCompletionTokens: 16_384,
    },
    {
      name: 'x-ai/grok-3-beta',
      label: 'Grok 3 Beta (xAI)',
      provider: 'OpenRouter',
      maxTokenAllowed: 131_072,
      maxCompletionTokens: 131_072,
    },
    {
      name: 'x-ai/grok-3-mini-beta',
      label: 'Grok 3 Mini Beta · Fast (xAI)',
      provider: 'OpenRouter',
      maxTokenAllowed: 131_072,
      maxCompletionTokens: 131_072,
    },
    {
      name: 'meta-llama/llama-3.1-8b-instruct:free',
      label: 'Llama 3.1 8B [FREE] (Meta)',
      provider: 'OpenRouter',
      maxTokenAllowed: 131_072,
      isFree: true,
    },
    {
      name: 'google/gemma-3-27b-it:free',
      label: 'Gemma 3 27B [FREE] (Google)',
      provider: 'OpenRouter',
      maxTokenAllowed: 131_072,
      isFree: true,
    },
    {
      name: 'deepseek/deepseek-r1:free',
      label: 'DeepSeek R1 [FREE] (DeepSeek)',
      provider: 'OpenRouter',
      maxTokenAllowed: 163_840,
      isFree: true,
    },
    {
      name: 'mistralai/mistral-7b-instruct:free',
      label: 'Mistral 7B [FREE] (Mistral)',
      provider: 'OpenRouter',
      maxTokenAllowed: 32_768,
      isFree: true,
    },
    {
      name: 'meta-llama/llama-4-maverick:free',
      label: 'Llama 4 Maverick [FREE] (Meta)',
      provider: 'OpenRouter',
      maxTokenAllowed: 524_288,
      isFree: true,
    },
    {
      name: 'meta-llama/llama-4-scout:free',
      label: 'Llama 4 Scout [FREE] (Meta)',
      provider: 'OpenRouter',
      maxTokenAllowed: 327_680,
      isFree: true,
    },
  ];

  private resolveApiKey(
    apiKeys?: Record<string, string>,
    serverEnv?: Record<string, string | undefined>,
  ): string | undefined {
    const manager = LLMManager.getInstance();

    const candidates = [
      apiKeys?.[this.name],
      serverEnv?.['OPEN_ROUTER_API_KEY'],
      process?.env?.['OPEN_ROUTER_API_KEY'],
      manager.env?.['OPEN_ROUTER_API_KEY'],
    ];

    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }

    return undefined;
  }

  /**
   * Validate an OpenRouter API key.
   * Valid keys start with "sk-or-" and are at least 40 characters long.
   * Returns null when valid, or a human-readable error string when invalid.
   */
  private validateApiKey(key: string): string | null {
    const MIN_KEY_LENGTH = 40;

    if (key.length < MIN_KEY_LENGTH) {
      return (
        `The OpenRouter API key looks too short (${key.length} chars — expected at least ${MIN_KEY_LENGTH}). ` +
        `Please copy the full key from ${this.getApiKeyLink} and re-paste it in Settings → Providers → OpenRouter.`
      );
    }

    if (!key.startsWith('sk-or-') && !key.startsWith('sk-')) {
      logger.warn(
        `OpenRouter key doesn't start with the expected "sk-or-" prefix (got "${key.substring(0, 8)}..."). ` +
          `This may still work if it's a valid legacy key format, but double-check at ${this.getApiKeyLink}`,
      );
    }

    return null;
  }

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    _settings?: IProviderSetting,
    serverEnv: Record<string, string | undefined> = {},
  ): Promise<ModelInfo[]> {
    const apiKey = this.resolveApiKey(apiKeys, serverEnv);

    const headers: Record<string, string> = {
      'HTTP-Referer': SITE_URL,
      'X-Title': SITE_NAME,
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    try {
      const rawModels = await fetchWithRetry(OPENROUTER_MODELS_URL, headers);

      const MIN_CONTEXT_TOKENS = 1_024;

      const processed = rawModels
        .filter((m) => {
          if (!m.id || !m.name) return false;
          if ((m.context_length ?? 0) < MIN_CONTEXT_TOKENS) return false;

          const modality = m.architecture?.modality ?? '';
          if (modality && !modality.includes('text')) return false;

          return true;
        })
        .map((m): ModelInfo => {
          const inputPrice = toFloat(m.pricing?.prompt);
          const outputPrice = toFloat(m.pricing?.completion);
          const isFree = inputPrice === 0 && outputPrice === 0;

          const contextTokens = Math.min(m.context_length ?? 32_000, 2_000_000);
          const maxCompletion = m.top_provider?.max_completion_tokens ?? undefined;

          /*
         * Free models: never set maxCompletionTokens.
         * getCompletionTokenLimit() will cap them at FREE_MODEL_TOKEN_CAP (4 096)
         * regardless, but omitting it here avoids any accidental override.
         */
        return {
            name: m.id,
            label: buildModelLabel(m, isFree),
            provider: this.name,
            maxTokenAllowed: contextTokens,
            maxCompletionTokens: isFree ? undefined : (maxCompletion && maxCompletion > 0 ? maxCompletion : undefined),
            isFree,
          };
        })
        .sort((a, b) => {
          if (a.isFree && !b.isFree) return -1;
          if (!a.isFree && b.isFree) return 1;
          return a.label.localeCompare(b.label);
        });

      const staticIds = new Set(this.staticModels.map((m) => m.name));
      const dynamicOnly = processed.filter((m) => !staticIds.has(m.name));

      logger.info(
        `getDynamicModels: fetched ${rawModels.length} models → ${processed.length} valid → ${dynamicOnly.length} new (beyond static)`,
      );

      return dynamicOnly;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`getDynamicModels failed: ${msg}`);
      return [];
    }
  }

  getModelInstance(options: {
    model: string;
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv = {}, apiKeys, providerSettings } = options;

    const apiKey = this.resolveApiKey(apiKeys, serverEnv as Record<string, string | undefined>);

    logger.info(
      `getModelInstance — model="${model}" apiKey=${
        apiKey
          ? `present (${apiKey.length} chars, prefix="${apiKey.substring(0, 8)}...")`
          : 'MISSING'
      }`,
    );

    if (!apiKey) {
      throw new Error(
        `OpenRouter API key is not set. ` +
          `Go to Settings → Providers → OpenRouter and paste your key from ${this.getApiKeyLink}`,
      );
    }

    const keyError = this.validateApiKey(apiKey);

    if (keyError) {
      logger.error(`getModelInstance — invalid key: ${keyError}`);
      throw new Error(keyError);
    }

    const providerSetting = providerSettings?.[this.name];
    const customBaseUrl = providerSetting?.baseUrl?.trim();
    const baseUrl = customBaseUrl || OPENROUTER_API_BASE;

    /*
     * Set Authorization explicitly in `headers` as well as via `apiKey`.
     * Some versions of @ai-sdk/openai merge custom `headers` with their
     * defaults; others let custom headers shadow the auto-generated ones,
     * silently dropping `Authorization`.  Providing it in both places
     * guarantees the header is always present regardless of SDK behaviour.
     */
    const openai = createOpenAI({
      baseURL: baseUrl,
      apiKey,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME,
      },
    });

    return openai(model);
  }
}
