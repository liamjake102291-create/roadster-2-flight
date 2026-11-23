import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { createFinTexture } from '../materials';

const FAN_BLADES = 12;

function useFanBlade() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0.06, 0);
    shape.quadraticCurveTo(0.12, 0.1, 0.27, 0.18);
    shape.lineTo(0.27, 0.2);
    shape.quadraticCurveTo(0.12, 0.13, 0.06, 0.06);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.022, bevelEnabled: false });
    geometry.rotateY(Math.PI / 2);
    return geometry;
  }, []);
}

function DuctShell() {
  const geometry = useMemo(() => {
    const points = [
      new THREE.Vector2(0.3, 0),
      new THREE.Vector2(0.32, 0.05),
      new THREE.Vector2(0.34, 0.1),
      new THREE.Vector2(0.34, 0.24),
      new THREE.Vector2(0.33, 0.3),
      new THREE.Vector2(0.31, 0.34),
    ];
    return new THREE.LatheGeometry(points, 64);
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color="#aab1b7" metalness={0.9} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.02, 0.03, 0]}>
        <torusGeometry args={[0.315, 0.012, 12, 64]} />
        <meshStandardMaterial color="#7c8389" metalness={0.85} roughness={0.34} />
      </mesh>
    </group>
  );
}

export default function DuctedFan() {
  const blade = useFanBlade();
  const fins = useMemo(() => createFinTexture('#9aa2a8', '#2b3035'), []);
  useEffect(() => () => blade.dispose(), [blade]);
  useEffect(() => () => fins.dispose(), [fins]);

  return (
    <group>
      <DuctShell />

      {/* 进气导流叶片 */}
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        return (
          <mesh key={index} rotation={[angle, 0, 0]} position={[0, 0.01, 0]}>
            <boxGeometry args={[0.012, 0.12, 0.08]} />
            <meshStandardMaterial color="#8b9298" metalness={0.85} roughness={0.32} />
          </mesh>
        );
      })}

      {/* 主扇叶 */}
      <group position={[0.06, 0, 0]}>
        {Array.from({ length: FAN_BLADES }, (_, index) => {
          const angle = (index / FAN_BLADES) * Math.PI * 2;
          return (
            <mesh key={index} geometry={blade} rotation={[angle, 0, 0]} castShadow>
              <meshStandardMaterial color="#b2b9bf" metalness={0.86} roughness={0.26} />
            </mesh>
          );
        })}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.06, 32]} />
          <meshStandardMaterial color="#b8bec4" metalness={0.9} roughness={0.26} />
        </mesh>
      </group>

      {/* 无刷电机 */}
      <group position={[0.2, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.16, 48]} />
          <meshStandardMaterial map={fins} color="#b8bec4" metalness={0.82} roughness={0.28} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[-0.09, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.02, 40]} />
          <meshStandardMaterial color="#c7cdd2" metalness={0.9} roughness={0.24} />
        </mesh>
        <mesh position={[0.09, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.07, 0.06, 24]} />
          <meshStandardMaterial color="#8b9298" metalness={0.85} roughness={0.3} />
        </mesh>
      </group>

      {/* 矢量气栅（出气口） */}
      <group position={[0.3, 0, 0]}>
        {Array.from({ length: 5 }, (_, index) => (
          <mesh key={index} position={[0, 0, (index - 2) * 0.075]} rotation={[0, 0, (index - 2) * 0.12]}>
            <boxGeometry args={[0.03, 0.34, 0.012]} />
            <meshStandardMaterial color="#aeb5bb" metalness={0.88} roughness={0.3} />
          </mesh>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.29, 0.014, 12, 48]} />
          <meshStandardMaterial color="#6f767c" metalness={0.8} roughness={0.34} />
        </mesh>
      </group>
    </group>
  );
}
