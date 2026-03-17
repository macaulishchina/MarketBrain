import { z } from 'zod';

const envSchema = z.object({
  // Core
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url().startsWith('postgres'),

  // Auth
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  // AI Providers (all optional in Phase 0)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),

  // Trigger.dev (optional in Phase 0)
  TRIGGER_API_KEY: z.string().optional(),
  TRIGGER_API_URL: z.string().url().optional(),

  // Observability
  LOG_LEVEL: z.string().default('info'),
  OTEL_ENABLED: z.enum(['true', 'false']).default('false'),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

function validateEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      'Invalid environment variables: ' +
        JSON.stringify(parsed.error.flatten().fieldErrors),
    );
  }
  cached = parsed.data;
  return cached;
}

/**
 * Validated environment. Lazily initialized on first property access so that
 * packages importing config do not trigger eager validation at module load time.
 */
export const env: Env = new Proxy({} as Env, {
  get(_, key: string) {
    return validateEnv()[key as keyof Env];
  },
});
