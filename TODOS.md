# TODOS

## PPR Format Toggle

**What:** Add a Full PPR / Half PPR / Standard toggle to the UI so users on half-PPR or standard platforms see correct numbers.

**Why:** Full PPR is the only format currently displayed. Users on Yahoo (half-PPR default) or ESPN standard leagues see incorrect fantasy point numbers, which undermines trust in the comparables data.

**Pros:** Covers ~60% more fantasy platforms accurately. Small UI change with high trust impact.

**Cons:** Requires either 3x game log data (one set per format) or runtime recalculation from raw stats (receptions, yards, TDs). Runtime recalc needs additional fields in gamelogs.json.

**Context:** The seed data currently stores `fantasyPointsPPR` only. To support half-PPR and standard, we'd need raw stat columns (receptions, rushing/receiving yards, TDs) and compute points on the fly: Standard = no reception bonus, Half = 0.5/rec, Full = 1.0/rec. The `receptions` field already exists in GameLog but isn't used for scoring yet.

**Blocked by:** MVP validation. Only build if users ask for it.

## Real Data Pipeline (nflverse)

**What:** Replace synthetic seed data with real historical data from nflverse. Build a TypeScript script that downloads nflverse CSV files (player stats, injury reports) and converts them to the app's JSON format.

**Why:** The current dataset is entirely fabricated by a seeded random generator. Game logs have plausible but fake fantasy point numbers. Injury records are hand-authored. The comparables engine can't provide real value until it's running on actual historical performance data.

**Pros:** Transforms the app from a demo into a real tool. Real data covers hundreds of players and thousands of injury events (2015-present), dramatically improving comparable quality and verdict accuracy.

**Cons:** nflverse CSVs are large (game logs alone are 50MB+). Need to filter to skill positions (QB/RB/WR/TE) and map `report_primary_injury` text to our controlled body part taxonomy. No severity grades available (Grade 1/2/3), so the fallback weight table remains the primary algorithm.

**Context:** The original plan called for Python + nfl-data-py, but Python isn't installed on this system. A TypeScript approach would use `fetch` to download CSVs from the nflverse GitHub releases, parse with a CSV library (e.g., `csv-parse`), normalize injury descriptions to our 12 body part categories, and output `players.json`, `injuries.json`, and `gamelogs.json`. A weekly `update.ts` script would append new data during NFL season. Alternatively, run the Python script on a different machine or in CI.

**Blocked by:** Nothing. This is the highest-priority TODO for making the product real.
