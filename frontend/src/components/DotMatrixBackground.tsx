import { useEffect, useRef } from 'react';

type DotMatrixBackgroundProps = {
  /** Строка «r,g,b» для rgba, например "0,180,80" или "0,200,190" — меняй одной строкой */
  rgb?: string;
};

export default function DotMatrixBackground({ rgb = '0,180,80' }: DotMatrixBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const mouse = { x: -999, y: -999 };

    let dots: { x: number; y: number; phase: number; speed: number; baseAlpha: number; r: number }[] =
      [];

    const buildDots = (spacing: number) => {
      dots = [];
      const cols = Math.ceil(canvas.width / spacing) + 1;
      const rows = Math.ceil(canvas.height / spacing) + 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push({
            x: c * spacing,
            y: r * spacing,
            phase: Math.random() * Math.PI * 2,
            speed: 0.4 + Math.random() * 0.6,
            baseAlpha: 0.14 + Math.random() * 0.22,
            r: 0.9 + Math.random() * 0.85,
          });
        }
      }
    };

    const resize = () => {
      const SPACING = window.innerWidth < 768 ? 30 : 22;
      const w = Math.max(1, canvas.offsetWidth);
      const h = Math.max(1, canvas.offsetHeight);
      canvas.width = w;
      canvas.height = h;
      buildDots(SPACING);
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
      for (const d of dots) {
        const pulse = Math.sin(t * d.speed + d.phase);
        let alpha = d.baseAlpha + pulse * 0.18;
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        alpha += Math.max(0, 1 - dist / 90) * 0.7;
        alpha = Math.max(0.03, Math.min(1, alpha));
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${alpha.toFixed(2)})`;
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
  }, [rgb]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 block h-full min-h-[1px] w-full min-w-[1px]"
      aria-hidden
    />
  );
}
