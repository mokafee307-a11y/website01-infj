"use client";

// React Bits ClickSpark: viewport-sized, DPR-aware, and idle when there are no sparks.
import { useEffect, useRef, type ReactNode, type MouseEvent } from "react";
type Spark = { x: number; y: number; angle: number; start: number };
export default function ClickSpark({ children, sparkColor = "#d4f4e6", sparkSize = 10, sparkRadius = 15, sparkCount = 8, duration = 400 }: {
  children: ReactNode; sparkColor?: string; sparkSize?: number; sparkRadius?: number; sparkCount?: number; duration?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparks = useRef<Spark[]>([]);
  const frame = useRef(0);
  const launch = useRef<() => void>(() => {});
  const reduced = useRef(true);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const clear = () => { sparks.current = []; cancelAnimationFrame(frame.current); frame.current = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); };
    const sync = () => { reduced.current = query.matches; if (query.matches) clear(); };
    const resize = () => { clear(); const dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const draw = (now: number) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      sparks.current = sparks.current.filter(spark => now - spark.start < duration);
      for (const spark of sparks.current) {
        const t = Math.min((now - spark.start) / duration, 1), eased = t * (2 - t);
        const distance = eased * sparkRadius, length = sparkSize * (1 - eased);
        ctx.strokeStyle = sparkColor; ctx.lineWidth = 1.5; ctx.globalAlpha = 1 - t;
        ctx.beginPath(); ctx.moveTo(spark.x + distance * Math.cos(spark.angle), spark.y + distance * Math.sin(spark.angle));
        ctx.lineTo(spark.x + (distance + length) * Math.cos(spark.angle), spark.y + (distance + length) * Math.sin(spark.angle)); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      frame.current = sparks.current.length ? requestAnimationFrame(draw) : 0;
    };
    launch.current = () => { if (!frame.current) frame.current = requestAnimationFrame(draw); };
    sync(); resize(); window.addEventListener("resize", resize); window.addEventListener("scroll", clear, { passive: true }); query.addEventListener("change", sync);
    return () => { clear(); launch.current = () => {}; window.removeEventListener("resize", resize); window.removeEventListener("scroll", clear); query.removeEventListener("change", sync); };
  }, [sparkColor, sparkSize, sparkRadius, sparkCount, duration]);
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (reduced.current || event.detail === 0 || event.defaultPrevented) return;
    const now = performance.now();
    sparks.current = [...sparks.current.slice(-120), ...Array.from({ length: sparkCount }, (_, i) => ({ x: event.clientX, y: event.clientY, angle: 2 * Math.PI * i / sparkCount, start: now }))];
    launch.current();
  };
  return <div className="click-spark-root" onClick={handleClick}>{children}<canvas ref={canvasRef} className="click-spark-canvas" aria-hidden="true" /></div>;
}
