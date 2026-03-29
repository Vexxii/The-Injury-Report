import { readFileSync } from "fs";
import { join } from "path";
import type { Player, Injury, GameLog } from "./types";

export interface BodyPartCount {
  name: string;
  count: number;
}

interface DataStore {
  players: Player[];
  injuries: Injury[];
  gameLogs: GameLog[];
}

let cachedData: DataStore | null = null;

export function loadData(): DataStore {
  if (cachedData) return cachedData;

  const dataDir = join(process.cwd(), "src", "data");

  const players: Player[] = JSON.parse(
    readFileSync(join(dataDir, "players.json"), "utf-8")
  );
  const injuries: Injury[] = JSON.parse(
    readFileSync(join(dataDir, "injuries.json"), "utf-8")
  );
  const gameLogs: GameLog[] = JSON.parse(
    readFileSync(join(dataDir, "gamelogs.json"), "utf-8")
  );

  cachedData = { players, injuries, gameLogs };
  return cachedData;
}

export function findPlayerByName(
  players: Player[],
  query: string
): Player | undefined {
  const q = query.toLowerCase().trim();
  return players.find((p) => p.name.toLowerCase() === q);
}

export function searchPlayers(players: Player[], query: string): Player[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  return players
    .filter((p) => p.name.toLowerCase().includes(q))
    .slice(0, 10);
}

export function getPlayerInjuries(
  injuries: Injury[],
  playerId: string
): Injury[] {
  return injuries
    .filter((inj) => inj.playerId === playerId)
    .sort((a, b) => {
      if (a.seasonYear !== b.seasonYear) return b.seasonYear - a.seasonYear;
      return b.weekNumber - a.weekNumber;
    });
}

export function getCurrentNFLWeek(now: Date = new Date()): { season: number; week: number } {
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Off-season (February through August): default to Week 1 of upcoming season
  if (month < 8) {
    return { season: year, week: 1 };
  }

  // Find Labor Day (first Monday in September)
  const sept1 = new Date(year, 8, 1);
  const dayOfWeek = sept1.getDay();
  const laborDay = new Date(year, 8, dayOfWeek === 1 ? 1 : (8 - dayOfWeek + 1) % 7 + 1);

  // NFL Week 1 starts the Thursday after Labor Day
  const week1Thursday = new Date(laborDay);
  week1Thursday.setDate(laborDay.getDate() + 3);

  // Before Week 1 starts
  if (now < week1Thursday) {
    return { season: year, week: 1 };
  }

  // Calculate weeks elapsed since Week 1 Thursday
  const msElapsed = now.getTime() - week1Thursday.getTime();
  const weeksElapsed = Math.floor(msElapsed / (7 * 24 * 60 * 60 * 1000));
  const currentWeek = Math.min(Math.max(weeksElapsed + 1, 1), 18);

  return { season: year, week: currentWeek };
}

export function getBodyPartsWithCounts(injuries: Injury[]): BodyPartCount[] {
  const counts = new Map<string, number>();
  for (const inj of injuries) {
    if (inj.bodyPart === "other") continue;
    counts.set(inj.bodyPart, (counts.get(inj.bodyPart) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getDefaultBodyPartForPosition(
  position: string,
  injuries: Injury[],
  players: Player[]
): string {
  const playerIds = new Set(
    players.filter((p) => p.position === position).map((p) => p.id)
  );
  const counts = new Map<string, number>();
  for (const inj of injuries) {
    if (inj.bodyPart === "other") continue;
    if (!playerIds.has(inj.playerId)) continue;
    counts.set(inj.bodyPart, (counts.get(inj.bodyPart) ?? 0) + 1);
  }
  let maxPart = "knee"; // fallback
  let maxCount = 0;
  for (const [part, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxPart = part;
    }
  }
  return maxPart;
}
