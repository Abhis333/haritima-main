/**
 * Fills in the suggested source book (prisma/reference-suggestions.ts) on existing seed placeholder references.
 *
 * Only rows that are still untouched placeholders are changed: PENDING, citation "Reference pending verification",
 * and a text name ending in "(to be verified)". Anything an admin has edited or verified is left alone.
 * Status stays PENDING and chapter/section/verse stay empty, so nothing new reaches the chatbot.
 *
 * Run: npm run db:suggest-refs
 */
import { PrismaClient } from "@prisma/client";
import { SOURCE_SUGGESTIONS, SUGGESTION_NOTE } from "./reference-suggestions";

const prisma = new PrismaClient();

async function main() {
  const refs = await prisma.ayurvedicReference.findMany({
    where: { verificationStatus: "PENDING", citation: "Reference pending verification", textName: { endsWith: "(to be verified)" } },
    select: { id: true, plant: { select: { slug: true, commonName: true } } },
  });

  let updated = 0;
  for (const r of refs) {
    const s = SOURCE_SUGGESTIONS[r.plant.slug];
    if (!s) {
      console.log(`  · ${r.plant.commonName}: no suggestion, skipped`);
      continue;
    }
    await prisma.ayurvedicReference.update({
      where: { id: r.id },
      data: { textName: s.textName, author: s.author, sourceType: s.sourceType, notes: SUGGESTION_NOTE },
    });
    updated++;
    console.log(`  ✓ ${r.plant.commonName} → ${s.textName}`);
  }
  console.log(`✅ Updated ${updated} reference(s). All remain PENDING until checked against the book.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
