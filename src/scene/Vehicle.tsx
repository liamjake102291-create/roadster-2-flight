import { useEffect, useMemo } from 'react';
import { Html, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ASSEMBLY_MAP } from '../data/assemblies';
import { chapterWindow, explosionAmount, smoothstep } from '../scroll/math';
import type { ProgressRef } from '../types';
import { flight, maneuverSeconds, montage, wheelRotation } from './launchTimeline';

const MODEL_URL = import.meta.env.BASE_URL + 'models/roadster.glb';
const COMPRESSED_DELIVERY = import.meta.env.VITE_PAGES_DELIVERY === 'true' && typeof DecompressionStream !== 'undefined';

async function fetchModelUrl() {
  try {
    const response = await fetch(MODEL_URL + '.gz');
    if (!response.ok || !response.body) return MODEL_URL;
    const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
    const model = await new Response(stream).blob();
    return URL.createObjectURL(model);
  } catch {
    return MODEL_URL;
  }
}

let resolvedUrl: string | undefined = COMPRESSED_DELIVERY ? undefined : MODEL_URL;
const pendingUrl = COMPRESSED_DELIVERY ? fetchModelUrl().then((url) => { resolvedUrl = url; }) : null;

function getModelUrl() {
  if (!resolvedUrl) throw pendingUrl;
  return resolvedUrl;
}
const highlight = new THREE.Color('#82b9e8');
const scanBlue = new THREE.Color('#379bff');
const covers = new Set(['body', 'canopy', 'nacelle', 'fascia-front', 'fascia-rear']);

interface VehicleProps {
  progressRef: ProgressRef;
  selectedId?: string;
  onSelect?: (id: string) => void;
  xray?: boolean;
  cinematic?: boolean;
}

export default function Vehicle({ progressRef, selectedId, onSelect, xray = false, cinematic = false }: VehicleProps) {
  const { scene } = useGLTF(getModelUrl());
  const parts = useMemo(() => {
    const model = scene.getObjectByName('Roadster_2_Concept') ?? scene;
    return model.children.map((source) => {
      const part = ASSEMBLY_MAP.get(source.name);
      if (!part) throw new Error('Unknown roadster assembly ' + source.name);
      const object = source.clone();
      const finishes: {
        material: THREE.MeshStandardMaterial; glow: number; led: boolean; color: THREE.Color; emissive: THREE.Color;
      }[] = [];
      object.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const material = (child.material as THREE.MeshStandardMaterial).clone();
        child.material = material;
        child.castShadow = true;
        child.receiveShadow = false;
        if (material.name.startsWith('CFRP')) {
          material.color.set('#303741');
          material.roughness = 0.36;
          material.metalness = 0.32;
        }
        if (material.name.includes('Pearl white')) {
          material.roughness = Math.max(0.28, material.roughness);
          material.metalness = 0.27;
          if (material instanceof THREE.MeshPhysicalMaterial) material.clearcoatRoughness = 0.18;
        }
        const led = material.name.startsWith('LED');
        finishes.push({ material, glow: material.emissiveIntensity, led, color: material.color.clone(), emissive: material.emissive.clone() });
        if (led) material.toneMapped = false;
      });
      return { part, object, rest: source.position.clone(), finishes, ghost: false };
    });
  }, [scene]);

  useEffect(() => () => {
    for (const { finishes } of parts) for (const { material } of finishes) material.dispose();
  }, [parts]);

  useFrame(() => {
    const p = progressRef.current;
    const amount = explosionAmount(p);
    const scan = cinematic && p >= montage.scan && p < montage.nozzle;
    const cabin = cinematic && p < montage.flow;
    const ignition = smoothstep(montage.lightbar, montage.lightbar + 0.009, p);
    const wheelLight = smoothstep(montage.approach, montage.track, p);
    const nozzleShot = cinematic ? chapterWindow(p, montage.nozzle, montage.nozzle + 0.004, montage.silhouette - 0.005, montage.silhouette) : 0;
    const steering = -0.075 * chapterWindow(maneuverSeconds(p), flight.touch + 0.14, 19.18, 19.54, 20.34);
    const wheelSpin = wheelRotation(p);
    for (const entry of parts) {
      const { part, object, rest, finishes } = entry;
      const ghost = (xray || scan) && covers.has(part.id);
      if (entry.ghost !== ghost) {
        entry.ghost = ghost;
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.renderOrder = ghost ? 5 : 0;
            child.castShadow = !ghost;
          }
        });
        for (const { material } of finishes) {
          material.transparent = ghost;
          material.depthWrite = !ghost;
          material.opacity = ghost ? (part.id === 'canopy' ? 0.13 : 0.23) : 1;
          material.needsUpdate = true;
        }
      }
      const blend = smoothstep(part.delay, 1, amount);
      const [x, y, z] = part.offset;
      object.visible = !cabin || part.id === 'cockpit';
      object.position.set(rest.x + x * blend, rest.y + y * blend, rest.z + z * blend);
      const corner = /^(wheel|brake)-f/.test(part.id);
      const spin = part.id.startsWith('wheel-') ? wheelSpin : 0;
      object.rotation.set(spin, (corner ? steering : 0) + x * blend * 0.054, z * blend * 0.035, 'YXZ');
      const selected = selectedId === part.id && (xray || amount > 0.15);
      for (const { material, glow, led, color, emissive } of finishes) {
        material.color.copy(color);
        material.emissive.copy(emissive);
        material.emissiveIntensity = glow;
        if (scan) {
          material.color.lerp(scanBlue, 0.67);
          material.emissive.copy(scanBlue);
          material.emissiveIntensity = ghost ? 0.28 : 0.13;
        } else if (led) {
          const wheel = material.name.includes('wheel');
          const power = wheel ? wheelLight : ignition;
          material.color.multiplyScalar(0.03 + power * 0.49);
          material.emissiveIntensity = power * (wheel ? 0.34 : 0.82) * Math.min(glow, 3.75);
          if (part.id === 'fascia-rear' && power > 0) material.emissiveIntensity = 1.65;
        } else if (selected) {
          material.emissive.copy(highlight);
          material.emissiveIntensity = 0.12;
        } else if (part.id === 'nacelle' && nozzleShot > 0 && material.name.startsWith('Machined')) {
          material.emissive.copy(scanBlue);
          material.emissiveIntensity = nozzleShot * 0.12;
        }
      }
    }
  });

  return (
    <group>
      {parts.map(({ part, object }) => (
        <primitive key={part.id} object={object} onClick={(event: import('@react-three/fiber').ThreeEvent<MouseEvent>) => {
          if (!onSelect || event.delta > 5 || (!xray && explosionAmount(progressRef.current) < 0.16)) return;
          if (xray && covers.has(part.id)) return;
          event.stopPropagation();
          onSelect(part.id);
        }}>
          {selectedId === part.id && onSelect && (
            <Html center position={[0, 0.12, 0]} zIndexRange={[7, 0]} style={{ pointerEvents: 'none' }}>
              <span className="part-pin">{part.label}</span>
            </Html>
          )}
        </primitive>
      ))}
    </group>
  );
}

if (!COMPRESSED_DELIVERY) useGLTF.preload(MODEL_URL);
