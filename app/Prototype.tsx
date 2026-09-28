"use client";
import { useEffect, useRef, useState } from "react";
import { Flashcards, Exploration, Salon, DailySlice, type SavedInsight } from "./PrototypeModules";
import LaunchScreen from "./LaunchScreen";
import BlinkingDots from "./BlinkingDots";
import SplitText from "./SplitText";
import ClickSpark from "./ClickSpark";
import OptionWheel from "./OptionWheel";
import CognitiveMap from "./CognitiveMap";
import CosmicFooter from "./CosmicFooter";
const tabs = [
    { id: "map", title: "运行地图", description: "了解 INFJ 的内在运行机制" },
    { id: "salon", title: "星光会客厅", description: "同一个问题，听见不同的理解" },
    { id: "cards", title: "迷茫之境", description: "从熟悉的生活场景，换一个角度看问题" },
    { id: "explore", title: "自由之海", description: "把一件具体的困惑慢慢说清楚" },
] as const;
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
            if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3) current = tabs[tabs.length - 1].id;
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
    <strong className="header-section-title" aria-hidden="true">{tabs.find(tab => tab.id === active)?.title}</strong>
    <div className="header-actions"><DailySlice saved={saved}/></div></header>
    <OptionWheel items={tabs} selectedIndex={tabs.findIndex(tab => tab.id === active)} onChange={navigate} />
    <main id="workspace" tabIndex={-1}>{tabs.map(tab => <section key={tab.id} id={tab.id} aria-labelledby={`heading-${tab.id}`} className="module-panel scroll-section">
      <div className="workspace-heading"><div><SplitText id={`heading-${tab.id}`} text={tab.title}/><p>{tab.description}</p></div></div>
      {tab.id === "map" ? <CognitiveMap /> : tab.id === "cards" ? <Flashcards saved={saved} onSave={onSave}/> : tab.id === "explore" ? <Exploration saved={saved} onSave={onSave}/> : <Salon saved={saved} onSave={onSave}/>}
    </section>)}
    </main>
    <CosmicFooter />
  </div></LaunchScreen></ClickSpark>;
}
