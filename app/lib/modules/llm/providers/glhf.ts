import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const GLHF_BASE_URL = 'https://glhf.chat/api/openai/v1';

export default class GlhfProvider extends BaseProvider {
  name = 'GLHF';
  getApiKeyLink = 'https://glhf.chat/user/settings/api';
  labelForGetApiKey = 'Get Free API Key';
  icon = 'i-ph:chat-circle-text';

  config = {
    apiTokenKey: 'GLHF_API_KEY',
    baseUrl: GLHF_BASE_URL,
  };

  staticModels: ModelInfo[] = [
    {
      name: 'hf:meta-llama/Llama-3.1-405B-Instruct',
      label: 'Llama 3.1 405B (GLHF)',
      provider: 'GLHF',
      maxTokenAllowed: 131_072,
      isFree: true,
    },
    {
      name: 'hf:meta-llama/Llama-3.3-70B-Instruct',
      label: 'Llama 3.3 70B (GLHF)',
      provider: 'GLHF',
      maxTokenAllowed: 131_072,
      isFree: true,
    },
    {
      name: 'hf:meta-llama/Llama-3.1-70B-Instruct',
      label: 'Llama 3.1 70B (GLHF)',
      provider: 'GLHF',
      maxTokenAllowed: 131_072,
      isFree: true,
    },
    {
      name: 'hf:deepseek-ai/DeepSeek-R1',
      label: 'DeepSeek R1 (GLHF)',
      provider: 'GLHF',
      maxTokenAllowed: 131_072,
      isFree: true,
    },
    {
      name: 'hf:Qwen/Qwen2.5-Coder-32B-Instruct',
      label: 'Qwen 2.5 Coder 32B (GLHF)',
      provider: 'GLHF',
      maxTokenAllowed: 131_072,
      isFree: true,
    },
    {
      name: 'hf:mistralai/Mistral-7B-Instruct-v0.3',
      label: 'Mistral 7B (GLHF)',
      provider: 'GLHF',
      maxTokenAllowed: 32_768,
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
      defaultBaseUrlKey: 'GLHF_API_BASE_URL',
      defaultApiTokenKey: 'GLHF_API_KEY',
    });

    if (!apiKey) {
      throw new Error(
        `GLHF API key is not set. Get a free key at ${this.getApiKeyLink} and add it in Settings → Providers → GLHF.`,
      );
    }

    const openai = createOpenAI({
      baseURL: baseUrl || GLHF_BASE_URL,
      apiKey,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return openai(model);
  }
}
