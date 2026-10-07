import { useEffect, useRef } from 'react';
import { skyKind } from '@/types/weather';

interface SkyCanvasProps {
  code: number;
  isDay: boolean;
}

type RGB = [number, number, number];

interface Palette {
  zenith: RGB;
  mid: RGB;
  horizon: RGB;
  glow: RGB;
  starAlpha: number;
}

// Palettes derive from an atmospheric sunset model: warm orange-pink horizon,
// cool blue-teal zenith, deep water-dark nights.
const PALETTES: Record<string, { day: Palette; night: Palette }> = {
  clear: {
    day: {
      zenith: [32, 102, 168],
      mid: [95, 165, 212],
      horizon: [252, 205, 160],
      glow: [255, 236, 190],
      starAlpha: 0,
    },
    night: {
      zenith: [4, 14, 34],
      mid: [12, 32, 66],
      horizon: [26, 52, 88],
      glow: [180, 200, 235],
      starAlpha: 1,
    },
  },
  partly: {
    day: {
      zenith: [38, 100, 160],
      mid: [110, 162, 200],
      horizon: [238, 208, 180],
      glow: [255, 232, 195],
      starAlpha: 0,
    },
    night: {
      zenith: [6, 16, 36],
      mid: [16, 36, 68],
      horizon: [34, 58, 92],
      glow: [170, 190, 225],
      starAlpha: 0.7,
    },
  },
  overcast: {
    day: {
      zenith: [88, 104, 120],
      mid: [128, 142, 155],
      horizon: [178, 186, 192],
      glow: [220, 222, 222],
      starAlpha: 0,
    },
    night: {
      zenith: [10, 14, 22],
      mid: [22, 28, 40],
      horizon: [40, 46, 58],
      glow: [120, 130, 150],
      starAlpha: 0,
    },
  },
  fog: {
    day: {
      zenith: [110, 120, 128],
      mid: [150, 158, 164],
      horizon: [192, 196, 198],
      glow: [225, 226, 224],
      starAlpha: 0,
    },
    night: {
      zenith: [12, 14, 18],
      mid: [26, 30, 36],
      horizon: [46, 50, 56],
      glow: [110, 116, 124],
      starAlpha: 0,
    },
  },
  drizzle: {
    day: {
      zenith: [70, 92, 112],
      mid: [112, 132, 148],
      horizon: [168, 180, 186],
      glow: [215, 220, 220],
      starAlpha: 0,
    },
    night: {
      zenith: [8, 12, 20],
      mid: [20, 27, 38],
      horizon: [38, 46, 56],
      glow: [120, 132, 146],
      starAlpha: 0,
    },
  },
  rain: {
    day: {
      zenith: [52, 70, 92],
      mid: [92, 110, 130],
      horizon: [150, 162, 172],
      glow: [205, 212, 214],
      starAlpha: 0,
    },
    night: {
      zenith: [6, 10, 18],
      mid: [16, 22, 34],
      horizon: [32, 40, 52],
      glow: [110, 122, 138],
      starAlpha: 0,
    },
  },
  snow: {
    day: {
      zenith: [96, 114, 136],
      mid: [142, 156, 172],
      horizon: [200, 206, 212],
      glow: [235, 238, 240],
      starAlpha: 0,
    },
    night: {
      zenith: [10, 14, 24],
      mid: [24, 32, 46],
      horizon: [48, 58, 72],
      glow: [140, 152, 168],
      starAlpha: 0,
    },
  },
  thunder: {
    day: {
      zenith: [34, 42, 60],
      mid: [62, 74, 96],
      horizon: [120, 126, 140],
      glow: [190, 196, 206],
      starAlpha: 0,
    },
    night: {
      zenith: [4, 6, 12],
      mid: [12, 16, 28],
      horizon: [26, 32, 46],
      glow: [100, 110, 130],
      starAlpha: 0,
    },
  },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpRGB = (a: RGB, b: RGB, t: number): RGB => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
const css = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

interface Particle {
  x: number; y: number; vx: number; vy: number;
  r: number; a: number; tw: number;
}

export function SkyCanvas({ code, isDay }: SkyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef<Palette>(PALETTES.clear.day);
  const currentRef = useRef<Palette>(PALETTES.clear.day);
  const kindRef = useRef('clear');
  const particlesRef = useRef<Particle[]>([]);
  const isDayRef = useRef(isDay);

  // Update target palette / kind when weather changes
  useEffect(() => {
    isDayRef.current = isDay;
    const kind = skyKind(code);
    kindRef.current = kind;
    targetRef.current = PALETTES[kind][isDay ? 'day' : 'night'];
    // Re-seed particles for the new kind
    particlesRef.current = seedParticles(kind, window.innerWidth, window.innerHeight);
  }, [code, isDay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let last = performance.now();
    let lightning = 0; // 0..1 flash intensity
    let nextBolt = performance.now() + 3000;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      // Ease current palette toward target (smooth condition transitions)
      const cur = currentRef.current;
      const tgt = targetRef.current;
      const k = 1 - Math.pow(0.25, dt); // smooth
      cur.zenith = lerpRGB(cur.zenith, tgt.zenith, k);
      cur.mid = lerpRGB(cur.mid, tgt.mid, k);
      cur.horizon = lerpRGB(cur.horizon, tgt.horizon, k);
      cur.glow = lerpRGB(cur.glow, tgt.glow, k);
      cur.starAlpha = lerp(cur.starAlpha, tgt.starAlpha, k);

      const kind = kindRef.current;

      // --- Sky gradient: zenith → mid → horizon
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, css(cur.zenith));
      g.addColorStop(0.55, css(cur.mid));
      g.addColorStop(1, css(cur.horizon));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // --- Sun / moon glow, slow drift on a low arc
      // On narrow screens push the celestial body toward the edge so it
      // never crowds the temperature display.
      const arcX = w < 640
        ? w * 0.82
        : w * (0.5 + 0.28 * Math.sin(t * 0.01));
      const arcY = h * (isDayRef.current ? (w < 640 ? 0.18 : 0.30) : 0.22) + h * 0.05 * Math.sin(t * 0.017);
      const glowR = Math.max(w, h) * 0.5;
      const rg = ctx.createRadialGradient(arcX, arcY, 0, arcX, arcY, glowR);
      const glowStrength = kind === 'clear' ? 0.55 : kind === 'partly' ? 0.35 : 0.12;
      rg.addColorStop(0, css(cur.glow, glowStrength));
      rg.addColorStop(1, css(cur.glow, 0));
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);

      // Celestial disc
      if (kind === 'clear' || kind === 'partly') {
        ctx.beginPath();
        ctx.arc(arcX, arcY, isDayRef.current ? 34 : 26, 0, Math.PI * 2);
        ctx.fillStyle = isDayRef.current ? 'rgba(255,248,225,0.95)' : 'rgba(235,240,252,0.9)';
        ctx.fill();
      }

      // --- Stars (night)
      if (cur.starAlpha > 0.02) {
        for (const p of particlesRef.current) {
          if (p.r > 2.5) continue; // stars are the small ones
          const tw = 0.5 + 0.5 * Math.sin(t * 1.7 + p.tw);
          ctx.fillStyle = `rgba(255,255,255,${(0.25 + 0.6 * tw) * cur.starAlpha})`;
          ctx.fillRect(p.x, p.y, p.r, p.r);
        }
      }

      // --- Clouds: slow drifting soft blobs
      const cloudiness =
        kind === 'overcast' ? 1 : kind === 'partly' ? 0.55 :
        kind === 'fog' ? 0.9 : (kind === 'rain' || kind === 'snow' || kind === 'drizzle' || kind === 'thunder') ? 0.8 : 0.12;
      if (cloudiness > 0.05) {
        const n = Math.round(5 + cloudiness * 8);
        for (let i = 0; i < n; i++) {
          const seed = i * 137.51;
          const cx = (((t * (6 + (i % 4) * 3) + seed * 7) % (w + 500)) - 250);
          const cy = h * (0.08 + ((i * 0.618) % 0.45));
          const cr = 120 + (i % 5) * 60;
          const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
          const ca = 0.10 * cloudiness * (kind === 'fog' ? 1.6 : 1);
          cg.addColorStop(0, `rgba(255,255,255,${ca})`);
          cg.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = cg;
          ctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
        }
      }

      // --- Precipitation particles
      for (const p of particlesRef.current) {
        if (p.r <= 2.5) continue; // skip stars
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y > h + 20) { p.y = -20; p.x = Math.random() * (w + 200) - 100; }
        if (p.x > w + 20) p.x = -20;
        if (kind === 'snow') {
          const sway = Math.sin(t * 1.2 + p.tw) * 0.6;
          ctx.beginPath();
          ctx.arc(p.x + sway * 10, p.y, p.r - 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${p.a})`;
          ctx.fill();
        } else {
          // rain / drizzle streak
          ctx.strokeStyle = `rgba(210,225,240,${p.a})`;
          ctx.lineWidth = p.r - 2.2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 0.02, p.y + p.vy * 0.02);
          ctx.stroke();
        }
      }

      // --- Fog bands
      if (kind === 'fog') {
        for (let i = 0; i < 4; i++) {
          const fy = h * (0.3 + i * 0.2) + Math.sin(t * 0.12 + i * 2) * 18;
          const fg = ctx.createLinearGradient(0, fy - 60, 0, fy + 60);
          fg.addColorStop(0, 'rgba(230,234,238,0)');
          fg.addColorStop(0.5, 'rgba(230,234,238,0.13)');
          fg.addColorStop(1, 'rgba(230,234,238,0)');
          ctx.fillStyle = fg;
          ctx.fillRect(0, fy - 60, w, 120);
        }
      }

      // --- Lightning
      if (kind === 'thunder') {
        if (now > nextBolt) {
          lightning = 1;
          nextBolt = now + 2500 + Math.random() * 6000;
        }
        if (lightning > 0.01) {
          ctx.fillStyle = `rgba(235,240,255,${lightning * 0.35})`;
          ctx.fillRect(0, 0, w, h);
          lightning *= Math.pow(0.02, dt);
        }
      }

      // Horizon vignette to ground the scene
      const vg = ctx.createLinearGradient(0, h * 0.6, 0, h);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.28)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 h-full w-full"
      aria-hidden="true"
    />
  );
}

function seedParticles(kind: string, w: number, h: number): Particle[] {
  const out: Particle[] = [];
  // stars always seeded (small r) — alpha handled at draw time
  for (let i = 0; i < 90; i++) {
    out.push({
      x: Math.random() * w, y: Math.random() * h * 0.7,
      vx: 0, vy: 0, r: 1 + Math.random() * 1.4,
      a: 1, tw: Math.random() * Math.PI * 2,
    });
  }
  if (kind === 'rain' || kind === 'drizzle' || kind === 'thunder') {
    const n = kind === 'drizzle' ? 60 : kind === 'thunder' ? 200 : 140;
    const speed = kind === 'drizzle' ? 300 : 620;
    for (let i = 0; i < n; i++) {
      out.push({
        x: Math.random() * (w + 200) - 100, y: Math.random() * h,
        vx: -60, vy: speed + Math.random() * 200,
        r: 2.6 + Math.random() * 1.2, a: 0.25 + Math.random() * 0.3,
        tw: 0,
      });
    }
  }
  if (kind === 'snow') {
    for (let i = 0; i < 110; i++) {
      out.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: 12 + Math.random() * 20, vy: 40 + Math.random() * 55,
        r: 3.2 + Math.random() * 3.2, a: 0.5 + Math.random() * 0.4,
        tw: Math.random() * Math.PI * 2,
      });
    }
  }
  return out;
}
