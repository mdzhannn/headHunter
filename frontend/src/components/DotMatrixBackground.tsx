import { useEffect, useMemo, useRef } from 'react';

export type DotMatrixColorPreset = 'green' | 'teal' | 'white';

export type DotMatrixBackgroundProps = {
  color?: DotMatrixColorPreset | string;
  rgb?: string;
  spacing?: number;
  mouseRadius?: number;
  /** Верхний предел точек (~как у лёгких прод-сайтов). При необходимости шаг сетки увеличивается. */
  maxDots?: number;
};

const RGB_BY_PRESET: Record<DotMatrixColorPreset, string> = {
  green: '0,180,80',
  teal: '0,200,190',
  white: '200,200,200',
};

const DEFAULT_MAX_DOTS = 2200;

function resolveRgb(rgb: string | undefined, color: DotMatrixColorPreset | string | undefined): string {
  if (rgb && /^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*$/.test(rgb)) {
    return rgb.replace(/\s/g, '');
  }
  const c = color ?? 'green';
  if (c === 'green' || c === 'teal' || c === 'white') {
    return RGB_BY_PRESET[c];
  }
  if (/^\d+\s*,\s*\d+\s*,\s*\d+$/.test(c)) {
    return c.replace(/\s/g, '');
  }
  return RGB_BY_PRESET.green;
}

/** Парсит "r,g,b" в три числа — один раз на кадр, не на точку */
function rgbTriplet(rgb: string): [number, number, number] {
  const p = rgb.split(',').map((s) => Number(s.trim()));
  return [p[0] ?? 0, p[1] ?? 180, p[2] ?? 80];
}

