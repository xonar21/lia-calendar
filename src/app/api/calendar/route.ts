import { requireUser } from "@/lib/auth";
import { fromUnknownError, jsonError } from "@/lib/api";
import { db } from "@/lib/db";
import { rangeQuerySchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const parsed = rangeQuerySchema.safeParse({
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      categoryId: searchParams.get("categoryId") ?? undefined,
    });

    if (!parsed.success) {
      return jsonError("Invalid range query", 422);
    }

    const { from, to, categoryId } = parsed.data;
    const start = new Date(from);
    const end = new Date(to);

    if (start >= end) {
      return jsonError("from must be less than to", 422);
    }

    const categoryFilter = categoryId ? { categoryId } : {};

    const [events, tasks, journals, notes] = await Promise.all([
      db.event.findMany({
        where: {
          userId: user.id,
          startsAt: { gte: start, lt: end },
          ...categoryFilter,
        },
        orderBy: { startsAt: "asc" },
      }),
      db.task.findMany({
        where: {
          userId: user.id,
          date: { gte: start, lt: end },
          ...categoryFilter,
        },
        orderBy: [{ date: "asc" }, { dueAt: "asc" }],
      }),
      db.journalEntry.findMany({
        where: {
          userId: user.id,
          date: { gte: start, lt: end },
        },
        orderBy: { date: "asc" },
      }),
      db.note.findMany({
        where: {
          userId: user.id,
          date: { gte: start, lt: end },
          ...categoryFilter,
        },
        orderBy: [{ pinnedAt: "desc" }, { date: "asc" }],
      }),
    ]);

    return Response.json({
      range: { from, to, categoryId: categoryId ?? null },
      data: { events, tasks, journals, notes },
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}
