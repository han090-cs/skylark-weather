import type { DailyWeather } from '@/types/weather';
import { WeatherIcon } from './WeatherIcon';

interface Props {
  daily: DailyWeather;
  timezone: string;
  unit: 'C' | 'F';
}

const toF = (c: number) => (c * 9) / 5 + 32;

export function DailyList({ daily, timezone, unit }: Props) {
  const t = (c: number) => Math.round(unit === 'F' ? toF(c) : c);
  const allMin = Math.min(...daily.temperature_2m_min);
  const allMax = Math.max(...daily.temperature_2m_max);
  const range = Math.max(allMax - allMin, 1);

  return (
    <ul className="divide-y divide-white/8">
      {daily.time.map((d, i) => {
        const date = new Date(d);
        const label =
          i === 0
            ? 'Today'
            : date.toLocaleDateString('en-US', { weekday: 'short', timeZone: timezone });
        const lo = daily.temperature_2m_min[i];
        const hi = daily.temperature_2m_max[i];
        const left = ((lo - allMin) / range) * 100;
        const width = Math.max(((hi - lo) / range) * 100, 4);
        const precip = daily.precipitation_probability_max?.[i] ?? 0;
        return (
          <li key={d} className="flex items-center gap-3 py-2.5">
            <span className="w-14 shrink-0 text-sm text-white/85">{label}</span>
            <span className="flex w-10 shrink-0 items-center justify-center text-white/80">
              <WeatherIcon code={daily.weather_code[i]} size={20} />
            </span>
            <span className={`w-9 shrink-0 text-[11px] tabular-nums ${precip >= 20 ? 'text-[#7dd8ff]' : 'text-white/25'}`}>
              {precip >= 20 ? `${precip}%` : ''}
            </span>
            <span className="w-8 shrink-0 text-right text-sm tabular-nums text-white/50">{t(lo)}°</span>
            <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <span
                className="absolute h-full rounded-full"
                style={{
                  left: `${left}%`, width: `${width}%`,
                  background: 'linear-gradient(90deg,#2cc9ff,#ffc46b)',
                }}
              />
            </span>
            <span className="w-8 shrink-0 text-right text-sm tabular-nums text-white">{t(hi)}°</span>
          </li>
        );
      })}
    </ul>
  );
}
