import { useEffect, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
};

const COLORS = ['#f5b301', '#ef476f', '#06d6a0', '#118ab2', '#8b5cf6', '#f7f3ea'];

export function useConfetti(active: boolean) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!active || !canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    context.scale(ratio, ratio);

    const particles: Particle[] = Array.from({ length: 140 }, () => ({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 220,
      y: window.innerHeight / 2 + (Math.random() - 0.5) * 80,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -10 - 4,
      size: Math.random() * 8 + 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
    }));

    let frame = 0;
    const started = performance.now();

    const tick = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.32;
        particle.vx *= 0.99;
        particle.rotation += particle.spin;
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.fillStyle = particle.color;
        context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.6);
        context.restore();
      }
      frame += 1;
      if (performance.now() - started < 2600) {
        requestAnimationFrame(tick);
      } else {
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
  }, [active]);

  return canvasRef;
}
