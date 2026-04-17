import { getSessionUser } from "@/lib/auth";
import { isGoogleConfigured } from "@/lib/google-oauth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  return Response.json({
    user: user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
          imageUrl: user.imageUrl,
        }
      : null,
    auth: {
      googleEnabled: isGoogleConfigured(),
      devAllowed: isDevAuthAllowed(),
    },
  });
}

export function isDevAuthAllowed() {
  if (process.env.AUTH_ALLOW_DEV_LOGIN === "true") return true;
  if (process.env.AUTH_ALLOW_DEV_LOGIN === "false") return false;
  return process.env.NODE_ENV !== "production";
}
