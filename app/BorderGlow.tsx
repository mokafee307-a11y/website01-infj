"use client";

// Directional mesh border from the user-supplied React Bits BorderGlow.
import { useRef, type ReactNode, type CSSProperties, type PointerEvent } from "react";
export default function BorderGlow({ children, className = "", edgeSensitivity = 30, glowColor = "155 65 78", backgroundColor = "#102328", borderRadius = 16, glowRadius = 24, glowIntensity = .8, coneSpread = 25, colors = ["#b5e7cd", "#80cbd5", "#c5beed"], fillOpacity = .15 }: {
  children: ReactNode; className?: string; edgeSensitivity?: number; glowColor?: string; backgroundColor?: string; borderRadius?: number; glowRadius?: number; glowIntensity?: number; coneSpread?: number; colors?: string[]; fillOpacity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pointer = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const card = ref.current; if (!card) return;
    const r = card.getBoundingClientRect(), dx = event.clientX - r.left - r.width / 2, dy = event.clientY - r.top - r.height / 2;
    const edge = Math.min(1, Math.max(Math.abs(dx) / (r.width / 2), Math.abs(dy) / (r.height / 2)));
    card.style.setProperty("--edge-proximity", String(edge * 100));
    card.style.setProperty("--cursor-angle", `${Math.atan2(dy, dx) * 180 / Math.PI + 90}deg`);
  };
  const [h, s, l] = glowColor.split(/\s+/).map(Number);
  const style: Record<string, string | number> = { "--card-bg": backgroundColor, "--edge-sensitivity": edgeSensitivity, "--border-radius": `${borderRadius}px`, "--glow-padding": `${glowRadius}px`, "--cone-spread": coneSpread, "--fill-opacity": fillOpacity };
  for (const alpha of [100, 60, 50, 40, 30, 20, 10]) style[`--glow-color${alpha === 100 ? "" : `-${alpha}`}`] = `hsl(${h} ${s}% ${l}% / ${Math.min(alpha * glowIntensity, 100)}%)`;
  const positions = ["80% 55%", "69% 34%", "8% 6%", "41% 38%", "86% 85%", "82% 18%", "51% 4%"];
  const names = ["one", "two", "three", "four", "five", "six", "seven"];
  positions.forEach((pos, i) => { style[`--gradient-${names[i]}`] = `radial-gradient(at ${pos}, ${colors[i % colors.length]} 0px, transparent 50%)`; });
  style["--gradient-base"] = `linear-gradient(${colors[0]} 0 100%)`;
  return <div ref={ref} onPointerMove={pointer} onPointerLeave={() => ref.current?.style.setProperty("--edge-proximity", "0")} className={`border-glow-card ${className}`} style={style as CSSProperties}><span className="edge-light" aria-hidden="true"/><div className="border-glow-inner">{children}</div></div>;
}
