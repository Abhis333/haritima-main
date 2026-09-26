import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { handle, HttpError } from "@/lib/guards";
import { chatSchema } from "@/lib/validation";
import { answerQuestion } from "@/lib/chat";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

export const POST = handle(async (req: Request) => {
  const session = await auth();
  const key = session?.user.id ?? clientKey(req);
  // 12 questions per minute for signed-in users, 6 for anonymous visitors.
  const limit = rateLimit(`chat:${key}`, session ? 12 : 6, 60_000);
  if (!limit.ok) return Response.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

  const { message, conversationId, lang } = chatSchema.parse(await req.json());
  const answer = await answerQuestion(message, lang);

  // History is only stored for signed-in users, and only in their own conversations.
  let convId: string | undefined;
  if (session?.user) {
    if (conversationId) {
      const owned = await prisma.chatConversation.findFirst({ where: { id: conversationId, userId: session.user.id } });
      if (!owned) throw new HttpError(404, "Conversation not found");
      convId = owned.id;
    } else {
      convId = (await prisma.chatConversation.create({ data: { userId: session.user.id, title: message.slice(0, 80) } })).id;
    }
    await prisma.chatMessage.createMany({
      data: [
        { conversationId: convId, role: "user", content: message },
        { conversationId: convId, role: "assistant", content: answer.context || answer.urgent || "", payload: answer as never },
      ],
    });
  }

  return Response.json({ answer, conversationId: convId });
});
