export const MAX_PLAYBACK_STEP = 0.05;

export function nextPlaybackTime(time: number, elapsed: number, end: number) {
  return Math.min(end, time + Math.min(MAX_PLAYBACK_STEP, Math.max(0, elapsed)));
}
