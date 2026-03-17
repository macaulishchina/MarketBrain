/**
 * Model Gateway — unified interface for AI provider calls.
 *
 * Uses the Vercel AI SDK to abstract provider differences.
 * Supports OpenAI, Anthropic, and Google as first-class providers.
 * Phase 5: automatic fallback chain, call logging, cost estimation.
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
  /** Ordered fallback chain. Default: openai → anthropic → google */
  fallbackOrder?: ProviderId[];
  /** Called after every model call for logging/audit. */
  onModelCall?: (record: ModelCallRecord) => void | Promise<void>;
}

export interface ExtractRequest<T extends z.ZodTypeAny> {
  taskType: TaskType;
  schema: T;
  prompt: string;
  system?: string;
  promptVersion?: string;
  options?: CallOptions;
}

export interface GenerateRequest {
  taskType: TaskType;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  system?: string;
  promptVersion?: string;
  options?: CallOptions;
}

export interface CallOptions {
  maxTokens?: number;
  temperature?: number;
  provider?: ProviderId;
  model?: string;
  /** Skip fallback — fail immediately on error. */
  noFallback?: boolean;
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
  /** Whether this response came from a fallback provider. */
  fallback: boolean;
}

/** Record emitted via onModelCall for audit/logging. */
export interface ModelCallRecord {
  provider: string;
  model: string;
  taskType: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  estimatedCost: number;
  resultStatus: 'success' | 'error' | 'fallback';
  error?: string;
}

// ---------------------------------------------------------------------------
// Cost estimation (per 1M tokens, approximate)
// ---------------------------------------------------------------------------

const COST_PER_M_INPUT: Record<string, number> = {
  'gpt-4o-mini': 0.15,
  'gpt-4o': 2.5,
  'claude-sonnet-4-20250514': 3.0,
  'gemini-2.0-flash': 0.075,
  'gemini-2.5-pro-preview-05-06': 1.25,
};

const COST_PER_M_OUTPUT: Record<string, number> = {
  'gpt-4o-mini': 0.6,
  'gpt-4o': 10.0,
  'claude-sonnet-4-20250514': 15.0,
  'gemini-2.0-flash': 0.3,
  'gemini-2.5-pro-preview-05-06': 10.0,
};

