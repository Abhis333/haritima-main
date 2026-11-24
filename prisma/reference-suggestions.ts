/**
 * Suggested source book per plant slug, used as the starting point for faculty verification.
 *
 * These are SUGGESTIONS, not citations: every reference created from them stays PENDING with
 * no chapter, section or verse. The verifier must confirm the plant actually appears in the
 * named book, fill in the exact location, and only then mark it VERIFIED.
 */
export type SourceSuggestion = {
  textName: string;
  author: string;
  sourceType: "CLASSICAL_AYURVEDIC_TEXT" | "GOVERNMENT_PUBLICATION" | "BOTANICAL_REFERENCE";
};

const BHAVAPRAKASHA: SourceSuggestion = { textName: "Bhavaprakasha Nighantu", author: "Bhavamishra", sourceType: "CLASSICAL_AYURVEDIC_TEXT" };
const API: SourceSuggestion = { textName: "The Ayurvedic Pharmacopoeia of India", author: "Ministry of AYUSH, Government of India", sourceType: "GOVERNMENT_PUBLICATION" };
const KIRTIKAR: SourceSuggestion = { textName: "Indian Medicinal Plants", author: "K.R. Kirtikar & B.D. Basu", sourceType: "BOTANICAL_REFERENCE" };

export const SOURCE_SUGGESTIONS: Record<string, SourceSuggestion> = {
  tulsi: BHAVAPRAKASHA,
  ashwagandha: BHAVAPRAKASHA,
  neem: BHAVAPRAKASHA,
  "aloe-vera": BHAVAPRAKASHA,
  amla: BHAVAPRAKASHA,
  arjuna: BHAVAPRAKASHA,
  brahmi: BHAVAPRAKASHA,
  giloy: BHAVAPRAKASHA,
  shatavari: BHAVAPRAKASHA,
  lemongrass: KIRTIKAR,
  peepal: BHAVAPRAKASHA,
  bargad: BHAVAPRAKASHA,
  bael: BHAVAPRAKASHA,
  haritaki: BHAVAPRAKASHA,
  bibhitaki: BHAVAPRAKASHA,
  vasaka: BHAVAPRAKASHA,
  haldi: BHAVAPRAKASHA,
  adrak: BHAVAPRAKASHA,
  pudina: KIRTIKAR,
  ashoka: BHAVAPRAKASHA,
  gudhal: BHAVAPRAKASHA,
  moringa: BHAVAPRAKASHA,
  // Kalmegh is not clearly described in the older Nighantus; the official monograph is the safer starting point.
  kalmegh: API,
  punarnava: BHAVAPRAKASHA,
  shankhpushpi: BHAVAPRAKASHA,
  genda: KIRTIKAR,
};

export const SUGGESTION_NOTE =
  "Suggested source only. Confirm the plant appears in this book, add the exact chapter/section and verse or page, then mark VERIFIED. The Ayurvedic Pharmacopoeia of India (Ministry of AYUSH) is an accepted alternative source.";
