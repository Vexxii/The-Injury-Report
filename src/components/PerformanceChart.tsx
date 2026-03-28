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
    if (pct >= 0.85) return "bg-green opacity-70";
    if (pct >= 0.7) return "bg-amber opacity-70";
    return "bg-red opacity-70";
  }

  return (
    <div className="mt-2">
      <p className="font-mono text-[9px] text-text-muted mb-1">
        pre-injury &rarr; post-return PPG
      </p>
      <div className="flex items-end gap-0.5 h-10">
        {preInjuryWeeklyPPG.map((val, i) => (
          <div
            key={`pre-${i}`}
            className="w-[18px] rounded-t-sm"
            style={{ height: `${barHeight(val)}px`, background: '#404048' }}
            title={`Pre-injury Wk: ${val}`}
          />
        ))}
        <div
          className="w-0.5 mx-0.5 opacity-50"
          style={{ height: '100%', background: 'var(--accent)' }}
        />
        {postReturnPPG.slice(0, 4).map((val, i) => (
          <div
            key={`post-${i}`}
            className={`w-[18px] rounded-t-sm ${barColor(val)}`}
            style={{ height: `${barHeight(val)}px` }}
            title={`Week +${i + 1}: ${val}`}
          />
        ))}
      </div>
    </div>
  );
}
