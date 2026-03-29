import type { Player, Injury, ScoredComparable } from "@/lib/types";

interface PlayerCardProps {
  player: Player;
  injury: Injury;
  comparables: ScoredComparable[];
  totalComparables: number;
  isHypothetical?: boolean;
}

const BODY_PART_LABELS: Record<string, string> = {
  knee: "Knee",
  ankle: "Ankle",
  hamstring: "Hamstring",
  shoulder: "Shoulder",
  concussion: "Concussion",
  foot: "Foot",
  groin: "Groin",
  back: "Back",
  calf: "Calf",
  quad: "Quad",
  hip: "Hip",
  neck: "Neck",
  other: "Other",
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
  return `Wk ${avg}`;
}

function dipColor(dip: string): string {
  if (dip === "N/A") return "text-text-muted";
  const val = parseInt(dip);
  if (isNaN(val)) return "text-text-muted";
  if (val < -30) return "text-red";
  if (val < 0) return "text-amber";
  return "text-green";
}

export default function PlayerCard({
  player,
  injury,
  comparables,
  totalComparables,
  isHypothetical,
}: PlayerCardProps) {
  const avgDip = getAvgPostInjuryDip(comparables);
  const recoveryBy = getAvgRecoveryWeeks(comparables);

  // For hypothetical, only use avg from comparables (never fall back to synthetic injury.gamesMissed = 0)
  const avgMissedFromComps =
    comparables.length > 0
      ? Math.round(
          (comparables.reduce((s, c) => s + c.gamesMissed, 0) /
            comparables.length) *
            10
        ) / 10
      : null;

  const avgMissed = isHypothetical
    ? (avgMissedFromComps ?? "N/A")
    : (avgMissedFromComps ?? injury.gamesMissed);

  return (
    <div className="bg-surface border border-border-custom rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
        <div>
          <h2 className="font-display text-[22px]">{player.name}</h2>
          <p className="font-mono text-xs text-text-muted mt-1">
            {player.position} · {player.team} · Age{" "}
            {injury.seasonYear - new Date(player.birthDate).getFullYear()}
          </p>
        </div>
        {isHypothetical ? (
          <span className="self-start bg-info/[0.08] border border-info/25 text-info font-mono text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
            {formatBodyPart(injury.bodyPart)}
          </span>
        ) : (
          <span className="self-start bg-red-bg border border-red-border text-red font-mono text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
            {formatBodyPart(injury.bodyPart)} · {injury.reportStatus}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-surface-elevated rounded-lg p-3 text-center">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-text-muted">
            Miss Time
          </p>
          <p className="font-mono text-lg font-bold mt-1">
            {avgMissed}
          </p>
        </div>
        <div className="bg-surface-elevated rounded-lg p-3 text-center">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-text-muted">
            Comparables
          </p>
          <p className="font-mono text-lg font-bold mt-1">{totalComparables}</p>
        </div>
        {isHypothetical ? (
          <div className="bg-surface-elevated rounded-lg p-3 text-center">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-text-muted">
              Scenario
            </p>
            <p className="font-mono text-lg font-bold mt-1 text-info">
              {formatBodyPart(injury.bodyPart)}
            </p>
          </div>
        ) : (
          <div className="bg-surface-elevated rounded-lg p-3 text-center">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-text-muted">
              Post-Inj (Wk 1-2)
            </p>
            <p className={`font-mono text-lg font-bold mt-1 ${dipColor(avgDip)}`}>
              {avgDip}
            </p>
          </div>
        )}
        <div className="bg-surface-elevated rounded-lg p-3 text-center">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-text-muted">
            Recovery By
          </p>
          <p className="font-mono text-lg font-bold mt-1 text-green">{recoveryBy}</p>
        </div>
      </div>
    </div>
  );
}
