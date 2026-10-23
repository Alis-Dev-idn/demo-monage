import { useState, useEffect, useCallback, useRef } from "react";

export interface RealtimeLocationOptions {
  enabled?: boolean;
  stream?: {
    subscribe: (push: (coords: { lng: number; lat: number }) => void) => () => void;
  };
  smooth?: boolean;
  duration?: number;
}

export function useRealtimeLocation(options: RealtimeLocationOptions = {}) {
  const [position, setPosition] = useState<{ lng: number; lat: number }>({ lng: 0, lat: 0 });
  const [displayPosition, setDisplayPosition] = useState<{ lng: number; lat: number }>({ lng: 0, lat: 0 });
  const animRef = useRef<number>(undefined);
  const startTimeRef = useRef<number>(0);
  const startPosRef = useRef<{ lng: number; lat: number }>({ lng: 0, lat: 0 });
  const targetPosRef = useRef<{ lng: number; lat: number }>({ lng: 0, lat: 0 });

  const { enabled, stream, smooth = true, duration = 1000 } = options;

  const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

  // `animate` calls itself recursively via requestAnimationFrame — kept behind
  // a ref (rather than a self-referencing `useCallback`) so the recursive call
  // always reaches the latest closure without the "access variable before
  // declared" hazard of a function referencing its own `const` binding.
  const animateRef = useRef<(time: number) => void>(() => {});
  useEffect(() => {
    animateRef.current = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      const progress = Math.min((time - startTimeRef.current) / duration, 1);

      const nextLng = lerp(startPosRef.current.lng, targetPosRef.current.lng, progress);
      const nextLat = lerp(startPosRef.current.lat, targetPosRef.current.lat, progress);

      setDisplayPosition({ lng: nextLng, lat: nextLat });

      if (progress < 1) {
        animRef.current = requestAnimationFrame((t) => animateRef.current(t));
      }
    };
  }, [duration]);

  const updatePosition = useCallback((newCoords: { lng: number; lat: number }) => {
    setPosition(newCoords);

    if (smooth) {
      startPosRef.current = { ...displayPosition };
      targetPosRef.current = { ...newCoords };
      startTimeRef.current = 0;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame((t) => animateRef.current(t));
    } else {
      setDisplayPosition(newCoords);
    }
  }, [smooth, displayPosition]);

  useEffect(() => {
    if (!enabled || !stream) return;

    const unsubscribe = stream.subscribe(updatePosition);

    return () => {
      unsubscribe();
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [enabled, stream, updatePosition]);

  return {
    position: displayPosition,
    rawPosition: position,
  };
}
