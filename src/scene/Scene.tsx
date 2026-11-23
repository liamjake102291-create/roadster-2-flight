import { useEffect, useMemo, useRef } from 'react';
import { Environment, Lightformer } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import type { DirectionalLight, HemisphereLight, PointLight, SpotLight } from 'three';
import CarRig from './CarRig';
import CameraRig from './CameraRig';
import GroundShadow from './Effects';
import JetPlumes from './JetPlumes';
import LaunchStage from './LaunchStage';
import LaunchRamp from './LaunchRamp';
import PrelaunchEffects, { setLaunchLights } from './PrelaunchEffects';
import { montage } from './launchTimeline';
import type { NarrativeProps, ViewMode } from '../types';

interface SceneProps extends NarrativeProps {
  selectedId: string;
  onSelect: (id: string) => void;
  onReady: () => void;
  mobile: boolean;
  mode: ViewMode;
}

function RenderResolution({ mobile, software }: { mobile: boolean; software: boolean }) {
  const { width, height } = useThree((state) => state.size);
  const setDpr = useThree((state) => state.setDpr);
  useEffect(() => {
    const budget = software ? 180_000 : mobile ? 950_000 : 2_500_000;
    const cap = mobile ? 1 : 1.25;
    setDpr(Math.max(software ? 0.33 : 0.65, Math.min(window.devicePixelRatio || 1, cap, Math.sqrt(budget / Math.max(1, width * height)))));
  }, [width, height, mobile, software, setDpr]);
  return null;
}

export default function Scene(props: SceneProps) {
  const { onReady } = props;
  const gl = useThree((state) => state.gl);
  const software = useMemo(() => {
    const context = gl.getContext();
    const info = context.getExtension('WEBGL_debug_renderer_info');
    return info !== null && /swiftshader|llvmpipe|software/i.test(String(context.getParameter(info.UNMASKED_RENDERER_WEBGL)));
  }, [gl]);
  const key = useRef<DirectionalLight>(null);
  const fill = useRef<HemisphereLight>(null);
  const rampKey = useRef<PointLight>(null);
  const back = useRef<SpotLight>(null);
  const edge = useRef<SpotLight>(null);
  const cabin = useRef<PointLight>(null);
  const cinematic = props.mode === 'surface';
  useEffect(() => { onReady(); }, [onReady]);
  useFrame(({ scene }) => {
    const p = props.progressRef.current;
    if (key.current && fill.current && rampKey.current) {
      setLaunchLights(p, cinematic, scene, key.current, fill.current, rampKey.current);
    }
    const dark = cinematic && p < montage.overhead;
    if (back.current) back.current.intensity = dark ? 0 : 47;
    if (edge.current) edge.current.intensity = dark ? 0 : 30;
    if (cabin.current) cabin.current.intensity = cinematic && p < montage.flow ? 0.42 + p * 33 : 0;
  }, -3);

  return (
    <>
      <RenderResolution mobile={props.mobile} software={software} />
      <color attach="background" args={['#080a0e']} />
      <fog attach="fog" args={['#080a0e', 19, 56]} />
      <hemisphereLight ref={fill} color="#dde8f1" groundColor="#4c4e59" intensity={0.63} />
      <directionalLight ref={key} position={[3, 6, -3]} color="#fff5e7" intensity={1.48} />
      <spotLight ref={back} position={[-4.5, 3, 4]} color="#b9d5f1" intensity={47} angle={0.56} penumbra={0.78} distance={16} />
      <spotLight ref={edge} position={[4, 4.1, 2]} color="#ededff" intensity={30} angle={0.51} penumbra={0.93} distance={16} />
      <pointLight ref={rampKey} position={[0, 8, -5.5]} color="#c3d9ee" intensity={0} distance={32} decay={2} />
      <pointLight ref={cabin} position={[0, 0.8, 0.37]} color="#c3d4f2" intensity={0} distance={2.1} />
      <Environment resolution={128}>
        <Lightformer intensity={3.1} color="#f9f3ff" scale={[7, 2.1, 1]} position={[0, 4, -1]} rotation={[Math.PI / 2, 0, 0]} />
        <Lightformer intensity={2.5} color="#bad8ff" scale={[7, 1.15, 1]} position={[4.5, 1.7, 0]} rotation={[0, -Math.PI / 2, Math.PI / 2]} />
        <Lightformer intensity={1.9} color="#e9f3ff" scale={[5, 0.8, 1]} position={[-4.2, 1.35, 0]} rotation={[0, Math.PI / 2, Math.PI / 2]} />
        <Lightformer intensity={1} color="#ffd1a5" scale={[4, 0.42, 1]} position={[0, 2, 4.2]} />
      </Environment>
      <LaunchStage progressRef={props.progressRef} cinematic={cinematic} />
      <LaunchRamp progressRef={props.progressRef} cinematic={cinematic} />
      <GroundShadow progressRef={props.progressRef} mobile={props.mobile} />
      <JetPlumes progressRef={props.progressRef} reducedMotion={props.reducedMotion} mobile={props.mobile} />
      <PrelaunchEffects progressRef={props.progressRef} enabled={cinematic} />
      <CarRig {...props} software={software} />
      <CameraRig {...props} />
      {!props.mobile && !software && <EffectComposer multisampling={0}>
        <Bloom intensity={0.34} luminanceThreshold={1.05} luminanceSmoothing={0.60} mipmapBlur levels={4} />
      </EffectComposer>}
    </>
  );
}
