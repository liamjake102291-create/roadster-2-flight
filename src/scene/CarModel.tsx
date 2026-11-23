import { useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { PARTS, PART_MAP } from '../data/parts';
import { explosionAmount, lerp, smoothstep, thrustAmount } from '../scroll/math';
import type { NarrativeProps } from '../types';
import { createBodyGeometry, createCanopyGeometry } from './geometry';

interface CarModelProps extends NarrativeProps {
  selectedId: string;
  onSelect: (id: string) => void;
  mobile: boolean;
}

interface PartGroupProps extends NarrativeProps {
  id: string;
  selectedId: string;
  onSelect: (id: string) => void;
  children: ReactNode;
}

function ExplodableGroup({ id, progressRef, selectedId, onSelect, children }: PartGroupProps) {
  const group = useRef<THREE.Group>(null);
  const part = PART_MAP.get(id)!;

  useFrame(() => {
    if (!group.current) return;
    const amount = explosionAmount(progressRef.current);
    const local = smoothstep(part.explodeDelay, 1, amount);
    group.current.position.set(
      lerp(part.assembledPosition[0], part.explodedPosition[0], local),
      lerp(part.assembledPosition[1], part.explodedPosition[1], local),
      lerp(part.assembledPosition[2], part.explodedPosition[2], local),
    );
    group.current.rotation.set(
      lerp(part.assembledRotation[0], part.explodedRotation[0], local),
      lerp(part.assembledRotation[1], part.explodedRotation[1], local),
      lerp(part.assembledRotation[2], part.explodedRotation[2], local),
    );
    const targetScale = selectedId === id && amount > 0.6 ? 1.018 : 1;
    group.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
  });

  return (
    <group
      ref={group}
      onClick={(event) => {
        if (progressRef.current > 0.48 && progressRef.current < 0.84) {
          event.stopPropagation();
          onSelect(id);
        }
      }}
    >
      {children}
    </group>
  );
}

function PaintMaterial({ selected = false }: { selected?: boolean }) {
  return (
    <meshPhysicalMaterial
      color={selected ? '#ffffff' : '#e9e9e5'}
      metalness={0.32}
      roughness={0.22}
      clearcoat={1}
      clearcoatRoughness={0.13}
      envMapIntensity={1.15}
      emissive={selected ? '#5c090d' : '#000000'}
      emissiveIntensity={selected ? 0.22 : 0}
      side={THREE.DoubleSide}
    />
  );
}

export function Body({ selected }: { selected: boolean }) {
  const geometry = useMemo(createBodyGeometry, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <PaintMaterial selected={selected} />
      </mesh>
      <RoundedBox args={[1.46, 0.07, 0.13]} radius={0.025} position={[0, 0.46, -2.32]} castShadow>
        <meshStandardMaterial color="#090a0b" metalness={0.65} roughness={0.3} />
      </RoundedBox>
      <RoundedBox args={[1.58, 0.08, 0.12]} radius={0.025} position={[0, 0.5, 2.23]}>
        <meshStandardMaterial color="#08090a" metalness={0.55} roughness={0.32} />
      </RoundedBox>
      {[-0.57, 0.57].map((x) => (
        <RoundedBox key={x} args={[0.48, 0.035, 0.06]} radius={0.014} position={[x, 0.705, -2.23]} rotation={[-0.12, 0, 0]}>
          <meshStandardMaterial color="#eef7ff" emissive="#d9edff" emissiveIntensity={2.2} toneMapped={false} />
        </RoundedBox>
      ))}
      <RoundedBox args={[1.55, 0.035, 0.045]} radius={0.012} position={[0, 0.77, 2.2]}>
        <meshStandardMaterial color="#b50612" emissive="#e00b18" emissiveIntensity={2.4} toneMapped={false} />
      </RoundedBox>
      {[-1, 1].map((side) => (
        <group key={side}>
          <RoundedBox args={[0.09, 0.12, 2.85]} radius={0.035} position={[side * 0.97, 0.37, 0.05]}>
            <PaintMaterial selected={selected} />
          </RoundedBox>
          <RoundedBox args={[0.22, 0.07, 0.32]} radius={0.035} position={[side * 1.04, 1.01, -0.58]} rotation={[0, side * 0.22, 0]}>
            <PaintMaterial selected={selected} />
          </RoundedBox>
        </group>
      ))}
      <Line points={[[-0.58, 0.83, -1.94], [-0.46, 0.82, -1.05]]} color="#b7b8b5" lineWidth={0.45} />
      <Line points={[[0.58, 0.83, -1.94], [0.46, 0.82, -1.05]]} color="#b7b8b5" lineWidth={0.45} />
    </group>
  );
}

export function Canopy({ selected }: { selected: boolean }) {
  const geometry = useMemo(createCanopyGeometry, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group>
      <mesh geometry={geometry} castShadow>
        <meshPhysicalMaterial
          color={selected ? '#26333d' : '#090e13'}
          metalness={0.58}
          roughness={0.12}
          transmission={0.08}
          transparent
          opacity={0.94}
          clearcoat={1}
          envMapIntensity={1.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      <RoundedBox args={[0.2, 0.055, 1.18]} radius={0.025} position={[0, 1.39, 0.28]} rotation={[-0.025, 0, 0]}>
        <PaintMaterial selected={selected} />
      </RoundedBox>
      <Line points={[[-0.67, 0.87, -0.68], [-0.64, 1.16, 0.12], [-0.52, 1.15, 0.9]]} color="#c7c9c7" lineWidth={0.65} />
      <Line points={[[0.67, 0.87, -0.68], [0.64, 1.16, 0.12], [0.52, 1.15, 0.9]]} color="#c7c9c7" lineWidth={0.65} />
    </group>
  );
}

export function Door({ side, selected }: { side: -1 | 1; selected: boolean }) {
  return (
    <group>
      <RoundedBox args={[0.075, 0.53, 1.58]} radius={0.055} castShadow>
        <PaintMaterial selected={selected} />
      </RoundedBox>
      <RoundedBox args={[0.025, 0.026, 0.28]} radius={0.01} position={[side * 0.05, 0.13, 0.36]}>
        <meshStandardMaterial color="#17191b" metalness={0.8} roughness={0.25} />
      </RoundedBox>
      <Line points={[[side * 0.043, 0.24, -0.73], [side * 0.043, -0.24, -0.73]]} color="#5c5e60" lineWidth={0.5} />
    </group>
  );
}

export function Wheel({ id, progressRef, selected }: { id: string; progressRef: NarrativeProps['progressRef']; selected: boolean }) {
  const spinner = useRef<THREE.Group>(null);
  const side = id.endsWith('l') ? -1 : 1;
  useFrame(() => {
    if (spinner.current) spinner.current.rotation.x = progressRef.current * 20 * (1 - explosionAmount(progressRef.current));
  });
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.46, 0.46, 0.34, 48, 2]} />
        <meshStandardMaterial color={selected ? '#24272a' : '#101113'} roughness={0.72} metalness={0.08} />
      </mesh>
      {[-1, 1].map((face) => (
        <mesh key={face} position={[face * 0.13, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.355, 0.09, 12, 48]} />
          <meshStandardMaterial color="#121315" roughness={0.68} />
        </mesh>
      ))}
      <group ref={spinner} position={[side * 0.185, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.29, 0.29, 0.035, 48]} />
          <meshStandardMaterial color={selected ? '#d5d8dc' : '#91979e'} metalness={0.95} roughness={0.22} />
        </mesh>
        <mesh position={[side * -0.035, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.215, 0.215, 0.025, 40]} />
          <meshStandardMaterial color="#4a4d50" metalness={0.9} roughness={0.35} />
        </mesh>
        {Array.from({ length: 10 }, (_, index) => {
          const angle = (index / 10) * Math.PI * 2;
          return (
            <RoundedBox
              key={index}
              args={[0.045, 0.255, 0.035]}
              radius={0.012}
              position={[side * 0.03, Math.cos(angle) * 0.145, Math.sin(angle) * 0.145]}
              rotation={[angle, 0, 0]}
            >
              <meshStandardMaterial color="#b7bcc1" metalness={0.92} roughness={0.2} />
            </RoundedBox>
          );
        })}
        <mesh position={[side * 0.055, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.068, 0.068, 0.06, 32]} />
          <meshStandardMaterial color="#d5d7d9" metalness={0.9} roughness={0.22} />
        </mesh>
      </group>
      <RoundedBox args={[0.055, 0.16, 0.08]} radius={0.018} position={[side * 0.15, 0.02, -0.19]}>
        <meshStandardMaterial color="#a60712" metalness={0.45} roughness={0.32} />
      </RoundedBox>
    </group>
  );
}

