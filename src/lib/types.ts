export interface Player {
  id: string;
  name: string;
  position: "QB" | "RB" | "WR" | "TE";
  team: string;
  birthDate: string;
  heightInches: number;
  weightLbs: number;
}

export interface Injury {
  id: string;
  playerId: string;
  bodyPart: string;
  reportStatus: string; // Questionable, Doubtful, Out
  practiceStatus: string; // DNP, Limited, Full
  gamesMissed: number;
  seasonYear: number;
  weekNumber: number;
  returnWeek: number | null;
  returnSeasonYear: number | null;
}

export interface GameLog {
  playerId: string;
  seasonYear: number;
  week: number;
  fantasyPointsPPR: number;
  snaps: number;
  receptions: number;
}

export interface ScoredComparable {
  player: Player;
  injury: Injury;
  matchScore: number;
  preInjuryPPG: number;
  preInjuryWeeklyPPG: number[];
  postReturnPPG: number[];
  gamesMissed: number;
}

export type VerdictType = "HOLD" | "MONITOR" | "CONSIDER_SELLING";

export interface Verdict {
  type: VerdictType | null;
  medianRecoveryPct: number | null;
  comparablesUsed: number;
  message: string;
}

export interface SearchResult {
  player: Player;
  injuries: Injury[];
}
