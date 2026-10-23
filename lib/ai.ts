// Server-only LLM + embedding client (Google Gemini REST API by default).
// Keys never leave the server: this module is only imported from route handlers.
import "server-only";

const BASE = "https://generativelanguage.googleapis.com/v1beta";
const EMBED_DIM = 768;

export function aiEnabled() {
  return Boolean(process.env.AI_API_KEY);
}

function headers() {
  return { "Content-Type": "application/json", "x-goog-api-key": process.env.AI_API_KEY ?? "" };
}

export async function generateJSON<T>(system: string, user: string): Promise<T> {
  const model = process.env.AI_CHAT_MODEL || "gemini-3.1-flash-lite";
  const res = await fetch(`${BASE}/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json", maxOutputTokens: 1500 },
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`LLM request failed: ${res.status} ${await res.text().catch(() => "")}`);
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const raw = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean) as T;
}

type TaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export async function embed(texts: string[], taskType: TaskType): Promise<number[][]> {
  if (!aiEnabled() || texts.length === 0) return [];
  const model = process.env.AI_EMBEDDING_MODEL || "gemini-embedding-001";
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 90) {
    const batch = texts.slice(i, i + 90);
    const res = await fetch(`${BASE}/models/${encodeURIComponent(model)}:batchEmbedContents`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        requests: batch.map((text) => ({
          model: `models/${model}`,
          content: { parts: [{ text: text.slice(0, 6000) }] },
          taskType,
          outputDimensionality: EMBED_DIM,
        })),
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`Embedding request failed: ${res.status}`);
    const data = (await res.json()) as { embeddings: { values: number[] }[] };
    out.push(...data.embeddings.map((e) => normalise(e.values)));
  }
  return out;
}

function normalise(v: number[]) {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / n);
}

export function cosine(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) s += a[i] * b[i];
  return s;
}
