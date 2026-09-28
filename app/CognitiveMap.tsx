"use client";

import { useEffect, useRef, useState } from "react";
import { useLaunchEntered } from "./LaunchScreen";
import { publicAsset } from "./public-asset";
import "./cognitive-map.css";

const cognition = [
    { key: "Ni", icon: "/cognition/ni.png", name: "内倾直觉", role: "主导功能", plain: "串联线索，看见潜在走向", strength: "善于把零散信息联系起来，形成整体理解和长期构想。", blind: "线索不足时，可能把自己的推测当成已经发生的事实。", example: "对方今天话很少 → 我是不是做错了什么 → 他是不是不想再和我来往了？", reminder: "区分“我观察到了什么”和“我推测了什么”。为同一件事保留不止一种解释。" },
    { key: "Fe", icon: "/cognition/fe.png", name: "外倾情感", role: "辅助功能", plain: "感受氛围，照顾关系", strength: "留意他人的处境和群体氛围，尝试让沟通与合作更顺畅。", blind: "容易把他人的失望看成自己的责任，忽略自己的意愿。", example: "我已经很累了，但对方一开口求助，我还是先说了“没问题”。", reminder: "理解对方的需要，不等于必须满足它。先确认自己的时间与意愿。" },
    { key: "Ti", icon: "/cognition/ti.png", name: "内倾思维", role: "第三功能", plain: "追问原因，厘清内部逻辑", strength: "检查解释是否自洽，分辨模糊概念，形成自己的判断。", blind: "想把所有原因都理顺再行动，可能陷入反复分析。", example: "我需要先弄明白为什么自己会拖延，然后才能开始——于是又分析了一晚上。", reminder: "解释暂时不完整，也可以保留一个小问题，去现实中获得新信息。" },
    { key: "Se", icon: "/cognition/se.png", name: "外倾感觉", role: "劣势功能", plain: "接触当下，接收直接反馈", strength: "留意身体、环境和眼前发生的事情，让想法与现实重新连接。", blind: "过度关注脑内推演时，可能漏掉身体疲惫与眼前信息。", example: "脑子已经预演了许多结果，却忘了吃饭，也还没问过对方的真实想法。", reminder: "回到一件可以看见、听见或实际确认的小事。劣势不等于缺陷，也不等于没有能力。" },
];

function CosmicGuide() {
  const video = useRef<HTMLVideoElement>(null);
  const entered = useLaunchEntered();
  const [still, setStill] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [safari, setSafari] = useState(false);
  useEffect(() => { setSafari(/Apple/.test(navigator.vendor) && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent)); }, []);
  useEffect(() => {
    const node = video.current;
    if (!node) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      setStill(motion.matches);
      if (!entered || !visible || document.hidden || motion.matches) node.pause();
      else void node.play().catch(() => setStill(true));
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(node);
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => { observer.disconnect(); motion.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync); node.pause(); };
  }, [entered, safari]);
  return <div className="map-guide" aria-hidden="true">
    <img src={publicAsset("/cognition/guide-poster.png")} alt="" width={360} height={640} style={{ visibility: playing && !still ? "hidden" : "visible" }}/>
    <video ref={video} src={publicAsset(safari ? "/cognition/guide-alpha.mov" : "/cognition/guide-alpha.webm")} className={still ? "guide-still" : ""} muted loop playsInline preload="metadata" poster={publicAsset("/cognition/guide-poster.png")} disablePictureInPicture onPlaying={() => setPlaying(true)} onError={() => setStill(true)} tabIndex={-1}/>
  </div>;
}

function Radar({ selected }: { selected: number }) {
  const point = (index: number, radius: number) => {
    const angle = Math.PI * 2 * index / 4 - Math.PI / 2;
    return `${190 + Math.cos(angle) * radius},${174 + Math.sin(angle) * radius}`;
  };
  return <div className="radar-wrap map-radar">
    <svg viewBox="0 0 380 350" role="img" aria-label="INFJ 四功能顺序示意：Ni 主导、Fe 辅助、Ti 第三、Se 劣势。非实测分数，不代表能力高低。">
      {[32, 64, 96, 128].map(radius => <polygon key={radius} points={[0, 1, 2, 3].map(i => point(i, radius)).join(" ")} fill="none" stroke="#ddd"/>)}
      {[0, 1, 2, 3].map(i => <line key={i} x1="190" y1="174" x2={point(i, 128).split(",")[0]} y2={point(i, 128).split(",")[1]} stroke="#ddd"/>)}
      <polygon points={[120, 95, 68, 40].map((radius, i) => point(i, radius)).join(" ")} fill="#e4e4e4" stroke="#333" strokeWidth="1.5"/>
      {[120, 95, 68, 40].map((radius, i) => <circle key={i} cx={point(i, radius).split(",")[0]} cy={point(i, radius).split(",")[1]} r={i === selected ? 6 : 4} fill={i === selected ? "#111" : "#fff"} stroke="#111"/>)}
      <text x="190" y="22" textAnchor="middle">Ni · 主导</text><text x="340" y="179" textAnchor="middle">Fe · 辅助</text><text x="190" y="329" textAnchor="middle">Ti · 第三</text><text x="38" y="179" textAnchor="middle">Se · 劣势</text>
    </svg>
  </div>;
}

export default function CognitiveMap() {
  const [selected, setSelected] = useState(0);
  const current = cognition[selected];
  return <div className="cognitive-map">
    <section className="panel texture map-atlas" aria-label="INFJ 认知运行地图">
      <div className="map-atlas-heading"><h2>INFJ 认知运行地图</h2><span className="badge" title="类型结构示意，非实测分数，不代表能力高低">类型示意</span></div>
      <div className="map-instruments">
        <Radar selected={selected}/>
        <div className="map-function-switches" role="group" aria-label="选择认知功能">
          {cognition.map((item, i) => <button key={item.key} className={selected === i ? "map-function selected" : "map-function"} onClick={() => setSelected(i)} aria-pressed={selected === i} aria-controls="cognitive-reading">
            <span className="map-function-key">{item.key}</span><span><strong>{item.name}</strong><small>{item.role}</small></span><span aria-hidden="true">›</span>
          </button>)}
        </div>
      </div>
      <div className="map-imprint"><h3>人格印迹</h3><p>你习惯从细微处听见回声，把零散的星光连成自己的地图。心里装着远方，也惦记着身边的人。偶尔，不必急着想透一切——让脚步先触到此刻的土地。</p></div>
      <CosmicGuide/>
    </section>
    <section id="cognitive-reading" className="panel texture map-reading" aria-live="polite" aria-label={`${current.name}功能解读`}>
      <div className="map-reading-intro"><div className="eyebrow">{current.role} / {current.key}</div><h2>{current.name}</h2><p className="lead">{current.plain}</p>
        <img key={current.key} className="map-function-art" src={publicAsset(current.icon)} alt={`${current.name}星云图标`} width={160} height={160}/>
      </div>
      <div className="detail-block"><h3>可能的优势</h3><p>{current.strength}</p></div>
      <div className="detail-block"><h3>需要留意的盲区</h3><p>{current.blind}</p></div>
      <div className="note"><h3>生活中可能这样出现</h3><p>{current.example}</p></div>
      <div className="detail-block"><h3>可以怎样平衡</h3><p>{current.reminder}</p></div>
    </section>
  </div>;
}
