# Admin dashboard

Content management for plants and all related data, plus operations views. It lives under `/admin` and is available only to the `ADMIN` role.

## Files
- Layout and navigation: `app/admin/layout.tsx`, `components/admin/AdminSidebar.tsx`
- Pages:

  | Page | Purpose |
  |---|---|
  | `app/admin/page.tsx` | Counts (plants, locations, verified and pending references, mantras, users, unresolved feedback, questions asked, knowledge chunks), the last 8 audit entries, and plants that have no location |
  | `app/admin/plants/` | List, `new`, and `[id]` edit pages using `components/admin/PlantForm.tsx` |
  | `app/admin/locations`, `references`, `mantras`, `categories` | Generic editors built on `components/admin/ResourceManager.tsx` |
  | `app/admin/knowledge` | RAG chunk and embedding counts, benefits editor, reindex button |
  | `app/admin/evaluation` | Runs the fixed chatbot test set and shows pass rate, precision/recall and latency, with CSV export (see [chatbot-rag.md](chatbot-rag.md)) |
  | `app/admin/users` | Role management (see [auth-users.md](auth-users.md)) |
  | `app/admin/feedback` | Contact messages: mark resolved, delete |
  | `app/admin/audit` | Audit log viewer |
  | `app/admin/settings` | Read-only view of which integrations are configured (based on which env vars are set; values are never shown) |

- Shared components: `ResourceManager` (a table and form configured by a field list, which calls `fetch` against `endpoint` and `endpoint/{id}`), `FileUploadField` (posts to `/api/upload`), `SmallActions`.

## Pattern
- Admin pages are **server components** that read with Prisma directly and pass rows to client components.
- All writes go through `app/api/*` handlers. Simple resources use `adminCrud()` from `lib/crud.ts`, which runs `requireAdmin`, validates with zod, writes `audit()`, and optionally re-indexes the linked `plantId`.
- To add a new admin-managed resource:
  1. Add a zod schema in `lib/validation.ts`.
  2. Add a list route exporting `GET` + `adminCrud(...).POST`, and an `[id]` route exporting `PUT`/`DELETE`.
  3. Add a page that renders `ResourceManager`.
  4. Add a link in `AdminSidebar`.

## Audit log
- `lib/audit.ts`: `audit(userId, action, entity, entityId?, details?)`, where the action is one of `CREATE | UPDATE | DELETE | REINDEX | ROLE_CHANGE | UPLOAD`. A failure to write the log is only printed to the console and never breaks the request.
