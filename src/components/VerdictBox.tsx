import type { Verdict } from "@/lib/types";

interface VerdictBoxProps {
  verdict: Verdict;
  isHypothetical?: boolean;
  playerName?: string;
  bodyPart?: string;
  playerPosition?: string;
}

const VERDICT_STYLES: Record<
  string,
  { bg: string; borderColor: string; text: string; label: string }
> = {
  HOLD: {
    bg: "bg-green-bg",
    borderColor: "border-l-green",
    text: "text-green",
    label: "HOLD",
  },
  MONITOR: {
    bg: "bg-amber-bg",
    borderColor: "border-l-amber",
    text: "text-amber",
    label: "MONITOR",
  },
  CONSIDER_SELLING: {
    bg: "bg-red-bg",
    borderColor: "border-l-red",
    text: "text-red",
    label: "CONSIDER SELLING",
  },
};

export default function VerdictBox({
  verdict,
  isHypothetical,
  playerName,
  bodyPart,
  playerPosition,
}: VerdictBoxProps) {
  if (verdict.type === null) {
    return (
      <div className="animate-verdict bg-surface border border-border-custom rounded-xl p-6">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
          Verdict
        </p>
        <h3 className="font-mono text-xl font-bold text-text-muted mb-3">
          Insufficient Data
        </h3>
        <p className="text-sm text-text-muted">
          {isHypothetical && playerName && bodyPart
            ? `Not enough comparable ${bodyPart} injuries found for ${playerPosition ?? "this position"}s to generate a verdict.`
            : verdict.message}
        </p>
      </div>
    );
  }

  const style = VERDICT_STYLES[verdict.type];

  const message =
    isHypothetical && playerName && bodyPart
      ? `If ${playerName} sustains a ${bodyPart} injury, ${verdict.message.charAt(0).toLowerCase()}${verdict.message.slice(1)}`
      : verdict.message;

  const metaLine =
    isHypothetical && bodyPart && playerPosition
      ? `Based on ${verdict.comparablesUsed} comparable ${bodyPart} cases for ${playerPosition}s`
      : `Based on ${verdict.comparablesUsed} comparable cases`;

  return (
    <div
      className={`animate-verdict ${style.bg} border rounded-xl border-l-4 ${style.borderColor} p-6`}
      style={{
        borderTopColor: `var(--${verdict.type === "HOLD" ? "green" : verdict.type === "MONITOR" ? "amber" : "red"}-border)`,
        borderRightColor: `var(--${verdict.type === "HOLD" ? "green" : verdict.type === "MONITOR" ? "amber" : "red"}-border)`,
        borderBottomColor: `var(--${verdict.type === "HOLD" ? "green" : verdict.type === "MONITOR" ? "amber" : "red"}-border)`,
      }}
    >
      <p className={`font-mono text-[10px] font-semibold uppercase tracking-wider ${style.text} mb-1`}>
        Verdict
      </p>
      <h3 className={`font-mono text-[28px] font-bold leading-tight ${style.text} mb-1`}>
        {style.label}
      </h3>
      {verdict.medianRecoveryPct !== null && (
        <p className={`font-mono text-sm font-medium ${style.text} mb-3`}>
          {verdict.medianRecoveryPct}% median recovery vs. pre-injury baseline
        </p>
      )}
      <p className="text-sm text-foreground leading-relaxed">{message}</p>
      <p className="font-mono text-xs text-text-muted mt-3">{metaLine}</p>
    </div>
  );
}
