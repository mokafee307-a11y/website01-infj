"use client";
import { useEffect, useRef, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import { examples, sampleReports, defaultQuestion, defaultQuestionTitle, thinkers, getExampleId, hasCrisisLanguage, type ExampleId } from "./prototype-data";
import ThinkerRail from "./ThinkerRail";
import LatticeLoader from "./LatticeLoader";
import { portraitImage } from "./portrait-images";
export { default as Flashcards } from "./StackedCards";
export type SavedInsight = {
    id: string;
    source: string;
    title: string;
    text: string;
};
type SaveProps = {
    saved: SavedInsight[];
    onSave: (item: SavedInsight) => void;
};
type Report = {
    id: string;
    question: string;
    answer: string;
    sample: ExampleId;
    safety: boolean;
    time: string;
    correction: string;
};
function SavedButton({ item, saved, onSave }: SaveProps & {
    item: SavedInsight;
}) {
    const previous = saved.find(entry => entry.id === item.id);
    const added = previous?.text === item.text;
    return <button className="text-button" onClick={() => onSave(item)} disabled={added}>{added ? "已加入今日切片" : previous ? "更新今日切片" : "加入今日切片"}</button>;
}
export function SafetySupport() {
    return <section className="safety-box" role="status"><span className="badge">优先照顾安全</span><h2>先暂停分析，让一个真实的人陪着你。</h2><p>这段表达可能涉及人身安全。我们先不继续认知报告或人物演绎。</p><ol><li>如果现在有立即危险、已经受伤或服用了可能有害的物质，请立即联系当地急救服务，或请身边的人协助求助。</li><li>尽量远离可能伤害自己的物品和地点，去一个有人陪伴的安全空间。</li><li>联系一个可信任的人，可以直接说：“我现在很难受，需要你陪我，帮我一起获得支持。”</li></ol><p>如果你是在谈论他人或引用作品，也可以补充说明。原型采用保守的关键词提示，可能误判，不能替代专业风险评估或紧急救援。</p></section>;
}
export function Exploration({ saved, onSave }: SaveProps) {
    const [reports, setReports] = useState<Report[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [question, setQuestion] = useState(defaultQuestion);
    const [answer, setAnswer] = useState("");
    const [pending, setPending] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [correcting, setCorrecting] = useState(false);
    const [correction, setCorrection] = useState("");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resultRef = useRef<HTMLElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const current = reports.find(report => report.id === selected);
    useEffect(() => () => { if (timer.current)
        clearTimeout(timer.current); }, []);
    useEffect(() => { if (selected && resultRef.current && !resultRef.current.closest("[hidden]"))
        resultRef.current.focus({ preventScroll: true }); }, [selected]);
    function startNew() { setSelected(null); setPending(false); setQuestion(""); setAnswer(""); setError(""); setCorrecting(false); inputRef.current?.focus(); }
    function generate(skip = false) {
        if (busy)
            return;
        const q = question.trim();
        if (!q) {
            setError("先写下一件你想梳理的事情。");
            inputRef.current?.focus();
            return;
        }
        const safety = hasCrisisLanguage(q + " " + answer);
        if (!safety && !skip && !pending && q.length < 40) {
            setPending(true);
            setError("");
            return;
        }
        if (pending && !skip && !answer.trim() && !safety) {
            setError("可以补充一个片段，也可以直接跳过。");
            return;
        }
        setBusy(true);
        setError("");
        timer.current = setTimeout(() => {
            try {
                const report: Report = { id: crypto.randomUUID(), question: q, answer: skip ? "" : answer.trim(), sample: getExampleId(q), safety, time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }), correction: "" };
                setReports(items => [report, ...items]);
                setSelected(report.id);
                setPending(false);
                setCorrecting(false);
                setBusy(false);
            }
            catch {
                setBusy(false);
                setError("这次没能准备好报告，输入已保留，请再试一次。");
            }
        }, 450);
    }
    const content = current ? sampleReports[current.sample] : null;
    return <div className="exploration-layout">
    <aside className="panel texture history-panel"><button className="primary full-width" onClick={startNew} disabled={busy}>＋ 新建问题</button><div className="panel-heading history-heading"><h2>本次咨询</h2><span className="badge">{reports.length} 条</span></div><div className="history-list">{reports.length === 0 ? <p className="history-empty">还没有咨询记录。<br />生成的报告会出现在这里。</p> : reports.map(report => <button key={report.id} className={`history-item ${report.id === selected ? "selected" : ""}`} disabled={busy} onClick={() => { setSelected(report.id); setCorrecting(false); }}><strong>{report.question}</strong><span>{report.time} · {report.safety ? "安全支持" : "报告已生成"}</span></button>)}</div></aside>
    <div className="exploration-main">{!current ? <section className="panel texture input-panel"><div className="panel-heading"><h2>从一件具体的事情开始</h2></div><p className="intro-copy">发生了什么？你如何理解它？又有什么让你犹豫？不需要先组织得很完整。</p><div className="example-row"><span className="hint">体验样例</span>{examples.map(example => <button key={example.id} disabled={busy} onClick={() => { setQuestion(example.question); setAnswer(""); setPending(false); setError(""); }}>{example.title}</button>)}</div><label className="field-label" htmlFor="exploration-question">想梳理的问题</label><textarea id="exploration-question" ref={inputRef} value={question} onChange={event => { setQuestion(event.target.value); setPending(false); setAnswer(""); setError(""); }} disabled={busy} maxLength={2000} placeholder="例如：同事临时让我帮忙，我不想答应，却又担心拒绝会影响关系……"/><div className="input-meta"><span>避免填写姓名、联系方式等身份信息。</span><span>{question.length}/2000</span></div>
      {pending && <div className="clarify-box"><span className="badge">补充一个细节 · 可跳过</span><label className="field-label" htmlFor="clarification">最近一次出现这种感受时，具体发生了什么？你当时做了什么？</label><textarea id="clarification" value={answer} onChange={event => { setAnswer(event.target.value); setError(""); }} maxLength={1200} disabled={busy} placeholder="只说一个片段就好。"/></div>}
      {error && <p className="error-text" role="alert">{error}</p>}<div className="form-actions"><span className="hint">信息足够直接生成，不足时简短追问。</span><div className="button-row">{pending && <button onClick={() => generate(true)} disabled={busy}>跳过，直接生成</button>}<button className="primary" onClick={() => generate()} disabled={busy || !question.trim()}>{busy ? <span className="ai-thinking-label"><ThinkingOrb state="weaving" size={20} speed={0.9} theme="light" color="#102b2b" aria-hidden="true"/><span>正在整理…</span></span> : pending ? "补充并生成报告" : "生成认知拆解报告"}</button></div></div></section> : <section className="panel texture report-panel" ref={resultRef} tabIndex={-1} aria-label="认知拆解报告"><div className="panel-heading"><span className="eyebrow">本次咨询 / {current.time}</span><button onClick={startNew}>新建问题</button></div><div className="original-question"><h3>你提出的问题</h3><p>{current.question}</p>{current.answer && <><h3>你的补充</h3><p>{current.answer}</p></>}</div>{current.safety ? <SafetySupport /> : content && <><div className="report-title"><span className="badge">{current.sample === "custom" ? "报告结构示例" : "参考样例"}</span><h2>{content.title}</h2><p className="hint">系统推测需要你的确认；不贴诊断标签，不生成个人认知分数。</p></div><div className="cognitive-flow" aria-label="事件、解释、感受、应对和反馈的关系">{["事件", "解释", "感受", "应对", "反馈"].map((label, index) => <div key={label}><span>{label}</span><p>{content.loop[index]}</p></div>)}</div><div className="report-sections">{[["01", "发生了什么", "事实整理", content.facts], ["02", "可能卡在哪里", "待确认的理解", content.hypothesis], ["03", "你在保护什么", "需要与现实责任", content.needs], ["04", "还有什么解释", "信息缺口", content.alternative], ["05", "接下来可以怎样", "可选，不是任务", content.next]].map(([number, title, caption, body]) => <div className="report-block" key={number}><div className="report-block-title"><h3>{title}</h3><small>{caption}</small></div><p>{body}</p></div>)}</div><details className="lens-detail"><summary>INFJ 认知功能参考视角</summary><p>{content.lens}</p></details><div className="report-actions"><button onClick={() => { setCorrecting(!correcting); setCorrection(current.correction); }}>这不符合我，补充说明</button><SavedButton item={{ id: current.id, source: "自由之海", title: content.title, text: `演示报告，非实时 AI 分析\n我的问题：${current.question}\n${current.answer ? `我的补充：${current.answer}\n` : ""}${content.hypothesis}\n可以继续观察：${content.next}${current.correction ? `\n我的修正：${current.correction}` : ""}` }} saved={saved} onSave={onSave}/></div>{correcting && <div className="clarify-box"><label className="field-label" htmlFor="report-correction">哪些地方与你的经历不符？</label><textarea id="report-correction" value={correction} onChange={event => setCorrection(event.target.value)} maxLength={1200}/><div className="form-actions"><span className="hint">补充将保存在这份报告中。</span><button onClick={() => { setReports(items => items.map(item => item.id === current.id ? { ...item, correction: correction.trim() } : item)); setCorrecting(false); }} disabled={!correction.trim()}>保存补充</button></div></div>}{current.correction && <div className="note correction-note"><h3>我的修正</h3><p>{current.correction}</p></div>}</>}</section>}</div>
  </div>;
}
type SalonRound = {
    id: string;
    question: string;
    people: string[];
    safety: boolean;
    isDefault: boolean;
};
function PersonAvatar({ id, name }: { id: string; name: string }) {
    return <span className="avatar-placeholder"><img src={portraitImage(id)} alt={name + "肖像"} width={42} height={52} /></span>;
}
export function Salon({ saved, onSave }: SaveProps) {
    const [selected, setSelected] = useState<string[]>(["jung", "hesse", "frankl"]);
    const [inRoom, setInRoom] = useState(false);
    const [question, setQuestion] = useState(defaultQuestion);
    const [rounds, setRounds] = useState<SalonRound[]>([]);
    const [pending, setPending] = useState<SalonRound | null>(null);
    const [error, setError] = useState("");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latest = useRef<HTMLDivElement>(null);
    const loading = useRef<HTMLDivElement>(null);
    const busy = pending !== null;
    const people = thinkers.filter(person => selected.includes(person.id));
    useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
    useEffect(() => {
        const target = pending ? loading.current : latest.current;
        if (inRoom && target && !target.closest("[hidden]")) {
            target.scrollIntoView({ block: "start", behavior: "instant" });
        }
    }, [pending, rounds.length, inRoom]);
    function toggle(id: string) { setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]); }
    function send() {
        if (timer.current || busy || !question.trim() || !people.length) return;
        setError("");
        try {
            const q = question.trim();
            const round: SalonRound = {
                id: crypto.randomUUID(), question: q, people: [...selected],
                safety: hasCrisisLanguage(q), isDefault: q === defaultQuestion,
            };
            // Safety support should never wait for the presentation animation.
            if (round.safety) {
                setRounds(items => [...items, round]);
                setQuestion("");
                return;
            }
            setPending(round);
            timer.current = setTimeout(() => {
                setRounds(items => [...items, round]);
                setQuestion("");
                setPending(null);
                timer.current = null;
            }, 1400);
        } catch {
            setPending(null);
            setError("这次没能准备好回复，问题仍保留，请再试一次。");
        }
    }
    if (!inRoom)
        return <div className="salon-selection"><ThinkerRail selected={selected} toggle={toggle}/><aside className="panel texture selection-panel"><h2>本次邀请</h2><p className="hint">已选择 {selected.length} 位</p><div className="guest-list">{people.length ? people.map(person => <div key={person.id}><span>{person.name}</span><button onClick={() => toggle(person.id)} aria-label={"移除" + person.name}>×</button></div>) : <p className="hint">先选一位你想听听的人。</p>}</div><button className="primary full-width" disabled={!people.length} onClick={() => setInRoom(true)}>进入会客厅{people.length ? "（" + people.length + "）" : ""}</button><div className="note"><h3>分别回答，不自动辩论</h3><p>每个人从自己的思想视角回应同一问题。</p></div><p className="hint">历史人物的 INFJ 类型属于公开推测，并非已证实身份。回复为思想演绎，不是本人言论。</p></aside></div>;
    return <div className="salon-room">
        <aside className="panel texture room-sidebar">
            <button className="full-width" onClick={() => setInRoom(false)} disabled={busy}>← 调整邀请人物</button>
            <h2>本次在场 · {people.length} 位</h2>
            {people.map(person => <div className="room-person" key={person.id}>
                <PersonAvatar id={person.id} name={person.name}/>
                <div><strong>{person.name}</strong><small>{person.angle}</small></div>
            </div>)}
            <div className="note">每轮问题独立回答，不会自动串联自由之海中的内容，也不会让人物彼此辩论。</div>
        </aside>
        <section className="panel texture conversation-panel">
            <div className="panel-heading"><h2>一个问题，不同的理解</h2></div>
            <div className="conversation-scroll">
                {rounds.length === 0 && !busy && <div className="conversation-empty"><h3>想从什么话题开始？</h3><p>默认问题：{defaultQuestionTitle}。</p><p className="hint">可以直接发送下方问题，开启对话。</p></div>}
                {rounds.map((round, index) => <div className="conversation-round" key={round.id} ref={index === rounds.length - 1 ? latest : null}>
                    <div className="user-message"><span className="eyebrow">我的问题</span><p>{round.question}</p></div>
                    {round.safety ? <SafetySupport /> : !round.isDefault ? <div className="note">
                        <h3>问题已保留，这个话题还没有预设回复。</h3><p>可以先尝试下方话题，听听他们各自的理解。</p>
                        <button onClick={() => setQuestion(defaultQuestion)} disabled={busy}>填入默认问题，体验分别回答</button>
                    </div> : thinkers.filter(person => round.people.includes(person.id)).map(person => <article className="persona-response" key={person.id}>
                        <div className="response-header"><PersonAvatar id={person.id} name={person.name}/><div><h3>{person.name}</h3><small>{person.angle} · 思想演绎，非本人原话</small></div></div>
                        <div className="response-body">{person.response.split("\n\n").map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>
                        <div className="response-actions">
                            <a href={person.source} target="_blank" rel="noreferrer">思想背景资料 ↗</a>
                            <SavedButton item={{ id: round.id + "-" + person.id, source: "星光会客厅", title: person.name + " · " + person.angle, text: "预设思想演绎，非人物原话\n话题：" + defaultQuestionTitle + "\n" + person.response }} saved={saved} onSave={onSave}/>
                        </div>
                    </article>)}
                </div>)}
                {pending && <div className="salon-loading" ref={loading}>
                    <div className="user-message"><span className="eyebrow">我的问题</span><p>{pending.question}</p></div>
                    <LatticeLoader label="正在准备回答" color="#cde7d5" />
                    <p className="hint">{people.map(person => person.short).join(" · ")}</p>
                </div>}
            </div>
            <div className="salon-composer">
                <div className="composer-caption"><label className="field-label" htmlFor="salon-question">想听他们怎么看？</label><button className="text-button" disabled={busy} onClick={() => setQuestion(defaultQuestion)}>使用默认问题</button></div>
                <textarea id="salon-question" value={question} disabled={busy} maxLength={2000} onChange={event => setQuestion(event.target.value)} placeholder="写下一个困惑或你想探讨的话题……"/>
                <div className="form-actions"><span className="hint">{question.length}/2000 · 思想演绎，不替代专业支持</span>
                    <button className="primary" disabled={busy || !question.trim()} onClick={send}>{busy ? "正在准备回复…" : "请 " + people.length + " 位分别回答"}</button>
                </div>
                {error && <p role="alert" className="error-text">{error}</p>}
                <span className="lattice-loader__sr" role="status">{!busy && rounds.length ? "已展开 " + rounds.length + " 轮回应" : ""}</span>
            </div>
        </section>
    </div>;
}
export function DailySlice({ saved }: {
    saved: SavedInsight[];
}) {
    const dialog = useRef<HTMLDialogElement>(null);
    const [selected, setSelected] = useState<string[]>([]);
    const [note, setNote] = useState("");
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const chosen = saved.filter(item => selected.includes(item.id));
    const completeText = ["本次探索记录（含预设演示内容）", ...chosen.map(item => `【${item.source}】${item.title}\n${item.text}`), ...(note.trim() ? [`【我的一句话】\n${note.trim()}`] : [])].join("\n\n");
    useEffect(() => {
        if (preview !== null && completeText.length > 6000) {
            setPreview(null);
            setError("所选内容超过单张图片的 6000 字上限，请减少选项后再预览。内容没有被截断或丢弃。");
        }
    }, [completeText, preview]);
    function open() { setSelected(saved.map(item => item.id)); setPreview(null); setError(""); dialog.current?.showModal(); }
    async function download() {
        if (busy || !preview?.trim())
            return;
        setBusy(true);
        setError("");
        try {
            await document.fonts.ready;
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx)
                throw new Error("Canvas unavailable");
            const width = 1080, padding = 80, fontSize = 30, lineHeight = 52;
            ctx.font = `${fontSize}px sans-serif`;
            const lines: string[] = [];
            for (const paragraph of preview.split("\n")) {
                if (!paragraph) {
                    lines.push("");
                    continue;
                }
                let line = "";
                for (const character of paragraph) {
                    if (ctx.measureText(line + character).width > width - padding * 2) {
                        lines.push(line);
                        line = character;
                    }
                    else
                        line += character;
                }
                if (line)
                    lines.push(line);
            }
            canvas.width = width;
            canvas.height = Math.max(960, 300 + lines.length * lineHeight + 140);
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#222";
            ctx.font = "bold 52px sans-serif";
            ctx.fillText("今日切片", padding, 112);
            ctx.font = "24px sans-serif";
            ctx.fillStyle = "#666";
            ctx.fillText(`${new Date().toLocaleDateString("zh-CN")}  /  INFJ漫游飞船`, padding, 164);
            ctx.strokeStyle = "#ccc";
            ctx.beginPath();
            ctx.moveTo(padding, 208);
            ctx.lineTo(width - padding, 208);
            ctx.stroke();
            ctx.fillStyle = "#222";
            ctx.font = `${fontSize}px sans-serif`;
            lines.forEach((line, i) => ctx.fillText(line, padding, 284 + i * lineHeight));
            ctx.font = "22px sans-serif";
            ctx.fillStyle = "#777";
            ctx.fillText("演示内容与思想演绎，不是心理诊断或人物原话。", padding, canvas.height - 66);
            const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Export failed")), "image/png"));
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `今日切片-${new Date().toLocaleDateString("sv-SE")}.png`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        }
        catch {
            setError("图片暂时未能导出，已保留你的选择与文字，请重试。");
        }
        finally {
            setBusy(false);
        }
    }
    return <><button onClick={open}>今日切片{saved.length ? `（${saved.length}）` : ""}</button><dialog ref={dialog} className="slice-dialog" aria-labelledby="slice-title" onCancel={() => { if (busy)
        setBusy(false); }}><div className="dialog-heading"><div><h2 id="slice-title">今日切片</h2><p className="hint">只带走你愿意留下的内容</p></div><button onClick={() => dialog.current?.close()} aria-label="关闭今日切片">×</button></div><div className="dialog-body">{preview === null ? <><p className="hint">勾选本次探索中留下的内容。导出前可编辑、删去私人信息；不会自动保存到服务器。</p><div className="slice-list">{saved.length ? saved.map(item => <label className="slice-option" key={item.id}><input type="checkbox" checked={selected.includes(item.id)} onChange={() => setSelected(items => items.includes(item.id) ? items.filter(id => id !== item.id) : [...items, item.id])}/><span><small>{item.source}</small><strong>{item.title}</strong></span></label>) : <div className="note">还没有选中的内容。可以在卡片背面、报告或人物回答下点击“加入今日切片”，也可以直接写下此刻的觉察。</div>}</div><label className="field-label" htmlFor="slice-note">此刻，我想留给自己的一句话</label><textarea id="slice-note" value={note} onChange={event => setNote(event.target.value)} maxLength={600} placeholder="不需要总结得很好，只留下你觉得有用的一点。"/></> : <><label className="field-label" htmlFor="slice-preview">导出文字预览 · 可以直接编辑</label><textarea id="slice-preview" className="export-preview" value={preview} onChange={event => setPreview(event.target.value)} maxLength={6000}/><p className="hint">将导出为黑白 PNG 长图。请确认是否保留原始问题等私人内容。</p></>}{error && <p role="alert" className="error-text">{error}</p>}</div><div className="dialog-footer">{preview === null ? <><span className="hint">已选 {chosen.length} 条</span><button className="primary" disabled={!chosen.length && !note.trim()} onClick={() => setPreview(["本次探索记录（含预设演示内容）", ...chosen.map(item => `【${item.source}】${item.title}\n${item.text}`), ...(note.trim() ? [`【我的一句话】\n${note.trim()}`] : [])].join("\n\n").slice(0, 6000))}>预览并编辑</button></> : <><button onClick={() => setPreview(null)} disabled={busy}>返回选择</button><button className="primary" onClick={download} disabled={busy || !preview.trim()}>{busy ? "正在导出…" : "下载图片 PNG"}</button></>}</div></dialog></>;
}
