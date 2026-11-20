"use client";

import { useEffect, useRef } from "react";

const GOLD = ["#FFDF01", "#C9A961", "#FFE97A", "#FFFFFF", "#F5B800"];

type Piece = { x: number; y: number; vx: number; vy: number; r: number; w: number; h: number; spin: number; color: string; life: number };

/**
 * Canvas gold confetti. Fires a burst every time `fire` changes to a new truthy value.
 * No dependency, GPU friendly, and skipped entirely for reduced motion.
 */
export function Confetti({ fire, count = 220, origin = "top" }: { fire: number; count?: number; origin?: "top" | "center" }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pieces = useRef<Piece[]>([]);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!fire) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = canvas.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = window.innerWidth;
    const H = window.innerHeight;

    for (let i = 0; i < count; i++) {
      const fromCenter = origin === "center";
      const angle = fromCenter ? Math.random() * Math.PI * 2 : Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const speed = fromCenter ? 6 + Math.random() * 10 : 2 + Math.random() * 5;
      pieces.current.push({
        x: fromCenter ? W / 2 : Math.random() * W,
        y: fromCenter ? H / 2.4 : -20 - Math.random() * H * 0.3,
        vx: Math.cos(angle) * speed,
        vy: fromCenter ? Math.sin(angle) * speed - 4 : Math.sin(angle) * speed,
        r: Math.random() * Math.PI,
        w: 6 + Math.random() * 8,
        h: 8 + Math.random() * 10,
        spin: (Math.random() - 0.5) * 0.3,
        color: GOLD[i % GOLD.length],
        life: 0,
      });
    }

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      pieces.current = pieces.current.filter((p) => p.y < H + 40 && p.life < 420);
      for (const p of pieces.current) {
        p.life++;
        p.vy += 0.12;
        p.vx *= 0.99;
        p.x += p.vx + Math.sin(p.life / 12) * 0.6;
        p.y += p.vy;
        p.r += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.scale(1, Math.cos(p.life / 6));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      raf.current = pieces.current.length ? requestAnimationFrame(tick) : null;
    };
    if (raf.current === null) raf.current = requestAnimationFrame(tick);
  }, [fire, count, origin]);

  useEffect(() => () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
  }, []);

  return <canvas ref={canvas} aria-hidden className="pointer-events-none fixed inset-0 z-[80] h-full w-full" />;
}
