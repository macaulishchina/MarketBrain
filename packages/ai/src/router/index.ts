/**
 * Model Gateway — unified interface for AI provider calls.
 *
 * Phase 0: type definitions only. Implementation in Phase 2+.
 */

export interface ModelGatewayConfig {
  defaultProvider: string;
  providers: Record<string, ProviderConfig>;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  enabled: boolean;
}

export interface ModelRequest {
  taskType: string;
  input: unknown;
  schema?: unknown;
  options?: {
    maxTokens?: number;
    temperature?: number;
    provider?: string;
  };
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
