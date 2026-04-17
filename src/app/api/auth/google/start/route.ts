import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  GOOGLE_OAUTH_REDIRECT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  buildAuthorizationUrl,
  createState,
  isGoogleConfigured,
  safeRedirectPath,
} from "@/lib/google-oauth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      {
        error:
          "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET or use the dev login.",
      },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const next = safeRedirectPath(url.searchParams.get("next"));
  const state = createState();

  const authorizeUrl = buildAuthorizationUrl(request, state);

  const store = await cookies();
  const secure = process.env.NODE_ENV === "production";

  store.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 10,
  });
  store.set(GOOGLE_OAUTH_REDIRECT_COOKIE, next, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 10,
  });

  return NextResponse.redirect(authorizeUrl);
}
