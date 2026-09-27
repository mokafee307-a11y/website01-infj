"use client";

import { useRef, useState } from "react";
import { categories, scenarioCards } from "./prototype-data";
import { FlipCard, useHorizontalDrag, type MotionStyle } from "./CardMotion";
import type { SavedInsight } from "./PrototypeModules";

export default function StackedCards({ saved, onSave }: { saved: SavedInsight[]; onSave: (item: SavedInsight) => void }) {
  const [category, setCategory] = useState(categories[0]);
  const [active, setActive] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const cards = scenarioCards.filter(card => card.category === category);
  const choose = (index: number) => {
    const moveFocus = stage.current?.contains(document.activeElement);
    setActive((index + cards.length) % cards.length); setFlipped(false);
    if (moveFocus) requestAnimationFrame(() => stage.current?.querySelector<HTMLButtonElement>(".is-current .deck-front-content")?.focus({ preventScroll: true }));
  };
  const gesture = useHorizontalDrag({
    onMove: dx => stage.current?.style.setProperty("--drag-x", `${Math.max(-110, Math.min(110, dx * 0.35))}px`),
    onEnd: dx => { if (Math.abs(dx) > 42) choose(active + (dx < 0 ? 1 : -1)); },
  });
  return <div className="stacked-cards">
    <div className="module-toolbar"><div className="category-tabs" aria-label="问题分类">{categories.map(item => <button key={item} aria-pressed={category === item} onClick={() => { setCategory(item); choose(0); }}>{item}<span className="count">6</span></button>)}</div></div>
    <div ref={stage} className="card-deck" role="region" aria-roledescription="卡片轮播" aria-label={`${category}场景卡片`} {...gesture} onKeyDown={event => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); choose(active + (event.key === "ArrowRight" ? 1 : -1)); }
    }}>
      {cards.map((card, index) => {
        const offset = ((index - active + cards.length + 3) % cards.length) - 3;
        const current = index === active;
        const isSaved = saved.some(item => item.id === card.id);
        return <article key={card.id} className={`deck-card ${current ? "is-current" : ""}`} style={{ "--offset": offset, "--depth": Math.abs(offset), zIndex: 20 - Math.abs(offset) } as MotionStyle} data-position={offset} aria-label={`第 ${index + 1} 张，共 ${cards.length} 张`}>
          <FlipCard active={current} flipped={current && flipped} front={<button className="deck-front-content" tabIndex={current && !flipped ? 0 : -1} onClick={() => setFlipped(true)} aria-label={`翻开：${card.title}`} aria-expanded={current && flipped}>
            <span className="deck-card-meta">{category}</span><h2>{card.title}</h2><p>{card.scene}</p><span className="deck-flip-hint">看看我的认知盲区 <span aria-hidden="true">↻</span></span>
          </button>} back={<div className="deck-back-content"><div className="deck-card-meta"><span>换个角度看</span><span>{category}</span></div><h2>{card.title}</h2><div className="deck-back-scroll" tabIndex={current && flipped ? 0 : -1} aria-label="卡片背面内容"><div className="blindspot"><h3>! 常见盲区 · 不是结论</h3><p>{card.blind}</p></div><div><h3>换一种理解</h3><p>{card.reframe}</p></div><div><h3>可以试一试</h3><p>{card.action}</p></div></div><div className="deck-back-actions" data-no-drag><button onClick={() => setFlipped(false)}>翻回正面 ↻</button><button className="text-button" disabled={isSaved} onClick={() => onSave({ id: card.id, source: "卡点梳理", title: card.title, text: `${card.reframe}\n可以试试：${card.action}` })}>{isSaved ? "已加入今日切片" : "加入今日切片"}</button></div></div>} />
          {!current && <button className="deck-pick" onClick={() => choose(index)} aria-label={`查看第 ${index + 1} 张：${card.title}`} />}
        </article>;
      })}
    </div>
    <div className="deck-navigation"><button className="deck-arrow" onClick={() => choose(active - 1)} aria-label="上一张问题卡">‹</button><div className="deck-pagination"><span className="hint" aria-live="polite">第 {active + 1} / {cards.length} 张 · {flipped ? "背面" : "正面"}</span><div className="deck-dots">{cards.map((card, i) => <button key={card.id} aria-label={`跳到第 ${i + 1} 张：${card.title}`} aria-current={active === i ? "true" : undefined} onClick={() => choose(i)} />)}</div></div><button className="deck-arrow" onClick={() => choose(active + 1)} aria-label="下一张问题卡">›</button></div>
    <p className="hint center section-note">这些是观察角度，不是唯一正确答案。只留下与你的经历贴近的部分。</p>
  </div>;
}
