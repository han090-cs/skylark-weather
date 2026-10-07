import { useEffect, useRef, useState } from 'react';
import type { GeoPlace } from '@/types/weather';

interface Props {
  onSelect: (p: GeoPlace) => void;
}

export function SearchBar({ onSelect }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const runSearch = (value: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value)}&count=6&language=en&format=json`
        );
        const json = await res.json();
        setResults((json.results ?? []) as GeoPlace[]);
        setOpen(true);
      } catch { /* ignore */ }
    }, 250);
  };

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-2 rounded-full bg-black/30 px-4 backdrop-blur-md ring-1 ring-white/15 transition focus-within:ring-white/40">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); runSearch(e.target.value); }}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Search a city…"
          className="h-11 w-full bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
          aria-label="Search city"
        />
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl bg-[#14181f]/95 py-1 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
          {results.map((r) => (
            <li key={`${r.id}-${r.latitude}`}>
              <button
                className="flex min-h-[44px] w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm text-white/85 transition hover:bg-white/10"
                onClick={() => { onSelect(r); setOpen(false); setQ(''); setResults([]); }}
              >
                <span className="truncate">{r.name}</span>
                <span className="shrink-0 text-xs text-white/45">
                  {[r.admin1, r.country].filter(Boolean).join(', ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
