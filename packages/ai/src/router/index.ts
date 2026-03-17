/**
 * Model Gateway — unified interface for AI provider calls.
 *
 * Uses the Vercel AI SDK to abstract provider differences.
 * Supports OpenAI, Anthropic, and Google as first-class providers.
 */

import { generateObject, generateText, streamText, type LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { type z } from 'zod';
import { type TaskType } from '../schemas/index';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProviderId = 'openai' | 'anthropic' | 'google';

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  enabled: boolean;
}

export interface ModelGatewayConfig {
  defaultProvider: ProviderId;
  providers: Partial<Record<ProviderId, ProviderConfig>>;
}

export interface ExtractRequest<T extends z.ZodTypeAny> {
  taskType: TaskType;
  schema: T;
  prompt: string;
  system?: string;
  options?: CallOptions;
}

export interface GenerateRequest {
  taskType: TaskType;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  system?: string;
  options?: CallOptions;
}

export interface CallOptions {
  maxTokens?: number;
  temperature?: number;
  provider?: ProviderId;
  model?: string;
}

export interface ModelResponse<T = unknown> {
  data: T;
  provider: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
  };
}

// ---------------------------------------------------------------------------
// Default model mapping per task type
// ---------------------------------------------------------------------------

const DEFAULT_MODELS: Record<ProviderId, Record<string, string>> = {
  openai: {
    fast: 'gpt-4o-mini',
    strong: 'gpt-4o',
    judge: 'gpt-4o',
  },
  anthropic: {
    fast: 'claude-sonnet-4-20250514',
    strong: 'claude-sonnet-4-20250514',
    judge: 'claude-sonnet-4-20250514',
  },
  google: {
    fast: 'gemini-2.0-flash',
    strong: 'gemini-2.5-pro-preview-05-06',
    judge: 'gemini-2.5-pro-preview-05-06',
  },
};

const TASK_TIER: Record<TaskType, 'fast' | 'strong' | 'judge'> = {
  classify: 'fast',
  extract: 'fast',
  summarize: 'fast',
  compose_briefing: 'strong',
  generate_alert: 'fast',
  research_answer: 'strong',
  judge: 'judge',
};

// ---------------------------------------------------------------------------
// ModelGateway
// ---------------------------------------------------------------------------

export class ModelGateway {
  private config: ModelGatewayConfig;
  private models: Map<string, LanguageModel> = new Map();

  constructor(config: ModelGatewayConfig) {
    this.config = config;
  }

  /** Structured object extraction — returns a typed, validated object. */
  async extractObject<T extends z.ZodTypeAny>(
    request: ExtractRequest<T>,
  ): Promise<ModelResponse<z.infer<T>>> {
    const { model, providerId, modelId } = this.resolveModel(
      request.taskType,
      request.options,
    );
    const start = Date.now();

    const result = await generateObject({
      model,
      schema: request.schema,
      prompt: request.prompt,
      system: request.system,
      maxOutputTokens: request.options?.maxTokens,
      temperature: request.options?.temperature ?? 0,
    });

    return {
      data: result.object,
      provider: providerId,
      model: modelId,
      usage: {
        inputTokens: result.usage.inputTokens ?? 0,
        outputTokens: result.usage.outputTokens ?? 0,
        latencyMs: Date.now() - start,
      },
    };
  }

  /** Free-form text generation. */
  async generateText(request: GenerateRequest): Promise<ModelResponse<string>> {
    const { model, providerId, modelId } = this.resolveModel(
      request.taskType,
      request.options,
    );
    const start = Date.now();

    const result = await generateText({
      model,
      messages: request.messages,
      system: request.system,
      maxOutputTokens: request.options?.maxTokens,
      temperature: request.options?.temperature ?? 0.3,
    });

    return {
      data: result.text,
      provider: providerId,
      model: modelId,
      usage: {
        inputTokens: result.usage.inputTokens ?? 0,
        outputTokens: result.usage.outputTokens ?? 0,
        latencyMs: Date.now() - start,
      },
    };
  }

  /** Streaming text generation — returns an AI SDK stream result. */
  streamText(request: GenerateRequest) {
    const { model } = this.resolveModel(request.taskType, request.options);

    return streamText({
      model,
      messages: request.messages,
      system: request.system,
      maxOutputTokens: request.options?.maxTokens,
      temperature: request.options?.temperature ?? 0.3,
    });
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private resolveModel(
    taskType: TaskType,
    options?: CallOptions,
  ): { model: LanguageModel; providerId: ProviderId; modelId: string } {
    const providerId = options?.provider ?? this.config.defaultProvider;
    const tier = TASK_TIER[taskType] ?? 'fast';
    const modelId =
      options?.model ??
      DEFAULT_MODELS[providerId]?.[tier] ??
      DEFAULT_MODELS.openai[tier]!;
    const cacheKey = `${providerId}:${modelId}`;

    let model = this.models.get(cacheKey);
    if (!model) {
      model = this.createModel(providerId, modelId);
      this.models.set(cacheKey, model);
    }

    return { model, providerId, modelId };
  }

  private createModel(providerId: ProviderId, modelId: string): LanguageModel {
    const providerConfig = this.config.providers[providerId];
    if (!providerConfig?.enabled) {
      throw new Error(`Provider "${providerId}" is not enabled or configured.`);
    }

    switch (providerId) {
      case 'openai': {
        const openai = createOpenAI({
          apiKey: providerConfig.apiKey,
          baseURL: providerConfig.baseUrl,
        });
        return openai(modelId);
      }
      case 'anthropic': {
        const anthropic = createAnthropic({
          apiKey: providerConfig.apiKey,
          baseURL: providerConfig.baseUrl,
        });
        return anthropic(modelId);
      }
      case 'google': {
        const google = createGoogleGenerativeAI({
          apiKey: providerConfig.apiKey,
          baseURL: providerConfig.baseUrl,
        });
        return google(modelId);
      }
      default:
        throw new Error(`Unknown provider: ${providerId as string}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton factory
// ---------------------------------------------------------------------------

let _gateway: ModelGateway | undefined;

/** Get or create the singleton ModelGateway from environment variables. */
export function getModelGateway(envAccessor?: () => Record<string, string | undefined>): ModelGateway {
  if (_gateway) return _gateway;

  const getEnv = envAccessor ?? (() => process.env as Record<string, string | undefined>);
  const e = getEnv();

  const providers: Partial<Record<ProviderId, ProviderConfig>> = {};

  if (e.OPENAI_API_KEY) {
    providers.openai = { apiKey: e.OPENAI_API_KEY, enabled: true };
  }
  if (e.ANTHROPIC_API_KEY) {
    providers.anthropic = { apiKey: e.ANTHROPIC_API_KEY, enabled: true };
  }
  if (e.GOOGLE_AI_API_KEY) {
    providers.google = { apiKey: e.GOOGLE_AI_API_KEY, enabled: true };
  }

  const defaultProvider: ProviderId = e.OPENAI_API_KEY
    ? 'openai'
    : e.ANTHROPIC_API_KEY
      ? 'anthropic'
      : 'google';

  _gateway = new ModelGateway({ defaultProvider, providers });
  return _gateway;
}

/** Replace the singleton (useful for testing). */
export function setModelGateway(gateway: ModelGateway): void {
  _gateway = gateway;
}

/** Reset the singleton (useful for testing). */
export function resetModelGateway(): void {
  _gateway = undefined;
}
