import * as THREE from 'three';
import { chapterWindow, smoothstep } from '../scroll/math';
import { flight, flightPose, maneuverSeconds, montage } from './launchTimeline';

const under = [-0.78, 0.78].flatMap((x) => [-1.4, 1.4].map((z) => ({
  at: new THREE.Vector3(x, 0.041, z), axis: new THREE.Vector3(0, -1, 0), group: 'floor' as const,
})));
const rear = [-0.34, 0, 0.34].map((x) => ({
  at: new THREE.Vector3(x, 0.925, 2.29), axis: new THREE.Vector3(0, 0, 1), group: 'rear' as const,
}));
const nose = [-0.37, 0.37].map((x) => ({
  at: new THREE.Vector3(x, 0.295, -2.38), axis: new THREE.Vector3(0, 0, -1), group: 'nose' as const,
}));
const outlets = [...under, ...rear, ...nose];

export function nozzlePower(t: number, index: number) {
  const { at, group } = outlets[index];
  if (t < 0) {
    const start = maneuverSeconds(montage.flow);
    const end = maneuverSeconds(montage.scan);
    return index === 2 ? chapterWindow(t, start, start + 0.08, end - 0.15, end - 0.06) : 0;
  }
  if (group === 'rear') {
    return Math.max(
      0.95 * chapterWindow(t, flight.boost - 0.02, 12.56, 13.02, 13.21),
      0.52 * chapterWindow(t, 14.36, 14.57, 15.24, 15.85),
    );
  }
  if (group === 'nose') {
    return Math.max(
      0.79 * chapterWindow(t, 14.22, 14.44, 15.23, 15.66),
      0.37 * chapterWindow(t, 17.12, 17.24, 17.39, 17.62),
      0.64 * chapterWindow(t, flight.brake, 21.95, 22.19, 22.49),
    ) * (at.x < 0 ? 1 : 0.82);
  }

  // The torque burst acts as a left/right couple with a short counter-pulse.
  // Sustained lift blends in only as the floor comes back down.
  const rollStart = 0.66 * chapterWindow(t, 13.14, 13.24, 13.40, 13.62) * (at.x > 0 ? 1 : 0.08);
  const counter = 0.49 * chapterWindow(t, 13.58, 13.72, 13.86, 14.00) * (at.x < 0 ? 1 : 0.06);
  const catchFall = 0.98 * chapterWindow(t, 13.63, 13.93, 14.67, 15.52);
  const descent = 0.64 * chapterWindow(t, 14.73, 15.37, 17.08, flight.touch + 0.09);
  const cushion = 0.25 * chapterWindow(t, 17.40, 17.72, flight.touch, flight.touch + 0.12);
  const pitchTrim = 0.10 * chapterWindow(t, 14.06, 14.37, 14.8, 15.66) * (at.z < 0 ? 1 : -0.6);
  const bearing = smoothstep(0.20, 0.83, Math.cos(flightPose(t).pitch) * Math.cos(flightPose(t).roll));
  return Math.min(1, rollStart + counter + (1 - 0.32 * Math.max(rollStart, counter)) * bearing * (Math.max(catchFall, descent) + cushion + pitchTrim));
}

export interface Puff {
  born: number;
  lifetime: number;
  power: number;
  origin: THREE.Vector3;
  velocity: THREE.Vector3;
  impact: number;
  direction: number;
  spin: number;
  width: number;
}

const downAcceleration = 0.38;
const airDrag = 0.85;
const travel = (age: number) => (1 - Math.exp(-airDrag * age)) / airDrag;
const seed = (n: number) => {
  const value = Math.sin(n * 127.17 + 82.91) * 43758.5453;
  return value - Math.floor(value);
};

function collision(origin: THREE.Vector3, velocity: THREE.Vector3, lifetime: number) {
  const height = (age: number) => origin.y + velocity.y * travel(age) - downAcceleration * age * age;
  if (origin.y < 0.075) return 0;
  if (height(lifetime) > 0.075) return Infinity;
  let low = 0, high = lifetime;
  for (let step = 0; step < 8; step += 1) {
    const middle = (high + low) / 2;
    if (height(middle) > 0.075) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

export function buildWake(subdivisions: number) {
  const puffs: Puff[] = [];
  const rotation = new THREE.Euler(0, 0, 0, 'XYZ');
  const first = Math.floor(maneuverSeconds(montage.flow) * subdivisions);
  const last = Math.ceil((flight.brake + 0.66) * subdivisions);
  for (let tick = first; tick <= last; tick += 1) {
    for (let index = 0; index < outlets.length; index += 1) {
      const n = tick * 19 + index * 103;
      const t = (tick + index / outlets.length) / subdivisions;
      const power = nozzlePower(t, index);
      if (power < 0.036 || seed(n + 3) > 0.57 + 0.46 * power) continue;
      const outlet = outlets[index];
      const pose = flightPose(t), previous = flightPose(t - 0.012);
      rotation.set(pose.pitch, pose.yaw, pose.roll, 'XYZ');
      const origin = outlet.at.clone().applyEuler(rotation).add(new THREE.Vector3(pose.x, pose.y, pose.z));
      const axis = outlet.axis.clone().applyEuler(rotation);
      const speed = (t < 0 ? 2.0 : outlet.group === 'floor' ? 9.0 : 10.5) * (0.62 + 0.54 * power);
      const jitter = 0.65 + 0.46 * power;
      const velocity = axis.multiplyScalar(speed * (0.73 + seed(n + 9) * 0.48)).add(new THREE.Vector3(
        (pose.x - previous.x) * 32 + (seed(n + 11) - 0.5) * jitter,
        (pose.y - previous.y) * 23 + (seed(n + 13) - 0.5) * jitter,
        (pose.z - previous.z) * 33 + (seed(n + 17) - 0.5) * jitter,
      ));
      const lifetime = t < 0 ? 0.55 : 1.25 + seed(n + 7) * 0.77;
      const impact = t < 0 ? Infinity : collision(origin, velocity, lifetime);
      puffs.push({ born: t, lifetime, power, origin, velocity, impact,
        direction: seed(n) * Math.PI * 2, spin: (seed(n + 5) - 0.5) * 2.4, width: 0.69 + seed(n + 2) * 0.61 });
    }
  }
  return puffs;
}

export function movePuff(puff: Puff, age: number, position: THREE.Vector3) {
  const airborne = Math.min(age, puff.impact);
  position.copy(puff.origin).addScaledVector(puff.velocity, travel(airborne));
  position.y -= downAcceleration * airborne * airborne;
  const grounded = age - airborne;
  if (grounded > 0) {
    const spread = travel(grounded * 1.15) * (1.4 + puff.power * 2.3);
    position.x += Math.cos(puff.direction) * spread + puff.velocity.x * 0.24 * travel(grounded);
    position.z += Math.sin(puff.direction) * spread + puff.velocity.z * 0.24 * travel(grounded);
    position.y = 0.075 + 0.19 * travel(grounded) * puff.width;
  }
  position.x += 0.36 * age * age;
  position.z += 0.18 * age * age;
  return grounded;
}

