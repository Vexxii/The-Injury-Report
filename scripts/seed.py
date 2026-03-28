"""
Seed script for The Injury Report.

Fetches real NFL data from nflverse via nfl-data-py and writes three JSON files
(players.json, injuries.json, gamelogs.json) that match the TypeScript interfaces
in src/lib/types.ts.

Usage: python scripts/seed.py
Dependencies: nfl-data-py, pandas, pyarrow
"""

import json
import gzip
import time
from pathlib import Path

import nfl_data_py as nfl
import pandas as pd

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SEASONS = list(range(2015, 2025))  # 2015-2024 inclusive
POSITIONS = {"QB", "RB", "WR", "TE"}
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "src" / "data"

# nflverse report_primary_injury / practice_primary_injury → app body part
BODY_PART_MAP = {
    "knee": "knee",
    "ankle": "ankle",
    "hamstring": "hamstring",
    "shoulder": "shoulder",
    "concussion": "concussion",
    "foot": "foot",
    "groin": "groin",
    "back": "back",
    "calf": "calf",
    "quadricep": "quad",
    "quad": "quad",
    "hip": "hip",
    "neck": "neck",
    "achilles": "ankle",
    "oblique": "back",
    "abdomen": "other",
    "chest": "other",
    "elbow": "other",
    "wrist": "other",
    "thumb": "other",
    "ribs": "other",
    "rib": "other",
    "finger": "other",
    "toe": "other",
    "shin": "other",
    "pectoral": "other",
    "head": "concussion",
    "eye": "other",
    "forearm": "other",
    "biceps": "other",
    "triceps": "other",
    "thigh": "hamstring",
    "lower leg": "calf",
    "jaw": "other",
    "hand": "other",
    "rib cage": "other",
    "buttocks": "other",
}

REPORT_STATUS_SEVERITY = {"Out": 4, "Doubtful": 3, "Questionable": 2, "Probable": 1}
PRACTICE_STATUS_MAP = {
    "Did Not Participate In Practice": "DNP",
    "Limited Participation in Practice": "Limited",
    "Full Participation in Practice": "Full",
    "Out (Definitely Will Not Play)": "DNP",
}

# Gap threshold: if same player+body_part reappears after this many weeks,
# treat as a new injury event (handles bye weeks at 1-2 week gaps).
INJURY_GAP_WEEKS = 2


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def normalize_body_part(raw: str | None) -> str | None:
    """Map nflverse injury description to our taxonomy."""
    if not raw or not isinstance(raw, str):
        return None
    key = raw.strip().lower()
    # Handle prefixed values like "right Elbow", "left Knee"
    for prefix in ("right ", "left "):
        if key.startswith(prefix):
            key = key[len(prefix):]
    return BODY_PART_MAP.get(key, "other")


def parse_height_inches(h) -> int | None:
    """Convert height (numeric inches from nflverse) to int."""
    if pd.isna(h):
        return None
    try:
        return int(float(h))
    except (ValueError, TypeError):
        return None


def worst_report_status(a: str | None, b: str | None) -> str:
    """Return the more severe report status."""
    sa = REPORT_STATUS_SEVERITY.get(a, 0) if a else 0
    sb = REPORT_STATUS_SEVERITY.get(b, 0) if b else 0
    return a if sa >= sb else (b or a or "Questionable")


def worst_practice_status(a: str | None, b: str | None) -> str:
    """Return the more severe practice status."""
    order = {"DNP": 3, "Limited": 2, "Full": 1}
    ma = PRACTICE_STATUS_MAP.get(a, a) if a else None
    mb = PRACTICE_STATUS_MAP.get(b, b) if b else None
    sa = order.get(ma, 0)
    sb = order.get(mb, 0)
    return ma if sa >= sb else (mb or ma or "DNP")


def write_json(data: list, filename: str) -> int:
    """Write compact JSON and return file size in bytes."""
    path = OUTPUT_DIR / filename
    with open(path, "w") as f:
        json.dump(data, f, separators=(",", ":"))
    size = path.stat().st_size
    return size


