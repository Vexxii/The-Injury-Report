# The Injury Report

Fantasy football injury comparables engine. Search any NFL player + injury type and get ranked historical comparables with recovery timelines, post-return fantasy performance, and a data-driven hold/sell verdict.

Built for competitive fantasy managers in money leagues who want real answers, not beat reporter tweets and Reddit vibes.

## How It Works

1. Search a player name
2. Select an injury from their history
3. See ranked comparables: players who had the same injury at a similar age and position
4. Get a verdict: **HOLD**, **MONITOR**, or **CONSIDER SELLING** based on how comparable players actually performed after returning

## Data

Real NFL data from [nflverse](https://github.com/nflverse) (2015-2024):

- **1,156 players** (QB, RB, WR, TE)
- **3,703 injury events** (deduplicated from weekly reports)
- **47,456 game logs** with pre-calculated full PPR fantasy points

Data is stored as static JSON. No database, no API keys needed.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Regenerate seed data

Requires Python 3.10+ with `nfl-data-py`, `pandas`, and `pyarrow`:

```bash
pip install nfl-data-py pandas pyarrow
python scripts/seed.py
```

This fetches fresh data from nflverse and writes to `src/data/`. Takes about 12 seconds.

## Tech Stack

- Next.js 16 (App Router, Server Components)
- TypeScript
- Tailwind CSS
- Vitest (31 tests)
- Vercel free tier for deployment

## Comparison Algorithm

Each comparable is scored 0-100% across five dimensions:

| Dimension | Weight | How it works |
|-----------|--------|-------------|
| Injury body part | 30% | Exact match on body part (knee, hamstring, ankle, etc.) |
| Position | 30% | Same position group (QB/RB/WR/TE) |
| Age at injury | 20% | 15% decay per year of difference, 0 beyond 5 years |
| Workload | 10% | Career offensive snaps, linear decay to 0 at 20% difference |
| Era | 10% | Full score for last 5 seasons, 60% for 6-10, 30% for older |

Verdict is based on median post-return fantasy PPG across comparables vs pre-injury baseline:
- **HOLD** (>85%): History says this player bounces back quickly
- **MONITOR** (70-85%): Recovery is typical but not guaranteed
- **CONSIDER SELLING** (<70%): Comparable players struggled after this injury

Minimum 5 valid comparables required for a verdict.

## Tests

```bash
npx vitest run
```

## Deploy

Push to main. Vercel auto-deploys.

## License

MIT
