import { useCallback, useEffect, useRef, useState } from "react";
import type { PanConfig } from "../types";

export interface PanState {
  /** Index data point pertama yang terlihat. */
  xStart: number;
  /** Jumlah point yang terlihat di x. */
  windowSize: number;
  /** Pergeseran y dari yMin (unit data). */
  yOffset: number;
}

export interface UsePanParams {
  dataLength: number;
  pan: PanConfig | undefined;
  yMin: number;
  yMax: number;
}

export interface UsePanResult {
  state: PanState;
  panning: boolean;
  /** Apakah pan x aktif. */
  panX: boolean;
  /** Apakah pan y aktif (butuh `yWindowSize`). */
  panY: boolean;
  /** True bila salah satu atau keduanya aktif. */
  panAny: boolean;
  /** Tinggi viewport y (unit data). */
  yWindow: number;
  /** Nilai windowSize awal — untuk reset. */
  xWindowInitial: number;
  /** Handler dipasang ke wrapper element. */
  handlers: {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e?: React.PointerEvent<HTMLDivElement>) => void;
    onWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
  };
  /** Ref untuk wrapper element supaya bisa mengukur lebar/tinggi saat drag. */
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  /** Reset ke state awal. */
  reset: () => void;
  /** True bila state berbeda dari default — untuk menampilkan tombol reset. */
  isDirty: boolean;
}

/**
 * Custom hook: state + pointer & wheel handlers untuk pan/zoom chart.
 *
 * - `pan.x`: drag horizontal menggeser `xStart`.
 * - `pan.y` + `pan.yWindowSize`: drag vertikal menggeser `yOffset` dalam batas
 *   `[0, yMax - yMin - yWindow]`.
 * - `pan.wheelZoom`: scroll wheel mengubah `windowSize` (Shift = pass-through).
 */
export function usePan({ dataLength, pan, yMin, yMax }: UsePanParams): UsePanResult {
  const panX = !!pan?.x;
  const panY = !!pan?.y && pan?.yWindowSize !== undefined;
  const panAny = panX || panY;

  const yWindow = pan?.yWindowSize ?? yMax - yMin;
  const xWindowInitial = Math.min(pan?.windowSize ?? dataLength, dataLength);

  const [state, setState] = useState<PanState>({
    xStart: 0,
    windowSize: xWindowInitial,
    yOffset: 0,
  });
  const [panning, setPanning] = useState(false);

  // Re-clamp saat dataset / batas berubah.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((prev) => ({
      ...prev,
      windowSize: Math.min(prev.windowSize, Math.max(dataLength, 1)),
      xStart: Math.max(0, Math.min(prev.xStart, dataLength - prev.windowSize)),
      yOffset: Math.max(0, Math.min(prev.yOffset, Math.max(0, yMax - yMin - yWindow))),
    }));
  }, [dataLength, yMax, yMin, yWindow]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initXStart: number;
    initYOffset: number;
    width: number;
    height: number;
  } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!panAny) return;
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      try {
        (e.target as Element).setPointerCapture?.(e.pointerId);
      } catch {
        /* noop */
      }
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initXStart: state.xStart,
        initYOffset: state.yOffset,
        width: rect.width,
        height: rect.height,
      };
      setPanning(true);
    },
    [panAny, state.xStart, state.yOffset]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;

      let nextXStart = state.xStart;
      let nextYOffset = state.yOffset;

      if (panX && state.windowSize > 0 && drag.width > 0) {
        const dx = e.clientX - drag.startX;
        const xPxPerPoint = drag.width / state.windowSize;
        const deltaPoints = Math.round(-dx / xPxPerPoint);
        const maxStart = Math.max(0, dataLength - state.windowSize);
        nextXStart = Math.max(0, Math.min(maxStart, drag.initXStart + deltaPoints));
      }
      if (panY && yWindow > 0 && drag.height > 0) {
        const dy = e.clientY - drag.startY;
        const yUnitsPerPx = yWindow / drag.height;
        const deltaUnits = dy * yUnitsPerPx;
        const maxOffset = Math.max(0, yMax - yMin - yWindow);
        nextYOffset = Math.max(0, Math.min(maxOffset, drag.initYOffset + deltaUnits));
      }
      if (nextXStart !== state.xStart || nextYOffset !== state.yOffset) {
        setState((s) => ({ ...s, xStart: nextXStart, yOffset: nextYOffset }));
      }
    },
    [dataLength, panX, panY, state.windowSize, state.xStart, state.yOffset, yMax, yMin, yWindow]
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    setPanning(false);
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!pan?.wheelZoom || !panX) return;
      if (e.shiftKey) return;
      e.preventDefault();
      const dir = e.deltaY > 0 ? 1 : -1;
      const step = Math.max(1, Math.round(state.windowSize * 0.1));
      const next = Math.max(3, Math.min(dataLength, state.windowSize + dir * step));
      const maxStart = Math.max(0, dataLength - next);
      setState((s) => ({
        ...s,
        windowSize: next,
        xStart: Math.min(s.xStart, maxStart),
      }));
    },
    [dataLength, pan?.wheelZoom, panX, state.windowSize]
  );

  const reset = useCallback(() => {
    setState({ xStart: 0, windowSize: xWindowInitial, yOffset: 0 });
  }, [xWindowInitial]);

  const isDirty =
    state.xStart > 0 || state.yOffset > 0 || state.windowSize !== xWindowInitial;

  return {
    state,
    panning,
    panX,
    panY,
    panAny,
    yWindow,
    xWindowInitial,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onWheel },
    wrapperRef,
    reset,
    isDirty,
  };
}
