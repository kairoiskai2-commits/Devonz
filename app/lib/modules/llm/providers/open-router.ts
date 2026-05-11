import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('OpenRouter');

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

interface OpenRouterModel {
  name: string;
  id: string;
  context_length: number;
  pricing: {
    prompt: number;
    completion: number;
  };
}

interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

export default class OpenRouterProvider extends BaseProvider {
  name = 'OpenRouter';
  getApiKeyLink = 'https://openrouter.ai/settings/keys';

  config = {
    apiTokenKey: 'OPEN_ROUTER_API_KEY',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'anthropic/claude-3.5-sonnet',
      label: 'Claude 3.5 Sonnet',
      provider: 'OpenRouter',
      maxTokenAllowed: 200000,
    },
    {
      name: 'openai/gpt-4o',
      label: 'GPT-4o',
      provider: 'OpenRouter',
      maxTokenAllowed: 128000,
    },
    {
      name: 'google/gemini-2.0-flash-001',
      label: 'Gemini 2.0 Flash',
      provider: 'OpenRouter',
      maxTokenAllowed: 1000000,
    },
    {
      name: 'meta-llama/llama-4-maverick',
      label: 'Llama 4 Maverick',
      provider: 'OpenRouter',
      maxTokenAllowed: 524288,
    },
    {
      name: 'deepseek/deepseek-chat-v3-0324',
      label: 'DeepSeek V3',
      provider: 'OpenRouter',
      maxTokenAllowed: 163840,
    },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    _settings?: IProviderSetting,
    serverEnv: Record<string, string | undefined> = {},
  ): Promise<ModelInfo[]> {
    try {
      const apiKey =
        apiKeys?.[this.name] ||
        serverEnv?.['OPEN_ROUTER_API_KEY'] ||
        process?.env?.['OPEN_ROUTER_API_KEY'];

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
        headers,
        signal: this.createTimeoutSignal(8000),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter models API returned ${response.status}`);
      }

      const data = (await response.json()) as OpenRouterModelsResponse;

      return data.data
        .filter((m) => m.id && m.context_length)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((m) => {
          const contextWindow = m.context_length || 32000;
          const maxAllowed = 1000000;
          const finalContext = Math.min(contextWindow, maxAllowed);

          const promptPrice = m.pricing.prompt * 1_000_000;
          const completionPrice = m.pricing.completion * 1_000_000;
          const isFree = promptPrice === 0 && completionPrice === 0;

          const promptCost = promptPrice.toFixed(2);
          const completionCost = completionPrice.toFixed(2);
          const contextLabel =
            finalContext >= 1000000
              ? `${Math.floor(finalContext / 1000000)}M`
              : `${Math.floor(finalContext / 1000)}k`;

          const freeTag = isFree ? ' [FREE]' : '';

          return {
            name: m.id,
            label: `${m.name}${freeTag} - in:$${promptCost} out:$${completionCost} - context ${contextLabel}`,
            provider: this.name,
            maxTokenAllowed: finalContext,
            isFree,
          };
        });
    } catch (error) {
      logger.error('Error getting OpenRouter models:', error);
      return [];
    }
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'OPEN_ROUTER_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider. Please add your OpenRouter API key in Settings.`);
    }

    const openai = createOpenAI({
      baseURL: OPENROUTER_BASE_URL,
      apiKey,
      headers: {
        'HTTP-Referer': 'https://veyra.app',
        'X-Title': 'Veyra',
      },
    });

    return openai(model);
  }
}
