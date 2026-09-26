import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Server-side check for API routes and server actions. Never rely on the UI alone.
 * The role is re-read from the database on every call, so a demotion or account deletion
 * takes effect immediately instead of waiting for the JWT to expire.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError(401, "Sign in required");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true, email: true } });
  if (!dbUser) throw new HttpError(401, "Sign in required");
  if (dbUser.role !== "ADMIN") throw new HttpError(403, "Admin access required");
  return { ...session.user, role: dbUser.role, email: dbUser.email };
}

export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Wraps a route handler: converts HttpError / ZodError into clean JSON responses. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof HttpError) return Response.json({ error: err.message }, { status: err.status });
      if (err && typeof err === "object" && "issues" in err) {
        return Response.json({ error: "Invalid input", issues: (err as { issues: unknown }).issues }, { status: 422 });
      }
      if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2025") {
        return Response.json({ error: "Record not found" }, { status: 404 });
      }
      if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
        return Response.json({ error: "A record with this value already exists" }, { status: 409 });
      }
      console.error(err);
      return Response.json({ error: "Something went wrong on the server" }, { status: 500 });
    }
  };
}
