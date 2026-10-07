import { useState } from 'react';
import { useWeather } from '@/hooks/useWeather';
import { SkyCanvas } from '@/sections/SkyCanvas';
import { SearchBar } from '@/sections/SearchBar';
import { WeatherIcon } from '@/sections/WeatherIcon';
import { HourlyChart } from '@/sections/HourlyChart';
import { DailyList } from '@/sections/DailyList';
import { codeLabel } from '@/types/weather';

const SOURCE_TAG: Record<string, string> = {
  device: 'Live location',
  network: 'Approx. location',
  default: 'Default city',
};

const toF = (c: number) => (c * 9) / 5 + 32;

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">{label}</div>
      <div className="mt-0.5 truncate text-sm font-medium text-white/90 tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-white/45">{sub}</div>}
    </div>
  );
}

export default function App() {
  const { data, loading, error, placeName, source, load, locate } = useWeather();
  const [unit, setUnit] = useState<'C' | 'F'>('C');

  const t = (c: number) => Math.round(unit === 'F' ? toF(c) : c);
  const wind = (kmh: number) =>
    unit === 'F' ? `${Math.round(kmh * 0.6214)} mph` : `${Math.round(kmh)} km/h`;

  const compass = (deg: number) =>
    ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];

  return (
    <div className="relative min-h-svh font-sans text-white">
      {data && <SkyCanvas code={data.current.weather_code} isDay={data.current.is_day === 1} />}
      {!data && <div className="fixed inset-0 -z-10 bg-[#0a1626]" />}

      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 pt-6 sm:flex-row sm:items-center sm:justify-between sm:pt-8">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold tracking-[0.28em] text-white/70">SKYLARK</span>
          <button
            onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
            className="min-h-[44px] rounded-full bg-black/30 px-4 text-xs font-medium tracking-widest text-white/80 ring-1 ring-white/15 backdrop-blur-md transition hover:ring-white/40 sm:hidden"
          >
            °{unit}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar onSelect={(p) => load(p, 'search')} />
          <button
            onClick={locate}
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full bg-black/30 text-white/80 ring-1 ring-white/15 backdrop-blur-md transition hover:ring-white/40"
            aria-label="Use my location"
            title="Use my location"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
          </button>
          <button
            onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
            className="hidden min-h-[44px] shrink-0 rounded-full bg-black/30 px-4 text-xs font-medium tracking-widest text-white/80 ring-1 ring-white/15 backdrop-blur-md transition hover:ring-white/40 sm:block"
            aria-label="Toggle temperature unit"
          >
            °{unit}
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto w-full max-w-6xl px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        {loading && !data && (
          <div className="flex h-[50vh] items-center justify-center">
            <div className="flex items-center gap-2 text-white/60">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 animate-bounce rounded-full bg-white/60"
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-10 rounded-2xl bg-black/40 p-6 text-sm text-white/80 ring-1 ring-white/10 backdrop-blur-md">
            {error}
          </div>
        )}

        {data && (
          <>
            <section className="mt-10 flex flex-col gap-2 sm:mt-16">
              <div className="flex items-center gap-2 text-white/70">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-sm tracking-wide">{placeName}</span>
                {SOURCE_TAG[source] && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest text-white/60 ring-1 ring-white/20">
                    {SOURCE_TAG[source]}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
                <span className="text-[clamp(6rem,18vw,11rem)] font-light leading-none tabular-nums tracking-tight">
                  {t(data.current.temperature_2m)}°
                </span>
                <div className="mb-4 flex flex-col gap-1.5">
                  <span className="flex items-center gap-2 text-lg text-white/90">
                    <WeatherIcon code={data.current.weather_code} isDay={data.current.is_day === 1} size={22} />
                    {codeLabel(data.current.weather_code)}
                  </span>
                  <span className="text-sm text-white/55 tabular-nums">
                    H {t(data.daily.temperature_2m_max[0])}° · L {t(data.daily.temperature_2m_min[0])}°
                    {' · '}Feels like {t(data.current.apparent_temperature)}°
                  </span>
                </div>
              </div>
              <span className="text-xs text-white/35">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric', timeZone: data.timezone,
                })}
                {' — '}
                {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: data.timezone })} local
              </span>
            </section>

            {/* Stats strip */}
            <section className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 rounded-3xl bg-[#10151d]/60 p-5 ring-1 ring-white/10 backdrop-blur-xl sm:grid-cols-4 sm:p-6">
              <Stat label="Wind" value={wind(data.current.wind_speed_10m)} sub={compass(data.current.wind_direction_10m)} />
              <Stat label="Humidity" value={`${data.current.relative_humidity_2m}%`} />
              <Stat label="Pressure" value={`${Math.round(data.current.surface_pressure)} hPa`} />
              <Stat
                label="Sun"
                value={new Date(data.daily.sunrise[0]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: data.timezone })}
                sub={`↑ · ↓ ${new Date(data.daily.sunset[0]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: data.timezone })}`}
              />
            </section>

            {/* Forecast panels */}
            <section className="mt-6 grid gap-6 lg:grid-cols-12">
              <div className="rounded-3xl bg-[#10151d]/60 p-5 ring-1 ring-white/10 backdrop-blur-xl sm:p-6 lg:col-span-7">
                <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">
                  Next 24 hours
                </h2>
                <HourlyChart
                  times={data.hourly.time}
                  temps={data.hourly.temperature_2m}
                  precip={data.hourly.precipitation_probability}
                  timezone={data.timezone}
                  unit={unit}
                />
              </div>
              <div className="rounded-3xl bg-[#10151d]/60 p-5 ring-1 ring-white/10 backdrop-blur-xl sm:p-6 lg:col-span-5">
                <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">
                  7-day outlook
                </h2>
                <DailyList daily={data.daily} timezone={data.timezone} unit={unit} />
              </div>
            </section>

            <footer className="mt-10 flex items-center justify-between text-[11px] text-white/30">
              <span>
                Weather data · Open-Meteo{' · '}
                <a href="https://github.com/han090-cs/skylark-weather" target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-white/70 hover:underline">
                  github.com/han090-cs
                </a>
              </span>
              <span>Updated {new Date(data.fetchedAt).toLocaleTimeString()}</span>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
