"use client";

import { useState } from "react";
import { publicAsset } from "./public-asset";

const blessings = [
  { text: "你已经足够好", className: "blessing-one" },
  { text: "慢一点，也没关系", className: "blessing-two" },
  { text: "你的存在，本身就是光", className: "blessing-three" },
  { text: "世界因你而温柔", className: "blessing-four" },
  { text: "你并不孤单", className: "blessing-five" },
  { text: "更深的你，会遇见更大的世界", className: "blessing-six" },
] as const;

export default function CosmicFooter() {
  const [received, setReceived] = useState(false);

  return <footer className={`cosmic-footer${received ? " blessing-received" : ""}`} aria-labelledby="cosmic-footer-title">
    <div className="cosmic-footer-media" aria-hidden="true">
      <video autoPlay muted loop playsInline preload="metadata" poster={publicAsset("/media/cosmic-footer-poster.png")}>
        <source src={publicAsset("/media/cosmic-footer.mp4")} type="video/mp4" />
      </video>
    </div>
    <div className="cosmic-footer-shade" aria-hidden="true" />
    <div className="cosmic-footer-orbits" aria-hidden="true">
      <span className="orbit orbit-outer" />
      <span className="orbit orbit-inner" />
      {blessings.map(item => <span key={item.text} className={`orbit-blessing ${item.className}`}><i />{item.text}</span>)}
    </div>
    <div className="cosmic-footer-content">
      <span className="cosmic-footer-star" aria-hidden="true">✦</span>
      <h2 id="cosmic-footer-title">你所寻找的，也正在寻找你。</h2>
      <p>愿你的敏感成为触角，孤独成为深度，理想成为方向。</p>
      <button type="button" className="blessing-button" aria-pressed={received} onClick={() => setReceived(value => !value)}>
        <span>{received ? "这份祝福，已经属于你" : "收下这份祝福"}</span>
        <span aria-hidden="true">✦</span>
      </button>
      <span className="blessing-status" aria-live="polite">{received ? "愿你继续向内，也继续走向辽阔。" : ""}</span>
    </div>
    <div className="cosmic-footer-bottom">
      <span>INFJ COSMIC VOYAGER</span>
      <nav aria-label="页脚导航"><a href="#map">重新漫游</a><a href="mailto:hello@mokafee.com">联系我</a></nav>
      <span>觉察 · 理解 · 接纳 · 成为</span>
    </div>
  </footer>;
}
