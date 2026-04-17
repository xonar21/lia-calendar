import { z } from "zod";

export const rangeQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  categoryId: z.string().cuid().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(40),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "color must be hex #RRGGBB")
    .optional(),
});

export const createEventSchema = z
  .object({
    categoryId: z.string().cuid().optional(),
    title: z.string().min(1).max(120),
    description: z.string().max(2000).optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    urgency: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  })
  .refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
    message: "endsAt must be greater than startsAt",
    path: ["endsAt"],
  });

export const createTaskSchema = z.object({
  categoryId: z.string().cuid().optional(),
  title: z.string().min(1).max(160),
  date: z.string().datetime(),
  dueAt: z.string().datetime().optional(),
  isCompleted: z.boolean().default(false),
});

export const createJournalSchema = z.object({
  date: z.string().datetime(),
  content: z.string().min(1).max(20000),
  mood: z.string().max(50).optional(),
  activeMs: z.number().int().nonnegative().optional(),
  idleMs: z.number().int().nonnegative().optional(),
});

export const createNoteSchema = z.object({
  categoryId: z.string().cuid().optional(),
  title: z.string().min(1).max(160),
  content: z.string().min(1).max(10000),
  date: z.string().datetime(),
  pinnedAt: z.string().datetime().optional(),
});
