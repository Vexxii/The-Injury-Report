# Changelog

All notable changes to this project will be documented in this file.

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
