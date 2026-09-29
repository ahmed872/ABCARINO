# ABCARINO — عبقرينو

Official website and content management platform for **ABCARINO**, a technology solutions & systems integration company.

> *The future, made comfortable.* — *المستقبل، بكل راحة.*

- **Public website** — bilingual (English LTR / Arabic RTL), premium corporate presentation, WhatsApp-first lead generation.
- **Admin panel** (`/admin`) — manage solutions, packages, categories, media, leads, settings, users and prepared sections (projects, partners, articles) without touching code.

---

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router, React 19, TypeScript) | Server rendering, server actions, first-class SEO |
| Styling | Tailwind CSS v4 + custom design tokens | Small CSS (~11 KB), logical properties for RTL |
| Database | PostgreSQL 16 + Drizzle ORM | Typed schema, SQL migrations, no native engine binaries |
| Auth | Custom DB sessions + scrypt | No third-party auth dependency, full control |
| Validation | zod (server-side, every mutation) | |
| Images | sharp (re-encode to WebP on upload) + `next/image` | Strips metadata, blocks disguised files |
| Fonts | Self-hosted Instrument Sans, IBM Plex Sans Arabic, IBM Plex Mono | No third-party requests |
| Tests | Vitest (unit + integration), Playwright (E2E) | |

## Quick start (local)

Requirements: Node.js ≥ 20.9 (22 recommended), PostgreSQL ≥ 14.

```bash
cp .env.example .env            # then edit DATABASE_URL, APP_SECRET, ADMIN_EMAIL
npm install
npm run db:setup                # runs migrations + seeds starter content + creates the super admin
npm run dev                     # http://localhost:3000  ·  admin at /admin
```

If `ADMIN_PASSWORD` is empty, `db:setup` generates a strong password and prints it **once**.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Unit + integration tests (needs the `abcarino_test` database, see below) |
| `npm run test:e2e` | Playwright end-to-end tests (run `npm run build` first) |
| `npm run db:generate` | Generate a SQL migration after editing `src/lib/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Insert starter content (idempotent — never overwrites edits) |
| `npm run admin:create` | Create the super admin from env (`-- --reset` resets its password) |
| `npm run brand:assets` | Regenerate app icons and Open Graph images from the SVG mark |

## Project structure

```
src/
  app/
    [locale]/            Public site (en | ar): home, solutions, packages, about, contact,
                         projects, partners, insights (last three gated by Settings)
    admin/               Admin panel (own root layout, English UI, bilingual content)
    api/admin/           Authenticated route handlers (media upload, lead CSV export)
    media/[file]         Serves uploaded media (immutable, validated names)
    sitemap.ts robots.ts manifest.ts
  components/
    brand/               The ABCARINO mark + lockup
    illustrations/       Original concept illustrations (used until real photos exist)
    site/                Public UI
    admin/               Admin form kit, media picker, tables
  lib/
    db/                  Drizzle schema + client
    auth/                Password hashing, sessions, role permissions
    content/             Public read models (cached) + revalidation
    i18n/                Locale config + en/ar dictionaries
    security/            Rate limiting, client IP, origin checks
    validation/          zod schemas for every form
    settings-schema.ts   Typed site settings with defaults
  proxy.ts               Locale redirects, CSP nonce, optimistic admin gate
drizzle/                 SQL migrations
scripts/                 migrate, seed, admin creation, brand assets
tests/                   unit/, integration/, e2e/
```

## Content principles (important)

The seed content is intentionally **honest**: it describes services and how ABCARINO works, with **no invented projects, clients, statistics, partners, awards or prices**. Packages default to *Price on request*. Projects, Partners and Insights are **disabled** until real content exists (Admin → Settings → Sections). Built-in illustrations are labelled *Concept illustration*; uploaded stock photos can be flagged *Inspiration* in the media library.

## Tests

```bash
createdb abcarino_test -O abcarino     # once
npm test                               # 47 unit + integration tests
npm run build && npm run test:e2e      # 48 Playwright tests (desktop + mobile)
```

E2E tests run against a production build on port 3100 using the `abcarino_test` database (reset on every run) — override with `E2E_DATABASE_URL`.

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for production deployment.
