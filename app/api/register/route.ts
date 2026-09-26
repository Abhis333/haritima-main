import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { handle, HttpError } from "@/lib/guards";
import { registerSchema } from "@/lib/validation";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const POST = handle(async (req: Request) => {
  if (!rateLimit(`reg:${clientKey(req)}`, 5, 60 * 60_000).ok) throw new HttpError(429, "Too many sign-ups from this network.");
  const { name, email, password } = registerSchema.parse(await req.json());
  if (await prisma.user.findUnique({ where: { email } })) throw new HttpError(409, "An account with this email already exists.");
  // Public sign-up always creates USER accounts. Admins are created with `npm run create-admin`.
  await prisma.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 12), role: "USER" } });
  return Response.json({ ok: true }, { status: 201 });
});
