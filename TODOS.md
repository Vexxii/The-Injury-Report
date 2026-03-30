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

## Verdict Downgrade for Long Absences

**What:** Cap verdict at MONITOR when median games missed is 6+ games, regardless of recovery %. Prevents misleading HOLD verdicts for season-altering injuries.

**Why:** A HOLD verdict with EXTENDED absence (6+ games) is correct on recovery quality but misleading for fantasy decision-making. A player who comes back at 90% but misses half the season is not a "hold" in most fantasy contexts. Users need the verdict type itself to reflect the total fantasy impact.

**Pros:** Eliminates the most confusing verdict combination (HOLD + EXTENDED). Makes the verdict more actionable without requiring the user to interpret two independent signals.

**Cons:** Adds opinion to what is currently a purely data-driven system. The threshold (6 games) is somewhat arbitrary without position context. May need position-specific tuning (see Position-Specific Absence Thresholds TODO).

**Context:** The two-dimensional verdict (v1.4) ships with games missed as an independent signal alongside recovery %. The downgrade rule was proposed during CEO review and explicitly deferred to collect user feedback first. Implementation is ~15 LOC in `verdict.ts` — add a conditional after the recovery % thresholds that caps the verdict type. The severity label (SHORT/MODERATE/EXTENDED) continues to display regardless.

**Blocked by:** Two-dimensional verdict must ship first. Ideally collect user feedback on whether HOLD + EXTENDED is confusing before implementing.

## Games Missed IQR Distribution

**What:** Show the interquartile range (25th-75th percentile) of games missed alongside the median. Display as "Typically 2-5 games missed (median: 3)" in VerdictBox.

**Why:** Median alone hides variance. A tight range (2-3 games) is much more predictable than a wide range (1-10 games). Fantasy managers making hold/sell decisions benefit from knowing how spread out the outcomes are.

**Pros:** Gives users a confidence signal. A narrow IQR means the estimate is reliable; a wide IQR means anything could happen. Small code change — the `median()` helper in `verdict.ts` already sorts the array, so computing percentiles is trivial.

**Cons:** Adds visual complexity to VerdictBox. May be too much data for casual users. Need to handle display when IQR is very narrow (e.g., all comps missed exactly 2 games).

**Context:** Deferred from CEO review. The data is already available — `gamesMissed` on every comparable. Implementation: add `gamesMissedQ25` and `gamesMissedQ75` to the Verdict interface, compute from the same broad filter used for `medianGamesMissed`. Display in VerdictBox below the games missed stat.

**Blocked by:** Two-dimensional verdict must ship first.

## Reinjury Risk Signal

**What:** Compute and display the historical reinjury rate for each body part. Show in VerdictBox: "Reinjury risk: High (32% of comparable players were reinjured within 2 seasons)."

**Why:** Reinjury risk is a major factor in fantasy hold/sell decisions that no competitor surfaces. Research shows hamstring strains have a 30% reinjury rate (Fantasy Points data). This is a strong differentiator — Draft Sharks, FantasyPros, and ESPN don't show this.

**Pros:** Unique feature in the fantasy injury space. Derived from existing data (count players in `injuries.json` with 2+ entries for the same body part). High trust impact — shows the tool considers factors beyond simple recovery %.

**Cons:** Requires querying across injuries per player, which is a different data access pattern than the current per-injury comparison. Need to define "reinjured" carefully (same body part within 2 seasons? any recurrence?). May produce unreliable rates for rare body parts with few data points.

**Context:** Deferred from CEO review. The data source is `injuries.json` (3,703 events across 1,156 players). Implementation: add a utility function in `lib/data.ts` that groups injuries by playerId + bodyPart, counts recurrences, and returns a rate. Add `reinjuryRate: number | null` to Verdict interface. Display in VerdictBox with Low/Moderate/High labels.

**Blocked by:** Nothing. Can be built independently of the two-dimensional verdict.

## Position-Specific Absence Thresholds

**What:** Use different SHORT/MODERATE/EXTENDED cutoffs for games missed based on player position. RB absence hurts more than QB absence due to lower waiver-wire replacement value.

**Why:** An RB missing 4 games is a bigger fantasy problem than a QB missing 4 games. RB replacement value on waivers is much lower, and RBs are more injury-prone. The current uniform thresholds (1-2/3-5/6+) don't account for this.

