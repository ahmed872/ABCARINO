# RENO

ABCARINO's guide from the year 2186: an arrival intro and a companion on every public page,
answering from a local knowledge base. No AI, no external services, no API costs.

## Files

| Path | Role |
|---|---|
| `src/content/reno/faq.ts` | Knowledge base (categories, questions, keywords, answers, links). Edit this to change what RENO knows. |
| `src/lib/reno/normalize.ts` | Arabic/English normalisation, synonyms and filler words. |
| `src/lib/reno/matcher.ts` | Deterministic matcher: exact phrase → wording overlap → keywords. Answers, suggests or says it doesn't know. |
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

## Expressions

`chill` (default), `hello`, `really`, `whoa`, `sip`, `solving`, via `<RenoArt mood="…" />`.
The artwork's layers are classes (`r-eyes`, `r-hand`, …); see the comment in `art.ts`.

## Intro rules

Once per browser session, only when landing on the home page, skippable (button or Esc),
a still 1.6 s arrival under reduced motion, never for automated browsers.
`?reno-intro=1` forces it; `?reno-intro=auto` applies the normal rules in automated browsers (tests).

Scenes (`data-scene` on `.reno-intro`, timings in `RENO_CONFIG.intro.timeline`):
`future` (RENO in 2186 on the grid) → `ignite` (the portal draws itself) → `jump` →
`tunnel` (time travel, the year counts down) → `arrive` (he lands in 2026, name card) →
`reveal` (the overlay closes like an iris onto his corner). Everything animates with
transforms, opacity and clip-path only.

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
