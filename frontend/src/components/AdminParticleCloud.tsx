import { useEffect, useRef } from 'react';

const CHARS = ['0', '1', '0', '1', '0', '0', '1', '·'];

type Pt = {
  ox: number;
  oy: number;
  oz: number;
  ox0: number;
  oy0: number;
  oz0: number;
  char: string;
  size: number;
  bright: number;
  dvx: number;
  dvy: number;
  dvz: number;
  charTimer: number;
  charEvery: number;
};

function buildParticles(totalCore: number, totalLoose: number): Pt[] {
  const pts: Pt[] = [];

  for (let i = 0; i < totalCore; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const lobe = Math.cos(theta) > 0 ? 1 : -1;
    const lobeShift = lobe * 26;
    const baseR = 140 + Math.random() * 55;
    const p: Pt = {
      ox: Math.sin(phi) * Math.cos(theta) * baseR + lobeShift,
      oy: Math.cos(phi) * (baseR * 0.72),
      oz: Math.sin(phi) * Math.sin(theta) * (baseR * 0.58),
      ox0: 0,
      oy0: 0,
      oz0: 0,
      char: CHARS[Math.floor(Math.random() * CHARS.length)]!,
      size: 5 + Math.floor(Math.random() * 8),
      bright: 0.12 + Math.random() * 0.72,
      dvx: (Math.random() - 0.5) * 0.008,
      dvy: (Math.random() - 0.5) * 0.008,
      dvz: (Math.random() - 0.5) * 0.008,
      charTimer: Math.random() * 40,
      charEvery: 22 + Math.floor(Math.random() * 76),
    };
    p.ox0 = p.ox;
    p.oy0 = p.oy;
    p.oz0 = p.oz;
    pts.push(p);
  }

  for (let i = 0; i < totalLoose; i++) {
    const spread = 300 + Math.random() * 150;
    const p: Pt = {
      ox: (Math.random() - 0.5) * spread * 2,
      oy: (Math.random() - 0.5) * spread,
      oz: (Math.random() - 0.5) * spread,
      ox0: 0,
      oy0: 0,
      oz0: 0,
      char: CHARS[Math.floor(Math.random() * CHARS.length)]!,
      size: 4 + Math.floor(Math.random() * 6),
      bright: 0.05 + Math.random() * 0.18,
      dvx: (Math.random() - 0.5) * 0.014,
      dvy: (Math.random() - 0.5) * 0.014,
      dvz: (Math.random() - 0.5) * 0.014,
      charTimer: 0,
      charEvery: 38 + Math.floor(Math.random() * 62),
    };
    p.ox0 = p.ox;
    p.oy0 = p.oy;
    p.oz0 = p.oz;
    pts.push(p);
  }
  return pts;
}

