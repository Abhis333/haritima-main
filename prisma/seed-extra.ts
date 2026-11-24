/**
 * हरिtima — additional demonstration plants (run after prisma/seed.ts).
 *
 * Unlike seed.ts this script is ADD-ONLY: a plant whose slug already exists is skipped untouched,
 * so admin edits, GPS readings and verified references are never overwritten.
 *
 * Same academic-integrity rules as seed.ts:
 *  - Every reference is PENDING with no invented chapter, verse or quotation.
 *  - Coordinates are approximate placeholders; replace them with GPS readings (Admin → Locations).
 *  - Traditional uses are general, widely documented associations, for education only.
 *
 * Run: npm run db:seed-extra, then Admin → Knowledge → Reindex to build embeddings.
 */
import { PrismaClient, type Availability, type PlantType } from "@prisma/client";
import { SOURCE_SUGGESTIONS, SUGGESTION_NOTE } from "./reference-suggestions";

const prisma = new PrismaClient();

const LAT = Number(process.env.NEXT_PUBLIC_CAMPUS_LAT || 29.998143);
const LNG = Number(process.env.NEXT_PUBLIC_CAMPUS_LNG || 78.192779);
const at = (dLat: number, dLng: number) => ({ latitude: +(LAT + dLat).toFixed(6), longitude: +(LNG + dLng).toFixed(6) });

const PENDING = "Reference pending verification";
const CLASSICAL = "Classical Ayurvedic text (to be verified)";

const GENERAL_PRECAUTION =
  "Educational information only. Consult a qualified Ayurvedic physician or doctor before any use, especially during pregnancy, breastfeeding, for children, or alongside other medicines.";

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
  sourceType?: "CLASSICAL_AYURVEDIC_TEXT" | "BOTANICAL_REFERENCE";
};

