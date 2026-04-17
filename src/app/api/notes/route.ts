import { requireUser } from "@/lib/auth";
import { fromUnknownError, jsonError } from "@/lib/api";
import { db } from "@/lib/db";
import { createNoteSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const payload = createNoteSchema.parse(await request.json());

    if (payload.categoryId) {
      const category = await db.category.findFirst({
        where: { id: payload.categoryId, userId: user.id },
        select: { id: true },
      });
      if (!category) {
        return jsonError("Category not found", 404);
      }
    }

    const note = await db.note.create({
      data: {
        userId: user.id,
        categoryId: payload.categoryId,
        title: payload.title,
        content: payload.content,
        date: new Date(payload.date),
        pinnedAt: payload.pinnedAt ? new Date(payload.pinnedAt) : null,
      },
    });

    return Response.json({ note }, { status: 201 });
  } catch (error) {
    return fromUnknownError(error);
  }
}
