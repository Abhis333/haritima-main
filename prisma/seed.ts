/**
 * हरिtima — demonstration seed data.
 *
 * IMPORTANT (academic integrity):
 *  - Every Ayurvedic reference below is intentionally marked PENDING with the citation
 *    "Reference pending verification". No chapter, verse, page or quotation has been invented.
 *    A faculty member / Ayurveda expert must verify each source in the admin panel before
 *    marking it VERIFIED. Only VERIFIED references are shown as authoritative by the chatbot.
 *  - All coordinates are APPROXIMATE placeholders around the campus centre. Replace them with
 *    real GPS readings taken on campus (Admin → Locations).
 *  - Traditional uses are phrased as general, widely documented associations for education only.
 */
import { PrismaClient, type Availability, type PlantType } from "@prisma/client";

const prisma = new PrismaClient();

const LAT = Number(process.env.NEXT_PUBLIC_CAMPUS_LAT || 29.9985);
const LNG = Number(process.env.NEXT_PUBLIC_CAMPUS_LNG || 78.1985);
const at = (dLat: number, dLng: number) => ({ latitude: +(LAT + dLat).toFixed(6), longitude: +(LNG + dLng).toFixed(6) });

const PENDING = "Reference pending verification";

const categories = [
  { slug: "medicinal", nameEn: "Medicinal", nameHi: "औषधीय", icon: "Pill", color: "#2F6B4F" },
  { slug: "ayurvedic", nameEn: "Ayurvedic", nameHi: "आयुर्वेदिक", icon: "Leaf", color: "#4E7A3A" },
  { slug: "fruit", nameEn: "Fruit", nameHi: "फलदार", icon: "Cherry", color: "#B5542F" },
  { slug: "flower", nameEn: "Flower", nameHi: "पुष्प", icon: "Flower2", color: "#B04A7A" },
  { slug: "sacred", nameEn: "Sacred", nameHi: "पवित्र", icon: "Sparkles", color: "#B8892E" },
  { slug: "ornamental", nameEn: "Ornamental", nameHi: "सजावटी", icon: "Palette", color: "#6A5ACD" },
  { slug: "herbal", nameEn: "Herbal", nameHi: "जड़ी-बूटी", icon: "Sprout", color: "#7A9A3E" },
  { slug: "tree", nameEn: "Tree", nameHi: "वृक्ष", icon: "TreeDeciduous", color: "#173A2B" },
  { slug: "shrub", nameEn: "Shrub", nameHi: "झाड़ी", icon: "Shrub", color: "#5F7F4B" },
  { slug: "other", nameEn: "Other", nameHi: "अन्य", icon: "CircleDot", color: "#7C7C6A" },
];

type SeedPlant = {
  slug: string;
  commonName: string;
  scientificName: string;
  hindiName: string;
  sanskritName: string;
  otherNames: string[];
  family: string;
  plantType: PlantType;
  availability: Availability;
  description: string;
  descriptionHi: string;
  ayurvedicProperties?: string;
  traditionalUses: string[];
  traditionalUsesHi: string[];
  plantParts: string[];
  preparation?: string;
  cultivation: string;
  precautions: string;
  featured: boolean;
  categories: string[];
  location: { dLat: number; dLng: number; campusArea: string; locationDescription: string; landmark?: string };
  benefits: { concern: string; concernHi: string; description: string; plantPart?: string }[];
  referenceText: string;
};

const GENERAL_PRECAUTION =
  "Educational information only. Consult a qualified Ayurvedic physician or doctor before any use, especially during pregnancy, breastfeeding, for children, or alongside other medicines.";

