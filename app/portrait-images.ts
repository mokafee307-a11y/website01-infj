import { publicAsset } from "./public-asset";

// Keep original source portraits alongside the explicitly labelled color edits.
export const colorizedPortraits = new Set([
  "jung", "hesse", "frankl", "dostoevsky", "kierkegaard", "king",
]);

export function portraitImage(id: string, color = true) {
  return publicAsset(`/portraits/${id}${color && colorizedPortraits.has(id) ? "-color" : ""}.webp`);
}
