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
  const { player, injury, matchScore, preInjuryPPG, postReturnPPG, gamesMissed } =
    comparable;

  const age =
    injury.seasonYear - new Date(player.birthDate).getFullYear();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono">#{rank}</span>
            <h3 className="font-semibold text-sm">{player.name}</h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {player.position} · {player.team} · Age {age} ·{" "}
            {injury.seasonYear} Week {injury.weekNumber}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {gamesMissed} {gamesMissed === 1 ? "game" : "games"} missed
          </span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
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
        postReturnPPG={postReturnPPG}
      />
    </div>
  );
}
