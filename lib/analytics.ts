import "server-only";
import { prisma } from "@/lib/prisma";
import type { ChatAnswer } from "@/lib/chat";

/** UTC midnight of today, matching the `@db.Date` day column. */
function today() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Adds one view to the plant's counter for today. Analytics must never break a page, so errors are only logged. */
export async function recordPlantView(plantId: string) {
  const day = today();
  await prisma.plantViewDaily
    .upsert({
      where: { plantId_day: { plantId, day } },
      create: { plantId, day, count: 1 },
      update: { count: { increment: 1 } },
    })
    .catch((e) => console.error("[analytics] view", e));
}

/** Logs one chatbot question with its outcome. Stores no user id or IP. */
export async function logChatQuery(question: string, lang: string, answer: ChatAnswer, latencyMs: number) {
  await prisma.chatQueryLog
    .create({
      data: {
        question: question.slice(0, 300),
        lang,
        plantSlugs: answer.plants.map((p) => p.slug),
        grounded: answer.grounded,
        urgent: Boolean(answer.urgent),
        llmUsed: answer.llmUsed,
        latencyMs: Math.round(latencyMs),
      },
    })
    .catch((e) => console.error("[analytics] chat", e));
}
