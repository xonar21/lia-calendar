import { requireUser } from "@/lib/auth";
import { fromUnknownError } from "@/lib/api";
import { db } from "@/lib/db";
import { createJournalSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const payload = createJournalSchema.parse(await request.json());

    const journal = await db.journalEntry.create({
      data: {
        userId: user.id,
        date: new Date(payload.date),
        content: payload.content,
        mood: payload.mood,
        activeMs: payload.activeMs,
        idleMs: payload.idleMs,
      },
    });

    return Response.json({ journal }, { status: 201 });
  } catch (error) {
    return fromUnknownError(error);
  }
}