const plants: SeedPlant[] = [
  {
    slug: "tulsi",
    commonName: "Tulsi",
    scientificName: "Ocimum tenuiflorum",
    hindiName: "तुलसी",
    sanskritName: "तुलसी (Tulasī)",
    otherNames: ["Holy Basil", "Ocimum sanctum", "Surasa", "सुरसा"],
    family: "Lamiaceae",
    plantType: "HERB",
    availability: "AVAILABLE",
    description:
      "An aromatic, sacred herb found in almost every Indian home and temple courtyard. Tulsi is traditionally described in Ayurveda for supporting the respiratory system and general well-being.",
    descriptionHi:
      "एक सुगंधित और पवित्र पौधा जो लगभग हर भारतीय घर और मंदिर के आँगन में मिलता है। आयुर्वेद में इसे श्वसन तंत्र और सामान्य स्वास्थ्य के लिए पारंपरिक रूप से वर्णित किया गया है।",
    traditionalUses: [
      "Traditionally described for cough and common cold.",
      "Traditionally associated with supporting immunity and general vitality.",
      "Traditionally used as a calming, aromatic herbal infusion.",
    ],
    traditionalUsesHi: [
      "खाँसी और सर्दी-जुकाम में पारंपरिक रूप से वर्णित।",
      "रोग-प्रतिरोधक क्षमता और सामान्य ऊर्जा से पारंपरिक रूप से जुड़ा।",
      "शांतिदायक सुगंधित हर्बल पेय के रूप में पारंपरिक उपयोग।",
    ],
    plantParts: ["Leaves", "Seeds", "Whole plant"],
    preparation: "Leaves are traditionally taken as a herbal infusion (tea/kadha). Follow a qualified practitioner's guidance.",
    cultivation: "Grows well in warm climates with full sun and well-drained soil; regular pinching of flower spikes encourages leafy growth.",
    precautions: GENERAL_PRECAUTION,
    featured: true,
    categories: ["medicinal", "ayurvedic", "sacred", "herbal"],
    location: { dLat: 0.0004, dLng: 0.0003, campusArea: "Medicinal Plant Garden", locationDescription: "Tulsi beds near the entrance of the herbal garden", landmark: "Herbal garden entrance" },
    benefits: [
      { concern: "cough", concernHi: "खाँसी", description: "Traditionally described for cough and cold.", plantPart: "Leaves" },
      { concern: "immunity", concernHi: "रोग-प्रतिरोधक क्षमता", description: "Traditionally associated with general resistance and vitality.", plantPart: "Leaves" },
      { concern: "stress", concernHi: "तनाव", description: "Traditionally used as a calming herbal infusion.", plantPart: "Leaves" },
    ],
    referenceText: "Classical Ayurvedic text (to be verified)",
  },
  {
    slug: "ashwagandha",
    commonName: "Ashwagandha",
    scientificName: "Withania somnifera",
    hindiName: "अश्वगंधा",
    sanskritName: "अश्वगन्धा (Aśvagandhā)",
    otherNames: ["Indian Winter Cherry", "Indian Ginseng", "Asgandh"],
    family: "Solanaceae",
    plantType: "SHRUB",
    availability: "AVAILABLE",
    description:
      "A small woody shrub with orange-red berries enclosed in papery husks. Its root is well known in Ayurveda as a Rasayana (rejuvenative) herb.",
    descriptionHi:
      "नारंगी-लाल फलों वाली एक छोटी झाड़ी। इसकी जड़ आयुर्वेद में रसायन (पुनर्यौवनकारी) औषधि के रूप में प्रसिद्ध है।",
    traditionalUses: [
      "Traditionally described as a Rasayana for strength and vitality.",
      "Traditionally associated with restful sleep and calming the mind.",
      "Traditionally used in states of fatigue and stress.",
    ],
    traditionalUsesHi: [
      "बल और ऊर्जा के लिए रसायन के रूप में पारंपरिक रूप से वर्णित।",
      "अच्छी नींद और मन की शांति से पारंपरिक रूप से जुड़ा।",
      "थकान और तनाव की स्थिति में पारंपरिक उपयोग।",
    ],
    plantParts: ["Root", "Leaves"],
    preparation: "Root powder is traditionally taken with milk or water as advised by a practitioner.",
    cultivation: "Hardy, drought-tolerant; prefers dry, sandy-loam soil and full sun.",
    precautions: `${GENERAL_PRECAUTION} Traditionally avoided in pregnancy; may interact with thyroid, sedative or immunosuppressant medicines.`,
    featured: true,
    categories: ["medicinal", "ayurvedic", "herbal", "shrub"],
    location: { dLat: 0.0005, dLng: 0.0006, campusArea: "Medicinal Plant Garden", locationDescription: "Near the eastern section of the herbal garden" },
    benefits: [
      { concern: "sleep", concernHi: "नींद", description: "Traditionally associated with restful sleep.", plantPart: "Root" },
      { concern: "stress", concernHi: "तनाव", description: "Traditionally used for calming the mind.", plantPart: "Root" },
      { concern: "strength", concernHi: "बल", description: "Traditionally described as a Rasayana for vitality.", plantPart: "Root" },
    ],
    referenceText: "Classical Ayurvedic text (to be verified)",
  },
  {
    slug: "neem",
    commonName: "Neem",
    scientificName: "Azadirachta indica",
    hindiName: "नीम",
    sanskritName: "निम्ब (Nimba)",
    otherNames: ["Indian Lilac", "Margosa"],
    family: "Meliaceae",
    plantType: "TREE",
    availability: "AVAILABLE",
    description:
      "A large evergreen shade tree with bitter-tasting leaves. Neem has a long tradition of use for skin care and oral hygiene in India.",
    descriptionHi: "कड़वी पत्तियों वाला एक बड़ा सदाबहार छायादार वृक्ष। भारत में त्वचा और दाँतों की देखभाल में इसका लंबा पारंपरिक उपयोग है।",
    traditionalUses: [
      "Traditionally described for skin conditions.",
      "Twigs traditionally used as a datun for oral hygiene.",
      "Traditionally associated with purifying (bitter) properties.",
    ],
    traditionalUsesHi: [
      "त्वचा संबंधी समस्याओं में पारंपरिक रूप से वर्णित।",
      "दाँतों की सफ़ाई के लिए दातुन के रूप में पारंपरिक उपयोग।",
      "शोधक (तिक्त) गुणों से पारंपरिक रूप से जुड़ा।",
    ],
    plantParts: ["Leaves", "Bark", "Twigs", "Seed oil"],
    cultivation: "Very hardy; tolerates heat and poor soils; grows fast in full sun.",
    precautions: `${GENERAL_PRECAUTION} Neem oil must never be swallowed and is unsafe for infants and children.`,
    featured: true,
    categories: ["medicinal", "ayurvedic", "tree"],
    location: { dLat: -0.0006, dLng: -0.0004, campusArea: "Main Avenue", locationDescription: "Row of neem trees along the main avenue", landmark: "Main gate road" },
    benefits: [
      { concern: "skin", concernHi: "त्वचा", description: "Traditionally described for skin care.", plantPart: "Leaves" },
      { concern: "oral health", concernHi: "मुख स्वास्थ्य", description: "Twigs traditionally used as datun.", plantPart: "Twigs" },
    ],
    referenceText: "Classical Ayurvedic text (to be verified)",
  },
  {
    slug: "aloe-vera",
    commonName: "Aloe Vera",
    scientificName: "Aloe vera",
    hindiName: "घृतकुमारी / ग्वारपाठा",
    sanskritName: "घृतकुमारी (Ghṛtakumārī)",
    otherNames: ["Aloe barbadensis", "Kumari", "Gwarpatha"],
    family: "Asphodelaceae",
    plantType: "SUCCULENT",
    availability: "AVAILABLE",
    description: "A succulent with thick fleshy leaves containing a clear gel, widely used for skin care.",
    descriptionHi: "मोटी गूदेदार पत्तियों वाला पौधा जिनमें पारदर्शी जेल होता है; त्वचा की देखभाल में व्यापक उपयोग।",
    traditionalUses: [
      "Leaf gel traditionally applied for soothing the skin and minor burns.",
      "Traditionally associated with digestive support.",
    ],
    traditionalUsesHi: ["त्वचा और हल्की जलन पर जेल का पारंपरिक लेप।", "पाचन से पारंपरिक रूप से जुड़ा।"],
    plantParts: ["Leaf gel"],
    cultivation: "Needs very little water; well-drained sandy soil; protect from frost.",
    precautions: `${GENERAL_PRECAUTION} The yellow latex below the leaf skin is a strong laxative; internal use should be supervised.`,
    featured: false,
    categories: ["medicinal", "ayurvedic", "herbal"],
    location: { dLat: 0.0003, dLng: 0.0008, campusArea: "Medicinal Plant Garden", locationDescription: "Succulent section of the herbal garden" },
    benefits: [
      { concern: "skin", concernHi: "त्वचा", description: "Gel traditionally applied to soothe skin.", plantPart: "Leaf gel" },
      { concern: "digestion", concernHi: "पाचन", description: "Traditionally associated with digestion.", plantPart: "Leaf gel" },
    ],
    referenceText: "Classical Ayurvedic text (to be verified)",
  },
  {
    slug: "amla",
    commonName: "Amla",
    scientificName: "Phyllanthus emblica",
    hindiName: "आँवला",
    sanskritName: "आमलकी (Āmalakī)",
    otherNames: ["Indian Gooseberry", "Emblica officinalis", "Dhatri"],
    family: "Phyllanthaceae",
    plantType: "TREE",
    availability: "SEASONAL",
    description: "A medium-sized deciduous tree bearing sour green fruits in winter. Amalaki is one of the three fruits of Triphala.",
    descriptionHi: "सर्दियों में खट्टे हरे फल देने वाला मध्यम आकार का पर्णपाती वृक्ष। आमलकी त्रिफला के तीन फलों में से एक है।",
    traditionalUses: [
      "Traditionally described as a Rasayana.",
      "Traditionally associated with digestion (as part of Triphala).",
      "Traditionally used for hair and skin care.",
    ],
    traditionalUsesHi: ["रसायन के रूप में पारंपरिक रूप से वर्णित।", "त्रिफला के अंग के रूप में पाचन से जुड़ा।", "बालों और त्वचा की देखभाल में पारंपरिक उपयोग।"],
    plantParts: ["Fruit"],
    cultivation: "Hardy tree for dry regions; fruits ripen November–February.",
    precautions: GENERAL_PRECAUTION,
    featured: true,
    categories: ["medicinal", "ayurvedic", "fruit", "tree"],
    location: { dLat: -0.0003, dLng: 0.0007, campusArea: "Hostel Garden", locationDescription: "Amla trees in the hostel garden" },
    benefits: [
      { concern: "immunity", concernHi: "रोग-प्रतिरोधक क्षमता", description: "Traditionally described as a Rasayana.", plantPart: "Fruit" },
      { concern: "digestion", concernHi: "पाचन", description: "Traditionally associated with digestion via Triphala.", plantPart: "Fruit" },
      { concern: "hair", concernHi: "बाल", description: "Traditionally used for hair care.", plantPart: "Fruit" },
    ],
    referenceText: "Classical Ayurvedic text (to be verified)",
  },
  {
    slug: "arjuna",
    commonName: "Arjuna",
    scientificName: "Terminalia arjuna",
    hindiName: "अर्जुन",
    sanskritName: "अर्जुन (Arjuna)",
    otherNames: ["Arjun tree", "Kakubha"],
    family: "Combretaceae",
    plantType: "TREE",
    availability: "AVAILABLE",
    description: "A tall tree with smooth, pale grey bark, commonly found along riverbanks. Its bark is traditionally associated with the heart in Ayurveda.",
    descriptionHi: "चिकनी हल्की धूसर छाल वाला ऊँचा वृक्ष, जो प्रायः नदी किनारे मिलता है। इसकी छाल आयुर्वेद में हृदय से पारंपरिक रूप से जुड़ी है।",
    traditionalUses: ["Bark traditionally associated with heart health.", "Bark traditionally used in decoctions (ksheerapaka)."],
    traditionalUsesHi: ["छाल हृदय स्वास्थ्य से पारंपरिक रूप से जुड़ी।", "छाल का क्षीरपाक/काढ़े में पारंपरिक उपयोग।"],
    plantParts: ["Bark"],
    cultivation: "Prefers moist, fertile soil; fast-growing shade tree.",
    precautions: `${GENERAL_PRECAUTION} People with heart conditions must not replace prescribed treatment.`,
    featured: false,
    categories: ["medicinal", "ayurvedic", "tree"],
    location: { dLat: -0.0008, dLng: 0.0002, campusArea: "Academic Block Lawn", locationDescription: "Large tree near the academic block lawn" },
    benefits: [{ concern: "heart", concernHi: "हृदय", description: "Bark traditionally associated with the heart.", plantPart: "Bark" }],
    referenceText: "Classical Ayurvedic text (to be verified)",
  },
  {
    slug: "brahmi",
    commonName: "Brahmi",
    scientificName: "Bacopa monnieri",
    hindiName: "ब्राह्मी",
    sanskritName: "ब्राह्मी (Brāhmī)",
    otherNames: ["Water hyssop", "Jalabrahmi"],
    family: "Plantaginaceae",
    plantType: "HERB",
    availability: "AVAILABLE",
    description: "A small creeping herb of wet places with fleshy leaves and white flowers, traditionally known as a Medhya (intellect-supporting) herb.",
    descriptionHi: "गीली जगहों में फैलने वाली छोटी बूटी, जिसे पारंपरिक रूप से मेध्य (बुद्धिवर्धक) औषधि माना जाता है।",
    traditionalUses: ["Traditionally described as Medhya — supporting memory and learning.", "Traditionally associated with calming the mind."],
    traditionalUsesHi: ["मेध्य — स्मृति और अध्ययन के लिए पारंपरिक रूप से वर्णित।", "मन की शांति से पारंपरिक रूप से जुड़ा।"],
    plantParts: ["Whole plant", "Leaves"],
    cultivation: "Grows in moist or marshy soil; suitable for shallow water tubs.",
    precautions: GENERAL_PRECAUTION,
    featured: true,
    categories: ["medicinal", "ayurvedic", "herbal"],
    location: { dLat: 0.0006, dLng: 0.0004, campusArea: "Medicinal Plant Garden", locationDescription: "Moist beds beside the water channel in the herbal garden" },
    benefits: [
      { concern: "memory", concernHi: "स्मृति", description: "Traditionally described as Medhya.", plantPart: "Whole plant" },
      { concern: "stress", concernHi: "तनाव", description: "Traditionally associated with calming the mind.", plantPart: "Whole plant" },
      { concern: "sleep", concernHi: "नींद", description: "Traditionally associated with a calm mind and rest.", plantPart: "Whole plant" },
    ],
    referenceText: "Classical Ayurvedic text (to be verified)",
  },
  {
    slug: "giloy",
    commonName: "Giloy",
    scientificName: "Tinospora cordifolia",
    hindiName: "गिलोय",
    sanskritName: "गुडूची (Guḍūcī)",
    otherNames: ["Amrita", "Heart-leaved moonseed", "Guduchi"],
    family: "Menispermaceae",
    plantType: "CLIMBER",
    availability: "AVAILABLE",
    description: "A climbing shrub with heart-shaped leaves that often grows over neem trees. Called 'Amrita' in Ayurveda.",
    descriptionHi: "दिल के आकार की पत्तियों वाली बेल जो प्रायः नीम पर चढ़ी मिलती है। आयुर्वेद में इसे 'अमृता' कहा गया है।",
    traditionalUses: ["Stem traditionally described for fevers.", "Traditionally associated with immunity (Rasayana)."],
    traditionalUsesHi: ["तने का ज्वर में पारंपरिक वर्णन।", "रोग-प्रतिरोधक क्षमता (रसायन) से पारंपरिक रूप से जुड़ा।"],
    plantParts: ["Stem"],
    cultivation: "Easily grown from stem cuttings; needs a support tree or trellis.",
    precautions: `${GENERAL_PRECAUTION} Reports of liver-related concerns exist with unsupervised use; avoid self-medication.`,
    featured: false,
    categories: ["medicinal", "ayurvedic", "herbal"],
    location: { dLat: -0.0005, dLng: -0.0002, campusArea: "Main Avenue", locationDescription: "Climbing over a neem tree on the main avenue" },
    benefits: [
      { concern: "fever", concernHi: "ज्वर", description: "Stem traditionally described for fevers.", plantPart: "Stem" },
      { concern: "immunity", concernHi: "रोग-प्रतिरोधक क्षमता", description: "Traditionally associated with immunity.", plantPart: "Stem" },
    ],
    referenceText: "Classical Ayurvedic text (to be verified)",
  },
  {
    slug: "shatavari",
    commonName: "Shatavari",
    scientificName: "Asparagus racemosus",
    hindiName: "शतावरी",
    sanskritName: "शतावरी (Śatāvarī)",
    otherNames: ["Wild asparagus", "Satavar"],
    family: "Asparagaceae",
    plantType: "CLIMBER",
    availability: "AVAILABLE",
    description: "A climbing plant with fine needle-like leaves and clusters of tuberous roots, traditionally valued as a Rasayana, especially for women's health.",
    descriptionHi: "सुई जैसी पत्तियों और कंदीय जड़ों वाली बेल, जिसे विशेषतः महिलाओं के स्वास्थ्य हेतु रसायन माना जाता है।",
    traditionalUses: ["Root traditionally described as a Rasayana for women's health.", "Traditionally associated with digestion (soothing)."],
    traditionalUsesHi: ["जड़ महिलाओं के स्वास्थ्य हेतु रसायन के रूप में पारंपरिक रूप से वर्णित।", "पाचन (शामक) से पारंपरिक रूप से जुड़ा।"],
    plantParts: ["Root"],
    cultivation: "Prefers well-drained loamy soil and partial shade; propagated by seeds or root division.",
    precautions: GENERAL_PRECAUTION,
    featured: false,
    categories: ["medicinal", "ayurvedic", "herbal"],
    location: { dLat: 0.0007, dLng: 0.0007, campusArea: "Medicinal Plant Garden", locationDescription: "Trellis section of the herbal garden" },
    benefits: [
      { concern: "women's health", concernHi: "महिला स्वास्थ्य", description: "Root traditionally described as a Rasayana for women.", plantPart: "Root" },
      { concern: "digestion", concernHi: "पाचन", description: "Traditionally associated with soothing digestion.", plantPart: "Root" },
    ],
    referenceText: "Classical Ayurvedic text (to be verified)",
  },
  {
    slug: "lemongrass",
    commonName: "Lemongrass",
    scientificName: "Cymbopogon citratus",
    hindiName: "लेमनग्रास / नींबू घास",
    sanskritName: "भूतृण (Bhūtṛṇa)",
    otherNames: ["Gandhatrina", "Hari chai"],
    family: "Poaceae",
    plantType: "GRASS",
    availability: "AVAILABLE",
    description: "A tall aromatic grass with a lemon fragrance, used in herbal teas and essential oils.",
    descriptionHi: "नींबू जैसी सुगंध वाली ऊँची घास, जिसका उपयोग हर्बल चाय और सुगंधित तेल में होता है।",
    traditionalUses: ["Traditionally used as an aromatic tea for digestion.", "Traditionally associated with relief in colds."],
    traditionalUsesHi: ["पाचन हेतु सुगंधित चाय के रूप में पारंपरिक उपयोग।", "सर्दी-जुकाम में राहत से पारंपरिक रूप से जुड़ा।"],
    plantParts: ["Leaves"],
    preparation: "Leaves are traditionally steeped as a tea.",
    cultivation: "Grows in clumps in full sun with regular watering; propagated by division.",
    precautions: `${GENERAL_PRECAUTION} Essential oil must be diluted and not swallowed.`,
    featured: false,
    categories: ["herbal", "medicinal"],
    location: { dLat: 0.0002, dLng: -0.0006, campusArea: "Yagyashala Surroundings", locationDescription: "Border plantation near the yagyashala" },
    benefits: [
      { concern: "digestion", concernHi: "पाचन", description: "Traditionally used as an aromatic digestive tea.", plantPart: "Leaves" },
      { concern: "cough", concernHi: "खाँसी", description: "Traditionally associated with relief in colds.", plantPart: "Leaves" },
    ],
    referenceText: "Botanical / Ayurvedic reference (to be verified)",
  },
];

