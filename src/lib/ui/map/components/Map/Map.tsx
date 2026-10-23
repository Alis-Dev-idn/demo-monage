import React, { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapKit } from "../../core/MapKit";
import { MapContext } from "./MapContext";

export interface MapProps {
  center?: [number, number];
  zoom?: number;
  styleUrl?: string;
  className?: string;
  children?: React.ReactNode;
  onError?: (error: unknown) => void;
  errorFallback?: React.ReactNode;
}

export const Map: React.FC<MapProps> = ({
  center,
  zoom,
  styleUrl,
  className = "",
  children,
  onError,
  errorFallback,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [initError, setInitError] = useState<unknown>(null);
  const config = MapKit.getConfig();

  useEffect(() => {
    if (!mapContainer.current) return;

    let mapInstance: maplibregl.Map | null = null;
    try {
      mapInstance = new maplibregl.Map({
        container: mapContainer.current,
        style: styleUrl || config.styleUrl || "https://demotiles.maplibre.org/style.json",
        center: center || config.defaultCenter,
        zoom: zoom || config.defaultZoom,
      });

      mapInstance.on("load", () => {
        setMap(mapInstance);
      });

      mapInstance.on("error", (e: { error?: unknown }) => {
        // MapLibre's "error" event is non-fatal but worth surfacing
        if (onError) onError(e?.error ?? e);
      });
    } catch (err) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInitError(err);
      if (onError) onError(err);
    }

    return () => {
      mapInstance?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center/zoom if changed from props
  useEffect(() => {
    if (map && center) {
      map.setCenter(center);
    }
  }, [center, map]);

  useEffect(() => {
    if (map && zoom !== undefined) {
      map.setZoom(zoom);
    }
  }, [zoom, map]);

  // React to styleUrl changes
  useEffect(() => {
    if (map && styleUrl) {
      try {
        map.setStyle(styleUrl);
      } catch (err) {
        if (onError) onError(err);
      }
    }
  }, [styleUrl, map, onError]);

  if (initError) {
    return (
      <div className={`relative w-full h-full min-h-100 overflow-hidden ${className}`}>
        {errorFallback ?? (
          <div style={{ padding: 16, color: "#dc2626" }}>Failed to initialize map.</div>
        )}
      </div>
    );
  }

  return (
    <div ref={mapContainer} className={`relative w-full h-full min-h-100 overflow-hidden ${className}`}>
      <MapContext.Provider value={{ map }}>
        {map && children}
      </MapContext.Provider>
    </div>
  );
};
