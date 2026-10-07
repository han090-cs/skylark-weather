import { useMemo } from 'react';

interface Props {
  times: string[];
  temps: number[];
  precip: number[];
  timezone: string;
  unit: 'C' | 'F';
}

const toF = (c: number) => (c * 9) / 5 + 32;

export function HourlyChart({ times, temps, precip, timezone, unit }: Props) {
  // next 24 hours starting from current hour in location timezone
  const slice = useMemo(() => {
    const nowInTz = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
    let start = 0;
    for (let i = 0; i < times.length; i++) {
      if (new Date(times[i]) <= nowInTz) start = i;
      else break;
    }
    const idx = Array.from({ length: Math.min(24, times.length - start) }, (_, i) => start + i);
    return idx;
  }, [times, timezone]);

  const vals = slice.map((i) => (unit === 'F' ? toF(temps[i]) : temps[i]));
  const W = 720, H = 150, PAD = 18;
  const min = Math.min(...vals) - 1, max = Math.max(...vals) + 1;
  const x = (j: number) => PAD + (j / (slice.length - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - min) / (max - min)) * (H - PAD * 2 - 14);

  const pts = vals.map((v, j) => [x(j), y(v)] as const);
  const path = pts.map((p, j) => (j === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${path} L${x(slice.length - 1)},${H} L${x(0)},${H} Z`;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, timeZone: timezone });

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-36 w-full" role="img" aria-label="24-hour temperature chart">
        <defs>
          <linearGradient id="tgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2cc9ff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2cc9ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* precip probability bars */}
        {slice.map((i, j) => {
          const p = (precip[i] ?? 0) / 100;
          if (p < 0.05) return null;
          return (
            <rect key={j} x={x(j) - 3} y={H - PAD - p * 40} width="6" height={p * 40}
              rx="2" fill="#2cc9ff" opacity="0.28" />
          );
        })}
        <path d={area} fill="url(#tgrad)" />
        <path d={path} fill="none" stroke="#7dd8ff" strokeWidth="1.8" strokeLinejoin="round" />
        {pts.map((p, j) =>
          j % 3 === 0 ? (
            <g key={j}>
              <circle cx={p[0]} cy={p[1]} r="2.6" fill="#0b1220" stroke="#7dd8ff" strokeWidth="1.6" />
              <text x={p[0]} y={p[1] - 8} textAnchor="middle" fontSize="10.5" fill="rgba(255,255,255,0.85)">
                {Math.round(vals[j])}°
              </text>
              <text x={p[0]} y={H - 4} textAnchor="middle" fontSize="9.5" fill="rgba(255,255,255,0.45)">
                {fmt(times[slice[j]])}
              </text>
            </g>
          ) : null
        )}
      </svg>
      <div className="mt-1 flex justify-end">
        <span className="text-[10px] uppercase tracking-widest text-white/35">bars · precip probability</span>
      </div>
    </div>
  );
}
