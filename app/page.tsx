"use client";

import { useEffect, useMemo, useState } from "react";

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

const functions = [
  { key: "Ni", name: "内倾直觉", role: "主导 · Pattern", level: 92, healthy: "洞察模式，形成长期判断", overload: "过度预演，把推测当成事实", switchTo: "Se", color: "#245b41" },
  { key: "Fe", name: "外倾情感", role: "辅助 · Relation", level: 78, healthy: "理解他人，建立关系感知", overload: "过度共情，为他人情绪负责", switchTo: "Ti", color: "#548468" },
  { key: "Ti", name: "内倾思维", role: "第三 · Logic", level: 67, healthy: "独立判断，建立内部逻辑", overload: "无限分析，困在自洽闭环", switchTo: "Se", color: "#7da08a" },
  { key: "Se", name: "外倾感觉", role: "劣势 · Reality", level: 38, healthy: "接触现实，用反馈校准判断", overload: "忽略身体与当下，现实断联", switchTo: "ACT", color: "#aac4b2" },
];

const radarDimensions = [
  { key: "Ni", name: "洞察与预判", score: 90 },
  { key: "Fe", name: "共情与关系", score: 78 },
  { key: "Ti", name: "分析与逻辑", score: 65 },
  { key: "Se", name: "行动与当下", score: 38 },
  { key: "Ne", name: "发散与可能", score: 48 },
  { key: "Fi", name: "价值与感受", score: 60 },
  { key: "Te", name: "效率与执行", score: 42 },
  { key: "Si", name: "经验与稳定", score: 50 },
];

function RadarChart() {
  const center = 210;
  const radius = 145;
  const point = (index: number, ratio: number) => {
    const angle = -Math.PI / 2 + index * (Math.PI / 4);
    return [center + Math.cos(angle) * radius * ratio, center + Math.sin(angle) * radius * ratio];
  };
  const polygon = (ratio: number) => radarDimensions.map((_, index) => point(index, ratio).join(",")).join(" ");
  const dataPolygon = radarDimensions.map((item, index) => point(index, item.score / 100).join(",")).join(" ");

  return (
    <div className="radar-wrap">
      <svg className="radar-chart" viewBox="0 0 420 420" role="img" aria-label="典型 INFJ 八维认知功能雷达示意图">
        {[1, .75, .5, .25].map((ratio) => <polygon key={ratio} points={polygon(ratio)} className="radar-grid" />)}
        {radarDimensions.map((_, index) => {
          const [x, y] = point(index, 1);
          return <line key={index} x1={center} y1={center} x2={x} y2={y} className="radar-axis" />;
        })}
        <polygon points={dataPolygon} className="radar-data" />
        {radarDimensions.map((item, index) => {
          const [x, y] = point(index, item.score / 100);
          return <circle key={item.key} cx={x} cy={y} r="4" className="radar-dot" />;
        })}
        {radarDimensions.map((item, index) => {
          const [x, y] = point(index, 1.17);
          return <g key={item.key} transform={`translate(${x},${y})`}><text className="radar-label-key" textAnchor="middle" y="-2">{item.key}</text><text className="radar-label-name" textAnchor="middle" y="13">{item.name}</text></g>;
        })}
      </svg>
      <div className="radar-center"><b>INFJ</b><span>FUNCTIONS</span></div>
    </div>
  );
}

