import { skyKind } from '@/types/weather';

// Hand-drawn inline SVG icons, stroke-based, monochrome white.
export function WeatherIcon({ code, isDay = true, size = 24 }: { code: number; isDay?: boolean; size?: number }) {
  const kind = skyKind(code);
  const s = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  const cloud = <path d="M17.5 17H7a4 4 0 1 1 .6-7.96A5.5 5.5 0 0 1 18.3 10.6 3.4 3.4 0 0 1 17.5 17Z" />;
  switch (kind) {
    case 'clear':
      return isDay ? (
        <svg {...s}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      ) : (
        <svg {...s}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></svg>
      );
    case 'partly':
      return (
        <svg {...s}>
          {isDay && <><circle cx="9" cy="8" r="3" /><path d="M9 2.5V4M3.5 8H5M5.6 4.6l1 1" /></>}
          {cloud}
        </svg>
      );
    case 'overcast':
      return <svg {...s}>{cloud}<path d="M8 20.5h9" opacity="0.5" /></svg>;
    case 'fog':
      return <svg {...s}>{cloud}<path d="M5 20.5h14M8 23h8" opacity="0.7" /></svg>;
    case 'drizzle':
      return <svg {...s}>{cloud}<path d="M9 20v1M13 20v1" /></svg>;
    case 'rain':
      return <svg {...s}>{cloud}<path d="M8.5 20l-1 2M12.5 20l-1 2M16.5 20l-1 2" /></svg>;
    case 'snow':
      return <svg {...s}>{cloud}<path d="M9 20.5h.01M12.5 22h.01M16 20.5h.01" strokeWidth="2.4" /></svg>;
    case 'thunder':
      return <svg {...s}>{cloud}<path d="M12.5 17 10 21h3l-1.5 3" fill="currentColor" stroke="none" /></svg>;
  }
}
