import { useEffect, useMemo } from 'react';
import { createCarbonTexture } from '../materials';

const TANK_RADIUS = 0.19;
const CYL_LENGTH = 0.84;

export default function GasTank() {
  const carbon = useMemo(() => {
    const texture = createCarbonTexture();
    texture.repeat.set(6, 1);
    return texture;
  }, []);
  useEffect(() => () => carbon.dispose(), [carbon]);

  return (
    <group>
      {/* 罐体主体：胶囊形 */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[TANK_RADIUS, TANK_RADIUS, CYL_LENGTH, 64, 1]} />
        <meshStandardMaterial map={carbon} color="#e5c271" metalness={0.62} roughness={0.36} />
      </mesh>
      <mesh position={[-CYL_LENGTH / 2, 0, 0]}>
        <sphereGeometry args={[TANK_RADIUS, 48, 32]} />
        <meshStandardMaterial map={carbon} color="#e5c271" metalness={0.62} roughness={0.36} />
      </mesh>
      <mesh position={[CYL_LENGTH / 2, 0, 0]}>
        <sphereGeometry args={[TANK_RADIUS, 48, 32]} />
        <meshStandardMaterial map={carbon} color="#e5c271" metalness={0.62} roughness={0.36} />
      </mesh>

      {/* 端盖加强箍 */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (CYL_LENGTH / 2), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[TANK_RADIUS + 0.006, 0.013, 16, 64]} />
          <meshStandardMaterial color="#9a6f2c" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* 端环法兰（银色） */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (CYL_LENGTH / 2 + 0.04), 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[TANK_RADIUS + 0.012, 0.022, 20, 64]} />
            <meshStandardMaterial color="#c6ccd2" metalness={0.92} roughness={0.28} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[TANK_RADIUS + 0.03, TANK_RADIUS + 0.03, 0.06, 64]} />
            <meshStandardMaterial color="#aeb5bb" metalness={0.88} roughness={0.32} />
          </mesh>
        </group>
      ))}

      {/* 阀组与管路（右端） */}
      <group position={[CYL_LENGTH / 2 + 0.1, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.075, 0.075, 0.14, 32]} />
          <meshStandardMaterial color="#b8bec4" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 24]} />
          <meshStandardMaterial color="#c8a24b" metalness={0.85} roughness={0.32} />
        </mesh>
        {/* 竖直支管 */}
        <mesh position={[0.1, 0.09, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.16, 20]} />
          <meshStandardMaterial color="#b08a3e" metalness={0.85} roughness={0.35} />
        </mesh>
        {/* 压力传感器：表体 + 表盘 */}
        <mesh position={[0.12, 0.17, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.06, 28]} />
          <meshStandardMaterial color="#c9ced3" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0.12, 0.21, 0]}>
          <cylinderGeometry args={[0.048, 0.048, 0.018, 28]} />
          <meshStandardMaterial color="#101316" roughness={0.4} metalness={0.4} />
        </mesh>
        {/* 安全阀 */}
        <mesh position={[-0.02, 0.13, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.09, 20]} />
          <meshStandardMaterial color="#c11a1e" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* 鞍座支撑 */}
      {[-0.28, 0.28].map((x) => (
        <group key={x} position={[x, -TANK_RADIUS - 0.04, 0]}>
          <mesh position={[0, -0.03, 0]}>
            <boxGeometry args={[0.2, 0.06, 0.24]} />
            <meshStandardMaterial color="#22262a" metalness={0.6} roughness={0.5} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.05, 0]}>
            <torusGeometry args={[TANK_RADIUS + 0.02, 0.018, 12, 32, Math.PI]} />
            <meshStandardMaterial color="#3a3f44" metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
