import React, { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { createRoot, type Root } from "react-dom/client";
import { useMapContext } from "../Map/MapContext";

export interface MarkerProps {
  lng: number;
  lat: number;
  children?: React.ReactNode;
  draggable?: boolean;
  onDragEnd?: (coords: { lng: number; lat: number }) => void;
  className?: string;
}

export const Marker: React.FC<MarkerProps> = ({
  lng,
  lat,
  children,
  draggable,
  onDragEnd,
  className = "",
}) => {
  const { map } = useMapContext();
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const elementRef = useRef<HTMLDivElement>(document.createElement("div"));
  const rootRef = useRef<Root | null>(null);

  useEffect(() => {
    if (!map) return;

    const marker = new maplibregl.Marker({
      element: elementRef.current,
      draggable: draggable,
    })
      .setLngLat([lng, lat])
      .addTo(map);

    if (draggable) {
      marker.on("dragend", () => {
        const newCoords = marker.getLngLat();
        onDragEnd?.({ lng: newCoords.lng, lat: newCoords.lat });
      });
    }

    markerRef.current = marker;

    return () => {
      marker.remove();
      if (rootRef.current) {
        rootRef.current.unmount();
        rootRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    }
  }, [lng, lat]);

  useEffect(() => {
    if (children == null || children === false) {
      if (rootRef.current) {
        rootRef.current.unmount();
        rootRef.current = null;
      }
      // Also clear DOM contents
      while (elementRef.current.firstChild) {
        elementRef.current.removeChild(elementRef.current.firstChild);
      }
      return;
    }
    if (!rootRef.current) {
      rootRef.current = createRoot(elementRef.current);
    }
    rootRef.current.render(<div className={className}>{children}</div>);
  }, [children, className]);

  return null;
};
