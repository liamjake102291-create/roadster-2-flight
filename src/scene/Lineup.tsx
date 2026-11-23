import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ProgressRef } from '../types';
import { montage, parkedVehicles } from './launchTimeline';

type Parked = typeof parkedVehicles[number];

function silhouette(kind: Parked['kind']) {
  const section = kind === 'semi'
    ? [[-1.65, .28], [-1.65, 1.60], [-1.22, 2.10], [.26, 2.10], [.46, 0.86], [1.65, .83], [1.65, .28]]
    : kind === 'pickup'
      ? [[-2.26,.26],[-2.23,.67],[-1.96,.87],[-.43,1.53],[.36,1.35],[2.15,.88],[2.22,.29]]
      : kind === 'cab'
        ? [[-1.84,.24],[-1.81,.65],[-1.38,.82],[-.70,1.32],[.58,1.33],[1.73,.80],[1.85,.26]]
        : [[-2.02,.20],[-2,.62],[-1.80,.79],[-1.04,.83],[-.52,1.21],[.63,1.21],[1.24,.78],[1.92,.74],[2.04,.22]];
  const shape = new THREE.Shape();
  section.forEach(([x, y], i) => i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y));
  shape.closePath();
  const depth = kind === 'semi' ? 1.56 : 1.36;
  const result = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: .095,
    bevelSize: .09, bevelSegments: 2, curveSegments: 1, steps: 1 });
  result.translate(0, 0, -depth / 2);
  result.computeVertexNormals();
  return result;
}

function ParkedVehicle({ data }: { data: Parked }) {
  const kind = data.kind;
  const body = useMemo(() => silhouette(kind), [kind]);
  const semi = kind === 'semi';
  const axle = semi ? 1.1 : kind === 'cab' ? 1.16 : 1.34;
  const roof = semi ? 1.82 : kind === 'pickup' ? 1.31 : kind === 'cab' ? 1.16 : 1.04;
  const wheelY = semi ? .34 : .30;
  return (
    <group position={[0, 0, data.z]} rotation={[0, 0.10, 0]}>
      <mesh geometry={body}>
        <meshStandardMaterial color={data.color} metalness={0.2} roughness={0.40} />
      </mesh>
      <mesh position={[semi ? -.83 : -.12,roof,0]}>
        <boxGeometry args={[semi ? .70 : 1.26,semi ? .33 : .21,semi ? 1.76 : 1.57]} />
        <meshStandardMaterial color="#111820" metalness={.21} roughness={.3} />
      </mesh>
      {[-axle, axle].flatMap(x => [-1, 1].map(side => (
        <group key={x + ':' + side} position={[x, wheelY, side * (semi ? .86 : .755)]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh><cylinderGeometry args={[wheelY, wheelY, .185, 16]} /><meshStandardMaterial color="#17191d" roughness={.93} /></mesh>
          <mesh position={[0,side * .096,0]}><cylinderGeometry args={[wheelY * .62,wheelY * .62,.022,14]} /><meshStandardMaterial color="#8e98a1" metalness={.55} roughness={.55} /></mesh>
        </group>
      )))}
      {[-1,1].map(side => (
        <group key={side}>
          <mesh position={[semi ? -1.76 : kind === 'cab' ? -1.94 : -2.09,.54,side*.50]}>
            <boxGeometry args={[.05,.08,.19]} /><meshBasicMaterial color="#d5e6ed" />
          </mesh>
          <mesh position={[semi ? 1.75 : kind === 'cab' ? 1.96 : 2.12,.57,side*.52]}>
            <boxGeometry args={[.05,.07,.22]} /><meshBasicMaterial color="#f74137" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Lineup({ progressRef }: { progressRef: ProgressRef }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.visible = progressRef.current >= montage.lineup && progressRef.current < montage.track + 0.008;
  });
  return (
    <group ref={group} visible={false}>
      {parkedVehicles.map(data => <ParkedVehicle key={data.z} data={data} />)}
      {[-3,3].map(x => (
        <mesh key={x} rotation={[-Math.PI/2,0,0]} position={[x,.008,23]}>
          <planeGeometry args={[.043,31]} /><meshBasicMaterial color="#b4493a" />
        </mesh>
      ))}
    </group>
  );
}
