import { z } from 'zod';

/** Task types that the model gateway can handle. */
export const TaskType = {
  CLASSIFY: 'classify',
  EXTRACT: 'extract',
  SUMMARIZE: 'summarize',
  COMPOSE_BRIEFING: 'compose_briefing',
  GENERATE_ALERT: 'generate_alert',
  RESEARCH_ANSWER: 'research_answer',
  JUDGE: 'judge',
} as const;

export type TaskType = (typeof TaskType)[keyof typeof TaskType];

/** Schema for a model call record (AI-specific audit trail). */
export const modelCallSchema = z.object({
  id: z.string().uuid(),
  provider: z.string(),
  model: z.string(),
  taskType: z.string(),
  promptVersion: z.string(),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  latencyMs: z.number().nonnegative(),
  cost: z.number().nonnegative().optional(),
  resultStatus: z.enum(['success', 'error', 'fallback']),
  createdAt: z.date(),
});

export type ModelCall = z.infer<typeof modelCallSchema>;
