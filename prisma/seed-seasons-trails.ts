/**
 * हरिtima — starter seasonal months and walking trails (run after seed.ts and seed-extra.ts).
 *
 * ADD-ONLY, like seed-extra.ts:
 *  - Months are written only for plants that have no flowering AND no fruiting months yet.
 *  - A trail whose slug already exists is skipped, stops included.
 *
 * Months are typical for the Haridwar plains and should be corrected from campus observation
 * (Admin → Plants → Seasons on campus). Stops point at each plant's first location, ordered as a
 * nearest-neighbour walk from the first stop, so they follow any GPS corrections automatically.
 *
 * Run: npm run db:seed-trails
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// slug: [flowering months, fruiting months]
const SEASONS: Record<string, [number[], number[]]> = {
  tulsi: [[8, 9, 10, 11], [9, 10, 11, 12]],
  ashwagandha: [[8, 9, 10], [11, 12, 1]],
  neem: [[3, 4, 5], [6, 7, 8]],
  "aloe-vera": [[1, 2, 3], []],
  amla: [[3, 4, 5], [11, 12, 1, 2]],
  arjuna: [[4, 5, 6], [9, 10, 11, 12]],
  brahmi: [[6, 7, 8, 9], [8, 9, 10]],
  giloy: [[3, 4, 5, 6], [6, 7, 8]],
  shatavari: [[7, 8, 9], [10, 11]],
  peepal: [[], [4, 5, 6]],
  bargad: [[], [4, 5, 6]],
  bael: [[4, 5, 6], [3, 4, 5, 6]],
  haritaki: [[4, 5, 6], [11, 12, 1, 2]],
  bibhitaki: [[3, 4, 5], [11, 12, 1, 2]],
  vasaka: [[1, 2, 3, 4], [3, 4, 5]],
  haldi: [[8, 9], []],
  pudina: [[7, 8, 9], []],
  ashoka: [[2, 3, 4], [6, 7, 8]],
  gudhal: [[3, 4, 5, 6, 7, 8, 9, 10], []],
  moringa: [[1, 2, 3], [3, 4, 5]],
  kalmegh: [[9, 10, 11], [10, 11, 12]],
  punarnava: [[7, 8, 9, 10], [8, 9, 10, 11]],
  shankhpushpi: [[8, 9, 10, 11], [10, 11, 12]],
  genda: [[11, 12, 1, 2, 3], []],
};

type Stop = { slug: string; note: string; noteHi: string };
type SeedTrail = { slug: string; title: string; titleHi: string; description: string; descriptionHi: string; color: string; stops: Stop[] };

const TRAILS: SeedTrail[] = [
  {
    slug: "medicinal-garden-walk",
    title: "Medicinal Garden Walk",
    titleHi: "औषधीय उद्यान भ्रमण",
    description: "A short loop through the herbal garden, from the sacred Tulsi beds to the Triphala trees, meeting the herbs most often named in Ayurveda.",
    descriptionHi: "तुलसी की क्यारियों से त्रिफला वृक्षों तक हर्बल उद्यान का छोटा भ्रमण, आयुर्वेद में सबसे अधिक वर्णित औषधियों से परिचय।",
    color: "#2F6B4F",
    stops: [
      { slug: "tulsi", note: "Crush a leaf gently and notice the clove-like scent.", noteHi: "एक पत्ती को हल्के से मसलकर उसकी लौंग जैसी सुगंध पहचानें।" },
      { slug: "brahmi", note: "A creeper of wet soil, traditionally called a Medhya (intellect) herb.", noteHi: "गीली मिट्टी की बेल, जिसे पारंपरिक रूप से मेध्य (बुद्धिवर्धक) कहा जाता है।" },
      { slug: "shankhpushpi", note: "Look for the small conch-shaped flowers that give it its name.", noteHi: "शंख के आकार के छोटे फूल देखें, जिनसे इसका नाम पड़ा।" },
      { slug: "ashwagandha", note: "The orange berries sit inside papery husks.", noteHi: "नारंगी फल काग़ज़ जैसे आवरण के भीतर रहते हैं।" },
      { slug: "aloe-vera", note: "A succulent: its thick leaves store water and gel.", noteHi: "गूदेदार पौधा: इसकी मोटी पत्तियों में पानी और जेल भरा रहता है।" },
      { slug: "haldi", note: "The useful part, the yellow rhizome, grows underground.", noteHi: "उपयोगी भाग, पीला प्रकंद, ज़मीन के नीचे बढ़ता है।" },
      { slug: "adrak", note: "Ginger and turmeric are cousins from the same plant family.", noteHi: "अदरक और हल्दी एक ही पादप कुल के सदस्य हैं।" },
      { slug: "kalmegh", note: "Known as the 'King of bitters'. Do not taste it.", noteHi: "'कड़वाहट का राजा' कहलाता है। इसे चखें नहीं।" },
      { slug: "vasaka", note: "Large lance-shaped leaves; often used as a hedge.", noteHi: "बड़ी भाले जैसी पत्तियाँ; प्रायः बाड़ के रूप में लगाया जाता है।" },
      { slug: "shatavari", note: "Fine needle-like leaves climbing a trellis.", noteHi: "जाली पर चढ़ती सुई जैसी महीन पत्तियाँ।" },
      { slug: "punarnava", note: "'Renewing again': it springs back every monsoon.", noteHi: "'फिर से नई': हर वर्षा ऋतु में फिर उग आती है।" },
      { slug: "haritaki", note: "First of the three Triphala fruits.", noteHi: "त्रिफला के तीन फलों में पहला।" },
      { slug: "bibhitaki", note: "The third Triphala fruit; Amla, the second, grows in the hostel garden.", noteHi: "त्रिफला का तीसरा फल; दूसरा, आँवला, छात्रावास उद्यान में है।" },
    ],
  },
  {
    slug: "sacred-trees-trail",
    title: "Sacred Trees Trail",
    titleHi: "पवित्र वृक्ष पथ",
    description: "The trees and flowers woven into worship and daily life in India, from the Peepal by the yagyashala to the banyan on the main avenue.",
    descriptionHi: "भारत में पूजा और दैनिक जीवन से जुड़े वृक्ष और पुष्प, यज्ञशाला के पीपल से मुख्य मार्ग के बरगद तक।",
    color: "#8A5A14",
    stops: [
      { slug: "peepal", note: "Heart-shaped leaves with a long 'drip tip' that sheds rain.", noteHi: "लंबी नोक वाली दिल के आकार की पत्तियाँ, जो वर्षा का पानी गिरा देती हैं।" },
      { slug: "bael", note: "Its three-part leaves are offered in Shiva worship.", noteHi: "इसकी त्रिपत्री पत्तियाँ शिव पूजा में चढ़ाई जाती हैं।" },
      { slug: "gudhal", note: "Red hibiscus flowers are offered to the Goddess.", noteHi: "लाल गुड़हल के फूल देवी को अर्पित किए जाते हैं।" },
      { slug: "genda", note: "Marigold garlands mark nearly every festival.", noteHi: "गेंदे की मालाएँ लगभग हर त्योहार की पहचान हैं।" },
      { slug: "neem", note: "Shade tree whose twigs are a traditional datun.", noteHi: "छायादार वृक्ष, जिसकी टहनियाँ पारंपरिक दातुन हैं।" },
      { slug: "ashoka", note: "The true Ashoka has drooping leaves and orange-red flower clusters.", noteHi: "असली अशोक की पत्तियाँ झुकी होती हैं और फूल नारंगी-लाल गुच्छों में।" },
      { slug: "bargad", note: "India's national tree: its aerial roots become new trunks.", noteHi: "भारत का राष्ट्रीय वृक्ष: इसकी जटाएँ नए तने बन जाती हैं।" },
    ],
  },
];

type Loc = { id: string; latitude: number; longitude: number };
const dist = (a: Loc, b: Loc) => (a.latitude - b.latitude) ** 2 + (a.longitude - b.longitude) ** 2; // fine for ordering within a campus

/** Keeps the first stop, then always walks to the nearest unvisited stop. */
function walkOrder<T extends { loc: Loc }>(items: T[]) {
  if (items.length < 3) return items;
  const rest = items.slice(1);
  const out = [items[0]];
  while (rest.length) {
    const last = out[out.length - 1].loc;
    let best = 0;
    rest.forEach((r, i) => { if (dist(last, r.loc) < dist(last, rest[best].loc)) best = i; });
    out.push(rest.splice(best, 1)[0]);
  }
  return out;
}

