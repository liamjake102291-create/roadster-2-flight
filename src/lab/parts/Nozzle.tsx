import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const BLADE_COUNT = 12;

function useImpellerBlade() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0.05, 0);
    shape.quadraticCurveTo(0.13, 0.05, 0.21, 0.085);
    shape.lineTo(0.21, 0.095);
    shape.quadraticCurveTo(0.13, 0.06, 0.05, 0.04);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.014, bevelEnabled: false });
    geometry.rotateY(Math.PI / 2);
    return geometry;
  }, []);
}

function IntakeBell() {
  const geometry = useMemo(() => {
    const points = [
      new THREE.Vector2(0.1, 0),
      new THREE.Vector2(0.115, 0.03),
      new THREE.Vector2(0.16, 0.12),
      new THREE.Vector2(0.22, 0.22),
      new THREE.Vector2(0.28, 0.3),
      new THREE.Vector2(0.3, 0.32),
      new THREE.Vector2(0.3, 0.34),
      new THREE.Vector2(0.28, 0.34),
    ];
    return new THREE.LatheGeometry(points, 48);
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color="#c2c9cf" metalness={0.9} roughness={0.28} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: 6 }, (_, index) => {
        const angle = (index / 6) * Math.PI * 2;
        return (
          <mesh key={index} rotation={[angle, 0, 0]} position={[0, 0.02, 0]}>
            <boxGeometry args={[0.01, 0.1, 0.09]} />
            <meshStandardMaterial color="#9aa2a8" metalness={0.85} roughness={0.32} />
          </mesh>
        );
      })}
    </group>
  );
}

function Impeller() {
  const blade = useImpellerBlade();
  useEffect(() => () => blade.dispose(), [blade]);
  return (
    <group>
      {Array.from({ length: BLADE_COUNT }, (_, index) => {
        const angle = (index / BLADE_COUNT) * Math.PI * 2;
        return (
          <mesh key={index} geometry={blade} rotation={[angle, 0, 0]} castShadow>
            <meshStandardMaterial color="#aab1b7" metalness={0.86} roughness={0.28} />
          </mesh>
        );
      })}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.05, 32]} />
        <meshStandardMaterial color="#b8bec4" metalness={0.9} roughness={0.26} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.06, 24]} />
        <meshStandardMaterial color="#454b50" metalness={0.8} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Stator() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.26, 0.055, 24, 64]} />
        <meshStandardMaterial color="#aeb5bb" metalness={0.88} roughness={0.3} />
      </mesh>
      {Array.from({ length: 16 }, (_, index) => {
        const angle = (index / 16) * Math.PI * 2;
        return (
          <mesh key={index} position={[0, Math.cos(angle) * 0.24, Math.sin(angle) * 0.24]} rotation={[angle, 0, 0]}>
            <boxGeometry args={[0.05, 0.045, 0.045]} />
            <meshStandardMaterial color="#d28a2e" metalness={0.85} roughness={0.3} />
          </mesh>
        );
      })}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.09, 40]} />
        <meshStandardMaterial color="#3c4247" metalness={0.7} roughness={0.42} />
      </mesh>
    </group>
  );
}

function Rotor() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.22, 48]} />
        <meshStandardMaterial color="#b9bfc5" metalness={0.9} roughness={0.27} />
      </mesh>
      {Array.from({ length: 24 }, (_, index) => {
        const angle = (index / 24) * Math.PI * 2;
        return (
          <mesh key={index} position={[0, Math.cos(angle) * 0.165, Math.sin(angle) * 0.165]} rotation={[angle, 0, 0]}>
            <boxGeometry args={[0.24, 0.012, 0.016]} />
            <meshStandardMaterial color="#2b3035" metalness={0.6} roughness={0.5} />
          </mesh>
        );
      })}
      <mesh position={[0.12, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 20]} />
        <meshStandardMaterial color="#8b9298" metalness={0.85} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Bearing() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.09, 0.025, 16, 40]} />
        <meshStandardMaterial color="#c7cdd2" metalness={0.9} roughness={0.24} />
      </mesh>
      {Array.from({ length: 9 }, (_, index) => {
        const angle = (index / 9) * Math.PI * 2;
        return (
          <mesh key={index} position={[0, Math.cos(angle) * 0.09, Math.sin(angle) * 0.09]}>
            <sphereGeometry args={[0.016, 16, 12]} />
            <meshStandardMaterial color="#e5e8ea" metalness={0.92} roughness={0.18} />
          </mesh>
        );
      })}
    </group>
  );
}

function SealRing() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.2, 0.2, 0.035, 48]} />
      <meshStandardMaterial color="#7c4a12" metalness={0.55} roughness={0.45} />
    </mesh>
  );
}

function NozzleCone() {
  const geometry = useMemo(() => {
    const points = [
      new THREE.Vector2(0.2, 0),
      new THREE.Vector2(0.2, 0.04),
      new THREE.Vector2(0.16, 0.14),
      new THREE.Vector2(0.09, 0.26),
      new THREE.Vector2(0.06, 0.3),
      new THREE.Vector2(0.06, 0.34),
    ];
    return new THREE.LatheGeometry(points, 48);
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group rotation={[0, 0, -Math.PI / 2]}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color="#9ba3a9" metalness={0.9} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.03, 32]} />
        <meshStandardMaterial color="#2a2e32" metalness={0.6} roughness={0.5} emissive="#1a0a05" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function VectorLinkage() {
  return (
    <group position={[0.3, -0.34, 0]}>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.34, 0.03, 0.05]} />
        <meshStandardMaterial color="#6f767c" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[-0.17, -0.05, 0]} rotation={[0, 0, 0.6]}>
        <boxGeometry args={[0.02, 0.16, 0.04]} />
        <meshStandardMaterial color="#8b9298" metalness={0.82} roughness={0.32} />
      </mesh>
      <mesh position={[0.17, -0.05, 0]} rotation={[0, 0, -0.6]}>
        <boxGeometry args={[0.02, 0.16, 0.04]} />
        <meshStandardMaterial color="#8b9298" metalness={0.82} roughness={0.32} />
      </mesh>
      {[-0.17, 0.17].map((x) => (
        <mesh key={x} position={[x, -0.16, 0]}>
          <sphereGeometry args={[0.028, 16, 12]} />
          <meshStandardMaterial color="#c6ccd2" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.06, 20]} />
        <meshStandardMaterial color="#aab1b7" metalness={0.85} roughness={0.3} />
      </mesh>
    </group>
  );
}

export default function Nozzle() {
  const spacing = 0.46;
  return (
    <group>
      <group position={[-spacing * 3, 0, 0]}><IntakeBell /></group>
      <group position={[-spacing * 2, 0, 0]}><Impeller /></group>
      <group position={[-spacing, 0, 0]}><Stator /></group>
      <group position={[0, 0, 0]}><Rotor /></group>
      <group position={[spacing, 0, 0]}><Bearing /></group>
      <group position={[spacing * 2, 0, 0]}><SealRing /></group>
      <group position={[spacing * 3, 0, 0]}><NozzleCone /></group>
      <VectorLinkage />
    </group>
  );
}
