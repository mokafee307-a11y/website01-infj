"use client";
import { useEffect, useRef, useState } from "react";
import { Flashcards, Exploration, Salon, DailySlice, type SavedInsight } from "./PrototypeModules";
import LaunchScreen from "./LaunchScreen";
import BlinkingDots from "./BlinkingDots";
import SplitText from "./SplitText";
import ClickSpark from "./ClickSpark";
import OptionWheel from "./OptionWheel";
const tabs = [
    { id: "map", title: "认知运行地图", description: "了解 INFJ 的内在运行机制" },
    { id: "cards", title: "卡点梳理", description: "从熟悉的生活场景，换一个角度看问题" },
    { id: "explore", title: "自由探索", description: "把一件具体的困惑慢慢说清楚" },
    { id: "salon", title: "奇点会客厅", description: "同一个问题，听见不同的理解" },
] as const;
const cognition = [
    { key: "Ni", name: "内倾直觉", role: "主导功能", plain: "串联线索，看见潜在走向", strength: "善于把零散信息联系起来，形成整体理解和长期构想。", blind: "线索不足时，可能把自己的推测当成已经发生的事实。", example: "对方今天话很少 → 我是不是做错了什么 → 他是不是不想再和我来往了？", reminder: "区分“我观察到了什么”和“我推测了什么”。为同一件事保留不止一种解释。" },
    { key: "Fe", name: "外倾情感", role: "辅助功能", plain: "感受氛围，照顾关系", strength: "留意他人的处境和群体氛围，尝试让沟通与合作更顺畅。", blind: "容易把他人的失望看成自己的责任，忽略自己的意愿。", example: "我已经很累了，但对方一开口求助，我还是先说了“没问题”。", reminder: "理解对方的需要，不等于必须满足它。先确认自己的时间与意愿。" },
    { key: "Ti", name: "内倾思维", role: "第三功能", plain: "追问原因，厘清内部逻辑", strength: "检查解释是否自洽，分辨模糊概念，形成自己的判断。", blind: "想把所有原因都理顺再行动，可能陷入反复分析。", example: "我需要先弄明白为什么自己会拖延，然后才能开始——于是又分析了一晚上。", reminder: "解释暂时不完整，也可以保留一个小问题，去现实中获得新信息。" },
    { key: "Se", name: "外倾感觉", role: "劣势功能", plain: "接触当下，接收直接反馈", strength: "留意身体、环境和眼前发生的事情，让想法与现实重新连接。", blind: "过度关注脑内推演时，可能漏掉身体疲惫与眼前信息。", example: "脑子已经预演了许多结果，却忘了吃饭，也还没问过对方的真实想法。", reminder: "回到一件可以看见、听见或实际确认的小事。劣势不等于缺陷，也不等于没有能力。" },
];
function Radar({ selected, onSelect }: {
    selected: number;
    onSelect: (value: number) => void;
}) {
    const point = (index: number, radius: number) => { const angle = Math.PI * 2 * index / 4 - Math.PI / 2; return `${190 + Math.cos(angle) * radius},${174 + Math.sin(angle) * radius}`; };
    return <div className="radar-wrap">
    <svg viewBox="0 0 380 350" role="img" aria-label="典型 INFJ 四功能顺序示意：Ni 主导、Fe 辅助、Ti 第三、Se 劣势。形状不代表测量值。">
      {[32, 64, 96, 128].map(radius => <polygon key={radius} points={[0, 1, 2, 3].map(i => point(i, radius)).join(" ")} fill="none" stroke="#ddd"/>)}
      {[0, 1, 2, 3].map(i => <line key={i} x1="190" y1="174" x2={point(i, 128).split(",")[0]} y2={point(i, 128).split(",")[1]} stroke="#ddd"/>)}
      <polygon points={[120, 95, 68, 40].map((radius, i) => point(i, radius)).join(" ")} fill="#e4e4e4" stroke="#333" strokeWidth="1.5"/>
      {[120, 95, 68, 40].map((radius, i) => <circle key={i} cx={point(i, radius).split(",")[0]} cy={point(i, radius).split(",")[1]} r={i === selected ? 6 : 4} fill={i === selected ? "#111" : "#fff"} stroke="#111"/>)}
      <text x="190" y="22" textAnchor="middle">Ni · 主导</text><text x="340" y="179" textAnchor="middle">Fe · 辅助</text><text x="190" y="329" textAnchor="middle">Ti · 第三</text><text x="38" y="179" textAnchor="middle">Se · 劣势</text>
    </svg>
    <div className="segmented" aria-label="选择认知功能">{cognition.map((item, i) => <button key={item.key} aria-pressed={selected === i} onClick={() => onSelect(i)}>{item.key}</button>)}</div>
    <p className="hint center">类型结构示意 · 非实测分数 · 不代表能力高低</p>
  </div>;
}
function CognitiveMap() {
    const [selected, setSelected] = useState(0);
    const current = cognition[selected];
    return <div className="map-layout">
    <aside className="panel texture function-list"><p className="eyebrow">典型功能顺序</p>{cognition.map((item, i) => <button key={item.key} className={`function-item ${selected === i ? "selected" : ""}`} onClick={() => setSelected(i)} aria-pressed={selected === i}><span className="function-key">{item.key}</span><span><strong>{item.name}</strong><small>{item.role}</small></span><span aria-hidden="true">›</span></button>)}<p className="hint">这是一种理解自己的参考语言，不是对所有 INFJ 的统一描述。</p></aside>
    <section className="panel texture radar-panel"><div className="panel-heading"><h2>INFJ 认知运行地图</h2><span className="badge">类型示意</span></div><Radar selected={selected} onSelect={setSelected}/><div className="note">先形成整体理解，再关注关系与逻辑，借助当下经验校准。实际使用会因人、情境和成长经历而不同。</div></section>
    <section className="panel texture function-detail" aria-live="polite"><div className="eyebrow">{current.role} / {current.key}</div><h2>{current.name}</h2><p className="lead">{current.plain}</p><div className="detail-block"><h3>可能的优势</h3><p>{current.strength}</p></div><div className="detail-block"><h3>需要留意的盲区</h3><p>{current.blind}</p></div><div className="note"><h3>生活中可能这样出现</h3><p>{current.example}</p></div><div className="detail-block"><h3>可以怎样平衡</h3><p>{current.reminder}</p></div></section>
    <div className="map-footer"><span>认知功能不是医学诊断，也不决定一个人的能力与价值。</span><details><summary>其他四种功能怎么看？</summary><p>Ne：探索多种可能；Fi：辨认个人价值；Te：组织外部任务；Si：参照已有经验。它们并非 INFJ 所没有的能力，本图只呈现常见的四功能顺序，不为“八维强弱”编造分数。</p></details></div>
  </div>;
}
export default function Prototype() {
    const [active, setActive] = useState<string>("map");
    const pendingNavigation = useRef<{ id: string; until: number } | null>(null);
    const header = useRef<HTMLElement>(null);
    const [saved, setSaved] = useState<SavedInsight[]>([]);
    const onSave = (item: SavedInsight) => setSaved(items => items.some(entry => entry.id === item.id) ? items.map(entry => entry.id === item.id ? item : entry) : [...items, item]);
    useEffect(() => {
        let frame = 0;
        const sync = () => {
            frame = 0;
            const navHeight = header.current?.offsetHeight ?? 62;
            document.documentElement.style.setProperty("--section-nav-height", `${navHeight}px`);
            const pending = pendingNavigation.current;
            if (pending && performance.now() < pending.until) {
                const top = document.getElementById(pending.id)?.getBoundingClientRect().top ?? 0;
                if (Math.abs(top - navHeight - 20) > 8) return;
            }
            pendingNavigation.current = null;
            const line = navHeight + Math.min(160, window.innerHeight * 0.2);
            let current: string = tabs[0].id;
            for (const tab of tabs) {
                if ((document.getElementById(tab.id)?.getBoundingClientRect().top ?? Infinity) <= line) current = tab.id;
            }
            if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3) current = "salon";
            setActive(current);
        };
        const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        const observer = new ResizeObserver(schedule);
        const workspace = document.getElementById("workspace");
        if (workspace) observer.observe(workspace);
        if (header.current) observer.observe(header.current);
        schedule();
        return () => { window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); observer.disconnect(); cancelAnimationFrame(frame); };
    }, []);
    function navigate(index: number) {
        const id = tabs[index].id;
        pendingNavigation.current = { id, until: performance.now() + 1100 };
        setActive(id);
        window.history.replaceState(null, "", `#${id}`);
        document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    }
    return <ClickSpark><LaunchScreen><div className="app-shell">
    <BlinkingDots />
    <a href="#workspace" className="skip-link">跳到模块内容</a>
    <header ref={header} className="site-header"><div className="brand"><span className="brand-mark" aria-hidden="true">I</span><strong>INFJ漫游飞船</strong></div>
    <div className="header-actions"><DailySlice saved={saved}/></div></header>
    <OptionWheel items={tabs} selectedIndex={tabs.findIndex(tab => tab.id === active)} onChange={navigate} />
    <main id="workspace" tabIndex={-1}>{tabs.map(tab => <section key={tab.id} id={tab.id} aria-labelledby={`heading-${tab.id}`} className="module-panel scroll-section">
      <div className="workspace-heading"><div><SplitText id={`heading-${tab.id}`} text={tab.id === "map" ? "绿老头认知运行地图" : tab.title}/><p>{tab.description}</p></div></div>
      {tab.id === "map" ? <CognitiveMap /> : tab.id === "cards" ? <Flashcards saved={saved} onSave={onSave}/> : tab.id === "explore" ? <Exploration saved={saved} onSave={onSave}/> : <Salon saved={saved} onSave={onSave}/>}
    </section>)}
    </main>
  </div></LaunchScreen></ClickSpark>;
}
