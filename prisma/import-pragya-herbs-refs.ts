/**
 * Add-only import: Ayurvedic references from
 * "प्रज्ञा अभियान का दर्शन स्वरूप और कार्यक्रम", section "जड़ी-बूटियों से स्वास्थ्य संरक्षण एकौषधि उपचार पद्धति"
 * (awgp.org online edition, page 32, Ref 79565).
 *
 * Every quote is checked word for word against the live source page before anything is written; if one does
 * not match, nothing is imported. Quotes cover identification and traditional use only — the passage's strong
 * cure claims, administration details, and the general opening/closing paragraphs are deliberately left out.
 * Plants not in Haritima (मुलेठी, भारंगी, निर्गुण्डी, सारिवा, चिरायता, गोक्षुर, लहसुन, अपामार्ग) are skipped;
 * चिरायता (Swertia chirata) is not Kalmegh. Existing rows are never changed; re-running skips plants that already
 * have this reference. Afterwards the chatbot knowledge base is re-indexed so the references get embeddings.
 *
 * Run: node --env-file=.env --conditions=react-server --import tsx prisma/import-pragya-herbs-refs.ts
 */
import { PrismaClient } from "@prisma/client";

const SOURCE_URL = "https://awgp.org/en/literature/book/pragya_abhiyan_ka_darshan_swaroop_aur_karyakram/v1.32";
const TEXT_NAME = "प्रज्ञा अभियान का दर्शन स्वरूप और कार्यक्रम";
const CHAPTER = "जड़ी-बूटियों से स्वास्थ्य संरक्षण एकौषधि उपचार पद्धति";
const NOTES =
  "Shantikunj (AWGP) publication, online edition at awgp.org (Ref 79565, page 32). The source page names no author. " +
  "Quotes are verbatim and limited to identification and traditional use; cure claims in the passage were left out.";

// slug → [entry heading in the source, verbatim sentences]
const QUOTES: Record<string, [string, string[]]> = {
  amla: ["(2) आंवला", ["यह एक रसायन भी है तथा कायाकल्प योग का प्रमुख घटक भी।", "20 से 25 फीट ऊंचा वृक्ष सारे भारत में पाया जाता है।", "इसके फलों का प्रयोग ही औषधि में होता है।", "यह त्रिदोषनाशक, अग्निदीपक, कामला, अरुचि, वमन में लाभकारी पाया गया है।"]],
  haritaki: ["(3) हरड़", ["त्रिफला का एक और घटक यह गंगातट पर पाये जाने वाला एक लम्बा वृक्ष है।", "इसके फल प्रयुक्त होते हैं।", "इसे रसायन के रूप में, पाचक के रूप में तथा कब्ज, अतिसार, खूनी बवासीर में रेचक व ग्राही के रूप में प्रयुक्त किया जाता है।"]],
  bael: ["(4) बिल्व", ["बेल वृक्ष सारे भारत में पाया जाता है।", "त्रिपत्रक संयुक्त पत्ते व कंटीले तने के कारण इसे पहचाना जा सकता है।", "यह एक उत्तम संग्राही, कफ-वात शामक औषधि है।"]],
  vasaka: ["(5) अडूसा", ["यह एक जंगल में पाया जाने वाला सामान्य क्षुप है जो काफी सघन होता है।", "इसके पत्ते अथवा पंचांग प्रयुक्त होते हैं।", "वासा भी इसका एक नाम है।", "यह क्षय-कास नाशक है।"]],
  arjuna: ["(7) अर्जुन", ["बड़ा वृक्ष है।", "छाल का चूर्ण व पत्र स्वरस प्रयुक्त होते हैं।", "इस औषधि को हृदय रोगों में अत्यन्त उपयोगी पाया गया है।"]],
  punarnava: ["(8) पुनर्नवा", ["शरीर को पुनः नया बना देने के गुण के कारण इसे पुनर्नवा कहते हैं।", "छोटे-छोटे रेंगने वाले बहुवर्षायु क्षुप भारत भर में पाये जाते हैं।", "ताजी जड़ या शुष्क पंचांग प्रयुक्त होता है।"]],
  brahmi: ["(9) ब्राह्मी", ["गंगा किनारे पाये जाने वाली यह दिव्य औषधि सामान्य तथा उपलब्ध मण्डूक पर्णी से अलग है।", "मेधावर्द्धक है तथा ‘नर्व टॉनिक’ मानी जाती है।", "अनिद्रा, शिरोशूल, मस्तिष्क निर्बलता में उपयोगी है।"]],
  shankhpushpi: ["(10) शंखपुष्पी", ["श्वेतपुष्पों वाली रेंगने वाली यह औषधि बहुत प्रचलित है।", "यह स्मरण शक्ति को बढ़ाती है।"]],
  adrak: ["(12) सुण्ठी", ["अदरक का तना सूख जाने पर शुष्क कन्द 1 वर्ष तक प्रयोग किया जा सकता है।", "यह एक चिर प्रचलित घरेलू औषधि है।", "इसमें वात-सूजन निवारक क्षमता अत्यधिक पायी जाती है।"]],
  neem: ["(13) नीम", ["इस सर्वविदित वृक्ष की छाल, कोपलें व फल सदा से रक्त शोधन हेतु प्रयुक्त होते रहे हैं।", "स्वरस व त्वक् चूर्ण उपयोग में आता है।"]],
  giloy: ["(16) गिलोय", ["अमृता नाम से प्रख्यात बहुवर्षायु लता चिरपुरातन काल से बुखार, संक्रामक रोग, कोढ़, विषाक्तता आदि में प्रयुक्त होती रही है।", "इसे ‘भारतीय कुनैन’ माना गया है।"]],
  ashoka: ["(17) अशोक", ["स्त्रियों के प्रजनन अंग सम्बन्धी विकारों को दूर करने वाली यह औषधि सभी जानते हैं।", "तने की छाल का चूर्ण ही प्रयुक्त होता है।"]],
  shatavari: ["(19) शतावर", ["कंटीला छोटा क्षुप सर्वत्र पाया जाता है।", "इसकी कन्द रूपी जड़ प्रयुक्त होती है।", "इसे बलवर्धक धातु वर्धक रसायन माना गया है।"]],
  ashwagandha: ["(20) अश्वगन्धा", ["जड़ से घोड़े के मूत्र जैसी गन्ध आने के कारण इसे अश्वगंधा कहते हैं।", "इसके क्षुप एक से डेढ़ मीटर ऊंचे होते हैं।", "यह उत्कृष्ट बलवर्धक टॉनिक है।", "इसे काया कल्प योग का एक अंग माना गया है।"]],
};