export function Cockpit() {
  return (
    <group>
      {[-0.4, 0.4].map((x) => (
        <group key={x} position={[x, 0, 0.28]}>
          <RoundedBox args={[0.48, 0.14, 0.58]} radius={0.09} position={[0, 0.72, 0.1]}>
            <meshStandardMaterial color="#17191c" roughness={0.62} />
          </RoundedBox>
          <RoundedBox args={[0.47, 0.62, 0.15]} radius={0.08} position={[0, 1.0, 0.35]} rotation={[-0.18, 0, 0]}>
            <meshStandardMaterial color="#1c1e21" roughness={0.58} />
          </RoundedBox>
          <RoundedBox args={[0.26, 0.17, 0.12]} radius={0.05} position={[0, 1.34, 0.43]}>
            <meshStandardMaterial color="#111315" roughness={0.6} />
          </RoundedBox>
        </group>
      ))}
      <RoundedBox args={[1.35, 0.16, 0.32]} radius={0.05} position={[0, 0.97, -0.63]} rotation={[-0.1, 0, 0]}>
        <meshStandardMaterial color="#111418" metalness={0.3} roughness={0.42} />
      </RoundedBox>
      <mesh position={[-0.4, 1.09, -0.47]} rotation={[0.25, 0, 0]}>
        <torusGeometry args={[0.16, 0.023, 10, 32]} />
        <meshStandardMaterial color="#282c30" metalness={0.5} roughness={0.4} />
      </mesh>
      <RoundedBox args={[0.14, 0.28, 1.25]} radius={0.04} position={[0, 0.75, 0.05]}>
        <meshStandardMaterial color="#24272a" metalness={0.4} roughness={0.38} />
      </RoundedBox>
    </group>
  );
}

