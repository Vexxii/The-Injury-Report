interface PerformanceChartProps {
  preInjuryPPG: number;
  preInjuryWeeklyPPG: number[];
  postReturnPPG: number[];
}

export default function PerformanceChart({
  preInjuryPPG,
  preInjuryWeeklyPPG,
  postReturnPPG,
}: PerformanceChartProps) {
  if (preInjuryPPG <= 0 || postReturnPPG.length === 0) return null;

  const allValues = [...preInjuryWeeklyPPG, ...postReturnPPG];
  const maxValue = Math.max(preInjuryPPG * 1.2, ...allValues);
  const barHeight = (value: number) =>
    Math.max(2, (value / maxValue) * 40);

  function barColor(value: number): string {
    const pct = value / preInjuryPPG;
    if (pct >= 0.85) return "bg-green-300";
    if (pct >= 0.7) return "bg-amber-300";
    return "bg-red-300";
  }

  return (
    <div className="mt-2">
      <p className="text-xs text-gray-400 mb-1">
        Fantasy PPG: pre-injury → post-return
      </p>
      <div className="flex items-end gap-0.5 h-10">
        {preInjuryWeeklyPPG.map((val, i) => (
          <div
            key={`pre-${i}`}
            className="w-5 bg-gray-300 rounded-t-sm"
            style={{ height: `${barHeight(val)}px` }}
            title={`Pre-injury Wk: ${val}`}
          />
        ))}
        <div className="w-2 flex items-center text-red-500 text-xs font-bold mx-0.5">
          ⚡
        </div>
        {postReturnPPG.slice(0, 4).map((val, i) => (
          <div
            key={`post-${i}`}
            className={`w-5 rounded-t-sm ${barColor(val)}`}
            style={{ height: `${barHeight(val)}px` }}
            title={`Week +${i + 1}: ${val}`}
          />
        ))}
      </div>
    </div>
  );
}
