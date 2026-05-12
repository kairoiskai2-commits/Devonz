import { type ActionFunctionArgs } from 'react-router';
import { generateText } from 'ai';
import { stripIndents } from '~/utils/stripIndent';
import type { ProviderInfo } from '~/types/model';
import { getApiKeysFromCookie, getProviderSettingsFromCookie } from '~/lib/api/cookies';
import { createScopedLogger } from '~/utils/logger';
import { z } from 'zod';
import { withSecurity } from '~/lib/security';
import { providerSchema } from '~/lib/api/schemas';
import { errorResponse } from '~/lib/api/responses';
import { AppError, AppErrorType } from '~/lib/api/errors';
import { AUTH_PRESETS } from '~/lib/security-config';
import { DEFAULT_PROVIDER, PROVIDER_LIST } from '~/utils/constants';
import { resolveModel } from '~/lib/.server/llm/resolve-model';
import { LLMManager } from '~/lib/modules/llm/manager';

export const action = withSecurity(enhancerAction, {
  auth: AUTH_PRESETS.authenticated,
  csrfExempt: true,
  allowedMethods: ['POST'],
  rateLimit: false,
});

const logger = createScopedLogger('api.enhancer');

const MAX_FALLBACK_ATTEMPTS = 3;

/**
 * Checks whether an error indicates the model is unavailable (deprecated, removed, not found).
 * Only these errors warrant a fallback attempt — auth errors, rate limits, and other
 * failures should propagate immediately.
 */
function isModelNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const status = (error as { status?: number })?.status ?? (error as { statusCode?: number })?.statusCode;

  return (
    status === 404 ||
    (message.includes('not found') && (message.includes('model') || message.includes('models/'))) ||
    message.includes('model_not_found') ||
    message.includes('does not exist') ||
    message.includes('deprecated')
  );
}

// providerSchema imported from ~/lib/api/schemas

const enhancerRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  model: z.string().min(1, 'Model is required'),
  provider: providerSchema,
  apiKeys: z.record(z.string()).optional(),
});

