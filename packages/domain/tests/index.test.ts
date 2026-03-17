import { describe, it, expect } from 'vitest';
import {
  UserRole,
  AssetType,
  AlertSeverity,
  EvidenceType,
  ResearchMode,
  instrumentSchema,
  watchlistSchema,
  evidenceSchema,
  eventSchema,
  alertSchema,
} from '../src/index';

describe('@marketbrain/domain enums', () => {
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

  it('exports EvidenceType enum', () => {
    expect(EvidenceType.QUOTE).toBe('quote');
    expect(EvidenceType.DATA_POINT).toBe('data_point');
  });

  it('exports ResearchMode enum', () => {
    expect(ResearchMode.FREEFORM).toBe('freeform');
  });
});

describe('@marketbrain/domain schemas', () => {
  it('validates instrument schema', () => {
    const result = instrumentSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      ticker: 'AAPL',
      name: 'Apple Inc.',
      assetType: 'stock',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid instrument', () => {
    const result = instrumentSchema.safeParse({ ticker: '' });
    expect(result.success).toBe(false);
  });

  it('validates watchlist schema', () => {
    const result = watchlistSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Tech Watchlist',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('validates evidence schema', () => {
    const result = evidenceSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      documentId: '123e4567-e89b-12d3-a456-426614174001',
      quote: 'Revenue grew 15% YoY',
      evidenceType: 'quote',
      createdAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('validates event schema', () => {
    const result = eventSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      type: 'earnings',
      status: 'draft',
      title: 'AAPL Q4 Earnings Beat',
      firstSeenAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('validates alert schema', () => {
    const result = alertSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      eventId: '123e4567-e89b-12d3-a456-426614174001',
      userId: '123e4567-e89b-12d3-a456-426614174002',
      severity: 's1',
      channel: 'in_app',
      status: 'pending',
      createdAt: new Date(),
    });
    expect(result.success).toBe(true);
  });
});