def estimate_gzip_size(path: Path) -> int:
    """Estimate gzipped size of a file."""
    raw = path.read_bytes()
    return len(gzip.compress(raw, compresslevel=6))


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

def main():
    t0 = time.time()
    print("=== The Injury Report: Seed Script ===")
    print(f"Seasons: {SEASONS[0]}-{SEASONS[-1]}")
    print()

    # ------------------------------------------------------------------
    # Step 1: Fetch data
    # ------------------------------------------------------------------
    print("Step 1: Fetching nflverse data...")

    t = time.time()
    players_df = nfl.import_players()
    print(f"  Players: {len(players_df)} rows ({time.time()-t:.1f}s)")

    t = time.time()
    weekly_df = nfl.import_weekly_data(SEASONS)
    print(f"  Weekly stats: {len(weekly_df)} rows ({time.time()-t:.1f}s)")

    t = time.time()
    injuries_df = nfl.import_injuries(SEASONS)
    print(f"  Injuries: {len(injuries_df)} rows ({time.time()-t:.1f}s)")
    print()

    # ------------------------------------------------------------------
    # Step 2: Build player roster
    # ------------------------------------------------------------------
    print("Step 2: Building player roster...")

    # Filter players to skill positions with gsis_id
    skill_players = players_df[
        (players_df["position"].isin(POSITIONS))
        & (players_df["gsis_id"].notna())
    ].copy()

    # Filter weekly to skill positions
    skill_weekly = weekly_df[weekly_df["position"].isin(POSITIONS)].copy()

    # Find players who appear in both datasets
    player_ids_with_stats = set(skill_weekly["player_id"].dropna().unique())
    player_ids_in_roster = set(skill_players["gsis_id"].dropna().unique())
    matched_ids = sorted(player_ids_with_stats & player_ids_in_roster)

    print(f"  Players with roster data: {len(player_ids_in_roster)}")
    print(f"  Players with game logs: {len(player_ids_with_stats)}")
    print(f"  Matched (both): {len(matched_ids)}")

    # Build gsis_id → pNNNN mapping
    gsis_to_pid = {gsis: f"p{i+1:04d}" for i, gsis in enumerate(matched_ids)}

    # Build player records
    roster_lookup = skill_players.set_index("gsis_id")
    player_records = []
    for gsis_id, pid in gsis_to_pid.items():
        if gsis_id not in roster_lookup.index:
            continue
        row = roster_lookup.loc[gsis_id]
        if isinstance(row, pd.DataFrame):
            row = row.iloc[0]

        height = parse_height_inches(row.get("height"))
        weight = int(float(row["weight"])) if pd.notna(row.get("weight")) else None
        birth_date = str(row["birth_date"])[:10] if pd.notna(row.get("birth_date")) else None
        team = str(row.get("latest_team", "")) if pd.notna(row.get("latest_team")) else ""

        if not birth_date or height is None or weight is None:
            continue

        player_records.append({
            "id": pid,
            "name": str(row["display_name"]),
            "position": str(row["position"]),
            "team": team,
            "birthDate": birth_date,
            "heightInches": height,
            "weightLbs": weight,
        })

    # Rebuild gsis_to_pid to only include players we kept
    valid_pids = {r["id"] for r in player_records}
    pid_to_name = {r["id"]: r["name"] for r in player_records}
    gsis_to_pid = {g: p for g, p in gsis_to_pid.items() if p in valid_pids}

    print(f"  Final player count: {len(player_records)}")
    pos_counts = {}
    for p in player_records:
        pos_counts[p["position"]] = pos_counts.get(p["position"], 0) + 1
    print(f"  By position: {pos_counts}")
    print()

    # ------------------------------------------------------------------
    # Step 3: Build game logs
    # ------------------------------------------------------------------
    print("Step 3: Building game logs...")

    # Filter weekly to our matched players
    gl_df = skill_weekly[skill_weekly["player_id"].isin(gsis_to_pid)].copy()

    gamelog_records = []
    for _, row in gl_df.iterrows():
        pid = gsis_to_pid.get(row["player_id"])
        if not pid or pid not in valid_pids:
            continue

        ppr = row.get("fantasy_points_ppr")
        if pd.isna(ppr):
            continue

        rec = row.get("receptions", 0)
        if pd.isna(rec):
            rec = 0

        gamelog_records.append({
            "playerId": pid,
            "seasonYear": int(row["season"]),
            "week": int(row["week"]),
            "fantasyPointsPPR": max(0, round(float(ppr), 1)),
            "snaps": 0,  # snap data uses pfr_player_id, can't join reliably
            "receptions": max(0, round(float(rec), 1)),
        })

    # Build a lookup set for fast "did this player play this week?" checks
    played_weeks = set()
    for gl in gamelog_records:
        played_weeks.add((gl["playerId"], gl["seasonYear"], gl["week"]))

    print(f"  Game logs: {len(gamelog_records)}")
    print()

    # ------------------------------------------------------------------
    # Step 4: Deduplicate injury reports into discrete events
    # ------------------------------------------------------------------
    print("Step 4: Deduplicating injury reports...")

    # Filter injuries to our players
    inj_df = injuries_df[injuries_df["gsis_id"].isin(gsis_to_pid)].copy()

    # Normalize body parts
    inj_df["body_part_norm"] = inj_df["report_primary_injury"].apply(normalize_body_part)
    # Fall back to practice injury if report is null
    mask = inj_df["body_part_norm"].isna()
    inj_df.loc[mask, "body_part_norm"] = inj_df.loc[mask, "practice_primary_injury"].apply(
        normalize_body_part
    )
    # Drop rows with no body part
    inj_df = inj_df[inj_df["body_part_norm"].notna()].copy()
    # Drop non-injury entries
    inj_df = inj_df[inj_df["body_part_norm"] != normalize_body_part("Not Injury Related")]
    inj_df = inj_df[~inj_df["report_primary_injury"].fillna("").str.lower().str.contains("not injury")]
    inj_df = inj_df[~inj_df["practice_primary_injury"].fillna("").str.lower().str.contains("not injury")]

    # Sort by player, season, week
    inj_df = inj_df.sort_values(["gsis_id", "season", "week"]).reset_index(drop=True)

    # Collapse into events
    events = []
    current = None

    for _, row in inj_df.iterrows():
        gsis = row["gsis_id"]
        bp = row["body_part_norm"]
        season = int(row["season"])
        week = int(row["week"])
        rs = row.get("report_status")
        ps = row.get("practice_status")
        if pd.isna(rs):
            rs = None
        if pd.isna(ps):
            ps = None

        is_same_event = (
            current is not None
            and current["gsis_id"] == gsis
            and current["body_part"] == bp
            and current["season"] == season
            and week <= current["last_week"] + INJURY_GAP_WEEKS + 1
        )

        if is_same_event:
            current["last_week"] = week
            current["report_status"] = worst_report_status(current["report_status"], rs)
            current["practice_status"] = worst_practice_status(current["practice_status"], ps)
        else:
            if current is not None:
                events.append(current)
            current = {
                "gsis_id": gsis,
                "body_part": bp,
                "season": season,
                "first_week": week,
                "last_week": week,
                "report_status": rs if rs else "Questionable",
                "practice_status": PRACTICE_STATUS_MAP.get(ps, "DNP") if ps else "DNP",
            }

    if current is not None:
        events.append(current)

    print(f"  Raw injury rows (filtered): {len(inj_df)}")
    print(f"  Deduplicated events: {len(events)}")

    # ------------------------------------------------------------------
    # Step 5: Compute gamesMissed, returnWeek, returnSeasonYear
    # ------------------------------------------------------------------
    print("Step 5: Computing games missed and return weeks...")

    # Build per-player game log index for fast lookup
    player_game_weeks: dict[str, list[tuple[int, int]]] = {}
    for gl in gamelog_records:
        pid = gl["playerId"]
        if pid not in player_game_weeks:
            player_game_weeks[pid] = []
        player_game_weeks[pid].append((gl["seasonYear"], gl["week"]))

    # Sort each player's weeks
    for pid in player_game_weeks:
        player_game_weeks[pid].sort()

    injury_records = []
    for ev in events:
        pid = gsis_to_pid.get(ev["gsis_id"])
        if not pid:
            continue

        season = ev["season"]
        first_week = ev["first_week"]
        last_week = ev["last_week"]

        # Find return: first game log after last_week in same season or next
        player_weeks = player_game_weeks.get(pid, [])
        return_week = None
        return_season = None
        for s, w in player_weeks:
            if s == season and w > last_week:
                return_week = w
                return_season = s
                break
            elif s == season + 1:
                return_week = w
                return_season = s
                break

        # Count games missed: weeks from first_week to return_week-1 (or end of season)
        # where player has no game log
        if return_week is not None and return_season == season:
            missed = 0
            for w in range(first_week, return_week):
                if (pid, season, w) not in played_weeks:
                    missed += 1
        elif return_week is not None and return_season == season + 1:
            # Missed rest of this season + start of next
            missed = 0
            for w in range(first_week, 19):  # weeks up to 18
                if (pid, season, w) not in played_weeks:
                    missed += 1
            for w in range(1, return_week):
                if (pid, return_season, w) not in played_weeks:
                    missed += 1
        else:
            # Season-ending: count from first_week to week 18
            missed = 0
            for w in range(first_week, 19):
                if (pid, season, w) not in played_weeks:
                    missed += 1

        if missed < 1:
            continue

        # Map practice_status if it wasn't already mapped
        ps = ev["practice_status"]
        if ps not in ("DNP", "Limited", "Full"):
            ps = PRACTICE_STATUS_MAP.get(ps, "DNP")

        injury_records.append({
            "playerId": pid,
            "bodyPart": ev["body_part"],
            "reportStatus": ev["report_status"],
            "practiceStatus": ps,
            "gamesMissed": missed,
            "seasonYear": season,
            "weekNumber": first_week,
            "returnWeek": return_week,
            "returnSeasonYear": return_season,
        })

    # Sort and assign IDs
    injury_records.sort(key=lambda x: (x["playerId"], x["seasonYear"], x["weekNumber"]))
    for i, rec in enumerate(injury_records):
        rec["id"] = f"i{i+1:04d}"

    # Reorder fields to match TypeScript interface
    injury_output = []
    for rec in injury_records:
        injury_output.append({
            "id": rec["id"],
            "playerId": rec["playerId"],
            "bodyPart": rec["bodyPart"],
            "reportStatus": rec["reportStatus"],
            "practiceStatus": rec["practiceStatus"],
            "gamesMissed": rec["gamesMissed"],
            "seasonYear": rec["seasonYear"],
            "weekNumber": rec["weekNumber"],
            "returnWeek": rec["returnWeek"],
            "returnSeasonYear": rec["returnSeasonYear"],
        })

    print(f"  Injuries with gamesMissed >= 1: {len(injury_output)}")

    # Body part distribution
    bp_counts: dict[str, int] = {}
    for rec in injury_output:
        bp = rec["bodyPart"]
        bp_counts[bp] = bp_counts.get(bp, 0) + 1
    print(f"  Body parts: {dict(sorted(bp_counts.items(), key=lambda x: -x[1]))}")
    print()

    # ------------------------------------------------------------------
    # Step 6: Filter — only keep players with at least 1 injury
    # ------------------------------------------------------------------
    print("Step 6: Filtering to players with injuries...")

    players_with_injuries = {rec["playerId"] for rec in injury_output}
    player_records = [p for p in player_records if p["id"] in players_with_injuries]
    gamelog_records = [g for g in gamelog_records if g["playerId"] in players_with_injuries]

    print(f"  Players (with injuries): {len(player_records)}")
    print(f"  Game logs (for injured players): {len(gamelog_records)}")
    print()

    # ------------------------------------------------------------------
    # Step 7: Write JSON
    # ------------------------------------------------------------------
    print("Step 7: Writing JSON files...")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    s1 = write_json(player_records, "players.json")
    s2 = write_json(injury_output, "injuries.json")
    s3 = write_json(gamelog_records, "gamelogs.json")

    total_raw = s1 + s2 + s3
    print(f"  players.json:  {len(player_records):>6,} records, {s1/1024:>8.1f} KB")
    print(f"  injuries.json: {len(injury_output):>6,} records, {s2/1024:>8.1f} KB")
    print(f"  gamelogs.json: {len(gamelog_records):>6,} records, {s3/1024:>8.1f} KB")
    print(f"  Total raw: {total_raw/1024:.1f} KB")

    # Estimate gzip sizes
    g1 = estimate_gzip_size(OUTPUT_DIR / "players.json")
    g2 = estimate_gzip_size(OUTPUT_DIR / "injuries.json")
    g3 = estimate_gzip_size(OUTPUT_DIR / "gamelogs.json")
    total_gz = g1 + g2 + g3
    print(f"  Estimated gzipped: {total_gz/1024:.1f} KB ({total_gz/1024/1024:.2f} MB)")
    print()

    # ------------------------------------------------------------------
    # Step 8: Validate
    # ------------------------------------------------------------------
    print("Step 8: Validating...")

    player_ids = {p["id"] for p in player_records}
    errors = 0

    # Every injury playerId exists in players
    for rec in injury_output:
        if rec["playerId"] not in player_ids:
            print(f"  ERROR: injury {rec['id']} references unknown player {rec['playerId']}")
            errors += 1

    # Every gamelog playerId exists in players
    gl_player_ids = {g["playerId"] for g in gamelog_records}
    for pid in gl_player_ids:
        if pid not in player_ids:
            print(f"  ERROR: gamelog references unknown player {pid}")
            errors += 1

    # No duplicate IDs
    injury_ids = [rec["id"] for rec in injury_output]
    if len(injury_ids) != len(set(injury_ids)):
        print("  ERROR: duplicate injury IDs found")
        errors += 1

    pid_list = [p["id"] for p in player_records]
    if len(pid_list) != len(set(pid_list)):
        print("  ERROR: duplicate player IDs found")
        errors += 1

    # All bodyParts in taxonomy
    valid_parts = {"knee", "ankle", "hamstring", "shoulder", "concussion", "foot",
                   "groin", "back", "calf", "quad", "hip", "neck", "other"}
    for rec in injury_output:
        if rec["bodyPart"] not in valid_parts:
            print(f"  ERROR: unknown bodyPart '{rec['bodyPart']}' in injury {rec['id']}")
            errors += 1

    # No negative fantasy points
    neg = sum(1 for g in gamelog_records if g["fantasyPointsPPR"] < 0)
    if neg:
        print(f"  ERROR: {neg} game logs with negative fantasy points")
        errors += 1

    if errors == 0:
        print("  All validations passed!")
    else:
        print(f"  {errors} validation error(s) found")

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    elapsed = time.time() - t0
    print()
    print("=== Summary ===")
    print(f"  Players: {len(player_records)}")
    print(f"  Injuries: {len(injury_output)}")
    print(f"  Game logs: {len(gamelog_records)}")
    print(f"  Seasons: {SEASONS[0]}-{SEASONS[-1]}")
    print(f"  Total size: {total_raw/1024:.0f} KB raw, ~{total_gz/1024:.0f} KB gzipped")
    print(f"  Elapsed: {elapsed:.1f}s")
    print()

    # Sample: show a known player
    for p in player_records:
        if "Henry" in p["name"] and p["position"] == "RB":
            print(f"  Sample player: {p}")
            sample_injuries = [i for i in injury_output if i["playerId"] == p["id"]]
            print(f"  Sample injuries: {sample_injuries[:3]}")
            break


if __name__ == "__main__":
    main()
