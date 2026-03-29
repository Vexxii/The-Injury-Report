# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0.0] - 2026-03-29

### Added
- **What If mode**: explore hypothetical injuries before official reports drop. Search any player, pick a body part, and instantly see historical comparables and a verdict. Shareable via `?player=X&whatif=bodypart` URLs.
- Mode toggle (History / What If) appears on every player results page
- Body part picker with frequency counts across 12 injury types (e.g., "Hamstring 579 cases")
- Hypothetical scenario badge and conditional verdict messaging ("If Ja'Marr Chase sustains a hamstring injury...")
- Position-specific default body parts: the What If link auto-selects the most common injury for each position
- `getCurrentNFLWeek()` utility for accurate season/week detection year-round
- 21 new tests covering NFL week calculation, body part utilities, and What If integration with real data

### Changed
- Comparable cards now filtered to only show entries with outcome data (pre-injury baseline + post-return performance). No more chart-less cards taking up slots.
- PlayerCard shows info-blue "Scenario" badge and stat box in What If mode instead of red injury status
- VerdictBox renders position-specific meta line in What If mode ("Based on N comparable hamstring cases for WRs")
- DESIGN.md updated to permit segmented controls in the single-column layout

## [1.2.0.1] - 2026-03-28

### Fixed
- CLAUDE.md: added missing `setup.ts` to project structure tree
- DESIGN.md: corrected font loading description (Instrument Serif is local TTF, not Google Fonts)
- TODOS.md: reorganized into Open and Completed sections for clarity

## [1.2.0.0] - 2026-03-28

### Added
- Dark theme as default, with light mode support via CSS custom properties
- Design system documentation (DESIGN.md): typography, colors, spacing, motion, verdict box treatment, and anti-patterns
- Instrument Serif font for display/hero text (editorial authority)
- DM Sans for body text, JetBrains Mono for data labels and stats
- Verdict box entrance animation (fade + slide, 300ms)
- Comparable card hover lift effect

### Changed
- Moved verdict box above player card: answer first, evidence second (verdict-first layout)
- Replaced Geist Sans/Mono with Instrument Serif, DM Sans, and JetBrains Mono
- Background from light gray (#F9FAFB) to warm near-black (#111113)
- Accent color from gray-900 to burnt orange (#E8572A), used sparingly on logo and search button
- Verdict box redesigned with 4px left border, tinted background, oversized monospace verdict word
- Search bar styled with dark surface, orange submit button
- Injury pills, match badges, and stat boxes updated for dark palette
- All components use CSS custom properties for theme switching

### Notes
- Dark mode is the default. No system preference detection in MVP, just a manual toggle path via `data-theme="light"` on `<html>`.
- Design system based on competitive research: FantasyPros, Draft Sharks, SIC Score, Sleeper. Deliberate departures: dark default, serif display font, burnt orange accent.

## [1.1.0.0] - 2026-03-28

### Added
- Real NFL data pipeline (`scripts/seed.py`): fetches injury reports, weekly stats, player info, and snap counts from nflverse via nfl-data-py
- 1,156 real NFL players (QB/RB/WR/TE), 3,703 deduplicated injury events, and 47,456 game logs with actual fantasy points (2015-2024)
- Injury deduplication algorithm that collapses weekly practice/game reports into discrete injury events
- Body part normalization mapping nflverse labels to 12 categories (knee, ankle, hamstring, shoulder, concussion, foot, groin, back, calf, quad, hip, neck)
- Automated validation: referential integrity, body part taxonomy, no duplicate IDs

### Changed
- Replaced all synthetic seed data with real historical data from nflverse
- Updated CLAUDE.md project structure and data counts
- Replaced boilerplate README with project-specific documentation

### Notes
- Snap count data not joined (nflverse uses pfr_player_id, not gsis_id). Workload dimension scores 0 for all comparables (10% weight). All other dimensions work correctly.
- No severity grades in nflverse data. Fallback weight table (body part 30%, position 30%) is the primary algorithm.

## [1.0.0.0] - 2026-03-27

### Added
- Core comparison algorithm: weighted scoring across injury type (30%), position (30%), age (20%), workload (10%), and era (10%)
- Verdict engine: HOLD/MONITOR/CONSIDER_SELLING recommendations based on median post-return fantasy performance
- Player search with autocomplete suggestions
- Player card with headline stats: typical miss time, comparables count, post-injury dip, recovery timeline
- Comparable cards with match score badges and mini performance charts (pre-injury vs post-return)
- Injury selector for players with multiple injury records
- Empty states: no player found (with suggestions), no injuries, insufficient comparables
- Seed data: 25 NFL players, 35 injuries, ~2080 game logs (synthetic)
- 31 unit tests covering comparison algorithm, verdict logic, and data utilities
- TODOS.md with deferred items (real data pipeline, PPR format toggle)
