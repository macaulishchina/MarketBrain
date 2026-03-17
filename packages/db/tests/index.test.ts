import { describe, it, expect } from 'vitest';

describe('@marketbrain/db', () => {
  it('can import the package', async () => {
    // Prisma client import works (actual DB connection tested in integration)
    const mod = await import('../src/client.js');
    expect(mod).toBeDefined();
  });
});
