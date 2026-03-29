import type { ScoredComparable } from "@/lib/types";
import PerformanceChart from "./PerformanceChart";

interface ComparableCardProps {
  comparable: ScoredComparable;
  rank: number;
}

export default function ComparableCard({
  comparable,
  rank,
}: ComparableCardProps) {
  const { player, injury, matchScore, matchBreakdown, preInjuryPPG, preInjuryWeeklyPPG, postReturnPPG, gamesMissed } =
    comparable;

  const age =
    injury.seasonYear - new Date(player.birthDate).getFullYear();

  // Recovery %: average of first 2 post-return weeks vs pre-injury baseline
  const recoveryPct = preInjuryPPG > 0 && postReturnPPG.length >= 2
    ? Math.round(
        (postReturnPPG.slice(0, 2).reduce((sum, v) => sum + v, 0) /
          Math.min(2, postReturnPPG.length) /
          preInjuryPPG) *
          100
      )
    : null;

  function factorColor(score: number): string {
    if (score >= 0.85) return "text-green";
    if (score >= 0.5) return "text-amber";
    return "text-red";
  }

  // Injury factor omitted: candidates are pre-filtered to same body part, so it's always 1
  const factors = [
    { label: "Position", score: matchBreakdown.position, detail: matchBreakdown.position === 1 ? `same pos (${player.position})` : `different pos (${player.position})` },
    { label: "Age", score: matchBreakdown.age, detail: matchBreakdown.age >= 0.85 ? `similar age (${age})` : matchBreakdown.age > 0 ? `age gap (${age})` : `too far apart (${age})` },
    { label: "Workload", score: matchBreakdown.workload, detail: matchBreakdown.workload >= 0.85 ? "similar usage" : matchBreakdown.workload > 0 ? "different usage" : "no snap data" },
    { label: "Era", score: matchBreakdown.era, detail: matchBreakdown.era === 1 ? `recent (${injury.seasonYear})` : matchBreakdown.era >= 0.6 ? `6-10 yrs ago` : `>10 yrs ago` },
  ];

  return (
    <div className="bg-surface border border-border-custom rounded-lg p-4 transition-all duration-150 hover:-translate-y-px hover:border-text-muted">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-text-muted">#{rank}</span>
            <h3 className="font-display text-sm">{player.name}</h3>
          </div>
          <p className="font-mono text-[11px] text-text-muted mt-0.5">
            {player.position} · {player.team} · Age {age} ·{" "}
            {injury.seasonYear} Wk {injury.weekNumber}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-text-muted">
              {gamesMissed} {gamesMissed === 1 ? "game" : "games"} missed
            </span>
            <span
              className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border ${
                matchScore >= 70
                  ? "bg-green-bg text-green border-green-border"
                  : matchScore >= 50
                    ? "bg-amber-bg text-amber border-amber-border"
                    : "bg-surface-elevated text-text-muted border-border-custom"
              }`}
            >
              {matchScore}% match
            </span>
          </div>
          <div className="flex flex-col items-end gap-0">
            {factors.map((f) => (
              <span key={f.label} className={`font-mono text-[10px] leading-tight ${factorColor(f.score)}`}>
                {f.label}: {f.detail}
              </span>
            ))}
          </div>
        </div>
      </div>

      <PerformanceChart
        preInjuryPPG={preInjuryPPG}
        preInjuryWeeklyPPG={preInjuryWeeklyPPG}
        postReturnPPG={postReturnPPG}
      />

      {recoveryPct !== null && (
        <p
          className={`font-mono text-xs font-medium mt-1.5 ${
            recoveryPct >= 85
              ? "text-green"
              : recoveryPct >= 70
                ? "text-amber"
                : "text-red"
          }`}
        >
          {recoveryPct}% of baseline in first 2 weeks
        </p>
      )}
    </div>
  );
}