async function main() {
  console.log("🌿 Seasons and trails (existing data is left untouched) …");

  let seasons = 0;
  for (const [slug, [flowering, fruiting]] of Object.entries(SEASONS)) {
    const { count } = await prisma.plant.updateMany({
      where: { slug, floweringMonths: { isEmpty: true }, fruitingMonths: { isEmpty: true } },
      data: { floweringMonths: flowering, fruitingMonths: fruiting },
    });
    seasons += count;
  }
  console.log(`  ✓ months set for ${seasons} plant(s)`);

  for (const t of TRAILS) {
    if (await prisma.trail.findUnique({ where: { slug: t.slug }, select: { id: true } })) {
      console.log(`  · ${t.title} already exists, skipped`);
      continue;
    }
    const resolved: (Stop & { loc: Loc })[] = [];
    for (const s of t.stops) {
      const loc = await prisma.plantLocation.findFirst({ where: { plant: { slug: s.slug } }, orderBy: { createdAt: "asc" }, select: { id: true, latitude: true, longitude: true } });
      if (loc) resolved.push({ ...s, loc });
      else console.log(`    ! ${s.slug} has no location, stop skipped`);
    }
    const { stops: _stops, ...data } = t;
    await prisma.trail.create({
      data: {
        ...data,
        stops: { create: walkOrder(resolved).map((s, i) => ({ locationId: s.loc.id, position: i + 1, note: s.note, noteHi: s.noteHi })) },
      },
    });
    console.log(`  ✓ ${t.title} (${resolved.length} stops)`);
  }
  console.log("✅ Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
