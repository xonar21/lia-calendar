import { requireUser } from "@/lib/auth";
import { fromUnknownError, jsonError } from "@/lib/api";
import { db } from "@/lib/db";
import { createTaskSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const payload = createTaskSchema.parse(await request.json());

    if (payload.categoryId) {
      const category = await db.category.findFirst({
        where: { id: payload.categoryId, userId: user.id },
        select: { id: true },
      });
      if (!category) {
        return jsonError("Category not found", 404);
      }
    }

    const task = await db.task.create({
      data: {
        userId: user.id,
        categoryId: payload.categoryId,
        title: payload.title,
        description: payload.description,
        date: new Date(payload.date),
        dueAt: payload.dueAt ? new Date(payload.dueAt) : null,
        urgency: payload.urgency,
        isCompleted: payload.isCompleted,
      },
    });

    return Response.json({ task }, { status: 201 });
  } catch (error) {
    return fromUnknownError(error);
  }
}
