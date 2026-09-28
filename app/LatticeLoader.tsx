"use client";

// Adapted from the React Bits LatticeLoader supplied for this site.
import { useEffect, useRef, type CSSProperties } from "react";
import "./LatticeLoader.css";

type Props = {
  status?: "working" | "done" | "error";
  label?: string;
  doneLabel?: string;
  errorLabel?: string;
  color?: string;
  doneColor?: string;
  errorColor?: string;
  cellSize?: number;
  gap?: number;
  fontSize?: number;
  step?: number;
  idleOpacity?: number;
  showTimer?: boolean;
  className?: string;
};
const orbit = [0, 1, 2, 7, null, 3, 6, 5, 4];
const marks = { done: [2, 3, 5, 7], error: [0, 2, 4, 6, 8] };

export default function LatticeLoader({
  status = "working", label = "正在准备回答", doneLabel = "回答已就绪", errorLabel = "暂未完成",
  color = "currentColor", doneColor = "#a9d6b8", errorColor = "#ef4444",
  cellSize = 6, gap = 2, fontSize = 14, step = 90, idleOpacity = 0.15,
  showTimer = true, className = "",
}: Props) {
  const timerRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (status !== "working") return;
    const start = performance.now();
    if (timerRef.current) timerRef.current.textContent = "0.0s";
    const timer = setInterval(() => {
      const seconds = (performance.now() - start) / 1000;
      if (timerRef.current) timerRef.current.textContent = seconds < 60
        ? `${seconds.toFixed(1)}s`
        : `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(1)}s`;
    }, 100);
    return () => clearInterval(timer);
  }, [status]);
  const mark = status === "error" ? "error" : "done";
  const text = status === "working" ? label : status === "done" ? doneLabel : errorLabel;
  return <span role="status" className={`lattice-loader ${className}`} data-status={status}
    style={{ "--ll-cell": `${cellSize}px`, "--ll-gap": `${gap}px`, "--ll-font": `${fontSize}px`,
      "--ll-color": color, "--ll-mark": status === "error" ? errorColor : doneColor,
      "--ll-idle": idleOpacity, "--ll-cycle": `${Math.round(8 * step * 1.2)}ms` } as CSSProperties}>
    <span className="lattice-loader__grid" aria-hidden="true">
      <span className="lattice-loader__layer lattice-loader__run">
        {orbit.map((unit, i) => <span key={i} className="lattice-loader__cell" data-hole={unit == null ? "" : undefined}
          style={unit == null ? undefined : { animationDelay: `${Math.round(unit * step * 1.2)}ms` }}/>)}</span>
      <span className="lattice-loader__layer lattice-loader__mark">
        {orbit.map((_, i) => <span key={i} className="lattice-loader__cell" data-on={marks[mark].includes(i) ? "" : undefined}/>)}</span>
    </span>
    <span className="lattice-loader__label">{text}</span>
    {showTimer && <span ref={timerRef} className="lattice-loader__timer" aria-hidden="true">0.0s</span>}
  </span>;
}
