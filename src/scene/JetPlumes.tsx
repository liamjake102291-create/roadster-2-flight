import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { smoothstep } from '../scroll/math';
import type { NarrativeProps } from '../types';
import { buildWake, movePuff } from './exhaustWake';
import { flight, HANDOFF, LANDING, lineup, maneuverSeconds, playbackSeconds } from './launchTimeline';

const vertexShader = `
  attribute vec3 puffCenter;
  attribute vec4 puffShape;
  varying vec2 mistUv;
  varying float mistAlpha;
  void main() {
    float c = cos(puffShape.z), s = sin(puffShape.z);
    vec4 center = modelViewMatrix * vec4(puffCenter, 1.0);
    center.xy += mat2(c, s, -s, c) * (position.xy * puffShape.xy);
    mistUv = uv;
    mistAlpha = puffShape.w;
    gl_Position = projectionMatrix * center;
  }
`;

const fragmentShader = `
  uniform sampler2D mist;
  uniform vec3 tint;
  varying vec2 mistUv;
  varying float mistAlpha;
  void main() {
    float alpha = texture2D(mist, mistUv).a * mistAlpha;
    gl_FragColor = vec4(tint, alpha);
    #include <colorspace_fragment>
  }
`;

function createMist() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const lobes = [[64, 64, 50, 0.69], [38, 65, 28, 0.30], [76, 35, 27, 0.35], [84, 80, 34, 0.48], [55, 93, 25, 0.33]];
  for (const [x, y, radius, strength] of lobes) {
    const mist = ctx.createRadialGradient(x, y, 1, x, y, radius);
    mist.addColorStop(0, 'rgba(246,250,255,' + strength + ')');
    mist.addColorStop(0.5, 'rgba(236,245,254,' + strength * 0.54 + ')');
    mist.addColorStop(1, 'rgba(228,238,247,0)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(canvas);
}

function createBatch(count: number) {
  const geometry = new THREE.InstancedBufferGeometry();
  const plane = new THREE.PlaneGeometry(1, 1);
  geometry.setIndex(plane.index);
  geometry.setAttribute('position', plane.getAttribute('position'));
  geometry.setAttribute('uv', plane.getAttribute('uv'));
  const centers = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const shapes = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('puffCenter', centers);
  geometry.setAttribute('puffShape', shapes);
  geometry.instanceCount = 0;
  return { geometry, centers, shapes };
}

export default function JetPlumes({ progressRef, mobile, reducedMotion }: NarrativeProps & { mobile: boolean }) {
  const mist = useMemo(createMist, []);
  const stride = reducedMotion ? 11 : mobile ? 17 : 26;
  const wake = useMemo(() => buildWake(stride), [stride]);
  const count = reducedMotion ? 58 : mobile ? 96 : 156;
  const batch = useMemo(() => createBatch(count), [count]);
  const uniforms = useMemo(() => ({ mist: { value: mist }, tint: { value: new THREE.Color('#e8f4ff') } }), [mist]);
  const mesh = useRef<THREE.Mesh>(null);
  const position = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => () => mist.dispose(), [mist]);
  useEffect(() => () => batch.geometry.dispose(), [batch]);

  useFrame(() => {
    const p = progressRef.current;
    const t = maneuverSeconds(p);
    const inspectionTime = p > HANDOFF && p < LANDING ? playbackSeconds(p) - flight.hover : 0;
    const fade = 1 - smoothstep(0.10, 1.0, inspectionTime);
    const { geometry, centers, shapes } = batch;
    let slot = 0;
    if (fade > 0.009) {
      let low = 0, high = wake.length;
      while (low < high) {
        const middle = (low + high) >>> 1;
        if (wake[middle].born <= t) low = middle + 1;
        else high = middle;
      }
      for (let i = low - 1; i >= 0 && t - wake[i].born < 2.1 && slot < count; i -= 1) {
        const puff = wake[i], age = t - puff.born;
        if (age >= puff.lifetime) continue;
        const rebound = movePuff(puff, age, position);
        const size = (0.13 + 0.89 * age ** 0.72) * puff.width * (0.72 + puff.power * 0.32);
        const opacity = (puff.born < lineup.start ? 0.85 : mobile ? 0.59 : 0.52) * fade *
          (0.35 + puff.power * 0.66) * (1 - smoothstep(0.41 * puff.lifetime, puff.lifetime, age));
        centers.setXYZ(slot, position.x, position.y, position.z);
        shapes.setXYZW(slot, size * (1 + 0.72 * smoothstep(0, 0.43, rebound)),
          size * (1 - 0.49 * smoothstep(0, 0.33, rebound)), puff.direction + age * puff.spin, opacity);
        slot += 1;
      }
    }
    geometry.instanceCount = slot;
    if (mesh.current) mesh.current.visible = slot > 0;
    if (slot > 0) {
      centers.needsUpdate = true;
      shapes.needsUpdate = true;
    }
  });

  return (
    <mesh ref={mesh} geometry={batch.geometry} visible={false} frustumCulled={false} renderOrder={2}>
      <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms}
        transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
