"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLaunchEntered } from "./LaunchScreen";

export default function SplitText({ text, id, delay = 50, duration = 1.25 }: {
  text: string; id: string; delay?: number; duration?: number;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const entered = useLaunchEntered();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!entered || !ref.current) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (query.matches || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: .1, rootMargin: "0px 0px -100px" });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [entered]);

  return <h1 ref={ref} id={id} className={`split-parent${visible ? " is-visible" : ""}`} aria-label={text}>
    {Array.from(text).map((character, index) => <span key={`${character}-${index}`} aria-hidden="true" className="split-char" style={{ "--split-delay": `${index * delay}ms`, "--split-duration": `${duration}s` } as CSSProperties}>{character === " " ? "\u00a0" : character}</span>)}
  </h1>;
}
