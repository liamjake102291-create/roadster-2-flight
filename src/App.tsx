import { Component, Suspense, memo, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Scene from './scene/Scene';
import StoryOverlay from './components/StoryOverlay';
import ExplosionUI from './components/ExplosionUI';
import PartsLab from './lab/PartsLab';
import { useNarrativeProgress } from './scroll/useNarrativeProgress';
import type { NarrativeProps, ViewMode } from './types';
import type { RootState } from '@react-three/fiber';
import { clamp01, inspectionVisible } from './scroll/math';
import { nextPlaybackTime } from './scroll/playback';

import { playbackProgress, playbackSeconds } from './scene/launchTimeline';

const INTERFACE_INTERVAL = 1000 / 20;
const REPLAY_POINT = 0.9995;

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <SceneFallback failed /> : this.props.children;
  }
}

function SceneFallback({ failed = false }: { failed?: boolean }) {
  return (
    <div className="scene-fallback">
      <img src={import.meta.env.BASE_URL + 'roadster-poster.jpg'} alt="白色 Roadster 2 飞行概念车" />
      <p role="status">{failed ? '3D 场景加载失败，请检查 WebGL 后刷新页面。' : '正在加载 3D 车辆'}</p>
    </div>
  );
}

interface CanvasProps extends NarrativeProps {
  mobile: boolean;
  visible: boolean;
  mode: ViewMode;
  selectedId: string;
  onSelect: (id: string) => void;
  onReady: () => void;
  onCreated: (state: RootState) => void;
}

