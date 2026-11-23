import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ProgressRef } from '../types';
import { createSmokeTexture } from './geometry';
import { montage } from './launchTimeline';
import { smoothstep } from '../scroll/math';

function chamberGrid() {
  const points: number[] = [];
  const add = (...values: number[]) => points.push(...values);
  const x = 0.78, z = -1.4;
  for (let i = -8; i <= 8; i += 1) {
    const axis = i * 0.08;
    add(x + axis, 0.02, z - 0.64, x + axis, -0.85, z - 0.64);
    add(x - 0.64, 0.02, z + axis, x - 0.64, -0.85, z + axis);
    add(x + axis, -0.85, z - 0.64, x + axis, -0.85, z + 0.64);
    add(x - 0.64, -0.85, z + axis, x + 0.64, -0.85, z + axis);
  }
  for (let i = 0; i < 11; i += 1) {
    const y = 0.02 - i * 0.086;
    add(x - 0.64, y, z - 0.64, x + 0.64, y, z - 0.64);
    add(x - 0.64, y, z - 0.64, x - 0.64, y, z + 0.64);
  }
  return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
}

export default function PrelaunchEffects({ progressRef, enabled }: { progressRef: ProgressRef; enabled: boolean }) {
  const chamber = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Group>(null);
  const haze = useRef<THREE.Group>(null);
  const sweep = useRef<THREE.Group>(null);
  const smoke = useMemo(createSmokeTexture, []);
  const grid = useMemo(chamberGrid, []);
  useEffect(() => () => { smoke.dispose(); grid.dispose(); }, [smoke, grid]);

  useFrame(() => {
    const p = progressRef.current;
    if (chamber.current) chamber.current.visible = enabled && p >= montage.flow && p < montage.scan;
    if (scan.current) scan.current.visible = enabled && p >= montage.scan && p < montage.nozzle;
    if (sweep.current) sweep.current.position.z = -2.65 + 5.3 * smoothstep(montage.scan, montage.nozzle, p);
    if (haze.current) haze.current.visible = enabled && p >= montage.silhouette && p < montage.lightbar;
  });

  return (
    <>
      <group ref={chamber} visible={false}>
        <lineSegments geometry={grid}>
          <lineBasicMaterial color="#4c9ca9" opacity={0.28} transparent depthWrite={false} />
        </lineSegments>
        <pointLight position={[1.01, -0.28, -1.3]} color="#78dfff" intensity={4.4} distance={2.4} />
      </group>
      <group ref={scan} visible={false}>
        <gridHelper args={[7, 28, '#337ba4', '#1d354f']} position={[0, -0.14, 0]} />
        <group ref={sweep}>
          <mesh position={[0, 0.73, 0]}>
            <planeGeometry args={[3.05, 1.85]} />
            <meshBasicMaterial color="#409efb" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <mesh position={[0, 1.24, 0]}>
            <boxGeometry args={[3.05, 0.009, 0.016]} />
            <meshBasicMaterial color={new THREE.Color(0.14, 1.2, 2.3)} toneMapped={false} />
          </mesh>
        </group>
      </group>
      <group ref={haze} visible={false}>
        {[-2.6, -1.2, 0, 1.4, 2.7].map((x, index) => (
          <sprite key={x} position={[x, 1.4 + 0.65 * Math.sin(index * 1.4), 2.5 + index * 0.27]}
            scale={[4.7, 3.0, 1]}>
            <spriteMaterial map={smoke} color="#cbd8e0" opacity={0.76} depthWrite={false} transparent />
          </sprite>
        ))}
        <mesh position={[0, 1.86, 4.1]}>
          <planeGeometry args={[0.85, 0.10]} />
          <meshBasicMaterial color={new THREE.Color(2.2, 2.35, 2.5)} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </>
  );
}

export function setLaunchLights(p: number, enabled: boolean, scene: THREE.Scene, key: THREE.DirectionalLight, fill: THREE.HemisphereLight, rampKey: THREE.PointLight) {
  const dark = enabled && p < montage.overhead;
  const cabin = p < montage.flow;
  const bar = p >= montage.lightbar;
  const scan = p >= montage.scan && p < montage.nozzle;
  const silhouette = p >= montage.silhouette && !bar;
  const macro = p >= montage.nozzle && p < montage.silhouette;
  scene.environmentIntensity = dark ? (bar ? 0.012 : scan ? 0.38 : silhouette ? 0.11 : macro ? 0.59 : 0.32) : 0.84;
  key.intensity = dark ? (bar || silhouette ? 0.02 : cabin ? 0.58 : 0.52) : 1.48;
  fill.intensity = dark ? (bar ? 0.012 : silhouette ? 0.08 : 0.42) : 0.63;
  rampKey.intensity = p >= montage.overhead ? 510 : 0;
}