const plants: SeedPlant[] = [
  {
    slug: "peepal",
    commonName: "Peepal",
    scientificName: "Ficus religiosa",
    hindiName: "पीपल",
    sanskritName: "अश्वत्थ (Aśvattha)",
    otherNames: ["Sacred fig", "Bodhi tree", "Pipal"],
    family: "Moraceae",
    plantType: "TREE",
    availability: "AVAILABLE",
    description: "A large, long-lived sacred tree with heart-shaped leaves ending in a long tip. It is revered across Indian traditions and widely planted near temples.",
    descriptionHi: "लंबी नोक वाली दिल के आकार की पत्तियों वाला विशाल और दीर्घजीवी पवित्र वृक्ष। भारतीय परंपराओं में पूजनीय और मंदिरों के पास व्यापक रूप से लगाया जाता है।",
    traditionalUses: ["Traditionally revered as a sacred tree and planted near places of worship.", "Bark traditionally described for skin and oral care."],
    traditionalUsesHi: ["पवित्र वृक्ष के रूप में पूजनीय और पूजा-स्थलों के पास लगाया जाता है।", "छाल का त्वचा और मुख की देखभाल में पारंपरिक वर्णन।"],
    plantParts: ["Bark", "Leaves"],
    cultivation: "Very hardy; grows in most soils and full sun. Needs space, as roots and canopy spread widely.",
    precautions: GENERAL_PRECAUTION,
    featured: false,
    categories: ["sacred", "tree", "ayurvedic"],
    location: { dLat: -0.0002, dLng: -0.0007, campusArea: "Yagyashala Surroundings", locationDescription: "Large peepal tree beside the yagyashala", landmark: "Yagyashala" },
    benefits: [
      { concern: "skin", concernHi: "त्वचा", description: "Bark traditionally described for skin care.", plantPart: "Bark" },
      { concern: "oral health", concernHi: "मुख स्वास्थ्य", description: "Bark traditionally described for oral care.", plantPart: "Bark" },
    ],
    referenceText: CLASSICAL,
  },
  {
    slug: "bargad",
    commonName: "Banyan",
    scientificName: "Ficus benghalensis",
    hindiName: "बरगद / वट",
    sanskritName: "वट (Vaṭa)",
    otherNames: ["Bargad", "Vat vriksha", "Indian banyan"],
    family: "Moraceae",
    plantType: "TREE",
    availability: "AVAILABLE",
    description: "India's national tree, known for aerial roots that grow down from its branches and become new trunks. A symbol of longevity in Indian culture.",
    descriptionHi: "भारत का राष्ट्रीय वृक्ष, जिसकी शाखाओं से लटकती जटाएँ ज़मीन में जाकर नए तने बन जाती हैं। भारतीय संस्कृति में दीर्घायु का प्रतीक।",
    traditionalUses: ["Traditionally revered as a sacred tree of longevity.", "Aerial root tips traditionally used as a datun for oral hygiene."],
    traditionalUsesHi: ["दीर्घायु के पवित्र वृक्ष के रूप में पूजनीय।", "जटाओं के सिरों का दातुन के रूप में पारंपरिक उपयोग।"],
    plantParts: ["Aerial roots", "Bark", "Latex"],
    cultivation: "Hardy and fast-growing in warm climates; needs a very large open space.",
    precautions: GENERAL_PRECAUTION,
    featured: false,
    categories: ["sacred", "tree"],
    location: { dLat: -0.0010, dLng: -0.0005, campusArea: "Main Avenue", locationDescription: "Old banyan tree near the main avenue junction" },
    benefits: [{ concern: "oral health", concernHi: "मुख स्वास्थ्य", description: "Aerial root tips traditionally used as datun.", plantPart: "Aerial roots" }],
    referenceText: CLASSICAL,
  },
  {
    slug: "bael",
    commonName: "Bael",
    scientificName: "Aegle marmelos",
    hindiName: "बेल",
    sanskritName: "बिल्व (Bilva)",
    otherNames: ["Bengal quince", "Wood apple", "Bilva"],
    family: "Rutaceae",
    plantType: "TREE",
    availability: "SEASONAL",
    description: "A thorny, medium-sized tree with hard-shelled fruits and trifoliate leaves offered in Shiva worship. Its fruit is traditionally valued for digestion.",
    descriptionHi: "कठोर छिलके वाले फलों और त्रिपत्री पत्तियों वाला काँटेदार मध्यम वृक्ष; पत्तियाँ शिव पूजा में चढ़ाई जाती हैं। फल पाचन के लिए पारंपरिक रूप से महत्वपूर्ण।",
    traditionalUses: ["Unripe fruit traditionally described for loose motions and digestion.", "Ripe fruit pulp traditionally taken as a cooling summer drink (sharbat)."],
    traditionalUsesHi: ["कच्चे फल का दस्त और पाचन में पारंपरिक वर्णन।", "पके फल का गूदा गर्मियों में शीतल शरबत के रूप में पारंपरिक रूप से लिया जाता है।"],
    plantParts: ["Fruit", "Leaves", "Root"],
    cultivation: "Drought-tolerant; grows in poor soils and full sun. Fruits ripen in summer.",
    precautions: GENERAL_PRECAUTION,
    featured: true,
    categories: ["sacred", "medicinal", "ayurvedic", "fruit", "tree"],
    location: { dLat: 0.0001, dLng: -0.0009, campusArea: "Yagyashala Surroundings", locationDescription: "Bael tree on the path to the yagyashala" },
    benefits: [
      { concern: "digestion", concernHi: "पाचन", description: "Fruit traditionally associated with digestion.", plantPart: "Fruit" },
      { concern: "diarrhoea", concernHi: "दस्त", description: "Unripe fruit traditionally described for loose motions.", plantPart: "Fruit" },
    ],
    referenceText: CLASSICAL,
  },
  {
    slug: "haritaki",
    commonName: "Haritaki",
    scientificName: "Terminalia chebula",
    hindiName: "हरड़ / हरीतकी",
    sanskritName: "हरीतकी (Harītakī)",
    otherNames: ["Chebulic myrobalan", "Harad", "Harde"],
    family: "Combretaceae",
    plantType: "TREE",
    availability: "SEASONAL",
    description: "A deciduous tree whose dried fruit is one of the three fruits of Triphala. It is among the most frequently mentioned herbs in Ayurveda.",
    descriptionHi: "पर्णपाती वृक्ष जिसका सूखा फल त्रिफला के तीन फलों में से एक है। आयुर्वेद में सबसे अधिक वर्णित औषधियों में से एक।",
    traditionalUses: ["Traditionally described for digestion and regular bowel movement (as part of Triphala).", "Traditionally described as a Rasayana."],
    traditionalUsesHi: ["त्रिफला के अंग के रूप में पाचन और नियमित मल-त्याग हेतु पारंपरिक वर्णन।", "रसायन के रूप में पारंपरिक वर्णन।"],
    plantParts: ["Fruit"],
    cultivation: "Grows in deep, well-drained soil in full sun; slow-growing tree.",
    precautions: `${GENERAL_PRECAUTION} Traditionally avoided in pregnancy and in states of exhaustion or dehydration.`,
    featured: false,
    categories: ["medicinal", "ayurvedic", "tree"],
    location: { dLat: 0.0009, dLng: 0.0003, campusArea: "Medicinal Plant Garden", locationDescription: "Triphala corner at the north end of the herbal garden" },
    benefits: [
      { concern: "digestion", concernHi: "पाचन", description: "Traditionally associated with digestion via Triphala.", plantPart: "Fruit" },
      { concern: "constipation", concernHi: "कब्ज़", description: "Traditionally described for regular bowel movement.", plantPart: "Fruit" },
    ],
    referenceText: CLASSICAL,
  },
  {
    slug: "bibhitaki",
    commonName: "Bibhitaki",
    scientificName: "Terminalia bellirica",
    hindiName: "बहेड़ा",
    sanskritName: "बिभीतकी (Bibhītakī)",
    otherNames: ["Baheda", "Beleric myrobalan"],
    family: "Combretaceae",
    plantType: "TREE",
    availability: "SEASONAL",
    description: "A tall deciduous tree whose fruit is the third member of Triphala. Traditionally associated with the throat and respiratory tract.",
    descriptionHi: "ऊँचा पर्णपाती वृक्ष जिसका फल त्रिफला का तीसरा घटक है। गले और श्वसन मार्ग से पारंपरिक रूप से जुड़ा।",
    traditionalUses: ["Fruit traditionally described for cough and throat discomfort.", "Traditionally associated with digestion (as part of Triphala)."],
    traditionalUsesHi: ["फल का खाँसी और गले की तकलीफ़ में पारंपरिक वर्णन।", "त्रिफला के अंग के रूप में पाचन से जुड़ा।"],
    plantParts: ["Fruit"],
    cultivation: "Tall tree for open areas; prefers well-drained soil and full sun.",
    precautions: GENERAL_PRECAUTION,
    featured: false,
    categories: ["medicinal", "ayurvedic", "tree"],
    location: { dLat: 0.0010, dLng: 0.0005, campusArea: "Medicinal Plant Garden", locationDescription: "Triphala corner at the north end of the herbal garden" },
    benefits: [
      { concern: "cough", concernHi: "खाँसी", description: "Fruit traditionally described for cough and throat.", plantPart: "Fruit" },
      { concern: "digestion", concernHi: "पाचन", description: "Traditionally associated with digestion via Triphala.", plantPart: "Fruit" },
    ],
    referenceText: CLASSICAL,
  },
  {
    slug: "vasaka",
    commonName: "Vasaka",
    scientificName: "Justicia adhatoda",
    hindiName: "अडूसा / वासा",
    sanskritName: "वासा (Vāsā)",
    otherNames: ["Adusa", "Malabar nut", "Adhatoda vasica"],
    family: "Acanthaceae",
    plantType: "SHRUB",
    availability: "AVAILABLE",
    description: "An evergreen shrub with large lance-shaped leaves and white flowers. Its leaves are among the best-known traditional herbs for cough.",
    descriptionHi: "बड़ी भाले जैसी पत्तियों और सफ़ेद फूलों वाली सदाबहार झाड़ी। इसकी पत्तियाँ खाँसी की सबसे प्रसिद्ध पारंपरिक औषधियों में हैं।",
    traditionalUses: ["Leaves traditionally described for cough and congestion.", "Traditionally associated with easing breathing in colds."],
    traditionalUsesHi: ["पत्तियों का खाँसी और कफ़ में पारंपरिक वर्णन।", "सर्दी में श्वास को सहज करने से पारंपरिक रूप से जुड़ा।"],
    plantParts: ["Leaves", "Flowers", "Root"],
    cultivation: "Hardy shrub; grows in most soils and is often used as a hedge.",
    precautions: `${GENERAL_PRECAUTION} Traditionally avoided in pregnancy.`,
    featured: true,
    categories: ["medicinal", "ayurvedic", "herbal", "shrub"],
    location: { dLat: 0.0005, dLng: 0.0001, campusArea: "Medicinal Plant Garden", locationDescription: "Hedge along the western edge of the herbal garden" },
    benefits: [
      { concern: "cough", concernHi: "खाँसी", description: "Leaves traditionally described for cough.", plantPart: "Leaves" },
      { concern: "cold", concernHi: "सर्दी-जुकाम", description: "Traditionally associated with relief from congestion.", plantPart: "Leaves" },
    ],
    referenceText: CLASSICAL,
  },
  {
    slug: "haldi",
    commonName: "Turmeric",
    scientificName: "Curcuma longa",
    hindiName: "हल्दी",
    sanskritName: "हरिद्रा (Haridrā)",
    otherNames: ["Haldi", "Haridra"],
    family: "Zingiberaceae",
    plantType: "HERB",
    availability: "SEASONAL",
    description: "A leafy herb grown for its bright yellow-orange rhizome, used daily in Indian cooking and traditional skin care.",
    descriptionHi: "पीले-नारंगी प्रकंद वाली पत्तेदार बूटी, जिसका भारतीय रसोई और पारंपरिक त्वचा देखभाल में रोज़ उपयोग होता है।",
    traditionalUses: ["Rhizome paste traditionally applied for skin care and minor cuts.", "Traditionally taken with warm milk in colds."],
    traditionalUsesHi: ["प्रकंद का लेप त्वचा और छोटे घावों पर पारंपरिक रूप से लगाया जाता है।", "सर्दी में गर्म दूध के साथ पारंपरिक रूप से लिया जाता है।"],
    plantParts: ["Rhizome"],
    preparation: "The dried rhizome is traditionally used as a powder in food or with milk.",
    cultivation: "Planted from rhizomes before the monsoon; needs warm, humid conditions and loose soil. Harvested in winter.",
    precautions: `${GENERAL_PRECAUTION} Concentrated supplements may interact with blood-thinning medicines.`,
    featured: false,
    categories: ["medicinal", "ayurvedic", "herbal"],
    location: { dLat: 0.0003, dLng: 0.0005, campusArea: "Medicinal Plant Garden", locationDescription: "Spice beds in the centre of the herbal garden" },
    benefits: [
      { concern: "skin", concernHi: "त्वचा", description: "Paste traditionally applied for skin care.", plantPart: "Rhizome" },
      { concern: "wounds", concernHi: "घाव", description: "Traditionally applied to minor cuts.", plantPart: "Rhizome" },
      { concern: "cough", concernHi: "खाँसी", description: "Traditionally taken with warm milk in colds.", plantPart: "Rhizome" },
    ],
    referenceText: CLASSICAL,
  },
  {
    slug: "adrak",
    commonName: "Ginger",
    scientificName: "Zingiber officinale",
    hindiName: "अदरक / सोंठ",
    sanskritName: "आर्द्रक / शुण्ठी (Ārdraka / Śuṇṭhī)",
    otherNames: ["Adrak", "Sonth", "Shunthi"],
    family: "Zingiberaceae",
    plantType: "HERB",
    availability: "SEASONAL",
    description: "A herb grown for its pungent rhizome, used fresh (adrak) or dried (sonth) in cooking and traditional home remedies.",
    descriptionHi: "तीखे प्रकंद वाली बूटी, जिसका ताज़ा (अदरक) या सूखा (सोंठ) रूप भोजन और घरेलू नुस्खों में उपयोग होता है।",
    traditionalUses: ["Traditionally described for digestion and appetite.", "Traditionally taken as a tea in cough and cold.", "Traditionally associated with relief from nausea."],
    traditionalUsesHi: ["पाचन और भूख के लिए पारंपरिक वर्णन।", "खाँसी-जुकाम में चाय के रूप में पारंपरिक उपयोग।", "जी मिचलाने में राहत से पारंपरिक रूप से जुड़ा।"],
    plantParts: ["Rhizome"],
    preparation: "Fresh rhizome is traditionally added to tea or food; dried ginger is used as a powder.",
    cultivation: "Planted from rhizomes in partial shade with rich, moist, well-drained soil.",
    precautions: GENERAL_PRECAUTION,
    featured: false,
    categories: ["medicinal", "ayurvedic", "herbal"],
    location: { dLat: 0.0003, dLng: 0.0006, campusArea: "Medicinal Plant Garden", locationDescription: "Spice beds in the centre of the herbal garden" },
    benefits: [
      { concern: "digestion", concernHi: "पाचन", description: "Traditionally described for digestion and appetite.", plantPart: "Rhizome" },
      { concern: "cough", concernHi: "खाँसी", description: "Traditionally taken as a tea in cough and cold.", plantPart: "Rhizome" },
      { concern: "nausea", concernHi: "जी मिचलाना", description: "Traditionally associated with relief from nausea.", plantPart: "Rhizome" },
    ],
    referenceText: CLASSICAL,
  },
  {
    slug: "pudina",
    commonName: "Mint",
    scientificName: "Mentha arvensis",
    hindiName: "पुदीना",
    sanskritName: "पूतिहा (Pūtihā)",
    otherNames: ["Pudina", "Field mint", "Corn mint"],
    family: "Lamiaceae",
    plantType: "HERB",
    availability: "AVAILABLE",
    description: "A fast-spreading aromatic herb with a cooling taste, used fresh in chutneys and drinks.",
    descriptionHi: "ठंडक भरे स्वाद वाली तेज़ी से फैलने वाली सुगंधित बूटी, जिसका ताज़ा उपयोग चटनी और पेय में होता है।",
    traditionalUses: ["Traditionally used for digestion and to relieve gas.", "Traditionally taken as a cooling drink in summer."],
    traditionalUsesHi: ["पाचन और गैस में राहत के लिए पारंपरिक उपयोग।", "गर्मियों में शीतल पेय के रूप में पारंपरिक रूप से लिया जाता है।"],
    plantParts: ["Leaves"],
    cultivation: "Grows easily from cuttings in moist soil and partial shade; best kept in a pot or bed as it spreads quickly.",
    precautions: `${GENERAL_PRECAUTION} Mint oil must be diluted and not swallowed.`,
    featured: false,
    categories: ["herbal", "medicinal"],
    location: { dLat: 0.0004, dLng: -0.0001, campusArea: "Hostel Garden", locationDescription: "Kitchen-herb beds behind the hostel" },
    benefits: [{ concern: "digestion", concernHi: "पाचन", description: "Traditionally used for digestion and gas.", plantPart: "Leaves" }],
    referenceText: "Botanical / Ayurvedic reference (to be verified)",
    sourceType: "BOTANICAL_REFERENCE",
  },
  {
    slug: "ashoka",
    commonName: "Ashoka",
    scientificName: "Saraca asoca",
    hindiName: "अशोक",
    sanskritName: "अशोक (Aśoka)",
    otherNames: ["Sita Ashok", "Saraca indica"],
    family: "Fabaceae",
    plantType: "TREE",
    availability: "LIMITED",
    description: "An evergreen tree with drooping leaves and clusters of orange-red flowers, sacred in Indian tradition. Not to be confused with the tall, column-shaped 'false Ashoka' (Polyalthia longifolia) often planted along roads.",
    descriptionHi: "झुकी पत्तियों और नारंगी-लाल फूलों के गुच्छों वाला सदाबहार पवित्र वृक्ष। सड़कों पर लगने वाले ऊँचे, स्तंभ जैसे 'नकली अशोक' (पॉलीअल्थिया) से भिन्न।",
    traditionalUses: ["Bark traditionally described for women's health.", "Traditionally revered as a sacred tree."],
    traditionalUsesHi: ["छाल का महिलाओं के स्वास्थ्य हेतु पारंपरिक वर्णन।", "पवित्र वृक्ष के रूप में पूजनीय।"],
    plantParts: ["Bark", "Flowers"],
    cultivation: "Prefers moist, fertile soil and partial shade; slow-growing.",
    precautions: GENERAL_PRECAUTION,
    featured: false,
    categories: ["sacred", "medicinal", "ayurvedic", "flower", "tree"],
    location: { dLat: -0.0007, dLng: 0.0004, campusArea: "Academic Block Lawn", locationDescription: "Flowering tree at the corner of the academic block lawn" },
    benefits: [{ concern: "women's health", concernHi: "महिला स्वास्थ्य", description: "Bark traditionally described for women's health.", plantPart: "Bark" }],
    referenceText: CLASSICAL,
  },
  {
    slug: "gudhal",
    commonName: "Hibiscus",
    scientificName: "Hibiscus rosa-sinensis",
    hindiName: "गुड़हल",
    sanskritName: "जपा (Japā)",
    otherNames: ["Gudhal", "China rose", "Japa"],
    family: "Malvaceae",
    plantType: "SHRUB",
    availability: "AVAILABLE",
    description: "A flowering shrub with large red flowers offered in worship. Its flowers and leaves are traditionally used in hair care.",
    descriptionHi: "बड़े लाल फूलों वाली झाड़ी जिसके फूल पूजा में चढ़ाए जाते हैं। फूल और पत्तियाँ बालों की देखभाल में पारंपरिक रूप से उपयोगी।",
    traditionalUses: ["Flowers and leaves traditionally used in hair oils and hair washes.", "Flowers traditionally offered in worship."],
    traditionalUsesHi: ["फूल और पत्तियाँ बालों के तेल और धोने में पारंपरिक रूप से उपयोगी।", "फूल पूजा में पारंपरिक रूप से चढ़ाए जाते हैं।"],
    plantParts: ["Flowers", "Leaves"],
    cultivation: "Easy to grow from cuttings; flowers best in full sun with regular watering.",
    precautions: GENERAL_PRECAUTION,
    featured: false,
    categories: ["flower", "ornamental", "sacred", "shrub"],
    location: { dLat: -0.0004, dLng: 0.0001, campusArea: "Academic Block Lawn", locationDescription: "Flower border along the academic block path" },
    benefits: [{ concern: "hair", concernHi: "बाल", description: "Flowers and leaves traditionally used in hair care.", plantPart: "Flowers" }],
    referenceText: CLASSICAL,
  },
  {
    slug: "moringa",
    commonName: "Moringa",
    scientificName: "Moringa oleifera",
    hindiName: "सहजन",
    sanskritName: "शिग्रु (Śigru)",
    otherNames: ["Drumstick tree", "Sahjan", "Shigru"],
    family: "Moringaceae",
    plantType: "TREE",
    availability: "AVAILABLE",
    description: "A fast-growing tree with small feathery leaves and long drumstick pods. Its leaves and pods are eaten as a nutritious vegetable.",
    descriptionHi: "छोटी पंखनुमा पत्तियों और लंबी फलियों वाला तेज़ी से बढ़ने वाला वृक्ष। पत्तियाँ और फलियाँ पौष्टिक सब्ज़ी के रूप में खाई जाती हैं।",
    traditionalUses: ["Leaves and pods traditionally eaten as a nutritious food.", "Traditionally associated with joint comfort (as a food)."],
    traditionalUsesHi: ["पत्तियाँ और फलियाँ पौष्टिक भोजन के रूप में पारंपरिक रूप से खाई जाती हैं।", "भोजन के रूप में जोड़ों के आराम से पारंपरिक रूप से जुड़ा।"],
    plantParts: ["Leaves", "Pods", "Flowers"],
    cultivation: "Drought-tolerant and fast-growing in full sun; grows from seeds or stem cuttings.",
    precautions: `${GENERAL_PRECAUTION} Root and bark are traditionally avoided in pregnancy.`,
    featured: false,
    categories: ["medicinal", "ayurvedic", "tree"],
    location: { dLat: -0.0002, dLng: 0.0009, campusArea: "Hostel Garden", locationDescription: "Drumstick trees along the hostel garden fence" },
    benefits: [
      { concern: "nutrition", concernHi: "पोषण", description: "Leaves and pods traditionally eaten as a nutritious food.", plantPart: "Leaves" },
      { concern: "joint pain", concernHi: "जोड़ों का दर्द", description: "Traditionally associated with joint comfort.", plantPart: "Pods" },
    ],
    referenceText: CLASSICAL,
  },
  {
    slug: "kalmegh",
    commonName: "Kalmegh",
    scientificName: "Andrographis paniculata",
    hindiName: "कालमेघ",
    sanskritName: "भूनिम्ब / कालमेघ (Bhūnimba)",
    otherNames: ["King of bitters", "Green chiretta", "Bhunimba"],
    family: "Acanthaceae",
    plantType: "HERB",
    availability: "SEASONAL",
    description: "An upright annual herb with an intensely bitter taste, often called the 'King of bitters'.",
    descriptionHi: "अत्यंत कड़वे स्वाद वाली सीधी वार्षिक बूटी, जिसे 'कड़वाहट का राजा' कहा जाता है।",
    traditionalUses: ["Traditionally described for fevers.", "Traditionally associated with supporting the liver (bitter tonic)."],
    traditionalUsesHi: ["ज्वर में पारंपरिक वर्णन।", "कड़वे टॉनिक के रूप में यकृत (लिवर) से पारंपरिक रूप से जुड़ा।"],
    plantParts: ["Whole plant", "Leaves"],
    cultivation: "Sown in the monsoon; grows in shaded, moist soil.",
    precautions: `${GENERAL_PRECAUTION} Traditionally avoided in pregnancy.`,
    featured: false,
    categories: ["medicinal", "ayurvedic", "herbal"],
    location: { dLat: 0.0006, dLng: 0.0002, campusArea: "Medicinal Plant Garden", locationDescription: "Shaded beds in the herbal garden" },
    benefits: [
      { concern: "fever", concernHi: "ज्वर", description: "Traditionally described for fevers.", plantPart: "Whole plant" },
      { concern: "liver", concernHi: "यकृत", description: "Traditionally associated with the liver as a bitter tonic.", plantPart: "Whole plant" },
    ],
    referenceText: CLASSICAL,
  },
  {
    slug: "punarnava",
    commonName: "Punarnava",
    scientificName: "Boerhavia diffusa",
    hindiName: "पुनर्नवा / साँठ",
    sanskritName: "पुनर्नवा (Punarnavā)",
    otherNames: ["Red spiderling", "Hogweed", "Santh"],
    family: "Nyctaginaceae",
    plantType: "HERB",
    availability: "AVAILABLE",
    description: "A spreading herb with small pink flowers that springs back every monsoon, which is what its name, 'renewing again', refers to.",
    descriptionHi: "छोटे गुलाबी फूलों वाली फैलने वाली बूटी जो हर वर्षा ऋतु में फिर उग आती है; इसका नाम 'फिर से नया होने वाली' इसी से है।",
    traditionalUses: ["Traditionally described for swelling (shotha).", "Traditionally associated with urinary health."],
    traditionalUsesHi: ["सूजन (शोथ) में पारंपरिक वर्णन।", "मूत्र स्वास्थ्य से पारंपरिक रूप से जुड़ा।"],
    plantParts: ["Whole plant", "Root"],
    cultivation: "Grows wild in waste ground and garden edges; spreads on its own after the monsoon.",
    precautions: GENERAL_PRECAUTION,
    featured: false,
    categories: ["medicinal", "ayurvedic", "herbal"],
    location: { dLat: 0.0007, dLng: -0.0001, campusArea: "Medicinal Plant Garden", locationDescription: "Ground-cover beds near the water channel" },
    benefits: [
      { concern: "swelling", concernHi: "सूजन", description: "Traditionally described for swelling.", plantPart: "Whole plant" },
      { concern: "urinary health", concernHi: "मूत्र स्वास्थ्य", description: "Traditionally associated with urinary health.", plantPart: "Root" },
    ],
    referenceText: CLASSICAL,
  },
  {
    slug: "shankhpushpi",
    commonName: "Shankhpushpi",
    scientificName: "Convolvulus prostratus",
    hindiName: "शंखपुष्पी",
    sanskritName: "शङ्खपुष्पी (Śaṅkhapuṣpī)",
    otherNames: ["Convolvulus pluricaulis", "Shankhavali"],
    family: "Convolvulaceae",
    plantType: "HERB",
    availability: "LIMITED",
    description: "A small spreading herb with conch-shaped white or pale-blue flowers, traditionally known as a Medhya (intellect-supporting) herb.",
    descriptionHi: "शंख जैसे सफ़ेद या हल्के नीले फूलों वाली छोटी फैलने वाली बूटी, जिसे पारंपरिक रूप से मेध्य (बुद्धिवर्धक) माना जाता है।",
    traditionalUses: ["Traditionally described as Medhya, supporting memory and concentration.", "Traditionally associated with calming the mind and sleep."],
    traditionalUsesHi: ["मेध्य, स्मृति और एकाग्रता के लिए पारंपरिक वर्णन।", "मन की शांति और नींद से पारंपरिक रूप से जुड़ा।"],
    plantParts: ["Whole plant"],
    cultivation: "Grows in dry, sandy or stony soil in full sun.",
    precautions: GENERAL_PRECAUTION,
    featured: false,
    categories: ["medicinal", "ayurvedic", "herbal"],
    location: { dLat: 0.0008, dLng: 0.0006, campusArea: "Medicinal Plant Garden", locationDescription: "Rockery section of the herbal garden" },
    benefits: [
      { concern: "memory", concernHi: "स्मृति", description: "Traditionally described as Medhya.", plantPart: "Whole plant" },
      { concern: "stress", concernHi: "तनाव", description: "Traditionally associated with calming the mind.", plantPart: "Whole plant" },
    ],
    referenceText: CLASSICAL,
  },
  {
    slug: "genda",
    commonName: "Marigold",
    scientificName: "Tagetes erecta",
    hindiName: "गेंदा",
    sanskritName: "स्थूलपुष्प (Sthūlapuṣpa)",
    otherNames: ["Genda", "African marigold"],
    family: "Asteraceae",
    plantType: "HERB",
    availability: "SEASONAL",
    description: "A bright orange and yellow flowering annual, used in garlands, worship and festivals across India.",
    descriptionHi: "चमकीले नारंगी और पीले फूलों वाला मौसमी पौधा, जिसका पूरे भारत में मालाओं, पूजा और त्योहारों में उपयोग होता है।",
    traditionalUses: ["Flowers traditionally used in garlands and worship.", "Leaf paste traditionally applied to minor cuts."],
    traditionalUsesHi: ["फूल मालाओं और पूजा में पारंपरिक रूप से उपयोगी।", "पत्तियों का लेप छोटे घावों पर पारंपरिक रूप से लगाया जाता है।"],
    plantParts: ["Flowers", "Leaves"],
    cultivation: "Easy from seed in full sun; main flowering in winter and around festivals.",
    precautions: GENERAL_PRECAUTION,
    featured: false,
    categories: ["flower", "ornamental", "sacred"],
    location: { dLat: -0.0003, dLng: -0.0003, campusArea: "Main Avenue", locationDescription: "Seasonal flower beds along the main avenue" },
    benefits: [{ concern: "wounds", concernHi: "घाव", description: "Leaf paste traditionally applied to minor cuts.", plantPart: "Leaves" }],
    referenceText: "Botanical / Ayurvedic reference (to be verified)",
    sourceType: "BOTANICAL_REFERENCE",
  },
];