/** Как modus_brain_particle_cloud: 3D-облако из 0/1, цвета под тёмную админку job.kz */
export default function AdminParticleCloud({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true } as never);
    if (!ctx) return;

    const reduced =
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);

    let W = 1;
    let H = 1;
    const pts = buildParticles(980, 100);

    let rotY = 0;
    let rotX = 0.16;
    let velY = 0.00135;
    let velX = 0;
    let tFrame = 0;
    let rafId = 0;
    let lastNow = performance.now();

    const FOV = 520;

    function project(x: number, y: number, z: number) {
      const s = FOV / (FOV + z + 300);
      return { x: W / 2 + x * s, y: H / 2 + y * s, s };
    }

    function paintStaticBackdrop() {
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#0a1838');
      bg.addColorStop(1, '#060f24');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
    }

    function drawReducedOnce() {
      paintStaticBackdrop();
      const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.12, W / 2, H / 2, H * 0.72);
      vignette.addColorStop(0, 'rgba(15,37,87,0)');
      vignette.addColorStop(1, 'rgba(6,12,26,0.94)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);
    }

    function syncSize() {
      const c = canvasRef.current;
      if (!c) return;
      const host = c.parentElement ?? c;
      const rw = Math.max(1, Math.floor(host.clientWidth || window.innerWidth));
      const rh = Math.max(1, Math.floor(host.clientHeight || window.innerHeight));
      W = rw;
      H = rh;
      if (c.width !== rw || c.height !== rh) {
        c.width = rw;
        c.height = rh;
      }
    }

    function onResizeHost() {
      syncSize();
      if (reduced) drawReducedOnce();
    }

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            onResizeHost();
          })
        : null;
    const observeTarget = canvas.parentElement ?? canvas;
    ro?.observe(observeTarget);
    window.addEventListener('resize', onResizeHost);
    onResizeHost();

    function loop() {
      rafId = requestAnimationFrame(loop);
      if (document.visibilityState === 'hidden') {
        lastNow = performance.now();
        return;
      }

      syncSize();
      tFrame++;

      const now = performance.now();
      const dt = Math.min(48, Math.max(0, now - lastNow));
      lastNow = now;
      const dtNorm = dt / (1000 / 60);

      velY += (0.00135 - velY) * 0.03 * dtNorm;
      velX += -velX * 0.05 * dtNorm;
      rotY += velY * (dtNorm * 1.08);
      rotX += velX * (dtNorm * 1.08);
      rotX = Math.max(-0.55, Math.min(0.55, rotX));

      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#0c1d44');
      bg.addColorStop(0.55, '#0a1838');
      bg.addColorStop(1, '#060f26');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const sorted: Array<{ proj: { x: number; y: number; s: number }; p: Pt; rz: number }> = [];
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      for (const p of pts) {
        const time = tFrame * 1.06;
        p.ox = p.ox0 + Math.sin(time * 0.007 + p.oy0 * 0.01) * p.dvx * 80;
        p.oy = p.oy0 + Math.cos(time * 0.009 + p.ox0 * 0.01) * p.dvy * 50;
        p.oz = p.oz0 + Math.sin(time * 0.006 + p.oz0 * 0.01) * p.dvz * 60;

        const rx = p.ox * cosY + p.oz * sinY;
        const rz1 = -p.ox * sinY + p.oz * cosY;
        const ry = p.oy * cosX - rz1 * sinX;
        const rz = p.oy * sinX + rz1 * cosX;

        const proj = project(rx, ry, rz);
        sorted.push({ proj, p, rz });
      }

      sorted.sort((a, b) => a.rz - b.rz);

      for (const { proj, p, rz } of sorted) {
        if (proj.s < 0.05) continue;
        p.charTimer++;
        if (p.charTimer > p.charEvery) {
          p.char = CHARS[Math.floor(Math.random() * CHARS.length)]!;
          p.charTimer = 0;
        }

        const depth = (rz + 400) / 800;
        const depthClamped = Math.max(0, Math.min(1, depth));
        const alpha = p.bright * depthClamped;
        if (alpha < 0.035) continue;

        const fontSize = Math.max(4, Math.round(p.size * proj.s * 1.72));

        if (alpha > 0.52 && depthClamped > 0.62) {
          ctx.shadowColor = 'rgba(148,187,255,0.45)';
          ctx.shadowBlur = 3;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = Math.min(1, alpha);
        ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace`;
        ctx.fillStyle = 'rgba(210,226,255,0.95)';
        ctx.fillText(p.char, proj.x, proj.y);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.08, W / 2, H / 2, H * 0.76);
      vig.addColorStop(0, 'rgba(6,14,34,0)');
      vig.addColorStop(0.65, 'rgba(8,20,52,0.28)');
      vig.addColorStop(1, 'rgba(8,26,74,0.88)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      const cg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.42);
      cg.addColorStop(0, 'rgba(94,154,255,0.035)');
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, W, H);
    }

    if (reduced) {
      drawReducedOnce();
    } else {
      lastNow = performance.now();
      loop();
    }

    return () => {
      cancelAnimationFrame(rafId);
      ro?.disconnect();
      window.removeEventListener('resize', onResizeHost);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-0 h-full min-h-[100dvh] w-full block ${className}`}
    />
  );
}
