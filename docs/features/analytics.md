# Analytics

Admin → Analytics (`/admin/analytics?days=7|30|90`): plant page views and chatbot usage.

## Recording
- Plant views: `components/ViewBeacon.tsx` on the plant page posts to `app/api/views/route.ts` once per plant per browser session (`sessionStorage`). The route validates the plant id (`viewSchema`), is rate-limited (60/min per client) and upserts `PlantViewDaily` (one row per plant per UTC day) via `recordPlantView()` in `lib/analytics.ts`.
- Chatbot questions: `app/api/chat/route.ts` calls `logChatQuery()` after every answer, for anonymous and signed-in users. `ChatQueryLog` stores the question (first 300 characters), language, returned plant slugs, `grounded`, `urgent`, `llmUsed` and latency. **No user id or IP is stored.**
- Both helpers catch and log their own errors; analytics never breaks a page or an answer.

## Report (`app/admin/analytics/page.tsx`)
- Stat tiles: total views, questions (with % in Hindi), share answered with at least one plant (urgent-safety replies excluded), median answer time.
- Daily column charts (views, questions), each with a "Show as table" view. Charts live in `components/admin/Charts.tsx`.
- Ranked lists: most viewed plants, plants the chatbot recommends most, most asked-about concerns (questions containing a `PlantBenefit.concern` or `concernHi`).
- "Questions with no matching plant": the latest 20 unanswered questions, as a content-gap list.
- Days are UTC buckets; the report reads at most 10,000 chat logs per range.

## Notes
- Views count real browser visits only; bots that don't run JavaScript are not counted.
- The old dashboard tile "Chat questions (signed-in)" counts stored conversation messages, which exist only for signed-in users; Analytics covers everyone.
