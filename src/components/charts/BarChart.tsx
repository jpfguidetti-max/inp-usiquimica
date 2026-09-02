type Bar = { label: string; value: number; color?: string };

const DEFAULT_COLOR = "#1f6f5c";

export default function BarChart({
  data,
  height = 160,
  horizontal = false,
}: {
  data: Bar[];
  height?: number;
  horizontal?: boolean;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  if (horizontal) {
    return (
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-3">
            <div className="w-32 shrink-0 text-xs text-slate-600 truncate" title={d.label}>
              {d.label}
            </div>
            <div className="flex-1 bg-slate-100 rounded h-4 overflow-hidden">
              <div
                className="h-4 rounded"
                style={{
                  width: `${(d.value / max) * 100}%`,
                  backgroundColor: d.color ?? DEFAULT_COLOR,
                }}
              />
            </div>
            <div className="w-8 text-right text-xs font-medium text-slate-700">{d.value}</div>
          </div>
        ))}
        {data.length === 0 && <div className="text-sm text-slate-400">Sem dados.</div>}
      </div>
    );
  }

  const barWidth = 36;
  const gap = 20;
  const width = Math.max(120, data.length * (barWidth + gap));
  const chartHeight = height - 28;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMinYMid meet">
      {data.map((d, i) => {
        const x = i * (barWidth + gap) + gap / 2;
        const barHeight = (d.value / max) * chartHeight;
        const y = chartHeight - barHeight;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, d.value > 0 ? 2 : 0)}
              rx={4}
              fill={d.color ?? DEFAULT_COLOR}
            />
            <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="11" fill="#334155" fontWeight={600}>
              {d.value}
            </text>
            <text
              x={x + barWidth / 2}
              y={chartHeight + 16}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
            >
              {d.label}
            </text>
          </g>
        );
      })}
      {data.length === 0 && (
        <text x={width / 2} y={height / 2} textAnchor="middle" fontSize="12" fill="#94a3b8">
          Sem dados.
        </text>
      )}
    </svg>
  );
}
