import { z } from 'zod';
import { itemQualitySchema } from './game-items';

const incomeAmountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid amount')
  .nullable();

export const raidLootItemSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  itemName: z.string(),
  itemQuality: itemQualitySchema,
  itemIcon: z.string().nullable(),
  quantity: z.number().int(),
  winnerSignupId: z.string().nullable(),
  winnerCharacterName: z.string().nullable(),
  winnerServerName: z.string().nullable(),
  price: z.number().int().nullable(),
  remark: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RaidLootItem = z.infer<typeof raidLootItemSchema>;

export const createRaidLootBodySchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
  winnerSignupId: z.string().uuid().nullable().optional(),
  price: z.number().int().min(0).nullable().optional(),
  remark: z.string().nullable().optional(),
});

export type CreateRaidLootBody = z.infer<typeof createRaidLootBodySchema>;

export const patchRaidLootBodySchema = z
  .object({
    quantity: z.number().int().min(1).optional(),
    winnerSignupId: z.string().uuid().nullable().optional(),
    price: z.number().int().min(0).nullable().optional(),
    remark: z.string().nullable().optional(),
  })
  .refine(
    (value) =>
      value.quantity !== undefined ||
      value.winnerSignupId !== undefined ||
      value.price !== undefined ||
      value.remark !== undefined,
    { message: 'At least one field must be provided' },
  );

export type PatchRaidLootBody = z.infer<typeof patchRaidLootBodySchema>;

export const patchRaidRunWageBodySchema = z.object({
  totalIncome: incomeAmountSchema,
  wagePerPerson: incomeAmountSchema,
});

export type PatchRaidRunWageBody = z.infer<typeof patchRaidRunWageBodySchema>;

export const raidRunWageResponseSchema = z.object({
  totalIncome: z.string().nullable(),
  wagePerPerson: z.string().nullable(),
});

export type RaidRunWageResponse = z.infer<typeof raidRunWageResponseSchema>;
