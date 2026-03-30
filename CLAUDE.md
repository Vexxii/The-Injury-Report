# The Injury Report

Fantasy football injury comparables engine. Search any NFL player + injury, get ranked historical comparables with recovery timelines and a hold/sell verdict. Supports "What If" mode for hypothetical injuries (`?player=X&whatif=bodypart`).

## Tech Stack

- Next.js 16 (App Router, Server Components)
- TypeScript
- Tailwind CSS
- Vitest + React Testing Library

## Project Structure

```
src/
  app/page.tsx          — Main server component (search, comparison, render)
  app/layout.tsx        — Root layout (Instrument Serif, DM Sans, JetBrains Mono)
  app/globals.css       — CSS custom properties (dark/light theme)
  components/           — UI components
    SearchBar.tsx        — Client component, autocomplete search
    PlayerCard.tsx       — Player info + injury badge + headline stats
    ComparableCard.tsx   — Single comparable with match breakdown, chart, recovery %
    VerdictBox.tsx       — Hold/Monitor/Sell verdict + absence severity pill (verdict-first layout)
    PerformanceChart.tsx — Mini bar chart (pre vs post injury)
    ModeToggle.tsx       — Client component, History/What If segmented control
    BodyPartPicker.tsx   — Client component, body part pill picker with counts
  fonts/
    InstrumentSerif-Regular.ttf
    InstrumentSerif-Italic.ttf
  lib/
    types.ts             — Core TypeScript interfaces (incl. MatchBreakdown, AbsenceSeverity, Verdict)
    data.ts              — JSON data loading, search, NFL week calc, body part utils
    comparison.ts        — Comparison algorithm (pure function)
    verdict.ts           — Verdict logic (pure function)
  data/
    players.json         — 1,156 NFL players (real nflverse data)
    injuries.json        — 3,703 injury events (real, deduplicated)
    gamelogs.json        — ~47,000 weekly game logs (real PPR stats)
  __tests__/
    comparison.test.ts   — Comparison algorithm tests
    data.test.ts         — Data loading, search, NFL week, body part tests
    verdict.test.ts      — Verdict logic tests
    whatif.test.ts       — What If mode: synthetic injury + real data integration
    setup.ts             — Test environment setup
scripts/
  seed.py                — Python script to fetch nflverse data and generate JSON
  generate-gamelogs.ts   — Legacy TypeScript seed script (synthetic data)
DESIGN.md                — Design system (colors, typography, spacing, motion)
```

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npx vitest run` — Run all tests
- `npx vitest` — Run tests in watch mode

## Testing

Uses Vitest with jsdom environment. Test files in `src/__tests__/`.

## Data

Real NFL data (2015-2024) sourced from nflverse via `scripts/seed.py`. Run `python scripts/seed.py` to regenerate. Data is read via `fs.readFileSync` in server components with module-level caching.

## Algorithm

Comparison scoring weights (no severity data available):
- Injury type (body part match): 30%
- Position: 30%
- Age proximity: 20% (15% decay/year, 0 beyond ±5)
- Workload: 10% (linear decay, 0 beyond ±20%)
- Era: 10% (full for 5yr, 60% for 6-10, 30% for >10)

Verdict thresholds (median weeks 1-2 recovery % of baseline):
- HOLD: >85%
- MONITOR: 70-85%
- CONSIDER_SELLING: <70%
- Minimum 5 valid comparables required

Two-dimensional verdict: recovery % + median games missed
- Games missed uses broader filter (gamesMissed > 0, min 3 comps, includes never-returned players)
- Absence severity: SHORT (1-2 games), MODERATE (3-5), EXTENDED (6+)
- Games missed signal shown even when recovery data is insufficient

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.
