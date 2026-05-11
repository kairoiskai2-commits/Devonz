import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const SHUTTLEAI_BASE_URL = 'https://api.shuttleai.com/v1';

interface ShuttleModel {
  id: string;
  plan?: string;
  owned_by?: string;
}

export default class ShuttleAIProvider extends BaseProvider {
  name = 'ShuttleAI';
  getApiKeyLink = 'https://shuttleai.com/keys';
  labelForGetApiKey = 'Get Free API Key';
  icon = 'i-ph:rocket-launch';

  config = {
    apiTokenKey: 'SHUTTLEAI_API_KEY',
    baseUrlKey: 'SHUTTLEAI_API_BASE_URL',
    baseUrl: SHUTTLEAI_BASE_URL,
  };

  staticModels: ModelInfo[] = [
    { name: 'openai/gpt-5.5', label: 'GPT-5.5 (ShuttleAI)', provider: 'ShuttleAI', maxTokenAllowed: 1000000 },
    { name: 'openai/gpt-5.4', label: 'GPT-5.4 (ShuttleAI)', provider: 'ShuttleAI', maxTokenAllowed: 128000 },
    { name: 'openai/gpt-oss-120b', label: 'GPT OSS 120B (ShuttleAI)', provider: 'ShuttleAI', maxTokenAllowed: 128000 },
    { name: 'shuttleai/auto', label: 'Auto (ShuttleAI)', provider: 'ShuttleAI', maxTokenAllowed: 200000 },
    { name: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku 4.5 (ShuttleAI)', provider: 'ShuttleAI', maxTokenAllowed: 200000 },
    { name: 'anthropic/claude-sonnet-4-5', label: 'Claude Sonnet 4.5 (ShuttleAI)', provider: 'ShuttleAI', maxTokenAllowed: 200000 },
    { name: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (ShuttleAI)', provider: 'ShuttleAI', maxTokenAllowed: 200000 },
    { name: 'anthropic/claude-opus-4-6', label: 'Claude Opus 4.6 (ShuttleAI)', provider: 'ShuttleAI', maxTokenAllowed: 200000 },
    { name: 'anthropic/claude-opus-4-7', label: 'Claude Opus 4.7 (ShuttleAI)', provider: 'ShuttleAI', maxTokenAllowed: 200000 },
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
      defaultBaseUrlKey: 'SHUTTLEAI_API_BASE_URL',
      defaultApiTokenKey: 'SHUTTLEAI_API_KEY',
    });

    const headers: Record<string, string> = {};

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${baseUrl || SHUTTLEAI_BASE_URL}/models`, {
      headers,
      signal: this.createTimeoutSignal(8000),
    });

    if (!response.ok) {
      throw new Error(`ShuttleAI models API error: ${response.status}`);
    }

    const data = (await response.json()) as { data: ShuttleModel[] };
    const staticNames = new Set(this.staticModels.map((m) => m.name));

    return (data.data || [])
      .filter((m) => !staticNames.has(m.id))
      .map((m) => ({
        name: m.id,
        label: `${m.id} (ShuttleAI)`,
        provider: this.name,
        maxTokenAllowed: 128000,
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
      defaultBaseUrlKey: 'SHUTTLEAI_API_BASE_URL',
      defaultApiTokenKey: 'SHUTTLEAI_API_KEY',
    });

    const openai = createOpenAI({
      baseURL: baseUrl || SHUTTLEAI_BASE_URL,
      apiKey: apiKey || 'no-key',
    });

    return openai(model);
  }
}
