"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import WarpText from "./WarpText";
import { getEntryTiming } from "./launch-timing";
import { publicAsset } from "./public-asset";

const LaunchEnteredContext = createContext(false);
export const useLaunchEntered = () => useContext(LaunchEnteredContext);

const launchWarpProps = {
  color: "inherit", fontSize: "inherit", fontWeight: "inherit",
  fontFamily: "inherit", letterSpacing: "inherit", lineHeight: "inherit",
  pointerInfluence: 0.85, pointerStrength: 1.2, hoverOnly: true,
};

/** A page-session welcome: no storage, no artificial loading, no module resets. */
export default function LaunchScreen({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"welcome" | "leaving" | "entered">("welcome");
  const screen = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const entryVideo = useRef<HTMLVideoElement>(null);
  const [entryPlaying, setEntryPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
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
    if (!player || !locked || entryPlaying || reducedMotion || videoFailed) return;
    const sync = () => {
      if (document.hidden) player.pause();
      else void player.play().catch(() => setVideoFailed(true));
    };
    sync(); document.addEventListener("visibilitychange", sync);
    return () => { document.removeEventListener("visibilitychange", sync); player.pause(); };
  }, [locked, entryPlaying, reducedMotion, videoFailed]);

  function enter() {
    if (phase !== "welcome") return;
    setPhase("leaving");
    if (reducedMotion) return;
    const player = entryVideo.current;
    if (!player || player.error) { setPhase("entered"); return; }
    player.currentTime = 0;
    player.playbackRate = getEntryTiming(0, player.duration).playbackRate;
    // Start inside the click gesture, including on mobile browsers.
    void player.play().catch(() => setPhase("entered"));
  }

  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [locked]);

  useEffect(() => {
    if (phase !== "leaving") return;
    if (reducedMotion) {
      const timer = window.setTimeout(() => setPhase("entered"), 160);
      return () => window.clearTimeout(timer);
    }
    const player = entryVideo.current;
    if (!player) return;
    let frame = 0;
    let previousTime = player.currentTime;
    let lastProgress = performance.now();
    const sync = () => {
      if (document.hidden || player.currentTime !== previousTime) {
        previousTime = player.currentTime;
        lastProgress = performance.now();
      }
      // Use media time so buffering and tab suspension cannot finish the fade early.
      if (screen.current && Number.isFinite(player.duration) && player.duration > 0) {
        const timing = getEntryTiming(player.currentTime, player.duration);
        if (player.playbackRate !== timing.playbackRate) player.playbackRate = timing.playbackRate;
        screen.current.style.opacity = String(timing.opacity);
      }
      if (player.ended || performance.now() - lastProgress > 15000) {
        setPhase("entered");
        return;
      }
      frame = requestAnimationFrame(sync);
    };
    frame = requestAnimationFrame(sync);
    return () => { cancelAnimationFrame(frame); player.pause(); };
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (phase !== "entered") return;
    const id = window.location.hash.slice(1);
    const target = ["map", "cards", "explore", "salon"].includes(id) ? document.getElementById(id) : null;
    if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
    else window.scrollTo({ top: 0, behavior: "instant" });
    document.getElementById("workspace")?.focus({ preventScroll: true });
  }, [phase]);

  return <LaunchEnteredContext.Provider value={!locked}>
    {locked && <section ref={screen} className={`launch-screen cosmic-launch${phase === "leaving" ? " is-leaving" : ""}`} aria-labelledby="launch-title" aria-describedby="launch-description" aria-busy={phase === "leaving"}>
      <div className="launch-media" aria-hidden="true">
        <video ref={video} className={videoFailed ? "video-unavailable" : ""} src={reducedMotion ? undefined : publicAsset("/media/cosmic-launch-original.mp4")} poster={publicAsset("/media/cosmic-launch-poster.jpg")} muted loop playsInline preload="metadata" disablePictureInPicture tabIndex={-1} onError={() => setVideoFailed(true)} />
      </div>
      <div className={`launch-entry-media${entryPlaying ? " is-playing" : ""}`} aria-hidden="true">
        <video ref={entryVideo} src={reducedMotion ? undefined : publicAsset("/media/cosmic-entry-sep29.mp4")} muted playsInline preload="auto" disablePictureInPicture tabIndex={-1}
          onLoadedMetadata={event => { const player = event.currentTarget; player.playbackRate = getEntryTiming(0, player.duration).playbackRate; }}
          onPlaying={() => setEntryPlaying(true)} onEnded={() => setPhase("entered")}
          onError={() => { if (phase === "leaving") setPhase("entered"); }} />
      </div>
      <div className="launch-shade" aria-hidden="true" />
      <div className="launch-content launch-ui">
        <h1 id="launch-title"><span>
          <WarpText {...launchWarpProps} text="欢迎搭乘" />
        </span><span>
          <WarpText {...launchWarpProps} text="绿老头漫游飞船" />
        </span></h1>
        <p id="launch-description">
          <WarpText {...launchWarpProps} text="在这里，我为你留了一盏灯，带上你的困惑，带上你自己" />
        </p>
        <button type="button" className="launch-enter" aria-disabled={phase === "leaving"} onClick={() => enter()}>
          <span className="launch-button-text">开始漫游</span>
          <span className="launch-edge edge-left" aria-hidden="true" /><span className="launch-edge edge-right" aria-hidden="true" /><span className="launch-edge edge-top" aria-hidden="true" /><span className="launch-edge edge-bottom" aria-hidden="true" />
        </button>
        <div className="launch-destination" aria-hidden="true">通往更真实的自己</div>
      </div>
      <aside className="launch-side-note launch-ui" aria-hidden="true"><span>✦</span><p>在浩瀚之中，总有一盏灯为你而亮</p></aside>
      <footer className="launch-footer launch-ui"><div className="launch-journey" aria-hidden="true"><span>探索</span><span>认识</span><span>接纳</span><span>成为</span></div><div className="launch-footer-actions"><button className="launch-continue" disabled={phase === "leaving"} onClick={() => enter()}><span>EXPLORE · 向内继续探索</span><span aria-hidden="true">↓</span></button></div></footer>
    </section>}
    <div className="launch-workspace" inert={locked} aria-hidden={locked ? true : undefined}>{children}</div>
  </LaunchEnteredContext.Provider>;
}
