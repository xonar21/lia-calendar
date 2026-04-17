import { NextResponse } from "next/server";

import { clearedCookieOptions } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ ...clearedCookieOptions(), value: "" });
  return response;
}

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set({ ...clearedCookieOptions(), value: "" });
  return response;
}