const mantras = [
  {
    title: "Gayatri Mantra",
    sanskritText: "ॐ भूर्भुवः स्वः ।\nतत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि ।\nधियो यो नः प्रचोदयात् ॥",
    transliteration: "Om bhūr bhuvaḥ svaḥ | tat savitur vareṇyaṃ bhargo devasya dhīmahi | dhiyo yo naḥ pracodayāt ||",
    hindiTranslation: "हम उस प्रेरक, श्रेष्ठ सविता देव के तेज का ध्यान करते हैं; वे हमारी बुद्धि को सन्मार्ग पर प्रेरित करें।",
    englishTranslation: "We meditate on the adorable radiance of the divine Savitr; may it inspire and illumine our intellect.",
    meaning: "A prayer for the awakening of right understanding — central to the tradition of Shantikunj and the Gayatri Pariwar.",
    source: "Rigveda 3.62.10",
    verificationStatus: "VERIFIED" as const,
    category: "Knowledge",
    featured: true,
  },
  {
    title: "Shanti Mantra (Dyauh Shanti)",
    sanskritText:
      "ॐ द्यौः शान्तिरन्तरिक्षं शान्तिः पृथिवी शान्तिरापः शान्तिरोषधयः शान्तिः ।\nवनस्पतयः शान्तिर्विश्वेदेवाः शान्तिर्ब्रह्म शान्तिः सर्वं शान्तिः शान्तिरेव शान्तिः सा मा शान्तिरेधि ॥",
    transliteration: "Oṃ dyauḥ śāntir antarikṣaṃ śāntiḥ pṛthivī śāntir āpaḥ śāntir oṣadhayaḥ śāntiḥ | vanaspatayaḥ śāntir …",
    hindiTranslation: "आकाश, अंतरिक्ष, पृथ्वी, जल, औषधियाँ और वनस्पतियाँ — सब शांतिमय हों; वह शांति मुझे भी प्राप्त हो।",
    englishTranslation: "May there be peace in the sky, the atmosphere and the earth; peace in the waters, the healing herbs and the trees; may that peace come to me.",
    meaning: "Names the oshadhi (medicinal herbs) and vanaspati (trees) as part of universal harmony.",
    source: "Shukla Yajurveda (Vajasaneyi Samhita) 36.17",
    verificationStatus: "VERIFIED" as const,
    category: "Environment",
    featured: false,
  },
  {
    title: "Bhumi Sukta",
    sanskritText: "माता भूमिः पुत्रो अहं पृथिव्याः ।",
    transliteration: "Mātā bhūmiḥ putro ahaṃ pṛthivyāḥ",
    hindiTranslation: "भूमि मेरी माता है और मैं पृथ्वी का पुत्र हूँ।",
    englishTranslation: "The Earth is my mother, and I am her child.",
    meaning: "A foundational expression of reverence for the earth and ecological responsibility.",
    source: "Atharvaveda 12.1.12 (Bhumi Sukta)",
    verificationStatus: "VERIFIED" as const,
    category: "Nature",
    featured: false,
  },
  {
    title: "Asato Ma Sadgamaya",
    sanskritText: "ॐ असतो मा सद्गमय ।\nतमसो मा ज्योतिर्गमय ।\nमृत्योर्मा अमृतं गमय ॥",
    transliteration: "Oṃ asato mā sad gamaya | tamaso mā jyotir gamaya | mṛtyor mā amṛtaṃ gamaya ||",
    hindiTranslation: "मुझे असत्य से सत्य की ओर, अंधकार से प्रकाश की ओर, मृत्यु से अमरता की ओर ले चलो।",
    englishTranslation: "Lead me from the unreal to the real, from darkness to light, from death to immortality.",
    meaning: "A prayer for inner growth and knowledge.",
    source: "Brihadaranyaka Upanishad 1.3.28",
    verificationStatus: "VERIFIED" as const,
    category: "Knowledge",
    featured: false,
  },
  {
    title: "Saha Navavatu",
    sanskritText: "ॐ सह नाववतु । सह नौ भुनक्तु । सह वीर्यं करवावहै ।\nतेजस्वि नावधीतमस्तु मा विद्विषावहै ॥\nॐ शान्तिः शान्तिः शान्तिः ॥",
    transliteration: "Oṃ saha nāv avatu | saha nau bhunaktu | saha vīryaṃ karavāvahai | tejasvi nāv adhītam astu mā vidviṣāvahai ||",
    hindiTranslation: "परमात्मा हम दोनों (गुरु-शिष्य) की रक्षा करें, पोषण करें; हम साथ मिलकर शक्ति प्राप्त करें; हमारा अध्ययन तेजस्वी हो; हम परस्पर द्वेष न करें।",
    englishTranslation: "May we (teacher and student) be protected and nourished together; may we work with vigour; may our study be radiant; may we not hate each other.",
    meaning: "The traditional prayer recited before study by teacher and student.",
    source: "Taittiriya Upanishad (Shanti Path)",
    verificationStatus: "VERIFIED" as const,
    category: "Peace",
    featured: false,
  },
  {
    title: "Sarve Bhavantu Sukhinah",
    sanskritText: "सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः ।\nसर्वे भद्राणि पश्यन्तु मा कश्चिद्दुःखभाग्भवेत् ॥",
    transliteration: "Sarve bhavantu sukhinaḥ sarve santu nirāmayāḥ | sarve bhadrāṇi paśyantu mā kaścid duḥkha-bhāg bhavet ||",
    hindiTranslation: "सभी सुखी हों, सभी रोगमुक्त हों, सभी का कल्याण हो, कोई भी दुःख का भागी न बने।",
    englishTranslation: "May all be happy, may all be free from illness, may all see what is auspicious, may no one suffer.",
    meaning: "A universal prayer for health and well-being.",
    source: "Traditional prayer (exact textual source pending verification)",
    verificationStatus: "PENDING" as const,
    category: "Well-being",
    featured: false,
  },
];

