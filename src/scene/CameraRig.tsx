import { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type { OrbitControls as Orbit } from 'three-stdlib';
import * as THREE from 'three';
import { clamp01, lerp, smoothstep } from '../scroll/math';
import type { NarrativeProps, Vec3, ViewMode } from '../types';
import { flight, HANDOFF, LANDING, LINEUP_Z, lineup, launchPose, maneuverSeconds, montage } from './launchTimeline';

type Shot = { at: number; eye: Vec3; look: Vec3; fov: number; move?: Vec3; follow?: boolean; fit?: number };
const reel: Shot[] = [
  { at: montage.cabin, eye: [0.02, 0.85, 0.48], look: [0, 0.44, -0.54], fov: 69, move: [0, -0.05, -0.19] },
  { at: montage.flow, eye: [2.05, 0.04, -1.4], look: [0.83, -0.39, -1.4], fov: 45, move: [-0.21, 0, 0.18] },
  { at: montage.scan, eye: [0.065, 6.55, 0.016], look: [0, 0.36, -0.03], fov: 49, move: [0.46, -0.54, -0.24], fit: 0.85 },
  { at: montage.nozzle, eye: [0.44, 1.14, 3.12], look: [0.09, 0.89, 2.23], fov: 38, move: [-0.12, -0.04, -0.20] },
  { at: montage.silhouette, eye: [0.23, 1.14, -5.5], look: [0, 0.64, -0.32], fov: 35, move: [0.36, -0.36, 0.46], fit: 0.48 },
  { at: montage.lightbar, eye: [0.07, 0.57, -4.55], look: [0, 0.49, -2.29], fov: 44, move: [0.15, 0.09, -0.42], fit: 0.50 },
  { at: montage.overhead, eye: [3.5, 10.6, 5.2], look: [0, 0.17, -1.25], fov: 40, move: [-0.9, -1.6, -1.45], fit: 0.8 },
    { at: montage.approach, eye: [18.3, 4.25, 1.15], look: [0, 1.30, -7.4], fov: 43, follow: true, move: [0.8, 0.45, 0.1], fit: 0.77 },
  { at: montage.track, eye: [21.8, 8.3, -2.0], look: [0, 5.7, -8.4], fov: 42, move: [0.9, 1.9, -3.3], fit: 0.77 },
  { at: montage.crest, eye: [13.8, 2.25, 2.55], look: [0, -0.35, 1.45], fov: 33, follow: true, move: [0.7, -0.25, 0.25], fit: 0.77 },
];

const inspectionShots = [
  { p: HANDOFF, angle: 0.92, distance: 7.82, height: 4.40, look: 3.09, fov: 38 },
  { p: 0.45, angle: 0.91, distance: 7.85, height: 4.4, look: 3.03, fov: 38 },
  { p: 0.66, angle: 1.02, distance: 12.05, height: 7.65, look: 3.5, fov: 39 },
  { p: 0.735, angle: 1.02, distance: 12.05, height: 7.65, look: 3.5, fov: 39 },
  { p: 0.86, angle: 0.91, distance: 7.55, height: 4.7, look: 3.12, fov: 37 },
  { p: 0.927, angle: 1.38, distance: 7.55, height: 2.59, look: 1.67, fov: 37 },
  { p: 0.984, angle: 2.32, distance: 7.2, height: 1.65, look: 0.59, fov: 34 },
  { p: 1, angle: 2.42, distance: 8.05, height: 1.83, look: 0.63, fov: 36 },
];

export default function CameraRig({ progressRef, reducedMotion, mobile, mode }: NarrativeProps & { mobile: boolean; mode: ViewMode }) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const controls = useRef<Orbit>(null);
  const target = useRef(new THREE.Vector3(0, 0.65, 0));
  const desired = useRef(new THREE.Vector3());
  const center = useRef(new THREE.Vector3());
  const previousPose = useRef<number | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (mode !== 'orbit' || !controls.current) return;
    const pose = launchPose(progressRef.current);
    controls.current.target.set(pose.x, pose.y + 0.55, pose.z);
    if (camera.position.distanceTo(controls.current.target) < 3) {
      camera.position.set(pose.x + 4.2, pose.y + 2.05, pose.z - 4.9);
    }
    controls.current.update();
  }, [camera, mode, progressRef]);

  useFrame(({ size, invalidate }, delta) => {
    if (mode === 'orbit' && controls.current) return;
    const p = progressRef.current;
    const aspect = size.width / size.height;
    const pose = launchPose(p);
    const cinematic = p < HANDOFF && mode === 'surface';
    const after = p >= HANDOFF;
    let fov: number;
    let shotKey = -1;

    const flightShot = (p >= montage.fly && p <= HANDOFF + 0.002) || p >= LANDING;
    if (p >= montage.lineup && p < montage.approach && mode === 'surface') {
      const time = maneuverSeconds(p);
      const opening = smoothstep(lineup.start, lineup.lift, time);
      const ending = smoothstep(lineup.upright, lineup.end, time);
      const zoom = Math.max(1, 0.78 / aspect);
      const focusZ = lerp(lerp(29.1, 22.3, opening), 4.1, ending);
      desired.current.set(lerp(27.4, 21.4, ending) * zoom, lerp(7.8, 4.9, ending) * zoom, focusZ + 4.8);
      center.current.set(0, lerp(2.12, 1.15, ending), focusZ);
      fov = 43 + (mobile ? 5 : 0);
      shotKey = -4;
    } else if (flightShot && mode === 'surface') {
      const seconds = maneuverSeconds(p);
      const touchdown = smoothstep(flight.hover, flight.touch, seconds);
      const rollout = smoothstep(flight.touch, flight.end, seconds);
      const hover = smoothstep(14.05, flight.hover, seconds);
      const distance = lerp(14.0, 11.7, hover) * Math.max(1, 0.82 / aspect);
      desired.current.set(p >= LANDING ? -distance : distance, pose.y + lerp(3.4, 1.15, hover) + touchdown * 0.14, pose.z + lerp(2.3, 0.4, hover) + rollout * 1.3);
      center.current.set(pose.x, pose.y - lerp(0.22, 0.60, hover) + touchdown * 0.74, pose.z - (p >= LANDING ? 0.22 : 1.30));
      fov = 42 + (mobile ? 5 : 0);
      shotKey = -3;
    } else if (cinematic) {
      const nextIndex = reel.findIndex((shot) => shot.at > p);
      const index = nextIndex < 0 ? reel.length - 1 : Math.max(0, nextIndex - 1);
      const shot = reel[index];
      const end = reel[index + 1]?.at ?? HANDOFF;
      const t = clamp01((p - shot.at) / (end - shot.at));
      const motion = reducedMotion ? 0 : t;
      desired.current.set(...shot.eye);
      center.current.set(...shot.look);
      if (shot.move) desired.current.set(
        shot.eye[0] + shot.move[0] * motion, shot.eye[1] + shot.move[1] * motion, shot.eye[2] + shot.move[2] * motion,
      );
      if (p < montage.lineup) {
        desired.current.z += LINEUP_Z;
        center.current.z += LINEUP_Z;
      }
      if (shot.follow) {
        desired.current.x += pose.x; desired.current.y += pose.y; desired.current.z += pose.z;
        center.current.x += pose.x; center.current.y += pose.y; center.current.z += pose.z;
      }
      const pullback = Math.max(1, (shot.fit ?? 0.47) / aspect);
      desired.current.sub(center.current).multiplyScalar(pullback).add(center.current);
      fov = shot.fov + (mobile ? 4 : 0);
      shotKey = index;
    } else if (!after) {
      desired.current.set(pose.x + 5.7, pose.y + 2.14, pose.z - 6.4);
      center.current.set(pose.x, pose.y + 0.47, pose.z);
      desired.current.sub(center.current).multiplyScalar(Math.max(1, 0.9 / aspect)).add(center.current);
      fov = 37;
      shotKey = -2;
    } else {
      const right = inspectionShots.findIndex((shot, index) => index > 0 && p <= shot.p);
      const next = inspectionShots[right === -1 ? inspectionShots.length - 1 : right];
      const previous = inspectionShots[right === -1 ? inspectionShots.length - 2 : right - 1];
      const t = smoothstep(previous.p, next.p, p);
      const exploded = smoothstep(0.47, 0.66, p) * (1 - smoothstep(0.74, 0.87, p));
      const distance = lerp(previous.distance, next.distance, t) * (mobile ? Math.max(1.12, (0.97 + exploded * 0.12) / aspect) : Math.max(1, 1.37 / aspect));
      const angle = lerp(previous.angle, next.angle, t);
      const horizontal = !mobile && mode !== 'xray' ? -1.2 * smoothstep(0.95, 1, p) : 0;
      desired.current.set(Math.sin(angle) * distance, lerp(previous.height, next.height, t) + (mobile ? 0.6 : 0), Math.cos(angle) * distance);
      center.current.set(Math.cos(angle) * horizontal, lerp(previous.look, next.look, t) - (mobile ? 0.18 : 0), -Math.sin(angle) * horizontal);
      fov = lerp(previous.fov, next.fov, t) + (mobile ? 3 : 0);
    }

    const cut = previousPose.current !== shotKey && (
      (cinematic && (p < montage.lineup || shotKey === -4)) || (p >= LANDING && flightShot && mode === 'surface')
    );
    const damping = !initialized.current || cut || reducedMotion ? 1 : 1 - Math.exp(-Math.min(delta, 0.05) * 9);
    initialized.current = true;
    previousPose.current = shotKey;
    camera.position.lerp(desired.current, damping);
    target.current.lerp(center.current, damping);
    camera.lookAt(target.current);
    camera.fov = lerp(camera.fov, fov, damping);
    camera.updateProjectionMatrix();
    if (camera.position.distanceToSquared(desired.current) > 0.0001 ||
        target.current.distanceToSquared(center.current) > 0.0001 || Math.abs(camera.fov - fov) > 0.025) {
      invalidate();
    }
  }, -1);

  return mode === 'orbit' ? (
    <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.12}
      enablePan={false} minDistance={2.65} maxDistance={42} maxPolarAngle={Math.PI * 0.91} />
  ) : null;
}

