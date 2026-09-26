import "server-only";

export type Candidate = { scientificName: string; commonNames: string[]; family: string | null; score: number };

/** Pl@ntNet identification API — https://my.plantnet.org (free tier for academic use). */
export async function identifyWithPlantNet(image: File, organ: string): Promise<Candidate[]> {
  const key = process.env.PLANTNET_API_KEY;
  if (!key) throw new Error("PLANTNET_API_KEY is not configured");
  const form = new FormData();
  form.append("images", image);
  form.append("organs", organ);
  const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${encodeURIComponent(key)}&nb-results=5&lang=en`;
  const res = await fetch(url, { method: "POST", body: form, signal: AbortSignal.timeout(30_000) });
  if (res.status === 404) return []; // Pl@ntNet returns 404 when no species matched
  if (!res.ok) throw new Error(`Identification service error: ${res.status}`);
  const data = (await res.json()) as {
    results?: {
      score: number;
      species: {
        scientificNameWithoutAuthor: string;
        commonNames?: string[];
        family?: { scientificNameWithoutAuthor?: string };
      };
    }[];
  };
  return (data.results ?? []).map((r) => ({
    scientificName: r.species.scientificNameWithoutAuthor,
    commonNames: r.species.commonNames ?? [],
    family: r.species.family?.scientificNameWithoutAuthor ?? null,
    score: r.score,
  }));
}

/** "Ocimum tenuiflorum L." and "Ocimum tenuiflorum" should match. Compares genus + species epithet. */
export function binomial(name: string) {
  return name.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean).slice(0, 2).join(" ");
}
