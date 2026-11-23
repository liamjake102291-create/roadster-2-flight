import { useRef } from 'react';
import Vehicle from '../../scene/Vehicle';

export default function CarExploded() {
  const progress = useRef(0.69);
  return <group position={[0, -0.48, 0]}><Vehicle progressRef={progress} /></group>;
}
