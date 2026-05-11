import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const POLLINATIONS_BASE_URL = 'https://gen.pollinations.ai/v1';

interface PollinationsModel {
  id: string;
  object?: string;
  context_length?: number;
  output_modalities?: string[];
  supported_endpoints?: string[];
  reasoning?: boolean;
}

export default class PollinationsProvider extends BaseProvider {
  name = 'Pollinations';
  getApiKeyLink = 'https://enter.pollinations.ai';
  labelForGetApiKey = 'Get API Key (Optional)';
  icon = 'i-ph:flower-lotus';

  config = {
    baseUrlKey: 'POLLINATIONS_API_BASE_URL',
    baseUrl: POLLINATIONS_BASE_URL,
    apiTokenKey: 'POLLINATIONS_API_KEY',
  };

  staticModels: ModelInfo[] = [
    { name: 'openai', label: 'OpenAI (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 400000 },
    { name: 'openai-fast', label: 'OpenAI Fast (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 400000 },
    { name: 'openai-large', label: 'OpenAI Large (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 400000 },
    { name: 'gpt-5.5', label: 'GPT-5.5 (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 1000000 },
    { name: 'claude', label: 'Claude (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 200000 },
    { name: 'claude-fast', label: 'Claude Fast (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 200000 },
    { name: 'claude-large', label: 'Claude Large (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 200000 },
    { name: 'claude-opus-4.7', label: 'Claude Opus 4.7 (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 200000 },
    { name: 'gemini', label: 'Gemini (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 1048576 },
    { name: 'gemini-fast', label: 'Gemini Fast (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 1048576 },
    { name: 'gemini-large', label: 'Gemini Large (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 1048576 },
    { name: 'gemini-flash-lite-3.1', label: 'Gemini Flash Lite 3.1 (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 1048576 },
    { name: 'deepseek', label: 'DeepSeek (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 1048576 },
    { name: 'deepseek-pro', label: 'DeepSeek Pro (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 1048576 },
    { name: 'grok', label: 'Grok (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 262144 },
    { name: 'grok-large', label: 'Grok Large (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 262144 },
    { name: 'llama', label: 'Llama (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 131072 },
    { name: 'llama-maverick', label: 'Llama Maverick (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 1048576 },
    { name: 'llama-scout', label: 'Llama Scout (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 10000000 },
    { name: 'mistral', label: 'Mistral (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 131072 },
    { name: 'mistral-large', label: 'Mistral Large (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 256000 },
    { name: 'qwen-coder', label: 'Qwen Coder (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 262144 },
    { name: 'qwen-coder-large', label: 'Qwen Coder Large (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 262144 },
    { name: 'qwen-large', label: 'Qwen Large (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 1048576 },
    { name: 'gemma', label: 'Gemma (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 262144 },
    { name: 'kimi', label: 'Kimi (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 262000 },
    { name: 'nova', label: 'Nova (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 1048576 },
    { name: 'nova-fast', label: 'Nova Fast (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 128000 },
    { name: 'perplexity-fast', label: 'Perplexity Fast (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 127072 },
    { name: 'perplexity-reasoning', label: 'Perplexity Reasoning (Pollinations)', provider: 'Pollinations', maxTokenAllowed: 128000 },
  ];

  async getDynamicModels(
    _apiKeys?: Record<string, string>,
    _settings?: IProviderSetting,
    _serverEnv: Record<string, string | undefined> = {},
  ): Promise<ModelInfo[]> {
    const response = await fetch(`${POLLINATIONS_BASE_URL}/models`, {
      signal: this.createTimeoutSignal(8000),
    });

    if (!response.ok) {
      throw new Error(`Pollinations models API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { data: PollinationsModel[] };
    const staticNames = new Set(this.staticModels.map((m) => m.name));

    return (data.data || [])
      .filter(
        (m) =>
          (m.output_modalities ?? []).includes('text') &&
          (m.supported_endpoints ?? []).includes('/v1/chat/completions') &&
          !staticNames.has(m.id),
      )
      .map((m) => ({
        name: m.id,
        label: `${m.id} (Pollinations)`,
        provider: this.name,
        maxTokenAllowed: m.context_length ?? 8000,
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
      defaultBaseUrlKey: 'POLLINATIONS_API_BASE_URL',
      defaultApiTokenKey: 'POLLINATIONS_API_KEY',
    });

    const openai = createOpenAI({
      baseURL: baseUrl || POLLINATIONS_BASE_URL,
      apiKey: apiKey || 'no-key-needed',
      headers: {
        'X-Referrer': 'veyra',
      },
    });

    return openai(model);
  }
}
