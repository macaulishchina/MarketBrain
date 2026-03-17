import { describe, it, expect } from 'vitest';
import { TaskType, modelCallSchema } from '../src/index.js';

describe('@marketbrain/ai', () => {
  it('exports TaskType constants', () => {
    expect(TaskType.CLASSIFY).toBe('classify');
    expect(TaskType.RESEARCH_ANSWER).toBe('research_answer');
  });

  it('modelCallSchema parses valid input', () => {
    const result = modelCallSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      provider: 'openai',
      model: 'gpt-4o',
      taskType: 'classify',
      promptVersion: 'v1',
      inputTokens: 100,
      outputTokens: 50,
      latencyMs: 320,
      resultStatus: 'success',
      createdAt: new Date(),
    });
    expect(result.success).toBe(true);
  });
});
