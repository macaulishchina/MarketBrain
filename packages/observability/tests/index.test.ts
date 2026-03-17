import { describe, it, expect } from 'vitest';
import { logger, initTracing } from '../src/index';

describe('@marketbrain/observability', () => {
  it('exports logger', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
  });

  it('initTracing runs without error', () => {
    expect(() => initTracing()).not.toThrow();
  });
});
