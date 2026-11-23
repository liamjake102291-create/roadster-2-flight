import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { explosionAmount } from '../scroll/math';
import type { NarrativeProps } from '../types';
import { launchPose, montage } from './launchTimeline';
import { createShadowTexture } from './geometry';

function GroundShadow({ progressRef, mobile }: Pick<NarrativeProps, 'progressRef'> & { mobile: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const texture = useMemo(createShadowTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame(() => {
    if (!mesh.current) return;
    const p = progressRef.current;
    const pose = launchPose(p);
    const height = pose.y;
    mesh.current.position.set(pose.x, 0.013, pose.z);
    mesh.current.visible = p >= montage.overhead && (p < montage.track || p > montage.fly);
    const scale = (mobile ? 0.84 : 1) * (1 + height * 0.18);
    mesh.current.scale.set(4.6 * scale, 6.2 * scale, 1);
    const material = mesh.current.material as THREE.MeshBasicMaterial;
    material.opacity = (0.52 / (1 + height * 0.65)) * (1 - explosionAmount(p) * 0.96);
  });
  return (
    <mesh ref={mesh} position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={0}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} opacity={0.5} />
    </mesh>
  );
}

export default GroundShadow;
