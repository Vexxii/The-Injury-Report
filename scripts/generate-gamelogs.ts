/**
 * Generate realistic game log data for seeded players.
 * Run: npx tsx scripts/generate-gamelogs.ts
 *
 * Generates PPR fantasy points for each player for each week they played,
 * with realistic performance dips after injuries.
 */
import { writeFileSync } from "fs";
import { join } from "path";

interface GameLog {
  playerId: string;
  seasonYear: number;
  week: number;
  fantasyPointsPPR: number;
  snaps: number;
  receptions: number;
}

// Baseline PPR fantasy points per game by player (approximate career averages)
const playerBaselines: Record<string, { ppr: number; snaps: number; rec: number }> = {
  p001: { ppr: 16.5, snaps: 55, rec: 1.5 },  // Derrick Henry
  p002: { ppr: 17.2, snaps: 52, rec: 4.0 },  // Dalvin Cook
  p003: { ppr: 16.8, snaps: 54, rec: 2.5 },  // Nick Chubb
  p004: { ppr: 18.5, snaps: 58, rec: 4.5 },  // Saquon Barkley
  p005: { ppr: 22.0, snaps: 60, rec: 5.5 },  // Christian McCaffrey
  p006: { ppr: 17.0, snaps: 56, rec: 2.8 },  // Jonathan Taylor
  p007: { ppr: 17.5, snaps: 48, rec: 5.0 },  // Austin Ekeler
  p008: { ppr: 15.5, snaps: 52, rec: 3.0 },  // Joe Mixon
  p009: { ppr: 19.5, snaps: 62, rec: 7.0 },  // Davante Adams
  p010: { ppr: 20.0, snaps: 60, rec: 7.5 },  // Tyreek Hill
  p011: { ppr: 19.0, snaps: 62, rec: 6.5 },  // Ja'Marr Chase
  p012: { ppr: 20.5, snaps: 65, rec: 8.0 },  // Cooper Kupp
  p013: { ppr: 18.0, snaps: 60, rec: 7.0 },  // Stefon Diggs
  p014: { ppr: 15.0, snaps: 58, rec: 4.5 },  // DK Metcalf
  p015: { ppr: 22.5, snaps: 68, rec: 0.2 },  // Patrick Mahomes
  p016: { ppr: 23.0, snaps: 70, rec: 0.1 },  // Josh Allen
  p017: { ppr: 19.0, snaps: 65, rec: 0.2 },  // Dak Prescott
  p018: { ppr: 16.5, snaps: 58, rec: 6.5 },  // Travis Kelce
  p019: { ppr: 14.5, snaps: 55, rec: 5.0 },  // Mark Andrews
  p020: { ppr: 15.0, snaps: 56, rec: 5.0 },  // George Kittle
  p021: { ppr: 19.0, snaps: 52, rec: 5.5 },  // Alvin Kamara
  p022: { ppr: 16.0, snaps: 50, rec: 3.5 },  // Aaron Jones
  p023: { ppr: 16.5, snaps: 60, rec: 6.0 },  // Chris Godwin
  p024: { ppr: 20.0, snaps: 62, rec: 8.5 },  // Michael Thomas
  p025: { ppr: 16.0, snaps: 58, rec: 7.0 },  // Keenan Allen
};