const htmlToText = (h: string) =>
  h
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .normalize("NFC");

async function main() {
  // 1) Check every quote against the published source page.
  const res = await fetch(SOURCE_URL, { headers: { "User-Agent": "Haritima citation check" } });
  if (!res.ok) throw new Error(`Source page returned HTTP ${res.status}`);
  const page = htmlToText(await res.text());
  const missing: string[] = [];
  for (const [slug, [heading, sentences]] of Object.entries(QUOTES)) {
    const start = page.indexOf(heading);
    if (start < 0) { missing.push(`${slug}: heading ${heading}`); continue; }
    const entry = page.slice(start, start + 2500);
    for (const s of sentences) if (!entry.includes(s.normalize("NFC"))) missing.push(`${slug}: ${s.slice(0, 50)}…`);
  }
  if (missing.length) throw new Error(`Quotes not found verbatim on the source page — nothing imported:\n${missing.join("\n")}`);
  console.log(`All ${Object.values(QUOTES).reduce((n, [, s]) => n + s.length, 0)} sentences match the source page word for word.`);

  // 2) Add references (add-only).
  const prisma = new PrismaClient();
  const checkedOn = new Date();
  const verifiedBy = `Quotes matched word for word with the awgp.org source page (automated check on ${checkedOn.toISOString().slice(0, 10)}, run at the administrator's request)`;
  const added: string[] = [];
  const touched: string[] = [];
  try {
    for (const [slug, [heading, sentences]] of Object.entries(QUOTES)) {
      const plant = await prisma.plant.findUnique({ where: { slug }, select: { id: true, commonName: true } });
      if (!plant) { console.log(`skip ${slug}: plant not in database`); continue; }
      const exists = await prisma.ayurvedicReference.findFirst({ where: { plantId: plant.id, textName: TEXT_NAME, referenceUrl: SOURCE_URL } });
      if (exists) { console.log(`skip ${slug}: reference already present`); continue; }
      const ref = await prisma.ayurvedicReference.create({
        data: {
          plantId: plant.id,
          textName: TEXT_NAME,
          author: null,
          chapter: CHAPTER,
          section: `${heading} — पृष्ठ 32 (online)`,
          verse: null,
          citation: sentences.join(" "),
          referenceUrl: SOURCE_URL,
          sourceType: "RESEARCH_PUBLICATION",
          verificationStatus: "VERIFIED",
          verifiedBy,
          verifiedAt: checkedOn,
          notes: NOTES,
        },
      });
      await prisma.auditLog.create({
        data: { userId: null, action: "CREATE", entity: "AyurvedicReference", entityId: ref.id, details: { source: "prisma/import-pragya-herbs-refs.ts", plant: slug, status: "VERIFIED" } },
      });
      added.push(`${plant.commonName} (${slug})`);
      touched.push(plant.id);
    }
  } finally {
    await prisma.$disconnect();
  }
  console.log(`Added ${added.length} references: ${added.join(", ") || "none"}`);

  // 3) Re-index the chatbot knowledge base (all plants), so the new references are embedded.
  const { reindexAll } = await import("../lib/rag");
  const result = await reindexAll();
  console.log("Re-index:", JSON.stringify(result));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
