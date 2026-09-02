type Slice = { label: string; value: number; color: string };

export default function DonutChart({ data, size = 140 }: { data: Slice[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2;
  const strokeWidth = size * 0.22;
  const innerRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * innerRadius;

  let cumulative = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${radius} ${radius})`}>
          {total === 0 ? (
            <circle
              cx={radius}
              cy={radius}
              r={innerRadius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
            />
          ) : (
            data.map((d) => {
              const fraction = d.value / total;
              const dash = fraction * circumference;
              const gap = circumference - dash;
              const offset = -((cumulative / total) * circumference);
              cumulative += d.value;
              if (d.value === 0) return null;
              return (
                <circle
                  key={d.label}
                  cx={radius}
                  cy={radius}
                  r={innerRadius}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={offset}
                />
              );
            })
          )}
        </g>
        <text x={radius} y={radius - 4} textAnchor="middle" fontSize="20" fontWeight={700} fill="#1e293b">
          {total}
        </text>
        <text x={radius} y={radius + 14} textAnchor="middle" fontSize="10" fill="#64748b">
          total
        </text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-slate-600">{d.label}</span>
            <span className="font-semibold text-slate-800">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
