import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { chapterWindow } from '../scroll/math';
import type { NarrativeProps } from '../types';
import { HANDOFF, LANDING, launchPower, montage } from './launchTimeline';

export default function LaunchStage({ progressRef, cinematic }: Pick<NarrativeProps, 'progressRef'> & { cinematic: boolean }) {
  const stage = useRef<THREE.Group>(null);
  const pad = useRef<THREE.Group>(null);
  const edgeLight = useRef<THREE.MeshBasicMaterial>(null);
  const strips = useMemo(() => Array.from({length: 22}, (_, i) => (i - 10.5) * 0.55), []);
  useFrame(() => {
    const p = progressRef.current;
    if (stage.current) stage.current.visible = !cinematic || p >= montage.overhead;
    if (pad.current) pad.current.visible = p > HANDOFF + 0.002 && p < LANDING - 0.015;
    const active = launchPower(p) + chapterWindow(p, 0.86, 0.94, 0.98, 1.02);
    edgeLight.current?.color.setRGB(0.37 + active * 0.63, 0.026 + active * 0.04, 0.014);
  });

  return (
    <group ref={stage}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.017, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#161a20" metalness={0.60} roughness={0.49} />
      </mesh>
      <group ref={pad}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.008, 0]}>
          <ringGeometry args={[3.32, 3.346, 144]} />
          <meshBasicMaterial color="#687079" transparent opacity={0.49} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.009, 0]}>
          <ringGeometry args={[3.55, 3.575, 144, 1, Math.PI * 0.15, Math.PI * 1.45]} />
          <meshBasicMaterial ref={edgeLight} color="#a53624" toneMapped={false} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 4.05, -0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.012, 16.5]} />
              <meshBasicMaterial color="#685347" />
            </mesh>
            {strips.map((z, index) => (
              <mesh key={z} position={[side * 4.16, -0.006, z]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[index % 5 === 0 ? 0.22 : 0.08, 0.013]} />
                <meshBasicMaterial color="#79736e" transparent opacity={0.55} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}