async function main() {
  console.log("🌿 Seeding हरिtima …");

  for (const c of categories) {
    await prisma.plantCategory.upsert({ where: { slug: c.slug }, update: c, create: c });
  }

  for (const p of plants) {
    const { location, benefits, referenceText, categories: cats, ...data } = p;
    const connect = cats.map((slug) => ({ slug }));

    const plant = await prisma.plant.upsert({
      where: { slug: p.slug },
      update: { ...data, categories: { set: connect } },
      create: { ...data, imageAlt: `${p.commonName} (${p.scientificName})`, categories: { connect } },
    });

    // Reset child records so re-running the seed stays idempotent.
    await prisma.plantBenefit.deleteMany({ where: { plantId: plant.id } });
    await prisma.ayurvedicReference.deleteMany({ where: { plantId: plant.id } });
    await prisma.plantLocation.deleteMany({ where: { plantId: plant.id } });

    const ref = await prisma.ayurvedicReference.create({
      data: {
        plantId: plant.id,
        textName: referenceText,
        citation: PENDING,
        sourceType: p.slug === "lemongrass" ? "BOTANICAL_REFERENCE" : "CLASSICAL_AYURVEDIC_TEXT",
        verificationStatus: "PENDING",
        notes: "Seed placeholder. Add the exact text, chapter/section and verse only after checking the original source, then mark VERIFIED.",
      },
    });

    await prisma.plantBenefit.createMany({
      data: benefits.map((b) => ({ ...b, plantId: plant.id, referenceId: ref.id })),
    });

    await prisma.plantLocation.create({
      data: {
        plantId: plant.id,
        ...at(location.dLat, location.dLng),
        isApproximate: true,
        campusArea: location.campusArea,
        locationDescription: `${location.locationDescription} (approximate — to be confirmed with GPS)`,
        landmark: location.landmark,
      },
    });

    // Knowledge chunks for full-text RAG retrieval (embeddings are added via Admin → Knowledge → Reindex).
    const names = [p.commonName, p.hindiName, p.sanskritName, p.scientificName, ...p.otherNames].join(", ");
    await prisma.knowledgeDocument.deleteMany({ where: { plantId: plant.id } });
    await prisma.knowledgeDocument.createMany({
      data: [
        {
          plantId: plant.id,
          kind: "plant",
          title: p.commonName,
          content: `${names}. Family: ${p.family}. ${p.description} Parts used: ${p.plantParts.join(", ")}. Campus: ${location.campusArea}`,
          embedding: [],
        },
        ...p.traditionalUses.map((u, i) => ({
          plantId: plant.id,
          kind: "use",
          title: `${p.commonName} — traditional use`,
          content: `${names}. Traditional use: ${u} ${p.traditionalUsesHi[i] ?? ""}`,
          embedding: [],
        })),
        ...benefits.map((b) => ({
          plantId: plant.id,
          kind: "use",
          title: `${p.commonName} — ${b.concern}`,
          content: `${names}. Concern: ${b.concern} ${b.concernHi}. ${b.description} Part: ${b.plantPart ?? "—"}`,
          embedding: [],
        })),
      ],
    });
    console.log(`  ✓ ${p.commonName}`);
  }

  await prisma.mantra.deleteMany({ where: { title: { in: mantras.map((m) => m.title) } } });
  await prisma.mantra.createMany({ data: mantras });
  console.log(`  ✓ ${mantras.length} mantras`);

  await prisma.setting.upsert({
    where: { key: "siteNotice" },
    update: {},
    create: { key: "siteNotice", value: "Seed data: locations are approximate and references are pending verification." },
  });

  console.log("✅ Done. Next: npm run create-admin, then Admin → Knowledge → Reindex (if AI_API_KEY is set).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
