<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ABCARINO project notes

- Brand spelling is always **ABCARINO** (Arabic: عبقرينو). Never ABQARINO / ABGARINO.
- Content must stay honest: no invented projects, clients, statistics, partners, awards or prices.
- Bilingual content lives in paired `…En` / `…Ar` columns; UI copy lives in `src/lib/i18n/dictionaries/{en,ar}.ts` (the `ar` file is type-checked against `en`). Use logical CSS (`ms-`, `pe-`, `start-`, `text-start`) so RTL mirrors automatically; never letter-space or uppercase Arabic.
- Public data is read through `src/lib/content/public.ts` (cached, tag `public-content`). Every admin mutation must call `revalidatePublicContent()`.
- Every server action must authorize itself (`adminAction(permission, …)` or `requireUser(permission)`) — never rely on `proxy.ts` alone. Validate input with the zod schemas in `src/lib/validation`.
- Schema changes: edit `src/lib/db/schema.ts`, then `npm run db:generate` and commit the SQL in `drizzle/`.
- Checks before pushing: `npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e`.
