"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLSpanElement | null>(null);
  const ringRef = useRef<HTMLSpanElement | null>(null);
  const glowRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine) and (hover: hover)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const glow = glowRef.current;
    if (!dot || !ring || !glow) return;

    document.body.classList.add("has-custom-cursor");
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let glowX = targetX;
    let glowY = targetY;
    let frame = 0;

    const render = () => {
      ringX += (targetX - ringX) * 0.17;
      ringY += (targetY - ringY) * 0.17;
      glowX += (targetX - glowX) * 0.075;
      glowY += (targetY - glowY) * 0.075;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      glow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;
      frame = window.requestAnimationFrame(render);
    };

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      dot.dataset.visible = "true";
      ring.dataset.visible = "true";
      glow.dataset.visible = "true";

      const target = event.target as Element | null;
      const interactive = target?.closest("a, button, input, textarea, select, [data-cursor]");
      const textField = target?.closest("input, textarea");
      ring.dataset.active = interactive ? "true" : "false";
      ring.dataset.text = textField ? "true" : "false";
      glow.dataset.active = interactive ? "true" : "false";
    };

    const onDown = () => { ring.dataset.down = "true"; };
    const onUp = () => { ring.dataset.down = "false"; };
    const onLeave = () => {
      dot.dataset.visible = "false";
      ring.dataset.visible = "false";
      glow.dataset.visible = "false";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    frame = window.requestAnimationFrame(render);

    return () => {
      document.body.classList.remove("has-custom-cursor");
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div className="cursor-system" aria-hidden="true">
      <span ref={glowRef} className="cursor-glow" />
      <span ref={ringRef} className="cursor-ring" />
      <span ref={dotRef} className="cursor-dot" />
    </div>
  );
}
