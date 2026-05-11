import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type {
  LanguageModelV1,
  LanguageModelV1CallOptions,
  LanguageModelV1StreamPart,
} from 'ai';

import { createScopedLogger } from '~/utils/logger';

type LanguageModelV1FinishReason = 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown';

const logger = createScopedLogger('PuterProvider');

const PUTER_API_URL = 'https://api.puter.com/drivers/call';

interface PuterModelConfig {
  name: string;
  driver: string;
  label: string;
  maxTokenAllowed: number;
}

const PUTER_MODELS: PuterModelConfig[] = [
  { name: 'gpt-4o', driver: 'openai', label: 'GPT-4o (Puter)', maxTokenAllowed: 128000 },
  { name: 'gpt-4o-mini', driver: 'openai', label: 'GPT-4o Mini (Puter)', maxTokenAllowed: 128000 },
  { name: 'o1', driver: 'openai', label: 'o1 (Puter)', maxTokenAllowed: 200000 },
  { name: 'o1-mini', driver: 'openai', label: 'o1-mini (Puter)', maxTokenAllowed: 128000 },
  { name: 'o3-mini', driver: 'openai', label: 'o3-mini (Puter)', maxTokenAllowed: 200000 },
  { name: 'o3', driver: 'openai', label: 'o3 (Puter)', maxTokenAllowed: 200000 },
  { name: 'claude-3-5-sonnet-20241022', driver: 'claude', label: 'Claude 3.5 Sonnet (Puter)', maxTokenAllowed: 200000 },
  { name: 'claude-3-5-haiku-20241022', driver: 'claude', label: 'Claude 3.5 Haiku (Puter)', maxTokenAllowed: 200000 },
  { name: 'claude-3-opus-20240229', driver: 'claude', label: 'Claude 3 Opus (Puter)', maxTokenAllowed: 200000 },
  { name: 'claude-opus-4-20250514', driver: 'claude', label: 'Claude Opus 4 (Puter)', maxTokenAllowed: 200000 },
  { name: 'gemini-2.0-flash', driver: 'google-ai', label: 'Gemini 2.0 Flash (Puter)', maxTokenAllowed: 1048576 },
  { name: 'gemini-2.5-flash-preview-04-17', driver: 'google-ai', label: 'Gemini 2.5 Flash (Puter)', maxTokenAllowed: 1048576 },
  { name: 'gemini-2.5-pro-preview-05-06', driver: 'google-ai', label: 'Gemini 2.5 Pro (Puter)', maxTokenAllowed: 2000000 },
  { name: 'gemini-1.5-flash', driver: 'google-ai', label: 'Gemini 1.5 Flash (Puter)', maxTokenAllowed: 1000000 },
  { name: 'gemini-1.5-pro', driver: 'google-ai', label: 'Gemini 1.5 Pro (Puter)', maxTokenAllowed: 2000000 },
  { name: 'llama-3.3-70b-versatile', driver: 'groq', label: 'Llama 3.3 70B (Puter)', maxTokenAllowed: 128000 },
  { name: 'llama-3.1-8b-instant', driver: 'groq', label: 'Llama 3.1 8B Instant (Puter)', maxTokenAllowed: 128000 },
  { name: 'deepseek-r1-distill-llama-70b', driver: 'groq', label: 'DeepSeek R1 70B (Puter)', maxTokenAllowed: 128000 },
  { name: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', driver: 'together', label: 'Llama 3.3 70B Turbo (Puter)', maxTokenAllowed: 128000 },
  { name: 'deepseek-ai/DeepSeek-V3', driver: 'together', label: 'DeepSeek V3 (Puter)', maxTokenAllowed: 65536 },
  { name: 'grok-2', driver: 'xai', label: 'Grok 2 (Puter)', maxTokenAllowed: 131072 },
  { name: 'grok-3', driver: 'xai', label: 'Grok 3 (Puter)', maxTokenAllowed: 131072 },
  { name: 'grok-3-mini', driver: 'xai', label: 'Grok 3 Mini (Puter)', maxTokenAllowed: 131072 },
  { name: 'mistral-small-latest', driver: 'mistral', label: 'Mistral Small (Puter)', maxTokenAllowed: 32000 },
  { name: 'mistral-large-latest', driver: 'mistral', label: 'Mistral Large (Puter)', maxTokenAllowed: 128000 },
  { name: 'pixtral-large-latest', driver: 'mistral', label: 'Pixtral Large (Puter)', maxTokenAllowed: 128000 },
];

const MODEL_DRIVER_MAP = new Map<string, string>(PUTER_MODELS.map((m) => [m.name, m.driver]));

function getDriverForModel(model: string): string {
  return MODEL_DRIVER_MAP.get(model) ?? 'openai';
}

interface OpenAIStyleMessage {
  role: string;
  content: string;
}

function convertPromptToMessages(prompt: LanguageModelV1CallOptions['prompt']): OpenAIStyleMessage[] {
  return prompt.flatMap((msg) => {
    if (msg.role === 'system') {
      return [{ role: 'system', content: msg.content }];
    }

    if (msg.role === 'user') {
      const text = msg.content
        .filter((p) => p.type === 'text')
        .map((p) => (p as { type: 'text'; text: string }).text)
        .join('\n');

      return [{ role: 'user', content: text }];
    }

    if (msg.role === 'assistant') {
      if (typeof msg.content === 'string') {
        return [{ role: 'assistant', content: msg.content }];
      }

      const text = msg.content
        .filter((p) => p.type === 'text')
        .map((p) => (p as { type: 'text'; text: string }).text)
        .join('\n');

      return [{ role: 'assistant', content: text }];
    }

    return [];
  });
}

function createPuterLanguageModel(model: string, apiToken: string): LanguageModelV1 {
  return {
    specificationVersion: 'v1',
    provider: 'puter',
    modelId: model,
    defaultObjectGenerationMode: undefined,

    async doGenerate(options: LanguageModelV1CallOptions) {
      const messages = convertPromptToMessages(options.prompt);
      const driver = getDriverForModel(model);

      logger.debug(`Puter: calling driver=${driver} model=${model}`);

      const response = await fetch(PUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          interface: 'puter-chat-completion',
          driver,
          method: 'complete',
          args: { messages, model },
        }),
        signal: AbortSignal.timeout(120_000),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Puter API error ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as {
        result?: {
          message?: { content?: string };
          id?: string;
          usage?: { prompt_tokens?: number; completion_tokens?: number };
        };
        error?: string;
      };

      if (data.error) {
        throw new Error(`Puter error: ${data.error}`);
      }

      const text = data.result?.message?.content ?? '';
      const usage = data.result?.usage;

      return {
        text,
        toolCalls: [],
        finishReason: 'stop' as LanguageModelV1FinishReason,
        usage: {
          promptTokens: usage?.prompt_tokens ?? 0,
          completionTokens: usage?.completion_tokens ?? 0,
        },
        rawCall: { rawPrompt: messages, rawSettings: {} },
        rawResponse: { headers: {} },
        response: {
          id: data.result?.id ?? '',
          timestamp: new Date(),
          modelId: model,
        },
        warnings: [],
      };
    },

    async doStream(options: LanguageModelV1CallOptions) {
      const result = await this.doGenerate(options);

      const stream = new ReadableStream<LanguageModelV1StreamPart>({
        start(controller) {
          if (result.text) {
            controller.enqueue({ type: 'text-delta', textDelta: result.text });
          }

          controller.enqueue({
            type: 'finish',
            finishReason: result.finishReason,
            usage: result.usage,
          });
          controller.close();
        },
      });

      return {
        stream,
        rawCall: result.rawCall,
        rawResponse: result.rawResponse,
        warnings: result.warnings,
      };
    },
  };
}

export default class PuterProvider extends BaseProvider {
  name = 'Puter';
  getApiKeyLink = 'https://puter.com/settings';
  labelForGetApiKey = 'Get Puter API Token';
  icon = 'i-ph:cloud';

  config = {
    apiTokenKey: 'PUTER_API_KEY',
  };

  staticModels: ModelInfo[] = PUTER_MODELS.map(({ name, label, maxTokenAllowed }) => ({
    name,
    label,
    provider: 'Puter',
    maxTokenAllowed,
  }));

  getModelInstance(options: {
    model: string;
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as Record<string, string | undefined>,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'PUTER_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing PUTER_API_KEY for Puter provider`);
    }

    return createPuterLanguageModel(model, apiKey);
  }
}
