export const ENTRY_START_RATE = 1;
export const ENTRY_FADE_SECONDS = 0.5;

export function getEntryTiming(currentTime: number, duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) {
    return { playbackRate: ENTRY_START_RATE, remainingSeconds: Infinity, opacity: 1 };
  }

  const time = Number.isFinite(currentTime) ? Math.max(0, Math.min(duration, currentTime)) : 0;
  const playbackRate = ENTRY_START_RATE;
  // Normal-speed playback: fade only during the final 0.5 seconds of media time.
  const remainingSeconds = duration - time;
  const fadeSeconds = Math.min(ENTRY_FADE_SECONDS, duration);
  const opacity = Math.max(0, Math.min(1, remainingSeconds / fadeSeconds));
  return { playbackRate, remainingSeconds, opacity };
}
