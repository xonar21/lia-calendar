import { requireUser } from "@/lib/auth";
import { fromUnknownError, jsonError } from "@/lib/api";
import { db } from "@/lib/db";
import { createEventSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const payload = createEventSchema.parse(await request.json());

    if (payload.categoryId) {
      const category = await db.category.findFirst({
        where: { id: payload.categoryId, userId: user.id },
        select: { id: true },
      });
      if (!category) {
        return jsonError("Category not found", 404);
      }
    }

    const event = await db.event.create({
      data: {
        userId: user.id,
        categoryId: payload.categoryId,
        title: payload.title,
        description: payload.description,
        startsAt: new Date(payload.startsAt),
        endsAt: new Date(payload.endsAt),
        urgency: payload.urgency,
      },
    });

    return Response.json({ event }, { status: 201 });
  } catch (error) {
    return fromUnknownError(error);
  }
}
