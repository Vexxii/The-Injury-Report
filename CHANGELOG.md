# Changelog

All notable changes to this project will be documented in this file.

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
