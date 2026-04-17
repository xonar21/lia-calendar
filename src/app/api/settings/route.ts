import { requireUser } from "@/lib/auth";
import { fromUnknownError } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";

const updateSettingsSchema = z.object({
  locale: z.string().min(2).max(20).optional(),
  timezone: z.string().min(2).max(100).optional(),
  defaultView: z.enum(["MONTH", "WEEK", "DAY"]).optional(),
  cycleMode: z.enum(["DISABLED", "ENABLED"]).optional(),
  cycleLengthDays: z.number().int().positive().max(60).nullable().optional(),
  periodLengthDays: z.number().int().positive().max(20).nullable().optional(),
  cycleStartDate: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .transform((value) => (value ? new Date(value) : value ?? undefined)),
});

export async function GET() {
  try {
    const user = await requireUser();
    const settings = await db.userSettings.findUnique({
      where: { userId: user.id },
    });

    return Response.json({ settings });
  } catch (error) {
    return fromUnknownError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const payload = updateSettingsSchema.parse(await request.json());

    const settings = await db.userSettings.upsert({
      where: { userId: user.id },
      update: payload,
      create: {
        userId: user.id,
        ...payload,
      },
    });

    return Response.json({ settings });
  } catch (error) {
    return fromUnknownError(error);
  }
}
