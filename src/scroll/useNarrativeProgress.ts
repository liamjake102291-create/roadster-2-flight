import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { clamp01 } from './math';

export function useNarrativeProgress(narrativeRef: RefObject<HTMLElement>) {
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const update = useCallback((value: number, publish = true) => {
    progressRef.current = clamp01(value);
    if (publish) setProgress(progressRef.current);
  }, []);

  const syncScroll = useCallback(() => {
    const element = narrativeRef.current;
    if (!element) return;
    const range = Math.max(1, element.offsetHeight - window.innerHeight);
    window.scrollTo(0, element.offsetTop + range * progressRef.current);
  }, [narrativeRef]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReducedMotion(media.matches);
    media.addEventListener('change', motion);
    return () => media.removeEventListener('change', motion);
  }, []);

  return { progress, progressRef, reducedMotion, update, syncScroll };
}
