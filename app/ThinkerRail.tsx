"use client";

import { useRef } from "react";
import { thinkers, type Thinker } from "./prototype-data";
import { useCardTilt, useHorizontalDrag } from "./CardMotion";
import portraitCredits from "./portrait-credits.json";
import BorderGlow from "./BorderGlow";
import { portraitImage, colorizedPortraits } from "./portrait-images";

function ThinkerCard({ person, selected, toggle }: { person: Thinker; selected: boolean; toggle: () => void }) {
  const tilt = useCardTilt(12);
  const portrait = portraitCredits.find(item => item.id === person.id);
  return <div className="thinker-motion" {...tilt}>
    <BorderGlow>
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
  const gesture = useHorizontalDrag({ mouseOnly: true, onStart: () => { dragStart.current = rail.current?.scrollLeft ?? 0; }, onMove: dx => { if (dx && rail.current) rail.current.scrollLeft = dragStart.current - dx; }, onEnd: () => {} });
  const scroll = (direction: number) => {
    if (rail.current) rail.current.scrollBy({ left: direction * Math.max(240, rail.current.clientWidth * 0.7), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  return <div className="thinker-gallery">
<div ref={rail} className="thinker-rail" role="region" aria-label="人物卡牌，可左右滑动" tabIndex={0} {...gesture} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); scroll(event.key === "ArrowLeft" ? -1 : 1); } }}>
      {thinkers.map(person => <ThinkerCard key={person.id} person={person} selected={selected.includes(person.id)} toggle={() => toggle(person.id)} />)}
    </div>
    <details className="portrait-credits"><summary>肖像来源与授权</summary><ul>{portraitCredits.filter(item => thinkers.some(person => person.id === item.id)).map(item => <li key={item.id}><a href={item.sourcePage} target="_blank" rel="noreferrer">{thinkers.find(person => person.id === item.id)?.name}</a> · {item.author} · <a href={item.licenseUrl} target="_blank" rel="noreferrer">{item.license}</a>（{colorizedPortraits.has(item.id) ? "AI 辅助上色与裁切，颜色为推测；衍生版本沿用原素材许可" : "保留原素材颜色，页面作裁切展示"}）</li>)}</ul></details>
  </div>;
}
