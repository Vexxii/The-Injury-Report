# The Injury Report

Fantasy football injury comparables engine. Search any NFL player + injury, get ranked historical comparables with recovery timelines and a hold/sell verdict.

## Tech Stack

- Next.js 16 (App Router, Server Components)
- TypeScript
- Tailwind CSS
- Vitest + React Testing Library

## Project Structure

```
src/
  app/page.tsx          — Main server component (search, comparison, render)
  app/layout.tsx        — Root layout
  components/           — UI components
    SearchBar.tsx        — Client component, autocomplete search
    PlayerCard.tsx       — Player info + injury badge + headline stats
    ComparableCard.tsx   — Single comparable with performance chart
    VerdictBox.tsx       — Hold/Monitor/Sell recommendation
    PerformanceChart.tsx — Mini bar chart (pre vs post injury)
  lib/
    types.ts             — Core TypeScript interfaces
    data.ts              — JSON data loading with module-level cache
    comparison.ts        — Comparison algorithm (pure function)
    verdict.ts           — Verdict logic (pure function)
  data/
    players.json         — 25 NFL players
    injuries.json        — 35 injury records
    gamelogs.json        — ~2000 weekly game logs
  __tests__/
    comparison.test.ts   — Comparison algorithm tests
    verdict.test.ts      — Verdict logic tests
```

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npx vitest run` — Run all tests
- `npx vitest` — Run tests in watch mode

## Testing

Uses Vitest with jsdom environment. Test files in `src/__tests__/`.

## Data

Seed data is pre-generated JSON in `src/data/`. Data is read via `fs.readFileSync` in server components with module-level caching.

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
