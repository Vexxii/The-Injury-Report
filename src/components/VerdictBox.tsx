import type { Verdict, AbsenceSeverity } from "@/lib/types";

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

const SEVERITY_STYLES: Record<
  AbsenceSeverity,
  { text: string; bg: string; border: string }
> = {
  SHORT: {
    text: "text-green",
    bg: "bg-green-bg",
    border: "border-green/25",
  },
  MODERATE: {
    text: "text-amber",
    bg: "bg-amber-bg",
    border: "border-amber/25",
  },
  EXTENDED: {
    text: "text-red",
    bg: "bg-red-bg",
    border: "border-red/25",
  },
};

function SeverityLabel({
  severity,
  gamesMissed,
  align = "right",
}: {
  severity: AbsenceSeverity;
  gamesMissed: number;
  align?: "left" | "right";
}) {
  const style = SEVERITY_STYLES[severity];
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <span
        className={`inline-flex items-center font-mono text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${style.text} ${style.bg} border ${style.border}`}
      >
        {severity} absence
      </span>
      <p className="font-mono text-[11px] text-text-muted mt-1">
        ~{gamesMissed} games missed
      </p>
    </div>
  );
}

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
        <p className="text-[14px] text-text-muted">
          {isHypothetical && playerName && bodyPart
            ? `Not enough comparable ${bodyPart} injuries found for ${playerPosition ?? "this position"}s to generate a verdict.`
            : verdict.absenceSeverity !== null
              ? verdict.message.replace(/ Expected absence: ~[\d.]+ games\./, "")
              : verdict.message}
        </p>
        {verdict.absenceSeverity !== null && verdict.medianGamesMissed !== null && (
          <div className="mt-4 pt-3 border-t border-border-custom">
            <p className="font-mono text-[11px] text-text-muted mb-2">
              Based on comparable injuries:
            </p>
            <SeverityLabel
              severity={verdict.absenceSeverity}
              gamesMissed={verdict.medianGamesMissed}
              align="left"
            />
          </div>
        )}
      </div>
    );
  }

  const style = VERDICT_STYLES[verdict.type];

  // Strip "Expected absence: ~X games." from message when severity pill is visible (avoids duplication)
  const baseMessage =
    verdict.absenceSeverity !== null
      ? verdict.message.replace(/ Expected absence: ~[\d.]+ games\./, "")
      : verdict.message;

  const message =
    isHypothetical && playerName && bodyPart
      ? `If ${playerName} sustains a ${bodyPart} injury, ${baseMessage.charAt(0).toLowerCase()}${baseMessage.slice(1)}`
      : baseMessage;

  const metaLine =
    isHypothetical && bodyPart && playerPosition
      ? `Based on ${verdict.comparablesUsed} comparable ${bodyPart} cases for ${playerPosition}s`
      : `Based on ${verdict.comparablesUsed} comparable cases`;

  const borderVar = `var(--${verdict.type === "HOLD" ? "green" : verdict.type === "MONITOR" ? "amber" : "red"}-border)`;

  return (
    <div
      className={`animate-verdict ${style.bg} border rounded-xl border-l-4 ${style.borderColor} p-6`}
      style={{
        borderTopColor: borderVar,
        borderRightColor: borderVar,
        borderBottomColor: borderVar,
      }}
    >
      <p className={`font-mono text-[10px] font-semibold uppercase tracking-wider ${style.text} mb-1`}>
        Verdict
      </p>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className={`font-mono text-[28px] font-bold leading-tight ${style.text} mb-1`}>
            {style.label}
          </h3>
          {verdict.medianRecoveryPct !== null && (
            <p className={`font-mono text-sm font-medium ${style.text}`}>
              {verdict.medianRecoveryPct}% median recovery vs. pre-injury baseline
            </p>
          )}
        </div>
        {verdict.absenceSeverity !== null && verdict.medianGamesMissed !== null && (
          <SeverityLabel
            severity={verdict.absenceSeverity}
            gamesMissed={verdict.medianGamesMissed}
          />
        )}
      </div>
      <p className="text-[14px] text-foreground leading-relaxed mt-3">{message}</p>
      <p className="font-mono text-xs text-text-muted mt-3">{metaLine}</p>
    </div>
  );
}
