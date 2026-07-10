# PujaBot — Web Prototype (hackathon field demo)

"Which puja, with whom, how — answered in 1 minute."

Mobile-first responsive **PWA** built for the KAIST×KRAFTON India trip (2026-07-12 ~ 07-20): field-interview stimulus on phones in Delhi/Bengaluru + the Jul 19 pitch demo on a projector. **Prototype, not a product** — no backend; the entire flow is pre-scripted dummy data.

## Run

```bash
npm install
npm run dev        # http://localhost:3000 (service worker disabled in dev)
npm run build && npm start   # production — PWA/offline active
```

Facilitator tools: `/?demo=reset` (clear app state between interviewees) · `/?debug=export` (dump the tap-event log as JSON, works offline).

## Stack (per 클로드-디자인-핸드오프/05-dev-field-readiness.md)

- **next@16.2.10** App Router / Turbopack · **tailwindcss@4.3.2** (CSS-first `@theme`)
- **@serwist/turbopack@9.5.11** PWA — SW served from `/serwist/sw.js` via Route Handler; **all 38 demo routes precached** → the full flow works with zero connectivity after one visit
- **Fonts** self-hosted at build via `next/font/google`: Baloo 2 (display), Mukta (body), Tiro Devanagari Hindi (mantra/sankalpa blocks) — all with `devanagari` subsets
- **Analytics**: `lib/analytics.ts` localStorage event log (NOT PostHog — its web offline queue drops events; see playbook §4)
- **Matching**: `lib/matchScenario.ts` — deterministic keyword scoring, **zero LLM calls** (the matcher selects which pandit-reviewed template renders, so the path must be auditable)

## Non-negotiable constraints (enforced in code)

1. **No AI-generated religious content.** All mantras/sankalpa/samagri come from `data/puja-templates.json` (retrieval only, `review.status` field per template = pending advisor-pandit review). Unmatched input → human-review fallback message, never generation.
2. **Design tokens replace (not extend) Tailwind's palette** in `app/globals.css` — banned AI-slop defaults (`bg-indigo-600`, `text-gray-500`, `rounded-2xl`, `shadow-lg`) do not exist in this build. See `클로드-디자인-핸드오프/06-DESIGN-DIRECTION.md`.
3. Saffron is fill-only (fails contrast as text); ink is maroon/brown; green = verified/auspicious only; no caste anywhere; prices on every card with dakshina/package distinction.

## Conscious deviations from the playbook

- **next-intl deferred** (playbook §7): EN-only v1 with a "EN | हिन्दी" toggle showing *coming soon* — avoids proxy.ts/locale-tree complexity in the offline precache. Drop-in later.
- **Devanagari fonts ARE shipped** (playbook §6 said defer): the verified design uses real Devanagari in the EN UI (puja names, mantra blocks, शुभम्), so the subsets are required, not optional.

## Structure

```
app/            routes: / → result/[scenarioId] → puja/ → pandits/ → book/[s]/[p] → confirmed → checklist/[s]
app/sw.ts       Serwist service worker (precache + runtime cache + /~offline fallback)
app/serwist/[path]/route.ts   SW route handler — precaches every demo route
data/           the JSON "DB": scenarios, puja-templates, pandits, vendors, panchang
lib/            matchScenario (deterministic), analytics (localStorage), booking (localStorage)
components/     icons (one 1.75px stroke set), ui primitives, screen clients
```

## Imagery (all offline, no API keys)

- **Deity artwork** — public-domain Raja Ravi Varma / Ravi Varma Press chromolithographs from Wikimedia Commons in `public/deities/` (full & uncropped, top placement, credit caption; sources listed in each puja's `art` field). Advisor review still advised before pandit-facing demos.
- **Ritual step icons** — hand-drawn line-art SVGs in `components/StepIcon.tsx`, keyword-matched to step names.
- **Vendor maps** — real OpenStreetMap tiles pre-downloaded into `public/maps/` + positions in `data/maps.json`, rendered by `components/VendorMap.tsx` (ODbL attribution shown). Regenerate after changing vendor coords: `node scripts/gen-maps.mjs .`.

## Before the trip (open items)

- Advisor review of the chosen deity prints (etiquette sign-off)
- Pandit avatar illustrations (04-assets §4) — initials circles are the current fallback
- Advisor-pandit review of every template in `data/puja-templates.json` (all flagged `pending advisor review`)
- Deploy to Vercel (Hobby), rename project to `puja-bot`, generate static QR to the prod URL; rehearse `next start -H 0.0.0.0` hotspot fallback once
- Spot-check 2–3 DrikPanchang dates manually before pandit-facing demos
