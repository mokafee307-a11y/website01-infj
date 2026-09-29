"use client";

import { useEffect, useRef } from "react";
import { thinkers, type Thinker } from "./prototype-data";
import { useCardTilt, useHorizontalDrag } from "./CardMotion";
import portraitCredits from "./portrait-credits.json";
import BorderGlow from "./BorderGlow";
import { portraitImage, colorizedPortraits } from "./portrait-images";
import { fitOrbitWidth, orbitDelta, orbitOpacity, orbitSlots } from "./thinker-orbit";
import "./thinker-orbit.css";

function ThinkerCard({ person, selected, toggle }: { person: Thinker; selected: boolean; toggle: () => void }) {
  const tilt = useCardTilt(12);
  const portrait = portraitCredits.find(item => item.id === person.id);
  return <div className="thinker-motion" {...tilt}>
    <BorderGlow className={selected ? "is-selected" : ""}>
    <button className={`thinker-card texture ${selected ? "selected" : ""}`} aria-pressed={selected} aria-label={`${selected ? "取消选择" : "选择"}${person.name}`} onClick={toggle}>
      <div className="portrait-placeholder" aria-hidden="true">{portrait ? <img className="thinker-portrait" src={portraitImage(person.id, selected)} alt="" loading="lazy" width={600} height={800} draggable={false} /> : <span className="portrait-monogram">{person.short}</span>}<span className="selection-check">{selected ? "✓" : "+"}</span></div>
      <div className="thinker-info"><span className="hint">{person.field}</span><h2>{person.name}</h2><p>{person.angle}</p></div><span className="card-glare" aria-hidden="true" />
    </button>
    </BorderGlow>
  </div>;
}

export default function ThinkerRail({ selected, toggle }: { selected: string[]; toggle: (id: string) => void }) {
  const rail = useRef<HTMLDivElement>(null);
  const dragStart = useRef(0);
  const controller = useRef({ position: 2, target: 2, cardWidth: 222, move: (_value: number) => {}, drag: (_value: number) => {} });
  const gesture = useHorizontalDrag({
    onStart: () => { dragStart.current = controller.current.position; },
    onMove: dx => { if (dx) controller.current.drag(dragStart.current - dx / (controller.current.cardWidth * .85)); },
    onEnd: () => controller.current.move(controller.current.position),
  });
  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const state = controller.current, cards = Array.from(element.children) as HTMLDivElement[];
    const count = cards.length, reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0, desktop = false, frame = 0, last = 0, wheelTime = -Infinity;
    let slots = orbitSlots(1100, 222);
    const render = () => {
      cards.forEach((card, i) => {
        const d = orbitDelta(i - state.position, count), distance = Math.abs(d);
        const limit = desktop ? 3.65 : 2.85, visible = distance < limit;
        const lo = Math.min(slots.length - 2, Math.floor(distance)), t = distance - lo;
        const from = slots[lo], to = slots[lo + 1], sign = Math.sign(d);
        const x = (from.x + (to.x - from.x) * t) * sign;
        const z = from.z + (to.z - from.z) * t;
        const yaw = (from.yaw + (to.yaw - from.yaw) * t) * sign;
        card.style.transform = `translate(-50%,-50%) translate3d(${x}px,${distance * 4}px,${z}px) rotateY(${yaw}deg)`;
        card.style.opacity = String(orbitOpacity(distance) * Math.max(0, Math.min(1, (limit - distance) / (desktop ? .65 : 1))));
        card.style.zIndex = String(Math.round(100 - distance * 10));
        card.style.visibility = visible ? "visible" : "hidden";
        card.style.pointerEvents = visible ? "auto" : "none";
        card.inert = !visible;
        card.setAttribute("aria-hidden", String(!visible));
      });
    };
    const tick = (now: number) => {
      const dt = Math.min(40, last ? now - last : 16); last = now;
      state.position += (state.target - state.position) * (1 - Math.exp(-dt / 95));
      if (Math.abs(state.target - state.position) < .0005) {
        state.position = state.target; frame = 0; last = 0; render(); return;
      }
      render(); frame = requestAnimationFrame(tick);
    };
    state.move = value => {
      state.target = Math.round(value);
      if (reduced.matches) { if (frame) cancelAnimationFrame(frame); frame = 0; last = 0; state.position = state.target; render(); }
      else if (!frame) frame = requestAnimationFrame(tick);
    };
    state.drag = value => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0; last = 0; state.position = value; state.target = value; render();
    };
    const resize = () => {
      width = element.clientWidth;
      if (!width) return;
      desktop = width >= 900;
      state.cardWidth = desktop ? fitOrbitWidth(width) : Math.min(width * .56, width <= 700 ? 200 : 222);
      // Keep the original 222:411 desktop / 200:381 mobile card proportions.
      const height = state.cardWidth * (window.innerWidth <= 700 ? 381 / 200 : 411 / 222);
      element.style.setProperty("--orbit-width", `${state.cardWidth}px`);
      element.style.setProperty("--orbit-height", `${height}px`);
      element.style.height = `${height + 80}px`;
      slots = orbitSlots(width, state.cardWidth); render();
    };
    const wheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      if (performance.now() - wheelTime < 380) return;
      wheelTime = performance.now(); state.move(state.target + Math.sign(event.deltaX));
    };
    const observer = new ResizeObserver(resize); observer.observe(element);
    element.addEventListener("wheel", wheel, { passive: false }); resize();
    return () => {
      observer.disconnect(); element.removeEventListener("wheel", wheel);
      if (frame) cancelAnimationFrame(frame);
      state.move = () => {}; state.drag = () => {};
    };
  }, []);
  const activate = (index: number, id: string) => {
    const state = controller.current, offset = orbitDelta(index - Math.round(state.target), thinkers.length);
    if (!offset) toggle(id);
    else state.move(state.target + offset);
  };
  return <div className="thinker-gallery">
<div ref={rail} className="thinker-rail thinker-orbit" role="region" aria-roledescription="轮播" aria-label="人物卡牌，左右拖动或方向键切换，点击侧卡居中，点击中央卡片选择" tabIndex={0} {...gesture} onPointerCancel={() => { gesture.onPointerCancel(); controller.current.move(controller.current.position); }} onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); controller.current.move(controller.current.target + (event.key === "ArrowLeft" ? -1 : 1)); } }}>
      {thinkers.map((person, index) => <div className="thinker-orbit-slot" key={person.id} onFocus={event => { if (!event.target.matches(":focus-visible")) return; const state = controller.current; state.move(state.target + orbitDelta(index - state.target, thinkers.length)); }}><ThinkerCard person={person} selected={selected.includes(person.id)} toggle={() => activate(index, person.id)} /></div>)}
    </div>
    <details className="portrait-credits"><summary>肖像来源与授权</summary><ul>{portraitCredits.filter(item => thinkers.some(person => person.id === item.id)).map(item => <li key={item.id}><a href={item.sourcePage} target="_blank" rel="noreferrer">{thinkers.find(person => person.id === item.id)?.name}</a> · {item.author} · <a href={item.licenseUrl} target="_blank" rel="noreferrer">{item.license}</a>（{colorizedPortraits.has(item.id) ? "AI 辅助上色与裁切，颜色为推测；衍生版本沿用原素材许可" : "保留原素材颜色，页面作裁切展示"}）</li>)}</ul></details>
  </div>;
}