async function enhancerAction({ context, request }: ActionFunctionArgs) {
  // Parse and validate request body
  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return errorResponse(new AppError(AppErrorType.VALIDATION, 'Invalid JSON in request body'));
  }

  const parsed = enhancerRequestSchema.safeParse(rawBody);

  if (!parsed.success) {
    logger.warn('Enhancer request validation failed:', parsed.error.issues);

    return errorResponse(new AppError(AppErrorType.VALIDATION, 'Invalid request'));
  }

  const { message, model, provider } = parsed.data as {
    message: string;
    model: string;
    provider: ProviderInfo;
  };

  const { name: providerName } = provider;

  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = getApiKeysFromCookie(cookieHeader);
  const providerSettings = getProviderSettingsFromCookie(cookieHeader);

  // Resolve the provider and model for generateText
  const resolvedProvider = PROVIDER_LIST.find((p) => p.name === providerName) || DEFAULT_PROVIDER;
  const modelDetails = await resolveModel({
    provider: resolvedProvider,
    currentModel: model,
    apiKeys,
    providerSettings,
    serverEnv: context.cloudflare?.env,
    logger,
  });

  // Build the shared generateText parameters (reused across primary + fallback attempts)
  const systemPrompt =
    "You are a prompt engineer for Veyra, an AI web app builder. Veyra builds complete, production-ready apps using Vite + React 19 with Tailwind CSS v4 and shadcn/ui components. Apps run locally in a Node.js environment with local state management and realistic seed data — never external APIs with API keys. Your job: take the user's rough idea and produce a clear, specific, buildable prompt that gives Veyra everything it needs to generate a complete app in one shot. Output ONLY the enhanced prompt text — no headers, no labels, no explanation.";
  const userPrompt = stripIndents`
    Enhance the user's prompt so Veyra can build a complete, working app in one response.

    <original_prompt>
      ${message}
    </original_prompt>

    Enhancement rules:
    1. PRESERVE the user's core intent EXACTLY — do NOT change what they want to build. If the user says "workout tracker", the enhanced prompt MUST be about a workout tracker — NEVER substitute a different app idea
    2. If the app has multiple pages/views, LIST each page/view and its purpose explicitly (e.g. "Dashboard page: shows summary stats…")
    3. For data-driven apps, DEFINE the data model: entity names, key fields, types, and relationships
    4. Specify all interactive features needed: CRUD operations, filters, search, sorting, drag-and-drop, modals, form validation, toasts
    5. Add a brief, specific design direction if the user gave none (e.g. "dark theme with indigo accents, clean card-based layout, smooth hover transitions")
    6. Specify responsive behavior: sidebar collapses on mobile, grid stacks to single column, tables scroll horizontally
    7. If the app needs data, say "populate with 10-15 realistic seed data items" — NEVER suggest external API calls or API keys
    8. If shadcn/ui components are appropriate (Card, Dialog, Tabs, Select, Table, etc.), mention them by name
    9. Keep the enhanced prompt concise — 150-250 words. Add only details that prevent ambiguity or enable a richer UI
    10. NEVER add: external APIs, API keys, deployment, hosting, CI/CD, testing, or authentication unless the user explicitly asked for it
    11. Output ONLY the enhanced prompt — no explanations, headers, preamble, or wrapper tags
    12. FINAL CHECK: Re-read the <original_prompt>. Does your enhanced version build the SAME type of app the user asked for? If not, start over
  `;

  try {
    const result = await generateText({
      model: resolvedProvider.getModelInstance({
        model: modelDetails.name,
        serverEnv: context.cloudflare?.env,
        apiKeys,
        providerSettings,
      }),
      system: systemPrompt,
      prompt: userPrompt,
    });

    return new Response(result.text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (primaryError: unknown) {
    logger.error(
      `Primary model ${providerName}/${modelDetails.name} failed:`,
      primaryError instanceof Error ? primaryError.message : String(primaryError),
    );

    // Only attempt fallback for model-not-found errors (deprecated, removed, 404).
    // Auth errors, rate limits, and other failures propagate immediately.
    if (isModelNotFoundError(primaryError)) {
      const llm = LLMManager.getInstance();
      let candidateModels = llm.getModelList().filter(
        (m) => m.provider === resolvedProvider.name && m.name !== modelDetails.name,
      );

      // If the full model list has no alternatives, fall back to static list
      if (candidateModels.length === 0) {
        candidateModels = llm.getStaticModelListFromProvider(resolvedProvider).filter(
          (m) => m.name !== modelDetails.name,
        );
      }

      // Limit fallback attempts to avoid excessive API calls
      const attemptsToTry = candidateModels.slice(0, MAX_FALLBACK_ATTEMPTS);

      for (const candidate of attemptsToTry) {
        logger.info(`Trying fallback candidate: ${resolvedProvider.name}/${candidate.name}`);

        try {
          const candidateModelDetails = await resolveModel({
            provider: resolvedProvider,
            currentModel: candidate.name,
            apiKeys,
            providerSettings,
            serverEnv: context.cloudflare?.env,
            logger,
          });

          const fallbackResult = await generateText({
            model: resolvedProvider.getModelInstance({
              model: candidateModelDetails.name,
              serverEnv: context.cloudflare?.env,
              apiKeys,
              providerSettings,
            }),
            system: systemPrompt,
            prompt: userPrompt,
          });

          logger.info(
            `Fallback succeeded: ${resolvedProvider.name}/${candidateModelDetails.name} ` +
              `(primary ${providerName}/${modelDetails.name} was unavailable)`,
          );

          return new Response(fallbackResult.text, {
            status: 200,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
            },
          });
        } catch (candidateError: unknown) {
          logger.warn(
            `Fallback candidate ${resolvedProvider.name}/${candidate.name} failed: ` +
              `${candidateError instanceof Error ? candidateError.message : String(candidateError)}`,
          );
          // Continue to next candidate
        }
      }

      // All fallback candidates exhausted
      logger.error(
        `All ${attemptsToTry.length} fallback candidates for ${resolvedProvider.name} failed ` +
          `(primary model ${modelDetails.name} was unavailable)`,
      );
    }

    // Auth error detection — surface a clear message for API key issues
    if (primaryError instanceof Error) {
      const msg = primaryError.message.toLowerCase();

      if (
        msg.includes('api key') ||
        msg.includes('api_key') ||
        msg.includes('unauthorized') ||
        msg.includes('authentication') ||
        msg.includes('invalid credentials') ||
        msg.includes('forbidden') ||
        msg.includes('access denied') ||
        msg.includes('401')
      ) {
        return errorResponse(new AppError(AppErrorType.UNAUTHORIZED, 'Invalid or missing API key'));
      }
    }

    return errorResponse(
      primaryError instanceof AppError
        ? primaryError
        : new AppError(AppErrorType.INTERNAL, primaryError instanceof Error ? primaryError.message : 'Internal Server Error'),
    );
  }
}
