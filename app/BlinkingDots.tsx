"use client";

import { useEffect, useRef } from "react";

type Dot = {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  phase: number;
  speed: number;
  layer: number;
};

const TAU = Math.PI * 2;

function randomFrom(seed: number) {
  let value = seed | 0;
  return () => {
    value = Math.imul(value ^ (value >>> 15), 1 | value);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function mixColor(from: [number, number, number], to: [number, number, number], amount: number) {
  const channel = (index: number) => Math.round(from[index] + (to[index] - from[index]) * amount);
  return `rgb(${channel(0)} ${channel(1)} ${channel(2)})`;
}

/** A lightweight, independent recreation of a layered blinking-dot field. */
export default function BlinkingDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let start = performance.now();

    const buildDots = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, width < 720 ? 1.35 : 1.75);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const next: Dot[] = [];
      const shortest = Math.min(width, height);
      const baseCell = Math.max(34, shortest / (width < 720 ? 15 : 20));
      const small: [number, number, number] = [102, 151, 142];
      const large: [number, number, number] = [214, 246, 225];

      [1, 1.9].forEach((scale, layer) => {
        const cell = baseCell / scale;
        const columns = Math.ceil(width / cell) + 2;
        const rows = Math.ceil(height / cell) + 2;
        const random = randomFrom(7403 + layer * 991 + columns * 31 + rows * 17);

        for (let row = -1; row < rows; row += 1) {
          for (let column = -1; column < columns; column += 1) {
            if (random() > (layer === 0 ? 0.72 : 0.54)) continue;
            const size = Math.pow(random(), 1.7);
            next.push({
              x: (column + 0.5 + (random() - 0.5) * 0.62) * cell,
              y: (row + 0.5 + (random() - 0.5) * 0.62) * cell,
              radius: (0.55 + size * (layer === 0 ? 2.25 : 1.25)) * (width < 720 ? 0.9 : 1),
              color: mixColor(small, large, size),
              alpha: (layer === 0 ? 0.24 : 0.1) + size * (layer === 0 ? 0.52 : 0.25),
              phase: random() * TAU,
              speed: 0.55 + random() * 1.15,
              layer,
            });
          }
        }
      });
      dots = next;
      start = performance.now();
    };

    const draw = (now: number) => {
      const seconds = (now - start) / 1000;
      const reducedMotion = motionPreference.matches;
      pointer.x += (pointer.targetX - pointer.x) * 0.045;
      pointer.y += (pointer.targetY - pointer.y) * 0.045;

      context.fillStyle = "#061014";
      context.fillRect(0, 0, width, height);

      for (const dot of dots) {
        const depth = dot.layer === 0 ? 1 : 0.42;
        const driftX = reducedMotion ? 0 : seconds * width * 0.0035 * depth;
        const driftY = reducedMotion ? 0 : seconds * height * 0.009 * depth;
        const parallaxX = reducedMotion ? 0 : pointer.x * 24 * depth;
        const parallaxY = reducedMotion ? 0 : pointer.y * 18 * depth;
        const x = ((dot.x + driftX + parallaxX + width) % width + width) % width;
        const y = ((dot.y + driftY + parallaxY + height) % height + height) % height;
        const blink = reducedMotion ? 0.78 : 0.56 + Math.sin(seconds * dot.speed * 2.1 + dot.phase) * 0.34;
        const pulse = Math.max(0.16, blink);

        context.beginPath();
        context.arc(x, y, dot.radius, 0, TAU);
        context.fillStyle = dot.color;
        context.globalAlpha = dot.alpha * pulse;
        context.fill();

        if (dot.radius > 1.65) {
          context.beginPath();
          context.arc(x, y, dot.radius * 3.2, 0, TAU);
          context.fillStyle = dot.color;
          context.globalAlpha = dot.alpha * pulse * 0.055;
          context.fill();
        }
      }

      context.globalAlpha = 1;
      const vignette = context.createRadialGradient(width * 0.48, height * 0.42, 0, width * 0.48, height * 0.42, Math.max(width, height) * 0.72);
      vignette.addColorStop(0, "rgb(6 16 20 / 0)");
      vignette.addColorStop(1, "rgb(2 9 13 / .64)");
      context.fillStyle = vignette;
      context.fillRect(0, 0, width, height);

      if (!reducedMotion) frame = requestAnimationFrame(draw);
    };

    const restart = () => {
      cancelAnimationFrame(frame);
      buildDots();
      draw(performance.now());
    };
    const onPointerMove = (event: PointerEvent) => {
      pointer.targetX = event.clientX / Math.max(1, width) * 2 - 1;
      pointer.targetY = event.clientY / Math.max(1, height) * 2 - 1;
    };
    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      pointer.targetX = 0;
      pointer.targetY = 0;
    };

    const resizeObserver = new ResizeObserver(restart);
    resizeObserver.observe(canvas);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    motionPreference.addEventListener("change", restart);
    restart();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      motionPreference.removeEventListener("change", restart);
    };
  }, []);

  return <canvas ref={canvasRef} className="blinking-dots-background" aria-hidden="true" />;
}