export function Chassis({ selected }: { selected: boolean }) {
  return (
    <group>
      <RoundedBox args={[1.68, 0.14, 3.62]} radius={0.07} position={[0, 0.4, 0]} castShadow>
        <meshStandardMaterial color={selected ? '#353b40' : '#171a1d'} metalness={0.72} roughness={0.35} />
      </RoundedBox>
      {[-0.75, 0.75].map((x) => (
        <RoundedBox key={x} args={[0.09, 0.14, 3.85]} radius={0.025} position={[x, 0.48, 0]}>
          <meshStandardMaterial color="#353a3f" metalness={0.82} roughness={0.3} />
        </RoundedBox>
      ))}
      {[-1.42, 1.4].map((z) => (
        <group key={z}>
          <RoundedBox args={[1.8, 0.1, 0.12]} radius={0.025} position={[0, 0.49, z]}>
            <meshStandardMaterial color="#4b5156" metalness={0.85} roughness={0.3} />
          </RoundedBox>
          {[-1, 1].map((side) => (
            <group key={side}>
              <Line points={[[side * 0.48, 0.43, z - 0.22], [side * 0.99, 0.52, z]]} color="#72787d" lineWidth={2} />
              <Line points={[[side * 0.48, 0.43, z + 0.22], [side * 0.99, 0.52, z]]} color="#72787d" lineWidth={2} />
              <mesh position={[side * 0.77, 0.64, z]} rotation={[0, 0, side * 0.5]}>
                <cylinderGeometry args={[0.035, 0.035, 0.45, 12]} />
                <meshStandardMaterial color="#a0a5a8" metalness={0.85} roughness={0.28} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

function Battery({ selected }: { selected: boolean }) {
  return (
    <group>
      <RoundedBox args={[1.48, 0.19, 2.35]} radius={0.055} castShadow>
        <meshStandardMaterial color={selected ? '#4d5359' : '#202428'} emissive={selected ? '#4a050b' : '#000000'} emissiveIntensity={selected ? 0.65 : 0} metalness={0.72} roughness={0.34} />
      </RoundedBox>
      {Array.from({ length: 12 }, (_, index) => {
        const column = index % 3;
        const row = Math.floor(index / 3);
        return (
          <RoundedBox key={index} args={[0.39, 0.025, 0.46]} radius={0.018} position={[(column - 1) * 0.44, 0.108, (row - 1.5) * 0.54]}>
            <meshStandardMaterial color="#343a3e" metalness={0.62} roughness={0.4} />
          </RoundedBox>
        );
      })}
      <Line points={[[-0.7, 0.12, -1.12], [-0.7, 0.12, 1.12]]} color="#a70a14" lineWidth={1.2} />
      <Line points={[[0.7, 0.12, -1.12], [0.7, 0.12, 1.12]]} color="#a70a14" lineWidth={1.2} />
    </group>
  );
}

export function DriveUnit({ selected }: { selected: boolean }) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.29, 0.29, 0.62, 32]} />
        <meshStandardMaterial color={selected ? '#69727a' : '#41474c'} metalness={0.85} roughness={0.28} />
      </mesh>
      {[-0.23, -0.12, 0, 0.12, 0.23].map((z) => (
        <mesh key={z} position={[0, 0, z]}>
          <torusGeometry args={[0.3, 0.018, 8, 32]} />
          <meshStandardMaterial color="#858c91" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
      <RoundedBox args={[0.48, 0.18, 0.4]} radius={0.035} position={[0, 0.27, 0]}>
        <meshStandardMaterial color="#252a2e" metalness={0.72} roughness={0.35} />
      </RoundedBox>
    </group>
  );
}

function Thruster({ progressRef, selected }: { progressRef: NarrativeProps['progressRef']; selected: boolean }) {
  const fan = useRef<THREE.Group>(null);
  const beam = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    const thrust = thrustAmount(progressRef.current);
    if (fan.current) fan.current.rotation.y = clock.elapsedTime * (2 + thrust * 24);
    if (beam.current) {
      beam.current.visible = thrust > 0.015;
      beam.current.scale.set(0.65 + thrust * 0.45, Math.max(0.01, thrust), 0.65 + thrust * 0.45);
      const material = beam.current.material as THREE.MeshBasicMaterial;
      material.opacity = thrust * 0.15;
    }
    if (core.current) core.current.emissiveIntensity = 0.35 + thrust * 5 + (selected ? 1 : 0);
  });
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.31, 0.065, 16, 48]} />
        <meshStandardMaterial color={selected ? '#666f77' : '#2d3237'} metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.025, 0]}>
        <torusGeometry args={[0.235, 0.018, 8, 40]} />
        <meshStandardMaterial ref={core} color="#b9d8e8" emissive="#a5dcff" emissiveIntensity={0.4} toneMapped={false} />
      </mesh>
      <group ref={fan}>
        {Array.from({ length: 6 }, (_, index) => {
          const angle = (index / 6) * Math.PI * 2;
          return (
            <RoundedBox key={index} args={[0.085, 0.025, 0.24]} radius={0.015} position={[Math.sin(angle) * 0.12, 0, Math.cos(angle) * 0.12]} rotation={[0, angle, 0.22]}>
              <meshStandardMaterial color="#81898f" metalness={0.85} roughness={0.28} />
            </RoundedBox>
          );
        })}
        <mesh>
          <cylinderGeometry args={[0.07, 0.09, 0.12, 24]} />
          <meshStandardMaterial color="#b3b8bc" metalness={0.9} roughness={0.24} />
        </mesh>
      </group>
      <mesh ref={beam} position={[0, -1.25, 0]}>
        <cylinderGeometry args={[0.1, 0.25, 2.5, 20, 1, true]} />
        <meshBasicMaterial color="#b9e4ff" transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function CarModel(props: CarModelProps) {
  const partProps = (id: string) => ({
    id,
    progressRef: props.progressRef,
    reducedMotion: props.reducedMotion,
    selectedId: props.selectedId,
    onSelect: props.onSelect,
  });

  return (
    <group>
      <ExplodableGroup {...partProps('body')}><Body selected={props.selectedId === 'body'} /></ExplodableGroup>
      <ExplodableGroup {...partProps('canopy')}><Canopy selected={props.selectedId === 'canopy'} /></ExplodableGroup>
      <ExplodableGroup {...partProps('door-left')}><Door side={-1} selected={props.selectedId === 'door-left'} /></ExplodableGroup>
      <ExplodableGroup {...partProps('door-right')}><Door side={1} selected={props.selectedId === 'door-right'} /></ExplodableGroup>
      <ExplodableGroup {...partProps('cockpit')}><Cockpit /></ExplodableGroup>
      {PARTS.filter((part) => part.id.startsWith('wheel-')).map((part) => (
        <ExplodableGroup key={part.id} {...partProps(part.id)}>
          <Wheel id={part.id} progressRef={props.progressRef} selected={props.selectedId === part.id} />
        </ExplodableGroup>
      ))}
      <ExplodableGroup {...partProps('chassis')}><Chassis selected={props.selectedId === 'chassis'} /></ExplodableGroup>
      <ExplodableGroup {...partProps('battery')}><Battery selected={props.selectedId === 'battery'} /></ExplodableGroup>
      <ExplodableGroup {...partProps('drive-front')}><DriveUnit selected={props.selectedId === 'drive-front'} /></ExplodableGroup>
      <ExplodableGroup {...partProps('drive-rear')}><DriveUnit selected={props.selectedId === 'drive-rear'} /></ExplodableGroup>
      {PARTS.filter((part) => part.id.startsWith('thruster-')).map((part) => (
        <ExplodableGroup key={part.id} {...partProps(part.id)}>
          <Thruster progressRef={props.progressRef} selected={props.selectedId === part.id} />
        </ExplodableGroup>
      ))}
    </group>
  );
}