export default function Home() {
  const [selected, setSelected] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [experiment, setExperiment] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [customIssue, setCustomIssue] = useState("");
  const [customDiagnosis, setCustomDiagnosis] = useState<Mode | null>(null);
  const current = useMemo(() => modes.find((mode) => mode.id === selected), [selected]);

  const jumpTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const diagnoseCustomIssue = () => {
    const text = customIssue.trim();
    if (!text) return;
    const relationWords = /别人|关系|朋友|同事|领导|伴侣|拒绝|讨好|理解|喜欢|不爽/;
    const actionWords = /行动|开始|拖延|工作|求职|转行|选择|决定|未来|机会|要不要|应该/;
    const perfectWords = /完美|做好|标准|出错|失败|不够好|准备好/;
    const approvalWords = /点赞|流量|数据|认可|看法|眼光|丢脸|证明|自证/;
    const matched = approvalWords.test(text) ? modes[2]
      : relationWords.test(text) ? modes[4]
      : perfectWords.test(text) ? modes[5]
      : actionWords.test(text) ? modes[1]
      : modes[0];
    setSelected(null);
    setCustomDiagnosis(matched);
  };

  useEffect(() => {
    const updateActiveSection = () => {
      const functionsTop = document.getElementById("functions")?.getBoundingClientRect().top ?? Infinity;
      const labTop = document.getElementById("lab")?.getBoundingClientRect().top ?? Infinity;
      if (labTop <= 150) setActiveSection("lab");
      else if (functionsTop <= 150) setActiveSection("functions");
      else setActiveSection("dashboard");
    };
    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveSection);
  }, []);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="认知操作系统首页"><span className="brand-mark">N</span><span>COGNITIVE OS</span></a>
        <nav className="topnav" aria-label="主导航">
          <button type="button" className={activeSection === "dashboard" ? "active" : ""} onClick={() => jumpTo("dashboard")}>驾驶舱</button>
          <button type="button" className={activeSection === "functions" ? "active" : ""} onClick={() => jumpTo("functions")}>八维地图</button>
          <button type="button" className={activeSection === "lab" ? "active" : ""} onClick={() => jumpTo("lab")}>现实实验室</button>
        </nav>
        <div className="status-dot"><span /> SYSTEM ONLINE</div>
      </header>

      <section className="hero" id="top">
        <div className="hero-glow" aria-hidden="true">
          <div className="sage-orbit"><i /><i /><i /></div>
          <img className="sage-asset" src="/green-sage-hero.png" alt="" />
          <span className="sage-signature">绿老头 · OBSERVE / THINK / ACT</span>
        </div>
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
            <button key={mode.id} className={`mode-card ${selected === mode.id ? "selected" : ""}`} onClick={() => { setSelected(mode.id); setCustomDiagnosis(null); }} aria-pressed={selected === mode.id}>
              <span className="mode-icon">{mode.icon}</span>
              <span className="mode-content"><b>{mode.title}</b><small>{mode.short}</small></span>
              <span className="mode-arrow">↗</span>
            </button>
          ))}
        </div>

        <div className="custom-diagnosis">
          <div className="custom-copy"><span>CUSTOM INPUT</span><h3>这 6 个都不像你？</h3><p>不用迁就选项。直接写下此刻真正困扰你的事情，越具体越好。</p></div>
          <div className="custom-form">
            <textarea value={customIssue} onChange={(e) => { setCustomIssue(e.target.value); setCustomDiagnosis(null); }} placeholder="例如：最近有一件事我总在反复想，明知道继续想也不会马上有答案，但脑子就是停不下来……" />
            <button type="button" disabled={!customIssue.trim()} onClick={diagnoseCustomIssue}>诊断这个问题 <span>↗</span></button>
          </div>
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
        {customDiagnosis && (
          <div className="diagnosis custom-result" role="status">
            <div className="diag-label"><span /> CUSTOM LOOP · {customDiagnosis.function}</div>
            <div className="custom-question">“{customIssue.trim()}”</div>
            <div className="diag-grid">
              <div><small>这个问题里，最值得警惕的认知回路</small><p>{customDiagnosis.loop}</p></div>
              <div className="diag-action"><small>先别解决整个人生，只做下一步</small><p>{customDiagnosis.action}</p></div>
            </div>
            <p className="diagnosis-note">这不是心理或医学诊断，而是用认知功能框架帮你找到一个可以开始行动的切口。</p>
          </div>
        )}
      </section>

      <section className="functions-section" id="functions">
        <div className="section-head functions-head">
          <div><span className="section-no">02</span><h2>我的认知运行地图</h2></div>
          <p>不排名能力。观察每个功能如何帮你，以及如何困住你。</p>
        </div>
        <div className="function-layout">
          <div className="radar-panel">
            <div className="radar-title"><span>8 FUNCTIONS / OVERVIEW</span><h3>典型 INFJ 的八维倾向</h3><p>越靠外代表越常被调用。它不是能力高低，而是你的大脑更习惯从哪里处理世界。</p></div>
            <RadarChart />
            <div className="radar-summary"><div><small>CORE STRENGTH</small><b>Ni · 洞察模式</b><span>擅长从复杂信息里找到方向</span></div><div><small>GROWTH EDGE</small><b>Se · 回到现实</b><span>用行动与感官反馈校准预判</span></div></div>
          </div>
          <div className="function-list">
            {functions.map((fn) => (
              <article className="function-row" key={fn.key}>
                <div className="fn-key" style={{borderColor:fn.color}}><b>{fn.key}</b><small>{fn.role}</small></div>
                <div className="fn-body">
                  <div className="fn-meter"><span style={{width:`${fn.level}%`, background:fn.color}} /></div>
                  <div className="fn-states"><p><small>NORMAL</small>{fn.healthy}</p><p><small>OVERLOAD</small>{fn.overload}</p></div>
                </div>
                <div className="fn-switch"><small>SWITCH</small><b>→ {fn.switchTo}</b></div>
              </article>
            ))}
            <p className="map-note">* 数值不是心理测量结果，只用于表达你当前的功能使用倾向。真正重要的是「什么时候切换」。</p>
          </div>
        </div>
      </section>

      <section className="loops-section">
        <div className="section-head">
          <div><span className="section-no">03</span><h2>三个需要警惕的回路</h2></div>
          <p>当你能给循环命名，就不必再完全相信循环里的每个念头。</p>
        </div>
        <div className="loop-cards">
          <article><span>LOOP A · THINKING</span><h3>预演替代行动</h3><p>Ni 预演 <b>→</b> 完美主义 <b>→</b> 等待确定 <b>→</b> 没有反馈 <b>↺</b></p><small>EXIT / 做一个 70 分版本，接触一次真实反馈</small></article>
          <article><span>LOOP B · RELATION</span><h3>理解变成自证</h3><p>Fe 感知 <b>→</b> 担心误解 <b>→</b> 反复解释 <b>→</b> 自我消耗 <b>↺</b></p><small>EXIT / 允许误解。让结果承担解释工作</small></article>
          <article><span>LOOP C · EXPRESSION</span><h3>表达变成表演</h3><p>真实表达 <b>→</b> 数据评分 <b>→</b> 刷新反馈 <b>→</b> 为流量改观点 <b>↺</b></p><small>EXIT / 流量优化表达，不生产观点</small></article>
        </div>
      </section>

      <section className="lab-section" id="lab">
        <div className="lab-grid">
          <div className="lab-intro">
            <span className="section-no">04 / REALITY LAB</span>
            <h2>别再多想一轮。<br/><em>做一个现实实验。</em></h2>
            <p>把一个抽象困惑变成：假设、最小行动、现实证据、更新判断。现实不是思考的敌人，是思考的数据源。</p>
            <div className="lab-principle"><b>30%</b><span>允许不确定<br/><small>START BEFORE CERTAINTY</small></span></div>
          </div>
          <div className="lab-console">
            <div className="console-top"><span>NEW EXPERIMENT</span><i>● READY</i></div>
            <label htmlFor="question">现在有什么问题，在你脑子里循环很久了？</label>
            <textarea id="question" value={question} onChange={(e)=>{setQuestion(e.target.value);setExperiment(false)}} placeholder="例如：我是不是应该转去 AI 行业？" />
            {!experiment ? (
              <button className="generate-button" disabled={!question.trim()} onClick={()=>setExperiment(true)}>把它变成一个现实实验 <span>↗</span></button>
            ) : (
              <div className="experiment-result">
                <div><small>01 / HYPOTHESIS</small><p>暂时不要证明“{question}”对不对。先假设其中一个方向值得验证。</p></div>
                <div><small>02 / MINIMUM ACTION</small><p>在 48 小时内，做一个可以接触真实的人、岗位、作品或结果的最小动作。</p></div>
                <div><small>03 / EVIDENCE</small><p>只记录你实际看到的反馈。把“我觉得”与“现实发生”分开写。</p></div>
                <div className="result-last"><small>04 / UPDATE</small><p>根据新证据更新判断，然后进入下一轮。只复盘一次。</p></div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="manifesto">
        <span>CORE PRINCIPLE 001</span>
        <blockquote>“实践不是思考的对立面。<br />它是让思考获得现实坐标的方式。”</blockquote>
        <p>允许 30% 的不确定就开始 · 迭代速度 &gt; 首稿质量 · 行动 → 一次复盘 → 下一次行动</p>
      </section>
      <footer><span>COGNITIVE OS · V0.1</span><p>不是定义自己。是持续更新自己。</p><a href="#top">BACK TO TOP ↑</a></footer>
    </main>
  );
}
