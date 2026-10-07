# Skylark

**Minimalist weather.** A live animated sky, current conditions, a 24-hour chart and a 7-day outlook — for your location or any city in the world. No account, no API keys.

**Live demo:** https://han090-cs.github.io/skylark-weather/

## Features

- Auto-detects your location (device GPS → approximate network location → Yangon fallback)
- One-tap "use my location" button
- Search any city worldwide
- Sky that changes with the weather and time of day
- Temperature + rain-probability chart for the next 24 hours
- 7-day forecast
- °C / °F toggle
- Responsive: phone, tablet, desktop

## Tech

React 19 · TypeScript · Vite · Tailwind CSS · Recharts

## Data sources

- Weather + city search: [Open-Meteo](https://open-meteo.com/)
- Place name for your coordinates: [BigDataCloud](https://www.bigdatacloud.com/) (client-side reverse geocoding)
- Approximate location fallback: [ipwho.is](https://ipwho.is/)

Your device location is only used in your browser to request a forecast; this app has no backend and stores nothing.

## Run locally

Requires Node.js 20+.

```bash
git clone https://github.com/han090-cs/skylark-weather.git
cd skylark-weather
npm ci
npm run dev
```

Production check and build:

```bash
npm run check
```

## Deploy to GitHub Pages

1. Create a repo named `skylark-weather` under `han090-cs` and push this code to `main`.
2. Go to **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The included workflow builds and publishes automatically on every push.

Site URL: `https://han090-cs.github.io/skylark-weather/`

> Browsers only allow location access on HTTPS (GitHub Pages is HTTPS) or `localhost`.

## License

MIT © han090-cs
