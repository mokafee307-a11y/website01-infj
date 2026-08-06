"use client";

import { useMemo, useState } from "react";

type Mode = {
  id: string;
  icon: string;
  title: string;
  short: string;
  loop: string;
  action: string;
  function: string;
};

const modes: Mode[] = [
  { id: "overthink", icon: "◎", title: "我又开始想太多了", short: "脑内预演很多，但现实信息很少。", loop: "Ni 过度模拟 → 等待确定 → 缺少反馈 → 继续模拟", action: "把你最担心的判断写成一个可验证的假设，今天只找一条现实证据。", function: "Ni → Se" },
  { id: "decision", icon: "↗", title: "我迟迟无法做决定", short: "不是信息不足，是想一次选到最优解。", loop: "寻找最优解 → 补充信息 → 新变量出现 → 再次比较", action: "接受 30% 的不确定。选一个可逆动作，先走 48 小时。", function: "Ni → Se" },
  { id: "approval", icon: "◌", title: "我太在意别人怎么看我", short: "外部评价正在进入你的自我评价系统。", loop: "Fe 捕捉反应 → 开始解释 → 寻求理解 → 自我消耗", action: "先问：这个人的评价是否有资格影响我的判断？理解别人，不等于服从别人。", function: "Fe → Ti" },
  { id: "stuck", icon: "→", title: "我知道该做什么，但没行动", short: "理解已经足够，缺的是一次现实接触。", loop: "想清楚 → 继续优化 → 等状态 → 行动继续延后", action: "把动作缩小到 20 分钟能完成的版本。完成之后，只复盘一次。", function: "Ni → Se" },
  { id: "please", icon: "◇", title: "我又在讨好别人", short: "共情能力越界成了替别人负责。", loop: "感知需求 → 自动承担 → 压抑不满 → 关系消耗", action: "延迟回应。先判断：这是我的责任，还是我对冲突的回避？", function: "Fe → Ti" },
  { id: "perfect", icon: "△", title: "我陷入完美主义了", short: "你正在用首稿质量换取迭代速度。", loop: "高标准 → 不愿暴露半成品 → 推迟 → 标准继续升高", action: "今天只交付 70 分版本。把剩下 30 分留给真实反馈。", function: "Ni/Ti → Se" },
];

export default function Home() {
  const [selected, setSelected] = useState<string | null>(null);
  const current = useMemo(() => modes.find((mode) => mode.id === selected), [selected]);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="认知操作系统首页"><span className="brand-mark">N</span><span>COGNITIVE OS</span></a>
        <nav className="topnav" aria-label="主导航">
          <a className="active" href="#dashboard">驾驶舱</a>
          <a href="#functions">八维地图</a>
          <a href="#lab">现实实验室</a>
        </nav>
        <div className="status-dot"><span /> SYSTEM ONLINE</div>
      </header>

      <section className="hero" id="top">
        <div className="hero-glow" />
        <div className="eyebrow"><span>INFJ</span> / PERSONAL COGNITIVE SYSTEM</div>
        <h1>别急着想明白。<br /><em>先看看，你现在是怎么运行的。</em></h1>
        <p className="hero-copy">把脑内循环变成可以观察、验证和行动的系统。<br />不是成为“更好的 INFJ”，而是更清醒地使用自己。</p>
        <a className="start-button" href="#dashboard"><span>开始一次自检</span><b>↓</b></a>
        <div className="hero-meta">
          <span>MODE <b>SELF OBSERVATION</b></span>
          <span>PRINCIPLE <b>ACTION &gt; SIMULATION</b></span>
          <span>VERSION <b>0.1 / GROWING</b></span>
        </div>
      </section>

      <section className="dashboard" id="dashboard">
        <div className="section-head">
          <div><span className="section-no">01</span><h2>你现在，卡在哪？</h2></div>
          <p>不分析人格。先识别此刻正在运行的模式。</p>
        </div>
        <div className="mode-grid">
          {modes.map((mode) => (
            <button key={mode.id} className={`mode-card ${selected === mode.id ? "selected" : ""}`} onClick={() => setSelected(mode.id)} aria-pressed={selected === mode.id}>
              <span className="mode-icon">{mode.icon}</span>
              <span className="mode-content"><b>{mode.title}</b><small>{mode.short}</small></span>
              <span className="mode-arrow">↗</span>
            </button>
          ))}
        </div>

        {current && (
          <div className="diagnosis" role="status">
            <div className="diag-label"><span /> CURRENT LOOP · {current.function}</div>
            <div className="diag-grid">
              <div><small>你可能正在经历</small><p>{current.loop}</p></div>
              <div className="diag-action"><small>现在不要继续想，去做</small><p>{current.action}</p></div>
            </div>
          </div>
        )}
      </section>

      <section className="manifesto">
        <span>CORE PRINCIPLE 001</span>
        <blockquote>“实践不是思考的对立面。<br />它是让思考获得现实坐标的方式。”</blockquote>
        <p>允许 30% 的不确定就开始 · 迭代速度 &gt; 首稿质量 · 行动 → 一次复盘 → 下一次行动</p>
      </section>
    </main>
  );
}
