import type { Verdict } from "@/lib/types";

interface VerdictBoxProps {
  verdict: Verdict;
}

const VERDICT_STYLES: Record<
  string,
  { bg: string; border: string; text: string; label: string }
> = {
  HOLD: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    label: "HOLD",
  },
  MONITOR: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    label: "MONITOR",
  },
  CONSIDER_SELLING: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    label: "CONSIDER SELLING",
  },
};

export default function VerdictBox({ verdict }: VerdictBoxProps) {
  if (verdict.type === null) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📊</span>
          <h3 className="font-bold text-gray-700">Insufficient Data</h3>
        </div>
        <p className="text-sm text-gray-600">{verdict.message}</p>
      </div>
    );
  }

  const style = VERDICT_STYLES[verdict.type];

  return (
    <div className={`${style.bg} border ${style.border} rounded-xl p-5 mt-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {verdict.type === "HOLD"
              ? "✅"
              : verdict.type === "MONITOR"
                ? "👀"
                : "⚠️"}
          </span>
          <h3 className={`font-bold ${style.text}`}>
            Verdict: {style.label}
          </h3>
        </div>
        {verdict.medianRecoveryPct !== null && (
          <span className={`text-sm font-semibold ${style.text}`}>
            {verdict.medianRecoveryPct}% of baseline
          </span>
        )}
      </div>
      <p className="text-sm text-gray-700">{verdict.message}</p>
      <p className="text-xs text-gray-400 mt-2">
        Based on {verdict.comparablesUsed} comparable cases
      </p>
    </div>
  );
}
