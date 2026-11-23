export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const smoothstep = (from: number, to: number, value: number) => {
  const t = clamp01((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const explosionAmount = (p: number) =>
  smoothstep(0.45, 0.66, p) * (1 - smoothstep(0.73, 0.86, p));

export const inspectionVisible = (p: number) => p >= 0.55 && p < 0.81;

export const thrustAmount = (p: number) => clamp01(
  smoothstep(0.075, 0.17, p) * (1 - smoothstep(0.43, 0.54, p)) +
  smoothstep(0.855, 0.9, p) * (1 - smoothstep(0.95, 1, p)),
);

export const chapterWindow = (p: number, start: number, peakStart: number, peakEnd: number, end: number) =>
  smoothstep(start, peakStart, p) * (1 - smoothstep(peakEnd, end, p));
