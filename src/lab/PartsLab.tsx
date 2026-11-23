import { Suspense } from 'react';
import type { ComponentType } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import GasTank from './parts/GasTank';
import Nozzle from './parts/Nozzle';
import DuctedFan from './parts/DuctedFan';
import BatteryPack from './parts/BatteryPack';
import CarExploded from './parts/CarExploded';

export interface LabPart {
  id: string;
  label: string;
  en: string;
  description: string;
  component: ComponentType;
  scale: number;
}

export const LAB_PARTS: LabPart[] = [
  {
    id: 'car-exploded',
    label: '整车爆炸图',
    en: 'FULL CAR EXPLOSION',
    description: '27 组总成沿各自路径展开，包括车壳、玻璃、座舱、电驱、轮刹、风扇及喷口。',
    component: CarExploded,
    scale: 0.62,
  },
  {
    id: 'gas-tank',
    label: '高压气体储罐',
    en: 'HIGH-PRESSURE TANK',
    description: '碳纤维复合高压气瓶，球面端盖与环向缠绕纹理，端环法兰、阀门组与压力传感器。',
    component: GasTank,
    scale: 1.5,
  },
  {
    id: 'nozzle',
    label: '推进喷嘴',
    en: 'PROPULSION NOZZLE',
    description: '轴向爆炸分解：进气导流器、复合材料叶轮、定子铜绕组、转子、轴承、密封环与收缩喷口。',
    component: Nozzle,
    scale: 0.82,
  },
  {
    id: 'fan',
    label: '涵道风扇',
    en: 'DUCTED FAN',
    description: '导流罩与导流叶片、密集后弯扇叶、无刷电机散热槽，出气口矢量气栅。',
    component: DuctedFan,
    scale: 1.45,
  },
  {
    id: 'battery',
    label: '电池包',
    en: 'BATTERY PACK',
    description: '网格面板结构壳体，加强梁、端部护板、正负极接线端子与底部散热鳍片。',
    component: BatteryPack,
    scale: 1.35,
  },
];

interface PartsLabProps {
  activeId: string;
  onSelect: (id: string) => void;
  onExit: () => void;
}

export default function PartsLab({ activeId, onSelect, onExit }: PartsLabProps) {
  const part = LAB_PARTS.find((item) => item.id === activeId) ?? LAB_PARTS[0];
  const Active = part.component;

  return (
    <div className="lab-root">
      <div className="lab-canvas">
        <Canvas
          dpr={[1, 1.75]}
          camera={{ position: [3.8, 1.35, 4.2], fov: 40, near: 0.1, far: 60 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          shadows
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.16;
            gl.outputColorSpace = THREE.SRGBColorSpace;
          }}
          role="img"
          aria-label={`3D 零件工坊，当前显示 ${part.label}，可拖动旋转查看细节。`}
        >
          <color attach="background" args={['#1c1f24']} />
          <ambientLight intensity={0.62} color="#d3dce5" />
          <directionalLight position={[4, 6, 3]} color="#f3f6f9" intensity={3.2} castShadow shadow-mapSize={[1024, 1024]} />
          <spotLight position={[-5, 4, -3]} color="#e2ebf4" intensity={42} angle={0.5} penumbra={0.9} distance={14} />
          <spotLight position={[0, 3, 5]} color="#ffffff" intensity={32} angle={0.5} penumbra={1} distance={12} />
          <spotLight position={[0, -3, 2]} color="#9fb2c4" intensity={18} angle={0.7} penumbra={1} distance={9} />
          <spotLight position={[-6, 1.5, -6]} color="#8fb4d0" intensity={30} angle={0.6} penumbra={1} distance={16} />
          <Environment resolution={128}>
            <Lightformer form="rect" intensity={3.2} color="#ffffff" scale={[6, 1, 1]} position={[0, 5, -2]} rotation={[Math.PI / 2, 0, 0]} />
            <Lightformer form="rect" intensity={1.9} color="#c8d8e8" scale={[4, 1, 1]} position={[-4, 2, 1]} rotation={[0, Math.PI / 2, 0]} />
            <Lightformer form="rect" intensity={1.5} color="#ffffff" scale={[4, 1, 1]} position={[4, 2, 0]} rotation={[0, -Math.PI / 2, 0]} />
            <Lightformer form="rect" intensity={1.2} color="#8fa4b8" scale={[3, 1, 1]} position={[0, -2, 1]} rotation={[Math.PI / 2, 0, 0]} />
          </Environment>
          <group key={`part-${part.id}`} scale={part.scale}>
            <Suspense fallback={null}><Active /></Suspense>
          </group>
          <OrbitControls
            key={`controls-${part.id}`}
            target={[0, 0, 0]}
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            minDistance={1.1}
            maxDistance={8}
            autoRotate
            autoRotateSpeed={0.8}
          />
        </Canvas>
      </div>

      <aside className="lab-panel">
        <div className="lab-head">
          <div>
            <p className="lab-kicker">TESLA · ROADSTER · CONCEPT</p>
            <h1>零件工坊</h1>
            <p className="lab-sub">PARTS LAB — 拖动模型旋转查看细节</p>
          </div>
          <button className="lab-exit" onClick={onExit} aria-label="返回整车主视觉">↩ 返回整车</button>
        </div>

        <div className="lab-list" role="list" aria-label="概念车总成列表">
          {LAB_PARTS.map((item, index) => (
            <button
              key={item.id}
              className={activeId === item.id ? 'lab-item active' : 'lab-item'}
              onClick={() => onSelect(item.id)}
              aria-pressed={activeId === item.id}
            >
              <span className="lab-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="lab-item-body">
                <b>{item.label}</b>
                <i>{item.en}</i>
              </span>
            </button>
          ))}
        </div>

        <div className="lab-detail">
          <p className="lab-kicker">{part.en}</p>
          <h2>{part.label}</h2>
          <p>{part.description}</p>
        </div>
      </aside>
    </div>
  );
}

