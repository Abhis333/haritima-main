import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});

// Compared against when the email is unknown, so unknown and known emails take the same time.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hash(randomBytes(16).toString("hex"), 12));

const LOGIN_WINDOW_MS = 15 * 60_000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const email = parsed.data.email.toLowerCase();
        // Throttle online guessing (and bcrypt CPU cost) per account and per client address.
        // Both counters are checked before any bcrypt work; a throttled attempt looks like a failed login.
        const byEmail = rateLimit(`login:email:${email}`, 5, LOGIN_WINDOW_MS);
        const byIp = request ? rateLimit(`login:ip:${clientKey(request)}`, 20, LOGIN_WINDOW_MS) : { ok: true };
        if (!byEmail.ok || !byIp.ok) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? (await getDummyHash()));
        if (!user || !ok) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
