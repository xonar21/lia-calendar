import { NextResponse } from "next/server";
import { z } from "zod";

import { upsertUserWithDefaults } from "@/lib/auth";
import { fromUnknownError, jsonError } from "@/lib/api";
import { sessionCookieOptions, signSession } from "@/lib/session";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80).optional(),
});

function devLoginAllowed() {
  if (process.env.AUTH_ALLOW_DEV_LOGIN === "true") return true;
  if (process.env.AUTH_ALLOW_DEV_LOGIN === "false") return false;
  return process.env.NODE_ENV !== "production";
}

export async function POST(request: Request) {
  if (!devLoginAllowed()) {
    return jsonError("Dev login is disabled", 404);
  }

  try {
    const payload = schema.parse(await request.json());
    const user = await upsertUserWithDefaults({
      email: payload.email,
      name: payload.name ?? null,
    });

    const token = await signSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl,
    });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
    response.cookies.set({ ...sessionCookieOptions(), value: token });
    return response;
  } catch (error) {
    return fromUnknownError(error);
  }
}
