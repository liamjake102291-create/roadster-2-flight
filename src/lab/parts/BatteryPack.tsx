import { useEffect, useMemo } from 'react';
import { createGridTexture } from '../materials';

export default function BatteryPack() {
  const grid = useMemo(() => createGridTexture('#41474d', '#14171a'), []);
  useEffect(() => () => grid.dispose(), [grid]);

  return (
    <group>
      {/* 电池包壳体 */}
      <mesh castShadow>
        <boxGeometry args={[1.7, 0.18, 0.95]} />
        <meshStandardMaterial map={grid} color="#4a5056" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* 顶部深色底座面板 */}
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[1.62, 0.02, 0.87]} />
        <meshStandardMaterial map={grid} color="#2c3136" metalness={0.55} roughness={0.45} />
      </mesh>
      {/* 电芯模组块（分格，亮色突出） */}
      {Array.from({ length: 12 }, (_, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        return (
          <mesh key={index} position={[(col - 1) * 0.5, 0.112, (row - 1.5) * 0.19]}>
            <boxGeometry args={[0.42, 0.024, 0.13]} />
            <meshStandardMaterial color="#a6adb3" metalness={0.78} roughness={0.26} />
          </mesh>
        );
      })}
      {/* 横向加强梁 */}
      {[-0.26, 0.26].map((z) => (
        <mesh key={z} position={[0, 0.125, z]}>
          <boxGeometry args={[1.64, 0.022, 0.035]} />
          <meshStandardMaterial color="#c7cdd2" metalness={0.9} roughness={0.28} />
        </mesh>
      ))}
      {/* 端部护板 */}
      {[-0.475, 0.475].map((z) => (
        <mesh key={z} position={[0, 0.01, z]}>
          <boxGeometry args={[1.7, 0.2, 0.045]} />
          <meshStandardMaterial color="#22262a" metalness={0.6} roughness={0.45} />
        </mesh>
      ))}
      {/* 正负极接线端子 */}
      {[-0.3, 0.3].map((x) => (
        <group key={x} position={[x, 0.14, 0.42]}>
          <mesh>
            <cylinderGeometry args={[0.028, 0.028, 0.055, 20]} />
            <meshStandardMaterial color={x < 0 ? '#c11a1e' : '#1c1f22'} metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.045, 0]}>
            <cylinderGeometry args={[0.013, 0.013, 0.04, 16]} />
            <meshStandardMaterial color="#d8dde1" metalness={0.9} roughness={0.25} />
          </mesh>
        </group>
      ))}
      {/* 冷却管路（铜色） */}
      {[-0.8, 0.8].map((x) => (
        <mesh key={x} position={[x, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.95, 20]} />
          <meshStandardMaterial color="#b08a3e" metalness={0.85} roughness={0.32} />
        </mesh>
      ))}
      {/* 底部散热鳍片 */}
      {Array.from({ length: 10 }, (_, index) => (
        <mesh key={index} position={[0, -0.1, (index - 4.5) * 0.08]}>
          <boxGeometry args={[1.5, 0.015, 0.03]} />
          <meshStandardMaterial color="#23272b" metalness={0.6} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}
