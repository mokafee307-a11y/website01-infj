import { publicAsset } from "./public-asset";

// Keep original source portraits alongside the explicitly labelled color edits.
export const colorizedPortraits = new Set([
  "jung", "hesse", "frankl", "dostoevsky", "kierkegaard", "king",
]);

export function portraitImage(id: string) {
  return publicAsset(`/portraits/${id}${colorizedPortraits.has(id) ? "-color" : ""}.webp`);
}
