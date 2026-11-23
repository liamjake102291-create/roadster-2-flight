import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { NarrativeProps, ViewMode } from '../types';
import Vehicle from './Vehicle';
import { launchPose } from './launchTimeline';

interface CarRigProps extends NarrativeProps {
  selectedId: string;
  onSelect: (id: string) => void;
  mobile: boolean;
  mode: ViewMode;
}

export default function CarRig({ progressRef, selectedId, onSelect, mode }: CarRigProps) {
  const root = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!root.current) return;
    const p = progressRef.current;
    const pose = launchPose(p);
    root.current.position.set(pose.x, pose.y, pose.z);
    root.current.rotation.set(pose.pitch, pose.yaw, pose.roll, 'XYZ');
  }, -2);

  return (
    <group ref={root}>
      <Vehicle progressRef={progressRef} selectedId={selectedId} onSelect={onSelect}
        xray={mode === 'xray'} cinematic={mode === 'surface'} />
    </group>
  );
}