export default function DotMatrixBackground({
  color = 'green',
  rgb,
  spacing: spacingProp = 22,
  mouseRadius = 90,
  maxDots = DEFAULT_MAX_DOTS,
}: DotMatrixBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const rgbResolved = useMemo(() => resolveRgb(rgb, color), [rgb, color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
    } as never);
    if (!ctx) return;

    let animId = 0;
    /** Логические координаты (совпадают с css-размером контейнера) */
    const mouse = { x: -999, y: -999 };

    /** col/row — для волновой фазы «как ветер» по сетке */
    let dots: { x: number; y: number; col: number; row: number; micro: number; baseAlpha: number; r: number }[] =
      [];

    const spacingMobile = () =>
      typeof window !== 'undefined' && window.innerWidth < 768
        ? Math.round((spacingProp * 30) / 22)
        : spacingProp;

    /** Увеличиваем шаг, если точек слишком много (высокие экраны / мелкий шаг) */
    const buildDots = (cw: number, ch: number) => {
      dots = [];
      let step = spacingMobile();
      let cols = Math.ceil(cw / step) + 1;
      let rows = Math.ceil(ch / step) + 1;
      while (cols * rows > maxDots && step < 80) {
        step += 2;
        cols = Math.ceil(cw / step) + 1;
        rows = Math.ceil(ch / step) + 1;
      }
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          dots.push({
            x: col * step,
            y: row * step,
            col,
            row,
            micro: Math.random() * Math.PI * 2,
            baseAlpha: 0.14 + Math.random() * 0.22,
            r: 0.9 + Math.random() * 0.85,
          });
        }
      }
    };

    /** Внутреннее разрешение canvas ниже на Retina — меньше пикселей, визуально для точек ок */
    const renderScale = () => {
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      return dpr > 1.25 ? 0.65 : 1;
    };

    let logicalW = 1;
    let logicalH = 1;

    const resize = () => {
      logicalW = Math.max(1, canvas.offsetWidth);
      logicalH = Math.max(1, canvas.offsetHeight);
      const scaleFactor = renderScale();
      const bw = Math.max(1, Math.floor(logicalW * scaleFactor));
      const bh = Math.max(1, Math.floor(logicalH * scaleFactor));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      buildDots(logicalW, logicalH);
    };

    let pendingMouse: { x: number; y: number } | null = null;
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        pendingMouse = { x: -999, y: -999 };
      } else {
        pendingMouse = { x, y };
      }
    };

    const onWindowLeave = () => {
      pendingMouse = { x: -999, y: -999 };
    };

    let resizeObserver: ResizeObserver | undefined;

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('blur', onWindowLeave);

    const reducedMotion =
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);

    const [rCol, gCol, bCol] = rgbTriplet(rgbResolved);
    const mr = mouseRadius > 1 ? mouseRadius : 90;
    const mrSq = mr * mr;

    /** Время в радианах, шаг из dt — одинаково плавно на 60 и 120 Гц */
    let windT = 0;
    let lastFrameTime = performance.now();

    const drawOnceStatic = () => {
      pendingMouse && Object.assign(mouse, pendingMouse);
      pendingMouse = null;
      ctx.setTransform(canvas.width / logicalW, 0, 0, canvas.height / logicalH, 0, 0);
      ctx.clearRect(0, 0, logicalW, logicalH);
      for (const d of dots) {
        const alpha = Math.max(0.03, Math.min(1, d.baseAlpha));
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rCol},${gCol},${bCol},${alpha})`;
        ctx.fill();
      }
    };

    const draw = () => {
      if (document.visibilityState === 'hidden') {
        lastFrameTime = performance.now();
        animId = requestAnimationFrame(draw);
        return;
      }

      if (pendingMouse) {
        Object.assign(mouse, pendingMouse);
        pendingMouse = null;
      }

      ctx.setTransform(canvas.width / logicalW, 0, 0, canvas.height / logicalH, 0, 0);
      ctx.clearRect(0, 0, logicalW, logicalH);

      const now = performance.now();
      const dtMs = Math.min(48, Math.max(0, now - lastFrameTime));
      lastFrameTime = now;
      if (!reducedMotion) {
        windT += (dtMs / 1000) * 1.05;
      }

      for (const d of dots) {
        let pulse = 0;
        if (!reducedMotion) {
          const c = d.col;
          const r0 = d.row;
          const w1 =
            Math.sin(windT * 0.95 + c * 0.42 + r0 * 0.24 + d.micro * 0.12);
          const w2 =
            Math.sin(windT * 0.58 - c * 0.18 + r0 * 0.38 + Math.sin(windT * 0.15 + d.micro) * 0.35) *
            0.42;
          const w3 =
            Math.sin(windT * 1.32 + (c + r0) * 0.11 + d.micro) * 0.12;
          pulse = w1 * 0.62 + w2 + w3;
        }
        let alpha = d.baseAlpha + pulse * 0.2;
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const distSq = dx * dx + dy * dy;
        if (distSq <= mrSq) {
          alpha += (1 - Math.sqrt(distSq) / mr) * 0.7;
        }
        if (alpha < 0.03) alpha = 0.03;
        else if (alpha > 1) alpha = 1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rCol},${gCol},${bCol},${alpha})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };

    const runResize = () => {
      resize();
      if (reducedMotion) {
        drawOnceStatic();
      }
    };

    if (typeof ResizeObserver !== 'undefined') {
      const el = canvas.parentElement;
      if (el) {
        resizeObserver = new ResizeObserver(() => runResize());
        resizeObserver.observe(el);
      }
    }

    runResize();
    requestAnimationFrame(runResize);

    if (reducedMotion) {
      drawOnceStatic();
    } else {
      lastFrameTime = performance.now();
      draw();
    }

    const onVis = () => {
      if (document.visibilityState === 'hidden') return;
      if (reducedMotion) {
        drawOnceStatic();
      }
    };
    document.addEventListener('visibilitychange', onVis);

    const onResizeWin = () => runResize();
    window.addEventListener('resize', onResizeWin);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver?.disconnect();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('blur', onWindowLeave);
      window.removeEventListener('resize', onResizeWin);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [rgbResolved, spacingProp, mouseRadius, maxDots]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 block h-full min-h-[1px] w-full min-w-[1px]"
      aria-hidden
    />
  );
}
