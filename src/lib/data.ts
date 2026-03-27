import { readFileSync } from "fs";
import { join } from "path";
import type { Player, Injury, GameLog } from "./types";

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
