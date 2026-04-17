import { ZodError } from "zod";

import { UnauthorizedError } from "@/lib/auth";

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function fromUnknownError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return jsonError(error.message || "Unauthorized", 401);
  }

  if (error instanceof ZodError) {
    return Response.json(
      {
        error: "Validation failed",
        details: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 422 },
    );
  }

  return jsonError("Unexpected server error", 500);
}
