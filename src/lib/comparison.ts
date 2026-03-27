import type { Player, Injury, GameLog, ScoredComparable } from "./types";

/**
 * Weight table for the comparison algorithm.
 * Since severity grades are not available in nflverse data,
 * we use the fallback weights (body-part only matching).
 */
const WEIGHTS = {
  injuryType: 0.3,
  position: 0.3,
  age: 0.2,
  workload: 0.1,
  era: 0.1,
};

const CURRENT_SEASON = new Date().getFullYear();
const MAX_AGE_DIFF = 5;
const AGE_DECAY_PER_YEAR = 0.15;
const MAX_WORKLOAD_DIFF_PCT = 0.2;

function getAgeAtInjury(player: Player, injury: Injury): number {
  const birthYear = new Date(player.birthDate).getFullYear();
  return injury.seasonYear - birthYear;
}

function scoreInjuryType(target: Injury, comparable: Injury): number {
  return target.bodyPart === comparable.bodyPart ? 1.0 : 0.0;
}

function scorePosition(target: Player, comparable: Player): number {
  return target.position === comparable.position ? 1.0 : 0.0;
}

function scoreAge(targetAge: number, comparableAge: number): number {
  const diff = Math.abs(targetAge - comparableAge);
  if (diff > MAX_AGE_DIFF) return 0;
  return Math.max(0, 1 - diff * AGE_DECAY_PER_YEAR);
}

function scoreWorkload(
  targetSnaps: number,
  comparableSnaps: number
): number {
  if (targetSnaps === 0 && comparableSnaps === 0) return 1;
  if (targetSnaps === 0 || comparableSnaps === 0) return 0;
  const diff = Math.abs(targetSnaps - comparableSnaps) / targetSnaps;
  if (diff > MAX_WORKLOAD_DIFF_PCT) return 0;
  return 1 - diff / MAX_WORKLOAD_DIFF_PCT;
}

function scoreEra(injurySeason: number): number {
  const yearsAgo = CURRENT_SEASON - injurySeason;
  if (yearsAgo <= 5) return 1.0;
  if (yearsAgo <= 10) return 0.6;
  return 0.3;
}

function getCareerSnaps(
  playerId: string,
  beforeSeason: number,
  beforeWeek: number,
  gameLogs: GameLog[]
): number {
  return gameLogs
    .filter(
      (gl) =>
        gl.playerId === playerId &&
        (gl.seasonYear < beforeSeason ||
          (gl.seasonYear === beforeSeason && gl.week < beforeWeek))
    )
    .reduce((sum, gl) => sum + gl.snaps, 0);
}

function getPreInjuryPPG(
  playerId: string,
  seasonYear: number,
  weekNumber: number,
  gameLogs: GameLog[]
): number {
  const priorGames = gameLogs
    .filter(
      (gl) =>
        gl.playerId === playerId &&
        gl.seasonYear === seasonYear &&
        gl.week < weekNumber
    )
    .sort((a, b) => b.week - a.week)
    .slice(0, 4);

  if (priorGames.length < 2) return -1; // insufficient data
  return (
    priorGames.reduce((sum, gl) => sum + gl.fantasyPointsPPR, 0) /
    priorGames.length
  );
}

function getPostReturnPPG(
  playerId: string,
  returnSeason: number | null,
  returnWeek: number | null,
  gameLogs: GameLog[]
): number[] {
  if (returnSeason === null || returnWeek === null) return [];

  const postGames = gameLogs
    .filter(
      (gl) =>
        gl.playerId === playerId &&
        gl.seasonYear === returnSeason &&
        gl.week >= returnWeek
    )
    .sort((a, b) => a.week - b.week)
    .slice(0, 4);

  return postGames.map((gl) => gl.fantasyPointsPPR);
}

export function findComparables(
  targetPlayer: Player,
  targetInjury: Injury,
  allPlayers: Player[],
  allInjuries: Injury[],
  allGameLogs: GameLog[]
): ScoredComparable[] {
  const targetAge = getAgeAtInjury(targetPlayer, targetInjury);
  const targetSnaps = getCareerSnaps(
    targetPlayer.id,
    targetInjury.seasonYear,
    targetInjury.weekNumber,
    allGameLogs
  );

  // Find all injuries with the same body part (excluding the target injury itself)
  const candidates = allInjuries.filter(
    (inj) =>
      inj.id !== targetInjury.id &&
      inj.bodyPart === targetInjury.bodyPart
  );

  const scored: ScoredComparable[] = [];

  for (const candidateInjury of candidates) {
    const candidatePlayer = allPlayers.find(
      (p) => p.id === candidateInjury.playerId
    );
    if (!candidatePlayer) continue;

    const candidateAge = getAgeAtInjury(candidatePlayer, candidateInjury);
    const candidateSnaps = getCareerSnaps(
      candidatePlayer.id,
      candidateInjury.seasonYear,
      candidateInjury.weekNumber,
      allGameLogs
    );

    const injuryScore = scoreInjuryType(targetInjury, candidateInjury);
    const positionScore = scorePosition(targetPlayer, candidatePlayer);
    const ageScore = scoreAge(targetAge, candidateAge);
    const workloadScore = scoreWorkload(targetSnaps, candidateSnaps);
    const eraScore = scoreEra(candidateInjury.seasonYear);

    const matchScore = Math.round(
      (injuryScore * WEIGHTS.injuryType +
        positionScore * WEIGHTS.position +
        ageScore * WEIGHTS.age +
        workloadScore * WEIGHTS.workload +
        eraScore * WEIGHTS.era) *
        100
    );

    const preInjuryPPG = getPreInjuryPPG(
      candidatePlayer.id,
      candidateInjury.seasonYear,
      candidateInjury.weekNumber,
      allGameLogs
    );

    const postReturnPPG = getPostReturnPPG(
      candidatePlayer.id,
      candidateInjury.returnSeasonYear,
      candidateInjury.returnWeek,
      allGameLogs
    );

    scored.push({
      player: candidatePlayer,
      injury: candidateInjury,
      matchScore,
      preInjuryPPG: preInjuryPPG === -1 ? 0 : Math.round(preInjuryPPG * 10) / 10,
      postReturnPPG: postReturnPPG.map((v) => Math.round(v * 10) / 10),
      gamesMissed: candidateInjury.gamesMissed,
    });
  }

  return scored.sort((a, b) => b.matchScore - a.matchScore);
}
