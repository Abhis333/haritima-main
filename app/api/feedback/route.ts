import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { handle, HttpError, requireAdmin } from "@/lib/guards";
import { feedbackSchema } from "@/lib/validation";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const POST = handle(async (req: Request) => {
  if (!rateLimit(`fb:${clientKey(req)}`, 3, 10 * 60_000).ok) throw new HttpError(429, "Too many messages. Try again later.");
  const { website, ...data } = feedbackSchema.parse(await req.json());
  if (website) return Response.json({ ok: true }); // honeypot filled → silently drop
  const session = await auth();
  await prisma.feedback.create({ data: { ...data, userId: session?.user.id } });
  return Response.json({ ok: true }, { status: 201 });
});

export const GET = handle(async () => {
  await requireAdmin();
  return Response.json(await prisma.feedback.findMany({ orderBy: { createdAt: "desc" }, take: 200 }));
});