**Pros:** More accurate severity assessment per position. Proposed thresholds: QB 1-2/3-5/6+, RB 1/2-3/4+, WR 1-2/3-5/6+, TE 1-2/3-5/6+. Small change — adds a lookup table keyed by position in `verdict.ts`.

**Cons:** Thresholds are somewhat arbitrary without real usage validation data. Adds complexity to the severity derivation (4 threshold sets instead of 1). May confuse users if the same games missed gets different labels for different positions.

**Context:** Deferred from CEO review. Start with uniform thresholds, add position-specific tuning after collecting real usage patterns. Implementation: replace the hardcoded SHORT/MODERATE/EXTENDED cutoffs in `verdict.ts` with a `SEVERITY_THRESHOLDS` lookup table keyed by position. The position is already available via `comparables[0].player.position` or passed as a parameter.

**Blocked by:** Two-dimensional verdict must ship first. Need usage data to validate thresholds.

## CURRENT_SEASON Stale Constant

**What:** Replace the module-level `CURRENT_SEASON = new Date().getFullYear()` in `src/lib/comparison.ts:16` with a per-request value.

**Why:** The module-level constant is evaluated once on first import and cached for the lifetime of the server process. If the server starts in December 2025 and runs into January 2026, era scoring uses stale 2025 as "current." The new `getCurrentNFLWeek()` in `lib/data.ts` already computes the correct season dynamically per-request, but `comparison.ts` doesn't use it yet.

**Pros:** Eliminates a subtle scoring drift that compounds each year. Small change, high correctness impact.

**Cons:** Requires threading `currentSeason` through `findComparables()` or importing `getCurrentNFLWeek()` into `comparison.ts`. Minor API change.

**Blocked by:** Nothing. Ready to fix.

---

## Completed

### Two-Dimensional Verdict (Games Missed + Absence Severity)

**Completed:** 2026-03-29

Added median games missed and absence severity (SHORT/MODERATE/EXTENDED) as a second dimension to the verdict alongside recovery %. Uses two separate filter populations: strict filter for recovery (preInjuryPPG > 0, postReturnPPG >= 2, min 5 comps) and broad filter for games missed (gamesMissed > 0, min 3 comps, includes players who never returned). Severity pill displays right-aligned in VerdictBox opposite the verdict word. Games missed signal shows even when verdict type is null (insufficient recovery data). New types: AbsenceSeverity, updated Verdict interface. 18 verdict tests covering all severity boundaries and filter logic.

### What If Mode — Hypothetical Injury Lookup

**Completed:** 2026-03-29

Added "What If" mode so users can construct hypothetical injuries (player + body part) and instantly see historical comparables and a verdict. New URL scheme: `?player=X&whatif=bodypart`. New components: ModeToggle (History/What If segmented control), BodyPartPicker (12 body parts with frequency counts), hypothetical badge. Modified VerdictBox and PlayerCard for conditional hypothetical messaging. Added `getCurrentNFLWeek()`, `getBodyPartsWithCounts()`, `getDefaultBodyPartForPosition()` utilities. Comparable cards now filtered to only show entries with outcome data (chart + recovery). 21 new tests.

### Verdict-First Layout

**Completed:** v1.2.0.0 (2026-03-28)

Moved VerdictBox above PlayerCard in `src/app/page.tsx`. Results page now renders: SearchBar → InjuryPills → VerdictBox → PlayerCard → ComparableCards. Answer first, evidence second.

### Design System Documentation (DESIGN.md)

**Completed:** v1.2.0.0 (2026-03-28)

Created DESIGN.md with full design system: Industrial/Utilitarian aesthetic, dark theme default (#111113), Instrument Serif (display), DM Sans (body), JetBrains Mono (data), burnt orange accent (#E8572A), verdict box treatment with 4px left border, spacing scale, motion specs, and anti-patterns. Based on competitive research (FantasyPros, Draft Sharks, SIC Score, Sleeper) and user observation findings.

### Real Data Pipeline (nflverse)

**Completed:** v1.1.0.0 (2026-03-28)

Implemented as `scripts/seed.py` (Python + nfl-data-py). Fetches real NFL data from nflverse, deduplicates weekly injury reports into discrete events, and writes `players.json` (1,156 players), `injuries.json` (3,703 events), and `gamelogs.json` (47,456 game logs). Covers 2015-2024, all skill positions. No severity grades available, so the fallback weight table (body part 30%, position 30%, age 20%, workload 10%, era 10%) is the primary algorithm. Snap count data skipped due to ID join mismatch (workload dimension scores 0 for now, 10% weight).
