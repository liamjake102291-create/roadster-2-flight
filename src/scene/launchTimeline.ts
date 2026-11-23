import { chapterWindow, clamp01, lerp, smoothstep } from '../scroll/math';

export const HANDOFF = 0.435;
export const LANDING = 0.86;
export const RAMP_START = -5.9;
const RADIUS = 7.8;
export const RAMP_ANGLE = Math.PI * 0.9;
export const RAMP_HALF_WIDTH = 2.43;

export const montage = {
  cabin: 0, flow: 0.026, scan: 0.052, nozzle: 0.081, silhouette: 0.107, lightbar: 0.144,
  overhead: 0.178, lineup: 0.207, jump: 0.232, approach: 0.251, track: 0.276, crest: 0.312, fly: 0.352,
} as const;

export const flight = {
  move: 4.4, ramp: 7.7, hang: 10.6, boost: 12.45, exit: 13.10,
  upright: 14.02, hover: 16.05, touch: 18.70, brake: 21.85, end: 23.10,
} as const;

export const INSPECTION_SECONDS = 10;
export const LINEUP_Z = 38;
export const lineup = { start: -9, spool: -7.4, lift: -7.32, flip: -5.92, upright: -3.25, touch: -0.52, end: 0 };
export const parkedVehicles = [
  { z: 27.1, kind: 'sedan', color: '#9eafc6' },
  { z: 24, kind: 'sedan', color: '#a7483e' },
  { z: 20, kind: 'semi', color: '#dce1e8' },
  { z: 16.1, kind: 'pickup', color: '#8b9aaa' },
  { z: 13.9, kind: 'cab', color: '#d5a448' },
] as const;

// The vehicle holds its flight pose throughout the animated inspection.
const replayClock = [
  [0, -17.4], [montage.lineup, lineup.start], [montage.jump, lineup.flip], [0.249, lineup.end], [montage.approach, flight.move], [montage.track, flight.ramp],
  [montage.crest, flight.hang], [0.337, flight.boost], [montage.fly, flight.exit], [0.38, flight.upright],
  [HANDOFF, flight.hover], [0.45, flight.hover + 0.75], [0.66, flight.hover + 4.3],
  [0.73, flight.hover + 6.7], [LANDING, flight.hover + INSPECTION_SECONDS],
  [0.94, flight.touch + INSPECTION_SECONDS], [1, flight.end + INSPECTION_SECONDS],
] as const;

export function playbackSeconds(progress: number) {
  for (let i = 1; i < replayClock.length; i += 1) {
    const [p1, t1] = replayClock[i];
    const [p0, t0] = replayClock[i - 1];
    if (progress <= p1) return lerp(t0, t1, clamp01((progress - p0) / (p1 - p0)));
  }
  return replayClock[replayClock.length - 1][1];
}

export function playbackProgress(seconds: number) {
  for (let i = 1; i < replayClock.length; i += 1) {
    const [p1, t1] = replayClock[i];
    const [p0, t0] = replayClock[i - 1];
    if (seconds <= t1) return lerp(p0, p1, clamp01((seconds - t0) / (t1 - t0)));
  }
  return 1;
}

export function maneuverSeconds(progress: number) {
  if (progress >= LANDING) return playbackSeconds(progress) - INSPECTION_SECONDS;
  return Math.min(flight.hover, playbackSeconds(progress));
}

export function rampPoint(angle: number) {
  return { y: RADIUS * (1 - Math.cos(angle)), z: RAMP_START - RADIUS * Math.sin(angle) };
}

export interface Pose {
  x: number;
  y: number;
  z: number;
  pitch: number;
  yaw: number;
  roll: number;
}

const restY = 0.019;
const axleHalf = 1.4;
const wheelRadius = 0.395;
const axleAngle = Math.asin(axleHalf / (RADIUS - wheelRadius));
const exitAngle = RAMP_ANGLE + axleAngle;
const hangAngle = RAMP_ANGLE - axleAngle * 1.18;
const hoverHeight = 2.749;
const startZ = 8.7;
const touchZ = 0.65;

function hermite(start: number, end: number, entry: number, exit: number, span: number, t: number) {
  const u = clamp01(t / span), u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * start + (u3 - 2 * u2 + u) * span * entry +
    (-2 * u3 + 3 * u2) * end + (u3 - u2) * span * exit;
}

function slopePose(angle: number): Pose {
  const point = rampPoint(angle);
  // The two axle centres are a chord inside the curve. Offset the chassis
  // along the local normal to seat both pairs of tyres on the same surface.
  const chord = RADIUS - (RADIUS - wheelRadius) * Math.cos(axleAngle) - 0.39;
  const gap = lerp(restY, chord, smoothstep(0, axleAngle * 1.2, angle));
  return { x: 0, y: point.y + Math.cos(angle) * gap, z: point.z + Math.sin(angle) * gap, pitch: angle, yaw: 0, roll: 0 };
}

const off = slopePose(exitAngle);
const crestSpeed = 0.48;
const offVy = Math.sin(exitAngle) * (RADIUS - 0.14) * crestSpeed;
const offVz = -Math.cos(exitAngle) * (RADIUS - 0.14) * crestSpeed;
const caughtAt = 14.88;

