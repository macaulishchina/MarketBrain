import { describe, it, expect } from 'vitest';
import { UserRole, AssetType, AlertSeverity } from '../src/index.js';

describe('@marketbrain/domain', () => {
  it('exports UserRole enum', () => {
    expect(UserRole.ADMIN).toBe('admin');
    expect(UserRole.ANALYST).toBe('analyst');
    expect(UserRole.VIEWER).toBe('viewer');
  });

  it('exports AssetType enum', () => {
    expect(AssetType.STOCK).toBe('stock');
  });

  it('exports AlertSeverity enum', () => {
    expect(AlertSeverity.S1).toBe('s1');
  });
});
