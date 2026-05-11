import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const TYPEGPT_BASE_URL = 'https://api.typegpt.net/v1';

export default class TypeGPTProvider extends BaseProvider {
  name = 'TypeGPT';
  getApiKeyLink = 'https://typegpt.net';
  labelForGetApiKey = 'Get Free API Key';
  icon = 'i-ph:keyboard';

  config = {
    apiTokenKey: 'TYPEGPT_API_KEY',
    baseUrlKey: 'TYPEGPT_API_BASE_URL',
    baseUrl: TYPEGPT_BASE_URL,
  };

  staticModels: ModelInfo[] = [
    { name: 'gpt-4o', label: 'GPT-4o (TypeGPT)', provider: 'TypeGPT', maxTokenAllowed: 128000 },
    { name: 'gpt-4o-mini', label: 'GPT-4o Mini (TypeGPT)', provider: 'TypeGPT', maxTokenAllowed: 128000 },
    { name: 'o1', label: 'o1 (TypeGPT)', provider: 'TypeGPT', maxTokenAllowed: 200000 },
    { name: 'o1-mini', label: 'o1-mini (TypeGPT)', provider: 'TypeGPT', maxTokenAllowed: 128000 },
    { name: 'o3-mini', label: 'o3-mini (TypeGPT)', provider: 'TypeGPT', maxTokenAllowed: 200000 },
    { name: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (TypeGPT)', provider: 'TypeGPT', maxTokenAllowed: 200000 },
    { name: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (TypeGPT)', provider: 'TypeGPT', maxTokenAllowed: 200000 },
    { name: 'claude-3-opus-20240229', label: 'Claude 3 Opus (TypeGPT)', provider: 'TypeGPT', maxTokenAllowed: 200000 },
    { name: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (TypeGPT)', provider: 'TypeGPT', maxTokenAllowed: 1048576 },
    { name: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (TypeGPT)', provider: 'TypeGPT', maxTokenAllowed: 2000000 },
    { name: 'deepseek-chat', label: 'DeepSeek Chat (TypeGPT)', provider: 'TypeGPT', maxTokenAllowed: 65536 },
    { name: 'deepseek-r1', label: 'DeepSeek R1 (TypeGPT)', provider: 'TypeGPT', maxTokenAllowed: 65536 },
    { name: 'Meta-Llama-3.1-70B-Instruct-Turbo', label: 'Llama 3.1 70B (TypeGPT)', provider: 'TypeGPT', maxTokenAllowed: 131072 },
    { name: 'mistral-large-latest', label: 'Mistral Large (TypeGPT)', provider: 'TypeGPT', maxTokenAllowed: 128000 },
    { name: 'grok-2', label: 'Grok 2 (TypeGPT)', provider: 'TypeGPT', maxTokenAllowed: 131072 },
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
      defaultBaseUrlKey: 'TYPEGPT_API_BASE_URL',
      defaultApiTokenKey: 'TYPEGPT_API_KEY',
    });

    if (!apiKey) {
      throw new Error('TypeGPT requires an API key. Get one free at typegpt.net');
    }

    const openai = createOpenAI({
      baseURL: baseUrl || TYPEGPT_BASE_URL,
      apiKey,
    });

    return openai(model);
  }
}
