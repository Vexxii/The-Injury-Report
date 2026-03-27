import type { Player, Injury, ScoredComparable } from "@/lib/types";

interface PlayerCardProps {
  player: Player;
  injury: Injury;
  comparables: ScoredComparable[];
}

const BODY_PART_LABELS: Record<string, string> = {
  hamstring: "Hamstring",
  knee_acl: "Knee (ACL)",
  knee_mcl: "Knee (MCL)",
  ankle: "Ankle",
  shoulder: "Shoulder",
  concussion: "Concussion",
  calf: "Calf",
  quad: "Quad",
  groin: "Groin",
  foot: "Foot",
  back: "Back",
  hand_wrist: "Hand/Wrist",
};

function formatBodyPart(bodyPart: string): string {
  return BODY_PART_LABELS[bodyPart] ?? bodyPart;
}

function getAvgPostInjuryDip(comparables: ScoredComparable[]): string {
  const valid = comparables.filter(
    (c) => c.preInjuryPPG > 0 && c.postReturnPPG.length >= 2
  );
  if (valid.length === 0) return "N/A";

  const dips = valid.map((c) => {
    const post = c.postReturnPPG.slice(0, 2).reduce((s, v) => s + v, 0) / 2;
    return ((post - c.preInjuryPPG) / c.preInjuryPPG) * 100;
  });
  const avgDip = Math.round(dips.reduce((s, v) => s + v, 0) / dips.length);
  return `${avgDip > 0 ? "+" : ""}${avgDip}%`;
}

function getAvgRecoveryWeeks(comparables: ScoredComparable[]): string {
  const valid = comparables.filter(
    (c) => c.preInjuryPPG > 0 && c.postReturnPPG.length >= 3
  );
  if (valid.length === 0) return "N/A";

  const recoveryWeeks = valid.map((c) => {
    for (let i = 0; i < c.postReturnPPG.length; i++) {
      if (c.postReturnPPG[i] >= c.preInjuryPPG * 0.85) return i + 1;
    }
    return c.postReturnPPG.length + 1;
  });
  const avg = Math.round(
    recoveryWeeks.reduce((s, v) => s + v, 0) / recoveryWeeks.length
  );
  return `Week ${avg}`;
}

export default function PlayerCard({
  player,
  injury,
  comparables,
}: PlayerCardProps) {
  const avgDip = getAvgPostInjuryDip(comparables);
  const recoveryBy = getAvgRecoveryWeeks(comparables);
  const avgMissed =
    comparables.length > 0
      ? Math.round(
          (comparables.reduce((s, c) => s + c.gamesMissed, 0) /
            comparables.length) *
            10
        ) / 10
      : injury.gamesMissed;

  return (
    <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold">{player.name}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {player.position} · {player.team} · Age{" "}
            {injury.seasonYear - new Date(player.birthDate).getFullYear()}
          </p>
        </div>
        <span className="bg-red-50 border border-red-200 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
          {formatBodyPart(injury.bodyPart)} · {injury.reportStatus}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Typical Miss Time
          </p>
          <p className="text-lg font-bold mt-1">
            {avgMissed} {avgMissed === 1 ? "game" : "games"}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Comparables
          </p>
          <p className="text-lg font-bold mt-1">{comparables.length}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Post-Injury (Wk 1-2)
          </p>
          <p
            className={`text-lg font-bold mt-1 ${
              avgDip.startsWith("-") && parseInt(avgDip) < -30
                ? "text-red-600"
                : avgDip.startsWith("-")
                  ? "text-amber-600"
                  : "text-green-600"
            }`}
          >
            {avgDip}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Full Recovery By
          </p>
          <p className="text-lg font-bold mt-1 text-green-600">{recoveryBy}</p>
        </div>
      </div>
    </div>
  );
}
