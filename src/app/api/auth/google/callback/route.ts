import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { upsertUserWithDefaults } from "@/lib/auth";
import {
  GOOGLE_OAUTH_REDIRECT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  exchangeCodeForTokens,
  fetchGoogleUser,
  safeRedirectPath,
} from "@/lib/google-oauth";
import { sessionCookieOptions, signSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const store = await cookies();
  const savedState = store.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const redirectPath = safeRedirectPath(store.get(GOOGLE_OAUTH_REDIRECT_COOKIE)?.value);

  store.delete(GOOGLE_OAUTH_STATE_COOKIE);
  store.delete(GOOGLE_OAUTH_REDIRECT_COOKIE);

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code || !state || !savedState || savedState !== state) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(request, code);
    const profile = await fetchGoogleUser(tokens.access_token);

    if (!profile.email) {
      return NextResponse.redirect(new URL("/login?error=no_email", request.url));
    }

    const user = await upsertUserWithDefaults({
      email: profile.email,
      name: profile.name ?? profile.given_name ?? null,
      imageUrl: profile.picture ?? null,
    });

    const token = await signSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl,
    });

    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    response.cookies.set({ ...sessionCookieOptions(), value: token });
    return response;
  } catch (caught) {
    console.error("Google OAuth callback failed", caught);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }
}