async function main() {
  console.log("🌿 Adding extra plants to हरिtima (existing plants are left untouched) …");

  const known = new Set((await prisma.plantCategory.findMany({ select: { slug: true } })).map((c) => c.slug));
  if (known.size === 0) throw new Error("No categories found. Run `npm run db:seed` first.");

  let added = 0;
  for (const p of plants) {
    if (await prisma.plant.findUnique({ where: { slug: p.slug }, select: { id: true } })) {
      console.log(`  · ${p.commonName} already exists, skipped`);
      continue;
    }
    const { location, benefits, referenceText, sourceType, categories: cats, ...data } = p;

    await prisma.$transaction(async (tx) => {
      const plant = await tx.plant.create({
        data: { ...data, imageAlt: `${p.commonName} (${p.scientificName})`, categories: { connect: cats.filter((s) => known.has(s)).map((slug) => ({ slug })) } },
      });

      const suggestion = SOURCE_SUGGESTIONS[p.slug];
      const ref = await tx.ayurvedicReference.create({
        data: {
          plantId: plant.id,
          textName: suggestion?.textName ?? referenceText,
          author: suggestion?.author,
          citation: PENDING,
          sourceType: suggestion?.sourceType ?? sourceType ?? "CLASSICAL_AYURVEDIC_TEXT",
          verificationStatus: "PENDING",
          notes: suggestion
            ? SUGGESTION_NOTE
            : "Seed placeholder. Add the exact text, chapter/section and verse only after checking the original source, then mark VERIFIED.",
        },
      });

      await tx.plantBenefit.createMany({ data: benefits.map((b) => ({ ...b, plantId: plant.id, referenceId: ref.id })) });

      await tx.plantLocation.create({
        data: {
          plantId: plant.id,
          ...at(location.dLat, location.dLng),
          isApproximate: true,
          campusArea: location.campusArea,
          locationDescription: `${location.locationDescription} (approximate — to be confirmed with GPS)`,
          landmark: location.landmark,
        },
      });

      // Same chunk layout as seed.ts so full-text retrieval works before the first Reindex.
      const names = [p.commonName, p.hindiName, p.sanskritName, p.scientificName, ...p.otherNames].join(", ");
      await tx.knowledgeDocument.createMany({
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
    }, { timeout: 60_000, maxWait: 20_000 }); // remote (Neon/Supabase) round trips easily exceed the 5 s default
    added++;
    console.log(`  ✓ ${p.commonName}`);
  }

  console.log(`✅ Added ${added} plant(s). Next: Admin → Knowledge → Reindex to build embeddings for the chatbot.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
