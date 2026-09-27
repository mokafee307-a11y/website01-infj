"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** A page-session welcome: no storage, no artificial loading, no module resets. */
export default function LaunchScreen({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"welcome" | "leaving" | "entered">("welcome");
  const enterButton = useRef<HTMLButtonElement>(null);
  const locked = phase !== "entered";

  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    enterButton.current?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = previous; };
  }, [locked]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650;
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
    {locked && <section className={`launch-screen${phase === "leaving" ? " is-leaving" : ""}`} aria-labelledby="launch-title" aria-describedby="launch-description">
      <div className="launch-content">
        <h1 id="launch-title"><span>欢迎来到</span><span>绿老头漫游飞船</span></h1>
        <p id="launch-description"><span>在这里，我为你留了一盏灯，</span><span>带上你的困惑，带上你自己</span></p>
        <button ref={enterButton} type="button" className="launch-enter" aria-disabled={phase === "leaving"} onClick={() => { if (phase === "welcome") setPhase("leaving"); }}>
          开始漫游<span aria-hidden="true">↗</span>
        </button>
      </div>
    </section>}
    <div className="launch-workspace" inert={locked} aria-hidden={locked ? true : undefined}>{children}</div>
  </>;
}
