"use client";

// React Bits OptionWheel adapted as controlled anchor navigation, rather than a listbox.
import { useCallback, useEffect, useRef, useState, type PointerEvent, type KeyboardEvent, type CSSProperties } from "react";
type Item = { id: string; title: string };
export default function OptionWheel({ items, selectedIndex, onChange }: { items: readonly Item[]; selectedIndex: number; onChange: (index: number) => void }) {
  const root = useRef<HTMLElement>(null);
  const nodes = useRef<(HTMLAnchorElement | null)[]>([]);
  const position = useRef(selectedIndex), target = useRef(selectedIndex), frame = useRef(0), last = useRef(0);
  const row = useRef(54), reduced = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drag = useRef<{ y: number; start: number; id: number } | null>(null);
  const moved = useRef(false);
  const [dragging, setDragging] = useState(false);
  const change = useRef(onChange); change.current = onChange;
  const count = items.length;
  const clamp = useCallback((v: number) => Math.max(0, Math.min(count - 1, v)), [count]);
  const paint = useCallback((pos: number) => {
    const tilt = 6 * Math.PI / 180, radius = row.current / tilt;
    nodes.current.forEach((el, i) => {
      if (!el) return;
      const d = i - pos, dist = Math.abs(d), angle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tilt));
      const x = radius * (1 - Math.cos(angle)), y = radius * Math.sin(angle);
      el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${-angle * 180 / Math.PI}deg)`;
      el.style.opacity = String(Math.max(.42, 1 - dist * .18));
      el.style.filter = reduced.current ? "none" : `blur(${Math.min(dist * .5, 1.2)}px)`;
      el.style.setProperty("--ow-p", String(Math.max(0, 1 - Math.min(dist, 1))));
    });
  }, []);
  const animate = useCallback(function run(now: number) {
    const dt = Math.min(now - last.current, 50); last.current = now;
    position.current += (target.current - position.current) * (1 - Math.exp(-dt / 150));
    const settled = Math.abs(target.current - position.current) < .001;
    if (settled || reduced.current) position.current = target.current;
    paint(position.current);
    frame.current = settled || reduced.current ? 0 : requestAnimationFrame(run);
  }, [paint]);
  const setTarget = useCallback((value: number) => {
    target.current = clamp(value);
    cancelAnimationFrame(frame.current); last.current = performance.now(); frame.current = requestAnimationFrame(animate);
  }, [animate, clamp]);
  const commit = useCallback((value: number) => { const index = Math.round(clamp(value)); setTarget(index); change.current(index); }, [clamp, setTarget]);
  useEffect(() => { if (!drag.current && !timer.current) setTarget(selectedIndex); }, [selectedIndex, setTarget]);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const measure = () => { reduced.current = query.matches; row.current = parseFloat(getComputedStyle(el).getPropertyValue("--ow-row")) || 54; paint(position.current); };
    const observer = new ResizeObserver(measure); observer.observe(el); measure(); query.addEventListener("change", measure);
    const wheel = (e: WheelEvent) => {
      if (!e.deltaY || e.ctrlKey) return;
      const delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
      if ((target.current <= 0 && delta < 0) || (target.current >= count - 1 && delta > 0)) return;
      e.preventDefault();
      setTarget(target.current + Math.max(-1, Math.min(1, delta / row.current)));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { timer.current = null; commit(target.current); }, 140);
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => { el.removeEventListener("wheel", wheel); observer.disconnect(); query.removeEventListener("change", measure); if (timer.current) clearTimeout(timer.current); cancelAnimationFrame(frame.current); };
  }, [count, commit, paint, setTarget]);
  const down = (e: PointerEvent<HTMLElement>) => {
    if (!e.isPrimary || e.button !== 0) return;
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    moved.current = false; drag.current = { y: e.clientY, start: target.current, id: e.pointerId };
  };
  const move = (e: PointerEvent<HTMLElement>) => {
    if (!drag.current) return;
    const dy = e.clientY - drag.current.y;
    if (Math.abs(dy) > 5 && !moved.current) { moved.current = true; setDragging(true); root.current?.setPointerCapture(e.pointerId); }
    if (moved.current) setTarget(drag.current.start - dy / row.current);
  };
  const end = (e: PointerEvent<HTMLElement>) => {
    if (!drag.current) return;
    drag.current = null; setDragging(false);
    if (root.current?.hasPointerCapture(e.pointerId)) root.current.releasePointerCapture(e.pointerId);
    if (moved.current) commit(target.current);
  };
  const key = (e: KeyboardEvent<HTMLElement>) => {
    const focused = nodes.current.indexOf(document.activeElement as HTMLAnchorElement), current = focused < 0 ? selectedIndex : focused;
    let next = current;
    if (["ArrowDown", "ArrowRight"].includes(e.key)) next++;
    else if (["ArrowUp", "ArrowLeft"].includes(e.key)) next--;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = count - 1;
    else return;
    e.preventDefault(); next = clamp(next); nodes.current[next]?.focus({ preventScroll: true }); commit(next);
  };
  return <nav ref={root} className={`option-wheel option-wheel--right${dragging ? " option-wheel--dragging" : ""}`} aria-label="功能模块，支持滚轮、拖动和方向键" onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={e => { end(e); moved.current = false; }} onKeyDown={key}>
    {items.map((item, i) => <a key={item.id} ref={el => { nodes.current[i] = el; }} id={`tab-${item.id}`} href={`#${item.id}`} className={`option-wheel__item${i === selectedIndex ? " option-wheel__item--selected" : ""}`} aria-current={i === selectedIndex ? "location" : undefined} style={{ "--ow-p": i === selectedIndex ? 1 : 0, transform: `translateY(calc(${(i - selectedIndex) * 54}px - 50%))` } as CSSProperties} onDragStart={e => e.preventDefault()} onClick={e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); if (moved.current && e.detail) { moved.current = false; return; } commit(i); }}>{item.title}</a>)}
  </nav>;
}
