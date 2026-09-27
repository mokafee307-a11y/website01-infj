"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** A page-session welcome: no storage, no artificial loading, no module resets. */
export default function LaunchScreen({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"welcome" | "leaving" | "entered">("welcome");
  const enterButton = useRef<HTMLButtonElement>(null);
  const screen = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [paused, setPaused] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const locked = phase !== "entered";

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(preference.matches);
    sync(); preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const player = video.current;
    if (!player || !locked || reducedMotion || videoFailed) return;
    const sync = () => {
      if (paused || document.hidden) player.pause();
      else void player.play().catch(() => setPaused(true));
    };
    sync(); document.addEventListener("visibilitychange", sync);
    return () => { document.removeEventListener("visibilitychange", sync); player.pause(); };
  }, [locked, paused, reducedMotion, videoFailed]);

  useEffect(() => {
    const element = screen.current;
    if (!element) return;
    // Track the black-hole center after the 16:9 video is cropped with object-fit: cover.
    const sync = () => {
      const { width, height } = element.getBoundingClientRect();
      const scale = Math.max(width / 1280, height / 720);
      const x = (width - 1280 * scale) / 2 + 1280 * scale * .55;
      const y = (height - 720 * scale) / 2 + 720 * scale * .39;
      element.style.setProperty("--portal-x", `${x}px`);
      element.style.setProperty("--portal-y", `${y}px`);
      element.style.setProperty("--portal-dx", `${width / 2 - x}px`);
      element.style.setProperty("--portal-dy", `${height / 2 - y}px`);
    };
    const observer = new ResizeObserver(sync); observer.observe(element); sync();
    return () => observer.disconnect();
  }, [locked]);

  function enter(target?: string) {
    if (phase !== "welcome") return;
    if (target) window.history.replaceState(null, "", `#${target}`);
    setPhase("leaving");
  }

  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    enterButton.current?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = previous; };
  }, [locked]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 160 : 2200;
    const timer = window.setTimeout(() => setPhase("entered"), duration);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "entered") return;
    const id = window.location.hash.slice(1);
    const target = ["map", "cards", "explore", "salon"].includes(id) ? document.getElementById(id) : null;
    if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
    else window.scrollTo({ top: 0, behavior: "instant" });
    document.getElementById("workspace")?.focus({ preventScroll: true });
  }, [phase]);

  return <>
    {locked && <section ref={screen} className={`launch-screen cosmic-launch${phase === "leaving" ? " is-leaving" : ""}`} aria-labelledby="launch-title" aria-describedby="launch-description" aria-busy={phase === "leaving"}>
      <div className="launch-media" aria-hidden="true">
        <video ref={video} className={videoFailed ? "video-unavailable" : ""} src={reducedMotion ? undefined : "/media/cosmic-launch.mp4"} poster="/media/cosmic-launch-poster.jpg" muted loop playsInline preload="metadata" disablePictureInPicture tabIndex={-1} onError={() => setVideoFailed(true)} />
      </div>
      <div className="launch-shade" aria-hidden="true" />
      <header className="launch-masthead launch-ui">
        <div className="launch-wordmark"><span aria-hidden="true">✧</span><div>绿老头漫游飞船<small>INFJ 宇宙漫游飞船</small></div></div>
        <nav className="launch-navigation" aria-label="启动页功能入口">{[["map", "认知运行地图"], ["cards", "卡点梳理"], ["explore", "自由探索"], ["salon", "老头会客厅"]].map(([id, title]) => <button key={id} disabled={phase === "leaving"} onClick={() => enter(id)}>{title}</button>)}</nav>
      </header>
      <div className="launch-content launch-ui">
        <div className="launch-kicker" aria-hidden="true">A KINDER UNIVERSE<br />FOR DEEP THINKERS</div>
        <h1 id="launch-title"><span>欢迎来到</span><span>绿老头漫游飞船</span></h1>
        <p id="launch-description"><span>在这里，我为你留了一盏灯，</span><span>带上你的困惑，带上你自己</span></p>
        <button ref={enterButton} type="button" className="launch-enter" aria-disabled={phase === "leaving"} onClick={() => enter()}>
          <span className="launch-button-text">开始漫游 <span aria-hidden="true">→</span></span>
          <span className="launch-edge edge-left" aria-hidden="true" /><span className="launch-edge edge-right" aria-hidden="true" /><span className="launch-edge edge-top" aria-hidden="true" /><span className="launch-edge edge-bottom" aria-hidden="true" />
        </button>
        <div className="launch-destination" aria-hidden="true">通往更真实的自己</div>
      </div>
      <aside className="launch-side-note launch-ui" aria-hidden="true"><span>✦</span><p>在浩瀚之中，总有一盏灯为你而亮</p></aside>
      <footer className="launch-footer launch-ui"><div className="launch-journey" aria-hidden="true"><span>探索</span><span>认识</span><span>接纳</span><span>成为</span></div><span className="launch-footer-line" aria-hidden="true" /><div className="launch-footer-actions">{!reducedMotion && !videoFailed && <button className="launch-pause" disabled={phase === "leaving"} onClick={() => setPaused(value => !value)} aria-label={paused ? "播放背景动画" : "暂停背景动画"}>{paused ? "播放背景" : "暂停背景"}</button>}<button className="launch-continue" disabled={phase === "leaving"} onClick={() => enter()}><span>EXPLORE · 向内继续探索</span><span aria-hidden="true">↓</span></button></div></footer>
    </section>}
    <div className="launch-workspace" inert={locked} aria-hidden={locked ? true : undefined}>{children}</div>
  </>;
}
