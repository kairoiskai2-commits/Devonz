import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const ARLI_BASE_URL = 'https://api.arliai.com/v1';

interface ArliModel {
  id: string;
  name?: string;
  context_length?: number;
}

export default class ArliAIProvider extends BaseProvider {
  name = 'ArliAI';
  getApiKeyLink = 'https://www.arliai.com/api-keys';
  labelForGetApiKey = 'Get Free API Key';
  icon = 'i-ph:lightning';

  config = {
    apiTokenKey: 'ARLI_API_KEY',
    baseUrlKey: 'ARLI_API_BASE_URL',
    baseUrl: ARLI_BASE_URL,
  };

  staticModels: ModelInfo[] = [
    { name: 'Meta-Llama-3.1-8B-Instruct', label: 'Llama 3.1 8B Instruct (ArliAI)', provider: 'ArliAI', maxTokenAllowed: 131072 },
    { name: 'Meta-Llama-3.1-70B-Instruct', label: 'Llama 3.1 70B Instruct (ArliAI)', provider: 'ArliAI', maxTokenAllowed: 131072 },
    { name: 'Meta-Llama-3.3-70B-Instruct', label: 'Llama 3.3 70B Instruct (ArliAI)', provider: 'ArliAI', maxTokenAllowed: 131072 },
    { name: 'Mistral-Nemo-12B-Instruct-2407', label: 'Mistral Nemo 12B (ArliAI)', provider: 'ArliAI', maxTokenAllowed: 131072 },
    { name: 'Qwen2.5-72B-Instruct', label: 'Qwen2.5 72B Instruct (ArliAI)', provider: 'ArliAI', maxTokenAllowed: 131072 },
    { name: 'Qwen2.5-Coder-32B-Instruct', label: 'Qwen2.5 Coder 32B (ArliAI)', provider: 'ArliAI', maxTokenAllowed: 131072 },
    { name: 'DeepSeek-R1-Distill-Llama-70B', label: 'DeepSeek R1 Distill 70B (ArliAI)', provider: 'ArliAI', maxTokenAllowed: 131072 },
    { name: 'gemma-3-27b-it', label: 'Gemma 3 27B (ArliAI)', provider: 'ArliAI', maxTokenAllowed: 131072 },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string | undefined> = {},
  ): Promise<ModelInfo[]> {
    const { apiKey, baseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: 'ARLI_API_BASE_URL',
      defaultApiTokenKey: 'ARLI_API_KEY',
    });

    if (!apiKey) {
      throw new Error('ArliAI requires an API key to fetch models');
    }

    const response = await fetch(`${baseUrl || ARLI_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: this.createTimeoutSignal(8000),
    });

    if (!response.ok) {
      throw new Error(`ArliAI models API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { data?: ArliModel[] } | ArliModel[];
    const models = Array.isArray(data) ? data : (data.data ?? []);
    const staticNames = new Set(this.staticModels.map((m) => m.name));

    return models
      .filter((m) => !staticNames.has(m.id))
      .map((m) => ({
        name: m.id,
        label: `${m.name ?? m.id} (ArliAI)`,
        provider: this.name,
        maxTokenAllowed: m.context_length ?? 131072,
      }));
  }

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
      defaultBaseUrlKey: 'ARLI_API_BASE_URL',
      defaultApiTokenKey: 'ARLI_API_KEY',
    });

    if (!apiKey) {
      throw new Error('ArliAI requires an API key. Get one free at arliai.com');
    }

    const openai = createOpenAI({
      baseURL: baseUrl || ARLI_BASE_URL,
      apiKey,
    });

    return openai(model);
  }
}
