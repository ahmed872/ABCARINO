# RENO

ABCARINO's guide from the year 2186: an arrival intro and a companion on every public page,
answering from a local knowledge base. No AI, no external services, no API costs.

## Files

| Path | Role |
|---|---|
| `src/content/reno/faq.ts` | Knowledge base (categories, questions, keywords, answers, links). Edit this to change what RENO knows. |
| `src/lib/reno/normalize.ts` | Arabic/English normalisation, synonyms and filler words. |
| `src/lib/reno/matcher.ts` | Deterministic matcher: exact phrase → wording overlap → keywords, forgiving one typo per word. Answers, suggests or says it doesn't know. |
| `src/lib/reno/knowledge.ts`, `src/app/api/reno/[locale]` | Live knowledge built from the CMS and page copy (see below). |
| `src/lib/reno/config.ts` | Intro frequency/pages/timings, idle bubble, reply delay. |
| `src/lib/i18n/dictionaries/{en,ar}.ts` → `reno` | Interface copy and RENO's short quips. |
| `src/components/reno/art.ts` | Character artwork (one layered SVG, ~5 KB gzipped). |
| `src/components/reno/reno.css` | Expressions, idle motion, dock, panel, intro. |
| `RenoMount` → `RenoExperience` | Lazy, client-only entry mounted in `[locale]/layout.tsx`. |
| `RenoIntro`, `RenoCompanion`, `RenoPanel`, `RenoArt` | Intro, corner companion, FAQ panel, character. |
| `src/app/[locale]/faq/page.tsx` | The same Q&A as a crawlable page (in the sitemap). |

## Adding or editing a question

1. Add an entry to `RENO_FAQ` with a unique `id`, a `category`, several phrasings in **both**
   languages (the first is shown on chips and on the FAQ page), a few `keywords`, both answers,
   optional `related` ids and an `action` (`link` to an internal page, `whatsapp` or `contact`).
2. Only write what ABCARINO has published or approved. Don't state solution availability
   (it lives in the CMS): link to the solution page instead.
3. `npm test` checks ids, cross-references, bilingual content, banned claims, and that every
   phrasing matches its own entry.

## Live knowledge (from the CMS)

Besides the hand-written FAQ, RENO reads what the site itself publishes, so new content in the
admin reaches him without code changes:

- `src/lib/reno/knowledge.ts` builds entries from the catalogue (every solution, package and
  category, what is available and what is coming), the contact settings (email, phone, hours,
  address, social accounts) and the page copy in the dictionaries (how we work, why us, values,
  the name). Where the site publishes nothing (hours, address, projects, brands, warranty
  terms) the answer says so and points to the team.
- Solutions the hand-written FAQ already covers get **live facts** (status, what's included)
  appended under the hand-written answer instead of a second entry; so do the contact answers.
- `GET /api/reno/[locale]` serves it as JSON (public content only); the panel fetches it once
  and still works from the built-in FAQ if the request fails.
- `SOLUTION_WORDINGS` in `knowledge.ts` and `CANONICAL` in `normalize.ts` hold everyday
  wordings and synonyms (matching aids only; they never change an answer).

## Expressions

`chill` (default), `hello`, `really`, `whoa`, `sip`, `solving`, via `<RenoArt mood="…" />`.
The artwork's layers are classes (`r-eyes`, `r-hand`, …); see the comment in `art.ts`.

## Intro rules

Once per browser session, only when landing on the home page, a still 1.6 s arrival under
reduced motion, never for automated browsers. There is no skip button on screen: Esc ends it,
and a skip button appears for keyboard users on Tab.
`?reno-intro=1` forces it; `?reno-intro=auto` applies the normal rules in automated browsers (tests).

Scenes (`data-scene` on `.reno-intro`, timings in `RENO_CONFIG.intro.timeline`):
`wait` (a point of light while the page finishes loading) → `count` (the ring opens, the
year runs back from 2186) → `arrive` (RENO appears in 2026, name card) → `reveal` (the page
returns, he glides to his corner). It is deliberately quiet and light: only transforms and
opacity move, each on its own layer, and the drawing holds still while it is moving.

## Companion motion

Idle life is CSS on the artwork's layers (breathing, head drift, antenna, blinking, steam).
His eyes follow the mouse and glance around when it rests (`--reno-look-x/y`, set by
`RenoCompanion`); hovering makes him pop up out of the circle; `talking` on `RenoArt`
moves his mouth when an answer appears. All of it is off under reduced motion.

## Animation assets still to commission

The intro uses real animation of the existing layers (squash-and-stretch jump and landing,
wave, tea, portal, time tunnel).
These shots need new hand-drawn frames before they can be animated honestly:

- **Walk cycle** (side or three-quarter view, 8–12 frames, same layer structure) — for RENO
  walking into and out of the portal. Today he jumps into it and lands out of it instead.
- **Adjusting the headphones** (3–5 frames: hand to the ear cup) — today only the cup rings flare.
- **Turning to the portal** (three-quarter back view) — for "looks at the portal".

Integration point: `RenoIntro` scenes `ignite` (adjust/turn), `jump` (walk in) and `arrive`
(walk out). Deliver as layered SVG (preferred) or WebP sprite sheets at 2× the display size.
