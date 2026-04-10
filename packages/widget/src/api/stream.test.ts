/**
 * packages/widget/src/api/stream.test.ts
 *
 * Unit tests for the chat API client.
 * Run with: pnpm --filter @shopbot/widget test
 */

import { describe, it, expect } from 'vitest';

describe('newConversationId', () => {
  it('generates unique IDs', async () => {
    const { newConversationId } = await import('./stream.js');
    const ids = new Set(Array.from({ length: 1000 }, () => newConversationId()));
    expect(ids.size).toBe(1000);
  });

  it('generates IDs of expected length', async () => {
    const { newConversationId } = await import('./stream.js');
    const id = newConversationId();
    expect(id.length).toBeGreaterThanOrEqual(10);
    expect(id.length).toBeLessThanOrEqual(20);
  });
});

describe('getOrCreateSessionId', () => {
  it('returns a string ID', async () => {
    const { getOrCreateSessionId } = await import('./stream.js');
    const id = getOrCreateSessionId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});
