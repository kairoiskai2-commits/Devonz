import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const APIFREELLM_BASE_URL = 'https://apifreellm.com/en/v1';

export default class ApiFreeLLMProvider extends BaseProvider {
  name = 'ApiFreeLLM';
  getApiKeyLink = 'https://apifreellm.com';
  labelForGetApiKey = 'Visit ApiFreeLLM';
  icon = 'i-ph:infinity';

  config = {
    apiTokenKey: 'APIFREELLM_API_KEY',
    baseUrlKey: 'APIFREELLM_API_BASE_URL',
    baseUrl: APIFREELLM_BASE_URL,
  };

  staticModels: ModelInfo[] = [
    { name: 'gpt-4o', label: 'GPT-4o (ApiFreeLLM)', provider: 'ApiFreeLLM', maxTokenAllowed: 128000 },
    { name: 'gpt-4o-mini', label: 'GPT-4o Mini (ApiFreeLLM)', provider: 'ApiFreeLLM', maxTokenAllowed: 128000 },
    { name: 'gpt-4-turbo', label: 'GPT-4 Turbo (ApiFreeLLM)', provider: 'ApiFreeLLM', maxTokenAllowed: 128000 },
    { name: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (ApiFreeLLM)', provider: 'ApiFreeLLM', maxTokenAllowed: 200000 },
    { name: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (ApiFreeLLM)', provider: 'ApiFreeLLM', maxTokenAllowed: 200000 },
    { name: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (ApiFreeLLM)', provider: 'ApiFreeLLM', maxTokenAllowed: 1000000 },
    { name: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (ApiFreeLLM)', provider: 'ApiFreeLLM', maxTokenAllowed: 2000000 },
    { name: 'llama-3.1-70b-instruct', label: 'Llama 3.1 70B (ApiFreeLLM)', provider: 'ApiFreeLLM', maxTokenAllowed: 131072 },
    { name: 'mistral-7b-instruct', label: 'Mistral 7B (ApiFreeLLM)', provider: 'ApiFreeLLM', maxTokenAllowed: 32768 },
    { name: 'deepseek-chat', label: 'DeepSeek Chat (ApiFreeLLM)', provider: 'ApiFreeLLM', maxTokenAllowed: 65536 },
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
      defaultBaseUrlKey: 'APIFREELLM_API_BASE_URL',
      defaultApiTokenKey: 'APIFREELLM_API_KEY',
    });

    const openai = createOpenAI({
      baseURL: baseUrl || APIFREELLM_BASE_URL,
      apiKey: apiKey || 'free',
    });

    return openai(model);
  }
}
