import type { Verdict } from "@/lib/types";

interface VerdictBoxProps {
  verdict: Verdict;
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

export default function VerdictBox({ verdict }: VerdictBoxProps) {
  if (verdict.type === null) {
    return (
      <div className="animate-verdict bg-surface border border-border-custom rounded-xl p-6">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
          Verdict
        </p>
        <h3 className="font-mono text-xl font-bold text-text-muted mb-3">
          Insufficient Data
        </h3>
        <p className="text-sm text-text-muted">{verdict.message}</p>
      </div>
    );
  }

  const style = VERDICT_STYLES[verdict.type];

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
          {verdict.medianRecoveryPct}% of baseline
        </p>
      )}
      <p className="text-sm text-foreground leading-relaxed">{verdict.message}</p>
      <p className="font-mono text-xs text-text-muted mt-3">
        Based on {verdict.comparablesUsed} comparable cases
      </p>
    </div>
  );
}
