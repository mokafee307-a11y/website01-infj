"use client";

import { useRef, type CSSProperties, type PointerEvent, type MouseEvent, type ReactNode } from "react";

export function useHorizontalDrag({ onStart, onMove, onEnd, mouseOnly = false }: {
  onStart?: () => void;
  onMove: (distance: number) => void;
  onEnd: (distance: number) => void;
  mouseOnly?: boolean;
}) {
  const gesture = useRef<{ x: number; y: number; dragging: boolean; vertical: boolean } | null>(null);
  const suppressClick = useRef(false);
  const stop = () => { gesture.current = null; onMove(0); };
  return {
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      suppressClick.current = false;
      if (!event.isPrimary || event.button !== 0 || (mouseOnly && event.pointerType !== "mouse")) return;
      if ((event.target as HTMLElement).closest("[data-no-drag],a,input,textarea,select")) return;
      gesture.current = { x: event.clientX, y: event.clientY, dragging: false, vertical: false };
      onStart?.();
    },
    onPointerMove(event: PointerEvent<HTMLDivElement>) {
      const g = gesture.current;
      if (!g || g.vertical) return;
      const dx = event.clientX - g.x, dy = event.clientY - g.y;
      if (!g.dragging && Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { g.vertical = true; return; }
      if (!g.dragging && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        g.dragging = true;
        suppressClick.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      if (g.dragging) { event.preventDefault(); onMove(dx); }
    },
    onPointerUp(event: PointerEvent<HTMLDivElement>) {
      const g = gesture.current;
      if (g?.dragging) onEnd(event.clientX - g.x);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      stop();
    },
    onPointerCancel() { stop(); },
    onClickCapture(event: MouseEvent<HTMLDivElement>) {
      if (suppressClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
    },
    onDragStart(event: MouseEvent<HTMLDivElement>) { event.preventDefault(); },
  };
}

export function useCardTilt(max = 12) {
  // Inspired by kennyotsu's Uiverse hover card; pointer tracking replaces the
  // 25 overlay cells so the card remains one accessible, touch-friendly button.
  return {
    onPointerMove(event: PointerEvent<HTMLElement>) {
      if (event.pointerType !== "mouse" || event.buttons || window.matchMedia("(prefers-reduced-motion: reduce), (hover: none)").matches) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      const style = event.currentTarget.style;
      style.setProperty("--tilt-x", `${(0.5 - y) * max * 2}deg`);
      style.setProperty("--tilt-y", `${(x - 0.5) * max * 2}deg`);
      style.setProperty("--glare-x", `${x * 100}%`);
      style.setProperty("--glare-y", `${y * 100}%`);
    },
    onPointerLeave(event: PointerEvent<HTMLElement>) {
      event.currentTarget.style.setProperty("--tilt-x", "0deg");
      event.currentTarget.style.setProperty("--tilt-y", "0deg");
    },
  };
}

// Controlled front/back component: flip, fan movement and tilt use separate
// transform layers so hovering or dragging never overwrites the flip rotation.
export function FlipCard({ front, back, flipped, active }: {
  front: ReactNode; back: ReactNode; flipped: boolean; active: boolean;
}) {
  const tilt = useCardTilt(8);
  return <div className={`flip-card ${flipped ? "is-flipped" : ""}`} {...(active ? tilt : {})}>
    <div className="flip-tilt">
      <div className="flip-rotator">
        <div className="flip-face flip-front-face" aria-hidden={!active || flipped} inert={!active || flipped}>{front}<span className="card-glare" aria-hidden="true" /></div>
        <div className="flip-face flip-back-face" aria-hidden={!active || !flipped} inert={!active || !flipped}>{back}<span className="card-glare" aria-hidden="true" /></div>
      </div>
    </div>
  </div>;
}

export type MotionStyle = CSSProperties & { "--offset"?: number; "--depth"?: number };
