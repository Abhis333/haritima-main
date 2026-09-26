# "Ask Haritima" RAG chatbot

An educational Q&A assistant that answers only from the Haritima database.

## Files
- UI: `app/(public)/chatbot/page.tsx`, `components/Chatbot.tsx` (posts to `/api/chat`), `components/FloatingChat.tsx` (a floating launcher mounted in `app/(public)/layout.tsx`)
- API: `app/api/chat/route.ts` (`maxDuration = 30`), `app/api/knowledge/reindex/route.ts` (admin, `maxDuration = 60`)
- Logic: `lib/chat.ts` (`answerQuestion`, disclaimer and fallback texts), `lib/rag.ts` (`indexPlant`, `reindexAll`, `retrievePlantIds`), `lib/ai.ts` (Gemini REST: `generateJSON`, `embed`, `cosine`), `lib/search.ts`
- Admin: `app/admin/knowledge/page.tsx` (chunk and embedding counts, benefits editor, reindex button)

## Pipeline
1. **Indexing** (`indexPlant`): builds these chunks: one `plant` summary, one `use` chunk per traditional use and per benefit, and one `reference` chunk per **VERIFIED** reference. Chunks are embedded with Gemini (`RETRIEVAL_DOCUMENT`, 768 dimensions, normalized) **first**. Then the plant's old `KnowledgeDocument` rows are deleted and the new ones inserted in **one transaction**, so a failure never leaves the plant without chunks. If embedding fails, the chunks are still saved, but without vectors. Plant, reference and `adminCrud` routes `await` the re-index, so it isn't cut off when the serverless response ends. `reindexAll` builds every plant's chunks and embeds them in batches of 90 chunks per request, not one request per plant.
2. **Retrieval** (`retrievePlantIds`) scores plants using three signals:
   - cosine similarity against every embedded chunk, computed in JS (threshold `RAG_MIN_SIMILARITY`, default 0.6, top 12)
   - full-text search on chunk content (a failing query is logged and counts as no hits)
   - a plant-name match from `searchPlantIds`

   It returns the top 5 plant ids.
3. **Answering** (`answerQuestion`): only the retrieved plants' records go to the LLM. The question is sent as a JSON field, and the prompt tells the model to treat it as untrusted data. The model must return `{context, plants:[{id, association}], noMatch}`. Ids that were not supplied are dropped, and at most 4 plants are kept. **Output filter:** each model `association` is kept only if it has no dose, diagnosis/cure or classical-text/citation wording (`UNSAFE_MODEL_TEXT`) **and** at least half its words appear in one of that plant's benefit or traditional-use lines. Otherwise the closest database line is shown instead. A model `context` that matches `UNSAFE_MODEL_TEXT` is replaced by the fixed retrieval framing sentence.
4. **Enrichment**: references (VERIFIED only), precautions, parts used and the first campus location are attached **from the database**. A plant with no verified reference gets `REF_NOT_AVAILABLE`.
5. **Fallbacks**:
   - No retrieval hits, or the LLM reports `noMatch`: returns the `NO_MATCH` text.
   - No `AI_API_KEY`, or the LLM errors: retrieval-only mode, which quotes the best-matching benefit or use line from the record itself.
6. The `URGENT_PATTERNS` regex covers English, Hindi (Devanagari) and romanised Hindi emergency wording, e.g. breathing trouble, chest pain, fainting, bleeding, swallowing poison and self-harm. When it matches, the answer is **only** the emergency advice banner (112 or the campus health centre) plus the disclaimer: no retrieval, no LLM call, and no plants. Plain "poisonous plant" questions are deliberately not matched. Every answer carries `DISCLAIMER`.

## Persistence and limits
- History (`ChatConversation`/`ChatMessage`, with the full answer in `payload`) is stored **only for signed-in users**, in conversations they own.
- Rate limits: 12 questions per minute for signed-in users, 6 per minute for anonymous visitors.
- Input: `chatSchema`, where `message` is 2–800 characters, plus an optional `conversationId` and `lang` (`en` or `hi`).

## Invariants (do not break)
- The LLM never writes citations, book names or verses. The system prompt forbids them, and the code attaches references itself.
- No diagnosis, cures or doses. Only "traditionally described" associations are allowed.
- Only VERIFIED references reach the knowledge base or the answer.
- Any change to plant, benefit, location or reference data must re-index that plant.
