export type Lang = "en" | "hi";
export const LANG_COOKIE = "haritima-lang";

const en = {
  nav: { home: "Home", plants: "Plants", map: "Map", ayurveda: "Ayurveda", mantras: "Mantras", ask: "Ask Haritima", identify: "Identify", about: "About", contact: "Contact", login: "Sign in", logout: "Sign out", admin: "Admin dashboard", menu: "Menu" },
  hero: {
    subtitle: "Discover the Green Wisdom of Shantikunj",
    intro: "Haritima connects the living plant heritage of Dev Sanskriti Vishwavidyalaya with traditional Ayurvedic knowledge, campus locations, and verified textual references.",
    explore: "Explore plants", map: "Explore campus map", ask: "Ask Haritima",
  },
  home: {
    featured: "Plants to meet first", featuredSub: "A few of the species growing across the campus.",
    categories: "Explore by category", mapTitle: "Where they grow", mapSub: "Every documented plant is pinned to the campus map. Pins marked approximate have not yet been surveyed with GPS.",
    openMap: "Open the full map", wisdomTitle: "Ayurveda, read carefully",
    wisdomBody: "Each traditional use shown here is tied to a source record. A reference counts as verified only after an administrator has checked it against the text; everything else is labelled pending.",
    readMore: "How references work", askTitle: "Ask about a plant or a concern", askSub: "Answers come only from Haritima’s own records, with the source shown for each plant.",
    identifyTitle: "Found a plant you don’t know?", identifySub: "Upload a photo of a leaf or flower. Haritima suggests likely species and shows whether they grow on campus.",
    identifyCta: "Identify a plant", stats: { plants: "Plants documented", medicinal: "Medicinal species", locations: "Campus locations", references: "Verified references" },
  },
  plants: {
    title: "Plants of the campus", sub: "Search by common, scientific, Hindi or Sanskrit name, or by traditional use.",
    search: "Search plants", searchPh: "Try tulsi, Withania, नीम or sleep", all: "All", category: "Category", type: "Plant type", area: "Campus area", availability: "Availability", use: "Traditional use",
    results: "plants found", none: "No plants match these filters.", noneHint: "Clear a filter or search for another name.", clear: "Clear filters", view: "View details", prev: "Previous", next: "Next",
  },
  plant: {
    scientific: "Scientific name", hindi: "Hindi name", sanskrit: "Sanskrit name", family: "Family", type: "Plant type", otherNames: "Other names",
    about: "About", uses: "Traditional Ayurvedic uses", parts: "Parts traditionally used", properties: "Traditional properties", preparation: "Preparation (as documented)", cultivation: "Cultivation", precautions: "Precautions",
    location: "On campus", viewOnMap: "View on campus map", approximate: "Approximate location", exact: "Surveyed location", references: "Ayurvedic references",
    source: "Source", text: "Text", sectionChapter: "Section / chapter", reference: "Reference", verse: "Verse", verified: "Verified", pending: "Reference pending verification",
    noRefs: "Reference not available in the verified knowledge base.", noLocation: "Location not yet recorded.", back: "All plants",
  },
  map: { title: "Campus plant map", sub: "Tap a pin to see the plant. Colours show the category.", viewPlant: "View plant", approximate: "Approximate", legend: "Legend", filter: "Show category" },
  chat: {
    title: "Ask Haritima", sub: "Ask about a plant on campus or a concern you want to read about. Every answer is built from Haritima’s verified records.",
    placeholder: "e.g. Which plants are traditionally used for digestion?", send: "Ask", thinking: "Searching the knowledge base…",
    examples: ["I have difficulty sleeping. Which plants are traditionally associated with this?", "Which plants on the campus are traditionally used for digestion?", "Tell me about Ashwagandha.", "Which medicinal plants can I find near the herbal garden?"],
    traditional: "Traditional association", reference: "Reference", location: "Campus location", onMap: "Show on map", parts: "Part", rateLimited: "Too many questions in a short time. Try again in a minute.", error: "The guide could not answer right now. Try again.",
    open: "Open Ask Haritima", close: "Close",
  },
  mantras: { title: "Vedic mantras & wisdom", sub: "Verses on nature, peace and knowledge, with Hindi and English renderings.", source: "Source", meaning: "Meaning", hindi: "Hindi", english: "English", listen: "Listen", all: "All" },
  ayurveda: { title: "Ayurvedic knowledge", sub: "Traditional concepts behind the plant records, and how Haritima handles sources." },
  identify: {
    title: "Identify a plant", sub: "Upload a clear photo of one leaf, flower or fruit. JPG, PNG or WebP up to 5 MB.",
    organ: "What does the photo show?", organs: { leaf: "Leaf", flower: "Flower", fruit: "Fruit", bark: "Bark", auto: "Not sure" },
    choose: "Choose photo", run: "Identify", running: "Identifying…", confidence: "Confidence", onCampus: "Grows on campus", notInDb: "Not yet in the Haritima records",
    low: "Identification confidence is low. Please verify the plant visually or consult a qualified botanist.", none: "No species could be matched. Try a closer photo of a single leaf or flower.",
  },
  contact: { title: "Contact & feedback", sub: "Spotted a plant we missed, a wrong location, or a source that needs checking? Tell us.", name: "Name", email: "Email", subject: "Subject", message: "Message", send: "Send feedback", sent: "Feedback sent. Thank you.", error: "Feedback could not be sent. Check the fields and try again." },
  auth: { title: "Sign in to Haritima", email: "Email", password: "Password", submit: "Sign in", invalid: "Email or password is incorrect.", noAccount: "New here?", register: "Create an account", registerTitle: "Create your account", name: "Name", create: "Create account", haveAccount: "Already have an account?" },
  footer: { tagline: "Connecting nature, knowledge and traditional wisdom.", academic: "Developed as an academic project at Dev Sanskriti Vishwavidyalaya, Shantikunj, Haridwar.", privacy: "Privacy", terms: "Terms" },
  common: { loading: "Loading…", disclaimerShort: "Educational information only — not medical advice." },
};

