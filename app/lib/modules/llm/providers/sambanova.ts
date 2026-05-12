import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const SAMBANOVA_BASE_URL = 'https://api.sambanova.ai/v1';

export default class SambanovaProvider extends BaseProvider {
  name = 'SambaNova';
  getApiKeyLink = 'https://cloud.sambanova.ai/apis';
  labelForGetApiKey = 'Get Free API Key';
  icon = 'i-ph:lightning';

  config = {
    apiTokenKey: 'SAMBANOVA_API_KEY',
    baseUrl: SAMBANOVA_BASE_URL,
  };

  staticModels: ModelInfo[] = [
    {
      name: 'Meta-Llama-3.3-70B-Instruct',
      label: 'Llama 3.3 70B (SambaNova)',
      provider: 'SambaNova',
      maxTokenAllowed: 131_072,
      maxCompletionTokens: 8_192,
      isFree: true,
    },
    {
      name: 'Meta-Llama-3.1-405B-Instruct',
      label: 'Llama 3.1 405B (SambaNova)',
      provider: 'SambaNova',
      maxTokenAllowed: 16_384,
      isFree: true,
    },
    {
      name: 'Meta-Llama-3.1-8B-Instruct',
      label: 'Llama 3.1 8B (SambaNova)',
      provider: 'SambaNova',
      maxTokenAllowed: 131_072,
      isFree: true,
    },
    {
      name: 'DeepSeek-R1',
      label: 'DeepSeek R1 (SambaNova)',
      provider: 'SambaNova',
      maxTokenAllowed: 32_768,
      isFree: true,
    },
    {
      name: 'DeepSeek-V3-0324',
      label: 'DeepSeek V3 (SambaNova)',
      provider: 'SambaNova',
      maxTokenAllowed: 32_768,
      maxCompletionTokens: 8_192,
      isFree: true,
    },
    {
      name: 'Qwen3-32B',
      label: 'Qwen3 32B (SambaNova)',
      provider: 'SambaNova',
      maxTokenAllowed: 32_768,
      isFree: true,
    },
    {
      name: 'Llama-4-Scout-17B-16E-Instruct',
      label: 'Llama 4 Scout 17B (SambaNova)',
      provider: 'SambaNova',
      maxTokenAllowed: 131_072,
      isFree: true,
    },
    {
      name: 'Llama-4-Maverick-17B-128E-Instruct',
      label: 'Llama 4 Maverick 17B (SambaNova)',
      provider: 'SambaNova',
      maxTokenAllowed: 131_072,
      isFree: true,
    },
  ];

  getModelInstance(options: {
    model: string;
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey, baseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as Record<string, string | undefined>,
      defaultBaseUrlKey: 'SAMBANOVA_API_BASE_URL',
      defaultApiTokenKey: 'SAMBANOVA_API_KEY',
    });

    if (!apiKey) {
      throw new Error(
        `SambaNova API key is not set. Get a free key at ${this.getApiKeyLink} and add it in Settings → Providers → SambaNova.`,
      );
    }

    const openai = createOpenAI({
      baseURL: baseUrl || SAMBANOVA_BASE_URL,
      apiKey,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return openai(model);
  }
}
