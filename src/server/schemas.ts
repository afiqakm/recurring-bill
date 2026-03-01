import { z } from "zod";

export const listItemsQuerySchema = z.object({
  category: z.string().trim().optional(),
  search: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).max(1_000_000).optional(),
});

export const listTransactionsQuerySchema = z.object({
  category: z.string().trim().optional(),
  search: z.string().trim().optional(),
  month: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).max(1_000_000).optional(),
});

export const createItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100).optional(),
});

export const patchItemSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    category: z.string().trim().min(1).max(100).optional(),
  })
  .refine((value) => value.name !== undefined || value.category !== undefined, {
    message: "At least one of name or category is required",
  });
