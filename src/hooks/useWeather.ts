import { useCallback, useEffect, useRef, useState } from 'react';
import type { GeoPlace, WeatherBundle } from '@/types/weather';

export type LocationSource = 'device' | 'network' | 'search' | 'default';

const DEFAULT_PLACE: GeoPlace = {
  id: 1, name: 'Yangon', latitude: 16.8409, longitude: 96.1735, country: 'Myanmar',
};

async function reverseGeocode(latitude: number, longitude: number): Promise<Partial<GeoPlace>> {
  try {
    const r = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    const j = await r.json();
    return {
      name: j.city || j.locality || 'Your location',
      admin1: j.principalSubdivision || undefined,
      country: j.countryName || undefined,
    };
  } catch {
    return { name: 'Your location' };
  }
}

// Approximate location from the network (used only if the device location is unavailable).
async function ipLocation(): Promise<GeoPlace | null> {
  try {
    const r = await fetch('https://ipwho.is/');
    const j = await r.json();
    if (!j.success) return null;
    return {
      id: 2, name: j.city || 'Your area', admin1: j.region,
      country: j.country, latitude: j.latitude, longitude: j.longitude,
    };
  } catch {
    return null;
  }
}

export function useWeather() {
  const [data, setData] = useState<WeatherBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [placeName, setPlaceName] = useState('');
  const [source, setSource] = useState<LocationSource>('default');
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (place: GeoPlace, src: LocationSource = 'search') => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        current:
          'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure',
        hourly: 'temperature_2m,weather_code,precipitation_probability',
        daily:
          'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max',
        timezone: 'auto',
        forecast_days: '7',
      });
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`Forecast request failed (${res.status})`);
      const json = await res.json();
      setData({
        place,
        current: json.current,
        hourly: json.hourly,
        daily: json.daily,
        timezone: json.timezone,
        fetchedAt: Date.now(),
      });
      setPlaceName([place.name, place.admin1, place.country].filter(Boolean).join(', '));
      setSource(src);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError('Could not load weather data. Check your connection and try again.');
      }
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  }, []);

  // Detect the user's location: device GPS first, then network, then a default city.
  const locate = useCallback(async () => {
    const fallback = async () => {
      const ip = await ipLocation();
      if (ip) load(ip, 'network');
      else load(DEFAULT_PLACE, 'default');
    };
    if (!('geolocation' in navigator)) {
      await fallback();
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const info = await reverseGeocode(latitude, longitude);
        load({ id: 0, name: 'Your location', latitude, longitude, ...info }, 'device');
      },
      () => { void fallback(); },
      { timeout: 8000, maximumAge: 600000 }
    );
  }, [load]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void locate();
  }, [locate]);

  return { data, loading, error, placeName, source, load, locate };
}
