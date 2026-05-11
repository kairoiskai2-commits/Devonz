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

const logger = createScopedLogger('TransformersProvider');

/*
 * Lazy-loaded pipeline cache — keyed by model ID.
 * Avoids re-downloading or re-loading the model on every request.
 */
const pipelineCache = new Map<string, unknown>();

async function getOrCreatePipeline(modelId: string) {
  if (pipelineCache.has(modelId)) {
    return pipelineCache.get(modelId);
  }

  logger.info(`TransformersJS: loading model "${modelId}" (may download on first use)…`);

  /*
   * Dynamic import keeps @huggingface/transformers out of the client bundle.
   * Only loaded when this provider is actually used server-side.
   */
  const { pipeline, env } = await import('@huggingface/transformers');

  env.cacheDir = './.cache/transformers';
  env.allowLocalModels = true;

  const pipe = await pipeline('text-generation', modelId, {
    dtype: 'q4' as never,
    device: 'cpu' as never,
  });

  pipelineCache.set(modelId, pipe);
  logger.info(`TransformersJS: model "${modelId}" ready`);

  return pipe;
}

interface TransformersMessage {
  role: string;
  content: string;
}

function convertPromptToMessages(prompt: LanguageModelV1CallOptions['prompt']): TransformersMessage[] {
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

function createTransformersLanguageModel(modelId: string): LanguageModelV1 {
  return {
    specificationVersion: 'v1',
    provider: 'transformers',
    modelId,
    defaultObjectGenerationMode: undefined,

    async doGenerate(options: LanguageModelV1CallOptions) {
      const messages = convertPromptToMessages(options.prompt);
      const pipe = await getOrCreatePipeline(modelId);

      const result = (await (pipe as (messages: TransformersMessage[], opts: Record<string, unknown>) => Promise<unknown>)(messages, {
        max_new_tokens: options.maxTokens ?? 2048,
        temperature: (options as Record<string, unknown>).temperature ?? 0.7,
        do_sample: true,
        return_full_text: false,
      })) as Array<{ generated_text?: string | Array<{ content?: string }> }>;

      let generatedText = '';

      if (Array.isArray(result) && result.length > 0) {
        const first = result[0];

        if (typeof first.generated_text === 'string') {
          generatedText = first.generated_text;
        } else if (Array.isArray(first.generated_text)) {
          const last = first.generated_text[first.generated_text.length - 1];
          generatedText = last?.content ?? '';
        }
      }

      return {
        text: generatedText,
        toolCalls: [],
        finishReason: 'stop' as LanguageModelV1FinishReason,
        usage: { promptTokens: 0, completionTokens: 0 },
        rawCall: { rawPrompt: messages, rawSettings: {} },
        rawResponse: { headers: {} },
        response: { id: `transformers-${Date.now()}`, timestamp: new Date(), modelId },
        warnings: [],
      };
    },

    async doStream(options: LanguageModelV1CallOptions) {
      const messages = convertPromptToMessages(options.prompt);
      const pipe = await getOrCreatePipeline(modelId);

      let resolveStream!: () => void;
      const chunks: string[] = [];
      let isDone = false;

      const streamPromise = new Promise<void>((resolve) => {
        resolveStream = resolve;
      });

      (pipe as (
        messages: TransformersMessage[],
        opts: Record<string, unknown>,
      ) => Promise<unknown>)(messages, {
        max_new_tokens: options.maxTokens ?? 2048,
        temperature: (options as Record<string, unknown>).temperature ?? 0.7,
        do_sample: true,
        return_full_text: false,
        callback_function: (output: Array<{ generated_text: Array<{ content: string }> }>) => {
          const last = output?.[0]?.generated_text;

          if (Array.isArray(last) && last.length > 0) {
            const token = last[last.length - 1]?.content ?? '';

            if (token) {
              chunks.push(token);
            }
          }
        },
      })
        .then(() => {
          isDone = true;
          resolveStream();
        })
        .catch((err: unknown) => {
          logger.error('TransformersJS stream error:', err);
          isDone = true;
          resolveStream();
        });

      const stream = new ReadableStream<LanguageModelV1StreamPart>({
        async start(controller) {
          let lastIndex = 0;

          const poll = async () => {
            while (!isDone || lastIndex < chunks.length) {
              while (lastIndex < chunks.length) {
                controller.enqueue({ type: 'text-delta', textDelta: chunks[lastIndex++] });
              }

              if (!isDone) {
                await new Promise((r) => setTimeout(r, 10));
              }
            }

            await streamPromise;

            controller.enqueue({
              type: 'finish',
              finishReason: 'stop',
              usage: { promptTokens: 0, completionTokens: 0 },
            });
            controller.close();
          };

          await poll();
        },
      });

      return {
        stream,
        rawCall: { rawPrompt: messages, rawSettings: {} },
        rawResponse: { headers: {} },
        warnings: [],
      };
    },
  };
}

export default class TransformersProvider extends BaseProvider {
  name = 'Transformers';
  getApiKeyLink = 'https://huggingface.co/models?library=transformers.js&pipeline_tag=text-generation';
  labelForGetApiKey = 'Browse Models';
  icon = 'i-ph:cube';

  config = {};

  staticModels: ModelInfo[] = [
    {
      name: 'HuggingFaceTB/SmolLM2-135M-Instruct',
      label: 'SmolLM2 135M (Local)',
      provider: 'Transformers',
      maxTokenAllowed: 8192,
    },
    {
      name: 'HuggingFaceTB/SmolLM2-360M-Instruct',
      label: 'SmolLM2 360M (Local)',
      provider: 'Transformers',
      maxTokenAllowed: 8192,
    },
    {
      name: 'HuggingFaceTB/SmolLM2-1.7B-Instruct',
      label: 'SmolLM2 1.7B (Local)',
      provider: 'Transformers',
      maxTokenAllowed: 8192,
    },
    {
      name: 'Xenova/TinyLlama-1.1B-Chat-v1.0',
      label: 'TinyLlama 1.1B Chat (Local)',
      provider: 'Transformers',
      maxTokenAllowed: 2048,
    },
    {
      name: 'onnx-community/Llama-3.2-1B-Instruct',
      label: 'Llama 3.2 1B Instruct (Local)',
      provider: 'Transformers',
      maxTokenAllowed: 131072,
    },
    {
      name: 'onnx-community/Qwen2.5-Coder-1.5B-Instruct',
      label: 'Qwen2.5 Coder 1.5B (Local)',
      provider: 'Transformers',
      maxTokenAllowed: 32768,
    },
    {
      name: 'onnx-community/Phi-3.5-mini-instruct',
      label: 'Phi-3.5 Mini Instruct (Local)',
      provider: 'Transformers',
      maxTokenAllowed: 128000,
    },
    {
      name: 'Qwen/Qwen2.5-0.5B-Instruct',
      label: 'Qwen2.5 0.5B Instruct (Local)',
      provider: 'Transformers',
      maxTokenAllowed: 32768,
    },
    {
      name: 'Qwen/Qwen2.5-1.5B-Instruct',
      label: 'Qwen2.5 1.5B Instruct (Local)',
      provider: 'Transformers',
      maxTokenAllowed: 32768,
    },
    {
      name: 'Qwen/Qwen2.5-3B-Instruct',
      label: 'Qwen2.5 3B Instruct (Local)',
      provider: 'Transformers',
      maxTokenAllowed: 32768,
    },
    {
      name: 'Qwen/Qwen2.5-7B-Instruct',
      label: 'Qwen2.5 7B Instruct (Local)',
      provider: 'Transformers',
      maxTokenAllowed: 32768,
    },
    {
      name: 'microsoft/Phi-3-mini-4k-instruct',
      label: 'Phi-3 Mini 4K Instruct (Local)',
      provider: 'Transformers',
      maxTokenAllowed: 4096,
    },
  ];

  getModelInstance(options: {
    model: string;
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    return createTransformersLanguageModel(options.model);
  }
}