const FlightCanvas = memo(function FlightCanvas({ mobile, visible, onCreated, ...scene }: CanvasProps) {
  return (
    <SceneBoundary>
      <Canvas
        dpr={[0.8, mobile ? 1 : 1.25]}
        camera={{ position: [5.1, 1.78, -6.75], fov: 36, near: 0.045, far: 110 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        frameloop={visible ? 'demand' : 'never'}
        fallback={<SceneFallback failed />}
        onCreated={onCreated}
        role="img"
        aria-label="Roadster 2 实时三维演示。沿时间轴查看坡道发射、空中拆解、复装及降落。"
      >
        <Suspense fallback={null}>
          <Scene {...scene} mobile={mobile} />
        </Suspense>
      </Canvas>
    </SceneBoundary>
  );
});

function Experience({ onOpenLab }: { onOpenLab: () => void }) {
  const narrativeRef = useRef<HTMLElement>(null);
  const { progress, progressRef, reducedMotion, update, syncScroll } = useNarrativeProgress(narrativeRef);
  const [selectedId, setSelectedId] = useState('body');
  const [mode, setMode] = useState<ViewMode>('surface');
  const [playing, setPlaying] = useState(false);
  const running = useRef(false);
  const invalidate = useRef<(() => void) | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const interaction = useRef(false);
  const onReady = useCallback(() => setSceneReady(true), []);
  const configureRenderer = useCallback(({ gl, invalidate: render }: RootState) => {
    invalidate.current = render;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.08;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, []);
  const [mobile, setMobile] = useState(() => window.innerWidth <= 760);
  const [visible, setVisible] = useState(!document.hidden);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const resize = () => setMobile(media.matches);
    const visibility = () => setVisible(!document.hidden);
    media.addEventListener('change', resize);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      media.removeEventListener('change', resize);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  const setPlayState = useCallback((value: boolean) => {
    running.current = value;
    setPlaying(value);
  }, []);

  useEffect(() => {
    if (visible) invalidate.current?.();
  }, [visible]);

  const seek = (target: number) => {
    interaction.current = true;
    setPlayState(false);
    update(target);
    syncScroll();
    invalidate.current?.();
  };

  useEffect(() => {
    const fromScroll = () => {
      const element = narrativeRef.current;
      if (!element) return;
      const range = Math.max(1, element.offsetHeight - window.innerHeight);
      const value = clamp01((window.scrollY - element.offsetTop) / range);
      if (Math.abs(value - progressRef.current) <= 1 / range) return;
      interaction.current = true;
      setPlayState(false);
      update(value);
      invalidate.current?.();
    };
    window.addEventListener('scroll', fromScroll, { passive: true });
    const onResize = () => { if (!running.current) syncScroll(); };
    window.addEventListener('resize', onResize);
    fromScroll();
    return () => {
      window.removeEventListener('scroll', fromScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [progressRef, setPlayState, syncScroll, update]);

  useEffect(() => {
    if (!sceneReady || interaction.current) return;
    interaction.current = true;
    if (progressRef.current <= 0.001 && !reducedMotion) setPlayState(true);
  }, [progressRef, reducedMotion, sceneReady, setPlayState]);

  useEffect(() => {
    if (!playing || !visible || !sceneReady) return;
    const end = playbackSeconds(1);
    let time = playbackSeconds(progressRef.current);
    let previous: number | undefined;
    let lastPublish = -Infinity;
    let frame = 0;
    const interrupt = () => {
      if (!running.current) return;
      setPlayState(false);
      update(progressRef.current);
      syncScroll();
    };
    const step = (now: number) => {
      if (!running.current) return;
      time = nextPlaybackTime(time, previous === undefined ? 0 : (now - previous) / 1000, end);
      previous = now;
      const finished = time >= end;
      const publish = finished || now - lastPublish >= INTERFACE_INTERVAL;
      update(finished ? 1 : playbackProgress(time), publish);
      if (publish) lastPublish = now;
      invalidate.current?.();
      if (finished) {
        setPlayState(false);
        syncScroll();
      } else {
        frame = requestAnimationFrame(step);
      }
    };
    const fromControl = (target: EventTarget | null) => target instanceof Element && target.closest('button, input, select, .assembly-index, .assembly-detail');
    const interruptOnGesture = (event: Event) => {
      if (!fromControl(event.target)) interrupt();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (!fromControl(event.target) && ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) interrupt();
    };
    frame = requestAnimationFrame(step);
    window.addEventListener('wheel', interruptOnGesture, { passive: true });
    window.addEventListener('touchstart', interruptOnGesture, { passive: true });
    window.addEventListener('keydown', handleKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('wheel', interruptOnGesture);
      window.removeEventListener('touchstart', interruptOnGesture);
      window.removeEventListener('keydown', handleKey);
    };
  }, [playing, progressRef, sceneReady, setPlayState, syncScroll, update, visible]);

  const changeMode = (next: ViewMode) => {
    interaction.current = true;
    setPlayState(false);
    update(progressRef.current);
    syncScroll();
    setMode(next);
    if (next === 'xray' && !inspectionVisible(progressRef.current)) setSelectedId('battery');
  };

  const play = () => {
    interaction.current = true;
    if (running.current) {
      setPlayState(false);
      update(progressRef.current);
      syncScroll();
      return;
    }
    setMode('surface');
    if (progressRef.current >= REPLAY_POINT) {
      update(0);
      syncScroll();
    }
    setPlayState(true);
  };

  return (
    <main ref={narrativeRef} className="narrative" id="experience">
      <div className="canvas-shell" data-mode={mode} data-inspection={mode === 'xray' || inspectionVisible(progress)}>
        <FlightCanvas progressRef={progressRef} reducedMotion={reducedMotion} mobile={mobile} visible={visible}
          mode={mode} selectedId={selectedId} onSelect={setSelectedId} onReady={onReady} onCreated={configureRenderer} />
        {!sceneReady && <div className="scene-loading" role="status">正在加载 3D 场景…</div>}
      </div>
      <StoryOverlay progress={progress} playing={playing} mode={mode} onMode={changeMode}
        onSeek={seek} onPlay={play} onOpenLab={onOpenLab} />
      <ExplosionUI progress={progress} selectedId={selectedId} onSelect={setSelectedId} mode={mode} />
    </main>
  );
}

export default function App() {
  const [lab, setLab] = useState(() => window.location.hash === '#lab');
  const [activePart, setActivePart] = useState('car-exploded');
  useEffect(() => {
    const onHash = () => setLab(window.location.hash === '#lab');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (open: boolean) => {
    window.scrollTo(0, 0);
    window.location.hash = open ? 'lab' : '';
    setLab(open);
  };

  if (lab) return <PartsLab activeId={activePart} onSelect={setActivePart} onExit={() => navigate(false)} />;
  return <Experience onOpenLab={() => navigate(true)} />;
}

