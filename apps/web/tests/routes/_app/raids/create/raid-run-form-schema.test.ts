import { describe, expect, it } from 'vitest';
import {
  draftSaveSchema,
  publishSchema,
} from '#/routes/_app/raids/create/-components/raid-run-form-schema';
import { createInitialRaidRunDraft } from '#/routes/_app/raids/create/-components/raid-signup-draft';

describe('raid-run-form-schema', () => {
  it('allows loose draft validation', () => {
    const result = draftSaveSchema.safeParse(createInitialRaidRunDraft());
    expect(result.success).toBe(true);
  });

  it('rejects reserved total above 25', () => {
    const result = draftSaveSchema.safeParse({
      ...createInitialRaidRunDraft(),
      reservedDps: 20,
      reservedHealer: 10,
    });

    expect(result.success).toBe(false);
  });

  it('requires publish fields', () => {
    const result = publishSchema.safeParse(createInitialRaidRunDraft());
    expect(result.success).toBe(false);
  });

  it('accepts valid publish payload', () => {
    const result = publishSchema.safeParse({
      ...createInitialRaidRunDraft(),
      name: '周末团',
      dungeonId: '00000000-0000-4000-8000-000000000001',
      startTime: '2026-06-14T12:00:00.000Z',
      reservedDps: 10,
      reservedHealer: 5,
      reservedTank: 2,
      reservedBoss: 1,
    });

    expect(result.success).toBe(true);
  });
});
