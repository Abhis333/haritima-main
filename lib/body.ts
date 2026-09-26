import { HttpError } from "@/lib/guards";

/** Allowance for multipart boundaries, headers and small text fields around the file. */
const MULTIPART_OVERHEAD = 64 * 1024;

/**
 * Parses multipart form data without buffering more than `maxFileBytes` (+ overhead).
 * Rejects early on a too-large Content-Length, and counts bytes while streaming for
 * requests that omit it or lie about it.
 */
export async function readFormData(req: Request, maxFileBytes: number, tooLarge: string): Promise<FormData> {
  const limit = maxFileBytes + MULTIPART_OVERHEAD;
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) throw new HttpError(413, tooLarge);
  if (!req.body) throw new HttpError(400, "Empty request body.");

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel().catch(() => {});
      throw new HttpError(413, tooLarge);
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    body.set(c, offset);
    offset += c.byteLength;
  }
  try {
    return await new Response(body, { headers: { "content-type": req.headers.get("content-type") ?? "" } }).formData();
  } catch {
    throw new HttpError(400, "Could not read the uploaded form.");
  }
}
