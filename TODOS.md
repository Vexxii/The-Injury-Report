# TODOS

## PPR Format Toggle

**What:** Add a Full PPR / Half PPR / Standard toggle to the UI so users on half-PPR or standard platforms see correct numbers.

**Why:** Full PPR is the only format currently displayed. Users on Yahoo (half-PPR default) or ESPN standard leagues see incorrect fantasy point numbers, which undermines trust in the comparables data.

**Pros:** Covers ~60% more fantasy platforms accurately. Small UI change with high trust impact.

**Cons:** Requires either 3x game log data (one set per format) or runtime recalculation from raw stats (receptions, yards, TDs). Runtime recalc needs additional fields in gamelogs.json.

**Context:** The seed data currently stores `fantasyPointsPPR` only. To support half-PPR and standard, we'd need raw stat columns (receptions, rushing/receiving yards, TDs) and compute points on the fly: Standard = no reception bonus, Half = 0.5/rec, Full = 1.0/rec. The `receptions` field already exists in GameLog but isn't used for scoring yet.

**Blocked by:** MVP validation. Only build if users ask for it.

## Verdict-First Layout

**What:** Move VerdictBox above PlayerCard so users see the HOLD/MONITOR/CONSIDER SELLING verdict immediately after searching, before the stat grid.

**Why:** User research (observation session, 2026-03-27) confirmed that the statistical decision is the #1 value prop. Currently the verdict is buried below the player stats card, requiring a scroll to find the answer.

**Pros:** Puts the core value prop front and center. Matches user mental model: "give me the answer first, then show me the evidence."

**Cons:** Minor layout change. The stat grid provides context that some users may want before seeing the verdict.

**Context:** Currently the results page renders: SearchBar → InjuryPills → PlayerCard → VerdictBox → ComparableCards. The proposed order: SearchBar → InjuryPills → VerdictBox → PlayerCard → ComparableCards. Change is in `src/app/page.tsx`, swapping two component positions.

**Blocked by:** Nothing. Ready to build.

## Shareable Results

**What:** Add a share button to results pages so users can send verdicts to leaguemates. Include OG meta tags for social previews.

**Why:** Fantasy managers constantly share injury intel with their leagues. The URL already contains player + injury params (`?player=Derrick+Henry&injury=0`), but there's no share prompt or social card preview.

**Pros:** Viral loop for free. Fantasy leagues are 8-14 people who all want the same data. One share could bring 10 new users.

**Cons:** OG meta tags require dynamic generation (Next.js `generateMetadata`). Share button is trivial, social previews need a bit more work.

**Context:** URLs are already shareable by copying from the browser. This TODO adds: (1) a "Copy link" or share button on the results page, (2) dynamic OG meta tags so shared links preview with player name, injury, and verdict in Slack/iMessage/Twitter.

**Blocked by:** Nothing. Ready to build.

## Design System Documentation (DESIGN.md)

**What:** Create a DESIGN.md documenting the app's visual patterns: color palette, typography, spacing, component hierarchy, and interaction patterns.

**Why:** The app currently has consistent design patterns (Geist fonts, gray-50/900 palette, rounded-xl cards) but they're implicit in the code. As the app grows, undocumented patterns drift.

**Pros:** Prevents design drift across features. Makes onboarding faster for contributors. Enables design reviews against a spec.

**Cons:** Takes time to write. May over-constrain early-stage iteration.

**Context:** Current patterns: Geist Sans + Geist Mono via next/font/google, bg-gray-50 base, gray-900 text, rounded-xl primary cards, rounded-lg inner elements, rounded-full pills/badges, red-50/red-700 for injury badges, green/amber/red for verdict and performance colors.

**Blocked by:** Nothing. Lower priority than feature work.

## Real Data Pipeline (nflverse)

**Completed:** v1.1.0.0 (2026-03-28)

Implemented as `scripts/seed.py` (Python + nfl-data-py). Fetches real NFL data from nflverse, deduplicates weekly injury reports into discrete events, and writes `players.json` (1,156 players), `injuries.json` (3,703 events), and `gamelogs.json` (47,456 game logs). Covers 2015-2024, all skill positions. No severity grades available, so the fallback weight table (body part 30%, position 30%, age 20%, workload 10%, era 10%) is the primary algorithm. Snap count data skipped due to ID join mismatch (workload dimension scores 0 for now, 10% weight).
