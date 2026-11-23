import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ProgressRef } from '../types';
import { montage, RAMP_ANGLE, RAMP_HALF_WIDTH, RAMP_START, rampPoint } from './launchTimeline';

const sections = 88;
const width = RAMP_HALF_WIDTH;
const segments = Array.from({ length: sections + 1 }, (_, i) => rampPoint(RAMP_ANGLE * i / sections));

function ribbon(left: number, right: number, lift = 0, extension = false) {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [], uv: number[] = [], triangles: number[] = [];
  const path = extension ? [{ y: 0, z: 16 }, ...segments] : segments;
  path.forEach(({ y, z }, index) => {
    const angle = RAMP_ANGLE * Math.max(0, index - Number(extension)) / sections;
    const raisedY = y + Math.cos(angle) * lift;
    const raisedZ = z + Math.sin(angle) * lift;
    positions.push(left, raisedY, raisedZ, right, raisedY, raisedZ);
    const row = extension && index === 0 ? -1.25 : (index - Number(extension)) / sections;
    uv.push(left / (2 * width) + 0.5, row, right / (2 * width) + 0.5, row);
    const i = index * 2;
    if (index < path.length - 1) triangles.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
  });
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(triangles);
  geometry.computeVertexNormals();
  return geometry;
}

function asphalt() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const noise = ctx.createImageData(256, 512);
  let seed = 13871;
  const random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 | 0) >>> 0) / 4294967296;
  for (let y = 0; y < 512; y += 1) {
    for (let x = 0; x < 256; x += 1) {
      const i = (y * 256 + x) * 4;
      const mottled = 153 + 7 * Math.sin(x / 41 + Math.cos(y / 53)) + 5 * Math.cos(y / 17);
      const grit = (random() - 0.5) * 42;
      const rubber = (Math.exp(-((x - 84) ** 2) / 110) + Math.exp(-((x - 171) ** 2) / 110)) * (7 + 8 * random());
      noise.data.set([mottled + grit - rubber, mottled + grit - rubber, mottled + grit - rubber + 2, 255], i);
    }
  }
  ctx.putImageData(noise, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function supportGeometry() {
  const positions: number[] = [];
  const line = (a: number[], b: number[]) => positions.push(...a, ...b);
  for (let i = 5; i <= sections; i += 5) {
    const { y, z } = segments[i];
    const top = Math.max(0, y - 0.22);
    for (const sign of [-1, 1]) {
      const front = [sign * (width + 0.16), top, z];
      const rear = [sign * (width + 0.26), top, z - 0.84];
      line(front, rear);
      line(rear, [sign * (width + 0.35), 0.02, z - 2.35]);
      const previous = segments[i - 5];
      line(rear, [sign * (width + 0.26), Math.max(0, previous.y - 0.22), previous.z - 0.84]);
      line(front, [sign * (width + 0.26), Math.max(0, previous.y - 0.22), previous.z - 0.84]);
    }
    line([-width, top, z - 0.25], [width, top, z - 0.25]);
  }
  for (const sign of [-1, 1]) {
    for (let i = 0; i < sections; i += 1) {
      const a = segments[i], b = segments[i + 1];
      line([sign * (width + 0.07), a.y - 0.20, a.z], [sign * (width + 0.07), b.y - 0.20, b.z]);
    }
  }
  return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
}

export default function LaunchRamp({ progressRef, cinematic }: { progressRef: ProgressRef; cinematic: boolean }) {
  const group = useRef<THREE.Group>(null);
  const lamps = useRef<THREE.MeshBasicMaterial>(null);
  const texture = useMemo(asphalt, []);
  const geometries = useMemo(() => [
    ribbon(-width, width, 0, true),
    ribbon(-0.026, 0.026, 0.009, true),
    ribbon(-width - 0.014, -width + 0.03, 0.016, true),
    ribbon(width - 0.03, width + 0.014, 0.016, true),
    ribbon(-width - 0.12, -width, -0.14),
    ribbon(width, width + 0.12, -0.14),
    supportGeometry(),
  ], []);

  useEffect(() => () => {
    texture.dispose();
    for (const geometry of geometries) geometry.dispose();
  }, [texture, geometries]);

  useFrame(() => {
    const p = progressRef.current;
    if (!group.current) return;
    group.current.visible = !cinematic || p >= montage.overhead;
    lamps.current?.color.setRGB(p >= montage.lineup ? 2.1 : 1.35, 0.019, 0.024);
  });

  return (
    <group ref={group} visible={false}>
      <mesh geometry={geometries[0]} receiveShadow>
        <meshStandardMaterial map={texture} side={THREE.DoubleSide} color="#c1c3c8" roughness={0.95} metalness={0.09} />
      </mesh>
      <mesh geometry={geometries[1]}>
        <meshStandardMaterial color="#9da3a9" roughness={0.87} />
      </mesh>
      <mesh geometry={geometries[2]}>
        <meshBasicMaterial ref={lamps} color="#ff211f" toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geometries[3]}>
        <meshBasicMaterial color={new THREE.Color(1.8, 0.019, 0.024)} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {[4, 5].map((index) => <mesh key={index} geometry={geometries[index]}>
        <meshStandardMaterial color="#333943" metalness={0.65} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>)}
      <lineSegments geometry={geometries[6]}>
        <lineBasicMaterial color="#464953" transparent opacity={0.69} />
      </lineSegments>
      {[-1, 1].map((side) => <group key={side}>
        {[-23, -18, -12, RAMP_START, 2, 8, 14].map((z, i) => <mesh key={z} position={[side * (3.4 + i * 0.085), 0.065, z]}>
          <boxGeometry args={[0.22, 0.09, 0.23]} />
          <meshBasicMaterial color={i < 3 ? '#8fbbdf' : '#f14536'} toneMapped={false} />
        </mesh>)}
      </group>)}
    </group>
  );
}

