# TODOS

## PPR Format Toggle

**What:** Add a Full PPR / Half PPR / Standard toggle to the UI so users on half-PPR or standard platforms see correct numbers.

**Why:** Full PPR is the only format currently displayed. Users on Yahoo (half-PPR default) or ESPN standard leagues see incorrect fantasy point numbers, which undermines trust in the comparables data.

**Pros:** Covers ~60% more fantasy platforms accurately. Small UI change with high trust impact.

**Cons:** Requires either 3x game log data (one set per format) or runtime recalculation from raw stats (receptions, yards, TDs). Runtime recalc needs additional fields in gamelogs.json.

**Context:** The seed data currently stores `fantasyPointsPPR` only. To support half-PPR and standard, we'd need raw stat columns (receptions, rushing/receiving yards, TDs) and compute points on the fly: Standard = no reception bonus, Half = 0.5/rec, Full = 1.0/rec. The `receptions` field already exists in GameLog but isn't used for scoring yet.

**Blocked by:** MVP validation. Only build if users ask for it.

## Shareable Results

**What:** Add a share button to results pages so users can send verdicts to leaguemates. Include OG meta tags for social previews.

**Why:** Fantasy managers constantly share injury intel with their leagues. The URL already contains player + injury params (`?player=Derrick+Henry&injury=0`), but there's no share prompt or social card preview.

**Pros:** Viral loop for free. Fantasy leagues are 8-14 people who all want the same data. One share could bring 10 new users.

**Cons:** OG meta tags require dynamic generation (Next.js `generateMetadata`). Share button is trivial, social previews need a bit more work.

**Context:** URLs are already shareable by copying from the browser. This TODO adds: (1) a "Copy link" or share button on the results page, (2) dynamic OG meta tags so shared links preview with player name, injury, and verdict in Slack/iMessage/Twitter.

**Blocked by:** Nothing. Ready to build.

---

## Completed

### Verdict-First Layout

**Completed:** v1.2.0.0 (2026-03-28)

Moved VerdictBox above PlayerCard in `src/app/page.tsx`. Results page now renders: SearchBar → InjuryPills → VerdictBox → PlayerCard → ComparableCards. Answer first, evidence second.

### Design System Documentation (DESIGN.md)

**Completed:** v1.2.0.0 (2026-03-28)

Created DESIGN.md with full design system: Industrial/Utilitarian aesthetic, dark theme default (#111113), Instrument Serif (display), DM Sans (body), JetBrains Mono (data), burnt orange accent (#E8572A), verdict box treatment with 4px left border, spacing scale, motion specs, and anti-patterns. Based on competitive research (FantasyPros, Draft Sharks, SIC Score, Sleeper) and user observation findings.

### Real Data Pipeline (nflverse)

**Completed:** v1.1.0.0 (2026-03-28)

Implemented as `scripts/seed.py` (Python + nfl-data-py). Fetches real NFL data from nflverse, deduplicates weekly injury reports into discrete events, and writes `players.json` (1,156 players), `injuries.json` (3,703 events), and `gamelogs.json` (47,456 game logs). Covers 2015-2024, all skill positions. No severity grades available, so the fallback weight table (body part 30%, position 30%, age 20%, workload 10%, era 10%) is the primary algorithm. Snap count data skipped due to ID join mismatch (workload dimension scores 0 for now, 10% weight).
