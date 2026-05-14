import { useEffect, useMemo, useRef } from 'react';

export type DotMatrixColorPreset = 'green' | 'teal' | 'white';

const RGB_BY_PRESET: Record<DotMatrixColorPreset, string> = {
  green: '0,180,80',
  teal: '0,200,190',
  white: '200,200,200',
};

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

export type DotMatrixBackgroundProps = {
  /** Готовые цвета или строка вида `"r,g,b"` */
  color?: DotMatrixColorPreset | string;
  /** Явный RGB; если задан — перебивает `color` */
  rgb?: string;
  /** Шаг сетки (пикселей). На узком экране умножается на ≈30/22 — меньше точек и нагрузка */
  spacing?: number;
  /** Радиус подсветки у курсора */
  mouseRadius?: number;
};

export default function DotMatrixBackground({
  color = 'green',
  rgb,
  spacing: spacingProp = 22,
  mouseRadius = 90,
}: DotMatrixBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const rgbResolved = useMemo(() => resolveRgb(rgb, color), [rgb, color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const mouse = { x: -999, y: -999 };

    let dots: { x: number; y: number; phase: number; speed: number; baseAlpha: number; r: number }[] = [];

    const buildDots = (step: number) => {
      dots = [];
      const cols = Math.ceil(canvas.width / step) + 1;
      const rows = Math.ceil(canvas.height / step) + 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push({
            x: c * step,
            y: r * step,
            phase: Math.random() * Math.PI * 2,
            speed: 0.4 + Math.random() * 0.6,
            baseAlpha: 0.14 + Math.random() * 0.22,
            r: 0.9 + Math.random() * 0.85,
          });
        }
      }
    };

    const spacingForViewport = () => {
      const base = spacingProp;
      return typeof window !== 'undefined' && window.innerWidth < 768 ? Math.round((base * 30) / 22) : base;
    };

    const resize = () => {
      const step = spacingForViewport();
      const w = Math.max(1, canvas.offsetWidth);
      const h = Math.max(1, canvas.offsetHeight);
      canvas.width = w;
      canvas.height = h;
      buildDots(step);
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        mouse.x = -999;
        mouse.y = -999;
      } else {
        mouse.x = x;
        mouse.y = y;
      }
    };

    const onWindowLeave = () => {
      mouse.x = -999;
      mouse.y = -999;
    };

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      const el = canvas.parentElement;
      if (el) {
        resizeObserver = new ResizeObserver(() => resize());
        resizeObserver.observe(el);
      }
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('blur', onWindowLeave);
    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(resize);

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.012;
      const mr = mouseRadius > 1 ? mouseRadius : 90;
      for (const d of dots) {
        const pulse = Math.sin(t * d.speed + d.phase);
        let alpha = d.baseAlpha + pulse * 0.18;
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        alpha += Math.max(0, 1 - dist / mr) * 0.7;
        alpha = Math.max(0.03, Math.min(1, alpha));
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgbResolved},${alpha.toFixed(2)})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver?.disconnect();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('blur', onWindowLeave);
      window.removeEventListener('resize', resize);
    };
  }, [rgbResolved, spacingProp, mouseRadius]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 block h-full min-h-[1px] w-full min-w-[1px]"
      aria-hidden
    />
  );
}
