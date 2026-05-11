import { BaseProvider, getOpenAILikeModel } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createScopedLogger } from '~/utils/logger';
import { KeyPool, parseKeyList } from '~/lib/modules/llm/key-pool';

const logger = createScopedLogger('OpenAILike');

/**
 * Singleton KeyPool for OpenAILike — built lazily from environment variables.
 * Exported so stream-text.ts can call reportError / reportSuccess for key rotation.
 */
let _keyPool: KeyPool | null = null;

export function getOpenAILikeKeyPool(
  apiKeys?: Record<string, string>,
  serverEnv: Record<string, string | undefined> = {},
): KeyPool | null {
  const multiRaw =
    apiKeys?.['OPENAI_LIKE_API_KEYS'] ||
    serverEnv['OPENAI_LIKE_API_KEYS'] ||
    process?.env?.OPENAI_LIKE_API_KEYS;

  const singleKey =
    apiKeys?.['OpenAILike'] ||
    serverEnv['OPENAI_LIKE_API_KEY'] ||
    process?.env?.OPENAI_LIKE_API_KEY;

  const keys: string[] = multiRaw ? parseKeyList(multiRaw) : singleKey ? [singleKey] : [];

  if (keys.length === 0) {
    return null;
  }

  // Rebuild pool only if key count changed (e.g. secret updated at runtime)
  if (!_keyPool || _keyPool.size !== keys.length) {
    _keyPool = new KeyPool(keys);
  }

  return _keyPool;
}

export default class OpenAILikeProvider extends BaseProvider {
  name = 'OpenAILike';
  getApiKeyLink = undefined;

  config = {
    baseUrlKey: 'OPENAI_LIKE_API_BASE_URL',
    apiTokenKey: 'OPENAI_LIKE_API_KEY',
    modelsKey: 'OPENAI_LIKE_API_MODELS',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'claude-opus-4-7',
      label: 'Claude Opus 4.7 (Pekpik)',
      provider: 'OpenAILike',
      maxTokenAllowed: 200000,
    },
    {
      name: 'smart-chat',
      label: 'Smart Chat (Pekpik)',
      provider: 'OpenAILike',
      maxTokenAllowed: 200000,
    },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string | undefined> = {},
  ): Promise<ModelInfo[]> {
    const baseUrl =
      settings?.baseUrl ||
      serverEnv['OPENAI_LIKE_API_BASE_URL'] ||
      process?.env?.OPENAI_LIKE_API_BASE_URL;

    const pool = getOpenAILikeKeyPool(apiKeys, serverEnv);

    if (!baseUrl || !pool) {
      logger.warn(`OpenAILike: Missing ${!baseUrl ? 'base URL' : 'API key(s)'} — skipping dynamic model fetch`);
      return [];
    }

    const apiKey = pool.getBestKey();

    try {
      const response = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: this.createTimeoutSignal(5000),
      });

      if (!response.ok) {
        pool.reportError(apiKey, response.status);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const res = (await response.json()) as { data: Array<{ id: string }> };
      pool.reportSuccess(apiKey);

      const staticNames = new Set(this.staticModels.map((m) => m.name));

      return res.data
        .filter((m) => !staticNames.has(m.id))
        .map((model) => ({
          name: model.id,
          label: model.id,
          provider: this.name,
          maxTokenAllowed: 8000,
        }));
    } catch (error) {
      logger.debug(`${this.name}: /models endpoint unavailable, falling back to OPENAI_LIKE_API_MODELS`, error);

      const modelsEnv =
        serverEnv['OPENAI_LIKE_API_MODELS'] ||
        process?.env?.OPENAI_LIKE_API_MODELS ||
        (settings as any)?.OPENAI_LIKE_API_MODELS;

      if (modelsEnv) {
        return this._parseModelsFromEnv(modelsEnv as string);
      }

      return [];
    }
  }

  private _parseModelsFromEnv(modelsEnv: string): ModelInfo[] {
    if (!modelsEnv) {
      return [];
    }

    try {
      const staticNames = new Set(this.staticModels.map((m) => m.name));
      const models: ModelInfo[] = [];

      for (const entry of modelsEnv.split(';')) {
        const trimmed = entry.trim();

        if (!trimmed) {
          continue;
        }

        const [modelPath, limitStr] = trimmed.split(':');

        if (!modelPath) {
          continue;
        }

        const modelName = modelPath.trim();

        if (staticNames.has(modelName)) {
          continue;
        }

        const limit = limitStr ? parseInt(limitStr.trim(), 10) : 8000;

        models.push({
          name: modelName,
          label: this._generateModelLabel(modelName),
          provider: this.name,
          maxTokenAllowed: isNaN(limit) ? 8000 : limit,
        });
      }

      logger.debug(`${this.name}: Parsed env models:`, models);

      return models;
    } catch (error) {
      logger.error(`${this.name}: Error parsing OPENAI_LIKE_API_MODELS:`, error);
      return [];
    }
  }

  private _generateModelLabel(modelPath: string): string {
    const parts = modelPath.split('/');
    const lastPart = parts[parts.length - 1];

    let label = lastPart
      .replace(/^accounts\//, '')
      .replace(/^fireworks\/models\//, '')
      .replace(/^models\//, '')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace(/\s+/g, '-');

    if (!label.includes('Fireworks') && !label.includes('OpenAI')) {
      label += ' (OpenAI Compatible)';
    }

    return label;
  }

  getModelInstance(options: {
    model: string;
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
    /** Specific key to use — set by key-rotation retry logic in stream-text.ts */
    _overrideKey?: string;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;
    const sEnv = serverEnv as Record<string, string | undefined> | undefined;

    const baseUrl =
      providerSettings?.[this.name]?.baseUrl ||
      sEnv?.['OPENAI_LIKE_API_BASE_URL'] ||
      process?.env?.OPENAI_LIKE_API_BASE_URL;

    if (!baseUrl) {
      throw new Error(`Missing OPENAI_LIKE_API_BASE_URL for ${this.name} provider`);
    }

    let apiKey = options._overrideKey;

    if (!apiKey) {
      const pool = getOpenAILikeKeyPool(apiKeys, sEnv ?? {});

      if (!pool) {
        throw new Error(`Missing API key(s) for ${this.name} provider`);
      }

      apiKey = pool.getBestKey();
    }

    logger.debug(`OpenAILike: using key ...${apiKey.slice(-6)} for model ${model}`);

    return getOpenAILikeModel(baseUrl, apiKey, model);
  }
}
