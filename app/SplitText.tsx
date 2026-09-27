"use client";

// Adapted from the React Bits SplitText supplied by the user.
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { useLaunchEntered } from "./LaunchScreen";

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

export default function SplitText({ text, id, delay = 50, duration = 1.25 }: {
  text: string; id: string; delay?: number; duration?: number;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const entered = useLaunchEntered();
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(true);
  const completed = useRef(false);
  useEffect(() => {
    let live = true;
    void document.fonts.ready.then(() => { if (live) setReady(true); });
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync(); query.addEventListener("change", sync);
    return () => { live = false; query.removeEventListener("change", sync); };
  }, []);
  useGSAP(() => {
    if (!entered || !ready || reduced || completed.current || !ref.current) return;
    const split = new GSAPSplitText(ref.current, { type: "chars,words", charsClass: "split-char", wordsClass: "split-word", aria: "auto" });
    const tween = gsap.fromTo(split.chars, { opacity: 0, y: 40 }, {
      opacity: 1, y: 0, duration, ease: "power3.out", stagger: delay / 1000,
      scrollTrigger: { trigger: ref.current, start: "top 90%-=100px", once: true },
      onComplete: () => { completed.current = true; },
    });
    ScrollTrigger.refresh();
    return () => { tween.scrollTrigger?.kill(); tween.kill(); split.revert(); };
  }, { dependencies: [entered, ready, reduced, text, delay, duration], scope: ref, revertOnUpdate: true });
  return <h1 ref={ref} id={id} className="split-parent">{text}</h1>;
}
