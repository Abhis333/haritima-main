// Server-only LLM + embedding client.
// Embeddings always use Google Gemini (AI_API_KEY). Answers use Gemini by default, or Groq when
// AI_CHAT_PROVIDER=groq (GROQ_API_KEY), falling back to Gemini if a Groq call fails.
// Keys never leave the server: this module is only imported from route handlers.
import "server-only";

const BASE = "https://generativelanguage.googleapis.com/v1beta";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const EMBED_DIM = 768;
export const DEFAULT_GEMINI_CHAT_MODEL = "gemini-3.1-flash-lite";
export const DEFAULT_GROQ_CHAT_MODEL = "llama-3.3-70b-versatile";

/** Gemini is configured: embeddings (vector search) and the Gemini answer path work. */
export function aiEnabled() {
  return Boolean(process.env.AI_API_KEY);
}

const groqSelected = () => process.env.AI_CHAT_PROVIDER === "groq" && Boolean(process.env.GROQ_API_KEY);

/** Some LLM can write answers (Groq or Gemini). Without one the chatbot runs in retrieval-only mode. */
export function chatEnabled() {
  return groqSelected() || aiEnabled();
}

/** Which provider and model answers questions, for the admin settings page. */
export function chatModelLabel() {
  return groqSelected()
    ? `Groq · ${process.env.GROQ_CHAT_MODEL || DEFAULT_GROQ_CHAT_MODEL}${aiEnabled() ? " (Gemini fallback)" : ""}`
    : `Gemini · ${process.env.AI_CHAT_MODEL || DEFAULT_GEMINI_CHAT_MODEL}`;
}

function headers() {
  return { "Content-Type": "application/json", "x-goog-api-key": process.env.AI_API_KEY ?? "" };
}

const parseJSON = <T>(raw: string) => JSON.parse(raw.replace(/```json|```/g, "").trim()) as T;

export async function generateJSON<T>(system: string, user: string): Promise<T> {
  if (!groqSelected()) return geminiJSON<T>(system, user);
  try {
    return await groqJSON<T>(system, user);
  } catch (e) {
    if (!aiEnabled()) throw e;
    console.error("[ai] Groq failed, falling back to Gemini:", e instanceof Error ? e.message : e);
    return geminiJSON<T>(system, user);
  }
}

// Groq exposes an OpenAI-compatible API; json_object mode requires the word "JSON" in the prompt, which SYSTEM contains.
async function groqJSON<T>(system: string, user: string): Promise<T> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: process.env.GROQ_CHAT_MODEL || DEFAULT_GROQ_CHAT_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Groq request failed: ${res.status} ${await res.text().catch(() => "")}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return parseJSON<T>(data.choices?.[0]?.message?.content ?? "");
}

async function geminiJSON<T>(system: string, user: string): Promise<T> {
  const model = process.env.AI_CHAT_MODEL || DEFAULT_GEMINI_CHAT_MODEL;
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
  return parseJSON<T>(data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "");
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
    const data = (await res.json()) as { embeddings?: { values: number[] }[] };
    // A short or malformed response would misalign vectors with their chunks, so treat it as a failure.
    if (!data.embeddings || data.embeddings.length !== batch.length) {
      throw new Error(`Embedding response had ${data.embeddings?.length ?? 0} vectors for ${batch.length} texts`);
    }
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
