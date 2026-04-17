import { cookies } from "next/headers";

import { db } from "@/lib/db";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "@/lib/session";

const DEFAULT_CATEGORIES = ["personal", "work", "health"] as const;

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

export async function getSessionUser() {
  const session = await readSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { settings: true },
  });
  return user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

export type UpsertUserInput = {
  email: string;
  name?: string | null;
  imageUrl?: string | null;
};

export async function upsertUserWithDefaults(input: UpsertUserInput) {
  const email = input.email.trim().toLowerCase();
  const existing = await db.user.findUnique({
    where: { email },
    include: { settings: true },
  });

  if (existing) {
    if (
      (input.name && existing.name !== input.name) ||
      (input.imageUrl && existing.imageUrl !== input.imageUrl)
    ) {
      return db.user.update({
        where: { id: existing.id },
        data: {
          name: input.name ?? existing.name,
          imageUrl: input.imageUrl ?? existing.imageUrl,
        },
        include: { settings: true },
      });
    }
    return existing;
  }

  return db.user.create({
    data: {
      email,
      name: input.name ?? email.split("@")[0],
      imageUrl: input.imageUrl ?? null,
      categories: {
        create: DEFAULT_CATEGORIES.map((name) => ({
          name,
          isDefault: true,
        })),
      },
      settings: {
        create: {},
      },
    },
    include: { settings: true },
  });
}