export function estimateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const inputRate = COST_PER_M_INPUT[modelId] ?? 1.0;
  const outputRate = COST_PER_M_OUTPUT[modelId] ?? 3.0;
  return (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000;
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

const DEFAULT_FALLBACK_ORDER: ProviderId[] = ['openai', 'anthropic', 'google'];

export class ModelGateway {
  private config: ModelGatewayConfig;
  private models: Map<string, LanguageModel> = new Map();

  constructor(config: ModelGatewayConfig) {
    this.config = config;
  }

  /** Get the ordered fallback chain of enabled providers. */
  private getFallbackChain(preferred: ProviderId): ProviderId[] {
    const order = this.config.fallbackOrder ?? DEFAULT_FALLBACK_ORDER;
    const enabled = order.filter((p) => this.config.providers[p]?.enabled);
    // Put preferred first, then the rest in order
    const chain = [preferred, ...enabled.filter((p) => p !== preferred)];
    return chain.filter((p) => this.config.providers[p]?.enabled);
  }

  /** Emit a model call record for logging. */
  private async logCall(record: ModelCallRecord): Promise<void> {
    if (this.config.onModelCall) {
      try {
        await this.config.onModelCall(record);
      } catch {
        // Logging should never break the call
      }
    }
  }

  /** Structured object extraction with automatic fallback. */
  async extractObject<T extends z.ZodTypeAny>(
    request: ExtractRequest<T>,
  ): Promise<ModelResponse<z.infer<T>>> {
    const preferredProvider = request.options?.provider ?? this.config.defaultProvider;
    const chain = request.options?.noFallback
      ? [preferredProvider]
      : this.getFallbackChain(preferredProvider);
    const promptVersion = request.promptVersion ?? 'unknown';

    let lastError: Error | undefined;

    for (let i = 0; i < chain.length; i++) {
      const providerId = chain[i]!;
      const tier = TASK_TIER[request.taskType] ?? 'fast';
      const modelId =
        request.options?.model ?? DEFAULT_MODELS[providerId]?.[tier] ?? DEFAULT_MODELS.openai[tier]!;
      const start = Date.now();

      try {
        const model = this.getOrCreateModel(providerId, modelId);
        const result = await generateObject({
          model,
          schema: request.schema,
          prompt: request.prompt,
          system: request.system,
          maxOutputTokens: request.options?.maxTokens,
          temperature: request.options?.temperature ?? 0,
        });

        const latencyMs = Date.now() - start;
        const inputTokens = result.usage.inputTokens ?? 0;
        const outputTokens = result.usage.outputTokens ?? 0;
        const isFallback = i > 0;

        await this.logCall({
          provider: providerId,
          model: modelId,
          taskType: request.taskType,
          promptVersion,
          inputTokens,
          outputTokens,
          latencyMs,
          estimatedCost: estimateCost(modelId, inputTokens, outputTokens),
          resultStatus: isFallback ? 'fallback' : 'success',
        });

        return {
          data: result.object,
          provider: providerId,
          model: modelId,
          usage: { inputTokens, outputTokens, latencyMs },
          fallback: isFallback,
        };
      } catch (err) {
        const latencyMs = Date.now() - start;
        lastError = err instanceof Error ? err : new Error(String(err));

        await this.logCall({
          provider: providerId,
          model: modelId,
          taskType: request.taskType,
          promptVersion,
          inputTokens: 0,
          outputTokens: 0,
          latencyMs,
          estimatedCost: 0,
          resultStatus: 'error',
          error: lastError.message.slice(0, 500),
        });
        // Continue to next provider in chain
      }
    }

    throw lastError ?? new Error('All providers failed');
  }

  /** Free-form text generation with automatic fallback. */
  async generateText(request: GenerateRequest): Promise<ModelResponse<string>> {
    const preferredProvider = request.options?.provider ?? this.config.defaultProvider;
    const chain = request.options?.noFallback
      ? [preferredProvider]
      : this.getFallbackChain(preferredProvider);
    const promptVersion = request.promptVersion ?? 'unknown';

    let lastError: Error | undefined;

    for (let i = 0; i < chain.length; i++) {
      const providerId = chain[i]!;
      const tier = TASK_TIER[request.taskType] ?? 'fast';
      const modelId =
        request.options?.model ?? DEFAULT_MODELS[providerId]?.[tier] ?? DEFAULT_MODELS.openai[tier]!;
      const start = Date.now();

      try {
        const model = this.getOrCreateModel(providerId, modelId);
        const result = await generateText({
          model,
          messages: request.messages,
          system: request.system,
          maxOutputTokens: request.options?.maxTokens,
          temperature: request.options?.temperature ?? 0.3,
        });

        const latencyMs = Date.now() - start;
        const inputTokens = result.usage.inputTokens ?? 0;
        const outputTokens = result.usage.outputTokens ?? 0;
        const isFallback = i > 0;

        await this.logCall({
          provider: providerId,
          model: modelId,
          taskType: request.taskType,
          promptVersion,
          inputTokens,
          outputTokens,
          latencyMs,
          estimatedCost: estimateCost(modelId, inputTokens, outputTokens),
          resultStatus: isFallback ? 'fallback' : 'success',
        });

        return {
          data: result.text,
          provider: providerId,
          model: modelId,
          usage: { inputTokens, outputTokens, latencyMs },
          fallback: isFallback,
        };
      } catch (err) {
        const latencyMs = Date.now() - start;
        lastError = err instanceof Error ? err : new Error(String(err));

        await this.logCall({
          provider: providerId,
          model: modelId,
          taskType: request.taskType,
          promptVersion,
          inputTokens: 0,
          outputTokens: 0,
          latencyMs,
          estimatedCost: 0,
          resultStatus: 'error',
          error: lastError.message.slice(0, 500),
        });
      }
    }

    throw lastError ?? new Error('All providers failed');
  }

  /** Streaming text generation (no fallback — stream cannot be retried). */
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

    return { model: this.getOrCreateModel(providerId, modelId), providerId, modelId };
  }

  private getOrCreateModel(providerId: ProviderId, modelId: string): LanguageModel {
    const cacheKey = `${providerId}:${modelId}`;
    let model = this.models.get(cacheKey);
    if (!model) {
      model = this.createModel(providerId, modelId);
      this.models.set(cacheKey, model);
    }

    return model;
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
