import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const CLOUDYNIC_BASE_URL = 'https://api.cloudynic.com/api/v1';

export default class CloudynicProvider extends BaseProvider {
  name = 'Cloudynic';
  getApiKeyLink = 'https://cloudynic.com';
  labelForGetApiKey = 'Get Free API Key';
  icon = 'i-ph:cloud-lightning';

  config = {
    apiTokenKey: 'CLOUDYNIC_API_KEY',
    baseUrlKey: 'CLOUDYNIC_API_BASE_URL',
    baseUrl: CLOUDYNIC_BASE_URL,
  };

  staticModels: ModelInfo[] = [
    { name: 'gpt-4o', label: 'GPT-4o (Cloudynic)', provider: 'Cloudynic', maxTokenAllowed: 128000 },
    { name: 'gpt-4o-mini', label: 'GPT-4o Mini (Cloudynic)', provider: 'Cloudynic', maxTokenAllowed: 128000 },
    { name: 'gpt-4-turbo', label: 'GPT-4 Turbo (Cloudynic)', provider: 'Cloudynic', maxTokenAllowed: 128000 },
    { name: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Cloudynic)', provider: 'Cloudynic', maxTokenAllowed: 200000 },
    { name: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Cloudynic)', provider: 'Cloudynic', maxTokenAllowed: 200000 },
    { name: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Cloudynic)', provider: 'Cloudynic', maxTokenAllowed: 1000000 },
    { name: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Cloudynic)', provider: 'Cloudynic', maxTokenAllowed: 2000000 },
    { name: 'llama-3.1-70b-instruct', label: 'Llama 3.1 70B (Cloudynic)', provider: 'Cloudynic', maxTokenAllowed: 131072 },
    { name: 'mistral-large-latest', label: 'Mistral Large (Cloudynic)', provider: 'Cloudynic', maxTokenAllowed: 128000 },
    { name: 'deepseek-chat', label: 'DeepSeek Chat (Cloudynic)', provider: 'Cloudynic', maxTokenAllowed: 65536 },
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
      defaultBaseUrlKey: 'CLOUDYNIC_API_BASE_URL',
      defaultApiTokenKey: 'CLOUDYNIC_API_KEY',
    });

    const openai = createOpenAI({
      baseURL: baseUrl || CLOUDYNIC_BASE_URL,
      apiKey: apiKey || 'no-key',
    });

    return openai(model);
  }
}
