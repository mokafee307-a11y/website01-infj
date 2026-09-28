export const ENTRY_START_RATE = 1;
export const ENTRY_END_RATE = 5;
export const ENTRY_FADE_SECONDS = 0.5;

export function getEntryTiming(currentTime: number, duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) {
    return { playbackRate: ENTRY_START_RATE, remainingSeconds: Infinity, opacity: 1 };
  }

  const progress = Math.max(0, Math.min(1, currentTime / duration));
  const rateRange = ENTRY_END_RATE - ENTRY_START_RATE;
  // Linear in media progress means exponentially increasing speed in viewing time:
  // the closer we get to the black hole, the stronger the acceleration feels.
  const playbackRate = ENTRY_START_RATE + rateRange * progress;
  // Integrate 1 / playbackRate over the remaining media time, rather than dividing
  // by today's rate. This keeps the final fade at 0.5 viewing seconds as we accelerate.
  const remainingSeconds = duration / rateRange * Math.log(ENTRY_END_RATE / playbackRate);
  const fadeSeconds = Math.min(ENTRY_FADE_SECONDS,
    duration / rateRange * Math.log(ENTRY_END_RATE / ENTRY_START_RATE));
  const opacity = Math.max(0, Math.min(1, remainingSeconds / fadeSeconds));
  return { playbackRate, remainingSeconds, opacity };
}
