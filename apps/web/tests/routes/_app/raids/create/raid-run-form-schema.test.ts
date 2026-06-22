import { describe, expect, it } from 'vitest';
import {
  createDraftSaveSchema,
  createPublishSchema,
  draftSaveSchema,
  publishSchema,
} from '#/routes/_app/raids/create/-components/raid-run-form-schema';
import { createInitialRaidRunDraft } from '#/routes/_app/raids/create/-components/raid-signup-draft';

describe('raid-run-form-schema', () => {
  it('allows loose draft validation', () => {
    const result = draftSaveSchema.safeParse(createInitialRaidRunDraft());
    expect(result.success).toBe(true);
  });

  it('rejects reserved total above player limit', () => {
    const result = createDraftSaveSchema(10).safeParse({
      ...createInitialRaidRunDraft(10),
      reservedDps: 6,
      reservedHealer: 5,
    });

    expect(result.success).toBe(false);
  });

  it('requires publish fields', () => {
    const result = publishSchema.safeParse(createInitialRaidRunDraft());
    expect(result.success).toBe(false);
  });

  it('accepts valid publish payload for a 10-player dungeon', () => {
    const result = createPublishSchema(10).safeParse({
      ...createInitialRaidRunDraft(10),
      name: '周末团',
      dungeonId: '00000000-0000-4000-8000-000000000001',
      gatherTime: '2026-06-14T11:30:00.000Z',
      startTime: '2026-06-14T12:00:00.000Z',
      endTime: '2026-06-14T13:30:00.000Z',
      reservedDps: 5,
      reservedHealer: 3,
      reservedTank: 2,
      reservedBoss: 0,
    });

    expect(result.success).toBe(true);
  });
});
