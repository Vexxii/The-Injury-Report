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
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono">#{rank}</span>
            <h3 className="font-semibold text-sm truncate">{player.name}</h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {player.position} · {player.team} · Age {age} ·{" "}
            {injury.seasonYear} Week {injury.weekNumber}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-500">
            {gamesMissed} {gamesMissed === 1 ? "game" : "games"} missed
          </span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
              matchScore >= 70
                ? "bg-green-100 text-green-700"
                : matchScore >= 50
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {matchScore}% match
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
