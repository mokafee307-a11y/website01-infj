export const ENTRY_START_RATE = 1;
export const ENTRY_MAX_SECONDS = 3.5;
export const ENTRY_FADE_SECONDS = 0.5;

export function getEntryTiming(currentTime: number, duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) {
    return { playbackRate: ENTRY_START_RATE, remainingSeconds: Infinity, opacity: 1 };
  }

  const time = Number.isFinite(currentTime) ? Math.max(0, Math.min(duration, currentTime)) : 0;
  const playbackRate = Math.max(ENTRY_START_RATE, duration / ENTRY_MAX_SECONDS);
  // Keep the full video within 3.5 viewing seconds, including the final fade.
  const remainingSeconds = (duration - time) / playbackRate;
  const fadeSeconds = Math.min(ENTRY_FADE_SECONDS, duration / playbackRate);
  const opacity = Math.max(0, Math.min(1, remainingSeconds / fadeSeconds));
  return { playbackRate, remainingSeconds, opacity };
}
