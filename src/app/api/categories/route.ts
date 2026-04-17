import { requireUser } from "@/lib/auth";
import { fromUnknownError, jsonError } from "@/lib/api";
import { db } from "@/lib/db";
import { createCategorySchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const categories = await db.category.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    return Response.json({ categories });
  } catch (error) {
    return fromUnknownError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const payload = createCategorySchema.parse(await request.json());

    const existing = await db.category.findFirst({
      where: {
        userId: user.id,
        name: {
          equals: payload.name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (existing) {
      return jsonError("Category already exists", 409);
    }

    const category = await db.category.create({
      data: {
        userId: user.id,
        name: payload.name,
        color: payload.color,
      },
    });

    return Response.json({ category }, { status: 201 });
  } catch (error) {
    return fromUnknownError(error);
  }
}
