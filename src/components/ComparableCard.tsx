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
  const { player, injury, matchScore, preInjuryPPG, preInjuryWeeklyPPG, postReturnPPG, gamesMissed } =
    comparable;

  const age =
    injury.seasonYear - new Date(player.birthDate).getFullYear();

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
        <div className="flex items-center gap-2 shrink-0">
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
            {matchScore}%
          </span>
        </div>
      </div>

      <PerformanceChart
        preInjuryPPG={preInjuryPPG}
        preInjuryWeeklyPPG={preInjuryWeeklyPPG}
        postReturnPPG={postReturnPPG}
      />
    </div>
  );
}
