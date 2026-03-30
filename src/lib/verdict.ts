import type { ScoredComparable, Verdict, AbsenceSeverity } from "./types";

const MIN_COMPARABLES = 5;
const MIN_GAMES_MISSED_COMPARABLES = 3;
const HOLD_THRESHOLD = 0.85;
const MONITOR_THRESHOLD = 0.70;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function getAbsenceSeverity(medianGamesMissed: number): AbsenceSeverity {
  if (medianGamesMissed <= 2) return "SHORT";
  if (medianGamesMissed <= 5) return "MODERATE";
  return "EXTENDED";
}

export function getVerdict(comparables: ScoredComparable[]): Verdict {
  // Filter A (strict): recovery population
  const valid = comparables.filter(
    (c) => c.preInjuryPPG > 0 && c.postReturnPPG.length >= 2
  );

  // Filter B (broad): games missed population
  const gamesMissedComps = comparables.filter((c) => c.gamesMissed > 0);
  const medianGamesMissed =
    gamesMissedComps.length >= MIN_GAMES_MISSED_COMPARABLES
      ? Math.round(median(gamesMissedComps.map((c) => c.gamesMissed)) * 10) / 10
      : null;
  const absenceSeverity =
    medianGamesMissed !== null ? getAbsenceSeverity(medianGamesMissed) : null;

  const absenceText =
    medianGamesMissed !== null
      ? ` Expected absence: ~${medianGamesMissed} games.`
      : "";

  if (valid.length < MIN_COMPARABLES) {
    return {
      type: null,
      medianRecoveryPct: null,
      medianGamesMissed,
      absenceSeverity,
      comparablesUsed: valid.length,
      message: `Not enough data for a reliable recommendation (${valid.length} comparable${valid.length === 1 ? "" : "s"} found, minimum ${MIN_COMPARABLES} needed).${absenceText}`,
    };
  }

  // Calculate median post-return PPG (weeks 1-2) as % of pre-injury baseline
  const recoveryPcts = valid.map((c) => {
    const postWeeks1And2 =
      c.postReturnPPG.slice(0, 2).reduce((sum, v) => sum + v, 0) /
      Math.min(2, c.postReturnPPG.length);
    return postWeeks1And2 / c.preInjuryPPG;
  });

  const medianPct = median(recoveryPcts);
  const medianRounded = Math.round(medianPct * 100);

  if (medianPct > HOLD_THRESHOLD) {
    return {
      type: "HOLD",
      medianRecoveryPct: medianRounded,
      medianGamesMissed,
      absenceSeverity,
      comparablesUsed: valid.length,
      message: `History says this player bounces back quickly. Across ${valid.length} comparable cases, the median player returned to ${medianRounded}% of their pre-injury fantasy output within 2 weeks.${absenceText}`,
    };
  }

  if (medianPct >= MONITOR_THRESHOLD) {
    return {
      type: "MONITOR",
      medianRecoveryPct: medianRounded,
      medianGamesMissed,
      absenceSeverity,
      comparablesUsed: valid.length,
      message: `Recovery is typical but not guaranteed. Across ${valid.length} comparable cases, the median player returned to ${medianRounded}% of baseline within 2 weeks.${absenceText} Watch week 1 performance closely.`,
    };
  }

  return {
    type: "CONSIDER_SELLING",
    medianRecoveryPct: medianRounded,
    medianGamesMissed,
    absenceSeverity,
    comparablesUsed: valid.length,
    message: `Comparable players struggled significantly after this injury. Across ${valid.length} comparable cases, the median player returned to only ${medianRounded}% of baseline within 2 weeks.${absenceText}`,
  };
}