export function flightPose(t: number): Pose {
  if (t <= lineup.start) return { x: 0, y: restY, z: LINEUP_Z, pitch: 0, yaw: 0, roll: 0 };
  if (t < lineup.end) {
    const z = t < lineup.lift
      ? hermite(LINEUP_Z, 33.4, 0, -4.1, lineup.lift - lineup.start, t - lineup.start)
      : t < lineup.touch
        ? hermite(33.4, 9.7, -4.1, -2.35, lineup.touch - lineup.lift, t - lineup.lift)
        : hermite(9.7, startZ, -2.35, 0, -lineup.touch, t - lineup.touch);
    const y = 5.05 * chapterWindow(t, lineup.lift, -6.20, -1.45, lineup.touch) + 0.42 * chapterWindow(t, lineup.flip, -5.70, -4.90, lineup.upright)
      - 0.012 * chapterWindow(t, lineup.touch, -0.46, -0.41, -0.27);
    const pitch = 0.19 * chapterWindow(t, lineup.lift, -6.62, -6.35, -5.95)
      - 0.09 * chapterWindow(t, -1.9, -1.4, -0.95, lineup.touch);
    const roll = Math.PI * 2 * smoothstep(lineup.flip, lineup.upright, t);
    return { x: 0, y: restY + y, z, pitch, yaw: 0, roll };
  }
  if (t < flight.move) return { x: 0, y: restY, z: startZ, pitch: 0, yaw: 0, roll: 0 };
  if (t < flight.ramp) {
    const span = flight.ramp - flight.move;
    const z = hermite(startZ, RAMP_START, 0, -6.35, span, t - flight.move);
    return { x: 0, y: restY, z, pitch: 0, yaw: 0, roll: 0 };
  }
  if (t <= flight.exit) {
    let angle = hangAngle;
    if (t < flight.hang) angle = hermite(0, hangAngle, 6.35 / RADIUS, 0, flight.hang - flight.ramp, t - flight.ramp);
    if (t > flight.boost) angle = hermite(hangAngle, exitAngle, 0, crestSpeed, flight.exit - flight.boost, t - flight.boost);
    return slopePose(angle);
  }
  if (t < flight.hover) {
    const elapsed = t - flight.exit;
    const capture = caughtAt - flight.exit;
    const captureStart = 1.22;
    const coasting = Math.min(elapsed, captureStart);
    const coastHeight = off.y + offVy * coasting - 0.5 * 9.81 * coasting * coasting;
    const captureStartHeight = off.y + offVy * captureStart - 0.5 * 9.81 * captureStart ** 2;
    const captureStartSpeed = offVy - 9.81 * captureStart;
    const deceleration = capture - captureStart;
    const speedAfterCapture = -3.72;
    const captureHeight = captureStartHeight + 0.5 * (captureStartSpeed + speedAfterCapture) * deceleration;
    let y = coastHeight;
    if (elapsed > captureStart) {
      y = hermite(captureStartHeight, captureHeight, captureStartSpeed, speedAfterCapture, deceleration, elapsed - captureStart);
    }
    if (t >= caughtAt) y = hermite(captureHeight, hoverHeight, speedAfterCapture, 0, flight.hover - caughtAt, t - caughtAt);

    const z = t < caughtAt
      ? hermite(off.z, -3.15, offVz, 1.47, capture, elapsed)
      : hermite(-3.15, 0, 1.47, 0, flight.hover - caughtAt, t - caughtAt);
    const flip = smoothstep(flight.exit + 0.085, flight.upright, t);
    const pitch = lerp(exitAngle, Math.PI, smoothstep(flight.exit, 14.64, t));
    const lean = 0.10 * chapterWindow(t, 14.13, 14.54, 15.03, 15.86);
    const tilt = -0.065 * chapterWindow(t, 14.18, 14.68, 15.26, flight.hover);
    return { x: -0.38 * chapterWindow(t, 13.25, 13.94, 14.23, flight.hover), y, z, pitch: pitch + tilt, yaw: lean, roll: Math.PI * flip };
  }
  if (t < flight.touch) {
    const y = hermite(hoverHeight, restY, 0, -0.53, flight.touch - flight.hover, t - flight.hover);
    const z = touchZ * smoothstep(flight.hover, flight.touch, t);
    const trim = 0.04 * chapterWindow(t, flight.hover, 16.72, 17.18, 18.14);
    return { x: 0, y, z, pitch: Math.PI - trim, yaw: 0, roll: Math.PI };
  }
  const elapsed = t - flight.touch;
  const compression = -0.018 * chapterWindow(elapsed, 0, 0.07, 0.09, 0.24);
  const z = hermite(touchZ, startZ, 0, 0, flight.end - flight.touch, elapsed);
  return { x: 0, y: restY + compression, z, pitch: Math.PI, yaw: 0, roll: Math.PI };
}

export const launchPose = (p: number) => flightPose(maneuverSeconds(p));

export function wheelRotation(p: number) {
  const t = maneuverSeconds(p);
  const pose = flightPose(t);
  if (t < lineup.lift) return (pose.z - LINEUP_Z) / wheelRadius;
  const jumpSpin = (33.4 - LINEUP_Z) / wheelRadius
    - 4.8 * smoothstep(lineup.lift, lineup.upright, t);
  if (t < lineup.touch) return jumpSpin;
  const wheelOffset = jumpSpin - 9.7 / wheelRadius;
  if (t < flight.ramp) return pose.z / wheelRadius + wheelOffset;
  if (t <= flight.exit) return (RAMP_START - (RADIUS - wheelRadius) * pose.pitch) / wheelRadius + wheelOffset;
  const end = (RAMP_START - (RADIUS - wheelRadius) * exitAngle) / wheelRadius;
  return end + wheelOffset - 1.15 * smoothstep(flight.exit, 14.12, t) - Math.max(0, pose.z - touchZ) / wheelRadius * smoothstep(flight.touch, flight.touch + 0.01, t);
}

export const launchPower = (p: number) =>
  chapterWindow(maneuverSeconds(p), flight.boost - 0.03, 12.60, 17.65, 18.50);