export type Dictionary = typeof en;

const hi: Dictionary = {
  nav: { home: "मुखपृष्ठ", plants: "पौधे", map: "मानचित्र", ayurveda: "आयुर्वेद", mantras: "मंत्र", ask: "हरिtima से पूछें", identify: "पहचानें", about: "परिचय", contact: "संपर्क", login: "लॉग इन", logout: "लॉग आउट", admin: "एडमिन डैशबोर्ड", menu: "मेनू" },
  hero: {
    subtitle: "शांतिकुंज की हरित और आयुर्वेदिक विरासत को जानें",
    intro: "हरिtima देव संस्कृति विश्वविद्यालय की जीवंत वनस्पति विरासत को पारंपरिक आयुर्वेदिक ज्ञान, परिसर के स्थानों और सत्यापित ग्रंथ-संदर्भों से जोड़ता है।",
    explore: "पौधे देखें", map: "परिसर मानचित्र", ask: "हरिtima से पूछें",
  },
  home: {
    featured: "पहले इनसे मिलिए", featuredSub: "परिसर में उगने वाली कुछ प्रजातियाँ।",
    categories: "श्रेणी के अनुसार देखें", mapTitle: "ये कहाँ उगते हैं", mapSub: "हर दर्ज पौधा परिसर मानचित्र पर चिह्नित है। ‘अनुमानित’ चिह्न वाले स्थानों का GPS सर्वेक्षण अभी बाकी है।",
    openMap: "पूरा मानचित्र खोलें", wisdomTitle: "आयुर्वेद, सावधानी से",
    wisdomBody: "यहाँ दिखाया गया हर पारंपरिक उपयोग किसी स्रोत-अभिलेख से जुड़ा है। कोई संदर्भ तभी ‘सत्यापित’ माना जाता है जब एडमिन उसे मूल ग्रंथ से मिला ले; बाकी सब ‘सत्यापन लंबित’ दिखते हैं।",
    readMore: "संदर्भ कैसे काम करते हैं", askTitle: "किसी पौधे या समस्या के बारे में पूछें", askSub: "उत्तर केवल हरिtima के अपने अभिलेखों से आते हैं, हर पौधे के साथ स्रोत दिखाया जाता है।",
    identifyTitle: "कोई अनजान पौधा दिखा?", identifySub: "पत्ती या फूल की फ़ोटो अपलोड करें। हरिtima संभावित प्रजातियाँ बताएगा और यह भी कि वे परिसर में हैं या नहीं।",
    identifyCta: "पौधा पहचानें", stats: { plants: "दर्ज पौधे", medicinal: "औषधीय प्रजातियाँ", locations: "परिसर स्थान", references: "सत्यापित संदर्भ" },
  },
  plants: {
    title: "परिसर के पौधे", sub: "सामान्य, वैज्ञानिक, हिन्दी या संस्कृत नाम से, या पारंपरिक उपयोग से खोजें।",
    search: "पौधे खोजें", searchPh: "जैसे तुलसी, Withania, नीम या नींद", all: "सभी", category: "श्रेणी", type: "पौधे का प्रकार", area: "परिसर क्षेत्र", availability: "उपलब्धता", use: "पारंपरिक उपयोग",
    results: "पौधे मिले", none: "इन फ़िल्टरों से कोई पौधा नहीं मिला।", noneHint: "कोई फ़िल्टर हटाएँ या दूसरा नाम खोजें।", clear: "फ़िल्टर हटाएँ", view: "विवरण देखें", prev: "पिछला", next: "अगला",
  },
  plant: {
    scientific: "वैज्ञानिक नाम", hindi: "हिन्दी नाम", sanskrit: "संस्कृत नाम", family: "कुल", type: "प्रकार", otherNames: "अन्य नाम",
    about: "परिचय", uses: "पारंपरिक आयुर्वेदिक उपयोग", parts: "प्रयुक्त अंग", properties: "पारंपरिक गुण", preparation: "निर्माण विधि (जैसा दर्ज है)", cultivation: "खेती", precautions: "सावधानियाँ",
    location: "परिसर में", viewOnMap: "मानचित्र पर देखें", approximate: "अनुमानित स्थान", exact: "सर्वेक्षित स्थान", references: "आयुर्वेदिक संदर्भ",
    source: "स्रोत", text: "ग्रंथ", sectionChapter: "खंड / अध्याय", reference: "संदर्भ", verse: "श्लोक", verified: "सत्यापित", pending: "संदर्भ सत्यापन लंबित",
    noRefs: "सत्यापित ज्ञानकोष में संदर्भ उपलब्ध नहीं है।", noLocation: "स्थान अभी दर्ज नहीं है।", back: "सभी पौधे",
  },
  map: { title: "परिसर पौधा मानचित्र", sub: "पौधा देखने के लिए चिह्न पर टैप करें। रंग श्रेणी दर्शाते हैं।", viewPlant: "पौधा देखें", approximate: "अनुमानित", legend: "संकेत", filter: "श्रेणी दिखाएँ" },
  chat: {
    title: "हरिtima से पूछें", sub: "परिसर के किसी पौधे या किसी समस्या के बारे में पूछें। हर उत्तर हरिtima के सत्यापित अभिलेखों से बनता है।",
    placeholder: "जैसे: पाचन के लिए परंपरागत रूप से कौन-से पौधे उपयोग होते हैं?", send: "पूछें", thinking: "ज्ञानकोष में खोज रहे हैं…",
    examples: ["मुझे नींद नहीं आती। परंपरागत रूप से कौन-से पौधे इससे जुड़े हैं?", "परिसर में पाचन के लिए कौन-से पौधे परंपरागत रूप से उपयोग होते हैं?", "अश्वगंधा के बारे में बताइए।", "हर्बल गार्डन के पास कौन-से औषधीय पौधे मिलेंगे?"],
    traditional: "पारंपरिक संबंध", reference: "संदर्भ", location: "परिसर स्थान", onMap: "मानचित्र पर देखें", parts: "अंग", rateLimited: "कम समय में बहुत प्रश्न। एक मिनट बाद फिर पूछें।", error: "अभी उत्तर नहीं मिल सका। फिर प्रयास करें।",
    open: "हरिtima से पूछें खोलें", close: "बंद करें",
  },
  mantras: { title: "वैदिक मंत्र और ज्ञान", sub: "प्रकृति, शांति और ज्ञान के मंत्र — हिन्दी और अंग्रेज़ी अर्थ सहित।", source: "स्रोत", meaning: "भावार्थ", hindi: "हिन्दी", english: "English", listen: "सुनें", all: "सभी" },
  ayurveda: { title: "आयुर्वेदिक ज्ञान", sub: "पौधों के अभिलेखों के पीछे की पारंपरिक अवधारणाएँ, और हरिtima स्रोतों को कैसे संभालता है।" },
  identify: {
    title: "पौधा पहचानें", sub: "एक पत्ती, फूल या फल की साफ़ फ़ोटो अपलोड करें। JPG, PNG या WebP, अधिकतम 5 MB।",
    organ: "फ़ोटो में क्या है?", organs: { leaf: "पत्ती", flower: "फूल", fruit: "फल", bark: "छाल", auto: "पता नहीं" },
    choose: "फ़ोटो चुनें", run: "पहचानें", running: "पहचान रहे हैं…", confidence: "विश्वास स्तर", onCampus: "परिसर में उगता है", notInDb: "अभी हरिtima अभिलेखों में नहीं",
    low: "पहचान का विश्वास स्तर कम है। कृपया पौधे को स्वयं जाँचें या किसी योग्य वनस्पति विशेषज्ञ से पूछें।", none: "कोई प्रजाति नहीं मिली। एक पत्ती या फूल की पास से फ़ोटो लें।",
  },
  contact: { title: "संपर्क और सुझाव", sub: "कोई पौधा छूट गया, स्थान गलत है, या कोई स्रोत जाँचना है? हमें बताइए।", name: "नाम", email: "ईमेल", subject: "विषय", message: "संदेश", send: "सुझाव भेजें", sent: "सुझाव भेज दिया गया। धन्यवाद।", error: "सुझाव नहीं भेजा जा सका। जानकारी जाँचकर फिर प्रयास करें।" },
  auth: { title: "हरिtima में लॉग इन", email: "ईमेल", password: "पासवर्ड", submit: "लॉग इन", invalid: "ईमेल या पासवर्ड गलत है।", noAccount: "नए हैं?", register: "खाता बनाएँ", registerTitle: "अपना खाता बनाएँ", name: "नाम", create: "खाता बनाएँ", haveAccount: "पहले से खाता है?" },
  footer: { tagline: "प्रकृति, ज्ञान और पारंपरिक प्रज्ञा का संगम।", academic: "देव संस्कृति विश्वविद्यालय, शांतिकुंज, हरिद्वार में एक शैक्षणिक परियोजना के रूप में विकसित।", privacy: "गोपनीयता", terms: "शर्तें" },
  common: { loading: "लोड हो रहा है…", disclaimerShort: "केवल शैक्षिक जानकारी — चिकित्सीय सलाह नहीं।" },
};

export const dictionaries: Record<Lang, Dictionary> = { en, hi };
