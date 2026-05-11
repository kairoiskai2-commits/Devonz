import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const LOGFARE_BASE_URL = 'https://logfare.ai/v1';

interface LogfareModel {
  id: string;
  display_name?: string;
  tier?: number;
  requires_consent?: boolean;
  endpoints?: string[];
}

export default class LogfareProvider extends BaseProvider {
  name = 'Logfare';
  getApiKeyLink = 'https://logfare.ai/register';
  labelForGetApiKey = 'Get Free API Key';
  icon = 'i-ph:fire-simple';

  config = {
    apiTokenKey: 'LOGFARE_API_KEY',
    baseUrlKey: 'LOGFARE_API_BASE_URL',
    baseUrl: LOGFARE_BASE_URL,
  };

  staticModels: ModelInfo[] = [
    { name: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash (Logfare)', provider: 'Logfare', maxTokenAllowed: 65536 },
    { name: 'gemini-3-flash', label: 'Gemini 3 Flash (Logfare)', provider: 'Logfare', maxTokenAllowed: 1048576 },
    { name: 'kimi-k2.6', label: 'Kimi K2.6 (Logfare)', provider: 'Logfare', maxTokenAllowed: 262000 },
    { name: 'minimax-m2.7', label: 'MiniMax M2.7 (Logfare)', provider: 'Logfare', maxTokenAllowed: 200000 },
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
      defaultBaseUrlKey: 'LOGFARE_API_BASE_URL',
      defaultApiTokenKey: 'LOGFARE_API_KEY',
    });

    const headers: Record<string, string> = {};

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${baseUrl || LOGFARE_BASE_URL}/models`, {
      headers,
      signal: this.createTimeoutSignal(8000),
    });

    if (!response.ok) {
      throw new Error(`Logfare models API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { data: LogfareModel[] };
    const staticNames = new Set(this.staticModels.map((m) => m.name));

    return (data.data || [])
      .filter((m) => (m.endpoints ?? []).some((e) => e.includes('chat')) && !staticNames.has(m.id))
      .map((m) => ({
        name: m.id,
        label: `${m.display_name ?? m.id} (Logfare)`,
        provider: this.name,
        maxTokenAllowed: 65536,
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
      defaultBaseUrlKey: 'LOGFARE_API_BASE_URL',
      defaultApiTokenKey: 'LOGFARE_API_KEY',
    });

    const openai = createOpenAI({
      baseURL: baseUrl || LOGFARE_BASE_URL,
      apiKey: apiKey || 'no-key',
    });

    return openai(model);
  }
}