// Injuries data for generating realistic performance around injury weeks
const injuries = [
  { playerId: "p001", season: 2023, weekOut: 8, weekBack: 12 },
  { playerId: "p001", season: 2024, weekOut: 10, weekBack: 12 },
  { playerId: "p002", season: 2021, weekOut: 3, weekBack: 7 },
  { playerId: "p003", season: 2023, weekOut: 2, weekBack: null }, // season-ending
  { playerId: "p004", season: 2023, weekOut: 5, weekBack: 10 },
  { playerId: "p004", season: 2022, weekOut: 10, weekBack: 12 },
  { playerId: "p005", season: 2022, weekOut: 5, weekBack: 12 },
  { playerId: "p005", season: 2021, weekOut: 9, weekBack: 14 },
  { playerId: "p006", season: 2023, weekOut: 4, weekBack: 10 },
  { playerId: "p006", season: 2022, weekOut: 7, weekBack: 11 },
  { playerId: "p007", season: 2022, weekOut: 7, weekBack: 10 },
  { playerId: "p008", season: 2021, weekOut: 12, weekBack: 16 },
  { playerId: "p009", season: 2022, weekOut: 14, weekBack: 17 },
  { playerId: "p010", season: 2023, weekOut: 6, weekBack: 8 },
  { playerId: "p011", season: 2024, weekOut: 5, weekBack: 8 },
  { playerId: "p012", season: 2022, weekOut: 10, weekBack: null },
  { playerId: "p012", season: 2023, weekOut: 4, weekBack: 9 },
  { playerId: "p013", season: 2021, weekOut: 6, weekBack: 10 },
  { playerId: "p014", season: 2022, weekOut: 8, weekBack: 11 },
  { playerId: "p015", season: 2023, weekOut: 8, weekBack: 11 },
  { playerId: "p016", season: 2023, weekOut: 11, weekBack: 13 },
  { playerId: "p017", season: 2022, weekOut: 6, weekBack: 11 },
  { playerId: "p018", season: 2023, weekOut: 12, weekBack: 15 },
  { playerId: "p019", season: 2023, weekOut: 8, weekBack: 15 },
  { playerId: "p020", season: 2022, weekOut: 6, weekBack: 10 },
  { playerId: "p020", season: 2023, weekOut: 3, weekBack: 5 },
  { playerId: "p021", season: 2022, weekOut: 11, weekBack: 14 },
  { playerId: "p022", season: 2021, weekOut: 9, weekBack: 13 },
  { playerId: "p022", season: 2023, weekOut: 5, weekBack: 10 },
  { playerId: "p023", season: 2022, weekOut: 7, weekBack: 11 },
  { playerId: "p023", season: 2023, weekOut: 3, weekBack: 9 },
  { playerId: "p024", season: 2020, weekOut: 2, weekBack: 10 },
  { playerId: "p024", season: 2021, weekOut: 5, weekBack: null },
  { playerId: "p025", season: 2021, weekOut: 4, weekBack: 7 },
  { playerId: "p025", season: 2023, weekOut: 8, weekBack: 13 },
];

function randomVariance(base: number, pct: number): number {
  const variance = base * pct;
  return base + (Math.random() * 2 - 1) * variance;
}

function generateGameLogs(): GameLog[] {
  const logs: GameLog[] = [];
  const seasons = [2020, 2021, 2022, 2023, 2024];
  const seed = 42;
  let rng = seed;

  // Simple seeded random for reproducibility
  function seededRandom(): number {
    rng = (rng * 16807) % 2147483647;
    return (rng - 1) / 2147483646;
  }

  function seededVariance(base: number, pct: number): number {
    const variance = base * pct;
    return Math.max(0, base + (seededRandom() * 2 - 1) * variance);
  }

  for (const [playerId, baseline] of Object.entries(playerBaselines)) {
    for (const season of seasons) {
      const playerInjuries = injuries.filter(
        (inj) => inj.playerId === playerId && inj.season === season
      );

      for (let week = 1; week <= 18; week++) {
        // Check if player is injured this week
        const isOut = playerInjuries.some(
          (inj) =>
            week >= inj.weekOut &&
            (inj.weekBack === null || week < inj.weekBack)
        );

        if (isOut) continue; // Player didn't play

        // Check if this is a post-return week
        let postReturnWeek = 0;
        for (const inj of playerInjuries) {
          if (inj.weekBack && week >= inj.weekBack) {
            const weeksBack = week - inj.weekBack + 1;
            if (weeksBack <= 4) {
              postReturnWeek = Math.max(postReturnWeek, weeksBack);
            }
          }
        }

        // Performance modifiers
        let pprMultiplier = 1.0;
        if (postReturnWeek > 0) {
          // Post-injury performance dip pattern
          const dips = [0.55, 0.70, 0.85, 0.95]; // weeks 1-4 after return
          pprMultiplier = dips[postReturnWeek - 1] ?? 1.0;
        }

        const fantasyPointsPPR = Math.round(
          seededVariance(baseline.ppr * pprMultiplier, 0.25) * 10
        ) / 10;
        const snaps = Math.round(
          seededVariance(baseline.snaps * (pprMultiplier * 0.9 + 0.1), 0.15)
        );
        const receptions = Math.round(
          seededVariance(baseline.rec * pprMultiplier, 0.3)
        );

        logs.push({
          playerId,
          seasonYear: season,
          week,
          fantasyPointsPPR: Math.max(0, fantasyPointsPPR),
          snaps: Math.max(0, snaps),
          receptions: Math.max(0, receptions),
        });
      }
    }
  }

  return logs;
}

const gameLogs = generateGameLogs();
const outputPath = join(__dirname, "..", "src", "data", "gamelogs.json");
writeFileSync(outputPath, JSON.stringify(gameLogs));
console.log(`Generated ${gameLogs.length} game logs → ${outputPath}`);
