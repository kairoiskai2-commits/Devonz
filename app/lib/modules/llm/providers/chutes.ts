import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const CHUTES_BASE_URL = 'https://llm.chutes.ai/v1';

export default class ChutesProvider extends BaseProvider {
  name = 'Chutes';
  getApiKeyLink = 'https://chutes.ai/app/token';
  labelForGetApiKey = 'Get Free API Key';
  icon = 'i-ph:cloud-lightning';

  config = {
    apiTokenKey: 'CHUTES_API_KEY',
    baseUrl: CHUTES_BASE_URL,
  };

  staticModels: ModelInfo[] = [
    {
      name: 'deepseek-ai/DeepSeek-V3-0324',
      label: 'DeepSeek V3 (Chutes)',
      provider: 'Chutes',
      maxTokenAllowed: 131_072,
      maxCompletionTokens: 8_192,
      isFree: true,
    },
    {
      name: 'deepseek-ai/DeepSeek-R1',
      label: 'DeepSeek R1 (Chutes)',
      provider: 'Chutes',
      maxTokenAllowed: 131_072,
      isFree: true,
    },
    {
      name: 'Qwen/Qwen3-235B-A22B',
      label: 'Qwen3 235B A22B (Chutes)',
      provider: 'Chutes',
      maxTokenAllowed: 40_960,
      isFree: true,
    },
    {
      name: 'Qwen/Qwen3-30B-A3B',
      label: 'Qwen3 30B A3B (Chutes)',
      provider: 'Chutes',
      maxTokenAllowed: 40_960,
      isFree: true,
    },
    {
      name: 'unsloth/Llama-4-Scout-17B-16E-Instruct',
      label: 'Llama 4 Scout 17B (Chutes)',
      provider: 'Chutes',
      maxTokenAllowed: 131_072,
      isFree: true,
    },
    {
      name: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
      label: 'Llama 4 Maverick 17B (Chutes)',
      provider: 'Chutes',
      maxTokenAllowed: 524_288,
      isFree: true,
    },
    {
      name: 'meta-llama/Llama-3.3-70B-Instruct',
      label: 'Llama 3.3 70B (Chutes)',
      provider: 'Chutes',
      maxTokenAllowed: 131_072,
      isFree: true,
    },
    {
      name: 'google/gemma-3-27b-it',
      label: 'Gemma 3 27B (Chutes)',
      provider: 'Chutes',
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
      defaultBaseUrlKey: 'CHUTES_API_BASE_URL',
      defaultApiTokenKey: 'CHUTES_API_KEY',
    });

    if (!apiKey) {
      throw new Error(
        `Chutes API key is not set. Get a free key at ${this.getApiKeyLink} and add it in Settings → Providers → Chutes.`,
      );
    }

    const openai = createOpenAI({
      baseURL: baseUrl || CHUTES_BASE_URL,
      apiKey,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return openai(model);
  }
}
