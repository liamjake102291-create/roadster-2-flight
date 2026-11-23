import type { MutableRefObject } from 'react';

export type Vec3 = [number, number, number];

export type PartCategory = 'BODY' | 'CHASSIS' | 'BATTERY' | 'DRIVE UNITS' | 'THRUSTERS' | 'COCKPIT';

export interface ExplodablePart {
  id: string;
  label: string;
  category: PartCategory;
  description: string;
  assembledPosition: Vec3;
  explodedPosition: Vec3;
  assembledRotation: Vec3;
  explodedRotation: Vec3;
  explodeDelay: number;
}

export type ProgressRef = MutableRefObject<number>;

export interface NarrativeProps {
  progressRef: ProgressRef;
  reducedMotion: boolean;
}
export type ViewMode = 'surface' | 'xray' | 'orbit';
